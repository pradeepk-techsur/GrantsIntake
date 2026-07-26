import { pool } from '../../db/client';
import type { FormFieldDefinition, FieldResponse, SaveFieldResponseInput, ValidationResult, ValidationConfig } from '../../types/formField';

class FormFieldService {
  /**
   * Get field definitions for a section, left-joined with current field_responses
   * for the given workspace. Returns fields in display_order.
   */
  async getFieldsForSection(sectionId: string, workspaceId: string): Promise<FormFieldDefinition[]> {
    const result = await pool.query(
      `SELECT ffd.*,
              fr.response_id, fr.response_value, fr.response_json,
              fr.updated_by as resp_updated_by, fr.updated_at as resp_updated_at
       FROM form_field_definitions ffd
       LEFT JOIN field_responses fr
         ON fr.field_id = ffd.field_id AND fr.workspace_id = $2
       WHERE ffd.section_id = $1
       ORDER BY ffd.display_order`,
      [sectionId, workspaceId],
    );

    return result.rows.map((row) => ({
      field_id: row.field_id,
      opportunity_id: row.opportunity_id,
      section_id: row.section_id,
      field_type: row.field_type,
      label: row.label,
      placeholder: row.placeholder ?? undefined,
      help_text: row.help_text ?? undefined,
      is_required: row.is_required,
      display_order: row.display_order,
      validation_config: row.validation_config ?? undefined,
      formula: row.formula ?? undefined,
      columns: row.columns ?? undefined,
      created_by: row.created_by,
      created_at: row.created_at,
      current_response: row.response_id
        ? {
            response_id: row.response_id,
            workspace_id: workspaceId,
            section_id: sectionId,
            field_id: row.field_id,
            response_value: row.response_value ?? undefined,
            response_json: row.response_json ?? undefined,
            updated_by: row.resp_updated_by,
            updated_at: row.resp_updated_at,
          }
        : undefined,
    }));
  }

  /**
   * Save (upsert) a field response.
   * Uses ON CONFLICT DO UPDATE for idempotency (UNIQUE constraint on workspace_id, field_id).
   */
  async saveFieldResponse(
    workspaceId: string,
    sectionId: string,
    fieldId: string,
    input: SaveFieldResponseInput,
    updatedBy: string,
  ): Promise<FieldResponse> {
    const result = await pool.query<FieldResponse>(
      `INSERT INTO field_responses
         (workspace_id, section_id, field_id, response_value, response_json, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       ON CONFLICT (workspace_id, field_id)
       DO UPDATE SET
         response_value = EXCLUDED.response_value,
         response_json = EXCLUDED.response_json,
         updated_by = EXCLUDED.updated_by,
         updated_at = now()
       RETURNING *`,
      [workspaceId, sectionId, fieldId, input.response_value ?? null, input.response_json ? JSON.stringify(input.response_json) : null, updatedBy],
    );

    // After saving, update section status to 'in_progress' if currently 'not_started'
    await pool.query(
      `UPDATE application_sections
       SET status = 'in_progress', updated_at = now()
       WHERE section_id = $1 AND status = 'not_started'`,
      [sectionId],
    );

    return result.rows[0];
  }

  /**
   * Server-side section validation.
   * Checks all required fields are filled, validates constraints from validation_config.
   * Updates application_sections.validation_errors JSONB and validation_status.
   * Returns ValidationResult.
   */
  async validateSection(workspaceId: string, sectionId: string): Promise<ValidationResult> {
    const fields = await this.getFieldsForSection(sectionId, workspaceId);
    const errors: ValidationResult['errors'] = [];

    for (const field of fields) {
      const vc: ValidationConfig = field.validation_config ?? {};
      const resp = field.current_response;
      const value = resp?.response_value;
      const jsonVal = resp?.response_json;

      // Required check
      if (field.is_required && !value && !jsonVal) {
        errors.push({
          field_id: field.field_id,
          severity: 'blocking',
          message: `${field.label} is required`,
          field_label: field.label,
        });
        continue; // Skip further checks if empty
      }

      // Skip calculated fields (read-only, no user input required)
      if (field.field_type === 'calculated') continue;

      // String length checks
      if (value) {
        if (vc.max_chars && value.length > vc.max_chars) {
          errors.push({ field_id: field.field_id, severity: 'blocking', message: `${field.label} exceeds ${vc.max_chars} character limit (current: ${value.length})`, field_label: field.label });
        }
        if (vc.max_words) {
          const wordCount = value.trim().split(/\s+/).length;
          if (wordCount > vc.max_words) {
            errors.push({ field_id: field.field_id, severity: 'blocking', message: `${field.label} exceeds ${vc.max_words} word limit (current: ${wordCount})`, field_label: field.label });
          }
        }
      }

      // Number/currency min/max checks
      if ((field.field_type === 'number' || field.field_type === 'currency') && value) {
        const numVal = parseFloat(value);
        if (!isNaN(numVal)) {
          if (vc.min !== undefined && numVal < vc.min) {
            errors.push({ field_id: field.field_id, severity: 'blocking', message: `${field.label} must be at least ${vc.min}`, field_label: field.label });
          }
          if (vc.max !== undefined && numVal > vc.max) {
            errors.push({ field_id: field.field_id, severity: 'blocking', message: `${field.label} must be at most ${vc.max}`, field_label: field.label });
          }
        }
      }

      // Picklist/multi_select allowed_values check
      if ((field.field_type === 'picklist') && value && vc.allowed_values?.length) {
        if (!vc.allowed_values.includes(value)) {
          errors.push({ field_id: field.field_id, severity: 'blocking', message: `${field.label} contains an invalid selection`, field_label: field.label });
        }
      }

      // Date range checks
      if (field.field_type === 'date' && value) {
        if (vc.min_date && value < vc.min_date) {
          errors.push({ field_id: field.field_id, severity: 'blocking', message: `${field.label} must be on or after ${vc.min_date}`, field_label: field.label });
        }
        if (vc.max_date && value > vc.max_date) {
          errors.push({ field_id: field.field_id, severity: 'blocking', message: `${field.label} must be on or before ${vc.max_date}`, field_label: field.label });
        }
      }
    }

    const hasBlocking = errors.some((e) => e.severity === 'blocking');
    const allComplete = fields.every((f) => !f.is_required || f.current_response?.response_value || f.current_response?.response_json);
    const newStatus = hasBlocking ? 'error' : (allComplete ? 'complete' : 'in_progress');
    const validationStatus = hasBlocking ? 'invalid' : 'valid';

    // Persist validation results to application_sections
    await pool.query(
      `UPDATE application_sections
       SET validation_errors = $2, validation_status = $3, status = $4, updated_at = now()
       WHERE section_id = $1`,
      [sectionId, errors.length > 0 ? JSON.stringify(errors) : null, validationStatus, newStatus],
    );

    return { section_id: sectionId, validation_status: validationStatus, errors };
  }
}

export const formFieldService = new FormFieldService();
