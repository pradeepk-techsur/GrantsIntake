import { pool } from '../../db/client';
import { SectionConditionConfig, SectionCondition } from '../../types/intakeConfig';

export interface UpsertSectionConditionInput {
  conditions: SectionCondition[];
  condition_group_operator: 'AND' | 'OR';
}

class SectionConditionService {
  /**
   * List all section condition configs for an opportunity, ordered by section_key.
   */
  async list(opportunity_id: string): Promise<SectionConditionConfig[]> {
    const result = await pool.query<SectionConditionConfig>(
      `SELECT config_id, opportunity_id, section_key, conditions,
              condition_group_operator, created_by, created_at, updated_at
       FROM section_condition_configs
       WHERE opportunity_id = $1
       ORDER BY section_key ASC`,
      [opportunity_id],
    );
    return result.rows;
  }

  /**
   * Upsert a section condition config for a specific section_key.
   * Uses INSERT ... ON CONFLICT to handle the UNIQUE(opportunity_id, section_key) constraint.
   */
  async upsert(
    opportunity_id: string,
    section_key: string,
    conditions: SectionCondition[],
    condition_group_operator: 'AND' | 'OR',
    user_id: string,
  ): Promise<SectionConditionConfig> {
    const result = await pool.query<SectionConditionConfig>(
      `INSERT INTO section_condition_configs
         (opportunity_id, section_key, conditions, condition_group_operator, created_by)
       VALUES ($1, $2, $3::jsonb, $4, $5)
       ON CONFLICT (opportunity_id, section_key)
       DO UPDATE SET
         conditions = EXCLUDED.conditions,
         condition_group_operator = EXCLUDED.condition_group_operator,
         updated_at = now()
       RETURNING config_id, opportunity_id, section_key, conditions,
                 condition_group_operator, created_by, created_at, updated_at`,
      [opportunity_id, section_key, JSON.stringify(conditions), condition_group_operator, user_id],
    );
    return result.rows[0];
  }

  /**
   * Delete a section condition config by opportunity_id and section_key.
   */
  async delete(opportunity_id: string, section_key: string): Promise<void> {
    const result = await pool.query(
      `DELETE FROM section_condition_configs
       WHERE opportunity_id = $1 AND section_key = $2`,
      [opportunity_id, section_key],
    );
    if (result.rowCount === 0) {
      const err = new Error('Section condition config not found') as Error & {
        status: number;
        code: string;
      };
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
  }
}

export const sectionConditionService = new SectionConditionService();
