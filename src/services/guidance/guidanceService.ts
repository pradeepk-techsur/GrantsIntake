import { pool } from '../../db/client';
import { GuidancePrompt } from '../../types/opportunity';

/**
 * Guidance Service — CRUD operations for guidance_prompts table.
 */
export class GuidanceService {
  /**
   * List all guidance prompts.
   */
  async list(): Promise<GuidancePrompt[]> {
    const result = await pool.query<GuidancePrompt>(
      `SELECT prompt_id, field_id, prompt_text, example_text, uswds_tips, updated_at
       FROM guidance_prompts
       ORDER BY field_id ASC`,
    );
    return result.rows;
  }

  /**
   * Get a guidance prompt by field_id.
   * Returns null if not found.
   */
  async getByFieldId(fieldId: string): Promise<GuidancePrompt | null> {
    const result = await pool.query<GuidancePrompt>(
      `SELECT prompt_id, field_id, prompt_text, example_text, uswds_tips, updated_at
       FROM guidance_prompts
       WHERE field_id = $1`,
      [fieldId],
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }
}

export const guidanceService = new GuidanceService();
