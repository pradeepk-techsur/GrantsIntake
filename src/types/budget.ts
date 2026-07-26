export type BudgetCategory =
  | 'personnel' | 'fringe' | 'travel' | 'equipment' | 'supplies'
  | 'contractual' | 'indirect' | 'other_direct' | 'match_cash' | 'match_in_kind';

export const BUDGET_CATEGORIES: BudgetCategory[] = [
  'personnel', 'fringe', 'travel', 'equipment', 'supplies',
  'contractual', 'indirect', 'other_direct', 'match_cash', 'match_in_kind',
];

export const MATCH_CATEGORIES: BudgetCategory[] = ['match_cash', 'match_in_kind'];
export const FEDERAL_CATEGORIES: BudgetCategory[] = [
  'personnel', 'fringe', 'travel', 'equipment', 'supplies',
  'contractual', 'indirect', 'other_direct',
];

export interface Budget {
  budget_id: string;
  workspace_id: string;
  budget_periods_count: number;
  total_federal_request: number | null;
  total_match: number | null;
  total_indirect: number | null;
  total_project_cost: number | null;
  validation_status: 'not_validated' | 'valid' | 'invalid';
  validation_errors: BudgetValidationError[] | null;
  created_at: string;
  updated_at: string;
  line_items: BudgetLineItem[];
}

export interface BudgetLineItem {
  line_id: string;
  budget_id: string;
  budget_period: number;
  category: BudgetCategory;
  description: string;
  quantity?: number;
  unit_cost?: number;
  total_cost: number;
  personnel_name?: string;
  fte?: number;
  annual_salary?: number;
  fringe_rate?: number;
  match_source?: string;
  match_type?: string;
  justification_text?: string;
  created_by: string;
  updated_at: string;
}

export interface BudgetValidationError {
  error_code: string;
  message: string;
  severity: 'blocking' | 'warning';
}

export interface CreateLineItemInput {
  budget_period?: number;
  category: BudgetCategory;
  description: string;
  quantity?: number;
  unit_cost?: number;
  total_cost: number;
  personnel_name?: string;
  fte?: number;
  annual_salary?: number;
  fringe_rate?: number;
  match_source?: string;
  match_type?: string;
  justification_text?: string;
}
