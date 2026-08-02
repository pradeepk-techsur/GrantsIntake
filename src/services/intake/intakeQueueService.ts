import { pool } from '../../db/client';

const VALID_DISPOSITIONS = [
  'accepted_for_review',
  'returned_for_correction',
  'ineligible',
  'late',
  'duplicate',
  'withdrawn',
  'administratively_rejected',
] as const;

type DispositionValue = (typeof VALID_DISPOSITIONS)[number];

export interface QueueFilters {
  opportunity_id?: string;
  status?: string;
  sort_by?: string;
  page?: number;
  page_size?: number;
}

export interface ApplyDispositionPayload {
  disposition: string;
  rationale?: string;
  screening_criteria_results?: object[];
}

export interface NotificationFilters {
  is_read?: boolean;
  page?: number;
  page_size?: number;
}

class IntakeQueueService {
  /**
   * Get paginated queue entries for a grantor org's opportunities.
   * IDOR guard: filters by opportunity.grantor_org_id = grantorOrgId (server-derived).
   */
  async getQueueEntries(
    filters: QueueFilters,
    grantorOrgId: string,
  ): Promise<{ entries: unknown[]; total: number; page: number; page_size: number }> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.page_size ?? 25));
    const offset = (page - 1) * pageSize;

    // Build WHERE clauses
    const conditions: string[] = [
      'go.org_id = $1', // IDOR guard: grantor can only see their own opportunities
    ];
    const params: unknown[] = [grantorOrgId];
    let paramIdx = 2;

    if (filters.opportunity_id) {
      conditions.push(`iqe.opportunity_id = $${paramIdx}`);
      params.push(filters.opportunity_id);
      paramIdx++;
    }
    if (filters.status) {
      conditions.push(`iqe.status = $${paramIdx}`);
      params.push(filters.status);
      paramIdx++;
    }

    const whereClause = conditions.join(' AND ');

    // Sort mapping
    const sortMapping: Record<string, string> = {
      submission_date: 'ss.submitted_at DESC',
      org_name: 'org.legal_name ASC',
      funding_amount:
        "(ss.budget_snapshot->>'total_federal_requested')::numeric DESC NULLS LAST",
      eligibility_result: "(ss.eligibility_snapshot->>'overall_result') ASC NULLS LAST",
    };
    const orderBy = sortMapping[filters.sort_by ?? ''] ?? 'ss.submitted_at DESC';

    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text as count
       FROM intake_queue_entries iqe
       JOIN submission_snapshots ss ON ss.snapshot_id = iqe.snapshot_id
       JOIN organizations org ON org.org_id = iqe.org_id
       JOIN opportunities opp ON opp.opportunity_id = iqe.opportunity_id
       JOIN programs p ON p.program_id = opp.program_id
       JOIN grantor_organizations go ON go.org_id = p.grantor_org_id
       WHERE ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await pool.query(
      `SELECT
         iqe.entry_id,
         iqe.workspace_id,
         iqe.opportunity_id,
         opp.title AS opportunity_title,
         iqe.org_id,
         org.legal_name AS org_name,
         iqe.snapshot_id,
         iqe.status,
         iqe.routed_to,
         iqe.created_at,
         ss.submitted_at AS submission_timestamp,
         ss.confirmation_number,
         (ss.budget_snapshot->>'total_federal_requested')::numeric AS requested_amount,
         COALESCE(jsonb_array_length(ss.attachment_refs), 0) AS attachment_count,
         ss.eligibility_snapshot->>'overall_result' AS eligibility_result,
         ss.validation_summary,
         iqe.disposition_id
       FROM intake_queue_entries iqe
       JOIN submission_snapshots ss ON ss.snapshot_id = iqe.snapshot_id
       JOIN organizations org ON org.org_id = iqe.org_id
       JOIN opportunities opp ON opp.opportunity_id = iqe.opportunity_id
       JOIN programs p ON p.program_id = opp.program_id
       JOIN grantor_organizations go ON go.org_id = p.grantor_org_id
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, pageSize, offset],
    );

    return {
      entries: dataResult.rows,
      total,
      page,
      page_size: pageSize,
    };
  }

  /**
   * Get full detail for a single queue entry.
   * IDOR guard: verifies opportunity.grantor_org_id = grantorOrgId.
   */
  async getEntryDetail(entryId: string, grantorOrgId: string): Promise<Record<string, unknown>> {
    const result = await pool.query(
      `SELECT
         iqe.entry_id,
         iqe.workspace_id,
         iqe.opportunity_id,
         opp.title AS opportunity_title,
         iqe.org_id,
         org.legal_name AS org_name,
         iqe.snapshot_id,
         iqe.status,
         iqe.routed_to,
         iqe.created_at,
         ss.submitted_at AS submission_timestamp,
         ss.confirmation_number,
         (ss.budget_snapshot->>'total_federal_requested')::numeric AS requested_amount,
         COALESCE(jsonb_array_length(ss.attachment_refs), 0) AS attachment_count,
         ss.eligibility_snapshot->>'overall_result' AS eligibility_result,
         ss.validation_summary,
         iqe.disposition_id,
         ss.org_profile_snapshot,
         ss.eligibility_snapshot,
         ss.sections_snapshot,
         ss.budget_snapshot,
         ss.attachment_refs,
         go.org_id AS grantor_org_id
       FROM intake_queue_entries iqe
       JOIN submission_snapshots ss ON ss.snapshot_id = iqe.snapshot_id
       JOIN organizations org ON org.org_id = iqe.org_id
       JOIN opportunities opp ON opp.opportunity_id = iqe.opportunity_id
       JOIN programs p ON p.program_id = opp.program_id
       JOIN grantor_organizations go ON go.org_id = p.grantor_org_id
       WHERE iqe.entry_id = $1`,
      [entryId],
    );

    if (result.rowCount === 0) {
      const err = new Error('Queue entry not found') as Error & { status: number };
      err.status = 404;
      throw err;
    }

    const row = result.rows[0];

    // IDOR guard: verify grantor_org_id matches
    if (row.grantor_org_id !== grantorOrgId) {
      const err = new Error('Access denied') as Error & { status: number; code: string };
      err.status = 403;
      err.code = 'PERMISSION_DENIED';
      throw err;
    }

    // Fetch correction requests for this entry
    const correctionResult = await pool.query(
      `SELECT request_id, correction_sections, correction_instructions, correction_deadline,
              requested_by, requested_at, resolved_at
       FROM correction_requests
       WHERE entry_id = $1
       ORDER BY requested_at DESC`,
      [entryId],
    );

    // Fetch disposition history
    const historyResult = await pool.query(
      `SELECT disposition_id, entry_id, snapshot_id, disposition, rationale,
              screening_criteria_results, applied_by, applied_at
       FROM intake_dispositions
       WHERE entry_id = $1
       ORDER BY applied_at DESC`,
      [entryId],
    );

    return {
      ...row,
      correction_requests: correctionResult.rows,
      disposition_history: historyResult.rows,
    };
  }

  /**
   * Apply a screening disposition to a queue entry.
   * Creates intake_dispositions record, updates entry status.
   * Validates: disposition enum, rationale required for non-acceptance.
   * IDOR guard: verifies entry belongs to grantorOrgId.
   */
  async applyDisposition(
    entryId: string,
    payload: ApplyDispositionPayload,
    appliedBy: string,
    grantorOrgId: string,
  ): Promise<Record<string, unknown>> {
    // Validate disposition value
    if (!VALID_DISPOSITIONS.includes(payload.disposition as DispositionValue)) {
      const err = new Error(
        `Invalid disposition. Must be one of: ${VALID_DISPOSITIONS.join(', ')}`,
      ) as Error & { status: number; code: string };
      err.status = 422;
      err.code = 'INVALID_DISPOSITION';
      throw err;
    }

    // Rationale required for non-acceptance dispositions
    if (
      payload.disposition !== 'accepted_for_review' &&
      (!payload.rationale || payload.rationale.trim() === '')
    ) {
      const err = new Error(
        'Rationale is required for non-acceptance dispositions',
      ) as Error & { status: number; code: string };
      err.status = 422;
      err.code = 'RATIONALE_REQUIRED';
      throw err;
    }

    // Fetch entry and verify IDOR
    const entryResult = await pool.query(
      `SELECT iqe.entry_id, iqe.snapshot_id, iqe.org_id, iqe.workspace_id,
              go.org_id AS grantor_org_id
       FROM intake_queue_entries iqe
       JOIN opportunities opp ON opp.opportunity_id = iqe.opportunity_id
       JOIN programs p ON p.program_id = opp.program_id
       JOIN grantor_organizations go ON go.org_id = p.grantor_org_id
       WHERE iqe.entry_id = $1`,
      [entryId],
    );

    if (entryResult.rowCount === 0) {
      const err = new Error('Queue entry not found') as Error & { status: number };
      err.status = 404;
      throw err;
    }

    const entry = entryResult.rows[0];

    if (entry.grantor_org_id !== grantorOrgId) {
      const err = new Error('Access denied') as Error & { status: number; code: string };
      err.status = 403;
      err.code = 'PERMISSION_DENIED';
      throw err;
    }

    // INSERT into intake_dispositions
    const dispositionResult = await pool.query<{ disposition_id: string }>(
      `INSERT INTO intake_dispositions (entry_id, snapshot_id, disposition, rationale, screening_criteria_results, applied_by)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)
       RETURNING disposition_id, entry_id, snapshot_id, disposition, rationale, screening_criteria_results, applied_by, applied_at`,
      [
        entryId,
        entry.snapshot_id,
        payload.disposition,
        payload.rationale ?? null,
        payload.screening_criteria_results
          ? JSON.stringify(payload.screening_criteria_results)
          : null,
        appliedBy,
      ],
    );

    const newDisposition = dispositionResult.rows[0];

    // UPDATE intake_queue_entries status + disposition_id
    await pool.query(
      `UPDATE intake_queue_entries
       SET status = $1, disposition_id = $2, updated_at = now()
       WHERE entry_id = $3`,
      [payload.disposition, newDisposition.disposition_id, entryId],
    );

    // Create DISPOSITION_APPLIED audit event
    await pool.query(
      `INSERT INTO audit_events (entity_type, entity_id, event_type, actor_user_id, payload)
       VALUES ('intake_queue_entry', $1, 'DISPOSITION_APPLIED', $2, $3)`,
      [
        entryId,
        appliedBy,
        JSON.stringify({
          disposition: payload.disposition,
          entry_id: entryId,
          snapshot_id: entry.snapshot_id,
        }),
      ],
    );

    // Notify all members of the applicant org
    try {
      const orgMembersResult = await pool.query<{ user_id: string }>(
        `SELECT DISTINCT user_id FROM org_roles WHERE org_id = $1`,
        [entry.org_id],
      );

      for (const member of orgMembersResult.rows) {
        await this.createNotification(
          member.user_id,
          'DISPOSITION_APPLIED',
          'queue_entry',
          entryId,
          'Disposition Applied',
          `Your application has received a screening decision: ${payload.disposition.replace(/_/g, ' ')}.`,
          `/applicant/workspaces/${entry.workspace_id}/receipt`,
        );
      }
    } catch (notificationErr) {
      // Non-blocking: log but don't fail the disposition
      console.error('[NOTIFICATION] Failed to send disposition notifications:', notificationErr);
    }

    return newDisposition;
  }

  /**
   * Create an in-app notification record.
   */
  async createNotification(
    recipientUserId: string,
    notificationType: string,
    entityType: string,
    entityId: string,
    title: string,
    body: string,
    actionUrl?: string,
  ): Promise<void> {
    await pool.query(
      `INSERT INTO notification_records (recipient_user_id, notification_type, entity_type, entity_id, title, body, action_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [recipientUserId, notificationType, entityType, entityId, title, body, actionUrl ?? null],
    );
  }

  /**
   * Get paginated notifications for a user.
   * Always scoped to authenticated user's user_id (T-06-05).
   */
  async getNotifications(
    userId: string,
    filters: NotificationFilters,
  ): Promise<{ notifications: unknown[]; total: number; page: number; page_size: number }> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.page_size ?? 25));
    const offset = (page - 1) * pageSize;

    const conditions: string[] = ['recipient_user_id = $1'];
    const params: unknown[] = [userId];
    let paramIdx = 2;

    if (filters.is_read !== undefined) {
      conditions.push(`is_read = $${paramIdx}`);
      params.push(filters.is_read);
      paramIdx++;
    }

    const whereClause = conditions.join(' AND ');

    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM notification_records WHERE ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await pool.query(
      `SELECT notification_id, notification_type, entity_type, entity_id, title, body, action_url, is_read, created_at
       FROM notification_records
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, pageSize, offset],
    );

    return {
      notifications: dataResult.rows,
      total,
      page,
      page_size: pageSize,
    };
  }

  /**
   * Mark a notification as read.
   * Ownership enforced: WHERE notification_id=$1 AND recipient_user_id=$2 (T-06-05).
   */
  async markNotificationRead(notificationId: string, userId: string): Promise<void> {
    const result = await pool.query(
      `UPDATE notification_records SET is_read = true
       WHERE notification_id = $1 AND recipient_user_id = $2`,
      [notificationId, userId],
    );

    if ((result.rowCount ?? 0) === 0) {
      const err = new Error('Notification not found') as Error & { status: number };
      err.status = 404;
      throw err;
    }
  }
}

export const intakeQueueService = new IntakeQueueService();
