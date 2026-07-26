import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { prescreeningService } from '../services/eligibility/prescreeningService';
import { pool } from '../db/client';
import { getGrantorOrgIdForUser } from '../services/program/programService';

export const prescreeningRouter = Router();

// ─── Validation schemas ────────────────────────────────────────────────────────

const prescreeningOptionSchema = z.object({
  option_text: z.string().min(1).max(250),
  mapped_rule_id: z.string().uuid().nullable().optional(),
  rule_outcome: z.enum(['met', 'violated', 'advisory']).nullable().optional(),
});

const prescreeningQuestionSchema = z.object({
  question_text: z.string().min(1).max(500),
  question_type: z.enum(['yes_no', 'multiple_choice', 'text']),
  is_required: z.boolean(),
  display_order: z.number().int().min(0),
  conditional_display: z
    .object({
      depends_on_question_id: z.string().uuid(),
      trigger_response_value: z.string().min(1),
    })
    .nullable()
    .optional(),
  // T-02-05: Max 20 options per question
  options: z.array(prescreeningOptionSchema).max(20).optional(),
});

const upsertPrescreeningSchema = z.object({
  placement: z.enum(['pre_workspace', 'pre_submission']),
  // T-02-05: Max 50 questions per questionnaire
  questions: z.array(prescreeningQuestionSchema).max(50),
});

// ─── Helper: verify opportunity belongs to user's org ─────────────────────────

async function verifyOpportunityAccess(
  opportunityId: string,
  userId: string,
): Promise<void> {
  const grantorOrgId = await getGrantorOrgIdForUser(userId);

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

// ─── GET /api/v1/opportunities/:opportunity_id/prescreening ──────────────────

prescreeningRouter.get(
  '/opportunities/:opportunity_id/prescreening',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { opportunity_id } = req.params;

    try {
      await verifyOpportunityAccess(opportunity_id, req.user!.user_id);

      const questionnaire = await prescreeningService.get(opportunity_id);
      if (!questionnaire) {
        res.status(200).json(null);
        return;
      }
      res.status(200).json(questionnaire);
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
      console.error('GET /opportunities/:id/prescreening error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch prescreening questionnaire' });
    }
  },
);

// ─── PUT /api/v1/opportunities/:opportunity_id/prescreening ──────────────────

prescreeningRouter.put(
  '/opportunities/:opportunity_id/prescreening',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    const { opportunity_id } = req.params;

    const parsed = upsertPrescreeningSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      // T-02-05: return 422 for validation failures including length limits
      res.status(422).json({
        error: 'VALIDATION_ERROR',
        message: firstError.message,
        field: firstError.path.join('.'),
      });
      return;
    }

    try {
      await verifyOpportunityAccess(opportunity_id, req.user!.user_id);

      const questionnaire = await prescreeningService.upsert(
        opportunity_id,
        parsed.data,
        req.user!.user_id,
      );
      res.status(200).json(questionnaire);
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
      console.error('PUT /opportunities/:id/prescreening error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to save prescreening questionnaire' });
    }
  },
);

// ─── POST /api/v1/opportunities/:opportunity_id/prescreening/preview ─────────

prescreeningRouter.post(
  '/opportunities/:opportunity_id/prescreening/preview',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    const { opportunity_id } = req.params;

    try {
      await verifyOpportunityAccess(opportunity_id, req.user!.user_id);

      const preview = await prescreeningService.preview(opportunity_id);
      if (!preview) {
        res.status(200).json({ opportunity_id, placement: null, questions: [] });
        return;
      }
      res.status(200).json(preview);
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
      console.error('POST /opportunities/:id/prescreening/preview error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to generate prescreening preview' });
    }
  },
);
