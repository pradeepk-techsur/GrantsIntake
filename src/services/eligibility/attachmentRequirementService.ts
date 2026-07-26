import { pool } from '../../db/client';
import { AttachmentRequirement } from '../../types/intakeConfig';

const VALID_STAGE_SCOPES = ['pre_application', 'loi', 'full_application'] as const;
type StageScope = typeof VALID_STAGE_SCOPES[number];

export interface CreateAttachmentRequirementInput {
  document_type: string;
  custom_document_name?: string;
  applicant_type_scope?: string[];
  stage_scope: StageScope;
  is_required?: boolean;
  instructions?: string;
  file_format_restrictions?: string[];
  max_file_size_mb?: number;
}

export interface UpdateAttachmentRequirementInput {
  document_type?: string;
  custom_document_name?: string;
  applicant_type_scope?: string[];
  stage_scope?: StageScope;
  is_required?: boolean;
  instructions?: string;
  file_format_restrictions?: string[];
  max_file_size_mb?: number;
}

class AttachmentRequirementService {
  /**
   * List all attachment requirements for an opportunity, ordered by stage_scope, document_type.
   */
  async list(opportunity_id: string): Promise<AttachmentRequirement[]> {
    const result = await pool.query<AttachmentRequirement>(
      `SELECT requirement_id, opportunity_id, document_type, custom_document_name,
              applicant_type_scope, stage_scope, is_required, instructions,
              file_format_restrictions, max_file_size_mb, created_by, created_at
       FROM attachment_requirements
       WHERE opportunity_id = $1
       ORDER BY stage_scope ASC, document_type ASC`,
      [opportunity_id],
    );
    return result.rows;
  }

  /**
   * Create an attachment requirement.
   * Validates stage_scope and max_file_size_mb.
   */
  async create(
    opportunity_id: string,
    data: CreateAttachmentRequirementInput,
    user_id: string,
  ): Promise<AttachmentRequirement> {
    // Validate stage_scope
    if (!VALID_STAGE_SCOPES.includes(data.stage_scope as StageScope)) {
      const err = new Error(
        `Invalid stage_scope. Must be one of: ${VALID_STAGE_SCOPES.join(', ')}`,
      ) as Error & { status: number; code: string };
      err.status = 400;
      err.code = 'INVALID_STAGE_SCOPE';
      throw err;
    }

    // Validate max_file_size_mb (1–500)
    const maxSize = data.max_file_size_mb ?? 50;
    if (maxSize < 1 || maxSize > 500) {
      const err = new Error('max_file_size_mb must be between 1 and 500') as Error & {
        status: number;
        code: string;
      };
      err.status = 400;
      err.code = 'INVALID_MAX_FILE_SIZE';
      throw err;
    }

    // Validate file_format_restrictions length (max 20 entries, each ≤10 chars)
    if (data.file_format_restrictions) {
      if (data.file_format_restrictions.length > 20) {
        const err = new Error('file_format_restrictions cannot exceed 20 entries') as Error & {
          status: number;
          code: string;
        };
        err.status = 422;
        err.code = 'VALIDATION_ERROR';
        throw err;
      }
      for (const ext of data.file_format_restrictions) {
        if (ext.length > 10) {
          const err = new Error('Each file extension cannot exceed 10 characters') as Error & {
            status: number;
            code: string;
          };
          err.status = 422;
          err.code = 'VALIDATION_ERROR';
          throw err;
        }
      }
    }

    const result = await pool.query<AttachmentRequirement>(
      `INSERT INTO attachment_requirements
         (opportunity_id, document_type, custom_document_name, applicant_type_scope,
          stage_scope, is_required, instructions, file_format_restrictions,
          max_file_size_mb, created_by)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8::jsonb, $9, $10)
       RETURNING requirement_id, opportunity_id, document_type, custom_document_name,
                 applicant_type_scope, stage_scope, is_required, instructions,
                 file_format_restrictions, max_file_size_mb, created_by, created_at`,
      [
        opportunity_id,
        data.document_type,
        data.custom_document_name ?? null,
        JSON.stringify(data.applicant_type_scope ?? []),
        data.stage_scope,
        data.is_required ?? true,
        data.instructions ?? null,
        JSON.stringify(data.file_format_restrictions ?? null),
        maxSize,
        user_id,
      ],
    );
    return result.rows[0];
  }

  /**
   * Update an attachment requirement.
   * Verifies the requirement belongs to an opportunity the caller has grantor membership in.
   */
  async update(
    requirement_id: string,
    data: UpdateAttachmentRequirementInput,
    user_id: string,
  ): Promise<AttachmentRequirement> {
    // Verify the requirement exists and the caller has access (T-02-09 IDOR protection)
    const existingResult = await pool.query<{ opportunity_id: string; grantor_org_id: string }>(
      `SELECT ar.opportunity_id, p.grantor_org_id
       FROM attachment_requirements ar
       JOIN opportunities o ON ar.opportunity_id = o.opportunity_id
       JOIN programs p ON o.program_id = p.program_id
       WHERE ar.requirement_id = $1`,
      [requirement_id],
    );

    if (existingResult.rows.length === 0) {
      const err = new Error('Attachment requirement not found') as Error & {
        status: number;
        code: string;
      };
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // Verify caller has grantor membership
    const grantorOrgCheck = await pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM grantor_roles
       WHERE grantor_org_id = $1 AND user_id = $2`,
      [existingResult.rows[0].grantor_org_id, user_id],
    );
    if (parseInt(grantorOrgCheck.rows[0].count) === 0) {
      const err = new Error('Attachment requirement not found or access denied') as Error & {
        status: number;
        code: string;
      };
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // Validate stage_scope if provided
    if (data.stage_scope && !VALID_STAGE_SCOPES.includes(data.stage_scope)) {
      const err = new Error(
        `Invalid stage_scope. Must be one of: ${VALID_STAGE_SCOPES.join(', ')}`,
      ) as Error & { status: number; code: string };
      err.status = 400;
      err.code = 'INVALID_STAGE_SCOPE';
      throw err;
    }

    // Validate max_file_size_mb if provided
    if (data.max_file_size_mb !== undefined && (data.max_file_size_mb < 1 || data.max_file_size_mb > 500)) {
      const err = new Error('max_file_size_mb must be between 1 and 500') as Error & {
        status: number;
        code: string;
      };
      err.status = 400;
      err.code = 'INVALID_MAX_FILE_SIZE';
      throw err;
    }

    // Build SET clause dynamically
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    if (data.document_type !== undefined) {
      setClauses.push(`document_type = $${paramIdx++}`);
      values.push(data.document_type);
    }
    if (data.custom_document_name !== undefined) {
      setClauses.push(`custom_document_name = $${paramIdx++}`);
      values.push(data.custom_document_name);
    }
    if (data.applicant_type_scope !== undefined) {
      setClauses.push(`applicant_type_scope = $${paramIdx++}::jsonb`);
      values.push(JSON.stringify(data.applicant_type_scope));
    }
    if (data.stage_scope !== undefined) {
      setClauses.push(`stage_scope = $${paramIdx++}`);
      values.push(data.stage_scope);
    }
    if (data.is_required !== undefined) {
      setClauses.push(`is_required = $${paramIdx++}`);
      values.push(data.is_required);
    }
    if (data.instructions !== undefined) {
      setClauses.push(`instructions = $${paramIdx++}`);
      values.push(data.instructions);
    }
    if (data.file_format_restrictions !== undefined) {
      setClauses.push(`file_format_restrictions = $${paramIdx++}::jsonb`);
      values.push(JSON.stringify(data.file_format_restrictions));
    }
    if (data.max_file_size_mb !== undefined) {
      setClauses.push(`max_file_size_mb = $${paramIdx++}`);
      values.push(data.max_file_size_mb);
    }

    if (setClauses.length === 0) {
      // Nothing to update — just return current record
      const current = await pool.query<AttachmentRequirement>(
        `SELECT requirement_id, opportunity_id, document_type, custom_document_name,
                applicant_type_scope, stage_scope, is_required, instructions,
                file_format_restrictions, max_file_size_mb, created_by, created_at
         FROM attachment_requirements WHERE requirement_id = $1`,
        [requirement_id],
      );
      return current.rows[0];
    }

    values.push(requirement_id);

    const result = await pool.query<AttachmentRequirement>(
      `UPDATE attachment_requirements
       SET ${setClauses.join(', ')}
       WHERE requirement_id = $${paramIdx}
       RETURNING requirement_id, opportunity_id, document_type, custom_document_name,
                 applicant_type_scope, stage_scope, is_required, instructions,
                 file_format_restrictions, max_file_size_mb, created_by, created_at`,
      values,
    );
    return result.rows[0];
  }

  /**
   * Delete an attachment requirement.
   */
  async delete(requirement_id: string): Promise<void> {
    const result = await pool.query(
      `DELETE FROM attachment_requirements WHERE requirement_id = $1`,
      [requirement_id],
    );
    if (result.rowCount === 0) {
      const err = new Error('Attachment requirement not found') as Error & {
        status: number;
        code: string;
      };
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
  }
}

export const attachmentRequirementService = new AttachmentRequirementService();
