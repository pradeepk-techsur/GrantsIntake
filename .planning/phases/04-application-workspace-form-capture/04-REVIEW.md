---
phase: 4
plan: 04-06
status: clean
blockers: 0
warnings: 2
files_reviewed: 7
files_reviewed_list:
  - e2e/workspace.spec.ts
  - e2e/formFields.spec.ts
  - e2e/workspaceBudget.spec.ts
  - e2e/workspaceReadiness.spec.ts
  - e2e/workspacePreview.spec.ts
  - src/db/seed.ts
  - tests/integration/serverHeaders.test.ts
reviewed_at: 2026-07-27T19:30:00Z
iteration: 2
---

# Phase 4 Code Review (Plan 04-06 — UAT Gap Closure)

## Iteration 2 — Re-review Summary

Iteration 1 raised one BLOCKER (B1: applicant password mismatch) and two WARNINGs (W1: unauthenticated Test 2, W2: pool.end() singleton hazard). The fixer addressed B1 in commit `f69d830`. This re-review verifies the fix and checks for regressions.

---

## BLOCKERs

_None._ B1 from iteration 1 is resolved (see below).

---

## B1 Fix Verification — RESOLVED ✓

**Commit:** `f69d830` — `fix(04-06): correct applicant password in Playwright specs (TestPass123!)`

**Verification steps performed:**

1. **Diff inspection:** `git show f69d830` shows exactly 7 lines changed across 5 files — every line is a single-string substitution replacing `'TestPassword123!'` with `'TestPass123!'` in the `page.fill('[name="password"]', ...)` call. No other logic was altered.

2. **Residual scan:** `grep -rn "TestPassword123!" e2e/ tests/ src/db/seed.ts` returns **zero matches** in any of the 5 reviewed spec files. The only remaining occurrences in the broader codebase are in `e2e/grantor-portal-shell.spec.ts`, `e2e/opportunity-builder.spec.ts`, `e2e/eligibility-rules.spec.ts`, `e2e/intake-config.spec.ts`, `e2e/opportunity-portal.spec.ts`, `tests/integration/auth.test.ts`, and `src/db/seed.ts` line 12 — all of which correctly refer to the **admin** user (`admin@example.gov`), not the applicant.

3. **Seed unchanged:** `src/db/seed.ts` line 283 still reads `const applicantHash = await bcrypt.hash('TestPass123!', 12);` — the seed was not touched by the fix, as directed.

4. **Coverage:** All three `workspaceReadiness.spec.ts` occurrences (lines 21, 56, 95) were corrected; all 5 spec files that were listed in B1 have been fixed.

5. **No fix-introduced regressions:** The change is a pure literal-string substitution; no surrounding logic, test structure, or import was altered. Files read in full — no new defects observed.

---

## WARNINGs (carried from iteration 1, unchanged)

### W1: `workspace.spec.ts` Test 2 navigates to an authenticated route without logging in — will silently fail
- **File:** `e2e/workspace.spec.ts:17-20`
- **Evidence:**
  ```ts
  test('ApplicantSidebar has My Applications nav link', async ({ page }) => {
    await page.goto('/applicant/applications');
    await expect(page.locator('[data-testid="nav-my-applications"]')).toBeVisible();
  });
  ```
  This test navigates directly to `/applicant/applications` without authenticating first. If (as is standard for this app) unauthenticated requests to `/applicant/**` redirect to `/login`, the nav-my-applications testid will never be present and the test will time out or fail. The other workspace tests (Test 3, Test 4 in the same file) also go directly to `/applicant/applications` without a prior login step — but those tests have `if (count > 0)` guards that safely skip the main assertion, so they will not visibly fail. Test 2 has no such guard. This is a new test introduced in this phase; it is not a pre-existing defect.
- **Fix direction:** Add a login step (goto /login, fill email/password `TestPass123!`, click submit, waitForURL) before the goto('/applicant/applications') call in Test 2, matching the pattern used in Tests 1 and 3+.
- **Status:** Not fixed in iteration 1 fix pass; deferred as advisory.

### W2: `serverHeaders.test.ts` duplicates `pool.end()` / `closeRedisClient()` on a shared module singleton — potential test ordering hazard
- **File:** `tests/integration/serverHeaders.test.ts:10-13`
- **Evidence:**
  With `singleFork: true` in `vitest.config.ts`, all integration test files run in a single Node.js process and share the `pool` singleton exported from `src/db/client`. Every test file calls `pool.end()` in its own `afterAll`. If `serverHeaders.test.ts` runs before any other file that needs the pool, subsequent `pool.query()` calls will throw `Error: Cannot use a pool after calling end on the pool`. The pattern is identical to the pre-existing `contextBoot.test.ts` and every other integration test — so this is an existing systemic risk rather than a new one introduced by this file. Flagged because the new file adds another `pool.end()` call to the single-process gauntlet and therefore raises the probability of ordering-dependent failures if test file sequencing changes.
- **Fix direction:** Consider migrating to a `beforeAll`/`afterAll` fixture that only ends the pool once, scoped to the vitest workspace global setup/teardown. For now, the risk is the same as the rest of the suite.
- **Status:** Not fixed in iteration 1 fix pass; acknowledged as systemic/pre-existing pattern.

---

## Cross-file seams checked

| Seam | Status |
|---|---|
| `seed.ts` applicant password (`TestPass123!`) ↔ all 5 Playwright specs | **OK** — exact match after f69d830; 0 residual mismatches |
| `seed.ts` admin password (`TestPassword123!`) ↔ admin-targeting specs (`opportunity-builder`, `eligibility-rules`, `intake-config`, `grantor-portal-shell`, `opportunity-portal`) | **OK** — all correctly use `TestPassword123!` for `admin@example.gov` |
| `seed.ts` DEFAULT_SECTIONS (9 rows) ↔ `workspaceService.ts` DEFAULT_SECTIONS | **OK** — unchanged from iteration 1; exact match confirmed |
| `serverHeaders.test.ts` assertions ↔ `server.ts` helmet config | **OK** — unchanged from iteration 1 |
| `serverHeaders.test.ts` `import { app, finalizeApp }` ↔ `server.ts` exports | **OK** — unchanged from iteration 1 |
| Fix commit scope (5 files only) — no unintended files modified | **OK** — `git show f69d830 --stat` shows exactly the 5 e2e spec files |
</content>
</invoke>