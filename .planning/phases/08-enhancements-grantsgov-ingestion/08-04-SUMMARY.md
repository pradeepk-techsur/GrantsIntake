---
phase: 08-enhancements-grantsgov-ingestion
plan: 04
subsystem: api
tags: [grants.gov, ingestion, node-cron, change-alerts, versioning, express, react, grantor-dashboard]

# Dependency graph
requires:
  - phase: 08-enhancements-grantsgov-ingestion
    provides: "Plan 08-01 backend — ExternalOpportunityService (upsert+versioning+alerts), IngestionScheduler (node-cron), REST API, external_opportunities schema"
provides:
  - "Configurable scheduled refresh via GRANTS_GOV_REFRESH_CRON / MAX_PAGES / PAGE_SIZE env vars"
  - "addenda_change + instructions_change detection from raw_metadata (synopsis addendum + package instructions)"
  - "Dedicated ingestion-scheduler alert-delivery integration test"
  - "Grantor-admin 'Grants.gov Sync' dashboard card with manual Sync Now"
affects: [08-05, external opportunity attribution, grantor admin ingestion controls]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "raw_metadata-derived pseudo-fields (synopsis_addendum, package_instructions) diffed alongside top-level tracked fields"
    - "Grantor-only client API module (externalSyncApi) kept separate from applicant client to avoid parallel-plan file conflicts"
    - "Client-side last-sync timestamp in localStorage (no server field for it)"

key-files:
  created:
    - tests/integration/ingestionScheduler.test.ts
    - client/src/api/externalSyncApi.ts
    - client/src/components/grantor/GrantsGovSyncCard.tsx
  modified:
    - .env.example
    - src/services/external/ingestionScheduler.ts
    - src/services/external/externalOpportunityService.ts
    - src/services/external/grantsGovService.ts
    - src/types/externalOpportunity.ts
    - client/src/pages/grantor/Dashboard.tsx

key-decisions:
  - "GRANTS_GOV_MAX_PAGES / GRANTS_GOV_PAGE_SIZE wired into scheduler (were hardcoded PAGES/ROWS_PER_PAGE)"
  - "Removed incorrect eligibility_summary -> instructions_change mapping; instructions_change now derives from package instructions per PRD-INTAKE-019D"
  - "Grantor Sync card gated to grantor_admin only; last-sync time persisted client-side (localStorage)"

patterns-established:
  - "Pseudo-field change detection: synopsis addendum and package instructions live in raw_metadata and diff into changed_fields + alerts"
  - "Grantor-scoped client API module to avoid conflicts with parallel applicant-UI plan"

# Metrics
duration: 5min
completed: 2026-09-02
---

# Phase 8 Plan 04: Scheduled Refresh & Change Alerts Summary

**Env-configurable node-cron Grants.gov refresh with addenda/instructions change detection feeding per-saver alerts, verified by a dedicated scheduler integration test, plus a grantor-admin "Sync Now" dashboard card.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-02T04:12:38Z
- **Completed:** 2026-09-02T04:17:34Z
- **Tasks:** 5
- **Files modified:** 9 (3 created, 6 modified)

## Accomplishments
- Grants.gov refresh schedule + paging fully env-configurable (`GRANTS_GOV_REFRESH_CRON`, `GRANTS_GOV_MAX_PAGES`, `GRANTS_GOV_PAGE_SIZE`, `GRANTS_GOV_API_BASE`, `GRANTS_GOV_INGESTION_ENABLED`) and documented in `.env.example`
- Change detection now raises `addenda_change` (synopsis addendum) and `instructions_change` (package instructions) alerts, sourced from `raw_metadata` the normalizer now persists
- New `tests/integration/ingestionScheduler.test.ts` proves the scheduled-refresh → change-detection → alert-delivery pipeline (3 tests)
- Grantor-admin "Grants.gov Sync" dashboard card: last-sync time, Sync Now button, loading + success/error states, `grantor_admin`-only
- Backend build clean; full suite 278/278 (was 275) passing; client `tsc -b` clean

## Task Commits

1. **Task 1: Env configuration** - `126b13f` (feat)
2. **Task 2: Scheduler startup integration** - already satisfied by 08-01 (`ingestionScheduler.start()` in `src/server.ts`); no new commit
3. **Task 3: Change detection (addenda/instructions)** - `1cc99ff` (feat)
4. **Task 4: Alert-delivery scheduler test** - `96610b8` (test)
5. **Task 5: Grantor Sync Now dashboard card** - `3d6725c` (feat)

## Files Created/Modified
- `.env.example` - documents all Grants.gov ingestion env vars
- `src/services/external/ingestionScheduler.ts` - reads GRANTS_GOV_MAX_PAGES / PAGE_SIZE (previously hardcoded)
- `src/services/external/externalOpportunityService.ts` - addenda/instructions diffing + resolveFieldValue for pseudo-fields; removed wrong eligibility_summary alert mapping
- `src/services/external/grantsGovService.ts` - normalizer persists synopsisAddendum + packageInstructions into raw_metadata
- `src/types/externalOpportunity.ts` - typed synopsis.synopsisAddendum + packages[].instructions
- `tests/integration/ingestionScheduler.test.ts` - scheduler alert-delivery coverage
- `client/src/api/externalSyncApi.ts` - grantor refresh client
- `client/src/components/grantor/GrantsGovSyncCard.tsx` - Sync Now UI
- `client/src/pages/grantor/Dashboard.tsx` - renders the card for grantor_admin

## Decisions Made
- **Wired the documented paging env vars into the scheduler** so `GRANTS_GOV_MAX_PAGES`/`GRANTS_GOV_PAGE_SIZE` are functional rather than inert (they were hardcoded constants).
- **Corrected the instructions_change source**: the plan defines it as package instructions; 08-01 had mapped `eligibility_summary` to it. Removed that mapping and derived `instructions_change` from `raw_metadata.packageInstructions` and `addenda_change` from `raw_metadata.synopsisAddendum`.
- **Grantor-scoped client module** (`externalSyncApi`) instead of extending the applicant external-opportunity client, to avoid file conflicts with the parallel 08-02 plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Test path aligned to project convention**
- **Found during:** Task 4
- **Issue:** Plan specified `src/tests/ingestionScheduler.test.ts`, but vitest `include` is `tests/**/*.test.ts` and all tests live under `tests/integration/`.
- **Fix:** Created the test at `tests/integration/ingestionScheduler.test.ts`.
- **Verification:** Test discovered and passes (3/3).
- **Committed in:** `96610b8`

**2. [Rule 3 - Blocking] Scheduler startup already implemented in src/server.ts (no src/index.ts)**
- **Found during:** Task 2
- **Issue:** Plan said start the scheduler in `src/index.ts`; there is no `src/index.ts` — 08-01 already starts `ingestionScheduler.start()` after `app.listen()` in `startServer()` in `src/server.ts`, reading `GRANTS_GOV_REFRESH_CRON` and logging the cron.
- **Fix:** Verified existing wiring meets the requirement; no change needed.
- **Verification:** `src/server.ts:150` calls `ingestionScheduler.start()`; scheduler logs effective cron; build passes.
- **Committed in:** n/a (pre-existing from 08-01)

**3. [Rule 1 - Bug] Incorrect instructions_change source (eligibility_summary)**
- **Found during:** Task 3
- **Issue:** 08-01 mapped `eligibility_summary` → `instructions_change`, contradicting PRD-INTAKE-019D (instructions_change should reflect package instructions; addenda_change should reflect synopsis addendum), and neither addenda nor instructions were persisted for diffing.
- **Fix:** Normalizer now persists `synopsisAddendum` + `packageInstructions` into `raw_metadata`; `computeChangedFields` diffs them into `synopsis_addendum`/`package_instructions`; alert map raises `addenda_change`/`instructions_change`.
- **Files modified:** grantsGovService.ts, externalOpportunityService.ts, externalOpportunity.ts
- **Verification:** New scheduler test asserts both alert types + version `changed_fields`; existing 7 tests still pass.
- **Committed in:** `1cc99ff`

**4. [Rule 2 - Missing Critical] Documented paging env vars were inert**
- **Found during:** Task 1
- **Issue:** Plan documents `GRANTS_GOV_MAX_PAGES`/`GRANTS_GOV_PAGE_SIZE` but the scheduler used hardcoded constants, so setting them had no effect.
- **Fix:** Added `envInt()` and read both at refresh time in `refreshAll`/`refreshSingle`.
- **Verification:** `tsc --noEmit` clean; full suite passes.
- **Committed in:** `126b13f`

---

**Total deviations:** 4 (2 blocking, 1 bug, 1 missing-critical) + 1 pre-existing verification. No scope creep; all changes required for plan correctness or to align with the real codebase.
**Impact on plan:** Plan objective delivered — scheduled refresh, full change-alert coverage (including addenda/instructions), and grantor manual sync. Backend surface from 08-01 already covered Tasks 2 and the bulk of the alert pipeline.

## Known Stubs

None found — all changed files scanned; no TODO/FIXME/placeholder/stub markers.

## Issues Encountered

- **Out-of-scope client build failure (deferred, NOT fixed):** `client/src/layouts/ApplicantLayout.tsx:5` imports `ChangeAlertsBell` but never uses it → `vite build` fails (TS6133). This file belongs to the parallel plan **08-02** (commit `88a77c2`), which owns the applicant layout/sidebar per the coordination note. `tsc -b` on the client passes; only the stricter `vite build` unused-check trips. Logged to `deferred-items.md`. 08-02 must wire in or remove the import. My client changes (`Dashboard.tsx`, `externalSyncApi.ts`, `GrantsGovSyncCard.tsx`) compile cleanly under `tsc -b`.

## User Setup Required
None — Grants.gov public search API needs no API key. Optional env (documented in `.env.example`): `GRANTS_GOV_REFRESH_CRON`, `GRANTS_GOV_API_BASE`, `GRANTS_GOV_MAX_PAGES`, `GRANTS_GOV_PAGE_SIZE`, `GRANTS_GOV_INGESTION_ENABLED`.

## Next Phase Readiness
- Scheduled refresh + full change-alert coverage + grantor manual sync complete; ready for **08-05** (source attribution UI).
- Blocker for a clean client `vite build`: 08-02's unused `ChangeAlertsBell` import (see Issues Encountered) — resolves once 08-02 finishes.

## Self-Check

- Created files exist: verified below
- Task commits exist: verified below
- Backend build: `npm run build` → exit 0
- Backend full suite: 278/278 passing (31 files)
- Client typecheck: `tsc -b` → exit 0 (my files); `vite build` blocked only by out-of-scope 08-02 import

## Self-Check: PASSED

- All 3 created files present on disk.
- All 4 task commits present in git history (Task 2 satisfied by 08-01).
- Backend build passed (`npm run build` exit 0).
- Full suite 278/278 passing; new scheduler tests 3/3.
- Known Stubs section present with no blocking stubs.

---
*Phase: 08-enhancements-grantsgov-ingestion*
*Completed: 2026-09-02*
