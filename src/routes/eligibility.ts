import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { eligibilityService } from '../services/eligibility/eligibilityService';
import { pool } from '../db/client';
import { getGrantorOrgIdForUser } from '../services/program/programService';

export const eligibilityRouter = Router();

// ─── Validation schemas ────────────────────────────────────────────────────────

const ruleTypeValues = [
  'applicant_type', 'geography', 'entity_status', 'uei_sam',
  'nonprofit_status', 'tribal_status', 'state_local_status',
  'prior_award_status', 'match_requirement', 'custom',
] as const;

const operatorValues = [
  'equals', 'not_equals', 'includes', 'excludes',
  'greater_than', 'less_than', 'is_true', 'is_false',
] as const;

// Validate criterion_value: must be string, string[], or number (T-02-03)
const criterionValueSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.number(),
]);

const createEligibilityRuleSchema = z.object({
  rule_type: z.enum(ruleTypeValues),
  criterion_field: z.string().min(1).max(100),
  operator: z.enum(operatorValues),
  criterion_value: criterionValueSchema,
  severity: z.enum(['hard_blocker', 'advisory']),
  enforcement_point: z.enum(['pre_workspace', 'pre_submission']).optional(),
  explanation_text: z.string().min(1),
  rule_group_id: z.string().uuid().optional(),
  rule_group_operator: z.enum(['AND', 'OR']).optional(),
  display_order: z.number().int().min(0).optional(),
});

const updateEligibilityRuleSchema = z.object({
  rule_type: z.enum(ruleTypeValues).optional(),
  criterion_field: z.string().min(1).max(100).optional(),
  operator: z.enum(operatorValues).optional(),
  criterion_value: criterionValueSchema.optional(),
  severity: z.enum(['hard_blocker', 'advisory']).optional(),
  enforcement_point: z.enum(['pre_workspace', 'pre_submission']).nullable().optional(),
  explanation_text: z.string().min(1).optional(),
  rule_group_id: z.string().uuid().nullable().optional(),
  rule_group_operator: z.enum(['AND', 'OR']).nullable().optional(),
  display_order: z.number().int().min(0).optional(),
});

// ─── Helper: verify opportunity belongs to user's org (T-02-04) ───────────────

async function verifyOpportunityAccess(
  opportunityId: string,
  userId: string,
): Promise<void> {
  const grantorOrgId = await getGrantorOrgIdForUser(userId);

  // First check: does the opportunity exist at all?
  const existsResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM opportunities WHERE opportunity_id = $1`,
    [opportunityId],
  );
  if (parseInt(existsResult.rows[0].count) === 0) {
    const notFound = new Error('Opportunity not found') as Error & { status: number; code: string };
    notFound.status = 404;
    notFound.code = 'NOT_FOUND';
    throw notFound;
  }

  // Second check: does it belong to the user's org?
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM opportunities o
     JOIN programs p ON o.program_id = p.program_id
     WHERE o.opportunity_id = $1 AND p.grantor_org_id = $2`,
    [opportunityId, grantorOrgId],
  );

  if (parseInt(result.rows[0].count) === 0) {
    const err = new Error('Opportunity not found or access denied') as Error & {
      status: number;
      code: string;
    };
    err.status = 403;
    err.code = 'PERMISSION_DENIED';
    throw err;
  }
}

// ─── GET /api/v1/opportunities/:opportunity_id/eligibility-rules ──────────────

eligibilityRouter.get(
  '/opportunities/:opportunity_id/eligibility-rules',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { opportunity_id } = req.params;

    try {
      // T-02-04: Verify caller has grantor membership on this opportunity
      await verifyOpportunityAccess(opportunity_id, req.user!.user_id);

      const rules = await eligibilityService.list(opportunity_id);
      res.status(200).json(rules);
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      if (error.code === 'NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Opportunity not found' });
        return;
      }
      if (error.code === 'PERMISSION_DENIED') {
        res.status(403).json({ error: 'PERMISSION_DENIED', message: error.message });
        return;
      }
      if (error.code === 'NO_GRANTOR_ORG') {
        res.status(403).json({ error: 'PERMISSION_DENIED', message: 'No grantor organization membership' });
        return;
      }
      console.error('GET /opportunities/:id/eligibility-rules error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch eligibility rules' });
    }
  },
);

// ─── POST /api/v1/opportunities/:opportunity_id/eligibility-rules ─────────────

eligibilityRouter.post(
  '/opportunities/:opportunity_id/eligibility-rules',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    const { opportunity_id } = req.params;

    // T-02-03: Validate criterion_value schema before any DB operation
    const parsed = createEligibilityRuleSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      res.status(422).json({
        error: 'VALIDATION_ERROR',
        message: firstError.message,
        field: firstError.path.join('.'),
      });
      return;
    }

    try {
      // T-02-04: Verify caller has access to this opportunity
      await verifyOpportunityAccess(opportunity_id, req.user!.user_id);

      const rule = await eligibilityService.create(
        opportunity_id,
        parsed.data,
        req.user!.user_id,
      );
      res.status(201).json(rule);
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      if (error.code === 'MISSING_ENFORCEMENT_POINT') {
        res.status(400).json({ error: 'MISSING_ENFORCEMENT_POINT', message: error.message });
        return;
      }
      if (error.code === 'NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Opportunity not found' });
        return;
      }
      if (error.code === 'PERMISSION_DENIED') {
        res.status(403).json({ error: 'PERMISSION_DENIED', message: error.message });
        return;
      }
      if (error.code === 'NO_GRANTOR_ORG') {
        res.status(403).json({ error: 'PERMISSION_DENIED', message: 'No grantor organization membership' });
        return;
      }
      console.error('POST /opportunities/:id/eligibility-rules error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create eligibility rule' });
    }
  },
);

// ─── PUT /api/v1/eligibility-rules/:rule_id ───────────────────────────────────

eligibilityRouter.put(
  '/eligibility-rules/:rule_id',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    const { rule_id } = req.params;

    const parsed = updateEligibilityRuleSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      res.status(422).json({
        error: 'VALIDATION_ERROR',
        message: firstError.message,
        field: firstError.path.join('.'),
      });
      return;
    }

    try {
      // T-02-02: IDOR protection handled inside eligibilityService.update
      const rule = await eligibilityService.update(rule_id, parsed.data, req.user!.user_id);
      res.status(200).json(rule);
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      if (error.code === 'NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND', message: error.message });
        return;
      }
      if (error.code === 'MISSING_ENFORCEMENT_POINT') {
        res.status(400).json({ error: 'MISSING_ENFORCEMENT_POINT', message: error.message });
        return;
      }
      console.error('PUT /eligibility-rules/:rule_id error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to update eligibility rule' });
    }
  },
);

// ─── DELETE /api/v1/eligibility-rules/:rule_id ───────────────────────────────

eligibilityRouter.delete(
  '/eligibility-rules/:rule_id',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    const { rule_id } = req.params;

    try {
      await eligibilityService.delete(rule_id, req.user!.user_id);
      res.status(204).send();
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      if (error.code === 'NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND', message: error.message });
        return;
      }
      console.error('DELETE /eligibility-rules/:rule_id error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to delete eligibility rule' });
    }
  },
);
