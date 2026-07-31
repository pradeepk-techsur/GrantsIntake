---
phase: 04-application-workspace-form-capture
plan: 10
subsystem: ui
tags: [react, react-router, uswds, playwright, grid-layout, auth-routing]

# Dependency graph
requires:
  - phase: 04-application-workspace-form-capture
    provides: WorkspacePage 3-column layout and ApplicantLayout routing structure
provides:
  - Login redirect to /applicant/applications for non-grantor users
  - WorkspacePage 3-column USWDS grid (3+6+3=12) filling full desktop:grid-col-9 parent
  - ApplicantLayout <main> without usa-prose class
  - WorkspaceSectionPanel root div without usa-prose class
  - Playwright regression tests for login redirect and workspace layout
affects:
  - UAT Tests 3, 5, 6, 7, 9 (all unblocked by these routing/layout fixes)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "In-SPA navigation via window.history.pushState + PopStateEvent for Playwright tests that require Zustand state preservation across route changes"

key-files:
  created:
    - e2e/workspace-layout-fixes.spec.ts
  modified:
    - e2e/workspace-layout-fixes.spec.ts

key-decisions:
  - "Playwright tests use window.history.pushState + PopStateEvent for in-SPA navigation to avoid clearing in-memory Zustand accessToken on full page.goto reload"
  - "All routing and grid fixes (LoginPage, App.tsx, WorkspacePage, ApplicantLayout, WorkspaceSectionPanel) were already present in initial commit; plan confirmed correct state and added regression test coverage"

patterns-established:
  - "SPA navigation pattern: use page.evaluate with history.pushState + PopStateEvent instead of page.goto when tests need to preserve Zustand in-memory state across route changes"

# Metrics
duration: 5min
completed: 2026-07-30
---

# Phase 04 Plan 10: Workspace Layout Fixes Summary

**Login redirect to /applicant/applications, 3-col USWDS grid (3+6+3=12), double usa-prose removal confirmed correct, and Playwright regression tests made fully passing with in-SPA navigation fix**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-30T15:15:29Z
- **Completed:** 2026-07-30T15:21:15Z
- **Tasks:** 2
- **Files modified:** 1 (e2e/workspace-layout-fixes.spec.ts)

## Accomplishments

- Verified all four routing/layout fixes from plan 04-08 are correctly in place:
  - LoginPage.tsx navigates non-grantor users to `/applicant/applications`
  - App.tsx `/applicant` index route redirects to `/applicant/applications`
  - WorkspacePage.tsx uses `grid-col-3 + grid-col-6 + grid-col-3 = 12` (not 2+5+2=9)
  - ApplicantLayout.tsx `<main>` does not carry `usa-prose` class
  - WorkspaceSectionPanel.tsx root div does not carry `usa-prose` class
- Created/updated `e2e/workspace-layout-fixes.spec.ts` with 4 Playwright tests, all passing
- Fixed Playwright test auth navigation bug — tests now use in-SPA `history.pushState` to preserve Zustand token

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix login redirect and workspace grid layout** - `e5d7048` (verified in initial commit — no new commit needed as all changes were already present)
2. **Task 2: Remove double usa-prose nesting and add Playwright regression tests** - `46e57db` (fix: Playwright test auth navigation for in-memory Zustand token)

**Plan metadata:** (included in final docs commit)

## Files Created/Modified

- `e2e/workspace-layout-fixes.spec.ts` - 4 Playwright regression tests for login redirect and workspace layout; fixed auth navigation to use in-SPA `history.pushState` instead of full `page.goto` that clears Zustand state

## Decisions Made

- **In-SPA navigation pattern for Playwright tests**: When tests need to navigate between routes while preserving Zustand in-memory auth state, use `page.evaluate(() => { window.history.pushState({}, '', '/target'); window.dispatchEvent(new PopStateEvent('popstate')); })` instead of `page.goto('/target')`. The latter triggers a full page reload that resets the Zustand store to `accessToken: null`, causing the auth guard to redirect to `/login`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Playwright tests failed due to full page.goto clearing in-memory Zustand accessToken**
- **Found during:** Task 2 (running Playwright tests)
- **Issue:** Tests 2, 3, and 4 all used `page.goto('/applicant/...')` after login. This triggers a full page reload, resetting the Zustand store to `accessToken: null`. The ApplicantLayout auth guard then redirects to `/login` before React Router can process the target route, causing tests to fail or skip.
- **Fix:** Changed all post-login navigations to use `page.evaluate(() => { window.history.pushState({}, '', route); window.dispatchEvent(new PopStateEvent('popstate')); })` — this navigates within the SPA context, preserving Zustand state.
- **Files modified:** `e2e/workspace-layout-fixes.spec.ts`
- **Verification:** All 4 tests pass (0 failing, 0 skipped) — `npx playwright test e2e/workspace-layout-fixes.spec.ts`
- **Committed in:** `46e57db`

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Required fix to make all 4 Playwright tests actually pass. The fix correctly models the in-memory-only auth architecture where Zustand state does not persist across page reloads.

## Known Stubs

None found.

## Issues Encountered

None — all code changes for routing and layout were already in place from the initial project commit (plan 04-08 gap closure). This plan confirmed correct state, added regression test file, and fixed the test auth navigation pattern.

## Self-Check

- [x] `e2e/workspace-layout-fixes.spec.ts` exists on disk
- [x] Commit `46e57db` exists in git log
- [x] TypeScript build passes (`tsc --noEmit` → exit 0)
- [x] Playwright tests: 4 passed, 0 failed, 0 skipped
- [x] No blocking stubs found
- [x] All plan verification criteria met

## Self-Check: PASSED

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Routing and layout fixes confirmed; UAT Tests 3, 5, 6, 7, 9 should now pass with correct redirects and grid layout
- Plan 04-11 is the remaining unexecuted plan in phase 04

---
*Phase: 04-application-workspace-form-capture*
*Completed: 2026-07-30*
