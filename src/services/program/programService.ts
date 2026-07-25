import { pool } from '../../db/client';
import { Program, CreateProgramRequest } from '../../types/opportunity';

/**
 * List all non-archived programs for a grantor organization.
 * Ordered by program_name ascending.
 */
export async function list(grantorOrgId: string): Promise<Program[]> {
  const result = await pool.query<Program>(
    `SELECT program_id, grantor_org_id, program_name, program_area, is_federal,
            program_description, created_by, created_at, updated_at, archived_at
     FROM programs
     WHERE grantor_org_id = $1 AND archived_at IS NULL
     ORDER BY program_name ASC`,
    [grantorOrgId],
  );
  return result.rows;
}

/**
 * Create a new program for a grantor organization.
 * The grantorOrgId and createdBy come from the authenticated user — never from request body.
 */
export async function create(
  grantorOrgId: string,
  createdBy: string,
  data: CreateProgramRequest,
): Promise<Program> {
  const result = await pool.query<Program>(
    `INSERT INTO programs (grantor_org_id, program_name, program_area, is_federal, program_description, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING program_id, grantor_org_id, program_name, program_area, is_federal,
               program_description, created_by, created_at, updated_at, archived_at`,
    [
      grantorOrgId,
      data.program_name,
      data.program_area ?? null,
      data.is_federal ?? false,
      data.program_description ?? null,
      createdBy,
    ],
  );
  return result.rows[0];
}

/**
 * Look up the primary grantor org ID for a user.
 * Returns the first active grantor_roles org for the user.
 * Throws if user has no grantor org membership.
 */
export async function getGrantorOrgIdForUser(userId: string): Promise<string> {
  const result = await pool.query<{ grantor_org_id: string }>(
    `SELECT grantor_org_id FROM grantor_roles
     WHERE user_id = $1 AND revoked_at IS NULL
     ORDER BY created_at ASC
     LIMIT 1`,
    [userId],
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('User has no grantor organization membership'), {
      code: 'NO_GRANTOR_ORG',
      status: 403,
    });
  }

  return result.rows[0].grantor_org_id;
}
