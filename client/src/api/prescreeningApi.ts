import apiClient from './client';

export interface EligibilityResult {
  overall_result: 'eligible' | 'likely_eligible' | 'needs_attention' | 'ineligible';
  triggered_rules: Array<{
    rule_id: string;
    severity: 'hard_blocker' | 'advisory';
    explanation_text: string;
    opportunity_section_link?: string;
  }>;
  next_step: string;
  workspace_access_granted: boolean;
}

export interface PrescreeningQuestion {
  question_id: string;
  question_text: string;
  question_type: 'yes_no' | 'multiple_choice' | 'text';
  is_required: boolean;
  options: Array<{
    option_id: string;
    option_text: string;
    mapped_rule_id?: string;
  }>;
  // Conditional display: question only shown when parent response matches trigger value
  show_if?: {
    depends_on_question_id: string;
    trigger_response_value: string;
  };
  display_order: number;
}

export interface PrescreeningQuestionnaire {
  questionnaire_id: string | null;
  questions: PrescreeningQuestion[];
}

export interface SubmitResponseInput {
  question_id: string;
  selected_option_id?: string;
  response_text?: string;
}

export const prescreeningApi = {
  async getQuestionnaire(opportunityId: string): Promise<PrescreeningQuestionnaire> {
    const { data } = await apiClient.get(`/opportunities/${opportunityId}/prescreening/applicant`);
    return data;
  },
  async submitResponses(
    opportunityId: string,
    responses: SubmitResponseInput[],
  ): Promise<EligibilityResult> {
    const { data } = await apiClient.post(
      `/opportunities/${opportunityId}/prescreening/submit`,
      { responses },
    );
    return data;
  },
  async getMyResult(opportunityId: string): Promise<EligibilityResult> {
    const { data } = await apiClient.get(
      `/opportunities/${opportunityId}/prescreening/my-result`,
    );
    return data;
  },
};
