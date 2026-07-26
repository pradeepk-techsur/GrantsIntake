import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { prescreeningService } from '../services/eligibility/prescreeningService';
import { prescreeningEvaluationService } from '../services/eligibility/prescreeningEvaluationService';
import { organizationService } from '../services/organization/organizationService';
import { pool } from '../db/client';
import { getGrantorOrgIdForUser } from '../services/program/programService';

// UUID regex for format guard (T-03-17)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

// ─── Applicant-facing GET /api/v1/opportunities/:opportunity_id/prescreening/applicant ──
// Returns the questionnaire for an opportunity (applicant view: no rule_outcome exposed).
// Requires auth so org_id can be resolved later in submit.

prescreeningRouter.get(
  '/opportunities/:opportunity_id/prescreening/applicant',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { opportunity_id } = req.params;

    if (!UUID_REGEX.test(opportunity_id)) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Opportunity not found' });
      return;
    }

    try {
      // Verify opportunity exists (any authenticated user can view questionnaire)
      const existsResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*) FROM opportunities WHERE opportunity_id = $1`,
        [opportunity_id],
      );
      if (parseInt(existsResult.rows[0].count) === 0) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Opportunity not found' });
        return;
      }

      const preview = await prescreeningService.preview(opportunity_id);
      if (!preview) {
        res.status(200).json({ questionnaire_id: null, questions: [] });
        return;
      }
      res.status(200).json(preview);
    } catch (err: unknown) {
      console.error('GET /opportunities/:id/prescreening/applicant error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch prescreening questionnaire' });
    }
  },
);

// ─── Validate submit schema ────────────────────────────────────────────────────

const submitSchema = z.object({
  responses: z.array(
    z.object({
      question_id: z.string().uuid(),
      selected_option_id: z.string().uuid().optional(),
      response_text: z.string().max(5000).optional(),
    }),
  ).min(1),
});

// ─── POST /api/v1/opportunities/:opportunity_id/prescreening/submit ───────────
// Applicant submits pre-screen responses. Returns EligibilityResult.

prescreeningRouter.post(
  '/opportunities/:opportunity_id/prescreening/submit',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { opportunity_id } = req.params;

    if (!UUID_REGEX.test(opportunity_id)) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Opportunity not found' });
      return;
    }

    const parsed = submitSchema.safeParse(req.body);
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
      // Get org_id for this user (T-03-22: derived server-side, never from request body)
      const orgId = await organizationService.getOrgIdForUser(req.user!.user_id);
      if (!orgId) {
        res.status(400).json({
          error: 'NO_ORG_PROFILE',
          message: 'Organization profile required before pre-screening.',
        });
        return;
      }

      const result = await prescreeningEvaluationService.evaluateResponses(
        opportunity_id,
        orgId,
        parsed.data.responses,
      );
      res.status(200).json(result);
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      if (error.code === 'ALREADY_SUBMITTED') {
        res.status(409).json({
          error: 'ALREADY_SUBMITTED',
          message: 'Eligibility pre-screen already completed for this opportunity.',
        });
        return;
      }
      console.error('POST /opportunities/:id/prescreening/submit error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to evaluate prescreening responses' });
    }
  },
);

// ─── GET /api/v1/opportunities/:opportunity_id/prescreening/my-result ──────────
// Returns the stored EligibilityResult for the authenticated user's org + opportunity.
// Derives org_id server-side from user_id (T-03-22: never from request body).

prescreeningRouter.get(
  '/opportunities/:opportunity_id/prescreening/my-result',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { opportunity_id } = req.params;

    if (!UUID_REGEX.test(opportunity_id)) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Opportunity not found' });
      return;
    }

    try {
      // Derive org_id server-side — never trust request body (T-03-22)
      const orgId = await organizationService.getOrgIdForUser(req.user!.user_id);
      if (!orgId) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'No pre-screen result found' });
        return;
      }

      // Load all responses for this org + opportunity, reconstruct EligibilityResult
      const responsesResult = await pool.query<{
        question_id: string;
        selected_option_id: string | null;
        response_text: string | null;
        rule_evaluation_result: string;
        overall_result: string;
        submitted_at: string;
      }>(
        `SELECT question_id, selected_option_id, response_text,
                rule_evaluation_result, overall_result, submitted_at
         FROM eligibility_responses
         WHERE opportunity_id = $1 AND org_id = $2
         ORDER BY submitted_at ASC`,
        [opportunity_id, orgId],
      );

      if (responsesResult.rows.length === 0) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'No pre-screen result found' });
        return;
      }

      // overall_result is the same for all rows in the same submission
      const overall_result = responsesResult.rows[0].overall_result as
        'eligible' | 'likely_eligible' | 'needs_attention' | 'ineligible';

      // Reconstruct triggered_rules: load eligibility_rules for question_ids that
      // have rule_evaluation_result = 'violated' or 'advisory'
      const triggeredOptionIds = responsesResult.rows
        .filter((r) => r.selected_option_id && (r.rule_evaluation_result === 'violated' || r.rule_evaluation_result === 'advisory'))
        .map((r) => r.selected_option_id as string);

      let triggered_rules: Array<{
        rule_id: string;
        severity: 'hard_blocker' | 'advisory';
        explanation_text: string;
        opportunity_section_link?: string;
      }> = [];

      if (triggeredOptionIds.length > 0) {
        // Use ANY($1) with cast to uuid[] for array parameter
        const rulesResult = await pool.query<{
          rule_id: string;
          severity: string;
          explanation_text: string;
          opportunity_section_link: string | null;
        }>(
          `SELECT DISTINCT er.rule_id, er.severity, er.explanation_text, er.opportunity_section_link
           FROM prescreening_options po
           JOIN eligibility_rules er ON er.rule_id = po.mapped_rule_id
           WHERE po.option_id = ANY($1::uuid[])
             AND er.opportunity_id = $2
           ORDER BY er.rule_id`,
          [triggeredOptionIds, opportunity_id],
        );

        triggered_rules = rulesResult.rows.map((r) => ({
          rule_id: r.rule_id,
          severity: r.severity as 'hard_blocker' | 'advisory',
          explanation_text: r.explanation_text,
          ...(r.opportunity_section_link ? { opportunity_section_link: r.opportunity_section_link } : {}),
        }));
      }

      const nextStepMap: Record<string, string> = {
        eligible: 'You may proceed to create an application workspace.',
        likely_eligible: 'You appear eligible but should review the advisory notes before proceeding.',
        needs_attention: 'Please review the items below with your team before proceeding.',
        ineligible: 'Based on your responses, your organization does not meet the eligibility requirements for this opportunity.',
      };

      res.status(200).json({
        overall_result,
        triggered_rules,
        next_step: nextStepMap[overall_result] ?? '',
        workspace_access_granted: overall_result !== 'ineligible',
      });
    } catch (err: unknown) {
      console.error('GET /opportunities/:id/prescreening/my-result error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch pre-screen result' });
    }
  },
);

// ─── GET /api/v1/workspaces/:workspace_id/eligibility-responses ────────────────
// Admin endpoint — Phase 4 will add workspace membership check.
// Stub for Phase 3: returns stored responses by workspace_id or org_id+opportunity_id.
// T-03-17: UUID format guard gates the query.

prescreeningRouter.get(
  '/workspaces/:workspace_id/eligibility-responses',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { workspace_id } = req.params;

    if (!UUID_REGEX.test(workspace_id)) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Workspace not found' });
      return;
    }

    try {
      const { org_id, opportunity_id } = req.query as { org_id?: string; opportunity_id?: string };

      let queryText: string;
      let queryParams: string[];

      if (org_id && opportunity_id && UUID_REGEX.test(org_id) && UUID_REGEX.test(opportunity_id)) {
        // Fallback: query by org_id + opportunity_id (used when workspace_id not yet assigned)
        queryText = `SELECT * FROM eligibility_responses
                     WHERE org_id = $1 AND opportunity_id = $2
                     ORDER BY submitted_at DESC`;
        queryParams = [org_id, opportunity_id];
      } else {
        queryText = `SELECT * FROM eligibility_responses
                     WHERE workspace_id = $1
                     ORDER BY submitted_at DESC`;
        queryParams = [workspace_id];
      }

      const result = await pool.query(queryText, queryParams);
      res.status(200).json(result.rows);
    } catch (err: unknown) {
      console.error('GET /workspaces/:id/eligibility-responses error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch eligibility responses' });
    }
  },
);
