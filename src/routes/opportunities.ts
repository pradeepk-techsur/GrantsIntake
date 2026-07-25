import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { opportunityService } from '../services/opportunity/opportunityService';
import { getGrantorOrgIdForUser } from '../services/program/programService';
import { pool } from '../db/client';

export const opportunitiesRouter = Router();

// ─── Validation schemas ────────────────────────────────────────────────────────

const createOpportunitySchema = z.object({
  template_id: z.string().uuid().optional(),
  title: z.string().min(1, 'title is required').max(250, 'title too long'),
  funding_source: z.string().min(1, 'funding_source is required').max(250),
  announcement_type: z.enum(['Initial', 'Modified', 'Continuation', 'Extension', 'Closeout'], {
    errorMap: () => ({
      message: 'announcement_type must be one of: Initial, Modified, Continuation, Extension, Closeout',
    }),
  }),
  opportunity_number: z.string().min(1, 'opportunity_number is required').max(100),
  assistance_listing_number: z.string().max(10).optional(),
  funding_amount_min: z.number().positive().optional(),
  funding_amount_max: z.number().positive({ message: 'funding_amount_max must be positive' }),
  total_program_funding: z.number().positive().optional(),
  expected_awards_min: z.number().int().positive().optional(),
  expected_awards_max: z.number().int().positive().optional(),
  eligibility_summary: z.string().min(1, 'eligibility_summary is required'),
  executive_summary: z.string().min(1, 'executive_summary is required'),
  contact_name: z.string().min(1, 'contact_name is required').max(250),
  contact_email: z.string().email('contact_email must be a valid email address').max(320),
  contact_phone: z.string().max(30).optional(),
  contact_title: z.string().max(250).optional(),
  program_area: z.string().min(1, 'program_area is required').max(100),
  geography: z.object({}).passthrough().optional(),
  application_url: z.string().url().max(2048).optional(),
});

const updateOpportunitySchema = z.object({
  title: z.string().min(1).max(250).optional(),
  funding_source: z.string().min(1).max(250).optional(),
  announcement_type: z.enum(['Initial', 'Modified', 'Continuation', 'Extension', 'Closeout']).optional(),
  opportunity_number: z.string().min(1).max(100).optional(),
  assistance_listing_number: z.string().max(10).nullable().optional(),
  funding_amount_min: z.number().positive().nullable().optional(),
  funding_amount_max: z.number().positive().optional(),
  total_program_funding: z.number().positive().nullable().optional(),
  expected_awards_min: z.number().int().positive().nullable().optional(),
  expected_awards_max: z.number().int().positive().nullable().optional(),
  eligibility_summary: z.string().min(1).optional(),
  executive_summary: z.string().min(1).optional(),
  contact_name: z.string().min(1).max(250).optional(),
  contact_email: z.string().email().max(320).optional(),
  contact_phone: z.string().max(30).nullable().optional(),
  contact_title: z.string().max(250).nullable().optional(),
  program_area: z.string().min(1).max(100).optional(),
  geography: z.object({}).passthrough().nullable().optional(),
  application_url: z.string().url().max(2048).nullable().optional(),
  status: z.enum(['draft', 'published', 'closed', 'archived']).optional(),
});

// ─── Helper: verify opportunity belongs to user's org ─────────────────────────

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

// ─── POST /api/v1/programs/:programId/opportunities ───────────────────────────

opportunitiesRouter.post(
  '/programs/:programId/opportunities',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    const { programId } = req.params;

    const parsed = createOpportunitySchema.safeParse(req.body);
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
      // T-03-01: Verify program belongs to caller's grantor org
      const grantorOrgId = await getGrantorOrgIdForUser(req.user!.user_id);
      const programCheck = await pool.query<{ count: string }>(
        `SELECT COUNT(*) FROM programs WHERE program_id = $1 AND grantor_org_id = $2 AND archived_at IS NULL`,
        [programId, grantorOrgId],
      );
      if (parseInt(programCheck.rows[0].count) === 0) {
        res.status(403).json({ error: 'PERMISSION_DENIED', message: 'Program not found or access denied' });
        return;
      }

      const { template_id, ...data } = parsed.data;

      const opportunity = await opportunityService.create(
        programId,
        template_id ?? null,
        req.user!.user_id,
        data,
      );
      res.status(201).json(opportunity);
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      if (error.code === 'NO_GRANTOR_ORG') {
        res.status(403).json({ error: 'PERMISSION_DENIED', message: 'No grantor organization membership' });
        return;
      }
      if (error.code === 'DUPLICATE_OPPORTUNITY_NUMBER') {
        res.status(409).json({ error: 'DUPLICATE_OPPORTUNITY_NUMBER', message: error.message });
        return;
      }
      if (error.code === 'FUNDING_RANGE_INVALID') {
        res.status(400).json({ error: 'FUNDING_RANGE_INVALID', message: error.message });
        return;
      }
      console.error('POST /programs/:programId/opportunities error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create opportunity' });
    }
  },
);

// ─── GET /api/v1/opportunities/:id ───────────────────────────────────────────

opportunitiesRouter.get(
  '/opportunities/:id',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
      // T-03-05: Verify opportunity's program org matches caller's org
      await verifyOpportunityAccess(id, req.user!.user_id);

      const opportunity = await opportunityService.getById(id);
      res.status(200).json(opportunity);
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
      console.error('GET /opportunities/:id error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch opportunity' });
    }
  },
);

// ─── PATCH /api/v1/opportunities/:id ─────────────────────────────────────────

opportunitiesRouter.patch(
  '/opportunities/:id',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const parsed = updateOpportunitySchema.safeParse(req.body);
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
      // T-03-02: Verify opportunity belongs to caller's org (IDOR protection)
      await verifyOpportunityAccess(id, req.user!.user_id);

      const updated = await opportunityService.update(id, req.user!.user_id, parsed.data);
      res.status(200).json(updated);
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
      if (error.code === 'DUPLICATE_OPPORTUNITY_NUMBER') {
        res.status(409).json({ error: 'DUPLICATE_OPPORTUNITY_NUMBER', message: error.message });
        return;
      }
      if (error.code === 'FUNDING_RANGE_INVALID') {
        res.status(400).json({ error: 'FUNDING_RANGE_INVALID', message: error.message });
        return;
      }
      if (error.code === 'CONTACT_EMAIL_INVALID') {
        res.status(400).json({ error: 'CONTACT_EMAIL_INVALID', message: error.message });
        return;
      }
      if (error.code === 'ASSISTANCE_LISTING_FORMAT_INVALID') {
        res.status(400).json({ error: 'ASSISTANCE_LISTING_FORMAT_INVALID', message: error.message });
        return;
      }
      console.error('PATCH /opportunities/:id error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to update opportunity' });
    }
  },
);

// ─── GET /api/v1/opportunities/:id/versions (stub) ───────────────────────────

opportunitiesRouter.get(
  '/opportunities/:id/versions',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
      // Verify access before returning stub
      await verifyOpportunityAccess(id, req.user!.user_id);
      // Stub — versioning implemented in 01-04
      res.status(200).json([]);
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      if (error.code === 'PERMISSION_DENIED') {
        res.status(403).json({ error: 'PERMISSION_DENIED', message: error.message });
        return;
      }
      if (error.code === 'NO_GRANTOR_ORG') {
        res.status(403).json({ error: 'PERMISSION_DENIED', message: 'No grantor organization membership' });
        return;
      }
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch versions' });
    }
  },
);
