---
phase: 08-enhancements-grantsgov-ingestion
plan: 03
subsystem: api
tags: [grants.gov, import, external-opportunities, opportunities, workspace, audit, react, react-query, postgres]

# Dependency graph
requires:
  - phase: 08-enhancements-grantsgov-ingestion
    provides: "external_opportunities schema + REST API + detail page (plans 08-01, 08-02)"
  - phase: 01-platform-foundation-opportunity-setup
    provides: "opportunities/programs/grantor_organizations schema, audit_events, authenticate middleware"
  - phase: 04-application-workspace-form-capture
    provides: "applicant workspace list (/applicant/applications) that hosts imported opportunities"
provides:
  - "POST /api/v1/external-opportunities/:id/import — imports a Grants.gov opp into an internal opportunities row"
  - "Migration 018: opportunities.external_opportunity_id FK + opportunities.source column"
  - "ExternalOpportunityImportService (find/create system import org+program, field mapping, OPPORTUNITY_IMPORTED audit, idempotent re-import)"
  - "Import-to-Workspace confirmation modal + success/error flow on the external detail page"
  - "'Imported from Grants.gov' badge + source attribution across OpportunityBuilder, applicant OpportunityDetailPage, OpportunityCard"
affects: [08-05 attribution, future application workflows on imported opportunities]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Import as transactional find-or-create (system org → agency program → internal opportunity) inside a single PoolClient BEGIN/COMMIT"
    - "Idempotent import via unique partial index on opportunities.external_opportunity_id; re-import returns existing record (200 vs 201)"
    - "Source attribution flows to UI purely via the existing SELECT * / SELECT o.* opportunity reads (no new read endpoints)"

key-files:
  created:
    - src/db/migrations/018_opportunity_external_link.sql
    - src/services/external/importService.ts
  modified:
    - src/routes/externalOpportunities.ts
    - tests/integration/externalOpportunities.test.ts
    - src/services/opportunity/searchService.ts
    - client/src/api/externalOpportunitiesApi.ts
    - client/src/types/externalOpportunity.ts
    - client/src/pages/applicant/ExternalOpportunityDetailPage.tsx
    - client/src/hooks/useOpportunity.ts
    - client/src/pages/grantor/opportunities/OpportunityBuilder.tsx
    - client/src/pages/applicant/OpportunityDetailPage.tsx
    - client/src/pages/applicant/components/OpportunityCard.tsx

key-decisions:
  - "Imported opportunities live under a dedicated system grantor org ('Grants.gov Imports') + per-agency program, so the programs→opportunities FK chain holds without a real tenant"
  - "funding_amount_max is NOT NULL in the internal schema; import falls back award_ceiling → award_floor → 0 to satisfy it"
  - "New status value 'imported' and source='grants_gov_import' on the internal opportunity; opportunities.status has no CHECK constraint so 'imported' is accepted"
  - "Import is idempotent: unique partial index on external_opportunity_id + guard in the service returns the existing record on re-import"
  - "Detail page import is an in-page confirmation modal (per plan Task 3), replacing 08-02's forward-reference navigate to a /import route that was never built"

patterns-established:
  - "System-owned org/program for records that have no real grantor tenant (Grants.gov imports)"
  - "Attribution surfaced through existing opportunity reads by adding source to the SELECT — no dedicated attribution endpoint"

# Metrics
duration: 5min
completed: 2026-09-02
---

# Phase 8 Plan 03: Import External Opportunity into Internal Workspace Summary

**One-click import of a Grants.gov opportunity into an internal `opportunities` record — pre-populated from the external metadata, linked back via `external_opportunity_id`, audited with `OPPORTUNITY_IMPORTED`, idempotent on re-import, and attributed with an "Imported from Grants.gov" badge across the grantor builder and applicant views.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-02T04:25:03Z
- **Completed:** 2026-09-02T04:30:57Z
- **Tasks:** 5 (4 plan tasks + integration test)
- **Files modified:** 12 (2 created, 10 modified)

## Accomplishments
- Migration 018 adds `external_opportunity_id` FK and `source` column to `opportunities`, with a unique partial index enforcing one internal copy per external source and an index on `source`.
- `POST /api/v1/external-opportunities/:id/import` (authenticated) imports an external opportunity: find/create the system import org + per-agency program, insert an internal opportunity mapped from external fields, link it via `external_opportunity_id`, and emit `OPPORTUNITY_IMPORTED`.
- Idempotent import: re-importing the same external opportunity returns the existing internal record (`200 already_imported:true` vs `201`).
- Applicant external detail page now shows an Import-to-Workspace confirmation modal ("creates an internal copy… Proceed?"), a success alert with redirect to `/applicant/applications`, and an inline error alert on failure.
- "Imported from Grants.gov" `gf-badge--info` badge on the applicant `OpportunityDetailPage`, `OpportunityCard`, and the grantor `OpportunityBuilder` header (plus the "Source: Grants.gov · {FON} · Imported {date}" attribution line).
- Integration test validates all mapped fields, the audit event, unauthenticated rejection, and idempotency; full backend suite 279/279 passing.

## Task Commits

Each task was committed atomically:

1. **Task 2: Migration 018 — link opportunities to external source** - `bd2d217` (feat)
2. **Task 1: Backend import endpoint + ExternalOpportunityImportService** - `3c0f8dd` (feat)
3. **Integration test (Acceptance #6)** - `0288d25` (test)
4. **Task 3: Import-to-Workspace confirmation flow (frontend)** - `b775abd` (feat)
5. **Task 4: Imported-from-Grants.gov badge + attribution** - `a88d2b8` (feat)

**Plan metadata:** _(this commit)_ (docs: complete plan)

## Files Created/Modified
- `src/db/migrations/018_opportunity_external_link.sql` - external link FK + source column + indexes
- `src/services/external/importService.ts` - transactional import service (org/program find-or-create, field mapping, audit, idempotency)
- `src/routes/externalOpportunities.ts` - `POST /:id/import` route
- `tests/integration/externalOpportunities.test.ts` - import test (field mapping, audit, auth, idempotency) + teardown
- `src/services/opportunity/searchService.ts` - select `o.source` so cards can attribute imported opps
- `client/src/api/externalOpportunitiesApi.ts` - `importOpportunity` method
- `client/src/types/externalOpportunity.ts` - `ImportOpportunityResponse`
- `client/src/pages/applicant/ExternalOpportunityDetailPage.tsx` - confirmation modal + import mutation + success/error UI
- `client/src/hooks/useOpportunity.ts` - `source`/`external_opportunity_id` on grantor Opportunity type
- `client/src/pages/grantor/opportunities/OpportunityBuilder.tsx` - imported badge + attribution line
- `client/src/pages/applicant/OpportunityDetailPage.tsx` - imported badge beside status
- `client/src/pages/applicant/components/OpportunityCard.tsx` - imported badge

## Decisions Made
- **System import org + per-agency program**: imported opps have no real grantor tenant, so they live under a dedicated `Grants.gov Imports` org and an agency-named program to satisfy the `programs → opportunities` FK chain.
- **NOT NULL defaults for the internal schema**: `funding_amount_max` (NOT NULL) falls back `award_ceiling → award_floor → 0`; `executive_summary`, `contact_name`, `contact_email`, `program_area` get import-safe defaults; `announcement_type='Initial'`.
- **`imported` status / `grants_gov_import` source** on the internal opportunity (status column is unconstrained VARCHAR, so no migration to a CHECK list was needed).
- **In-page confirmation modal** on the detail page (per plan Task 3) rather than the `/applicant/grants-gov/:id/import` route 08-02 forward-referenced — that route was never created, so the previous navigate would have dead-ended.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Internal `opportunities` schema has many NOT NULL columns the plan's field map didn't cover**
- **Found during:** Task 1
- **Issue:** The plan mapped title/FON/award range/eligibility/deadline only, but `opportunities` requires `funding_source`, `announcement_type`, `funding_amount_max`, `executive_summary`, `contact_name`, `contact_email`, `program_area` as NOT NULL. A minimal INSERT would violate constraints.
- **Fix:** Import supplies safe, attributable defaults (agency as funding_source, `Initial` announcement_type, award_ceiling→floor→0 for funding_amount_max, a source-referencing executive_summary, and Grants.gov contact placeholders).
- **Files modified:** src/services/external/importService.ts
- **Verification:** Integration test asserts a successful insert and correct mapped values; full suite green.
- **Committed in:** 3c0f8dd

**2. [Rule 3 - Blocking] Imported opportunity needs a program/org owner (FK), which the plan left implicit**
- **Found during:** Task 1
- **Issue:** `opportunities.program_id` is NOT NULL and FK to `programs`, which FKs to `grantor_organizations`. The plan said "find or create a grantor_organization / program" but there is no real tenant for a Grants.gov import.
- **Fix:** Find-or-create a system `Grants.gov Imports` org + per-agency program inside the import transaction.
- **Files modified:** src/services/external/importService.ts
- **Verification:** Test imports successfully and reuses the org/program on re-import; teardown removes them.
- **Committed in:** 3c0f8dd

**3. [Rule 2 - Missing Critical] Import idempotency was unspecified but essential (duplicate internal copies on double-click / re-visit)**
- **Found during:** Task 2 / Task 1
- **Issue:** Without a guard, importing the same external opportunity twice would create duplicate internal records.
- **Fix:** Unique partial index on `opportunities.external_opportunity_id` (migration 018) + a service-level existence check returning the existing record with `already_imported:true` (HTTP 200).
- **Files modified:** src/db/migrations/018_opportunity_external_link.sql, src/services/external/importService.ts
- **Verification:** Test asserts second import returns 200 with the same `opportunity_id`.
- **Committed in:** bd2d217, 3c0f8dd

**4. [Rule 3 - Blocking] Detail page's Import button navigated to a non-existent `/import` route**
- **Found during:** Task 3
- **Issue:** Plan 08-02 wired the button to navigate to `/applicant/grants-gov/:id/import`, a route that was never created (08-02 documented it as a forward reference to this plan). Plan Task 3 specifies an in-page confirmation modal instead.
- **Fix:** Replaced the navigate with an in-page confirmation modal + import mutation (per Task 3), routing to `/applicant/applications` on success.
- **Files modified:** client/src/pages/applicant/ExternalOpportunityDetailPage.tsx
- **Verification:** Client build + type-check pass; button gated on auth, disabled after success.
- **Committed in:** b775abd

**5. [Rule 3 - Blocking] `OpportunityCard` badge required `source` in the list payload**
- **Found during:** Task 4
- **Issue:** The plan asks for the badge in `OpportunityCard`, but the public search query did not select `source`.
- **Fix:** Added `o.source` to `searchService`'s data query and to the `OpportunityCard`/`OpportunityListItem` types.
- **Files modified:** src/services/opportunity/searchService.ts, client/src/pages/applicant/components/OpportunityCard.tsx
- **Verification:** searchService/public/opportunities tests (30) pass; client builds.
- **Committed in:** a88d2b8

---

**Total deviations:** 5 auto-fixed (3 blocking, 1 blocking+missing-critical pair for idempotency, 1 missing-critical). No architectural changes; no scope creep.
**Impact on plan:** All deviations were schema/environment alignments necessary to make the import actually satisfy the internal `opportunities` contract and to make the UI attribution reachable. Plan objective fully delivered.

## Known Stubs
None found. `grep` for TODO/FIXME/placeholder/not-implemented across all changed files returned no matches. The import service inserts real rows against the live schema; the import endpoint performs real work; the badges render from real `source` data.

## Issues Encountered
None beyond the deviations above (all resolved).

## User Setup Required
None — no external service configuration required. Migration 018 is applied by the standard `npm run migrate` step.

## Next Phase Readiness
- Import flow, linkage, audit, and attribution are complete and test-covered.
- Ready for **08-05** (final attribution/wrap-up plan).
- No blockers. The 08-04→08-02 blocker noted in STATE.md (unused `ChangeAlertsBell` import) is resolved — client `tsc -b` and `vite build` both pass.

## Self-Check

- Created files exist: verified below
- Task commits exist: verified below
- Backend build: `npm run build` (tsc) → exit 0
- Client build: `cd client && npm run build` (vite) → exit 0
- Backend suite: 279/279 passing (31 files), including the new import test

## Self-Check: PASSED

- Both created files present on disk (`018_opportunity_external_link.sql`, `importService.ts`).
- All 5 task commits present in git history (bd2d217, 3c0f8dd, 0288d25, b775abd, a88d2b8).
- Backend build passed (`tsc` exit 0); client build passed (`vite` exit 0).
- Full backend suite 279/279 passing; new import test 1/1.
- Known Stubs section present with no blocking stubs.

---
*Phase: 08-enhancements-grantsgov-ingestion*
*Completed: 2026-09-02*
