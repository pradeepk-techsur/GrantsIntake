import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { addendaService } from '../services/opportunity/addendaService';

export const addendaRouter = Router();

// ─── Validation schema ─────────────────────────────────────────────────────────

const addendumTypeValues = [
  'date_change',
  'requirement_change',
  'clarification',
  'correction',
  'other',
] as const;

const createAddendumSchema = z.object({
  addendum_type: z.enum(addendumTypeValues, {
    errorMap: () => ({
      message: 'addendum_type must be one of: date_change, requirement_change, clarification, correction, other',
    }),
  }),
  title: z.string().min(1, 'title is required').max(250, 'title too long'),
  body: z.string().min(1, 'body is required'),
  is_required_change: z.boolean().optional(),
});

// ─── GET /api/v1/opportunities/:opportunity_id/addenda ─────────────────────────
/**
 * List addenda for a published opportunity (no auth required — public).
 * Returns addenda in reverse-chronological order (published_at DESC).
 */
addendaRouter.get(
  '/opportunities/:opportunity_id/addenda',
  async (req: Request, res: Response): Promise<void> => {
    const { opportunity_id } = req.params;

    try {
      const addenda = await addendaService.list(opportunity_id);
      res.json(addenda);
    } catch (err) {
      console.error('Addenda list error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch addenda' });
    }
  },
);

// ─── POST /api/v1/opportunities/:opportunity_id/addenda ────────────────────────
/**
 * Create an immutable addendum for a published opportunity.
 * Requires authentication + grantor_admin or program_officer role.
 *
 * Security:
 * - T-02-15: no UPDATE path — addenda are append-only
 * - T-02-16: authenticate + requireRole guard before handler
 */
addendaRouter.post(
  '/opportunities/:opportunity_id/addenda',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    const { opportunity_id } = req.params;
    const userId = req.user!.user_id;

    const parsed = createAddendumSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.issues });
      return;
    }

    try {
      const addendum = await addendaService.create(opportunity_id, parsed.data, userId);
      res.status(201).json(addendum);
    } catch (err: unknown) {
      const e = err as Error & { status?: number; code?: string };
      if (e.status === 404) {
        res.status(404).json({ error: 'NOT_FOUND', message: e.message });
        return;
      }
      if (e.status === 400 && e.code === 'NOT_PUBLISHED') {
        res.status(400).json({ error: 'NOT_PUBLISHED', message: e.message });
        return;
      }
      console.error('Addenda create error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create addendum' });
    }
  },
);

// ─── DELETE /api/v1/opportunities/:opportunity_id/addenda/:addendum_id ─────────
/**
 * DELETE is not allowed — addenda are immutable once published.
 * Returns 405 Method Not Allowed.
 *
 * Security: T-02-15 mitigation.
 */
addendaRouter.delete(
  '/opportunities/:opportunity_id/addenda/:addendum_id',
  (_req: Request, res: Response): void => {
    res.status(405).json({
      error: 'METHOD_NOT_ALLOWED',
      message: 'Addenda are immutable and cannot be deleted',
    });
  },
);
