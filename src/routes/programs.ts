import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import * as programService from '../services/program/programService';

export const programsRouter = Router();

const createProgramSchema = z.object({
  program_name: z.string().min(1, 'program_name is required').max(250, 'program_name too long'),
  program_area: z.string().max(100, 'program_area too long').optional(),
  is_federal: z.boolean().optional(),
  program_description: z.string().optional(),
});

/**
 * GET /api/v1/programs
 * List programs for the authenticated user's grantor organization.
 * Filters to caller's org (T-02-01 IDOR mitigation: org derived from req.user, never from request).
 */
programsRouter.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const grantorOrgId = await programService.getGrantorOrgIdForUser(req.user!.user_id);
    const programs = await programService.list(grantorOrgId);
    res.status(200).json(programs);
  } catch (err: unknown) {
    const error = err as { code?: string; status?: number; message?: string };
    if (error.code === 'NO_GRANTOR_ORG') {
      res.status(403).json({ error: 'PERMISSION_DENIED', message: 'No grantor organization membership' });
      return;
    }
    console.error('GET /programs error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch programs' });
  }
});

/**
 * POST /api/v1/programs
 * Create a new program for the authenticated user's grantor organization.
 * Requires grantor_admin or program_officer role (T-02-02 mitigation).
 * grantor_org_id derived from req.user — never from request body.
 */
programsRouter.post(
  '/',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    const parsed = createProgramSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: firstError.message,
        field: firstError.path[0],
      });
      return;
    }

    try {
      const grantorOrgId = await programService.getGrantorOrgIdForUser(req.user!.user_id);
      const program = await programService.create(grantorOrgId, req.user!.user_id, parsed.data);
      res.status(201).json(program);
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      if (error.code === 'NO_GRANTOR_ORG') {
        res.status(403).json({ error: 'PERMISSION_DENIED', message: 'No grantor organization membership' });
        return;
      }
      console.error('POST /programs error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create program' });
    }
  },
);
