---
phase: 08-enhancements-grantsgov-ingestion
plan: 05
subsystem: api
tags: [grants.gov, attribution, versioning, audit, external-opportunities, react, react-query, express, postgres]

# Dependency graph
requires:
  - phase: 08-enhancements-grantsgov-ingestion
    provides: "external_opportunities schema + versioning + REST API (08-01); import flow + OPPORTUNITY_IMPORTED audit (08-03); scheduled refresh + change alerts (08-04)"
  - phase: 01-platform-foundation-opportunity-setup
    provides: "audit_events (immutable via trigger), users schema, authenticate middleware"
provides:
  - "GET /external-opportunities/:id detail response now carries versions[] alongside full source attribution (PRD-INTAKE-019E)"
  - "Ingestion audit trail: EXTERNAL_OPPORTUNITY_IMPORTED (first ingest), EXTERNAL_OPPORTUNITY_REFRESHED (change detected), EXTERNAL_OPPORTUNITY_SAVED (user save)"
  - "Version History accordion + View-snapshot JSON modal on the external opportunity detail page"
  - "Attribution/version-immutability/audit regression suite (5 tests)"
affects: [phase-8 completion, downstream auditing of Grants.gov-sourced records]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Detail endpoint composes opportunity + version history via getOpportunityDetail() (one request, attribution + history)"
    - "Ingestion audit events keyed to entity_type='external_opportunity', actor_user_id NULL for scheduler-driven actions"
    - "Idempotent save is transactional: audit event and the save insert commit together, and a re-save (ON CONFLICT no rows) emits no duplicate audit"
    - "Test teardown purges external_opportunity audit events via the immutability-trigger-disable pattern"

key-files:
  created:
    - tests/integration/externalOpportunityAttribution.test.ts
  modified:
    - src/routes/externalOpportunities.ts
    - src/services/external/externalOpportunityService.ts
    - client/src/pages/applicant/ExternalOpportunityDetailPage.tsx
    - client/src/types/externalOpportunity.ts
    - tests/integration/ingestionScheduler.test.ts
    - tests/integration/externalOpportunities.test.ts

key-decisions:
  - "Detail endpoint returns versions[] inline (not a bare array) — keeps the existing { ...opp, versions } shape the client already reads; the standalone GET /:id/versions endpoint is retained"
  - "EXTERNAL_OPPORTUNITY_IMPORTED/REFRESHED are scheduler-driven so actor_user_id is NULL; EXTERNAL_OPPORTUNITY_SAVED carries the acting user"
  - "saveOpportunity() made transactional so the audit event is atomic with the save and only fires on a genuinely new save"
  - "Version-history UI implemented with existing design-system classes (gf-badge--info/--neutral) + inline accordion — the plan's referenced gf-accordion/gf-pill classes do not exist in grantflow.css"
  - "Test file placed at tests/integration/ (vitest include glob), not the plan's src/tests/ path"

patterns-established:
  - "One-request detail contract: attribution fields + full version history in the GET /:id payload"
  - "External-ingestion audit trail with NULL actor for automated (scheduler) events"

# Metrics
duration: 8min
completed: 2026-09-02
---

# Phase 8 Plan 05: Source Attribution, Version History & Audit Summary

**Every imported Grants.gov opportunity now permanently exposes its source attribution and immutable version history in one detail response, surfaces that history in a version accordion with a pretty-printed snapshot modal, and records an immutable audit trail (IMPORTED / REFRESHED / SAVED) for every ingestion action — all covered by a dedicated regression suite.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-02T04:33:00Z
- **Completed:** 2026-09-02T04:41:00Z
- **Tasks:** 5
- **Files modified:** 6 (1 created, 5 modified)

## Accomplishments
- `GET /api/v1/external-opportunities/:id` now returns `source`, `source_url`, `source_opportunity_number`, `import_timestamp`, `api_reference`, and an inline `versions[]` array (PRD-INTAKE-019E) via a new `getOpportunityDetail()` service method.
- Ingestion audit trail added: `EXTERNAL_OPPORTUNITY_IMPORTED` (first ingest, scheduler-driven, NULL actor), `EXTERNAL_OPPORTUNITY_REFRESHED` (re-fetch that detects tracked-field changes), and `EXTERNAL_OPPORTUNITY_SAVED` (user save, first-save-only, actor = user). `OPPORTUNITY_IMPORTED` already exists from 08-03.
- Version History accordion on the applicant detail page: `Version History ({n} versions)` header, per-version `V{n}` label + fetched date + changed-field pills (or "Initial import"), and a "View snapshot" modal rendering the full pretty-printed JSON snapshot.
- New regression suite (`externalOpportunityAttribution.test.ts`, 5 tests) proves: attribution fields non-null on the detail endpoint, `import_timestamp` immutable while `last_fetched_at` updates, V1 immutable across re-ingest, and the IMPORTED/REFRESHED/SAVED audit events.
- Backend build clean; full backend suite **284/284** passing (32 files); client `tsc -b` + `vite build` both green.

## Task Commits

Each task was committed atomically:

1. **Task 1/2: Version history in detail response (attribution contract)** - `8984342` (feat)
2. **Task 4: Ingestion audit events (IMPORTED/REFRESHED/SAVED)** - `210cc26` (feat)
3. **Task 3: Version history accordion + snapshot modal** - `6378eb9` (feat)
4. **Task 5: Attribution/immutability/audit regression tests** - `c9e2740` (test)

**Plan metadata:** _(this commit)_ (docs: complete plan)

## Files Created/Modified
- `tests/integration/externalOpportunityAttribution.test.ts` - 5-test attribution/immutability/audit regression suite
- `src/routes/externalOpportunities.ts` - detail route uses `getOpportunityDetail()` (opportunity + versions)
- `src/services/external/externalOpportunityService.ts` - `getOpportunityDetail()`, `writeAuditEvent()`, IMPORTED/REFRESHED audits in upsert, transactional save with SAVED audit
- `client/src/pages/applicant/ExternalOpportunityDetailPage.tsx` - version accordion + changed-field pills + snapshot JSON modal
- `client/src/types/externalOpportunity.ts` - optional `versions[]` on `ExternalOpportunity`
- `tests/integration/ingestionScheduler.test.ts` - teardown/cleanOpportunity purge new audit events
- `tests/integration/externalOpportunities.test.ts` - cleanOpportunities purges new audit events

## Decisions Made
- **Inline `versions[]` on the detail response** rather than a bare array — keeps the `{ ...opp, versions }` shape the client already consumes; the standalone `GET /:id/versions` endpoint stays for direct history access.
- **NULL actor for scheduler-driven audits** (IMPORTED/REFRESHED); the user-driven SAVED event carries the actor.
- **Transactional, first-save-only SAVED audit** — `saveOpportunity()` now runs in a transaction and only audits when `ON CONFLICT` actually inserts a row.
- **UI uses real design-system classes** (`gf-badge--info`/`--neutral` + inline accordion) because the plan's `gf-accordion`/`gf-pill` classes are absent from grantflow.css.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] New EXTERNAL_OPPORTUNITY_SAVED audit broke existing test teardowns**
- **Found during:** Task 5 (full-suite run)
- **Issue:** The new save audit event (`actor_user_id = saver`) and the scheduler audit events (entity = external opp) caused `ingestionScheduler.test.ts` teardown to fail on the `audit_events_actor_user_id_fkey` when deleting its test user, and left orphaned audit rows after `external_opportunities` deletes.
- **Fix:** Added audit_events cleanup (immutability-trigger-disable pattern) to the teardown/clean helpers of `ingestionScheduler.test.ts` and `externalOpportunities.test.ts`.
- **Files modified:** tests/integration/ingestionScheduler.test.ts, tests/integration/externalOpportunities.test.ts
- **Verification:** Full suite 284/284 passing.
- **Committed in:** c9e2740

**2. [Rule 3 - Blocking] Plan's gf-accordion / gf-pill classes do not exist in the design system**
- **Found during:** Task 3
- **Issue:** The plan specifies a `gf-accordion` and changed-field "pill list", but grantflow.css defines neither `gf-accordion` nor `gf-pill`.
- **Fix:** Implemented the accordion with existing `gf-btn`/inline styles and rendered changed-field pills with `gf-badge gf-badge--info` (and `gf-badge--neutral` for "Initial import"), consistent with the file's existing styling approach.
- **Files modified:** client/src/pages/applicant/ExternalOpportunityDetailPage.tsx
- **Verification:** `tsc -b` + `vite build` pass; accordion renders count, pills, and snapshot modal.
- **Committed in:** 6378eb9

**3. [Rule 3 - Blocking] Test path aligned to project convention**
- **Found during:** Task 5
- **Issue:** The plan specifies `src/tests/externalOpportunityAttribution.test.ts`, but vitest `include` is `tests/**/*.test.ts` and all tests live under `tests/integration/` (same alignment as 08-04).
- **Fix:** Created the file at `tests/integration/externalOpportunityAttribution.test.ts`.
- **Verification:** Discovered and passes 5/5.
- **Committed in:** c9e2740

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking). No architectural changes; no scope creep.
**Impact on plan:** All deviations were codebase/environment alignments necessary to make the new audit events safe for existing tests, to render the UI with the real design system, and to place the test where vitest can find it. Plan objective fully delivered.

## Known Stubs
None found — `grep` for TODO/FIXME/placeholder/not-implemented across all changed files returned no matches. The detail endpoint composes real version history, the audit events insert real immutable rows, and the UI renders real version/snapshot data.

## Issues Encountered
None beyond the deviations above (all resolved).

## User Setup Required
None — no external service configuration required. No new migration; audit events use the existing `audit_events` table.

## Next Phase Readiness
- Source attribution, version history, and the ingestion audit trail are complete and test-covered — Phase 8 (Enhancements: Grants.gov Opportunity Ingestion) plan set 08-01…08-05 is complete.
- No blockers. Backend 284/284; client build green.

## Self-Check

- Created file exists: verified below
- Task commits exist: verified below
- Backend build: `npm run build` (tsc) → exit 0
- Client build: `cd client && npm run build` (tsc -b && vite build) → exit 0
- Backend full suite: 284/284 passing (32 files), including the 5 new attribution tests

## Self-Check: PASSED

- Created file present on disk (`tests/integration/externalOpportunityAttribution.test.ts`).
- All 4 task commits present in git history (8984342, 210cc26, 6378eb9, c9e2740).
- Backend build passed (`tsc` exit 0); client build passed (`tsc -b && vite build` exit 0).
- Full backend suite 284/284 passing; new attribution suite 5/5.
- Known Stubs section present with no blocking stubs.

---
*Phase: 08-enhancements-grantsgov-ingestion*
*Completed: 2026-09-02*
