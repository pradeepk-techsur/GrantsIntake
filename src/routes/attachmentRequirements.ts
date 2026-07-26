import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { attachmentRequirementService } from '../services/eligibility/attachmentRequirementService';

export const attachmentRequirementsRouter = Router();

// ─── Validation schemas ────────────────────────────────────────────────────────

const createAttachmentRequirementSchema = z.object({
  document_type: z.string().min(1).max(100),
  custom_document_name: z.string().max(250).optional(),
  applicant_type_scope: z.array(z.string()).optional().default([]),
  stage_scope: z.enum(['pre_application', 'loi', 'full_application']),
  is_required: z.boolean().optional().default(true),
  instructions: z.string().optional(),
  // T-02-11: max 20 entries, each extension ≤ 10 chars
  file_format_restrictions: z.array(z.string().max(10)).max(20).optional(),
  max_file_size_mb: z.number().int().min(1).max(500).optional().default(50),
});

const updateAttachmentRequirementSchema = z.object({
  document_type: z.string().min(1).max(100).optional(),
  custom_document_name: z.string().max(250).optional(),
  applicant_type_scope: z.array(z.string()).optional(),
  stage_scope: z.enum(['pre_application', 'loi', 'full_application']).optional(),
  is_required: z.boolean().optional(),
  instructions: z.string().optional(),
  file_format_restrictions: z.array(z.string().max(10)).max(20).optional(),
  max_file_size_mb: z.number().int().min(1).max(500).optional(),
});

// ─── GET /api/v1/opportunities/:opportunity_id/attachment-requirements ─────────

attachmentRequirementsRouter.get(
  '/opportunities/:opportunity_id/attachment-requirements',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { opportunity_id } = req.params;

    try {
      const requirements = await attachmentRequirementService.list(opportunity_id);
      res.status(200).json(requirements);
    } catch (err: unknown) {
      console.error('GET /opportunities/:id/attachment-requirements error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch attachment requirements' });
    }
  },
);

// ─── POST /api/v1/opportunities/:opportunity_id/attachment-requirements ────────

attachmentRequirementsRouter.post(
  '/opportunities/:opportunity_id/attachment-requirements',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    const { opportunity_id } = req.params;

    const parsed = createAttachmentRequirementSchema.safeParse(req.body);
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
      const requirement = await attachmentRequirementService.create(
        opportunity_id,
        parsed.data,
        req.user!.user_id,
      );
      res.status(201).json(requirement);
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      if (error.code === 'INVALID_STAGE_SCOPE') {
        res.status(400).json({ error: 'INVALID_STAGE_SCOPE', message: error.message });
        return;
      }
      if (error.code === 'INVALID_MAX_FILE_SIZE') {
        res.status(400).json({ error: 'INVALID_MAX_FILE_SIZE', message: error.message });
        return;
      }
      if (error.code === 'VALIDATION_ERROR') {
        res.status(422).json({ error: 'VALIDATION_ERROR', message: error.message });
        return;
      }
      console.error('POST /opportunities/:id/attachment-requirements error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create attachment requirement' });
    }
  },
);

// ─── PUT /api/v1/attachment-requirements/:requirement_id ──────────────────────

attachmentRequirementsRouter.put(
  '/attachment-requirements/:requirement_id',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    const { requirement_id } = req.params;

    const parsed = updateAttachmentRequirementSchema.safeParse(req.body);
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
      const requirement = await attachmentRequirementService.update(
        requirement_id,
        parsed.data,
        req.user!.user_id,
      );
      res.status(200).json(requirement);
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      if (error.code === 'NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND', message: error.message });
        return;
      }
      if (error.code === 'INVALID_STAGE_SCOPE') {
        res.status(400).json({ error: 'INVALID_STAGE_SCOPE', message: error.message });
        return;
      }
      console.error('PUT /attachment-requirements/:id error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to update attachment requirement' });
    }
  },
);

// ─── DELETE /api/v1/attachment-requirements/:requirement_id ───────────────────

attachmentRequirementsRouter.delete(
  '/attachment-requirements/:requirement_id',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    const { requirement_id } = req.params;

    try {
      await attachmentRequirementService.delete(requirement_id);
      res.status(204).send();
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      if (error.code === 'NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND', message: error.message });
        return;
      }
      console.error('DELETE /attachment-requirements/:id error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to delete attachment requirement' });
    }
  },
);
