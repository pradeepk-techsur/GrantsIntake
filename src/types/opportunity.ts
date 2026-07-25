export type TemplateType =
  | 'federal_nofo'
  | 'state_grant'
  | 'philanthropic_rfp'
  | 'corporate_grant'
  | 'pass_through_subaward';

export type OpportunityStatus =
  | 'draft'
  | 'published'
  | 'closed'
  | 'archived';

export interface Opportunity {
  opportunity_id: string;
  program_id: string;
  template_id?: string | null;
  title: string;
  funding_source: string;
  announcement_type: string;
  opportunity_number: string;
  assistance_listing_number?: string | null;
  funding_amount_min?: number | null;
  funding_amount_max: number;
  total_program_funding?: number | null;
  expected_awards_min?: number | null;
  expected_awards_max?: number | null;
  eligibility_summary: string;
  executive_summary: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string | null;
  contact_title?: string | null;
  program_area: string;
  geography?: object | null;
  application_url?: string | null;
  status: OpportunityStatus;
  visibility: string;
  public_slug?: string | null;
  published_at?: Date | null;
  published_by?: string | null;
  application_open_date?: Date | null;
  application_close_date?: Date | null;
  pre_application_deadline?: Date | null;
  loi_deadline?: Date | null;
  loi_required: boolean;
  rolling_review_enabled: boolean;
  rolling_review_cadence_days?: number | null;
  deadline_timezone: string;
  qa_config?: object | null;
  review_routing_config?: object | null;
  admin_screening_enabled: boolean;
  attachments_required: boolean;
  duplicate_allowed: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOpportunityInput {
  title: string;
  funding_source: string;
  announcement_type: string;
  opportunity_number: string;
  assistance_listing_number?: string;
  funding_amount_min?: number;
  funding_amount_max: number;
  total_program_funding?: number;
  expected_awards_min?: number;
  expected_awards_max?: number;
  eligibility_summary: string;
  executive_summary: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  contact_title?: string;
  program_area: string;
  geography?: object;
  application_url?: string;
}

export interface UpdateOpportunityInput {
  title?: string;
  funding_source?: string;
  announcement_type?: string;
  opportunity_number?: string;
  assistance_listing_number?: string | null;
  funding_amount_min?: number | null;
  funding_amount_max?: number;
  total_program_funding?: number | null;
  expected_awards_min?: number | null;
  expected_awards_max?: number | null;
  eligibility_summary?: string;
  executive_summary?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string | null;
  contact_title?: string | null;
  program_area?: string;
  geography?: object | null;
  application_url?: string | null;
  status?: OpportunityStatus;
}

export interface GuidancePrompt {
  prompt_id: string;
  field_id: string;
  prompt_text: string;
  example_text?: string | null;
  uswds_tips?: string[] | null;
  updated_at: Date;
}

export type GrantMarket =
  | 'federal'
  | 'state_local'
  | 'philanthropic'
  | 'corporate'
  | 'pass_through';

export interface OpportunityTemplate {
  template_id: string;
  template_name: string;
  template_type: TemplateType;
  grant_market?: string;
  default_sections?: object;
  default_metadata?: object;
  is_system_template: boolean;
  owner_org_id?: string | null;
  created_by?: string | null;
  created_at: Date;
}

export interface Program {
  program_id: string;
  grantor_org_id: string;
  program_name: string;
  program_area?: string | null;
  is_federal: boolean;
  program_description?: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  archived_at?: Date | null;
}

export interface CreateProgramRequest {
  program_name: string;
  program_area?: string;
  is_federal?: boolean;
  program_description?: string;
}
