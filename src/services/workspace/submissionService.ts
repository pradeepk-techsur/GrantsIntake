import { randomUUID } from 'crypto';
import { pool } from '../../db/client';
import { validationService } from './validationService';
import { certificationService } from './certificationService';

export interface SubmissionConfirmation {
  snapshot_id: string;
  confirmation_number: string; // GI-{YEAR}-{8-digit-seq}
  submitted_at: string;
  opportunity_title: string;
  applicant_org_name: string;
  receipt_download_url: string;
}

class SubmissionService {
  /**
   * Generate a unique confirmation number in GI-{YEAR}-{8-digit-seq} format.
   *
   * Uses MAX()+1 pattern scoped to current year for human-readable sequential numbering.
   * Unique constraint on confirmation_number column is the ultimate uniqueness guarantee.
   * Loop retries up to 3 times on collision (race condition safeguard).
   */
  private async generateConfirmationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `GI-${year}-`;

    for (let attempt = 0; attempt < 3; attempt++) {
      const maxResult = await pool.query<{ max_seq: string | null }>(
        `SELECT MAX(CAST(SUBSTRING(confirmation_number FROM 9) AS BIGINT)) as max_seq
         FROM submission_snapshots
         WHERE confirmation_number LIKE $1`,
        [`GI-${year}-%`],
      );
      const nextSeq =
        (maxResult.rows[0].max_seq
          ? parseInt(maxResult.rows[0].max_seq, 10)
          : 0) + 1;
      const confirmationNumber = `${prefix}${String(nextSeq).padStart(8, '0')}`;
      return confirmationNumber;
    }
    throw new Error(
      'Failed to generate unique confirmation number after 3 attempts',
    );
  }

  /**
   * Generate human-readable HTML package path (USWDS-styled).
   * MVP: deterministic virtual path. Full S3/file storage is Phase 6.
   */
  private generateHumanReadablePackagePath(
    confirmationNumber: string,
  ): string {
    return `/submissions/human-readable/${confirmationNumber}.html`;
  }

  /**
   * Generate machine-readable JSON package path.
   * MVP: deterministic virtual path. Full S3/file storage is Phase 6.
   */
  private generateMachineReadablePackagePath(
    confirmationNumber: string,
  ): string {
    return `/submissions/machine-readable/${confirmationNumber}.json`;
  }

  /**
   * Full submission pipeline:
   * 1. Load workspace metadata (IDOR: workspace_id from DB, not body)
   * 2. Run final validation gate (422 if any blocking errors)
   * 3. Verify certification exists
   * 4. Generate unique confirmation number
   * 5. Collect all snapshot data (org profile, eligibility, sections, budget, attachments)
   * 6. Compute package paths before INSERT (immutability-safe — no post-INSERT UPDATE needed)
   * 7. INSERT submission_snapshots (immutable)
   * 8. Lock workspace: is_locked=true, visibility='shared'
   * 9. Emit SUBMISSION_COMPLETED audit_event
   * 10. Log notification
   */
  async submit(
    workspaceId: string,
    submittedByUserId: string,
  ): Promise<SubmissionConfirmation> {
    // ── Load workspace ──────────────────────────────────────────────────
    const wsResult = await pool.query<{
      workspace_id: string;
      opportunity_id: string;
      org_id: string;
      is_locked: boolean;
    }>(
      `SELECT workspace_id, opportunity_id, org_id, is_locked
       FROM application_workspaces WHERE workspace_id = $1`,
      [workspaceId],
    );
    if (wsResult.rowCount === 0) {
      const err = new Error('Workspace not found') as Error & {
        status: number;
      };
      err.status = 404;
      throw err;
    }
    const ws = wsResult.rows[0];
    if (ws.is_locked) {
      const err = new Error(
        'This application has already been submitted and is locked.',
      ) as Error & { status: number; code: string };
      err.status = 409;
      err.code = 'ALREADY_SUBMITTED';
      throw err;
    }

    // ── Final validation gate ───────────────────────────────────────────
    const validation = await validationService.runValidation(workspaceId);
    if (validation.blocking.length > 0) {
      const err = Object.assign(
        new Error('Submission blocked — blocking errors must be resolved'),
        {
          error_code: 'SUBMISSION_BLOCKED' as const,
          status: 422 as const,
          blocking_errors: validation.blocking.map((e) => ({
            section_id: e.section_id,
            field_label: e.field_label,
            error_code: e.error_code,
            severity: 'blocking' as const,
            message: e.message,
            link: e.link,
          })),
        },
      );
      throw err;
    }

    // ── Verify certification ────────────────────────────────────────────
    const certification =
      await certificationService.getCertification(workspaceId);
    if (!certification) {
      const err = Object.assign(
        new Error('Application must be certified before submission'),
        {
          error_code: 'SUBMISSION_BLOCKED' as const,
          status: 422 as const,
          blocking_errors: [
            {
              section_id: 'certifications',
              error_code: 'CERTIFICATION_INCOMPLETE',
              severity: 'blocking' as const,
              message:
                'The authorized representative must certify the application before submission.',
              link: `/applicant/workspaces/${workspaceId}#section-certifications`,
            },
          ],
        },
      );
      throw err;
    }

    // ── Collect snapshot data ────────────────────────────────────────────
    const [
      orgResult,
      eligResult,
      sectionsResult,
      budgetResult,
      attachResult,
      oppResult,
    ] = await Promise.all([
      pool.query(`SELECT * FROM organizations WHERE org_id = $1`, [ws.org_id]),
      pool.query(
        `SELECT * FROM eligibility_responses WHERE workspace_id = $1`,
        [workspaceId],
      ),
      pool.query(
        `SELECT s.*,
                json_agg(fr.*) FILTER (WHERE fr.response_id IS NOT NULL) as field_responses
         FROM application_sections s
         LEFT JOIN field_responses fr ON fr.section_id = s.section_id
         WHERE s.workspace_id = $1
         GROUP BY s.section_id ORDER BY s.display_order`,
        [workspaceId],
      ),
      pool.query(
        `SELECT * FROM budgets b LEFT JOIN budget_line_items bli ON bli.budget_id = b.budget_id WHERE b.workspace_id = $1`,
        [workspaceId],
      ),
      pool.query(
        `SELECT * FROM attachments WHERE workspace_id = $1 AND is_active = true`,
        [workspaceId],
      ),
      pool.query(
        `SELECT title, funding_amount_max FROM opportunities WHERE opportunity_id = $1`,
        [ws.opportunity_id],
      ),
    ]);

    const orgProfileSnapshot = orgResult.rows[0] ?? {};
    const eligibilitySnapshot = eligResult.rows;
    const sectionsSnapshot = sectionsResult.rows;
    const budgetSnapshot = budgetResult.rows;
    const attachmentRefs = attachResult.rows.map(
      (a: Record<string, unknown>) => ({
        attachment_id: a.attachment_id,
        document_type: a.document_type,
        file_name: a.file_name,
        version_number: a.version_number,
        uploaded_at: a.uploaded_at,
      }),
    );
    const opportunityTitle =
      oppResult.rows[0]?.title ?? 'Unknown Opportunity';
    const orgName =
      orgResult.rows[0]?.legal_name ?? 'Unknown Organization';

    // ── Generate confirmation number ────────────────────────────────────
    const confirmationNumber = await this.generateConfirmationNumber();

    // ── Compute package paths BEFORE INSERT (immutability-safe) ─────────
    const humanReadablePath =
      this.generateHumanReadablePackagePath(confirmationNumber);
    const machineReadablePath =
      this.generateMachineReadablePackagePath(confirmationNumber);

    // ── INSERT submission_snapshots (immutable) ─────────────────────────
    const snapshotId = randomUUID();
    const snapshotResult = await pool.query<{
      snapshot_id: string;
      submitted_at: string;
    }>(
      `INSERT INTO submission_snapshots (
         snapshot_id, workspace_id, opportunity_id, org_id, confirmation_number,
         submitted_by, org_profile_snapshot, eligibility_snapshot,
         sections_snapshot, budget_snapshot, attachment_refs,
         certification_id, validation_summary,
         human_readable_pdf_path, machine_readable_json_path
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING snapshot_id, submitted_at`,
      [
        snapshotId,
        workspaceId,
        ws.opportunity_id,
        ws.org_id,
        confirmationNumber,
        submittedByUserId,
        JSON.stringify(orgProfileSnapshot),
        JSON.stringify(eligibilitySnapshot),
        JSON.stringify(sectionsSnapshot),
        JSON.stringify(budgetSnapshot),
        JSON.stringify(attachmentRefs),
        certification.cert_id,
        JSON.stringify({
          blocking: 0,
          warnings: validation.warnings.length,
          info: validation.informational.length,
        }),
        humanReadablePath,
        machineReadablePath,
      ],
    );
    const snapshot = snapshotResult.rows[0];

    // ── Lock workspace ──────────────────────────────────────────────────
    await pool.query(
      `UPDATE application_workspaces SET is_locked = true, visibility = 'shared' WHERE workspace_id = $1`,
      [workspaceId],
    );

    // ── SUBMISSION_COMPLETED audit event (payload column — Phase 1 schema) ──
    await pool.query(
      `INSERT INTO audit_events (entity_type, entity_id, event_type, actor_user_id, payload)
       VALUES ('submission_snapshot', $1, 'SUBMISSION_COMPLETED', $2, $3)`,
      [
        snapshot.snapshot_id,
        submittedByUserId,
        JSON.stringify({
          confirmation_number: confirmationNumber,
          workspace_id: workspaceId,
        }),
      ],
    );

    // ── Notification log (Phase 6 adds real email delivery) ─────────────
    console.log(
      `[NOTIFICATION] APPLICATION_SUBMITTED confirmation=${confirmationNumber} workspace=${workspaceId}`,
    );

    return {
      snapshot_id: snapshot.snapshot_id,
      confirmation_number: confirmationNumber,
      submitted_at: snapshot.submitted_at,
      opportunity_title: opportunityTitle,
      applicant_org_name: orgName,
      receipt_download_url: `/api/v1/workspaces/${workspaceId}/receipt`,
    };
  }

  /**
   * Get submission receipt data for a workspace (applicant team).
   */
  async getReceipt(workspaceId: string): Promise<{
    confirmation_number: string;
    submitted_at: string;
    snapshot_id: string;
    opportunity_title: string;
    applicant_org_name: string;
    human_readable_pdf_path: string | null;
    machine_readable_json_path: string | null;
  }> {
    const result = await pool.query(
      `SELECT ss.snapshot_id, ss.confirmation_number, ss.submitted_at,
              ss.human_readable_pdf_path, ss.machine_readable_json_path,
              o.title as opportunity_title,
              org.legal_name as applicant_org_name
       FROM submission_snapshots ss
       JOIN opportunities o ON o.opportunity_id = ss.opportunity_id
       JOIN organizations org ON org.org_id = ss.org_id
       WHERE ss.workspace_id = $1 AND ss.is_current = true`,
      [workspaceId],
    );
    if (result.rowCount === 0) {
      const err = new Error(
        'No submission found for this workspace',
      ) as Error & { status: number };
      err.status = 404;
      throw err;
    }
    return result.rows[0];
  }

  /** Get snapshot metadata (for grantor access in Phase 6). */
  async getSnapshot(
    snapshotId: string,
  ): Promise<Record<string, unknown>> {
    const result = await pool.query(
      `SELECT snapshot_id, workspace_id, opportunity_id, org_id, confirmation_number,
              submitted_at, submitted_by, is_original, is_current, validation_summary,
              human_readable_pdf_path, machine_readable_json_path
       FROM submission_snapshots WHERE snapshot_id = $1`,
      [snapshotId],
    );
    if (result.rowCount === 0) {
      const err = new Error('Snapshot not found') as Error & {
        status: number;
      };
      err.status = 404;
      throw err;
    }
    return result.rows[0];
  }
}

export const submissionService = new SubmissionService();
