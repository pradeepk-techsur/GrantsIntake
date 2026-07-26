import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { sectionConditionService } from '../services/eligibility/sectionConditionService';
import { pool } from '../db/client';
import { getGrantorOrgIdForUser } from '../services/program/programService';

export const sectionConditionsRouter = Router();

// ─── Validation schemas ────────────────────────────────────────────────────────

const sectionConditionSchema = z.object({
  condition_type: z.enum(['applicant_type', 'program', 'geography', 'funding_amount', 'eligibility_response']),
  field: z.string().min(1).max(100),
  operator: z.enum(['equals', 'not_equals', 'includes', 'greater_than', 'less_than']),
  value: z.union([z.string(), z.array(z.string()), z.number()]),
});

const upsertSectionConditionSchema = z.object({
  conditions: z.array(sectionConditionSchema).max(20, 'Max 20 conditions per section'),
  condition_group_operator: z.enum(['AND', 'OR']).default('AND'),
});

// ─── Helper: verify opportunity access ────────────────────────────────────────

async function verifyOpportunityAccess(opportunityId: string, userId: string): Promise<void> {
  const grantorOrgId = await getGrantorOrgIdForUser(userId);

  const existsResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM opportunities WHERE opportunity_id = $1`,
    [opportunityId],
  );
  if (parseInt(existsResult.rows[0].count) === 0) {
    const err = new Error('Opportunity not found') as Error & { status: number; code: string };
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

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

// ─── PUT /api/v1/opportunities/:opportunity_id/sections/:section_id/conditions ─

sectionConditionsRouter.put(
  '/opportunities/:opportunity_id/sections/:section_id/conditions',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    const { opportunity_id, section_id } = req.params;

    // T-02-08: Validate conditions array shape and size
    const parsed = upsertSectionConditionSchema.safeParse(req.body);
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
      await verifyOpportunityAccess(opportunity_id, req.user!.user_id);

      const config = await sectionConditionService.upsert(
        opportunity_id,
        section_id,
        parsed.data.conditions,
        parsed.data.condition_group_operator,
        req.user!.user_id,
      );
      res.status(200).json(config);
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      if (error.code === 'NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Opportunity not found' });
        return;
      }
      if (error.code === 'PERMISSION_DENIED' || error.code === 'NO_GRANTOR_ORG') {
        res.status(403).json({ error: 'PERMISSION_DENIED', message: error.message });
        return;
      }
      console.error('PUT /opportunities/:id/sections/:section_id/conditions error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to upsert section conditions' });
    }
  },
);

// ─── GET /api/v1/opportunities/:opportunity_id/sections/conditions ─────────────

sectionConditionsRouter.get(
  '/opportunities/:opportunity_id/sections/conditions',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    const { opportunity_id } = req.params;

    try {
      await verifyOpportunityAccess(opportunity_id, req.user!.user_id);

      const configs = await sectionConditionService.list(opportunity_id);
      res.status(200).json(configs);
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      if (error.code === 'NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Opportunity not found' });
        return;
      }
      if (error.code === 'PERMISSION_DENIED' || error.code === 'NO_GRANTOR_ORG') {
        res.status(403).json({ error: 'PERMISSION_DENIED', message: error.message });
        return;
      }
      console.error('GET /opportunities/:id/sections/conditions error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch section conditions' });
    }
  },
);

// ─── DELETE /api/v1/opportunities/:opportunity_id/sections/:section_key/conditions

sectionConditionsRouter.delete(
  '/opportunities/:opportunity_id/sections/:section_key/conditions',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    const { opportunity_id, section_key } = req.params;

    try {
      await verifyOpportunityAccess(opportunity_id, req.user!.user_id);

      await sectionConditionService.delete(opportunity_id, section_key);
      res.status(204).send();
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      if (error.code === 'NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND', message: error.message });
        return;
      }
      if (error.code === 'PERMISSION_DENIED' || error.code === 'NO_GRANTOR_ORG') {
        res.status(403).json({ error: 'PERMISSION_DENIED', message: error.message });
        return;
      }
      console.error('DELETE /opportunities/:id/sections/:section_key/conditions error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to delete section conditions' });
    }
  },
);
