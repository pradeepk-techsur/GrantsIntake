export type RuleType = 'applicant_type' | 'geography' | 'entity_status' | 'uei_sam' |
  'nonprofit_status' | 'tribal_status' | 'state_local_status' | 'prior_award_status' |
  'match_requirement' | 'custom';

export type RuleOperator = 'equals' | 'not_equals' | 'includes' | 'excludes' |
  'greater_than' | 'less_than' | 'is_true' | 'is_false';

export interface EligibilityRule {
  rule_id: string;
  opportunity_id: string;
  rule_type: RuleType;
  criterion_field: string;
  operator: RuleOperator;
  criterion_value: string | string[] | number;
  severity: 'hard_blocker' | 'advisory';
  enforcement_point?: 'pre_workspace' | 'pre_submission';
  explanation_text: string;
  rule_group_id?: string;
  rule_group_operator?: 'AND' | 'OR';
  display_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PrescreeningQuestionnaire {
  questionnaire_id: string;
  opportunity_id: string;
  placement: 'pre_workspace' | 'pre_submission';
  questions: PrescreeningQuestion[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PrescreeningQuestion {
  question_id: string;
  questionnaire_id: string;
  question_text: string;
  question_type: 'yes_no' | 'multiple_choice' | 'text';
  is_required: boolean;
  display_order: number;
  conditional_display?: { depends_on_question_id: string; trigger_response_value: string };
  options: PrescreeningOption[];
}

export interface PrescreeningOption {
  option_id: string;
  question_id: string;
  option_text: string;
  mapped_rule_id?: string;
  rule_outcome?: 'met' | 'violated' | 'advisory';
}
