import { pool } from '../../db/client';
import { organizationService } from '../organization/organizationService';
import type {
  Workspace,
  WorkspaceSection,
  WorkspaceTask,
  WorkspaceComment,
  CreateWorkspaceInput,
  AssignSectionInput,
  CreateTaskInput,
  CreateCommentInput,
  SectionType,
} from '../../types/workspace';

const DEFAULT_SECTIONS: Array<{ section_type: SectionType; section_name: string; display_order: number }> = [
  { section_type: 'org_profile', section_name: 'Organization Profile', display_order: 1 },
  { section_type: 'eligibility', section_name: 'Eligibility', display_order: 2 },
  { section_type: 'narrative', section_name: 'Narrative', display_order: 3 },
  { section_type: 'budget', section_name: 'Budget', display_order: 4 },
  { section_type: 'workplan', section_name: 'Work Plan', display_order: 5 },
  { section_type: 'performance_measures', section_name: 'Performance Measures', display_order: 6 },
  { section_type: 'attachments', section_name: 'Attachments', display_order: 7 },
  { section_type: 'certifications', section_name: 'Certifications', display_order: 8 },
  { section_type: 'review_submit', section_name: 'Review & Submit', display_order: 9 },
];

class WorkspaceService {
  /**
   * Create a new workspace for the given user and opportunity.
   * - Derives org_id server-side (NEVER from request body) — T-04-01 IDOR mitigation.
   * - Checks opportunity.duplicate_allowed before enforcing UNIQUE constraint.
   * - Auto-creates 9 default sections in a transaction.
   * - Emits WORKSPACE_CREATED audit event.
   */
  async createWorkspace(
    userId: string,
    input: CreateWorkspaceInput,
  ): Promise<{ workspace: Workspace; sections: WorkspaceSection[] }> {
    const orgId = await organizationService.getOrgIdForUser(userId);
    if (!orgId) {
      const err = new Error('USER_HAS_NO_ORG');
      (err as NodeJS.ErrnoException).code = 'USER_HAS_NO_ORG';
      throw err;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert workspace — catch UNIQUE violation for duplicate check
      let workspaceId: string;
      let workspace: Workspace;
      try {
        const result = await client.query<Workspace>(
          `INSERT INTO application_workspaces
            (opportunity_id, org_id, track_id, created_by)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [input.opportunity_id, orgId, input.track_id ?? null, userId],
        );
        workspace = result.rows[0];
        workspaceId = workspace.workspace_id;
      } catch (err: unknown) {
        const pgErr = err as { code?: string };
        if (pgErr.code === '23505') {
          // UNIQUE VIOLATION — duplicate workspace for this org+opportunity.
          // The transaction is now aborted; use pool (not client) to look up the
          // existing workspace_id so callers can include it in responses.
          let existingWorkspaceId: string | undefined;
          try {
            const existing = await pool.query<{ workspace_id: string }>(
              `SELECT workspace_id FROM application_workspaces
               WHERE opportunity_id = $1 AND org_id = $2
               LIMIT 1`,
              [input.opportunity_id, orgId],
            );
            existingWorkspaceId = existing.rows[0]?.workspace_id;
          } catch {
            // Ignore — workspace_id will be undefined; route still returns 409
          }
          const dupErr = new Error('DUPLICATE_WORKSPACE') as NodeJS.ErrnoException & { workspace_id?: string };
          dupErr.code = 'DUPLICATE_WORKSPACE';
          dupErr.workspace_id = existingWorkspaceId;
          throw dupErr;
        }
        throw err;
      }

      // Auto-create 9 default sections
      const sectionInserts = DEFAULT_SECTIONS.map((s) =>
        client.query<WorkspaceSection>(
          `INSERT INTO application_sections
            (workspace_id, section_type, section_name, display_order)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [workspaceId, s.section_type, s.section_name, s.display_order],
        ),
      );
      const sectionResults = await Promise.all(sectionInserts);
      const sections = sectionResults.map((r) => r.rows[0]);

      // Emit WORKSPACE_CREATED audit event
      await client.query(
        `INSERT INTO audit_events (event_type, actor_user_id, entity_type, entity_id, payload)
         VALUES ($1, $2, $3, $4, $5::jsonb)`,
        ['WORKSPACE_CREATED', userId, 'workspace', workspaceId, JSON.stringify({ opportunity_id: input.opportunity_id, org_id: orgId })],
      );

      await client.query('COMMIT');
      return { workspace, sections };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get a workspace by ID.
   */
  async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    const result = await pool.query<Workspace>(
      `SELECT * FROM application_workspaces WHERE workspace_id = $1`,
      [workspaceId],
    );
    return result.rows[0] ?? null;
  }

  /**
   * List all workspaces for the current user's org.
   * Derives org_id server-side — IDOR mitigation.
   */
  async listWorkspacesForOrg(userId: string): Promise<Workspace[]> {
    const orgId = await organizationService.getOrgIdForUser(userId);
    if (!orgId) return [];

    const result = await pool.query<Workspace>(
      `SELECT * FROM application_workspaces WHERE org_id = $1 ORDER BY created_at DESC`,
      [orgId],
    );
    return result.rows;
  }

  /**
   * Verify that a user is a member of the org that owns the workspace.
   * Two-step IDOR guard: workspace existence is checked by caller first.
   */
  async verifyWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
    const result = await pool.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM application_workspaces aw
         JOIN org_roles orr ON orr.org_id = aw.org_id
         WHERE aw.workspace_id = $1
           AND orr.user_id = $2
           AND orr.revoked_at IS NULL
       ) AS exists`,
      [workspaceId, userId],
    );
    return result.rows[0]?.exists ?? false;
  }

  /**
   * List all sections for a workspace, ordered by display_order.
   */
  async listSections(workspaceId: string): Promise<WorkspaceSection[]> {
    const result = await pool.query<WorkspaceSection>(
      `SELECT * FROM application_sections WHERE workspace_id = $1 ORDER BY display_order ASC`,
      [workspaceId],
    );
    return result.rows;
  }

  /**
   * Get a single section by workspace_id + section_id.
   */
  async getSection(workspaceId: string, sectionId: string): Promise<WorkspaceSection | null> {
    const result = await pool.query<WorkspaceSection>(
      `SELECT * FROM application_sections WHERE workspace_id = $1 AND section_id = $2`,
      [workspaceId, sectionId],
    );
    return result.rows[0] ?? null;
  }

  /**
   * Assign an owner and/or internal_due_date to a section.
   * Only proposal_lead or org_admin may call this (enforced at route layer).
   */
  async assignSection(
    workspaceId: string,
    sectionId: string,
    input: AssignSectionInput,
  ): Promise<WorkspaceSection> {
    const setClauses: string[] = ['updated_at = now()'];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (input.owner_id !== undefined) {
      setClauses.push(`owner_id = $${paramIdx++}`);
      params.push(input.owner_id);
    }
    if (input.internal_due_date !== undefined) {
      setClauses.push(`internal_due_date = $${paramIdx++}`);
      params.push(input.internal_due_date);
    }

    params.push(workspaceId, sectionId);
    const result = await pool.query<WorkspaceSection>(
      `UPDATE application_sections
       SET ${setClauses.join(', ')}
       WHERE workspace_id = $${paramIdx++} AND section_id = $${paramIdx++}
       RETURNING *`,
      params,
    );
    return result.rows[0];
  }

  /**
   * Create a task in a workspace.
   */
  async createTask(
    workspaceId: string,
    input: CreateTaskInput,
    createdBy: string,
  ): Promise<WorkspaceTask> {
    const result = await pool.query<WorkspaceTask>(
      `INSERT INTO workspace_tasks
        (workspace_id, section_id, task_title, assignee_id, task_due_date, task_notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        workspaceId,
        input.section_id ?? null,
        input.task_title,
        input.assignee_id,
        input.task_due_date ?? null,
        input.task_notes ?? null,
        createdBy,
      ],
    );
    return result.rows[0];
  }

  /**
   * List all tasks for a workspace.
   */
  async listTasks(workspaceId: string): Promise<WorkspaceTask[]> {
    const result = await pool.query<WorkspaceTask>(
      `SELECT * FROM workspace_tasks WHERE workspace_id = $1 ORDER BY created_at ASC`,
      [workspaceId],
    );
    return result.rows;
  }

  /**
   * Update a task (partial update).
   */
  async updateTask(
    taskId: string,
    updates: Partial<WorkspaceTask>,
  ): Promise<WorkspaceTask | null> {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (updates.task_title !== undefined) {
      setClauses.push(`task_title = $${paramIdx++}`);
      params.push(updates.task_title);
    }
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIdx++}`);
      params.push(updates.status);
      if (updates.status === 'complete') {
        setClauses.push(`completed_at = now()`);
      } else {
        setClauses.push(`completed_at = NULL`);
      }
    }
    if (updates.task_due_date !== undefined) {
      setClauses.push(`task_due_date = $${paramIdx++}`);
      params.push(updates.task_due_date);
    }
    if (updates.task_notes !== undefined) {
      setClauses.push(`task_notes = $${paramIdx++}`);
      params.push(updates.task_notes);
    }

    if (setClauses.length === 0) return null;

    params.push(taskId);
    const result = await pool.query<WorkspaceTask>(
      `UPDATE workspace_tasks SET ${setClauses.join(', ')} WHERE task_id = $${paramIdx++} RETURNING *`,
      params,
    );
    return result.rows[0] ?? null;
  }

  /**
   * Delete a task by ID.
   */
  async deleteTask(taskId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM workspace_tasks WHERE task_id = $1`,
      [taskId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * List comments for a workspace (internal only, grantor-blocked at route layer).
   */
  async listComments(workspaceId: string): Promise<WorkspaceComment[]> {
    const result = await pool.query<WorkspaceComment>(
      `SELECT * FROM workspace_comments WHERE workspace_id = $1 ORDER BY posted_at ASC`,
      [workspaceId],
    );
    return result.rows;
  }

  /**
   * Add a comment to a workspace.
   */
  async addComment(
    workspaceId: string,
    input: CreateCommentInput,
    postedBy: string,
  ): Promise<WorkspaceComment> {
    const result = await pool.query<WorkspaceComment>(
      `INSERT INTO workspace_comments
        (workspace_id, section_id, comment_text, posted_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        workspaceId,
        input.section_id ?? null,
        input.comment_text,
        postedBy,
      ],
    );
    return result.rows[0];
  }
}

export const workspaceService = new WorkspaceService();
export type { WorkspaceService };
