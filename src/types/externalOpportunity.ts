// Types for Grants.gov external opportunity ingestion (Phase 8, PRD-INTAKE-019A–019E)

// ─── Grants.gov raw API shapes ───────────────────────────────────────────────

export interface GrantsGovSearchParams {
  keyword?: string;
  rows?: number;
  startRecordNum?: number;
  oppStatuses?: string; // e.g. 'posted' or 'forecasted|posted'
  agencies?: string;
}

// One entry in the Grants.gov search2 response `oppHits` array
export interface GrantsGovSearchHit {
  id: string; // Grants.gov internal opportunity id
  number: string; // funding opportunity number (FON)
  title: string;
  agencyCode?: string;
  agency?: string;
  agencyName?: string;
  openDate?: string;
  closeDate?: string;
  oppStatus?: string;
  cfdaList?: string[];
  docType?: string;
}

export interface GrantsGovSearchResult {
  opportunityId: string;
  opportunityNumber: string;
  title: string;
  agency?: string;
  status?: string;
  closeDate?: string;
  cfdaNumbers?: string[];
  raw: GrantsGovSearchHit;
}

// Detail response for a single opportunity (fetchOpportunity endpoint)
export interface GrantsGovDetail {
  id?: string | number;
  opportunityId?: string;
  opportunityNumber?: string;
  opportunityTitle?: string;
  agencyName?: string;
  agencyCode?: string;
  opportunityStatus?: string;
  closeDate?: string;
  awardCeiling?: string | number;
  awardFloor?: string | number;
  cfdaNumbers?: string[];
  cfdaList?: string[];
  eligibilityTypes?: string[];
  applicantEligibilityDesc?: string;
  eligibilityDesc?: string;
  synopsis?: Record<string, unknown>;
  packages?: Array<{ packageURL?: string; id?: string }>;
  [key: string]: unknown;
}

// ─── Internal normalized shape ──────────────────────────────────────────────

export interface NormalizedOpportunity {
  source: string;
  source_url: string;
  source_opportunity_number: string;
  source_assistance_listing: string | null;
  api_reference: Record<string, unknown>;
  title: string;
  agency: string | null;
  opportunity_status: string | null;
  eligibility_summary: string | null;
  due_date: string | null; // ISO date (YYYY-MM-DD) or null
  award_ceiling: number | null;
  award_floor: number | null;
  application_package_url: string | null;
  raw_metadata: Record<string, unknown>;
}

// ─── Persisted record shapes ────────────────────────────────────────────────

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

export interface FilterParams {
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

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
