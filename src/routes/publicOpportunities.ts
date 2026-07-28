import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { searchService, OpportunitySearchParams } from '../services/opportunity/searchService';
import { publicationService } from '../services/opportunity/publicationService';
import { pool } from '../db/client';

export const publicOpportunitiesRouter = Router();

// ─── Validation schemas ────────────────────────────────────────────────────────

const searchParamsSchema = z.object({
  keyword: z.string().max(200).optional(),
  funder: z.string().max(250).optional(),
  program_area: z.string().max(100).optional(),
  geography: z.string().max(200).optional(),
  eligibility_type: z.string().max(100).optional(),
  funding_min: z.coerce.number().positive().optional(),
  funding_max: z.coerce.number().positive().optional(),
  due_date_from: z.string().optional(),
  due_date_to: z.string().optional(),
  application_stage: z.enum(['pre_application', 'loi', 'full_application']).optional(),
  sort_by: z.enum(['relevance', 'deadline', 'amount']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  page_size: z.coerce.number().int().min(1).max(100).optional(),
});

// ─── GET /api/v1/opportunities ─────────────────────────────────────────────────
/**
 * Search published opportunities (no auth required).
 * Returns only opportunities with status='published'.
 * Query params: OpportunitySearchParams
 */
publicOpportunitiesRouter.get('/opportunities', async (req: Request, res: Response): Promise<void> => {
  const parsed = searchParamsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.issues });
    return;
  }

  try {
    const result = await searchService.search(parsed.data as OpportunitySearchParams);
    res.json(result);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Search failed' });
  }
});

// ─── GET /api/v1/opportunities/:opportunity_id ─────────────────────────────────
/**
 * Public opportunity detail (no auth required for published opportunities).
 * Returns 404 for unpublished opportunities to unauthenticated/non-grantor callers.
 *
 * Security: T-02-18 — criterion_value JSONB excluded from public eligibility_rules response.
 */
publicOpportunitiesRouter.get('/opportunities/:opportunity_id', async (req: Request, res: Response): Promise<void> => {
  const { opportunity_id } = req.params;

  // Try to authenticate optionally (for grantor access to unpublished)
  let callerUserId: string | null = null;
  let callerRoles: string[] = [];
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const { verifyAccessToken } = await import('../services/auth/tokenService');
      const payload = await verifyAccessToken(authHeader.slice(7));
      callerUserId = payload.sub;
      callerRoles = payload.roles ?? [];
    } catch {
      // Invalid token — treat as unauthenticated
    }
  }

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isUUID = UUID_REGEX.test(opportunity_id);

  try {
    // Fetch the opportunity (try by opportunity_id if it looks like a UUID, then by public_slug)
    let opp: Record<string, unknown> | null = null;

    if (isUUID) {
      const oppResult = await pool.query(
        `SELECT o.*,
                go.org_name AS funder_name,
                p.program_name
         FROM opportunities o
         LEFT JOIN programs p ON o.program_id = p.program_id
         LEFT JOIN grantor_organizations go ON p.grantor_org_id = go.org_id
         WHERE o.opportunity_id = $1`,
        [opportunity_id],
      );
      opp = oppResult.rows[0] ?? null;
    }

    // If not found by UUID (or param was not a UUID), try by public_slug
    if (!opp) {
      const slugResult = await pool.query(
        `SELECT o.*,
                go.org_name AS funder_name,
                p.program_name
         FROM opportunities o
         LEFT JOIN programs p ON o.program_id = p.program_id
         LEFT JOIN grantor_organizations go ON p.grantor_org_id = go.org_id
         WHERE o.public_slug = $1`,
        [opportunity_id],
      );
      opp = slugResult.rows[0] ?? null;
    }

    if (!opp) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Opportunity not found' });
      return;
    }

    // Access control: unpublished opportunities only visible to grantor members
    if (opp.status !== 'published') {
      const isGrantorRole = callerRoles.some((r) =>
        ['grantor_admin', 'program_officer', 'intake_administrator', 'compliance_analyst', 'reviewer'].includes(r),
      );
      if (!isGrantorRole) {
        // Return 404 to not leak existence of unpublished opportunities (T-02-13)
        res.status(404).json({ error: 'NOT_FOUND', message: 'Opportunity not found' });
        return;
      }
    }

    // Fetch eligibility rules — public view excludes criterion_value JSONB (T-02-18)
    const eligibilityResult = await pool.query(
      `SELECT rule_id, rule_type, severity, explanation_text, display_order, enforcement_point
       FROM eligibility_rules
       WHERE opportunity_id = $1
       ORDER BY severity DESC, display_order ASC`,
      [opp.opportunity_id],
    );

    // Fetch attachment requirements grouped by stage_scope
    const attachmentResult = await pool.query(
      `SELECT requirement_id, document_type, custom_document_name, stage_scope,
              is_required, instructions, file_format_restrictions, max_file_size_mb
       FROM attachment_requirements
       WHERE opportunity_id = $1
       ORDER BY stage_scope, document_type`,
      [opp.opportunity_id],
    );

    // Count addenda
    const addendaCountResult = await pool.query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM addenda WHERE opportunity_id = $1',
      [opp.opportunity_id],
    );

    // Compute status badge
    const status_badge = publicationService.getStatusBadge(opp);

    res.json({
      ...opp,
      status_badge,
      eligibility_rules: eligibilityResult.rows,
      attachment_requirements: attachmentResult.rows,
      addenda_count: parseInt(addendaCountResult.rows[0].count, 10),
    });
  } catch (err) {
    console.error('Opportunity detail error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch opportunity' });
  }
});

// ─── GET /api/v1/opportunities/:opportunity_id/workspace-status ────────────────
/**
 * Returns the CTA state for an authenticated applicant.
 * Requires authentication.
 *
 * Returns:
 * - { status: 'closed' } if application_close_date < now()
 * - { status: 'continue', workspace_id } if caller has existing workspace
 * - { status: 'start' } if authenticated applicant with no workspace
 */
publicOpportunitiesRouter.get(
  '/opportunities/:opportunity_id/workspace-status',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { opportunity_id } = req.params;
    const userId = req.user!.user_id;

    try {
      const oppResult = await pool.query<{
        opportunity_id: string;
        application_close_date: Date | null;
        status: string;
      }>(
        'SELECT opportunity_id, application_close_date, status FROM opportunities WHERE opportunity_id = $1',
        [opportunity_id],
      );

      if (oppResult.rows.length === 0) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Opportunity not found' });
        return;
      }

      const opp = oppResult.rows[0];

      // Check if deadline passed
      if (opp.application_close_date && new Date(opp.application_close_date) < new Date()) {
        res.json({ status: 'closed' });
        return;
      }

      // Check for existing workspace (application workspace table — Phase 3+)
      // Join org_roles to find the user's org, then match on org_id (no applicant_user_id column exists).
      try {
        const workspaceResult = await pool.query<{ workspace_id: string }>(
          `SELECT aw.workspace_id FROM application_workspaces aw
           JOIN org_roles orr ON orr.org_id = aw.org_id
           WHERE aw.opportunity_id = $1
             AND orr.user_id = $2
             AND orr.revoked_at IS NULL
           LIMIT 1`,
          [opportunity_id, userId],
        );

        if (workspaceResult.rows.length > 0) {
          res.json({ status: 'continue', workspace_id: workspaceResult.rows[0].workspace_id });
          return;
        }
      } catch {
        // Table may not exist yet (Phase 3) — fall through to 'start'
      }

      res.json({ status: 'start' });
    } catch (err) {
      console.error('Workspace status error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch workspace status' });
    }
  },
);
