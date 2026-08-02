import { pool } from '../../db/client';

export interface ValidationError {
  section_id: string;
  section_name: string;
  field_id?: string;
  field_label?: string;
  error_code: string;
  message: string;
  severity: 'blocking';
  link: string; // anchor link to field/section in workspace
}

export interface ValidationWarning {
  section_id: string;
  section_name: string;
  field_id?: string;
  field_label?: string;
  message: string;
  severity: 'warning';
  link: string;
}

export interface ValidationInfo {
  message: string;
  severity: 'info';
}

export interface ValidationResult {
  workspace_id: string;
  blocking: ValidationError[];
  warnings: ValidationWarning[];
  informational: ValidationInfo[];
  blocking_count: number;
  validated_at: string;
}

class ValidationService {
  /**
   * Run full three-tier validation for a workspace.
   *
   * Sources:
   * 1. section.validation_errors JSONB (written by formFieldService, budgetService)
   * 2. Structural checks: missing auth rep, mandatory sections not complete
   *
   * Severity classification:
   * - 'blocking' → ValidationError[] (red USWDS Error)
   * - 'warning' → ValidationWarning[] (yellow USWDS Warning)
   * - 'info' → ValidationInfo[] (blue USWDS Info)
   */
  async runValidation(workspaceId: string): Promise<ValidationResult> {
    const [sectionsResult, orgResult] = await Promise.all([
      pool.query(
        `SELECT section_id, section_name, section_type, status, validation_errors, is_visible
         FROM application_sections WHERE workspace_id = $1 ORDER BY display_order`,
        [workspaceId],
      ),
      pool.query(
        `SELECT aw.org_id FROM application_workspaces aw WHERE aw.workspace_id = $1`,
        [workspaceId],
      ),
    ]);

    const sections = sectionsResult.rows;
    const orgId = orgResult.rows[0]?.org_id;

    const blocking: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const informational: ValidationInfo[] = [];

    // ── Extract from section validation_errors JSONB ──────────────────────────
    for (const section of sections.filter((s: { is_visible: boolean }) => s.is_visible)) {
      const errors = Array.isArray(section.validation_errors) ? section.validation_errors : [];
      for (const ve of errors) {
        const link = `/applicant/workspaces/${workspaceId}#section-${section.section_type}${ve.field_id ? `__field-${ve.field_id}` : ''}`;
        if (ve.severity === 'blocking') {
          blocking.push({
            section_id: section.section_id,
            section_name: section.section_name,
            field_id: ve.field_id,
            field_label: ve.field_label,
            error_code: ve.error_code ?? 'VALIDATION_ERROR',
            message: ve.message ?? 'This field requires attention before submission.',
            severity: 'blocking',
            link,
          });
        } else if (ve.severity === 'warning') {
          warnings.push({
            section_id: section.section_id,
            section_name: section.section_name,
            field_id: ve.field_id,
            field_label: ve.field_label,
            message: ve.message ?? 'Review this field before submitting.',
            severity: 'warning',
            link,
          });
        }
      }

      // Mandatory section not complete = blocking
      const MANDATORY_SECTIONS = ['org_profile', 'eligibility', 'certifications', 'review_submit'];
      if (MANDATORY_SECTIONS.includes(section.section_type) && section.status !== 'complete') {
        if (!blocking.find((e) => e.section_id === section.section_id)) {
          blocking.push({
            section_id: section.section_id,
            section_name: section.section_name,
            error_code: 'MANDATORY_SECTION_INCOMPLETE',
            message: `Section "${section.section_name}" must be completed before submission.`,
            severity: 'blocking',
            link: `/applicant/workspaces/${workspaceId}#section-${section.section_type}`,
          });
        }
      }
    }

    // ── Structural checks ─────────────────────────────────────────────────────
    if (orgId) {
      // Check authorized rep assigned (org_roles uses roles JSONB array)
      const arResult = await pool.query(
        `SELECT 1 FROM org_roles
         WHERE org_id = $1
           AND roles @> '["authorized_representative"]'::jsonb
           AND revoked_at IS NULL
         LIMIT 1`,
        [orgId],
      );
      if (arResult.rowCount === 0) {
        blocking.push({
          section_id: 'certifications',
          section_name: 'Certifications',
          error_code: 'AUTHORIZED_REP_NOT_ASSIGNED',
          message: 'An authorized representative must be assigned to your organization before submission.',
          severity: 'blocking',
          link: `/applicant/profile/roles`,
        });
      }

      // Check certification exists
      const certResult = await pool.query(
        `SELECT 1 FROM certifications WHERE workspace_id = $1 LIMIT 1`,
        [workspaceId],
      );
      if (certResult.rowCount === 0) {
        blocking.push({
          section_id: 'certifications',
          section_name: 'Certifications',
          error_code: 'CERTIFICATION_INCOMPLETE',
          message: 'The authorized representative must certify the application before submission.',
          severity: 'blocking',
          link: `/applicant/workspaces/${workspaceId}#section-certifications`,
        });
      }
    }

    // ── Informational ─────────────────────────────────────────────────────────
    informational.push({
      message: 'Review your application preview before submitting to confirm all information is accurate.',
      severity: 'info',
    });

    return {
      workspace_id: workspaceId,
      blocking,
      warnings,
      informational,
      blocking_count: blocking.length,
      validated_at: new Date().toISOString(),
    };
  }
}

export const validationService = new ValidationService();
