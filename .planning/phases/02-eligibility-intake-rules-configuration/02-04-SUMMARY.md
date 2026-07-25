---
phase: 02-eligibility-intake-rules-configuration
plan: "04"
subsystem: ui, api
tags: [react, typescript, react-router-dom, uswds, publication-service, opportunity-listing]

# Dependency graph
requires:
  - phase: 02-eligibility-intake-rules-configuration
    provides: publicationService.publish() with slug generation; GET /programs/:programId/opportunities endpoint; all builder-tab routes
provides:
  - "OpportunitiesIndex with live opportunity fetch from GET /programs/:programId/opportunities"
  - "Publish route delegating to publicationService — public_slug non-null after publish"
affects:
  - phase-03-applicant-portal

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useEffect with programId dependency to fetch opportunities list"
    - "Delegation pattern: route handler → service layer for domain operations"

key-files:
  created: []
  modified:
    - client/src/pages/grantor/OpportunitiesIndex.tsx
    - src/routes/opportunities.ts

key-decisions:
  - "Keep versioningService import in opportunities.ts — still used by PATCH handler and GET /versions"
  - "Add COMPLETENESS_BLOCKERS catch block as belt-and-suspenders in publish handler"
  - "Integration test failures are pre-existing (no DB schema in non-compose environment) — confirmed by stash check"

patterns-established:
  - "Route handlers delegate to service layer for domain logic — no inline SQL in route handlers for publish operations"

# Metrics
duration: 8min
completed: 2026-07-25
---

# Phase 2 Plan 04: UAT Gap Closure — Opportunity Listing & Publish Slug Summary

**OpportunitiesIndex now fetches live from GET /programs/:programId/opportunities with USWDS card list; publish route delegates to publicationService generating non-null public_slug**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-07-25T23:08:00Z
- **Completed:** 2026-07-25T23:16:02Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `OpportunitiesIndex.tsx` fetches existing opportunities via `apiClient.get(/programs/:programId/opportunities)` and renders them as USWDS card list with react-router-dom `Link` to each builder
- "No opportunities yet" alert now shown only when the list is empty after the fetch (not unconditionally)
- `POST /api/v1/opportunities/:id/publish` now delegates entirely to `publicationService.publish()` which generates `public_slug` — eliminates the bug where inline UPDATE omitted the slug field
- Redundant versioningService.createSnapshot and audit_events INSERT removed from publish handler (publicationService handles both)
- COMPLETENESS_BLOCKERS error handler added as belt-and-suspenders in publish catch block

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement opportunity listing in OpportunitiesIndex** - `f52c6c7` (feat)
2. **Task 2: Fix publish route to delegate to publicationService** - `81b9b57` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `client/src/pages/grantor/OpportunitiesIndex.tsx` — Added OpportunityListItem type, useEffect to fetch /programs/:programId/opportunities, loading state, conditional rendering (loading → empty → list of USWDS cards with Link)
- `src/routes/opportunities.ts` — Added publicationService import; replaced inline pool.query UPDATE + redundant snapshot/audit blocks with single publicationService.publish() call; added COMPLETENESS_BLOCKERS handler

## Decisions Made
- Kept `versioningService` import because it's still used in the PATCH handler (post-publication snapshots) and GET /versions handler
- Added `COMPLETENESS_BLOCKERS` catch block despite upstream dry-run gate because publicationService may still throw it in race conditions
- Used `Link` from react-router-dom (already a project dependency, used in sibling components like Dashboard.tsx and OpportunityBuilder.tsx)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Integration tests (opportunities, publicOpportunities) fail with "relation 'users' does not exist" — this is a pre-existing condition (no DB migrations applied outside docker compose). Verified by running tests both before and after changes; same failures. Not caused by this plan's changes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- UAT Tests 2, 3, 4, 5, 6 unblocked — opportunities now visible in the index, builder tabs reachable via `/grantor/opportunities/:id`
- UAT Test 7 fixed — `public_slug` is non-null after publish (publicationService generates it)
- UAT Tests 8, 9, 10 unblocked — public portal links at `/opportunities/:slug` now resolve correctly
- Phase 2 plans complete; ready for Phase 3 applicant portal work

---
*Phase: 02-eligibility-intake-rules-configuration*
*Completed: 2026-07-25*
