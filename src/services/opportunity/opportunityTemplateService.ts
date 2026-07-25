import { pool } from '../../db/client';
import { OpportunityTemplate } from '../../types/opportunity';

interface ListFilters {
  template_type?: string;
  callerOrgId?: string;
}

/**
 * List opportunity templates.
 * Returns system templates (is_system_template=true) plus any org-owned templates
 * for the caller's org (owner_org_id = callerOrgId).
 * Optionally filtered by template_type.
 * Mitigates T-02-03: parameterized query; org-private templates filtered to caller's org only.
 */
export async function list(filters: ListFilters = {}): Promise<OpportunityTemplate[]> {
  const params: unknown[] = [];
  let whereClause = 'WHERE (is_system_template = TRUE';

  if (filters.callerOrgId) {
    params.push(filters.callerOrgId);
    whereClause += ` OR owner_org_id = $${params.length}`;
  }
  whereClause += ')';

  if (filters.template_type) {
    params.push(filters.template_type);
    whereClause += ` AND template_type = $${params.length}`;
  }

  const sql = `
    SELECT template_id, template_name, template_type, grant_market,
           default_sections, default_metadata, is_system_template,
           owner_org_id, created_by, created_at
    FROM opportunity_templates
    ${whereClause}
    ORDER BY is_system_template DESC, template_name ASC
  `;

  const result = await pool.query<OpportunityTemplate>(sql, params);
  return result.rows;
}

/**
 * Get a single template by ID.
 * Throws 404 if not found.
 */
export async function getById(templateId: string): Promise<OpportunityTemplate> {
  const result = await pool.query<OpportunityTemplate>(
    `SELECT template_id, template_name, template_type, grant_market,
            default_sections, default_metadata, is_system_template,
            owner_org_id, created_by, created_at
     FROM opportunity_templates
     WHERE template_id = $1`,
    [templateId],
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('Template not found'), {
      code: 'NOT_FOUND',
      status: 404,
    });
  }

  return result.rows[0];
}
