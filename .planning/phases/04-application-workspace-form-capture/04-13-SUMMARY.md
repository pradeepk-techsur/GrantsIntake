---
phase: 04-application-workspace-form-capture
plan: 13
subsystem: ui
tags: [react, react-query, uswds, css, overflow, playwright, workspace]

# Dependency graph
requires:
  - phase: 04-application-workspace-form-capture
    provides: WorkspacePage 3-column grid layout, AttachmentManager table, ReadinessDashboard component
provides:
  - WorkspacePage fetches opportunity title via secondary useQuery (GET /api/v1/opportunities/:id)
  - WorkspacePage header renders opportunity title instead of raw UUID with UUID fallback
  - grid-col-6 content column has overflow:hidden preventing wide tables from overflowing Readiness Dashboard
  - AttachmentManager usa-table wrapped in overflow-x:auto div for horizontal scroll containment
  - ReadinessDashboard loading state uses plain div (no usa-prose) matching rest of component
  - Playwright regression tests for all three layout fixes (6 pass, 1 skip-on-empty-state)
affects:
  - UAT Tests 3, 5, 8 (readiness alignment, opportunity header context, attachment table layout)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Secondary useQuery for public endpoint data: queryKey includes dependency field, enabled guard on workspaceQuery.data?.field"
    - "overflow:hidden on grid column prevents child tables from visually overflowing sibling columns"
    - "overflow-x:auto wrapper div on usa-table for horizontal scroll containment within constrained column"

key-files:
  created: []
  modified:
    - client/src/pages/applicant/WorkspacePage.tsx
    - client/src/components/workspace/AttachmentManager.tsx
    - client/src/components/workspace/ReadinessDashboard.tsx
    - e2e/workspace-layout-fixes.spec.ts
    - playwright.config.ts

key-decisions:
  - "opportunityQuery uses workspaceQuery.data?.opportunity_id as dependency (not workspace local var) — query must be declared before the loading/error guards where workspace is defined"
  - "opportunityQuery.data ?? workspace.opportunity_id graceful fallback — renders UUID if opportunity fetch fails (e.g. not yet published)"
  - "playwright.config.ts baseURL corrected from 3000 (API server) to 5173 (Vite dev server) — frontend served by Vite, API proxied by Vite to port 3000"

patterns-established:
  - "Secondary useQuery for public lookup data: enabled on parent query's .data field, staleTime matches data change frequency"

# Metrics
duration: 9min
completed: 2026-07-30
---

# Phase 04 Plan 13: Workspace Layout Fixes Summary

**WorkspacePage fetches opportunity title from public API endpoint with UUID fallback; overflow:hidden on content column and overflow-x:auto on attachment table prevent Readiness Dashboard misalignment**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-07-30T19:36:00Z
- **Completed:** 2026-07-30T19:45:32Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- WorkspacePage adds `opportunityQuery` (useQuery with queryKey `['opportunity-title', ...]`) fetching `GET /api/v1/opportunities/:id` — renders title in header, falls back to UUID if fetch fails
- `grid-col-6` content div gets `style={{ overflow: 'hidden' }}` — prevents BudgetBuilder/AttachmentManager wide tables from visually overflowing into Readiness Dashboard column
- AttachmentManager `usa-table` wrapped in `<div style={{ overflowX: 'auto' }}>` — table scrolls horizontally within its column rather than expanding it
- ReadinessDashboard loading state: `<div className="usa-prose">` → `<div>` with `<p className="usa-hint">` (removed layout-interfering typography wrapper)
- Playwright tests: 3 new regression tests added; all 7 tests pass or skip (6 pass, 1 skip on empty attachment state), 0 failed

## Task Commits

Each task was committed atomically:

1. **Task 1: WorkspacePage fetch opportunity title + overflow:hidden** - `a200332` (feat)
2. **Task 2: AttachmentManager overflow-x:auto + ReadinessDashboard fix + Playwright** - `a72cfc0` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `client/src/pages/applicant/WorkspacePage.tsx` — added `opportunityQuery` useQuery, title rendering with UUID fallback, `overflow:hidden` on content column
- `client/src/components/workspace/AttachmentManager.tsx` — wrapped `usa-table` in `<div style={{ overflowX: 'auto' }}>`
- `client/src/components/workspace/ReadinessDashboard.tsx` — removed `usa-prose` class from loading state div
- `e2e/workspace-layout-fixes.spec.ts` — 3 new regression tests: overflow:hidden on content column, opportunity hint text presence, overflow-x:auto on attachment table wrapper
- `playwright.config.ts` — corrected `baseURL` from `localhost:3000` (API server) to `localhost:5173` (Vite frontend)

## Decisions Made

- `opportunityQuery` must be declared before loading/error guards (uses `workspaceQuery.data?.opportunity_id` not the local `workspace` variable which is only defined post-guards)
- `opportunityQuery.data ?? workspace.opportunity_id` graceful fallback renders UUID if opportunity fetch fails (e.g. opportunity not yet published or API error)
- `playwright.config.ts` baseURL corrected to 5173 — previous plan 04-10 claims tests passed but config had wrong port; the Vite dev server (5173) serves the React frontend and proxies `/api` to the Express server (3000)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] playwright.config.ts baseURL pointed at API server (3000) instead of Vite frontend (5173)**
- **Found during:** Task 2 (running Playwright tests)
- **Issue:** `baseURL: 'http://localhost:3000'` — port 3000 is the Express API server; the React frontend is served by Vite at 5173. All Playwright tests failed at `page.goto('/login')` because the API server returned 404 for non-API routes.
- **Fix:** Changed `baseURL` to `'http://localhost:5173'`
- **Files modified:** `playwright.config.ts`
- **Verification:** All 7 tests pass or skip (6 pass, 1 skip on empty attachment state) after fix
- **Committed in:** `a72cfc0` (Task 2 commit)

**2. [Rule 3 - Blocking] Database had no tables — login API returned INTERNAL_ERROR**
- **Found during:** Task 2 (Playwright login tests failing at `waitForURL`)
- **Issue:** The running Express server had `DATABASE_URL` pointing at Postgres but migrations had not run in the current session — `users` table did not exist, login endpoint returned `{"error":"INTERNAL_ERROR","message":"Login failed"}`
- **Fix:** Ran `npx tsx src/db/migrate.ts` and `npx tsx src/db/seed.ts` to apply all 15 migrations and seed applicant/grantor users + UAT scenarios
- **Files modified:** None (runtime fix — database state)
- **Verification:** `curl POST /api/v1/auth/login` returns 200 with access_token; Playwright tests all pass
- **Committed in:** N/A (database state, not tracked in git)

---

**Total deviations:** 2 auto-fixed (1 Rule 1 - Bug, 1 Rule 3 - Blocking)
**Impact on plan:** Both fixes required for tests to run. No scope creep — fixes were necessary preconditions for verification.

## Known Stubs

None found.

## Issues Encountered

None beyond documented deviations.

## Self-Check

- [x] `client/src/pages/applicant/WorkspacePage.tsx` — `opportunityQuery`, `opportunity-title` queryKey, `overflow:hidden` all present
- [x] `client/src/components/workspace/AttachmentManager.tsx` — `overflowX: 'auto'` wrapper present
- [x] `client/src/components/workspace/ReadinessDashboard.tsx` — `usa-prose` absent from loading state
- [x] `e2e/workspace-layout-fixes.spec.ts` — 3 new tests added
- [x] Commits `a200332` and `a72cfc0` exist in git log
- [x] `npx tsc --noEmit` → exit 0 (TSC_OK)
- [x] Playwright tests: 6 passed, 1 skipped, 0 failed
- [x] No blocking stubs found

## Self-Check: PASSED

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three layout/display bugs closed: opportunity title in header, content column overflow containment, attachment table horizontal scroll
- UAT Tests 3, 5, 8 should now pass with aligned Readiness Dashboard, opportunity title in header, and contained attachment table
- Phase 04 gap closure plans complete

---
*Phase: 04-application-workspace-form-capture*
*Completed: 2026-07-30*
