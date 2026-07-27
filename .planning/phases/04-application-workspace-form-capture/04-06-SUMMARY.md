---
phase: 04-application-workspace-form-capture
plan: 06
subsystem: testing
tags: [playwright, seed, integration-test, helmet, e2e, vitest]

# Dependency graph
requires:
  - phase: 04-application-workspace-form-capture
    provides: "Workspace/section/budget/readiness/preview UI + API with applicant@example.com seeded user"
provides:
  - "UAT scenario seeded idempotently for applicant@example.com (opportunity + org + org_role + workspace + 9 sections)"
  - "Playwright spec credentials corrected to applicant@example.com in 5 spec files"
  - "Integration test asserting CORP/COOP/COEP headers absent on every response"
affects: [04-application-workspace-form-capture, verify-phase-4]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "INSERT SELECT WHERE NOT EXISTS with explicit ::type casts for PostgreSQL type inference safety"
    - "Idempotent seed with SELECT-then-INSERT and ON CONFLICT DO NOTHING guards"

key-files:
  created:
    - tests/integration/serverHeaders.test.ts
  modified:
    - src/db/seed.ts
    - e2e/workspace.spec.ts
    - e2e/formFields.spec.ts
    - e2e/workspaceBudget.spec.ts
    - e2e/workspaceReadiness.spec.ts
    - e2e/workspacePreview.spec.ts

key-decisions:
  - "ON CONFLICT DO NOTHING for org_roles upsert (has UNIQUE constraint on org_id+user_id) — simpler and safer than INSERT SELECT WHERE NOT EXISTS"
  - "Explicit ::uuid/::varchar/::int casts in INSERT SELECT WHERE NOT EXISTS for application_sections — PostgreSQL cannot infer types when same param used in both projected columns and WHERE filter"

patterns-established:
  - "UAT seed: all rows referenced by subsequent inserts retrieved before being used as FK parameters"
  - "serverHeaders integration test: 3 unconditional toBeUndefined() assertions — no conditional logic"

# Metrics
duration: 4min
completed: 2026-07-27
---

# Phase 4 Plan 06: UAT Gap Closure Summary

**Fixed Playwright credential mismatch (applicant@test.com → applicant@example.com in 5 specs), seeded a complete UAT scenario (grantor org + program + published opportunity UAT-OPP-001 + applicant org + org_role + workspace + 9 sections), and added 3 unconditional integration tests asserting helmet CORP/COOP/COEP headers are absent to prevent iframe regression**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-27T19:13:46Z
- **Completed:** 2026-07-27T19:17:47Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Corrected `applicant@test.com` → `applicant@example.com` in all 5 Playwright workspace spec files (workspace, formFields, workspaceBudget, workspaceReadiness, workspacePreview)
- Extended seed.ts with idempotent UAT scenario: grantor org → program → published opportunity (UAT-OPP-001, $200k) → applicant org (UAT Test Nonprofit) → org_role (authorized_representative) → workspace → 9 sections
- Seed verified idempotent on two consecutive runs — no duplicate key errors
- Created `tests/integration/serverHeaders.test.ts` with 3 unconditional assertions that CORP/COOP/COEP headers are absent
- Full test suite passes: 220 tests (217 pre-existing + 3 new), 24 test files

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Playwright credentials + seed UAT opportunity/org/workspace** - `4c03f31` (feat)
2. **Task 2: Add integration test for helmet iframe header suppression** - `d9fca36` (feat)

## Files Created/Modified
- `src/db/seed.ts` — Extended with idempotent UAT scenario (7 sequential steps, ~140 new lines)
- `e2e/workspace.spec.ts` — applicant@test.com → applicant@example.com (line 7)
- `e2e/formFields.spec.ts` — applicant@test.com → applicant@example.com (line 5)
- `e2e/workspaceBudget.spec.ts` — applicant@test.com → applicant@example.com (line 5)
- `e2e/workspaceReadiness.spec.ts` — applicant@test.com → applicant@example.com (lines 20, 55, 94)
- `e2e/workspacePreview.spec.ts` — applicant@test.com → applicant@example.com (line 5)
- `tests/integration/serverHeaders.test.ts` — New file, 3 unconditional header absence tests

## Decisions Made
- Used `ON CONFLICT (org_id, user_id) DO NOTHING` for org_roles upsert (UNIQUE constraint available) instead of INSERT SELECT WHERE NOT EXISTS — cleaner and avoids PostgreSQL type inference issues
- Used explicit `::uuid`, `::varchar`, `::int` casts in the application_sections INSERT SELECT WHERE NOT EXISTS — PostgreSQL throws "inconsistent types deduced for parameter $N" when the same placeholder appears in both projected SELECT columns and the subquery WHERE clause without explicit casts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed PostgreSQL type inference error in application_sections seed insert**
- **Found during:** Task 1 (seed.ts UAT scenario)
- **Issue:** `INSERT INTO application_sections SELECT $1, $2, $3, $4 WHERE NOT EXISTS (... WHERE workspace_id = $1 AND section_type = $2)` caused "inconsistent types deduced for parameter $2" (PostgreSQL error 42P08) — the same placeholder used as both a projected value and a filter against VARCHAR(50)
- **Fix:** Added explicit type casts: `SELECT $1::uuid, $2::varchar, $3::varchar, $4::int WHERE NOT EXISTS (... WHERE workspace_id = $1::uuid AND section_type = $2::varchar)`
- **Files modified:** `src/db/seed.ts`
- **Verification:** Seed ran successfully on first and second run without errors
- **Committed in:** `4c03f31` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed PostgreSQL type inference error in org_roles seed insert**
- **Found during:** Task 1 (seed.ts UAT scenario)
- **Issue:** `INSERT INTO org_roles SELECT $1, $2, $3 WHERE NOT EXISTS (... WHERE org_id = $1 AND user_id = $2)` caused same type inference error
- **Fix:** Replaced with `INSERT INTO org_roles VALUES ($1, $2, $3::jsonb) ON CONFLICT (org_id, user_id) DO NOTHING` — uses UNIQUE constraint directly, simpler and avoids the type inference problem
- **Files modified:** `src/db/seed.ts`
- **Verification:** Seed ran successfully idempotently
- **Committed in:** `4c03f31` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 - Bug, both PostgreSQL type inference)
**Impact on plan:** Both fixes were necessary to make the seed run — PostgreSQL is stricter than the INSERT SELECT pattern in the plan assumed. No scope creep.

## Issues Encountered
None beyond the auto-fixed PostgreSQL type inference issues described above.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None found.

## Next Phase Readiness
- UAT credential fix and seed data enable Playwright workspace/form/budget/readiness/preview tests to run without manual DB setup
- Helmet CORP/COOP/COEP regression is now test-gated
- Phase 4 all 6 plans delivered; ready for verify-work phase-4 or Phase 5 planning

---
*Phase: 04-application-workspace-form-capture*
*Completed: 2026-07-27*

## Self-Check: PASSED
- `tests/integration/serverHeaders.test.ts` — FOUND ✓
- `src/db/seed.ts` — FOUND ✓ (contains INSERT INTO application_workspaces)
- Commit `4c03f31` — FOUND ✓
- Commit `d9fca36` — FOUND ✓
- Build/type check: `npx tsc --noEmit` → exit 0 ✓
- Full test suite: 220 tests passing (npm test) ✓
- No blocking stubs found ✓
