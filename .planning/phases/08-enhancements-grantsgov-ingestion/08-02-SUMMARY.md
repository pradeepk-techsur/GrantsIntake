---
phase: 08-enhancements-grantsgov-ingestion
plan: 02
subsystem: ui
tags: [grants.gov, external-opportunities, react, react-query, applicant-portal, grantflow-ds, playwright]

# Dependency graph
requires:
  - phase: 08-enhancements-grantsgov-ingestion
    provides: "REST API at /api/v1/external-opportunities (list/detail/versions/save/alerts) from plan 08-01"
  - phase: 01-platform-foundation-opportunity-setup
    provides: "applicant auth (JWT in Zustand + httpOnly refresh cookie), ApplicantLayout, GrantFlow DS v1.0"
provides:
  - "Browse Grants.gov page with filter sidebar + paginated results (PRD-INTAKE-019C)"
  - "External opportunity detail page with metadata, source attribution, version-history accordion, Import-to-Workspace CTA"
  - "Change-alerts bell in applicant header + full alerts page (PRD-INTAKE-019D)"
  - "Saved from Grants.gov section on applicant dashboard"
  - "externalOpportunitiesApi client + frontend types"
affects: [08-03 import-to-workspace flow, external opportunity browsing UX]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "React Query for external-opportunity list/detail/saved/alerts with shared query keys ['external-opportunities', ...]"
    - "Draft-vs-applied filter state pattern for the filter sidebar (Apply/Clear)"
    - "Card + shared formatting helpers (statusBadge/awardRange/formatDate/isDueSoon) exported from ExternalOpportunityCard"

key-files:
  created:
    - client/src/types/externalOpportunity.ts
    - client/src/api/externalOpportunitiesApi.ts
    - client/src/components/ExternalOpportunityCard.tsx
    - client/src/components/ChangeAlertsBell.tsx
    - client/src/components/SavedOpportunities.tsx
    - client/src/pages/applicant/ExternalOpportunityBrowserPage.tsx
    - client/src/pages/applicant/ExternalOpportunityDetailPage.tsx
    - client/src/pages/applicant/ChangeAlertsPage.tsx
    - e2e/externalOpportunities.spec.ts
  modified:
    - client/src/App.tsx
    - client/src/components/nav/ApplicantSidebar.tsx
    - client/src/layouts/ApplicantLayout.tsx
    - client/src/pages/applicant/WorkspaceListPage.tsx

key-decisions:
  - "E2E spec placed in repo-standard /home/daytona/project/e2e (not client/tests/e2e) to match the existing Playwright testDir"
  - "Task 6 'Saved from Grants.gov' rendered on WorkspaceListPage (the actual /applicant/applications dashboard) since App.tsx has only a placeholder dashboard route"
  - "Import to Workspace navigates to /applicant/grants-gov/:id/import (forward reference to plan 08-03) carrying external metadata via router state"
  - "Status filter is single-select (one active status) matching the backend's single status query param"

patterns-established:
  - "Client mirrors backend persisted types in client/src/types/externalOpportunity.ts (no shared package)"
  - "Shared badge/format helpers exported from the card component and reused by detail + saved views"

# Metrics
duration: 8min
completed: 2026-09-02
---

# Phase 8 Plan 02: Grants.gov Opportunity Browser — Frontend UI Summary

**Applicant-facing Grants.gov browser: filterable/paginated opportunity list, detail page with source attribution and version-history accordion, header change-alerts bell, and a Saved-from-Grants.gov dashboard section — all on the GrantFlow Design System and backed by React Query against the plan 08-01 REST API.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-02T04:12:34Z
- **Completed:** 2026-09-02T04:20:27Z
- **Tasks:** 8 (7 plan tasks + E2E suite)
- **Files modified:** 13 (9 created, 4 modified)

## Accomplishments
- `externalOpportunitiesApi` + frontend types covering list/detail/versions/save/unsave/saved/alerts/mark-read
- `ExternalOpportunityBrowserPage`: two-column filter sidebar (status/agency/keyword/due range/award range) + 25-per-page results, source-attribution badge, save toggle, loading/empty/error states
- `ExternalOpportunityCard`: status badge, award range, due-date highlight within 14 days, truncated eligibility, heart save/unsave, View Details
- `ExternalOpportunityDetailPage`: header, metadata grid, eligibility panel, lazy version-history accordion, source-attribution footer, save + Import-to-Workspace action bar
- `ChangeAlertsBell` in applicant header (unread count, top-5 dropdown, inline mark-as-read) + `ChangeAlertsPage` full list
- `SavedOpportunities` section on the applicant dashboard with unsave action
- Routes + sidebar nav wired; 5/5 Playwright E2E tests passing against the live stack

## Task Commits

1. **Task 1: API client + types** - `c1ec988` (feat)
2. **Task 3: ExternalOpportunityCard** - `8e85409` (feat)
3. **Task 2: ExternalOpportunityBrowserPage** - `c9d4afd` (feat)
4. **Task 4: ExternalOpportunityDetailPage** - `5522ae3` (feat)
5. **Task 5: Change alerts bell + alerts page** - `88a77c2` (feat)
6. **Task 6: Saved from Grants.gov section** - `59132e7` (feat)
7. **Task 7: Routing & sidebar nav** - `c0ceeae` (feat)
8. **E2E tests** - `b50b87c` (test)

## Files Created/Modified
- `client/src/types/externalOpportunity.ts` - frontend mirror of persisted external-opportunity shapes
- `client/src/api/externalOpportunitiesApi.ts` - axios client for /external-opportunities endpoints
- `client/src/components/ExternalOpportunityCard.tsx` - card + shared badge/format helpers
- `client/src/components/ChangeAlertsBell.tsx` - header bell + alert description helper
- `client/src/components/SavedOpportunities.tsx` - saved list table for the dashboard
- `client/src/pages/applicant/ExternalOpportunityBrowserPage.tsx` - browse page
- `client/src/pages/applicant/ExternalOpportunityDetailPage.tsx` - detail page
- `client/src/pages/applicant/ChangeAlertsPage.tsx` - full alerts list
- `client/src/App.tsx` - grants-gov routes
- `client/src/components/nav/ApplicantSidebar.tsx` - Browse Grants.gov nav item
- `client/src/layouts/ApplicantLayout.tsx` - mounted alerts bell in header
- `client/src/pages/applicant/WorkspaceListPage.tsx` - mounted SavedOpportunities section
- `e2e/externalOpportunities.spec.ts` - 5 browser E2E tests

## Decisions Made
- **E2E location:** followed the repo's existing `e2e/` Playwright testDir instead of the plan's `client/tests/e2e/` path (no Playwright config exists under client/).
- **Saved section host:** placed on `WorkspaceListPage` (the live `/applicant/applications` dashboard) — the App.tsx `dashboard` route is a placeholder.
- **Import to Workspace:** navigates to `/applicant/grants-gov/:id/import` carrying external metadata via router state; the import flow itself is plan 08-03's scope.
- **Single-status filter:** the backend list endpoint takes one `status` param, so the status checkbox group behaves as single-select.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] E2E test directory path did not match repo convention**
- **Found during:** E2E test task
- **Issue:** Plan specified `client/tests/e2e/externalOpportunities.spec.ts`, but there is no Playwright config under `client/`; the repo's `playwright.config.ts` uses `testDir: './e2e'` at the project root.
- **Fix:** Authored the spec at `e2e/externalOpportunities.spec.ts` so it is actually discovered and run.
- **Files modified:** e2e/externalOpportunities.spec.ts
- **Verification:** `npx playwright test e2e/externalOpportunities.spec.ts` discovers and runs 5 tests.
- **Committed in:** b50b87c

**2. [Rule 3 - Blocking] Playwright browser binary + system libs missing in sandbox**
- **Found during:** E2E execution
- **Issue:** `chrome-headless-shell` was not installed, then failed with `libnspr4.so: cannot open shared object file`.
- **Fix:** `npx playwright install chromium` then `npx playwright install-deps chromium` (host tooling only — no app code changed).
- **Verification:** 5/5 E2E tests pass against the running stack (client :5173, backend :3000, db/redis healthy).
- **Committed in:** n/a (environment setup, no source change)

**3. [Rule 3 - Blocking] Plan Task 6 targeted a non-existent ApplicantDashboard**
- **Found during:** Task 6
- **Issue:** Plan referenced `ApplicantDashboard.tsx`; the applicant dashboard route in App.tsx is a placeholder, and the real dashboard is `WorkspaceListPage`.
- **Fix:** Built a self-contained `SavedOpportunities` component and mounted it on `WorkspaceListPage`.
- **Files modified:** client/src/components/SavedOpportunities.tsx, client/src/pages/applicant/WorkspaceListPage.tsx
- **Verification:** Component renders saved list + unsave; build passes.
- **Committed in:** 59132e7

---

**Total deviations:** 3 auto-fixed (all blocking — path/environment/target alignment). No scope creep; every plan task delivered.
**Impact on plan:** Plan objective fully delivered. Only correctness/environment alignments were needed.

## Known Stubs
None blocking. The only `grep` hits are legitimate HTML `placeholder` attributes on filter `<input>`s in ExternalOpportunityBrowserPage (cosmetic, expected). The "Import to Workspace" button is a deliberate forward reference to plan 08-03's import flow (documented decision), not an incomplete implementation of this plan's scope.

## Coordination (parallel 08-04)
Work was scoped strictly to `client/**` (browser/cards/detail/alerts/saved/routing/sidebar) and `e2e/`. No backend service/route files were touched. The parallel 08-04 executor's grantor-side commits are interleaved in the shared branch history but touch disjoint files (`client/src/api/externalSyncApi.ts`, grantor dashboard, `src/services/external/*`) — no conflicts.

## Issues Encountered
None beyond the deviations above (all resolved).

## User Setup Required
None — the browser consumes the existing public/authenticated endpoints from plan 08-01.

## Next Phase Readiness
- Applicant Grants.gov browsing, saving, detail, and change alerts are live and E2E-verified.
- Ready for **08-03** (Import to Workspace flow) — the detail page already routes to `/applicant/grants-gov/:id/import` with external metadata in router state.
- No blockers.

## Self-Check

- Created files exist: verified below
- Task commits exist: verified below
- Build: `cd client && npm run build` → exit 0
- E2E: `npx playwright test e2e/externalOpportunities.spec.ts` → 5/5 passing

## Self-Check: PASSED

- All 9 created files present on disk.
- All 8 task commits present in git history (c1ec988, 8e85409, c9d4afd, 5522ae3, 88a77c2, 59132e7, c0ceeae, b50b87c).
- Client build passed (`npm run build` exit 0).
- E2E suite 5/5 passing against live stack.
- Known Stubs section present with no blocking stubs.

---
*Phase: 08-enhancements-grantsgov-ingestion*
*Completed: 2026-09-02*
