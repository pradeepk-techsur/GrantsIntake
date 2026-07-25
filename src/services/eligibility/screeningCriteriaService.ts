import { pool } from '../../db/client';
import { ScreeningCriterion } from '../../types/intakeConfig';

const VALID_AUTO_CRITERION_KEYS = [
  'deadline_check',
  'completeness_check',
  'eligibility_check',
  'attachment_check',
  'duplicate_check',
] as const;
type AutoCriterionKey = typeof VALID_AUTO_CRITERION_KEYS[number];

export interface CreateScreeningCriterionInput {
  criterion_text: string;
  criterion_type: 'auto' | 'manual';
  auto_criterion_key?: AutoCriterionKey;
  is_required?: boolean;
  suggested_disposition_on_failure?: string;
  display_order?: number;
}

export interface UpdateScreeningCriterionInput {
  criterion_text?: string;
  is_required?: boolean;
  suggested_disposition_on_failure?: string;
  display_order?: number;
}

class ScreeningCriteriaService {
  /**
   * List all screening criteria for an opportunity, ordered by display_order.
   */
  async list(opportunity_id: string): Promise<ScreeningCriterion[]> {
    const result = await pool.query<ScreeningCriterion>(
      `SELECT criterion_id, opportunity_id, criterion_text, criterion_type,
              auto_criterion_key, is_required, suggested_disposition_on_failure,
              display_order, created_by, created_at
       FROM screening_criteria
       WHERE opportunity_id = $1
       ORDER BY display_order ASC, created_at ASC`,
      [opportunity_id],
    );
    return result.rows;
  }

  /**
   * Create a screening criterion.
   * Validates auto_criterion_key for auto-type criteria.
   */
  async create(
    opportunity_id: string,
    data: CreateScreeningCriterionInput,
    user_id: string,
  ): Promise<ScreeningCriterion> {
    // Validate: if criterion_type='auto', auto_criterion_key must be one of the 5 valid values
    if (data.criterion_type === 'auto') {
      if (!data.auto_criterion_key || !VALID_AUTO_CRITERION_KEYS.includes(data.auto_criterion_key)) {
        const err = new Error(
          `Auto criteria require a valid auto_criterion_key. Must be one of: ${VALID_AUTO_CRITERION_KEYS.join(', ')}`,
        ) as Error & { status: number; code: string };
        err.status = 400;
        err.code = 'INVALID_AUTO_CRITERION_KEY';
        throw err;
      }
    }

    const result = await pool.query<ScreeningCriterion>(
      `INSERT INTO screening_criteria
         (opportunity_id, criterion_text, criterion_type, auto_criterion_key,
          is_required, suggested_disposition_on_failure, display_order, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING criterion_id, opportunity_id, criterion_text, criterion_type,
                 auto_criterion_key, is_required, suggested_disposition_on_failure,
                 display_order, created_by, created_at`,
      [
        opportunity_id,
        data.criterion_text,
        data.criterion_type,
        data.auto_criterion_key ?? null,
        data.is_required ?? true,
        data.suggested_disposition_on_failure ?? null,
        data.display_order ?? 0,
        user_id,
      ],
    );
    return result.rows[0];
  }

  /**
   * Update a screening criterion.
   * Rejects changes to auto_criterion_key for auto-type criteria.
   */
  async update(
    criterion_id: string,
    data: UpdateScreeningCriterionInput,
    user_id: string,
  ): Promise<ScreeningCriterion> {
    // Fetch existing to check type
    const existingResult = await pool.query<ScreeningCriterion>(
      `SELECT criterion_id, criterion_type FROM screening_criteria WHERE criterion_id = $1`,
      [criterion_id],
    );

    if (existingResult.rows.length === 0) {
      const err = new Error('Screening criterion not found') as Error & {
        status: number;
        code: string;
      };
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // Build SET clause dynamically
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    if (data.criterion_text !== undefined) {
      setClauses.push(`criterion_text = $${paramIdx++}`);
      values.push(data.criterion_text);
    }
    if (data.is_required !== undefined) {
      setClauses.push(`is_required = $${paramIdx++}`);
      values.push(data.is_required);
    }
    if (data.suggested_disposition_on_failure !== undefined) {
      setClauses.push(`suggested_disposition_on_failure = $${paramIdx++}`);
      values.push(data.suggested_disposition_on_failure);
    }
    if (data.display_order !== undefined) {
      setClauses.push(`display_order = $${paramIdx++}`);
      values.push(data.display_order);
    }

    if (setClauses.length === 0) {
      // Nothing to update — return current
      const current = await pool.query<ScreeningCriterion>(
        `SELECT criterion_id, opportunity_id, criterion_text, criterion_type,
                auto_criterion_key, is_required, suggested_disposition_on_failure,
                display_order, created_by, created_at
         FROM screening_criteria WHERE criterion_id = $1`,
        [criterion_id],
      );
      return current.rows[0];
    }

    values.push(criterion_id);

    const result = await pool.query<ScreeningCriterion>(
      `UPDATE screening_criteria
       SET ${setClauses.join(', ')}
       WHERE criterion_id = $${paramIdx}
       RETURNING criterion_id, opportunity_id, criterion_text, criterion_type,
                 auto_criterion_key, is_required, suggested_disposition_on_failure,
                 display_order, created_by, created_at`,
      values,
    );
    return result.rows[0];
  }

  /**
   * Delete a screening criterion.
   * Returns 403 if criterion_type='auto' (T-02-07).
   */
  async delete(criterion_id: string): Promise<void> {
    const existingResult = await pool.query<Pick<ScreeningCriterion, 'criterion_id' | 'criterion_type'>>(
      `SELECT criterion_id, criterion_type FROM screening_criteria WHERE criterion_id = $1`,
      [criterion_id],
    );

    if (existingResult.rows.length === 0) {
      const err = new Error('Screening criterion not found') as Error & {
        status: number;
        code: string;
      };
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // T-02-07: Auto criteria cannot be deleted
    if (existingResult.rows[0].criterion_type === 'auto') {
      const err = new Error('System criteria cannot be deleted') as Error & {
        status: number;
        code: string;
      };
      err.status = 403;
      err.code = 'AUTO_CRITERION_PROTECTED';
      throw err;
    }

    await pool.query(`DELETE FROM screening_criteria WHERE criterion_id = $1`, [criterion_id]);
  }
}

export const screeningCriteriaService = new ScreeningCriteriaService();
