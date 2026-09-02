// Frontend types for Grants.gov external opportunities (Phase 8, PRD-INTAKE-019C/019D/019E).
// Mirrors the persisted shapes served by /api/v1/external-opportunities.

export interface ExternalOpportunity {
  id: string;
  source: string;
  source_url: string;
  source_opportunity_number: string;
  source_assistance_listing: string | null;
  api_reference: Record<string, unknown>;
  import_timestamp: string;
  last_fetched_at: string;
  title: string;
  agency: string | null;
  opportunity_status: string | null;
  eligibility_summary: string | null;
  due_date: string | null;
  award_ceiling: number | null;
  award_floor: number | null;
  application_package_url: string | null;
  raw_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Present on the detail endpoint (GET /:id) per PRD-INTAKE-019E source
  // attribution contract; absent on list payloads.
  versions?: ExternalOpportunityVersion[];
}

export interface ExternalOpportunityVersion {
  id: string;
  external_opportunity_id: string;
  version_number: number;
  changed_fields: string[];
  snapshot: Record<string, unknown>;
  fetched_at: string;
}

export interface ChangeAlert {
  id: string;
  user_id: string;
  external_opportunity_id: string;
  alert_type: string;
  previous_value: string | null;
  new_value: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ExternalOpportunityFilterParams {
  status?: string;
  keyword?: string;
  agency?: string;
  due_before?: string;
  due_after?: string;
  award_min?: number;
  award_max?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedExternalOpportunities {
  items: ExternalOpportunity[];
  total: number;
  page: number;
  limit: number;
}

export interface SavedListResponse {
  items: ExternalOpportunity[];
}

export interface AlertsResponse {
  alerts: ChangeAlert[];
}

export interface VersionsResponse {
  versions: ExternalOpportunityVersion[];
}

export interface ImportOpportunityResponse {
  opportunity_id: string;
  workspace_url: string;
  already_imported: boolean;
}

// Imported internal opportunities surfaced on /applicant/applications after the
// Grants.gov import flow (PRD-INTAKE-019C / uat/5). Mirrors the backend
// GET /external-opportunities/imported response shape.
export interface ImportedOpportunityListItem {
  opportunity_id: string;
  title: string;
  funder_name: string | null;
  program_area: string;
  max_award_amount: number | null;
  application_close_date: string | null;
  status_badge: 'open' | 'closing_soon' | 'closed';
  source: 'grants_gov_import';
  import_timestamp: string | null;
}

export interface ImportedListResponse {
  items: ImportedOpportunityListItem[];
}
