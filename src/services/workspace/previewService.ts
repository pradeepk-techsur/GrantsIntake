import { pool } from '../../db/client';

export interface PreviewData {
  workspace_id: string;
  generated_at: string;
  // CRITICAL: This label MUST appear in the output — required by PRD-INTAKE-043
  label: 'DRAFT PREVIEW — NOT SUBMITTED';
  sections: Array<{
    section_id: string;
    section_type: string;
    section_name: string;
    status: string;
    fields: Array<{ field_id: string; label: string; field_type: string; response_value?: string; response_json?: unknown }>;
  }>;
  budget: {
    budget_id?: string;
    total_federal_request?: number;
    total_match?: number;
    total_indirect?: number;
    total_project_cost?: number;
    line_items: Array<{ category: string; description: string; total_cost: number }>;
  };
  attachments: Array<{
    attachment_id: string;
    file_name?: string;
    requirement_id?: string;
    source_type: string;
    version_number: number;
  }>;
  // workspace_comments are EXCLUDED — this is enforced at the query layer (T-04-03)
}

class PreviewService {
  async generatePreview(workspaceId: string): Promise<PreviewData> {
    // Load sections with fields + responses (NO workspace_comments — enforced by query design)
    const sectionsResult = await pool.query(
      `SELECT s.section_id, s.section_type, s.section_name, s.status,
              s.display_order
       FROM application_sections s
       WHERE s.workspace_id = $1 AND s.is_visible = true
       ORDER BY s.display_order`,
      [workspaceId],
    );

    // Load field responses per section
    const sections: PreviewData['sections'] = [];
    for (const sec of sectionsResult.rows) {
      const fieldsResult = await pool.query(
        `SELECT ffd.field_id, ffd.label, ffd.field_type,
                fr.response_value, fr.response_json
         FROM form_field_definitions ffd
         LEFT JOIN field_responses fr
           ON fr.field_id = ffd.field_id AND fr.workspace_id = $1
         WHERE ffd.section_id = $2
         ORDER BY ffd.display_order`,
        [workspaceId, sec.section_id],
      );

      sections.push({
        section_id: sec.section_id,
        section_type: sec.section_type,
        section_name: sec.section_name,
        status: sec.status,
        fields: fieldsResult.rows.map((f) => ({
          field_id: f.field_id,
          label: f.label,
          field_type: f.field_type,
          response_value: f.response_value ?? undefined,
          response_json: f.response_json ?? undefined,
        })),
      });
    }

    // Budget (if exists)
    const budgetResult = await pool.query(
      `SELECT b.budget_id, b.total_federal_request, b.total_match, b.total_indirect, b.total_project_cost,
              li.category, li.description, li.total_cost
       FROM budgets b
       LEFT JOIN budget_line_items li ON li.budget_id = b.budget_id
       WHERE b.workspace_id = $1`,
      [workspaceId],
    );

    const budget: PreviewData['budget'] = { line_items: [] };
    if (budgetResult.rows.length > 0 && budgetResult.rows[0].budget_id) {
      const firstRow = budgetResult.rows[0];
      budget.budget_id = firstRow.budget_id;
      budget.total_federal_request = firstRow.total_federal_request != null ? parseFloat(firstRow.total_federal_request) : undefined;
      budget.total_match = firstRow.total_match != null ? parseFloat(firstRow.total_match) : undefined;
      budget.total_indirect = firstRow.total_indirect != null ? parseFloat(firstRow.total_indirect) : undefined;
      budget.total_project_cost = firstRow.total_project_cost != null ? parseFloat(firstRow.total_project_cost) : undefined;
      budget.line_items = budgetResult.rows
        .filter((r) => r.category != null)
        .map((r) => ({ category: r.category, description: r.description, total_cost: parseFloat(r.total_cost) }));
    }

    // Active attachments (is_active = true only — prior versions not shown in preview)
    const attachResult = await pool.query(
      `SELECT attachment_id, file_name, requirement_id, source_type, version_number
       FROM attachments WHERE workspace_id = $1 AND is_active = true
       ORDER BY uploaded_at`,
      [workspaceId],
    );

    // workspace_comments: NOT queried — enforced at query level (T-04-03)
    // The comments table is intentionally absent from ALL queries in this method.

    return {
      workspace_id: workspaceId,
      generated_at: new Date().toISOString(),
      label: 'DRAFT PREVIEW — NOT SUBMITTED',
      sections,
      budget,
      attachments: attachResult.rows,
    };
  }
}

export const previewService = new PreviewService();
