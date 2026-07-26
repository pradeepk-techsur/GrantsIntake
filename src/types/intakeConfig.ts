export interface SectionConditionConfig {
  config_id: string;
  opportunity_id: string;
  section_key: string;
  conditions: SectionCondition[];
  condition_group_operator: 'AND' | 'OR';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SectionCondition {
  condition_type: 'applicant_type' | 'program' | 'geography' | 'funding_amount' | 'eligibility_response';
  field: string;
  operator: 'equals' | 'not_equals' | 'includes' | 'greater_than' | 'less_than';
  value: string | string[] | number;
}

export interface AttachmentRequirement {
  requirement_id: string;
  opportunity_id: string;
  document_type: string;
  custom_document_name?: string;
  applicant_type_scope: string[];
  stage_scope: 'pre_application' | 'loi' | 'full_application';
  is_required: boolean;
  instructions?: string;
  file_format_restrictions?: string[];
  max_file_size_mb: number;
  created_by: string;
  created_at: string;
}

export interface ScreeningCriterion {
  criterion_id: string;
  opportunity_id: string;
  criterion_text: string;
  criterion_type: 'auto' | 'manual';
  auto_criterion_key?: 'deadline_check' | 'completeness_check' | 'eligibility_check' | 'attachment_check' | 'duplicate_check';
  is_required: boolean;
  suggested_disposition_on_failure?: string;
  display_order: number;
  created_by: string;
  created_at: string;
}
