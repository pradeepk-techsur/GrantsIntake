import { pool } from '../../db/client';

/**
 * NotificationService — Phase 5 lightweight notification layer.
 *
 * In-app notifications: stored as audit_events with event_type='NOTIFICATION_SENT'.
 * Email notifications: console.log simulation in dev/test (Phase 6 will add nodemailer + templates).
 *
 * Phase 6 will introduce notification_records table and email delivery queue.
 */
class NotificationService {
  /**
   * Notify all applicant workspaces for an opportunity of a Q&A update.
   * Creates a NOTIFICATION_SENT audit_event per workspace.
   */
  async notifyWorkspacesOfQAUpdate(opportunityId: string, qaItemId: string): Promise<void> {
    const workspaces = await pool.query<{ workspace_id: string; org_id: string }>(
      `SELECT workspace_id, org_id FROM application_workspaces WHERE opportunity_id = $1`,
      [opportunityId],
    );

    for (const ws of workspaces.rows) {
      await pool.query(
        `INSERT INTO audit_events (entity_type, entity_id, event_type, actor_user_id, payload)
         VALUES ('workspace', $1, 'NOTIFICATION_SENT', NULL, $2)`,
        [
          ws.workspace_id,
          JSON.stringify({
            notification_type: 'QA_UPDATED',
            opportunity_id: opportunityId,
            qa_item_id: qaItemId,
            workspace_link: `/applicant/workspaces/${ws.workspace_id}`,
          }),
        ],
      );
      // Email simulation (Phase 6 replaces with nodemailer)
      console.log(`[NOTIFICATION] QA_UPDATED email to org ${ws.org_id} for workspace ${ws.workspace_id}`);
    }
  }

  /**
   * Notify all applicant workspaces for an opportunity of a new addendum.
   */
  async notifyWorkspacesOfAddendum(opportunityId: string, addendumId: string): Promise<void> {
    const workspaces = await pool.query<{ workspace_id: string; org_id: string }>(
      `SELECT workspace_id, org_id FROM application_workspaces WHERE opportunity_id = $1`,
      [opportunityId],
    );

    for (const ws of workspaces.rows) {
      await pool.query(
        `INSERT INTO audit_events (entity_type, entity_id, event_type, actor_user_id, payload)
         VALUES ('workspace', $1, 'NOTIFICATION_SENT', NULL, $2)`,
        [
          ws.workspace_id,
          JSON.stringify({
            notification_type: 'ADDENDUM_PUBLISHED',
            opportunity_id: opportunityId,
            addendum_id: addendumId,
            workspace_link: `/applicant/workspaces/${ws.workspace_id}`,
          }),
        ],
      );
      console.log(`[NOTIFICATION] ADDENDUM_PUBLISHED email to org ${ws.org_id} for workspace ${ws.workspace_id}`);
    }
  }

  /**
   * Notify all applicant workspaces for an opportunity of a deadline change.
   * Includes old and new deadline values in notification payload.
   */
  async notifyWorkspacesOfDeadlineChange(
    opportunityId: string,
    oldDeadline: string,
    newDeadline: string,
  ): Promise<void> {
    const workspaces = await pool.query<{ workspace_id: string; org_id: string }>(
      `SELECT workspace_id, org_id FROM application_workspaces WHERE opportunity_id = $1`,
      [opportunityId],
    );

    for (const ws of workspaces.rows) {
      await pool.query(
        `INSERT INTO audit_events (entity_type, entity_id, event_type, actor_user_id, payload)
         VALUES ('workspace', $1, 'NOTIFICATION_SENT', NULL, $2)`,
        [
          ws.workspace_id,
          JSON.stringify({
            notification_type: 'DEADLINE_CHANGED',
            opportunity_id: opportunityId,
            old_deadline: oldDeadline,
            new_deadline: newDeadline,
            workspace_link: `/applicant/workspaces/${ws.workspace_id}`,
          }),
        ],
      );
      console.log(
        `[NOTIFICATION] DEADLINE_CHANGED email to org ${ws.org_id}: ${oldDeadline} → ${newDeadline}`,
      );
    }
  }
}

export const notificationService = new NotificationService();
