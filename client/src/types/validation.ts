export interface ValidationError {
  section_id: string;
  section_name: string;
  field_id?: string;
  field_label?: string;
  error_code: string;
  message: string;
  severity: 'blocking';
  link: string;
}

export interface ValidationWarning {
  section_id: string;
  section_name: string;
  field_id?: string;
  field_label?: string;
  message: string;
  severity: 'warning';
  link: string;
}

export interface ValidationInfo {
  message: string;
  severity: 'info';
}

export interface ValidationResult {
  workspace_id: string;
  blocking: ValidationError[];
  warnings: ValidationWarning[];
  informational: ValidationInfo[];
  blocking_count: number;
  validated_at: string;
}
