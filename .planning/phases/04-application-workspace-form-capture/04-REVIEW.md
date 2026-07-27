---
phase: 4
plan: 04-06
status: issues_found
blockers: 1
warnings: 2
files_reviewed: 7
files_reviewed_list:
  - src/db/seed.ts
  - e2e/workspace.spec.ts
  - e2e/formFields.spec.ts
  - e2e/workspaceBudget.spec.ts
  - e2e/workspaceReadiness.spec.ts
  - e2e/workspacePreview.spec.ts
  - tests/integration/serverHeaders.test.ts
reviewed_at: 2026-07-27T00:00:00Z
iteration: 1
---

# Phase 4 Code Review (Plan 04-06 — UAT Gap Closure)

## BLOCKERs

### B1: Password mismatch — seed hashes `TestPass123!` but all 5 Playwright specs send `TestPassword123!`
- **File:** `e2e/workspace.spec.ts:8`, `e2e/formFields.spec.ts:6`, `e2e/workspaceBudget.spec.ts:6`, `e2e/workspaceReadiness.spec.ts:21,56,95`, `e2e/workspacePreview.spec.ts:6`
- **Category:** bug (integration — seed ↔ Playwright credential contract)
- **Evidence:**
  - `src/db/seed.ts:283`: `const applicantHash = await bcrypt.hash('TestPass123!', 12);`
  - `src/db/seed.ts:459`: `console.log('... applicant@example.com / TestPass123!')`
  - Every E2E spec that logs in as the applicant sends: `await page.fill('[name="password"]', 'TestPassword123!');`
  - `TestPassword123!` is the **admin** user's password (seed line 12). The applicant's password is `TestPass123!` (no `word`). These are distinct strings — bcrypt comparison will fail, login will return 401, `waitForURL('**/applicant/**')` will time out, and every test that relies on being authenticated will silently fall through to the `count === 0` branch or time out.
  - The plan's task description says `"The password TestPass123! is correct — do NOT change it"`, confirming the intended applicant password is `TestPass123!`. The specs were not updated to match.
- **Fix direction:** In all 5 E2E spec files, replace the applicant password fill value `'TestPassword123!'` with `'TestPass123!'`. Do not change the seed.

---

## WARNINGs

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
- **Fix direction:** Add a login step (goto /login, fill email/password, click submit, waitForURL) before the goto('/applicant/applications') call in Test 2, matching the pattern used in Tests 3 and 5.

### W2: `serverHeaders.test.ts` duplicates `pool.end()` / `closeRedisClient()` on a shared module singleton — potential test ordering hazard
- **File:** `tests/integration/serverHeaders.test.ts:10-13`
- **Evidence:**
  With `singleFork: true` in `vitest.config.ts`, all integration test files run in a single Node.js process and share the `pool` singleton exported from `src/db/client`. Every test file calls `pool.end()` in its own `afterAll`. If `serverHeaders.test.ts` runs before any other file that needs the pool, subsequent `pool.query()` calls will throw `Error: Cannot use a pool after calling end on the pool`. The pattern is identical to the pre-existing `contextBoot.test.ts` and every other integration test — so this is an existing systemic risk rather than a new one introduced by this file. Flagged here because the new file adds another `pool.end()` call to the single-process gauntlet and therefore raises the probability of ordering-dependent failures if test file sequencing ever changes.
- **Fix direction:** Consider migrating to a `beforeAll`/`afterAll` fixture that only ends the pool once, scoped to the vitest workspace global setup/teardown. For now, the risk is the same as the rest of the suite.

---

## Cross-file seams checked

| Seam | Status |
|---|---|
| `seed.ts` DEFAULT_SECTIONS (9 rows) ↔ `workspaceService.ts` DEFAULT_SECTIONS | **OK** — exact match: section_type, section_name, display_order identical for all 9 entries |
| `seed.ts` applicant password (`TestPass123!`) ↔ Playwright specs (`TestPassword123!`) | **BLOCKER B1** — mismatch |
| `serverHeaders.test.ts` assertions (`toBeUndefined`) ↔ `server.ts` helmet config (`crossOriginOpenerPolicy: false`, `crossOriginResourcePolicy: false`, `crossOriginEmbedderPolicy: false`) | **OK** — helmet correctly suppresses all three headers; test correctly asserts undefined |
| `serverHeaders.test.ts` import `{ app, finalizeApp }` ↔ `server.ts` exports | **OK** — both are named exports |
| `serverHeaders.test.ts` import `{ closeRedisClient }` ↔ `tokenService.ts` export | **OK** — same import path as all other integration tests |
| `serverHeaders.test.ts` `GET /health` route ↔ `server.ts` health handler | **OK** — route exists and returns 200 |
| `seed.ts` idempotency guards (grantor org, program, opportunity, org, workspace, sections) | **OK** — all use SELECT-before-INSERT or `WHERE NOT EXISTS`; safe to run twice |
| `seed.ts` `application_workspaces` INSERT omits `track_id` column | **OK** — `track_id` is nullable in migration 012; omission is valid |
| `seed.ts` `org_roles` ON CONFLICT guard ↔ migration 010 `uq_org_user_role UNIQUE (org_id, user_id)` | **OK** — `ON CONFLICT (org_id, user_id) DO NOTHING` correctly references the constraint |
| Old credential `applicant@test.com` remaining in any spec file | **OK** — zero instances of `applicant@test.com` in all 5 files |
| `seed.ts` parameterized queries (no string interpolation) | **OK** — all SQL uses `$1, $2, ...` placeholders throughout UAT block |
