import { pool } from '../../db/client';

/**
 * ReadinessSummary — the full readiness state of an application workspace.
 * Returned by GET /workspaces/:id/readiness (PRD-INTAKE-035 / F34).
 */
export interface ReadinessSummary {
  workspace_id: string;
  overall_completion_pct: number;
  is_ready_to_submit: boolean;
  authorized_rep_assigned: boolean;
  blocking_errors: Array<{
    section_id: string;
    section_name: string;
    field_id?: string;
    field_label?: string;
    error_code: string;
    message: string;
    severity: 'blocking';
    link: string;
  }>;
  warnings: Array<{ section_id: string; field_label?: string; message: string; severity: 'warning' }>;
  informational: Array<{ message: string; severity: 'info' }>;
  attachment_status: Array<{
    requirement_id: string;
    document_type: string;
    is_required: boolean;
    is_fulfilled: boolean;
    document_name?: string;
  }>;
}

class ReadinessService {
  /**
   * Compute the full readiness summary for a workspace.
   *
   * Algorithm:
   * 1. Load workspace metadata (org_id, opportunity_id)
   * 2. Load all sections for the workspace
   * 3. Compute overall_completion_pct from visible sections with status='complete'
   * 4. Collect blocking_errors from section.validation_errors JSONB (severity='blocking')
   * 5. Check authorized_rep_assigned in org_roles
   * 6. Check attachment_status from attachment_requirements LEFT JOIN attachments
   * 7. Derive is_ready_to_submit = no blocking errors AND 100% complete AND auth rep assigned
   *
   * Security (T-04-09): All queries parameterized by workspaceId. opportunity_id derived
   * from workspace row, never from request params. No SQL string interpolation.
   */
  async computeReadiness(workspaceId: string): Promise<ReadinessSummary> {
    // Load workspace + sections in parallel
    const [workspaceResult, sectionsResult] = await Promise.all([
      pool.query<{ opportunity_id: string; org_id: string }>(
        `SELECT opportunity_id, org_id FROM application_workspaces WHERE workspace_id = $1`,
        [workspaceId],
      ),
      pool.query(
        `SELECT * FROM application_sections WHERE workspace_id = $1 ORDER BY display_order`,
        [workspaceId],
      ),
    ]);

    const workspace = workspaceResult.rows[0];
    const sections = sectionsResult.rows;

    // ── Completion percentage ──────────────────────────────────────────────────

    const visibleSections = sections.filter((s) => s.is_visible);
    const completeSections = visibleSections.filter((s) => s.status === 'complete');
    const overall_completion_pct =
      visibleSections.length > 0
        ? Math.round((completeSections.length / visibleSections.length) * 100)
        : 0;

    // ── Blocking errors + warnings from section validation_errors JSONB ───────

    const blocking_errors: ReadinessSummary['blocking_errors'] = [];
    const warnings: ReadinessSummary['warnings'] = [];

    for (const section of visibleSections) {
      // Section has status='error' but no validation_errors → generic blocking error
      if (section.status === 'error' && (!section.validation_errors || !Array.isArray(section.validation_errors) || section.validation_errors.length === 0)) {
        blocking_errors.push({
          section_id: section.section_id,
          section_name: section.section_name,
          error_code: 'SECTION_ERROR',
          message: `Section "${section.section_name}" has an error that must be resolved before submission.`,
          severity: 'blocking',
          link: `/applicant/workspaces/${workspaceId}#section-${section.section_type}`,
        });
        continue;
      }

      if (section.validation_errors && Array.isArray(section.validation_errors)) {
        for (const ve of section.validation_errors) {
          if (ve.severity === 'blocking') {
            blocking_errors.push({
              section_id: section.section_id,
              section_name: section.section_name,
              field_id: ve.field_id,
              field_label: ve.field_label,
              error_code: ve.error_code ?? 'VALIDATION_ERROR',
              message: ve.message,
              severity: 'blocking',
              link: `/applicant/workspaces/${workspaceId}#section-${section.section_type}`,
            });
          } else if (ve.severity === 'warning') {
            warnings.push({
              section_id: section.section_id,
              field_label: ve.field_label,
              message: ve.message,
              severity: 'warning',
            });
          }
        }
      }

      // In-progress sections that aren't complete → advisory warning
      if (section.status === 'in_progress') {
        warnings.push({
          section_id: section.section_id,
          message: `Section "${section.section_name}" is in progress but not yet complete.`,
          severity: 'warning',
        });
      }
    }

    // ── Authorized representative check ────────────────────────────────────────
    //
    // Query org_roles for authorized_representative role.
    // workspace.org_id is derived from DB (not request params) — T-04-09.

    let authorized_rep_assigned = false;
    if (workspace) {
      const repResult = await pool.query<{ exists: boolean }>(
        `SELECT EXISTS(
          SELECT 1 FROM org_roles
          WHERE org_id = $1
            AND roles @> '["authorized_representative"]'::jsonb
            AND revoked_at IS NULL
        ) AS exists`,
        [workspace.org_id],
      );
      authorized_rep_assigned = repResult.rows[0]?.exists ?? false;

      if (!authorized_rep_assigned) {
        warnings.push({
          section_id: '',
          message: 'No authorized representative assigned to your organization. Required before submission.',
          severity: 'warning',
        });
      }
    }

    // ── Attachment status ───────────────────────────────────────────────────────
    //
    // Join attachment_requirements with attachments uploaded to this workspace.
    // opportunity_id comes from workspace row (not request params) — T-04-09.
    //
    // Note: `attachments` table is created in a future phase migration. If the
    // table does not yet exist, we gracefully skip the JOIN and return an empty
    // attachment_status array (no blocking errors for missing attachments).
    // This allows the readiness endpoint to function during early development
    // phases before the full attachment infrastructure is in place.

    const attachment_status: ReadinessSummary['attachment_status'] = [];

    if (workspace) {
      try {
        const attachResult = await pool.query<{
          requirement_id: string;
          document_type: string;
          is_required: boolean;
          attachment_id: string | null;
          file_name: string | null;
        }>(
          `SELECT ar.requirement_id, ar.document_type, ar.is_required,
                  a.attachment_id, a.file_name
           FROM attachment_requirements ar
           LEFT JOIN attachments a
             ON a.requirement_id = ar.requirement_id
             AND a.workspace_id = $1
             AND a.is_active = true
           WHERE ar.opportunity_id = $2
             AND ar.stage_scope = 'full_application'`,
          [workspaceId, workspace.opportunity_id],
        );

        for (const r of attachResult.rows) {
          const is_fulfilled = r.attachment_id != null;
          attachment_status.push({
            requirement_id: r.requirement_id,
            document_type: r.document_type,
            is_required: r.is_required,
            is_fulfilled,
            document_name: r.file_name ?? undefined,
          });

          // Missing required attachments → blocking error
          if (r.is_required && !is_fulfilled) {
            blocking_errors.push({
              section_id: '',
              section_name: 'Attachments',
              error_code: 'MISSING_REQUIRED_ATTACHMENT',
              message: `Required attachment missing: ${r.document_type}`,
              severity: 'blocking',
              link: `/applicant/workspaces/${workspaceId}#section-attachments`,
            });
          }
        }
      } catch (err: unknown) {
        // Handle missing `attachments` table gracefully (table created in future phase).
        // Error code 42P01 = "undefined_table" in PostgreSQL.
        const pgErr = err as { code?: string };
        if (pgErr.code !== '42P01') {
          // Re-throw unexpected errors
          throw err;
        }
        // attachments table not yet created — skip silently
      }
    }

    // ── Final readiness determination ───────────────────────────────────────────

    const is_ready_to_submit =
      blocking_errors.length === 0 &&
      overall_completion_pct === 100 &&
      authorized_rep_assigned;

    return {
      workspace_id: workspaceId,
      overall_completion_pct,
      is_ready_to_submit,
      authorized_rep_assigned,
      blocking_errors,
      warnings,
      informational: [],
      attachment_status,
    };
  }
}

export const readinessService = new ReadinessService();
export type { ReadinessService };
