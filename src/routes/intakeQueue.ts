import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { intakeQueueService } from '../services/intake/intakeQueueService';
import { pool } from '../db/client';

export const intakeQueueRouter = Router();

// ─── Validation schemas ────────────────────────────────────────────────────────

const dispositionSchema = z.object({
  disposition: z.enum([
    'accepted_for_review',
    'returned_for_correction',
    'ineligible',
    'late',
    'duplicate',
    'withdrawn',
    'administratively_rejected',
  ]),
  rationale: z.string().optional(),
  screening_criteria_results: z
    .array(z.record(z.unknown()))
    .optional(),
});

// ─── Helper: derive grantorOrgId from authenticated user ──────────────────────

async function getGrantorOrgIdForUser(userId: string): Promise<string | null> {
  const result = await pool.query<{ org_id: string }>(
    `SELECT go.org_id
     FROM grantor_organizations go
     JOIN grantor_roles gr ON gr.grantor_org_id = go.org_id
     WHERE gr.user_id = $1 AND gr.revoked_at IS NULL
     LIMIT 1`,
    [userId],
  );
  return result.rows[0]?.org_id ?? null;
}

// ─── Grantor-only role check middleware ──────────────────────────────────────

const requireGrantorRole = requireRole(
  'grantor_admin',
  'program_officer',
  'intake_administrator',
  'compliance_analyst',
  'reviewer',
);

const requireDispositionRole = requireRole('grantor_admin', 'intake_administrator');

// ─── GET /intake-queue ────────────────────────────────────────────────────────

intakeQueueRouter.get(
  '/intake-queue',
  authenticate,
  requireGrantorRole,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const grantorOrgId = await getGrantorOrgIdForUser(req.user!.user_id);
      if (!grantorOrgId) {
        res.status(403).json({ error: 'PERMISSION_DENIED', message: 'No grantor organization found for this user' });
        return;
      }

      const filters = {
        opportunity_id: req.query.opportunity_id as string | undefined,
        status: req.query.status as string | undefined,
        sort_by: req.query.sort_by as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        page_size: req.query.page_size ? parseInt(req.query.page_size as string, 10) : undefined,
      };

      const result = await intakeQueueService.getQueueEntries(filters, grantorOrgId);
      res.json(result);
    } catch (err: unknown) {
      const e = err as Error & { status?: number; code?: string };
      if (e.status === 403) {
        res.status(403).json({ error: e.code ?? 'PERMISSION_DENIED' });
        return;
      }
      console.error('[intake-queue] getQueueEntries error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ─── GET /intake-queue/:entryId ────────────────────────────────────────────────

intakeQueueRouter.get(
  '/intake-queue/:entryId',
  authenticate,
  requireGrantorRole,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const grantorOrgId = await getGrantorOrgIdForUser(req.user!.user_id);
      if (!grantorOrgId) {
        res.status(403).json({ error: 'PERMISSION_DENIED', message: 'No grantor organization found for this user' });
        return;
      }

      const detail = await intakeQueueService.getEntryDetail(req.params.entryId, grantorOrgId);
      res.json(detail);
    } catch (err: unknown) {
      const e = err as Error & { status?: number; code?: string };
      if (e.status === 404) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      if (e.status === 403) {
        res.status(403).json({ error: e.code ?? 'PERMISSION_DENIED' });
        return;
      }
      console.error('[intake-queue] getEntryDetail error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ─── POST /intake-queue/:entryId/disposition ──────────────────────────────────

intakeQueueRouter.post(
  '/intake-queue/:entryId/disposition',
  authenticate,
  requireDispositionRole,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parseResult = dispositionSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(422).json({
          error: 'VALIDATION_ERROR',
          details: parseResult.error.errors,
        });
        return;
      }

      const grantorOrgId = await getGrantorOrgIdForUser(req.user!.user_id);
      if (!grantorOrgId) {
        res.status(403).json({ error: 'PERMISSION_DENIED', message: 'No grantor organization found for this user' });
        return;
      }

      const disposition = await intakeQueueService.applyDisposition(
        req.params.entryId,
        parseResult.data,
        req.user!.user_id,
        grantorOrgId,
      );
      res.status(201).json(disposition);
    } catch (err: unknown) {
      const e = err as Error & { status?: number; code?: string };
      if (e.status === 422) {
        res.status(422).json({ error: e.code ?? 'VALIDATION_ERROR', message: e.message });
        return;
      }
      if (e.status === 404) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      if (e.status === 403) {
        res.status(403).json({ error: e.code ?? 'PERMISSION_DENIED' });
        return;
      }
      console.error('[intake-queue] applyDisposition error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ─── GET /intake-queue/:entryId/snapshots ─────────────────────────────────────

intakeQueueRouter.get(
  '/intake-queue/:entryId/snapshots',
  authenticate,
  requireGrantorRole,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const grantorOrgId = await getGrantorOrgIdForUser(req.user!.user_id);
      if (!grantorOrgId) {
        res.status(403).json({ error: 'PERMISSION_DENIED' });
        return;
      }

      // Verify entry belongs to this grantor (IDOR guard — T-06-04)
      const entryResult = await pool.query(
        `SELECT iqe.workspace_id, go.org_id AS grantor_org_id
         FROM intake_queue_entries iqe
         JOIN opportunities opp ON opp.opportunity_id = iqe.opportunity_id
         JOIN programs p ON p.program_id = opp.program_id
         JOIN grantor_organizations go ON go.org_id = p.grantor_org_id
         WHERE iqe.entry_id = $1`,
        [req.params.entryId],
      );

      if (entryResult.rowCount === 0) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      const entryRow = entryResult.rows[0];
      if (entryRow.grantor_org_id !== grantorOrgId) {
        res.status(403).json({ error: 'PERMISSION_DENIED' });
        return;
      }

      const snapshotsResult = await pool.query(
        `SELECT snapshot_id, confirmation_number, submitted_at, is_original, is_current
         FROM submission_snapshots
         WHERE workspace_id = $1
         ORDER BY submitted_at ASC`,
        [entryRow.workspace_id],
      );

      res.json({ snapshots: snapshotsResult.rows });
    } catch (err: unknown) {
      console.error('[intake-queue] getSnapshots error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ─── GET /notifications ────────────────────────────────────────────────────────

intakeQueueRouter.get(
  '/notifications',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = {
        is_read: req.query.is_read !== undefined
          ? req.query.is_read === 'true'
          : undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        page_size: req.query.page_size ? parseInt(req.query.page_size as string, 10) : undefined,
      };

      const result = await intakeQueueService.getNotifications(req.user!.user_id, filters);
      res.json(result);
    } catch (err: unknown) {
      console.error('[notifications] getNotifications error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ─── PUT /notifications/:notificationId/read ─────────────────────────────────

intakeQueueRouter.put(
  '/notifications/:notificationId/read',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      await intakeQueueService.markNotificationRead(
        req.params.notificationId,
        req.user!.user_id,
      );
      res.json({ updated: true });
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      if (e.status === 404) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      console.error('[notifications] markRead error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);
