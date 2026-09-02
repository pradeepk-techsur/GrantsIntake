import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { externalOpportunityService } from '../services/external/externalOpportunityService';
import { externalOpportunityImportService } from '../services/external/importService';
import { ingestionScheduler } from '../services/external/ingestionScheduler';

export const externalOpportunitiesRouter = Router();

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const requireGrantorAdmin = requireRole('grantor_admin');

// ─── List / search (public, PRD-INTAKE-019C) ────────────────────────────────
// GET /external-opportunities?status=posted&keyword=health&agency=HHS&page=1&limit=25
externalOpportunitiesRouter.get(
  '/external-opportunities',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = {
        status: req.query.status as string | undefined,
        keyword: req.query.keyword as string | undefined,
        agency: req.query.agency as string | undefined,
        due_before: req.query.due_before as string | undefined,
        due_after: req.query.due_after as string | undefined,
        award_min: req.query.award_min
          ? Number(req.query.award_min)
          : undefined,
        award_max: req.query.award_max
          ? Number(req.query.award_max)
          : undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };
      const result = await externalOpportunityService.listOpportunities(filters);
      res.json(result);
    } catch {
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ─── Saved list (authenticated) — MUST precede /:id ─────────────────────────
externalOpportunitiesRouter.get(
  '/external-opportunities/saved',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const items = await externalOpportunityService.listSavedOpportunities(
        req.user!.user_id,
      );
      res.json({ items });
    } catch {
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ─── List imported internal opportunities (authenticated, PRD-INTAKE-019C) ──
// GET /external-opportunities/imported — MUST precede /:id so the literal
// `/imported` segment is not swallowed by the `:id` catch-all.
externalOpportunitiesRouter.get(
  '/external-opportunities/imported',
  authenticate,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const items =
        await externalOpportunityImportService.listImportedOpportunities();
      res.json({ items });
    } catch {
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ─── Change alerts (authenticated) — MUST precede /:id ──────────────────────
externalOpportunitiesRouter.get(
  '/external-opportunities/alerts',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const alerts = await externalOpportunityService.getUnreadAlerts(
        req.user!.user_id,
      );
      res.json({ alerts });
    } catch {
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

externalOpportunitiesRouter.put(
  '/external-opportunities/alerts/:alertId/read',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      await externalOpportunityService.markAlertRead(
        req.user!.user_id,
        req.params.alertId,
      );
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ─── Admin refresh (grantor_admin, PRD-INTAKE-019A) — MUST precede /:id ─────
externalOpportunitiesRouter.post(
  '/external-opportunities/admin/refresh',
  authenticate,
  requireGrantorAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await ingestionScheduler.refreshAll();
      res.json(result);
    } catch {
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

externalOpportunitiesRouter.post(
  '/external-opportunities/admin/refresh/:opportunityNumber',
  authenticate,
  requireGrantorAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await ingestionScheduler.refreshSingle(
        req.params.opportunityNumber,
      );
      res.json(result);
    } catch {
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ─── Version history (public, PRD-INTAKE-019E) — before /:id bare GET ───────
externalOpportunitiesRouter.get(
  '/external-opportunities/:id/versions',
  async (req: Request, res: Response): Promise<void> => {
    if (!UUID_REGEX.test(req.params.id)) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }
    try {
      const versions = await externalOpportunityService.getVersionHistory(
        req.params.id,
      );
      res.json({ versions });
    } catch {
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ─── Save / unsave (authenticated, PRD-INTAKE-019C) ─────────────────────────
const saveParamSchema = z.object({ id: z.string().regex(UUID_REGEX) });

externalOpportunitiesRouter.post(
  '/external-opportunities/:id/save',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = saveParamSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }
    try {
      const opp = await externalOpportunityService.getOpportunityById(
        req.params.id,
      );
      if (!opp) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      await externalOpportunityService.saveOpportunity(
        req.user!.user_id,
        req.params.id,
      );
      res.status(201).json({ ok: true });
    } catch {
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

externalOpportunitiesRouter.delete(
  '/external-opportunities/:id/save',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    if (!UUID_REGEX.test(req.params.id)) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }
    try {
      await externalOpportunityService.unsaveOpportunity(
        req.user!.user_id,
        req.params.id,
      );
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ─── Import into internal workspace (authenticated, PRD-INTAKE-019C) ────────
// POST /external-opportunities/:id/import
externalOpportunitiesRouter.post(
  '/external-opportunities/:id/import',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    if (!UUID_REGEX.test(req.params.id)) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }
    try {
      const result = await externalOpportunityImportService.importOpportunity(
        req.params.id,
        req.user!.user_id,
      );
      if (!result) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      res.status(result.already_imported ? 200 : 201).json({
        opportunity_id: result.opportunity_id,
        workspace_url: result.workspace_url,
        already_imported: result.already_imported,
      });
    } catch {
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);

// ─── Single opportunity (public) — LAST so static paths win ─────────────────
externalOpportunitiesRouter.get(
  '/external-opportunities/:id',
  async (req: Request, res: Response): Promise<void> => {
    if (!UUID_REGEX.test(req.params.id)) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }
    try {
      const opp = await externalOpportunityService.getOpportunityDetail(
        req.params.id,
      );
      if (!opp) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      res.json(opp);
    } catch {
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  },
);
