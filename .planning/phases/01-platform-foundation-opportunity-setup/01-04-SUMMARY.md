---
phase: 01-platform-foundation-opportunity-setup
plan: 04
subsystem: api
tags: [postgresql, express, react, uswds, react-query, typescript, playwright, versioning, completeness, deadlines]

# Dependency graph
requires:
  - phase: 01-platform-foundation-opportunity-setup
    plan: 01
    provides: "authenticate, requireRole middleware; pool, db; audit_events schema"
  - phase: 01-platform-foundation-opportunity-setup
    plan: 03
    provides: "opportunities table with all F4 deadline columns; OpportunityService; opportunitiesRouter"
provides:
  - opportunity_versions table with immutability trigger (prevent_version_mutation)
  - DeadlineService: validates all 5 F4 deadline rules (tested)
  - CompletenessService: returns section-labeled blockers for all required publication fields (tested)
  - VersioningService: createSnapshot (delta computation, OPPORTUNITY_UPDATED_PUBLISHED audit), listVersions, getVersion
  - POST /api/v1/opportunities/:id/publish — completeness check, dry_run support, version 1 creation, OPPORTUNITY_PUBLISHED audit, 409 on re-publish
  - PATCH /opportunities/:id — extended with modification_reason required for published opportunities, deadline validation, post-publish versioning
  - GET /opportunities/:id/versions — real version history (replaces stub)
  - DeadlineForm.tsx — F4 date/time fields with client-side validation and auto-save
  - CompletenessChecklist.tsx — real-time publication readiness sidebar with Check Readiness + Publish buttons
  - VersionHistory.tsx — immutable version history USWDS table
  - OpportunityBuilder.tsx — tab navigation, modification reason modal for post-publication edits
  - 25 integration tests passing (deadlines, completeness, versioning)
  - 12 Playwright e2e tests written (deferred to verify phase)
affects:
  - Phase 2 (eligibility rules, form sections — two commented-out TODOs in completenessService)
  - All phases using opportunities data with publication workflow

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Immutability via DB trigger: prevent_version_mutation() BEFORE UPDATE OR DELETE on opportunity_versions"
    - "Version snapshot: full opportunity JSONB + per-field delta {old, new} computed in service layer"
    - "Dry run pattern: POST /publish?dry_run=true returns blockers without state change"
    - "Post-publication modification_reason: required at route layer (400 before service call) for published opportunities"
    - "Test cleanup for immutable tables: DISABLE TRIGGER / ENABLE TRIGGER in afterAll"
    - "Client-side completeness derived from opportunity data — mirrors server rules for real-time feedback without network calls"
    - "Modification reason modal: opened by handleSave when opportunity.status=published; patch deferred until reason provided"

key-files:
  created:
    - src/db/migrations/004_opportunity_versions_schema.sql
    - src/services/opportunity/deadlineService.ts
    - src/services/opportunity/completenessService.ts
    - src/services/opportunity/versioningService.ts
    - tests/integration/deadlines.test.ts
    - tests/integration/completeness.test.ts
    - tests/integration/versioning.test.ts
    - client/src/pages/grantor/opportunities/DeadlineForm.tsx
    - client/src/pages/grantor/opportunities/CompletenessChecklist.tsx
    - client/src/pages/grantor/opportunities/VersionHistory.tsx
    - e2e/deadlines-completeness-versioning.spec.ts
  modified:
    - src/routes/opportunities.ts (new publish endpoint, real versions endpoint, PATCH updated for post-pub)
    - src/types/opportunity.ts (deadline fields, modification_reason in UpdateOpportunityInput)
    - src/services/opportunity/opportunityService.ts (added deadline fields to allowedFields in update)
    - client/src/hooks/useOpportunity.ts (extended Opportunity type; added OpportunityVersion, CompletenessResult types; usePublishOpportunity, useCheckReadiness, useOpportunityVersions hooks)
    - client/src/pages/grantor/opportunities/OpportunityBuilder.tsx (replaced placeholder with CompletenessChecklist; added DeadlineForm and VersionHistory tabs; modification reason modal)

key-decisions:
  - "Test cleanup for immutable opportunity_versions: ALTER TABLE DISABLE TRIGGER in afterAll (triggers fire even in tests)"
  - "Dry run pattern: POST /publish?dry_run=true returns completeness result without state change — required by CompletenessChecklist Check Readiness button"
  - "Client-side completeness derived from opportunity prop — avoids extra API call for real-time checklist feedback; server validates on actual publish"
  - "Modification reason modal intercepted in OpportunityBuilder.handleSave — not in MetadataForm or DeadlineForm (avoids prop drilling)"
  - "Playwright e2e tests written but deferred to verify phase per test execution boundary"

patterns-established:
  - "DB trigger immutability: test cleanup must DISABLE/ENABLE TRIGGER around DELETE in afterAll for immutable tables"
  - "Completeness two-layer: client-side derived checklist for real-time UX + server-side authoritative check before publish"
  - "Post-publication versioning: route checks current.status='published' before createSnapshot; service computes delta inline"

# Metrics
duration: 9min
completed: 2026-07-25
---

# Phase 1 Plan 04: Deadlines, Completeness Validation, and Opportunity Versioning Summary

**PostgreSQL opportunity_versions table with immutability trigger, DeadlineService (5 rules), CompletenessService (section-labeled blockers), VersioningService (snapshot + delta), POST /publish endpoint (dry_run support, OPPORTUNITY_PUBLISHED audit), and React UI: DeadlineForm, CompletenessChecklist sidebar, VersionHistory tab, modification reason modal**

## Performance

- **Duration:** 9 min
- **Started:** 2026-07-25T02:40:36Z
- **Completed:** 2026-07-25T02:50:18Z
- **Tasks:** 2 completed
- **Files modified:** 14 (11 created, 3 modified)

## Accomplishments

- opportunity_versions table with `uq_opportunity_version` constraint and `prevent_version_mutation()` DB trigger that rejects UPDATE/DELETE — immutability enforced at DB layer (T-04-03)
- DeadlineService validates all 5 F4 rules: open < close, pre-app < open, loi < close, loi-required requires loi_deadline, rolling-review requires cadence > 0
- CompletenessService checks all 10 metadata fields + 2 deadline fields + federal ALN + LOI deadline (when required) with section labels; Phase 2 TODOs commented out
- VersioningService: createSnapshot (MAX(version_number)+1, delta computation, OPPORTUNITY_UPDATED_PUBLISHED audit), listVersions (DESC), getVersion
- POST /publish: completeness gate (422 + blockers), dry_run=true mode, publishes (updates status/published_at/published_by), creates version 1, logs OPPORTUNITY_PUBLISHED, returns 409 on re-publish
- PATCH updated: modification_reason required for published opportunities (400 before service call), deadline validation on any deadline field patch, post-publication createSnapshot
- React UI: DeadlineForm with client-side mirrored validation, CompletenessChecklist (derived real-time + Check Readiness dry_run + Publish button), VersionHistory (USWDS table, DESC order), OpportunityBuilder tabs + modification reason modal
- 25 integration tests passing (7 deadlines, 8 completeness, 10 versioning); 12 Playwright e2e tests written for verify phase

## Task Commits

Each task was committed atomically:

1. **Task 1: Versioning schema, deadline/completeness/versioning services, and updated API endpoints** - `644e30b` (feat)
2. **Task 2: Deadline form, completeness checklist, and version history React UI** - `89edc47` (feat)

## Files Created/Modified

- `src/db/migrations/004_opportunity_versions_schema.sql` — opportunity_versions DDL with uq_opportunity_version UNIQUE constraint and prevent_version_mutation() immutability trigger
- `src/services/opportunity/deadlineService.ts` — DeadlineService.validate() enforcing all 5 F4 deadline rules
- `src/services/opportunity/completenessService.ts` — CompletenessService.check() returning section-labeled blockers for all F5 publication requirements
- `src/services/opportunity/versioningService.ts` — VersioningService (createSnapshot, listVersions, getVersion) with OPPORTUNITY_UPDATED_PUBLISHED audit
- `src/routes/opportunities.ts` — POST /publish (completeness gate, dry_run, versioning, OPPORTUNITY_PUBLISHED audit, 409); PATCH updated (modification_reason, deadline validation, post-pub versioning); GET /versions (real implementation)
- `src/types/opportunity.ts` — deadline fields + modification_reason added to UpdateOpportunityInput
- `src/services/opportunity/opportunityService.ts` — deadline fields added to allowedFields in update()
- `tests/integration/deadlines.test.ts` — 7 tests covering all 5 deadline validation rules
- `tests/integration/completeness.test.ts` — 8 tests: publication blockers, successful publish, 409 re-publish, audit events, version 1, dry_run
- `tests/integration/versioning.test.ts` — 10 tests: modification_reason required, version snapshot with delta, versions DESC, immutability trigger (UPDATE+DELETE), OPPORTUNITY_UPDATED_PUBLISHED audit
- `client/src/hooks/useOpportunity.ts` — extended types + usePublishOpportunity, useCheckReadiness, useOpportunityVersions hooks
- `client/src/pages/grantor/opportunities/DeadlineForm.tsx` — F4 date/time form with client-side validation and auto-save on blur
- `client/src/pages/grantor/opportunities/CompletenessChecklist.tsx` — real-time readiness sidebar
- `client/src/pages/grantor/opportunities/VersionHistory.tsx` — USWDS table for immutable version history
- `client/src/pages/grantor/opportunities/OpportunityBuilder.tsx` — tabs, CompletenessChecklist, modification reason modal

## Decisions Made

- **Test cleanup for immutable tables**: `ALTER TABLE opportunity_versions DISABLE TRIGGER opportunity_versions_immutable` before `DELETE` in `afterAll`. The immutability trigger fires even during test cleanup — discovered during first test run, auto-fixed per Rule 1.
- **Dry run pattern**: `POST /publish?dry_run=true` returns `CompletenessResult` without state change. Used by "Check Readiness" button in CompletenessChecklist sidebar to show blockers without publishing.
- **Client-side completeness derived from opportunity prop**: CompletenessChecklist derives checklist state client-side (mirrors server rules) for real-time feedback on every field change. Server is authoritative at actual publish time.
- **Modification reason modal in OpportunityBuilder**: handleSave intercepts when `opportunity.status === 'published'` and opens modal before passing patch to updateOpportunity mutation. Keeps DeadlineForm and MetadataForm unaware of publication state.
- **Playwright e2e tests deferred**: 12 tests written in `e2e/deadlines-completeness-versioning.spec.ts` but not run per test execution boundary. Tests written to validate all 12 acceptance criteria from plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DB immutability trigger blocks test cleanup DELETE on opportunity_versions**
- **Found during:** Task 1 (first test run — completeness.test.ts and versioning.test.ts afterAll failed)
- **Issue:** `prevent_version_mutation()` trigger fires on any DELETE on `opportunity_versions`, including test cleanup DELETEs in `afterAll`. Tests expected to be able to clean up their test data.
- **Fix:** Added `ALTER TABLE opportunity_versions DISABLE TRIGGER opportunity_versions_immutable` before DELETE and `ENABLE TRIGGER` after in all three test files' `afterAll` blocks.
- **Files modified:** `tests/integration/completeness.test.ts`, `tests/integration/versioning.test.ts`, `tests/integration/deadlines.test.ts`
- **Verification:** All 25 integration tests pass (10 versioning, 8 completeness, 7 deadlines)
- **Committed in:** 644e30b (Task 1 commit — fix applied before final commit)

**2. [Rule 1 - Bug] createOpportunity helper with empty title fails at API layer**
- **Found during:** Task 1 (completeness.test.ts test "returns 422 with blockers when title is missing")
- **Issue:** Test tried to create opportunity with `{ title: '' }` override — but API requires title (returns 400). Test needed to create valid opportunity then force-clear title via direct DB update.
- **Fix:** Changed `createOpportunity({ title: '' })` to `createOpportunity()` then `pool.query("UPDATE opportunities SET title = '' WHERE ...")`.
- **Files modified:** `tests/integration/completeness.test.ts`
- **Verification:** Test passes — creates valid opp, forces missing field, asserts 422 with title blocker
- **Committed in:** 644e30b (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both auto-fixes necessary for test correctness. No scope creep. The immutability trigger working exactly as designed — tests had to adapt.

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

None - no external service configuration required. All services run via docker-compose.

## Next Phase Readiness

- Phase 1 complete: grantor can log in → create opportunity from template → fill metadata → configure deadlines → publish → modify post-publication (with version history)
- opportunity_versions table ready for Phase 2 (eligibility rules, form sections)
- CompletenessService has commented-out TODO stubs for Phase 2 checkers
- All integration tests passing (86 total across all plans)
- Playwright e2e tests ready for verify phase execution

---
*Phase: 01-platform-foundation-opportunity-setup*
*Completed: 2026-07-25*

## Self-Check: PASSED

All 14 key files verified present on disk. Both task commits (644e30b, 89edc47) confirmed in git log.
