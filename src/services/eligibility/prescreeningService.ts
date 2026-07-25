import { pool } from '../../db/client';
import { PrescreeningQuestionnaire, PrescreeningQuestion, PrescreeningOption } from '../../types/eligibility';

export interface UpsertPrescreeningInput {
  placement: 'pre_workspace' | 'pre_submission';
  questions: UpsertQuestionInput[];
}

export interface UpsertQuestionInput {
  question_text: string;
  question_type: 'yes_no' | 'multiple_choice' | 'text';
  is_required: boolean;
  display_order: number;
  conditional_display?: { depends_on_question_id: string; trigger_response_value: string } | null;
  options?: UpsertOptionInput[];
}

export interface UpsertOptionInput {
  option_text: string;
  mapped_rule_id?: string | null;
  rule_outcome?: 'met' | 'violated' | 'advisory' | null;
}

interface QuestionRow {
  question_id: string;
  questionnaire_id: string;
  question_text: string;
  question_type: 'yes_no' | 'multiple_choice' | 'text';
  is_required: boolean;
  display_order: number;
  conditional_display: { depends_on_question_id: string; trigger_response_value: string } | null;
}

interface OptionRow {
  option_id: string;
  question_id: string;
  option_text: string;
  mapped_rule_id: string | null;
  rule_outcome: 'met' | 'violated' | 'advisory' | null;
}

interface QuestionnaireRow {
  questionnaire_id: string;
  opportunity_id: string;
  placement: 'pre_workspace' | 'pre_submission';
  created_by: string;
  created_at: string;
  updated_at: string;
}

class PrescreeningService {
  /**
   * Get the prescreening questionnaire for an opportunity, with nested questions and options.
   * Returns null if no questionnaire exists yet.
   */
  async get(opportunity_id: string): Promise<PrescreeningQuestionnaire | null> {
    // Fetch questionnaire
    const qResult = await pool.query<QuestionnaireRow>(
      `SELECT questionnaire_id, opportunity_id, placement, created_by, created_at, updated_at
       FROM prescreening_questionnaires
       WHERE opportunity_id = $1`,
      [opportunity_id],
    );

    if (qResult.rows.length === 0) {
      return null;
    }

    const questionnaire = qResult.rows[0];

    // Fetch questions ordered by display_order
    const questionResult = await pool.query<QuestionRow>(
      `SELECT question_id, questionnaire_id, question_text, question_type,
              is_required, display_order, conditional_display
       FROM prescreening_questions
       WHERE questionnaire_id = $1
       ORDER BY display_order ASC, question_id ASC`,
      [questionnaire.questionnaire_id],
    );

    const questions = questionResult.rows;

    // Fetch all options for these questions
    let optionsByQuestion: Record<string, PrescreeningOption[]> = {};
    if (questions.length > 0) {
      const questionIds = questions.map((q) => q.question_id);
      const optionResult = await pool.query<OptionRow>(
        `SELECT option_id, question_id, option_text, mapped_rule_id, rule_outcome
         FROM prescreening_options
         WHERE question_id = ANY($1::uuid[])`,
        [questionIds],
      );
      for (const option of optionResult.rows) {
        if (!optionsByQuestion[option.question_id]) {
          optionsByQuestion[option.question_id] = [];
        }
        optionsByQuestion[option.question_id].push({
          option_id: option.option_id,
          question_id: option.question_id,
          option_text: option.option_text,
          mapped_rule_id: option.mapped_rule_id ?? undefined,
          rule_outcome: option.rule_outcome ?? undefined,
        });
      }
    }

    // Build nested response
    const nestedQuestions: PrescreeningQuestion[] = questions.map((q) => ({
      question_id: q.question_id,
      questionnaire_id: q.questionnaire_id,
      question_text: q.question_text,
      question_type: q.question_type,
      is_required: q.is_required,
      display_order: q.display_order,
      conditional_display: q.conditional_display ?? undefined,
      options: optionsByQuestion[q.question_id] ?? [],
    }));

    return {
      questionnaire_id: questionnaire.questionnaire_id,
      opportunity_id: questionnaire.opportunity_id,
      placement: questionnaire.placement,
      questions: nestedQuestions,
      created_by: questionnaire.created_by,
      created_at: questionnaire.created_at,
      updated_at: questionnaire.updated_at,
    };
  }

  /**
   * Upsert a prescreening questionnaire for an opportunity.
   * - Inserts or updates the questionnaire row
   * - Deletes and reinserts all questions and options
   * Wrapped in a transaction.
   */
  async upsert(
    opportunity_id: string,
    data: UpsertPrescreeningInput,
    user_id: string,
  ): Promise<PrescreeningQuestionnaire> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Upsert questionnaire
      const qResult = await client.query<QuestionnaireRow>(
        `INSERT INTO prescreening_questionnaires (opportunity_id, placement, created_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (opportunity_id) DO UPDATE
           SET placement = EXCLUDED.placement,
               updated_at = now()
         RETURNING questionnaire_id, opportunity_id, placement, created_by, created_at, updated_at`,
        [opportunity_id, data.placement, user_id],
      );

      const questionnaire = qResult.rows[0];
      const questionnaire_id = questionnaire.questionnaire_id;

      // Delete all existing questions (options cascade via FK)
      await client.query(
        `DELETE FROM prescreening_options
         WHERE question_id IN (
           SELECT question_id FROM prescreening_questions WHERE questionnaire_id = $1
         )`,
        [questionnaire_id],
      );
      await client.query(
        `DELETE FROM prescreening_questions WHERE questionnaire_id = $1`,
        [questionnaire_id],
      );

      // Reinsert questions and options
      const nestedQuestions: PrescreeningQuestion[] = [];
      for (const q of data.questions) {
        const conditionalJson = q.conditional_display ? JSON.stringify(q.conditional_display) : null;
        const qInsert = await client.query<QuestionRow>(
          `INSERT INTO prescreening_questions
             (questionnaire_id, question_text, question_type, is_required, display_order, conditional_display)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb)
           RETURNING question_id, questionnaire_id, question_text, question_type,
                     is_required, display_order, conditional_display`,
          [
            questionnaire_id,
            q.question_text,
            q.question_type,
            q.is_required,
            q.display_order,
            conditionalJson,
          ],
        );

        const insertedQuestion = qInsert.rows[0];
        const options: PrescreeningOption[] = [];

        if (q.options && q.options.length > 0) {
          for (const opt of q.options) {
            const optInsert = await client.query<OptionRow>(
              `INSERT INTO prescreening_options
                 (question_id, option_text, mapped_rule_id, rule_outcome)
               VALUES ($1, $2, $3, $4)
               RETURNING option_id, question_id, option_text, mapped_rule_id, rule_outcome`,
              [
                insertedQuestion.question_id,
                opt.option_text,
                opt.mapped_rule_id ?? null,
                opt.rule_outcome ?? null,
              ],
            );
            const optRow = optInsert.rows[0];
            options.push({
              option_id: optRow.option_id,
              question_id: optRow.question_id,
              option_text: optRow.option_text,
              mapped_rule_id: optRow.mapped_rule_id ?? undefined,
              rule_outcome: optRow.rule_outcome ?? undefined,
            });
          }
        }

        nestedQuestions.push({
          question_id: insertedQuestion.question_id,
          questionnaire_id: insertedQuestion.questionnaire_id,
          question_text: insertedQuestion.question_text,
          question_type: insertedQuestion.question_type,
          is_required: insertedQuestion.is_required,
          display_order: insertedQuestion.display_order,
          conditional_display: insertedQuestion.conditional_display ?? undefined,
          options,
        });
      }

      await client.query('COMMIT');

      return {
        questionnaire_id: questionnaire.questionnaire_id,
        opportunity_id: questionnaire.opportunity_id,
        placement: questionnaire.placement,
        questions: nestedQuestions,
        created_by: questionnaire.created_by,
        created_at: questionnaire.created_at,
        updated_at: questionnaire.updated_at,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Generate a preview of the prescreening questionnaire as an applicant would see it.
   * Flattens conditional_display into a displayable format.
   */
  async preview(opportunity_id: string): Promise<{
    opportunity_id: string;
    placement: string;
    questions: Array<{
      question_id: string;
      question_text: string;
      question_type: string;
      is_required: boolean;
      show_if?: { depends_on_question_id: string; trigger_response_value: string };
      options: Array<{ option_id: string; option_text: string }>;
    }>;
  } | null> {
    const questionnaire = await this.get(opportunity_id);
    if (!questionnaire) return null;

    return {
      opportunity_id,
      placement: questionnaire.placement,
      questions: questionnaire.questions.map((q) => ({
        question_id: q.question_id,
        question_text: q.question_text,
        question_type: q.question_type,
        is_required: q.is_required,
        // Flatten conditional_display into show_if for applicant-facing view
        ...(q.conditional_display
          ? { show_if: q.conditional_display }
          : {}),
        options: q.options.map((opt) => ({
          option_id: opt.option_id,
          option_text: opt.option_text,
          // Do NOT expose mapped_rule_id or rule_outcome in applicant preview
        })),
      })),
    };
  }
}

export const prescreeningService = new PrescreeningService();
