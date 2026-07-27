---
phase: 4
status: issues_found
blockers: 1
warnings: 3
files_reviewed: 3
files_reviewed_list:
  - src/db/migrations/014_opportunity_match_columns.sql
  - src/services/workspace/budgetService.ts
  - tests/integration/workspaceBudget.test.ts
reviewed_at: 2026-07-27T17:02:12Z
iteration: 1
---

# Phase 4 Code Review (Gap Closure — Plan 04-05)

## BLOCKERs

### B1: Test 8 can pass vacuously when match validation is broken — MATCH_REQUIREMENT_NOT_MET is never positively asserted
- **File:** `tests/integration/workspaceBudget.test.ts:428-437`
- **Category:** bug
- **Evidence:**
  ```typescript
  // Only assert MATCH_REQUIREMENT_NOT_MET if federal total > 0 and match insufficient
  expect(res.status).toBe(200);
  if (res.body.valid === false) {
    const hasCeilingError = ...
    const hasMatchError = ...
    // At least one of the two errors must be present when invalid
    expect(hasCeilingError || hasMatchError).toBe(true);
  }
  ```
  The test's only substantive assertion lives inside `if (res.body.valid === false)`. If `validateBudget` were broken and returned `{ valid: true, errors: [] }` despite `match_required=true` and zero match contribution, the `if` branch is never entered and the test exits green having asserted nothing about `MATCH_REQUIREMENT_NOT_MET`. The test title says "returns MATCH_REQUIREMENT_NOT_MET when match_required=true and match is insufficient" — that claim is never unconditionally verified. The scenario is deterministic: after Test 7, exactly one `supplies` line item of $1,000 exists (`federalRequest=1000`, `totalMatch=0`); with `match_percentage=20`, the required amount is $200, and `totalMatch < requiredMatchAmount` is provably true. There is no need for conditional branching here. As written, this test is a regression-detection dead-end: a future refactor that accidentally skips match enforcement would not be caught by this test.
- **Fix direction:** Remove the `if (res.body.valid === false)` guard. Assert unconditionally that `res.body.valid === false` and that `res.body.errors.some(e => e.error_code === 'MATCH_REQUIREMENT_NOT_MET')` is `true`. The inner `hasCeilingError || hasMatchError` disjunction is also too permissive; the test should require the match error specifically.

---

## WARNINGs

### W1: No CHECK constraint on `match_percentage` range — values > 100 are silently accepted
- **File:** `src/db/migrations/014_opportunity_match_columns.sql:7`
- **Category:** bug
- **Evidence:**
  ```sql
  ADD COLUMN IF NOT EXISTS match_percentage NUMERIC(5,2)  DEFAULT NULL;
  ```
  `NUMERIC(5,2)` accepts values up to `999.99`. The column comment says "percent of total project cost (0-100)" but nothing in the schema enforces the range. A grantor admin who sets `match_percentage = 150` would produce a required match of 1.5× the total project cost — a value impossible to satisfy (you cannot provide more in match than the entire project costs). The service code has no guard: `parseFloat(opp.match_percentage)` with a value of `150` would push a `MATCH_REQUIREMENT_NOT_MET` error that can never be resolved, silently blocking all budget validation for that opportunity. A `CHECK (match_percentage IS NULL OR (match_percentage >= 0 AND match_percentage <= 100))` constraint would prevent this at the database level.

### W2: Self-referential match formula produces counterintuitive required amounts
- **File:** `src/services/workspace/budgetService.ts:158,176`
- **Category:** bug (logic)
- **Evidence:**
  ```typescript
  const totalProjectCost = federalRequest + totalMatch;          // line 158
  const requiredMatchAmount = (requiredMatchPct / 100) * totalProjectCost;  // line 176
  ```
  `totalProjectCost` includes `totalMatch` in its numerator, making `requiredMatchAmount` a function of the very value being compared. An applicant told "20% match required" on a $1,000 federal request reasonably expects to provide $200. But `required = 20% × ($1,000 + $200) = $240` — still short. The threshold converges only at $250 (`250 = 20% × 1250`). The formula is internally consistent with the plan specification (`required_match = match_percentage / 100 * total_project_cost`) and matches the column comment, so this is per-spec as written. **However**, the error message makes the confusion visible and actionable to users who will receive: *"Cost-share of $200.00 does not meet the required match of $240.00 (20% of total project cost $1200.00)"* — the displayed total already includes their $200 contribution, making the arithmetic opaque. This is flagged as a WARNING because it is spec-conformant but likely to create user-facing confusion and support load. Consider whether the spec intends match as a percentage of federal funds only (the more common federal grants convention), and if so, fix the formula to `requiredMatchAmount = (requiredMatchPct / 100) * federalRequest`.

### W3: Zero-budget state silently satisfies match requirement when opportunity has `match_required=true`
- **File:** `src/services/workspace/budgetService.ts:158,175-184`
- **Category:** bug
- **Evidence:**
  ```typescript
  const totalProjectCost = federalRequest + totalMatch;  // = 0 + 0 = 0
  const requiredMatchAmount = (requiredMatchPct / 100) * totalProjectCost; // = 0
  if (totalMatch < requiredMatchAmount) {                // 0 < 0 → false — no error pushed
  ```
  When all budget line items have been deleted (an intermediate state during drafting), `federalRequest=0` and `totalMatch=0`, so `requiredMatchAmount=0`. `totalMatch (0) < requiredMatchAmount (0)` is `false`, so no `MATCH_REQUIREMENT_NOT_MET` error is emitted and `validate` returns `{ valid: true }` despite the workspace having an active match requirement. The ceiling check has the same gap (it uses `opp?.funding_amount_max != null` — ceiling check is skipped when budget is empty, which is fine). The match scenario is more surprising: a workspace with `match_required=true` reports as `valid` while containing zero budget, which could allow an applicant to believe their (empty) budget is submission-ready. Mitigation: either emit a `MATCH_REQUIREMENT_NOT_MET` when `match_required=true AND totalProjectCost=0`, or emit a separate `EMPTY_BUDGET` blocking error when `totalProjectCost=0`. The existing `NO_BUDGET` error handles the case where no `budgets` row exists at all, but not the case where a budget row exists with $0 totals.

---

## Cross-file seams checked

- **Migration 014 → budgetService.ts SELECT**: `SELECT funding_amount_max, match_required, match_percentage` — column names exactly match `ADD COLUMN IF NOT EXISTS match_required` / `match_percentage`. **OK**
- **budgetService.ts → workspaces.ts route**: `validateBudget(workspaceId)` signature unchanged; caller at `workspaces.ts:544` passes `id` (string). **OK**
- **Test afterAll nesting**: Inner `describe('Match requirement validation')` `afterAll` resets `match_required=false` before the outer `afterAll` deletes the opportunity row. Vitest runs inner `afterAll` before outer, so teardown order is correct. **OK**
- **Migration idempotency**: `ADD COLUMN IF NOT EXISTS` — safe for re-runs. **OK**
- **Migration ordering**: Two `013_` prefixed files are pre-existing (introduced before this diff). The migration runner keys on full filename, not numeric prefix only, so no collision is introduced by `014_`. Pre-existing anomaly, out of scope. **OK**
- **`BudgetValidationError` type**: `error_code`, `message`, `severity` fields used correctly in the new push. **OK**
- **Test 9 (sufficient match)**: State is deterministic — fresh line items added after clearing, `totalMatch=999999` satisfies `1% × 1000999 ≈ 10010`. Assertion is sound. **OK**
