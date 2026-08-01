---
phase: 05-q-a-submission-validation
plan: 11
subsystem: testing
tags: [playwright, e2e, grantor, q-and-a, opportunities, regression-gate]

# Dependency graph
requires:
  - phase: 05-q-a-submission-validation
    provides: "UAT-OPP-001 under General Grant Programs (05-09); OpportunitiesIndex multi-program fetch (05-09)"
provides:
  - "e2e/qa.spec.ts extended with Test 6 (hard assertion) and Test 7 (Q&A page render)"
  - "Regression gate: UAT Community Health Innovation Grant must appear in grantor opportunities list"
  - "Fix for Test 4 strict mode violation (text=Q&A Management ambiguous locator)"
affects: [uat-final-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hard (non-advisory) Playwright assertion pattern for regression gates"
    - "h1 filter locator to avoid strict mode violations with nav links sharing text"
    - "Conditional question-visibility check: assert no error, then assert questions OR no-questions placeholder"

key-files:
  created: []
  modified:
    - e2e/qa.spec.ts

key-decisions:
  - "Test 7 uses lenient assertion (questions OR no-questions placeholder, but NOT error) — prevents false positives when DB is freshly seeded with no Q&A activity"
  - "Test 6 uses hard assertion (not advisory) — UAT-OPP-001 MUST appear in opportunities list; absence is a real regression"
  - "Fix Test 4's text=Q&A Management locator to use h1 filter — nav sidebar link and page h1 both matched, causing strict mode violation"

patterns-established:
  - "Non-advisory regression gate: Test 6 fails hard if seed fix regresses (UAT-OPP-001 disappears from list)"
  - "Lenient UI-state assertion: Test 7 asserts page renders correctly (no auth error) while allowing for empty state"

# Metrics
duration: 8min
completed: 2026-08-01
---

# Phase 5 Plan 11: Non-Advisory Grantor Q&A Management Flow E2E Test

**Playwright regression gates added to qa.spec.ts: Test 6 hard-asserts UAT Community Health Innovation Grant appears in grantor opportunities list; Test 7 verifies Q&A management page loads without auth error for the UAT opportunity**

## Performance

- **Duration:** 8 min
- **Started:** 2026-08-01T13:12:35Z
- **Completed:** 2026-08-01T13:20:49Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added Test 6 ("grantor sees UAT opportunity in opportunities list") — a hard non-advisory assertion that `UAT Community Health Innovation Grant` appears in the grantor's opportunities list after the 05-09 seed fix
- Added Test 7 ("grantor sees submitted questions on Q&A management page") — asserts the Q&A management page renders without auth error when navigating to UAT opportunity's `/qa` route
- Fixed pre-existing Test 4 strict mode violation: `text=Q&A Management` matched both the nav link and the `<h1>`, causing Playwright strict mode to fail; fixed using `h1` filter
- All 7 qa.spec.ts tests pass in a single test session

## Task Commits

Each task was committed atomically:

1. **Task 1: Add non-advisory grantor Q&A management flow tests** - `00b37a7` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `e2e/qa.spec.ts` — Added Tests 6 and 7 (new grantor opportunities list and Q&A management tests); fixed Test 4 strict mode locator ambiguity

## Decisions Made
- Test 6 uses a hard assertion: `expect(page.locator('text=UAT Community Health Innovation Grant')).toBeVisible()` — no `if` guard, fails outright if the opportunity is absent (regression gate)
- Test 7 uses a lenient assertion for question visibility (questions OR no-questions placeholder, NOT error) to handle fresh DB state without Q&A submissions
- Fixed Test 4's `page.locator('text=Q&A Management')` to `page.locator('h1').filter({ hasText: 'Q&A Management' })` — the sidebar nav link also matched, triggering Playwright strict mode violation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Playwright Chromium browser missing**
- **Found during:** Task 1 (running npx playwright test)
- **Issue:** `Executable doesn't exist at /root/.cache/ms-playwright/chromium_headless_shell-1234/...` — browsers not installed
- **Fix:** Ran `npx playwright install chromium` then `npx playwright install-deps chromium` to install browser + libnspr4.so and other system dependencies
- **Files modified:** System-level (not source files)
- **Verification:** All 7 tests ran and passed after install

**2. [Rule 1 - Bug] Fixed Test 4 strict mode violation**
- **Found during:** Task 1 (first full test run)
- **Issue:** `page.locator('text=Q&A Management')` resolved to 2 elements — the nav sidebar link and the `<h1>`, causing Playwright strict mode error
- **Fix:** Changed to `page.locator('h1').filter({ hasText: 'Q&A Management' })` — unambiguous h1 element only
- **Files modified:** `e2e/qa.spec.ts` line 159
- **Verification:** Test 4 passes after fix; matches same pattern used in Tests 6 and 7

---

**Total deviations:** 2 auto-fixed (1 blocking — missing browser install, 1 bug — pre-existing locator ambiguity)
**Impact on plan:** Both auto-fixes necessary for tests to run and pass. No scope creep.

## Issues Encountered
- Playwright Chromium browser (and system deps) not installed in sandbox — required `npx playwright install chromium` and `npx playwright install-deps chromium` to fix
- Test 4 pre-existing strict mode bug: ambiguous text locator matched nav and h1 simultaneously — fixed as part of this task since it blocked the "all 7 tests pass" done criterion

## Known Stubs

None found. The word "placeholder" in qa.spec.ts line 259 is a comment describing UI behavior ("no-questions placeholder"), not a code stub.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 7 qa.spec.ts tests pass — Q&A flow is fully tested end-to-end
- Regression gate in place: future seed regressions (UAT-OPP-001 disappearing from list) will be caught by Test 6
- Phase 5 complete — all plans 01–12 have SUMMARYs; ready for phase 5 verify-work or phase transition

## Self-Check: PASSED

- `e2e/qa.spec.ts` — FOUND (modified)
- Commit 00b37a7 — FOUND (`git log --oneline -1` confirms)
- Build check: N/A for pure test file (TypeScript in e2e/ is transpiled by Playwright at runtime, not via tsc build)
- `npx playwright test e2e/qa.spec.ts` → 7 passed (verified in test run output above)
- No blocking stubs found

---
*Phase: 05-q-a-submission-validation*
*Completed: 2026-08-01*
