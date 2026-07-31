export type FieldType =
  | 'text' | 'textarea' | 'number' | 'currency' | 'date'
  | 'picklist' | 'multi_select' | 'checkbox' | 'file_upload'
  | 'calculated' | 'repeating_table';

export interface ValidationConfig {
  max_length?: number;
  max_chars?: number;
  max_words?: number;
  min?: number;
  max?: number;
  decimal_places?: number;
  allowed_values?: string[];
  min_selected?: number;
  max_selected?: number;
  file_formats?: string[];
  max_size_mb?: number;
  min_date?: string;
  max_date?: string;
}

export interface FormFieldDefinition {
  field_id: string;
  opportunity_id: string;
  section_id: string;
  field_type: FieldType;
  label: string;
  placeholder?: string;
  help_text?: string;
  is_required: boolean;
  display_order: number;
  validation_config?: ValidationConfig;
  formula?: string;
  columns?: Array<{ key: string; label: string; type: FieldType }>;
  created_by: string;
  created_at: string;
  // Joined from field_responses (optional — not present if no response yet)
  current_response?: FieldResponse;
}

export interface FieldResponse {
  response_id: string;
  workspace_id: string;
  section_id: string;
  field_id: string;
  response_value?: string;
  response_json?: unknown;
  updated_by: string;
  updated_at: string;
}

export interface SaveFieldResponseInput {
  response_value?: string;
  response_json?: unknown;
}

export interface ValidationResult {
  section_id: string;
  validation_status: 'valid' | 'invalid';
  errors: Array<{
    field_id: string;
    severity: 'blocking' | 'warning' | 'info';
    message: string;
    field_label: string;
  }>;
}
