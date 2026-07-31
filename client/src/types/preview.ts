/**
 * Client-side preview types mirroring server-side PreviewData from previewService.ts
 * Corresponds to GET /api/v1/workspaces/:id/preview (PRD-INTAKE-043).
 */

export interface PreviewData {
  workspace_id: string;
  generated_at: string;
  /** CRITICAL: This label must appear prominently in the UI — required by PRD-INTAKE-043 */
  label: 'DRAFT PREVIEW — NOT SUBMITTED';
  sections: Array<{
    section_id: string;
    section_type: string;
    section_name: string;
    status: string;
    fields: Array<{
      field_id: string;
      label: string;
      field_type: string;
      response_value?: string;
      response_json?: unknown;
    }>;
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
  // workspace_comments are NEVER included — enforced at API layer (T-04-03, PRD-INTAKE-033)
}
