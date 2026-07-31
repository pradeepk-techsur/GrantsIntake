import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { qaService } from '../services/opportunity/qaService';
import { organizationService } from '../services/organization/organizationService';

export const qaRouter = Router();

// ─── Validation schemas ────────────────────────────────────────────────────────

const submitQuestionSchema = z.object({
  question_text: z.string().min(1, 'Question text is required').max(2000, 'Question text too long (max 2000 chars)'),
});

const publishAnswerSchema = z.object({
  answer_text: z.string().min(1, 'Answer text is required').max(5000, 'Answer text too long (max 5000 chars)'),
});

// ─── 1. GET /opportunities/:opportunityId/qa ─────────────────────────────────
/**
 * Public endpoint — no auth required.
 * Returns only answered/published Q&A items for the opportunity.
 */
qaRouter.get(
  '/opportunities/:opportunityId/qa',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const items = await qaService.listPublished(req.params.opportunityId);
      res.json(items);
    } catch (err) {
      console.error('Q&A listPublished error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch Q&A' });
    }
  },
);

// ─── 2. GET /opportunities/:opportunityId/questions ──────────────────────────
/**
 * Grantor-only: list ALL questions (including unanswered).
 * Requires grantor_admin or program_officer role.
 */
qaRouter.get(
  '/opportunities/:opportunityId/questions',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const items = await qaService.listAll(req.params.opportunityId);
      res.json(items);
    } catch (err) {
      console.error('Q&A listAll error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch questions' });
    }
  },
);

// ─── 3. POST /opportunities/:opportunityId/questions ─────────────────────────
/**
 * Applicant submits a question.
 * Requires authentication. org_id derived server-side via organizationService.getOrgIdForUser()
 * — never from request body (T-01-01 IDOR mitigation).
 */
qaRouter.post(
  '/opportunities/:opportunityId/questions',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = submitQuestionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.issues });
      return;
    }

    try {
      // T-05-01: org_id derived server-side, never from request body
      const orgId = await organizationService.getOrgIdForUser(req.user!.user_id);
      if (!orgId) {
        res.status(403).json({ error: 'NO_ORGANIZATION', message: 'You must belong to an organization to submit a question' });
        return;
      }

      const qa = await qaService.submitQuestion(
        req.params.opportunityId,
        orgId,
        req.user!.user_id,
        parsed.data.question_text,
      );
      res.status(201).json(qa);
    } catch (err: unknown) {
      const e = err as Error & { status?: number; code?: string };
      if (e.status === 404) {
        res.status(404).json({ error: 'NOT_FOUND', message: e.message });
        return;
      }
      if (e.status === 403) {
        res.status(403).json({ error: e.code ?? 'FORBIDDEN', message: e.message });
        return;
      }
      console.error('Q&A submitQuestion error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to submit question' });
    }
  },
);

// ─── 4. PUT /questions/:questionId/answer ────────────────────────────────────
/**
 * Grantor publishes an answer for a question.
 * Requires grantor_admin or program_officer role.
 * T-05-02: role guard enforced before handler.
 */
qaRouter.put(
  '/questions/:questionId/answer',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    const parsed = publishAnswerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.issues });
      return;
    }

    try {
      const qa = await qaService.publishAnswer(
        req.params.questionId,
        parsed.data.answer_text,
        req.user!.user_id,
      );
      res.json(qa);
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      if (e.status === 404) {
        res.status(404).json({ error: 'NOT_FOUND', message: e.message });
        return;
      }
      console.error('Q&A publishAnswer error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to publish answer' });
    }
  },
);

// ─── 5. GET /opportunities/:opportunityId/audit-history ──────────────────────
/**
 * Grantor-only: full immutable audit history for Q&A and addenda.
 * Requires grantor_admin or program_officer role.
 */
qaRouter.get(
  '/opportunities/:opportunityId/audit-history',
  authenticate,
  requireRole('grantor_admin', 'program_officer'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const events = await qaService.getAuditHistory(req.params.opportunityId);
      res.json(events);
    } catch (err) {
      console.error('Q&A audit-history error:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch audit history' });
    }
  },
);
