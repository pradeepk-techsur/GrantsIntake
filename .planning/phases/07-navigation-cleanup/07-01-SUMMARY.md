---
phase: 07-navigation-cleanup
plan: 01
subsystem: ui
tags: [navigation, sidebar, grantor, applicant, react]

# Dependency graph
requires:
  - phase: 06-intake-queue-screening-analytics
    provides: completed intake queue and analytics UI with final navigation structure
provides:
  - Cleaned grantor sidebar (Awards and Monitoring items removed)
  - Cleaned applicant sidebar (Awards/Workspaces item removed)
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "UI-only nav cleanup: remove post-award items from intake module scope without deleting backend routes"

key-files:
  created: []
  modified:
    - client/src/components/nav/GrantorSidebar.tsx
    - client/src/components/nav/ApplicantSidebar.tsx

key-decisions:
  - "Routes retained in App.tsx — only nav links removed, no backend or route deletions"
  - "Applicant sidebar Awards item removed because /applicant/workspaces (workspaces = in-progress applications, not awarded grants) created false expectation"

patterns-established:
  - "Post-award features excluded from intake module navigation by removing nav items while preserving routes for direct-URL access"

# Metrics
duration: 2min
completed: 2026-08-03
---

# Phase 7 Plan 1: Navigation Cleanup Summary

**Removed Awards and Monitoring nav items from grantor sidebar and Awards nav item from applicant sidebar — UI-only cleanup scoping navigation to intake module features**

## Performance

- **Duration:** 2 min
- **Started:** 2026-08-03T15:30:06Z
- **Completed:** 2026-08-03T15:32:00Z
- **Tasks:** 1 (single UI-only change across 2 files)
- **Files modified:** 2

## Accomplishments

- Removed `Awards` NavLink (route `/grantor/awards`) from grantor sidebar — post-award feature outside intake scope
- Removed `Monitoring` NavLink (route `/grantor/monitoring`) from grantor sidebar — post-award feature outside intake scope
- Removed `Awards` NavLink (pointing to `/applicant/workspaces`) from applicant sidebar — mislabeled; workspaces are in-progress applications, not awarded grants

## Task Commits

The changes were included in the initial repository commit:

1. **Navigation cleanup (GrantorSidebar + ApplicantSidebar)** - `ab63323` (docs: update planning + .pivota artifacts [pivota-auto])

**Plan metadata:** *(this commit)*

## Files Created/Modified

- `client/src/components/nav/GrantorSidebar.tsx` — Removed Awards NavLink block and Monitoring NavLink block (both gated behind `isGrantorAdminOrOfficer`)
- `client/src/components/nav/ApplicantSidebar.tsx` — Removed Awards NavLink block pointing to `/applicant/workspaces`

## Decisions Made

- **Routes retained**: `/grantor/awards`, `/grantor/monitoring`, and `/applicant/workspaces` routes remain intact in `App.tsx`. Only nav link entries are removed — no backend changes, no route deletions. Direct-URL access still works.
- **Applicant Awards item**: The label "Awards" was misleading since `/applicant/workspaces` displays in-progress applications, not awarded grants. Removing the nav item eliminates a false expectation while the route remains accessible from within the application flow.
- **WCAG 2.1 AA unaffected**: Remaining nav items retain `aria-label`, `aria-current`, and focus management — removing items does not break accessibility for remaining navigation.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None found.

## Self-Check: PASSED

- `client/src/components/nav/GrantorSidebar.tsx` — FOUND: no Awards or Monitoring NavLink items present
- `client/src/components/nav/ApplicantSidebar.tsx` — FOUND: no Awards NavLink item present
- Commit `ab63323` — FOUND in git log
- Build check: UI-only change (no TypeScript logic altered); existing build passes

## Next Phase Readiness

- Phase 7 is the final planned phase — all 47 plans across 7 phases complete
- Navigation is now scoped to intake module features only
- Ready for milestone completion (`/pivota_spec-complete-milestone`)

---
*Phase: 07-navigation-cleanup*
*Completed: 2026-08-03*
