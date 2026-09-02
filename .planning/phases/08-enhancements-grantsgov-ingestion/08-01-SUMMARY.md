---
phase: 08-enhancements-grantsgov-ingestion
plan: 01
subsystem: api
tags: [grants.gov, ingestion, node-cron, external-opportunities, versioning, change-alerts, express, postgres]

# Dependency graph
requires:
  - phase: 07-navigation-cleanup
    provides: intake module navigation scope; grantor/applicant role model
  - phase: 01-platform-foundation-opportunity-setup
    provides: auth (JWT), users/organizations schema, requireRole middleware, audit_events
provides:
  - external_opportunities canonical schema + immutable version history + user saves + change alerts (migration 017)
  - GrantsGovService (search/detail API client + normalizer)
  - ExternalOpportunityService (upsert with diff-based versioning, change alerts, save/list, filters)
  - node-cron ingestion scheduler (configurable, refreshAll/refreshSingle)
  - REST API at /api/v1/external-opportunities (list/detail/versions/save/alerts/admin-refresh)
affects: [08-02, 08-03, 08-04, 08-05, external opportunity browsing, import flow, attribution UI]

# Tech tracking
tech-stack:
  added: [node-cron, "@types/node-cron"]
  patterns:
    - "Node global fetch (undici) for outbound HTTP — no http client dep"
    - "vi.stubGlobal('fetch') for mocking outbound APIs in vitest (nock cannot intercept undici)"
    - "Diff-based immutable versioning: v1 on insert, new version row only on tracked-field change"
    - "Static route sub-paths registered before /:id so they resolve correctly"

key-files:
  created:
    - src/db/migrations/017_external_opportunities_schema.sql
    - src/types/externalOpportunity.ts
    - src/services/external/grantsGovService.ts
    - src/services/external/externalOpportunityService.ts
    - src/services/external/ingestionScheduler.ts
    - src/routes/externalOpportunities.ts
    - tests/integration/externalOpportunities.test.ts
  modified:
    - src/server.ts

key-decisions:
  - "Node global fetch instead of an HTTP client library — no dependency needed on Node 20"
  - "vi.stubGlobal('fetch') replaces nock for API mocking (nock cannot intercept undici fetch)"
  - "source_opportunity_number (FON) is the upsert key; import_timestamp preserved across upserts"
  - "Change alerts carry previous/new values (extended plan signature) so the UI can render meaningful diffs"

patterns-established:
  - "External ingestion service layer: API client (normalize) → persistence service (upsert+version+alert) → scheduler → routes"
  - "pg DATE columns formatted to ISO YYYY-MM-DD via formatDbDate (UTC) before comparison/serialization"

# Metrics
duration: 7min
completed: 2026-09-02
---

# Phase 8 Plan 01: Grants.gov Opportunity Ingestion — Backend Service & Scheduler Summary

**Backend pipeline that polls the Grants.gov Search/Detail REST APIs on a node-cron schedule, normalizes opportunities into a canonical schema, upserts with diff-based immutable version history and per-user change alerts, and exposes them over a REST API with source attribution preserved.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-09-02T04:00:01Z
- **Completed:** 2026-09-02T04:07:55Z
- **Tasks:** 6 (5 plan tasks + integration tests)
- **Files modified:** 10 (9 created, 1 modified)

## Accomplishments
- Migration 017: `external_opportunities`, `external_opportunity_versions`, `saved_external_opportunities`, `change_alerts` with indexes and FKs to real PKs
- `GrantsGovService`: tolerant search/detail client + normalizer mapping all PRD-INTAKE-019B fields, preserving source attribution
- `ExternalOpportunityService`: transactional upsert with changed-field diffing, immutable version rows, change-alert fan-out to savers, save/unsave/list, filtered pagination, version history, alert read-tracking
- `IngestionScheduler`: node-cron (`GRANTS_GOV_REFRESH_CRON`, default every 6h), `refreshAll` (5×25 posted) and `refreshSingle`, per-opportunity error isolation, started from server boot
- REST API at `/api/v1/external-opportunities` (public list/detail/versions; authenticated save/alerts; grantor_admin refresh)
- 7 integration tests covering PRD-INTAKE-019A–019E; full suite 275/275 passing; build clean

## Task Commits

1. **Task 1: external_opportunities schema migration** - `5bd3a29` (feat)
2. **Task 2: GrantsGovService API client & normalizer** - `6254841` (feat)
3. **Task 3: ExternalOpportunityService persistence & versioning** - `912dc43` (feat)
4. **Task 4: node-cron ingestion scheduler** - `0a91b77` (feat)
5. **Task 5: external opportunities REST API routes** - `ed698e0` (feat)
6. **Integration tests + date-handling fixes** - `a72d155` (test/fix)

## Files Created/Modified
- `src/db/migrations/017_external_opportunities_schema.sql` - 4 tables + indexes for ingestion domain
- `src/types/externalOpportunity.ts` - raw/normalized/persisted/filter type surface
- `src/services/external/grantsGovService.ts` - Grants.gov search/detail client + normalizer
- `src/services/external/externalOpportunityService.ts` - upsert, versioning, alerts, saves, filters
- `src/services/external/ingestionScheduler.ts` - node-cron scheduler (refreshAll/refreshSingle)
- `src/routes/externalOpportunities.ts` - REST endpoints
- `tests/integration/externalOpportunities.test.ts` - end-to-end coverage
- `src/server.ts` - mount router + start scheduler after boot

## Decisions Made
- **Node global fetch over an HTTP client lib** — Node 20 has native fetch; no dependency added for outbound calls.
- **vi.stubGlobal('fetch') instead of nock** — nock cannot intercept Node's undici-based global fetch (verified failing); the test mocks fetch directly. `nock` was installed per plan then removed as unusable.
- **FON (source_opportunity_number) as upsert key**, `import_timestamp` preserved across upserts, `last_fetched_at` refreshed each poll (PRD-INTAKE-019E).
- **change_alerts carry previous/new values** — extended the plan's `createChangeAlerts` signature so alerts are renderable without a second lookup.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] pg DATE returned as Date object broke alert values and diffs**
- **Found during:** Integration tests (PRD-INTAKE-019D)
- **Issue:** `String(row.due_date).slice(0,10)` yielded `"Mon Nov 30"` (Date.toString) instead of `2026-11-30`, so alert `new_value` and change-field comparisons were wrong.
- **Fix:** Added `formatDbDate()` (UTC YYYY-MM-DD) used in `rowToOpportunity` and `computeChangedFields`.
- **Files modified:** src/services/external/externalOpportunityService.ts
- **Verification:** Test asserts `new_value === '2026-11-30'` and version `changed_fields` include `due_date`/`opportunity_status` — passes.
- **Committed in:** a72d155

**2. [Rule 3 - Blocking] nock cannot intercept Node global fetch (undici)**
- **Found during:** Integration test authoring
- **Issue:** Plan specified `nock` to mock Grants.gov, but the service uses Node global fetch; a probe confirmed nock does not intercept it.
- **Fix:** Used `vi.stubGlobal('fetch', mockFetch)` dispatching on URL/method; removed the unused `nock` dependency.
- **Files modified:** tests/integration/externalOpportunities.test.ts, package.json
- **Verification:** All 7 tests pass with no real network calls.
- **Committed in:** a72d155

**3. [Rule 3 - Blocking] Entry point is src/server.ts, not src/index.ts**
- **Found during:** Task 4
- **Issue:** Plan said start scheduler in `src/index.ts`; the actual entry point is `src/server.ts`.
- **Fix:** Started `ingestionScheduler.start()` inside `startServer()` in `src/server.ts` (no-op in test mode).
- **Files modified:** src/server.ts
- **Verification:** Build + full suite pass; scheduler disabled under NODE_ENV=test.
- **Committed in:** 0a91b77

**4. [Rule 1 - Bug] Plan FK references used users(id)/organizations(id) — actual PKs are user_id/org_id**
- **Found during:** Task 1
- **Issue:** Plan schema referenced `users(id)`; codebase PKs are `users(user_id)` and `external_opportunities(id)`.
- **Fix:** Migration FKs point at the real PKs; `saved_external_opportunities.user_id → users(user_id)`.
- **Files modified:** src/db/migrations/017_external_opportunities_schema.sql
- **Verification:** Migration applies cleanly; FK-backed tests pass.
- **Committed in:** 5bd3a29

**5. [Rule 2 - Missing Critical] Test teardown FK violation on audit_events**
- **Found during:** Integration test teardown
- **Issue:** Login creates `audit_events` referencing test users, blocking user deletion.
- **Fix:** Disable `audit_events_immutable` trigger, delete test users' audit events, re-enable (established Phase 1 pattern).
- **Files modified:** tests/integration/externalOpportunities.test.ts
- **Verification:** Teardown completes without FK errors.
- **Committed in:** a72d155

---

**Total deviations:** 5 auto-fixed (2 bugs, 2 blocking, 1 missing-critical).
**Impact on plan:** All deviations were correctness/environment alignments; no scope creep. Plan objective fully delivered.

## Known Stubs

None found — all endpoints and service methods are fully implemented against the real DB.

## Issues Encountered
None beyond the deviations above (all resolved).

## User Setup Required
None — Grants.gov public search API needs no API key. Optional env: `GRANTS_GOV_REFRESH_CRON` (schedule), `GRANTS_GOV_API_BASE` (override base URL), `GRANTS_GOV_INGESTION_ENABLED=false` (disable scheduler).

## Next Phase Readiness
- Backend ingestion + API complete; ready for **08-02** (frontend browsing/UI for external opportunities).
- Data contract for the frontend: `GET /api/v1/external-opportunities` returns `{ items, total, page, limit }`; detail, versions, saved, and alerts endpoints available.
- No blockers.

## Self-Check

- Created files exist: verified below
- Task commits exist: verified below
- Build: `npm run build` → exit 0
- Full test suite: 275/275 passing (30 files)

## Self-Check: PASSED

- All 7 created files present on disk.
- All 6 task commits present in git history.
- Build passed (`npm run build` exit 0).
- Full suite 275/275 passing; new plan tests 7/7.
- Known Stubs section present with no blocking stubs.

---
*Phase: 08-enhancements-grantsgov-ingestion*
*Completed: 2026-09-02*
