export type TemplateType =
  | 'federal_nofo'
  | 'state_grant'
  | 'philanthropic_rfp'
  | 'corporate_grant'
  | 'pass_through_subaward';

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
