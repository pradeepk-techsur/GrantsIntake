import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { screeningCriteriaService } from '../services/eligibility/screeningCriteriaService';

export const screeningCriteriaRouter = Router();

// ─── Validation schemas ────────────────────────────────────────────────────────

const AUTO_CRITERION_KEYS = [
  'deadline_check',
  'completeness_check',
  'eligibility_check',
  'attachment_check',
  'duplicate_check',
] as const;

const createScreeningCriterionSchema = z.object({
  criterion_text: z.string().min(1).max(500),
  criterion_type: z.enum(['auto', 'manual']),
  auto_criterion_key: z.enum(AUTO_CRITERION_KEYS).optional(),
  is_required: z.boolean().optional().default(true),
  suggested_disposition_on_failure: z.string().max(50).optional(),
  display_order: z.number().int().min(0).optional().default(0),
});

const updateScreeningCriterionSchema = z.object({
  criterion_text: z.string().min(1).max(500).optional(),
  is_required: z.boolean().optional(),
  suggested_disposition_on_failure: z.string().max(50).optional(),
  display_order: z.number().int().min(0).optional(),
});

// ─── GET /api/v1/opportunities/:opportunity_id/screening-criteria ──────────────

screeningCriteriaRouter.get(
  '/opportunities/:opportunity_id/screening-criteria',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { opportunity_id } = req.params;

    try {
      const criteria = await screeningCriteriaService.list(opportunity_id);
      res.status(200).json(criteria);
    } catch (err: unknown) {
      console.error('GET /opportunities/:id/screening-criteria error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch screening criteria' });
    }
  },
);

// ─── POST /api/v1/opportunities/:opportunity_id/screening-criteria ─────────────

screeningCriteriaRouter.post(
  '/opportunities/:opportunity_id/screening-criteria',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    const { opportunity_id } = req.params;

    const parsed = createScreeningCriterionSchema.safeParse(req.body);
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
      const criterion = await screeningCriteriaService.create(
        opportunity_id,
        parsed.data,
        req.user!.user_id,
      );
      res.status(201).json(criterion);
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      if (error.code === 'INVALID_AUTO_CRITERION_KEY') {
        res.status(400).json({ error: 'INVALID_AUTO_CRITERION_KEY', message: error.message });
        return;
      }
      console.error('POST /opportunities/:id/screening-criteria error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create screening criterion' });
    }
  },
);

// ─── PUT /api/v1/screening-criteria/:criterion_id ─────────────────────────────

screeningCriteriaRouter.put(
  '/screening-criteria/:criterion_id',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    const { criterion_id } = req.params;

    const parsed = updateScreeningCriterionSchema.safeParse(req.body);
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
      const criterion = await screeningCriteriaService.update(
        criterion_id,
        parsed.data,
        req.user!.user_id,
      );
      res.status(200).json(criterion);
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      if (error.code === 'NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND', message: error.message });
        return;
      }
      console.error('PUT /screening-criteria/:id error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to update screening criterion' });
    }
  },
);

// ─── DELETE /api/v1/screening-criteria/:criterion_id ──────────────────────────

screeningCriteriaRouter.delete(
  '/screening-criteria/:criterion_id',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    const { criterion_id } = req.params;

    try {
      await screeningCriteriaService.delete(criterion_id);
      res.status(204).send();
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      if (error.code === 'AUTO_CRITERION_PROTECTED') {
        // T-02-07: System criteria cannot be deleted
        res.status(403).json({ error: 'AUTO_CRITERION_PROTECTED', message: error.message });
        return;
      }
      if (error.code === 'NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND', message: error.message });
        return;
      }
      console.error('DELETE /screening-criteria/:id error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to delete screening criterion' });
    }
  },
);
