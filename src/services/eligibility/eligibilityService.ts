import { pool } from '../../db/client';
import { EligibilityRule } from '../../types/eligibility';

export interface CreateEligibilityRuleInput {
  rule_type: string;
  criterion_field: string;
  operator: string;
  criterion_value: string | string[] | number;
  severity: 'hard_blocker' | 'advisory';
  enforcement_point?: 'pre_workspace' | 'pre_submission';
  explanation_text: string;
  rule_group_id?: string;
  rule_group_operator?: 'AND' | 'OR';
  display_order?: number;
}

export interface UpdateEligibilityRuleInput {
  rule_type?: string;
  criterion_field?: string;
  operator?: string;
  criterion_value?: string | string[] | number;
  severity?: 'hard_blocker' | 'advisory';
  enforcement_point?: 'pre_workspace' | 'pre_submission' | null;
  explanation_text?: string;
  rule_group_id?: string | null;
  rule_group_operator?: 'AND' | 'OR' | null;
  display_order?: number;
}

class EligibilityService {
  /**
   * List all eligibility rules for an opportunity, ordered by display_order.
   */
  async list(opportunity_id: string): Promise<EligibilityRule[]> {
    const result = await pool.query<EligibilityRule>(
      `SELECT rule_id, opportunity_id, rule_type, criterion_field, operator,
              criterion_value, severity, enforcement_point, explanation_text,
              rule_group_id, rule_group_operator, display_order, created_by,
              created_at, updated_at
       FROM eligibility_rules
       WHERE opportunity_id = $1
       ORDER BY display_order ASC, created_at ASC`,
      [opportunity_id],
    );
    return result.rows;
  }

  /**
   * Create an eligibility rule.
   * Validates that hard_blocker rules have an enforcement_point.
   * Writes ELIGIBILITY_RULE_CREATED audit event.
   */
  async create(
    opportunity_id: string,
    data: CreateEligibilityRuleInput,
    created_by: string,
  ): Promise<EligibilityRule> {
    // Validate: hard_blocker requires enforcement_point
    if (data.severity === 'hard_blocker' && !data.enforcement_point) {
      const err = new Error('hard_blocker rules require enforcement_point') as Error & {
        status: number;
        code: string;
      };
      err.status = 400;
      err.code = 'MISSING_ENFORCEMENT_POINT';
      throw err;
    }

    // Validate and serialize criterion_value
    const criterionValueJson = JSON.stringify(data.criterion_value);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query<EligibilityRule>(
        `INSERT INTO eligibility_rules (
          opportunity_id, rule_type, criterion_field, operator, criterion_value,
          severity, enforcement_point, explanation_text, rule_group_id,
          rule_group_operator, display_order, created_by
        ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12)
        RETURNING rule_id, opportunity_id, rule_type, criterion_field, operator,
                  criterion_value, severity, enforcement_point, explanation_text,
                  rule_group_id, rule_group_operator, display_order, created_by,
                  created_at, updated_at`,
        [
          opportunity_id,
          data.rule_type,
          data.criterion_field,
          data.operator,
          criterionValueJson,
          data.severity,
          data.enforcement_point ?? null,
          data.explanation_text,
          data.rule_group_id ?? null,
          data.rule_group_operator ?? null,
          data.display_order ?? 0,
          created_by,
        ],
      );

      const rule = result.rows[0];

      // Write audit event
      await client.query(
        `INSERT INTO audit_events (event_type, actor_user_id, entity_type, entity_id, payload)
         VALUES ('ELIGIBILITY_RULE_CREATED', $1, 'eligibility_rule', $2, $3::jsonb)`,
        [
          created_by,
          rule.rule_id,
          JSON.stringify({
            opportunity_id,
            rule_type: data.rule_type,
            severity: data.severity,
          }),
        ],
      );

      await client.query('COMMIT');
      return rule;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Update an eligibility rule.
   * Validates that the resulting rule (if hard_blocker) has enforcement_point.
   * Verifies the rule belongs to an opportunity the caller has grantor membership in.
   * Writes ELIGIBILITY_RULE_UPDATED audit event.
   */
  async update(
    rule_id: string,
    data: UpdateEligibilityRuleInput,
    user_id: string,
  ): Promise<EligibilityRule> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch existing rule (verify it exists and get current values)
      const existingResult = await client.query<EligibilityRule>(
        `SELECT er.*, p.grantor_org_id
         FROM eligibility_rules er
         JOIN opportunities o ON er.opportunity_id = o.opportunity_id
         JOIN programs p ON o.program_id = p.program_id
         WHERE er.rule_id = $1`,
        [rule_id],
      );

      if (existingResult.rows.length === 0) {
        const err = new Error('Eligibility rule not found') as Error & {
          status: number;
          code: string;
        };
        err.status = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      // T-02-02: Verify caller has grantor membership on this opportunity's org
      const grantorOrgCheck = await client.query<{ count: string }>(
        `SELECT COUNT(*) FROM grantor_roles
         WHERE grantor_org_id = $1 AND user_id = $2`,
        [(existingResult.rows[0] as EligibilityRule & { grantor_org_id: string }).grantor_org_id, user_id],
      );
      if (parseInt(grantorOrgCheck.rows[0].count) === 0) {
        const err = new Error('Eligibility rule not found or access denied') as Error & {
          status: number;
          code: string;
        };
        err.status = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      const existing = existingResult.rows[0];

      // Determine effective severity and enforcement_point after update
      const effectiveSeverity = data.severity ?? existing.severity;
      const effectiveEnforcementPoint =
        'enforcement_point' in data ? data.enforcement_point : existing.enforcement_point;

      if (effectiveSeverity === 'hard_blocker' && !effectiveEnforcementPoint) {
        const err = new Error('hard_blocker rules require enforcement_point') as Error & {
          status: number;
          code: string;
        };
        err.status = 400;
        err.code = 'MISSING_ENFORCEMENT_POINT';
        throw err;
      }

      // Build SET clause dynamically
      const setClauses: string[] = [];
      const values: unknown[] = [];
      let paramIdx = 1;

      const fieldMap: Record<string, string> = {
        rule_type: 'rule_type',
        criterion_field: 'criterion_field',
        operator: 'operator',
        severity: 'severity',
        enforcement_point: 'enforcement_point',
        explanation_text: 'explanation_text',
        rule_group_id: 'rule_group_id',
        rule_group_operator: 'rule_group_operator',
        display_order: 'display_order',
      };

      for (const [key, column] of Object.entries(fieldMap)) {
        if (key in data) {
          setClauses.push(`${column} = $${paramIdx}`);
          values.push((data as Record<string, unknown>)[key]);
          paramIdx++;
        }
      }

      if ('criterion_value' in data && data.criterion_value !== undefined) {
        setClauses.push(`criterion_value = $${paramIdx}::jsonb`);
        values.push(JSON.stringify(data.criterion_value));
        paramIdx++;
      }

      setClauses.push(`updated_at = now()`);

      values.push(rule_id);
      const whereIdx = paramIdx;

      const result = await client.query<EligibilityRule>(
        `UPDATE eligibility_rules
         SET ${setClauses.join(', ')}
         WHERE rule_id = $${whereIdx}
         RETURNING rule_id, opportunity_id, rule_type, criterion_field, operator,
                   criterion_value, severity, enforcement_point, explanation_text,
                   rule_group_id, rule_group_operator, display_order, created_by,
                   created_at, updated_at`,
        values,
      );

      // Write audit event
      await client.query(
        `INSERT INTO audit_events (event_type, actor_user_id, entity_type, entity_id, payload)
         VALUES ('ELIGIBILITY_RULE_UPDATED', $1, 'eligibility_rule', $2, $3::jsonb)`,
        [user_id, rule_id, JSON.stringify({ updated_fields: Object.keys(data) })],
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Delete an eligibility rule.
   * Writes ELIGIBILITY_RULE_DELETED audit event.
   */
  async delete(rule_id: string, user_id: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify it exists and get opportunity_id for audit
      const existingResult = await client.query<{ opportunity_id: string; grantor_org_id: string }>(
        `SELECT er.opportunity_id, p.grantor_org_id
         FROM eligibility_rules er
         JOIN opportunities o ON er.opportunity_id = o.opportunity_id
         JOIN programs p ON o.program_id = p.program_id
         WHERE er.rule_id = $1`,
        [rule_id],
      );

      if (existingResult.rows.length === 0) {
        const err = new Error('Eligibility rule not found') as Error & {
          status: number;
          code: string;
        };
        err.status = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      // Verify caller has grantor membership
      const grantorOrgCheck = await client.query<{ count: string }>(
        `SELECT COUNT(*) FROM grantor_roles
         WHERE grantor_org_id = $1 AND user_id = $2`,
        [existingResult.rows[0].grantor_org_id, user_id],
      );
      if (parseInt(grantorOrgCheck.rows[0].count) === 0) {
        const err = new Error('Eligibility rule not found or access denied') as Error & {
          status: number;
          code: string;
        };
        err.status = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      // Write audit event BEFORE deleting (so we have the data)
      await client.query(
        `INSERT INTO audit_events (event_type, actor_user_id, entity_type, entity_id, payload)
         VALUES ('ELIGIBILITY_RULE_DELETED', $1, 'eligibility_rule', $2, $3::jsonb)`,
        [
          user_id,
          rule_id,
          JSON.stringify({ opportunity_id: existingResult.rows[0].opportunity_id }),
        ],
      );

      await client.query('DELETE FROM eligibility_rules WHERE rule_id = $1', [rule_id]);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const eligibilityService = new EligibilityService();
