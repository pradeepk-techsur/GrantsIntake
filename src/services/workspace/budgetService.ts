import { pool } from '../../db/client';
import { Budget, BudgetLineItem, BudgetValidationError, CreateLineItemInput, FEDERAL_CATEGORIES, MATCH_CATEGORIES } from '../../types/budget';

class BudgetService {
  /**
   * Get or create budget for workspace. Returns budget with line items.
   * Budget is auto-created on first access (lazy creation).
   */
  async getOrCreateBudget(workspaceId: string, _createdBy: string): Promise<Budget> {
    // Upsert budget row (lazy creation)
    const upsertResult = await pool.query(
      `INSERT INTO budgets (workspace_id) VALUES ($1)
       ON CONFLICT (workspace_id) DO UPDATE SET updated_at = now()
       RETURNING *`,
      [workspaceId],
    );
    const budget = upsertResult.rows[0];

    // Load line items
    const lineResult = await pool.query<BudgetLineItem>(
      `SELECT * FROM budget_line_items WHERE budget_id = $1 ORDER BY category, updated_at`,
      [budget.budget_id],
    );

    return { ...budget, line_items: lineResult.rows };
  }

  /**
   * Add a line item to a budget.
   * After adding, recalculate and persist budget totals.
   */
  async addLineItem(budgetId: string, input: CreateLineItemInput, createdBy: string): Promise<BudgetLineItem> {
    const result = await pool.query<BudgetLineItem>(
      `INSERT INTO budget_line_items
         (budget_id, budget_period, category, description, quantity, unit_cost, total_cost,
          personnel_name, fte, annual_salary, fringe_rate, match_source, match_type,
          justification_text, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        budgetId,
        input.budget_period ?? 1,
        input.category,
        input.description,
        input.quantity ?? null,
        input.unit_cost ?? null,
        input.total_cost,
        input.personnel_name ?? null,
        input.fte ?? null,
        input.annual_salary ?? null,
        input.fringe_rate ?? null,
        input.match_source ?? null,
        input.match_type ?? null,
        input.justification_text ?? null,
        createdBy,
      ],
    );
    await this.recalculateTotals(budgetId);
    return result.rows[0];
  }

  /**
   * Update a line item. Recalculates totals after.
   */
  async updateLineItem(lineId: string, updates: Partial<CreateLineItemInput>): Promise<BudgetLineItem | null> {
    // Build dynamic SET clause
    const fields = Object.entries(updates).filter(([, v]) => v !== undefined);
    if (fields.length === 0) return null;
    const setClause = fields.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = fields.map(([, v]) => v);

    const result = await pool.query<BudgetLineItem & { budget_id: string }>(
      `UPDATE budget_line_items SET ${setClause}, updated_at = now()
       WHERE line_id = $1 RETURNING *`,
      [lineId, ...values],
    );
    if (result.rows.length === 0) return null;
    await this.recalculateTotals(result.rows[0].budget_id);
    return result.rows[0];
  }

  /**
   * Delete a line item. Recalculates totals after.
   */
  async deleteLineItem(lineId: string): Promise<boolean> {
    const lineResult = await pool.query<{ budget_id: string }>(
      `DELETE FROM budget_line_items WHERE line_id = $1 RETURNING budget_id`,
      [lineId],
    );
    if (lineResult.rows.length === 0) return false;
    await this.recalculateTotals(lineResult.rows[0].budget_id);
    return true;
  }

  /**
   * Recalculate and persist budget totals from line items.
   * total_federal_request = SUM of federal category items
   * total_match = SUM of match_cash + match_in_kind items
   * total_indirect = SUM of indirect items
   * total_project_cost = total_federal_request + total_match
   */
  private async recalculateTotals(budgetId: string): Promise<void> {
    const totalsResult = await pool.query<{
      total_federal_request: string;
      total_match: string;
      total_indirect: string;
    }>(
      `SELECT
         COALESCE(SUM(CASE WHEN category = ANY($1) THEN total_cost ELSE 0 END), 0) AS total_federal_request,
         COALESCE(SUM(CASE WHEN category = ANY($2) THEN total_cost ELSE 0 END), 0) AS total_match,
         COALESCE(SUM(CASE WHEN category = 'indirect' THEN total_cost ELSE 0 END), 0) AS total_indirect
       FROM budget_line_items WHERE budget_id = $3`,
      [FEDERAL_CATEGORIES, MATCH_CATEGORIES, budgetId],
    );
    const t = totalsResult.rows[0];
    const federal = parseFloat(t.total_federal_request);
    const match = parseFloat(t.total_match);
    const indirect = parseFloat(t.total_indirect);

    await pool.query(
      `UPDATE budgets SET
         total_federal_request = $1,
         total_match = $2,
         total_indirect = $3,
         total_project_cost = $4,
         updated_at = now()
       WHERE budget_id = $5`,
      [federal, match, indirect, federal + match, budgetId],
    );
  }

  /**
   * Validate budget: check federal request vs funding_amount_max, match requirements.
   * Persists validation_errors to budgets table.
   * Also updates budget section's validation_errors in application_sections for readiness.
   */
  async validateBudget(workspaceId: string): Promise<{ errors: BudgetValidationError[]; valid: boolean }> {
    // Load workspace → opportunity → funding limits
    const wsResult = await pool.query(
      `SELECT w.opportunity_id, b.budget_id, b.total_federal_request, b.total_match
       FROM application_workspaces w
       JOIN budgets b ON b.workspace_id = w.workspace_id
       WHERE w.workspace_id = $1`,
      [workspaceId],
    );
    if (wsResult.rows.length === 0) return { errors: [{ error_code: 'NO_BUDGET', message: 'No budget found for workspace', severity: 'blocking' }], valid: false };

    const ws = wsResult.rows[0];
    const oppResult = await pool.query(
      `SELECT funding_amount_max, match_required, match_percentage FROM opportunities WHERE opportunity_id = $1`,
      [ws.opportunity_id],
    );
    const opp = oppResult.rows[0];

    const errors: BudgetValidationError[] = [];
    const federalRequest = parseFloat(ws.total_federal_request ?? '0');
    const totalMatch = parseFloat(ws.total_match ?? '0');
    const totalProjectCost = federalRequest + totalMatch;

    // Ceiling check: federal request must not exceed funding_amount_max
    if (opp?.funding_amount_max != null) {
      const ceiling = parseFloat(opp.funding_amount_max);
      if (federalRequest > ceiling) {
        errors.push({
          error_code: 'EXCEEDS_FUNDING_CEILING',
          message: `Total federal request ($${federalRequest.toFixed(2)}) exceeds funding ceiling ($${ceiling.toFixed(2)})`,
          severity: 'blocking',
        });
      }
    }

    // Match requirement check (PRD-INTAKE-040 / F39)
    if (opp?.match_required === true && opp?.match_percentage != null) {
      const requiredMatchPct = parseFloat(opp.match_percentage);
      if (requiredMatchPct > 0) {
        const requiredMatchAmount = (requiredMatchPct / 100) * totalProjectCost;
        if (totalMatch < requiredMatchAmount) {
          errors.push({
            error_code: 'MATCH_REQUIREMENT_NOT_MET',
            message: `Cost-share of $${totalMatch.toFixed(2)} does not meet the required match of $${requiredMatchAmount.toFixed(2)} (${requiredMatchPct}% of total project cost $${totalProjectCost.toFixed(2)}).`,
            severity: 'blocking',
          });
        }
      }
    }

    const validationStatus = errors.length === 0 ? 'valid' : 'invalid';

    // Persist to budgets
    await pool.query(
      `UPDATE budgets SET validation_status = $1, validation_errors = $2, updated_at = now()
       WHERE budget_id = $3`,
      [validationStatus, errors.length > 0 ? JSON.stringify(errors) : null, ws.budget_id],
    );

    // Also update budget section in application_sections for readiness pickup
    await pool.query(
      `UPDATE application_sections
       SET validation_errors = $1, validation_status = $2, status = $3, updated_at = now()
       WHERE workspace_id = $4 AND section_type = 'budget'`,
      [
        errors.length > 0 ? JSON.stringify(errors.map(e => ({ ...e, field_label: 'Budget' }))) : null,
        validationStatus,
        errors.length > 0 ? 'error' : 'complete',
        workspaceId,
      ],
    );

    return { errors, valid: errors.length === 0 };
  }
}

export const budgetService = new BudgetService();
