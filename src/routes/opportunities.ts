import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { opportunityService } from '../services/opportunity/opportunityService';
import { completenessService } from '../services/opportunity/completenessService';
import { versioningService } from '../services/opportunity/versioningService';
import { deadlineService, DeadlineConfig } from '../services/opportunity/deadlineService';
import { getGrantorOrgIdForUser } from '../services/program/programService';
import { pool } from '../db/client';
import { Opportunity } from '../types/opportunity';

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
  // Deadline fields (F4)
  application_open_date: z.string().datetime().nullable().optional(),
  application_close_date: z.string().datetime().nullable().optional(),
  pre_application_deadline: z.string().datetime().nullable().optional(),
  loi_deadline: z.string().datetime().nullable().optional(),
  loi_required: z.boolean().optional(),
  rolling_review_enabled: z.boolean().optional(),
  rolling_review_cadence_days: z.number().int().nullable().optional(),
  deadline_timezone: z.string().max(64).optional(),
  // Post-publication modification reason
  modification_reason: z.string().min(1).optional(),
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

      // Fetch current opportunity to check status
      const current = await opportunityService.getById(id);

      // Post-publication check: modification_reason required
      if (current.status === 'published') {
        const modReason = parsed.data.modification_reason;
        if (!modReason || String(modReason).trim() === '') {
          res.status(400).json({
            error: 'MODIFICATION_REASON_REQUIRED',
            message: 'A modification reason is required when updating a published opportunity',
          });
          return;
        }
      }

      // Validate deadline fields if any deadline fields present in patch
      const deadlineFields = [
        'application_open_date',
        'application_close_date',
        'pre_application_deadline',
        'loi_deadline',
        'loi_required',
        'rolling_review_enabled',
        'rolling_review_cadence_days',
      ];
      const hasDeadlineFields = deadlineFields.some((f) => f in parsed.data);

      if (hasDeadlineFields) {
        // Build effective deadline config (merge patch with current)
        const deadlineConfig: DeadlineConfig = {
          application_open_date:
            parsed.data.application_open_date !== undefined
              ? parsed.data.application_open_date
                ? new Date(parsed.data.application_open_date)
                : null
              : current.application_open_date ?? null,
          application_close_date:
            parsed.data.application_close_date !== undefined
              ? parsed.data.application_close_date
                ? new Date(parsed.data.application_close_date)
                : null
              : current.application_close_date ?? null,
          pre_application_deadline:
            parsed.data.pre_application_deadline !== undefined
              ? parsed.data.pre_application_deadline
                ? new Date(parsed.data.pre_application_deadline)
                : null
              : current.pre_application_deadline ?? null,
          loi_deadline:
            parsed.data.loi_deadline !== undefined
              ? parsed.data.loi_deadline
                ? new Date(parsed.data.loi_deadline)
                : null
              : current.loi_deadline ?? null,
          loi_required:
            parsed.data.loi_required !== undefined ? parsed.data.loi_required : current.loi_required,
          rolling_review_enabled:
            parsed.data.rolling_review_enabled !== undefined
              ? parsed.data.rolling_review_enabled
              : current.rolling_review_enabled,
          rolling_review_cadence_days:
            parsed.data.rolling_review_cadence_days !== undefined
              ? parsed.data.rolling_review_cadence_days
              : current.rolling_review_cadence_days ?? null,
        };

        const deadlineValidation = deadlineService.validate(deadlineConfig);
        if (!deadlineValidation.valid) {
          const firstError = deadlineValidation.errors[0];
          res.status(400).json({
            error: 'DEADLINE_VALIDATION_ERROR',
            message: firstError.message,
            field: firstError.field,
            errors: deadlineValidation.errors,
          });
          return;
        }
      }

      // Remove modification_reason from patch before updating (not a DB column)
      const { modification_reason, ...patchWithoutReason } = parsed.data;

      const updated = await opportunityService.update(id, req.user!.user_id, patchWithoutReason);

      // Post-publication: create version snapshot
      if (current.status === 'published' && modification_reason) {
        await versioningService.createSnapshot(
          id,
          req.user!.user_id,
          modification_reason,
          current,
          updated,
        );
      }

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

// ─── POST /api/v1/opportunities/:id/publish ───────────────────────────────────

opportunitiesRouter.post(
  '/opportunities/:id/publish',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const isDryRun = req.query['dry_run'] === 'true';

    try {
      // T-04-01: IDOR protection — verify opportunity belongs to caller's org
      await verifyOpportunityAccess(id, req.user!.user_id);

      // Fetch current opportunity
      const current = await opportunityService.getById(id);

      // T-04-05: Prevent re-publishing already-published opportunity
      if (current.status === 'published' && !isDryRun) {
        res.status(409).json({
          error: 'ALREADY_PUBLISHED',
          message: 'Opportunity is already published',
        });
        return;
      }

      // Run completeness check
      const completeness = await completenessService.check(id);

      // Dry run: return blockers without publishing
      if (isDryRun) {
        res.status(200).json(completeness);
        return;
      }

      // Block publication if not ready
      if (!completeness.is_ready) {
        res.status(422).json({
          error: 'PUBLICATION_BLOCKED',
          blockers: completeness.blockers,
        });
        return;
      }

      // Update status to published
      const published = await pool.query<Opportunity>(
        `UPDATE opportunities
         SET status = 'published', published_at = now(), published_by = $1, updated_at = now()
         WHERE opportunity_id = $2
         RETURNING *`,
        [req.user!.user_id, id],
      );

      const publishedOpp = published.rows[0];

      // Create version 1 snapshot (Initial publication)
      await versioningService.createSnapshot(
        id,
        req.user!.user_id,
        'Initial publication',
        current,
        publishedOpp,
      );

      // Write OPPORTUNITY_PUBLISHED audit event (separate from OPPORTUNITY_UPDATED_PUBLISHED in versioningService)
      await pool.query(
        `INSERT INTO audit_events (event_type, actor_user_id, entity_type, entity_id, payload)
         VALUES ('OPPORTUNITY_PUBLISHED', $1, 'opportunity', $2, $3::jsonb)`,
        [
          req.user!.user_id,
          id,
          JSON.stringify({ published_at: publishedOpp.published_at }),
        ],
      );

      res.status(200).json(publishedOpp);
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
      console.error('POST /opportunities/:id/publish error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to publish opportunity' });
    }
  },
);

// ─── GET /api/v1/opportunities/:id/versions ───────────────────────────────────

opportunitiesRouter.get(
  '/opportunities/:id/versions',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
      // T-04-06: Verify org membership before returning versions
      await verifyOpportunityAccess(id, req.user!.user_id);

      const versions = await versioningService.listVersions(id);
      res.status(200).json(versions);
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
      console.error('GET /opportunities/:id/versions error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch versions' });
    }
  },
);
