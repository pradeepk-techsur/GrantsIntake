---
phase: 08-enhancements-grantsgov-ingestion
plan: 07
subsystem: ui
tags: [react-query, express, playwright, grants-gov, react-router]

# Dependency graph
requires:
  - phase: 08-enhancements-grantsgov-ingestion
    provides: "Import endpoint (POST /external-opportunities/:id/import), migration 018, internal opportunities row (status='imported', source='grants_gov_import') from plan 08-03"
provides:
  - "Authenticated GET /external-opportunities/imported read endpoint listing the Grants.gov-imported internal opportunities"
  - "importService.listImportedOpportunities() read method over opportunities WHERE source='grants_gov_import' AND status='imported'"
  - "WorkspaceListPage success banner (reads router state importedFromGrantsGov) + imported-opportunities list with reused 'Imported from Grants.gov' badge"
  - "externalOpportunitiesApi.listImported() client method + ImportedOpportunityListItem/ImportedListResponse types"
  - "e2e regression asset re-proving gap uat/5: import → land on /applicant/applications → banner + badge + no-duplicate"
affects: [uat-verification, applicant-portal]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Static authenticated read route declared before the /:id catch-all so the literal /imported segment is not swallowed"
    - "Router-state signal (navigate state importedFromGrantsGov) consumed via useLocation to render one-shot success feedback on the redirect destination"

key-files:
  created: []
  modified:
    - src/services/external/importService.ts
    - src/routes/externalOpportunities.ts
    - tests/integration/externalOpportunities.test.ts
    - client/src/types/externalOpportunity.ts
    - client/src/api/externalOpportunitiesApi.ts
    - client/src/pages/applicant/WorkspaceListPage.tsx
    - client/src/pages/applicant/ExternalOpportunityDetailPage.tsx
    - e2e/externalOpportunities.spec.ts

key-decisions:
  - "Kept the redirect on /applicant/applications and surfaced the imported opp via a minimal authenticated read endpoint + banner (not by loosening publicOpportunities.ts 404-on-unpublished access control, which is out of scope/security-sensitive)"
  - "Imported list is not per-applicant scoped: returns all opportunities WHERE source='grants_gov_import' AND status='imported' (they live under the shared system 'Grants.gov Imports' org)"
  - "e2e no-duplicate truth asserted at the surface the user sees (imported-opportunity-card count === 1), independent of import call count"

patterns-established:
  - "status_badge derived from application_close_date server-side (no date/open; past/closed; ≤7d/closing_soon) to satisfy the OpportunityCard card contract"

# Metrics
duration: 6 min
completed: 2026-09-02
---

# Phase 8 Plan 07: Import Visibility (uat/5 gap closure) Summary

**Closed UAT gap uat/5 by making a successful Grants.gov import observable: a new authenticated `GET /external-opportunities/imported` read endpoint plus a success banner and imported-opportunities list on `/applicant/applications`, with an e2e test re-proving import → banner → badge → no-duplicate.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-09-02T13:10:09Z
- **Completed:** 2026-09-02T13:17:07Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Added `GET /api/v1/external-opportunities/imported` (behind `authenticate`, declared before the `/:id` catch-all) backed by `importService.listImportedOpportunities()` — a read-only surface; the import write path (transaction) is untouched.
- WorkspaceListPage now reads `location.state.importedFromGrantsGov` and renders a dismissible success banner, and lists imported opportunities (queried from the new endpoint) each carrying the reused `gf-badge gf-badge--info` "Imported from Grants.gov" badge.
- ExternalOpportunityDetailPage additionally invalidates `['imported-opportunities']` on import success so the freshly imported opp appears without a manual refresh (navigate target/delay/alerts unchanged).
- New integration tests (happy path, double-import single-item idempotency surface, 401 auth) and a new Playwright test that reproduces UAT test 5 end to end.

## Task Commits

1. **Task 1: authenticated GET /external-opportunities/imported read endpoint** - `c89c890` (feat)
2. **Task 2: success banner + imported opps on WorkspaceListPage** - `99ade50` (feat)
3. **Task 3: e2e reproducing UAT test 5** - `991d4c3` (test)

## Files Created/Modified
- `src/services/external/importService.ts` - Added `ImportedOpportunityListItem` interface + `listImportedOpportunities()` query and date/badge helpers; write path unchanged.
- `src/routes/externalOpportunities.ts` - New `GET /external-opportunities/imported` route, ordered before `/:id`.
- `tests/integration/externalOpportunities.test.ts` - 3 new integration tests for the imported list.
- `client/src/types/externalOpportunity.ts` - `ImportedOpportunityListItem` / `ImportedListResponse` types.
- `client/src/api/externalOpportunitiesApi.ts` - `listImported()` client method.
- `client/src/pages/applicant/WorkspaceListPage.tsx` - `useLocation` banner + imported-opportunities section with reused badge.
- `client/src/pages/applicant/ExternalOpportunityDetailPage.tsx` - Invalidate `['imported-opportunities']` on import success.
- `e2e/externalOpportunities.spec.ts` - New import→banner→badge→no-duplicate test; fixed stale MOCK_OPP fixture (added inline `versions[]`).

## Decisions Made
- Fix scoped to the redirect destination + feedback and a minimal read endpoint; did NOT loosen `publicOpportunities.ts` access control (imported opps are `status='imported'` with no `public_slug`, so `/opportunities/:id` 404s — out of scope, security-sensitive).
- Imported list returns all imported opportunities (shared system import org, not per-applicant scoped).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed Playwright chromium browser + OS deps**
- **Found during:** Task 3 (e2e run)
- **Issue:** `npx playwright test` failed: browser binary missing, then `libnspr4.so` shared-library error — the sandbox had no Chromium installed.
- **Fix:** `npx playwright install chromium` + `npx playwright install-deps chromium` (system libs: libnspr4, libnss3, etc.).
- **Files modified:** None (environment only)
- **Verification:** Spec launches and runs; 6/6 tests pass.
- **Committed in:** N/A (no source change)

**2. [Rule 1 - Bug] Fixed stale MOCK_OPP fixture in the e2e spec**
- **Found during:** Task 3 (full-spec green requirement)
- **Issue:** The pre-existing "version history accordion" test (line 216) failed on both pre- and post-change code — the detail page reads `opp.versions` inline (Plan 08-05 detail-response contract), but MOCK_OPP had no `versions`, so the accordion rendered 0 items and `toHaveCount(2)` failed.
- **Fix:** Added inline `versions[]` to MOCK_OPP matching the shipped detail-response contract.
- **Files modified:** e2e/externalOpportunities.spec.ts
- **Verification:** Full spec now passes 6/6 (0 failing, 0 skipped), satisfying Task 3's done criteria.
- **Committed in:** `991d4c3` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking env, 1 test-fixture bug)
**Impact on plan:** Both necessary to satisfy the plan's "full spec green" requirement; no scope creep — no application/source behavior changed by either.

## Known Stubs
None found — grep for TODO/FIXME/placeholder/not-implemented across all changed files returned nothing; no hardcoded handlers or empty bodies introduced.

## Issues Encountered
None beyond the two deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Gap uat/5 is closed and covered by a permanent integration + e2e regression asset.
- Backend 288/288 tests passing; backend `tsc` build clean; client `tsc --noEmit` + `vite build` clean; e2e spec 6/6 green.
- Import endpoint, import write transaction, migration 018, and ingestion remain unchanged.

## Self-Check: PASSED
- Commits verified present: c89c890, 99ade50, 991d4c3.
- All modified files exist on disk.
- Plan-level build ran: backend `tsc` → exit 0; client `vite build` → exit 0.
- `## Known Stubs` present, no blocking stubs.
- Verification: `NODE_ENV=test npx vitest run` → 288 passed; `npx playwright test e2e/externalOpportunities.spec.ts` → 6 passed.

---
*Phase: 08-enhancements-grantsgov-ingestion*
*Completed: 2026-09-02*
