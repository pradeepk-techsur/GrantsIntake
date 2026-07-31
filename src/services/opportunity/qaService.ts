import { pool } from '../../db/client';
import { notificationService } from './notificationService';

export interface QAItem {
  qa_id: string;
  opportunity_id: string;
  submitter_org_id: string;
  submitter_user_id: string;
  question_text: string;
  answer_text: string | null;
  status: 'submitted' | 'under_review' | 'answered' | 'archived';
  submitted_at: string;
  published_by: string | null;
  published_at: string | null;
}

class QAService {
  /** List only answered/published Q&A (public-facing). */
  async listPublished(opportunityId: string): Promise<QAItem[]> {
    const result = await pool.query<QAItem>(
      `SELECT * FROM qa_items WHERE opportunity_id = $1 AND status = 'answered'
       ORDER BY published_at ASC`,
      [opportunityId],
    );
    return result.rows;
  }

  /** List ALL questions for an opportunity (grantor-facing). */
  async listAll(opportunityId: string): Promise<QAItem[]> {
    const result = await pool.query<QAItem>(
      `SELECT * FROM qa_items WHERE opportunity_id = $1 ORDER BY submitted_at DESC`,
      [opportunityId],
    );
    return result.rows;
  }

  /**
   * Submit a question as an applicant.
   * Validates Q&A is enabled and within question window from opportunity.qa_config JSONB.
   * Emits QA_QUESTION_SUBMITTED audit_event.
   */
  async submitQuestion(
    opportunityId: string,
    submitterOrgId: string,
    submitterUserId: string,
    questionText: string,
  ): Promise<QAItem> {
    // Check opportunity Q&A config
    const oppResult = await pool.query<{
      opportunity_id: string;
      qa_config: { enabled?: boolean; question_window_open?: string; question_window_close?: string } | null;
    }>(
      `SELECT opportunity_id, qa_config FROM opportunities WHERE opportunity_id = $1`,
      [opportunityId],
    );
    if (oppResult.rowCount === 0) {
      const err = new Error('Opportunity not found') as Error & { status: number };
      err.status = 404;
      throw err;
    }
    const opp = oppResult.rows[0];
    const qa_config = opp.qa_config ?? {};
    if (!qa_config.enabled) {
      const err = new Error('Q&A is not enabled for this opportunity') as Error & { status: number; code: string };
      err.status = 403;
      err.code = 'QA_DISABLED';
      throw err;
    }
    const now = new Date();
    if (qa_config.question_window_open && new Date(qa_config.question_window_open) > now) {
      const err = new Error('Q&A question window has not opened yet') as Error & { status: number; code: string };
      err.status = 403;
      err.code = 'QA_WINDOW_NOT_OPEN';
      throw err;
    }
    if (qa_config.question_window_close && new Date(qa_config.question_window_close) < now) {
      const err = new Error('Q&A question window is closed') as Error & { status: number; code: string };
      err.status = 403;
      err.code = 'QA_WINDOW_CLOSED';
      throw err;
    }

    const result = await pool.query<QAItem>(
      `INSERT INTO qa_items (opportunity_id, submitter_org_id, submitter_user_id, question_text)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [opportunityId, submitterOrgId, submitterUserId, questionText],
    );
    const qa = result.rows[0];

    // Audit event
    await pool.query(
      `INSERT INTO audit_events (entity_type, entity_id, event_type, actor_user_id, payload)
       VALUES ('qa_item', $1, 'QA_QUESTION_SUBMITTED', $2, $3)`,
      [qa.qa_id, submitterUserId, JSON.stringify({ opportunity_id: opportunityId })],
    );

    return qa;
  }

  /**
   * Publish an answer (grantor action).
   * Updates status to 'answered', sets answer_text, published_by, published_at.
   * Emits QA_ANSWER_PUBLISHED audit_event.
   * Triggers notification to all workspaces on this opportunity.
   */
  async publishAnswer(
    questionId: string,
    answerText: string,
    publishedBy: string,
  ): Promise<QAItem> {
    // Verify question exists
    const existing = await pool.query<QAItem>(
      `SELECT * FROM qa_items WHERE qa_id = $1`,
      [questionId],
    );
    if (existing.rowCount === 0) {
      const err = new Error('Question not found') as Error & { status: number };
      err.status = 404;
      throw err;
    }

    const result = await pool.query<QAItem>(
      `UPDATE qa_items
       SET answer_text = $1, status = 'answered', published_by = $2, published_at = now()
       WHERE qa_id = $3 RETURNING *`,
      [answerText, publishedBy, questionId],
    );
    const qa = result.rows[0];

    // Audit event
    await pool.query(
      `INSERT INTO audit_events (entity_type, entity_id, event_type, actor_user_id, payload)
       VALUES ('qa_item', $1, 'QA_ANSWER_PUBLISHED', $2, $3)`,
      [qa.qa_id, publishedBy, JSON.stringify({ opportunity_id: qa.opportunity_id })],
    );

    // Notify all applicant workspaces
    await notificationService.notifyWorkspacesOfQAUpdate(qa.opportunity_id, qa.qa_id);

    return qa;
  }

  /** Full immutable audit history for an opportunity (grantor-only). */
  async getAuditHistory(opportunityId: string): Promise<Array<Record<string, unknown>>> {
    const result = await pool.query(
      `SELECT ae.*, u.email as actor_email
       FROM audit_events ae
       LEFT JOIN users u ON ae.actor_user_id = u.user_id
       WHERE ae.entity_type IN ('qa_item', 'addendum')
         AND ae.payload::jsonb->>'opportunity_id' = $1
       ORDER BY ae.created_at DESC`,
      [opportunityId],
    );
    return result.rows;
  }
}

export const qaService = new QAService();
