import { pool } from '../../db/client';

export interface SubmittedResponse {
  question_id: string;
  selected_option_id?: string;
  response_text?: string;
}

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

interface EligibilityRuleRow {
  rule_id: string;
  criterion_field: string;
  operator: string;
  criterion_value: unknown;
  severity: 'hard_blocker' | 'advisory';
  explanation_text: string;
  opportunity_section_link?: string;
}

interface QuestionWithOptions {
  question_id: string;
  question_text: string;
  question_type: string;
  conditional_display: { depends_on_question_id: string; trigger_response_value: string } | null;
  display_order: number;
  options: Array<{
    option_id: string;
    option_text: string;
    mapped_rule_id: string | null;
  }> | null;
}

class PrescreeningEvaluationService {
  /**
   * Evaluate submitted responses against eligibility_rules for an opportunity.
   * Stores responses in eligibility_responses table.
   * Returns EligibilityResult.
   *
   * Throws 409 AppError with code ALREADY_SUBMITTED if this org has already
   * submitted for this opportunity.
   */
  async evaluateResponses(
    opportunityId: string,
    orgId: string,
    responses: SubmittedResponse[],
  ): Promise<EligibilityResult> {
    // Step 1: Check if already submitted
    const alreadySubmitted = await pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM eligibility_responses
       WHERE opportunity_id = $1 AND org_id = $2`,
      [opportunityId, orgId],
    );
    if (parseInt(alreadySubmitted.rows[0].count) > 0) {
      const err = new Error('Eligibility pre-screen already completed for this opportunity.') as Error & {
        status: number;
        code: string;
      };
      err.status = 409;
      err.code = 'ALREADY_SUBMITTED';
      throw err;
    }

    // Step 2: Load eligibility_rules for this opportunity
    const rulesResult = await pool.query<EligibilityRuleRow>(
      `SELECT rule_id, criterion_field, operator, criterion_value, severity, explanation_text
       FROM eligibility_rules
       WHERE opportunity_id = $1
       ORDER BY display_order`,
      [opportunityId],
    );
    const rulesMap = new Map<string, EligibilityRuleRow>();
    for (const rule of rulesResult.rows) {
      rulesMap.set(rule.rule_id, rule);
    }

    // Step 3: Load prescreening_questions with options and rule links
    const questionsResult = await pool.query<QuestionWithOptions>(
      `SELECT q.question_id, q.question_text, q.question_type,
              q.conditional_display, q.display_order,
              json_agg(
                json_build_object(
                  'option_id', o.option_id,
                  'option_text', o.option_text,
                  'mapped_rule_id', o.mapped_rule_id
                ) ORDER BY o.option_id
              ) FILTER (WHERE o.option_id IS NOT NULL) AS options
       FROM prescreening_questions q
       JOIN prescreening_questionnaires pq ON pq.questionnaire_id = q.questionnaire_id
       LEFT JOIN prescreening_options o ON o.question_id = q.question_id
       WHERE pq.opportunity_id = $1
       GROUP BY q.question_id, q.question_text, q.question_type,
                q.conditional_display, q.display_order
       ORDER BY q.display_order`,
      [opportunityId],
    );

    const questionsMap = new Map<string, QuestionWithOptions>();
    for (const q of questionsResult.rows) {
      questionsMap.set(q.question_id, q);
    }

    // Step 4: Build response map
    const responseMap = new Map<string, SubmittedResponse>();
    for (const r of responses) {
      responseMap.set(r.question_id, r);
    }

    // Step 5: Determine which questions were actually visible
    // (for conditional questions, check if parent response matched)
    const visibleQuestions = new Set<string>();
    for (const [questionId, question] of questionsMap) {
      if (!question.conditional_display) {
        visibleQuestions.add(questionId);
      } else {
        const parentResponse = responseMap.get(question.conditional_display.depends_on_question_id);
        if (parentResponse) {
          // For yes_no questions the response_text holds 'yes'/'no'
          const matchesText = parentResponse.response_text === question.conditional_display.trigger_response_value;
          if (matchesText) {
            visibleQuestions.add(questionId);
          }
        }
      }
    }

    // Step 6: Evaluate each response against triggered rules
    const triggeredRules: EligibilityResult['triggered_rules'] = [];
    const triggeredRuleIds = new Set<string>();

    // Map from question_id to which rule it triggered (for per-row evaluation)
    const responseRuleMap = new Map<string, { rule_id: string; severity: 'hard_blocker' | 'advisory' }>();

    for (const response of responses) {
      const question = questionsMap.get(response.question_id);
      if (!question) continue;

      if (response.selected_option_id) {
        // Find the option in the question's options
        const options = question.options ?? [];
        const selectedOption = options.find((o) => o.option_id === response.selected_option_id);
        if (selectedOption?.mapped_rule_id) {
          const rule = rulesMap.get(selectedOption.mapped_rule_id);
          if (rule && !triggeredRuleIds.has(rule.rule_id)) {
            triggeredRuleIds.add(rule.rule_id);
            triggeredRules.push({
              rule_id: rule.rule_id,
              severity: rule.severity,
              explanation_text: rule.explanation_text,
              ...(rule.opportunity_section_link ? { opportunity_section_link: rule.opportunity_section_link } : {}),
            });
          }
          if (rule) {
            responseRuleMap.set(response.question_id, { rule_id: rule.rule_id, severity: rule.severity });
          }
        }
      }
    }

    // Step 7: Determine overall_result
    const hardBlockers = triggeredRules.filter((r) => r.severity === 'hard_blocker');
    const advisories = triggeredRules.filter((r) => r.severity === 'advisory');

    let overall_result: EligibilityResult['overall_result'];
    if (hardBlockers.length > 0) {
      overall_result = 'ineligible';
    } else if (advisories.length >= 3) {
      overall_result = 'needs_attention';
    } else if (advisories.length >= 1) {
      overall_result = 'likely_eligible';
    } else {
      overall_result = 'eligible';
    }

    // Step 8: Determine next_step
    const nextStepMap: Record<EligibilityResult['overall_result'], string> = {
      eligible: 'You may proceed to create an application workspace.',
      likely_eligible: 'You appear eligible but should review the advisory notes before proceeding.',
      needs_attention: 'Please review the items below with your team before proceeding.',
      ineligible:
        'Based on your responses, your organization does not meet the eligibility requirements for this opportunity.',
    };
    const next_step = nextStepMap[overall_result];

    // Step 9: workspace_access_granted
    const workspace_access_granted = overall_result !== 'ineligible';

    // Step 10: Compute rule_evaluation_result per response and INSERT all rows
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const response of responses) {
        const isVisible = visibleQuestions.has(response.question_id);
        const triggeredRule = responseRuleMap.get(response.question_id);

        let rule_evaluation_result: string;
        if (!isVisible) {
          rule_evaluation_result = 'not_applicable';
        } else if (triggeredRule) {
          rule_evaluation_result = triggeredRule.severity === 'hard_blocker' ? 'violated' : 'advisory';
        } else {
          rule_evaluation_result = 'met';
        }

        await client.query(
          `INSERT INTO eligibility_responses
             (opportunity_id, org_id, question_id, selected_option_id, response_text,
              rule_evaluation_result, overall_result)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (opportunity_id, org_id, question_id) DO NOTHING`,
          [
            opportunityId,
            orgId,
            response.question_id,
            response.selected_option_id ?? null,
            response.response_text ?? null,
            rule_evaluation_result,
            overall_result,
          ],
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    // Step 11: Return result
    return {
      overall_result,
      triggered_rules: triggeredRules,
      next_step,
      workspace_access_granted,
    };
  }
}

export const prescreeningEvaluationService = new PrescreeningEvaluationService();
