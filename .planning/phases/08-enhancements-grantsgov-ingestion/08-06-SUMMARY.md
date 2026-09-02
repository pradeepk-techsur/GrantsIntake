---
phase: 08-enhancements-grantsgov-ingestion
plan: 06
subsystem: api
tags: [grants-gov, ingestion, external-opportunities, fetch, regression-test, gate-verdict]

# Dependency graph
requires:
  - phase: 08-enhancements-grantsgov-ingestion
    provides: ExternalOpportunityService, ingestionScheduler, grantsGovService, external-opportunities routes/UI (08-01..08-05)
provides:
  - Corrected Grants.gov SEARCH_ENDPOINT (/search2, POST 200) and DETAIL_ENDPOINT (/fetchOpportunity, POST 200)
  - normalizeOpportunity tolerant of the live fetchOpportunity envelope (synopsis/agencyDetails/cfdas/opportunityPkgs) and flat/test shapes
  - Regression test pinning POST /search2 (rejecting the 403 suffix) and data.oppHits parsing
  - Working end-to-end ingestion (refreshAll fetched>0/upserted>0; GET list total>0) unblocking browse/save/alerts/import/versions UAT flows
  - boot_smoke and review_blockers_open gate verdicts in 08-GATE.md
affects: [PRD-INTAKE-019C, PRD-INTAKE-019D, verify-work, execute-phase gates]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dual-shape normalization: read live fetchOpportunity envelope OR flat/pre-normalized shape with per-field fallbacks"
    - "Scheduler enriches detail with the search hit's status/closeDate (the live detail carries neither)"
    - "Mock matcher pins the corrected path (POST /search2, POST /fetchOpportunity) so a 403-path regression fails the suite"

key-files:
  created:
    - .planning/phases/08-enhancements-grantsgov-ingestion/08-06-SUMMARY.md
  modified:
    - src/services/external/grantsGovService.ts
    - src/services/external/ingestionScheduler.ts
    - tests/integration/externalOpportunities.test.ts
    - tests/integration/ingestionScheduler.test.ts
    - tests/integration/externalOpportunityAttribution.test.ts
    - .planning/phases/08-enhancements-grantsgov-ingestion/08-GATE.md

key-decisions:
  - "SEARCH_ENDPOINT corrected to ${GRANTS_GOV_BASE}/search2 (was /search2/opportunities/search → 403)"
  - "DETAIL_ENDPOINT corrected to POST ${GRANTS_GOV_BASE}/fetchOpportunity (was GET /opportunities/:id → 403); parse adapted to the nested data envelope"
  - "normalizeOpportunity made shape-tolerant rather than fixture-specific so live + test payloads both normalize"
  - "review_blockers_open = 0 (0 confirmed HIGH/CRITICAL per 08-SECURITY.md; open MEDIUM+LOW are not blockers)"

patterns-established:
  - "Regression guard names the broken 403 path in a negative assertion so reintroducing it fails the suite"

# Metrics
duration: 7min
completed: 2026-09-02
---

# Phase 8 Plan 06: Gap Closure — Fix Grants.gov Search/Detail Endpoints (403) & Record Gate Verdicts Summary

**Corrected the two 403-ing Grants.gov endpoints (search `/search2`, detail `POST /fetchOpportunity`), made the normalizer tolerant of the live envelope, and proved end-to-end ingestion (fetched:3/upserted:3, GET list total:3) — unblocking every Phase 8 UAT flow — plus recorded boot_smoke and review_blockers_open gate verdicts.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-09-02T12:09:01Z
- **Completed:** 2026-09-02T12:16:07Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- **BLOCKER closed (uat/1):** `SEARCH_ENDPOINT` fixed from `/search2/opportunities/search` (HTTP 403) to `/search2` (HTTP 200). Verified live: `POST https://api.grants.gov/v1/api/search2` → 200.
- **Detail endpoint also fixed (extension of uat/1, Rule 1 bug):** the live `GET /opportunities/:id` also returns **403**. Corrected to `POST /fetchOpportunity` with `{ opportunityId }` → 200. Without this, `refreshAll` would fetch hits but every per-opportunity detail call would 403 → `upserted=0`, so the must_have "fetched>0 and upserted>0" would still fail.
- **Normalizer hardened:** `normalizeOpportunity` now reads the live `fetchOpportunity` envelope (`synopsis.*`, `agencyDetails.*`, `cfdas[]`, `opportunityPkgs`) with fallbacks to the flat/test-fixture shape (`opportunityTitle`, `agencyName`, `closeDate`, `packages[]`, `synopsis.synopsisAddendum`). Added a `normalizePackages` helper (handles the object-keyed live packages and synthesizes the instructions-download URL from `packageId`).
- **Scheduler enrichment:** the live detail carries no flat status and can omit closeDate; both ingest call sites now fill those gaps from the authoritative search hit (`oppStatus`/`closeDate`).
- **Regression test added:** asserts the service POSTs to `/search2` and NOT `/search2/opportunities/search`, and parses `data.oppHits`. A future reversion to the 403 path fails the suite.
- **Mocks re-pinned:** all three integration mocks now match the corrected paths (POST `/search2`, POST `/fetchOpportunity`) — a reversion makes the code call an unmocked URL → test failure.
- **Live end-to-end proof:** bounded `refreshAll` against the live API + compose DB returned `{fetched:3, upserted:3, failed:0}`; `externalOpportunityService.listOpportunities` and the running app's `GET /api/v1/external-opportunities` both returned `total:3`.
- **Gate verdicts recorded:** `boot_smoke: pass` (backend :3000 200, frontend :5173 200, db+redis healthy) and `review_blockers_open: 0`.

## Task Commits

1. **Task 1: Fix endpoints + re-pin mocks + regression test** - `0f0e32e` (fix)
2. **Tasks 2 & 3: Record boot_smoke and review_blockers_open** - `6f8c3e3` (chore)

**Plan metadata:** (see final docs commit)

## Files Created/Modified
- `src/services/external/grantsGovService.ts` - SEARCH_ENDPOINT → `/search2`; DETAIL_ENDPOINT → `POST /fetchOpportunity`; POST detail fetch; dual-shape `normalizeOpportunity`; new `normalizePackages` helper
- `src/services/external/ingestionScheduler.ts` - both ingest call sites enrich the detail with the search hit's `oppStatus`/`closeDate`
- `tests/integration/externalOpportunities.test.ts` - mock re-pinned; new `/search2` regression test
- `tests/integration/ingestionScheduler.test.ts` - mock re-pinned to `/search2` + `/fetchOpportunity`
- `tests/integration/externalOpportunityAttribution.test.ts` - mock re-pinned to `/search2` + `/fetchOpportunity`
- `.planning/phases/08-enhancements-grantsgov-ingestion/08-GATE.md` - `boot_smoke: pass`, `review_blockers_open: 0`

## Decisions Made
- Corrected DETAIL_ENDPOINT to `POST /fetchOpportunity` (the plan's sub-step 1b explicitly authorized correcting it and adjusting the parse if the live path 403s / the envelope differs). This was necessary for `upserted>0` — the primary success criterion.
- Made `normalizeOpportunity` shape-tolerant instead of rewriting the fixtures, so both live payloads and the existing (flat-shape) test fixtures normalize correctly and all prior tests stay green.
- `review_blockers_open = 0`: 08-SECURITY.md records "Confirmed HIGH/CRITICAL: 0"; the two open findings (1 MEDIUM scheme-injection, 1 LOW info-exposure) are hardening items, not blockers.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DETAIL_ENDPOINT also returned 403 on the live API**
- **Found during:** Task 1 (sub-step 1b live round-trip)
- **Issue:** The plan flagged the search 403 as the blocker and asked to *re-verify* the detail path. The live round-trip proved `GET /opportunities/:id` ALSO returns 403, and the correct detail call is `POST /fetchOpportunity` with `{opportunityId}`, whose response shape differs substantially from the flat detail the normalizer expected. Left uncorrected, ingestion would fetch hits but never upsert (every detail call 403s), failing the "upserted>0" must_have.
- **Fix:** Corrected DETAIL_ENDPOINT to `POST /fetchOpportunity`; adapted `getOpportunityDetail` (POST + body) and `normalizeOpportunity` (reads `synopsis`/`agencyDetails`/`cfdas`/`opportunityPkgs` with flat-shape fallbacks); scheduler fills status/closeDate from the search hit.
- **Files modified:** src/services/external/grantsGovService.ts, src/services/external/ingestionScheduler.ts
- **Verification:** Live `refreshAll` → `{fetched:3, upserted:3, failed:0}`; app `GET /api/v1/external-opportunities` → `total:3`. Full suite 285/285.
- **Committed in:** 0f0e32e

**2. [Plan-verify note] `grep -rq "search2/opportunities/search" tests/` intentionally still matches**
- **Found during:** Task 1 verify
- **Issue:** The plan's literal verify `! grep -rq "search2/opportunities/search" tests/` cannot pass, because the required regression test names the broken path in a negative assertion (`expect(url).not.toMatch(/\/search2\/opportunities\/search/)`) and a couple of comments reference it.
- **Fix:** Confirmed no *mock matcher* still pins the broken path (the actual regression risk the verify targets). Remaining occurrences are the regression guard's negative assertion + comments — the correct, intended outcome.
- **Files modified:** tests/integration/*.test.ts (comments/assertion only)
- **Verification:** `grep -rn "search2/opportunities/search"` shows only comments + the negative assertion + the test title; no `.includes(...)`/matcher pins it.
- **Committed in:** 0f0e32e

---

**Total deviations:** 2 (1 auto-fixed bug, 1 verify-intent clarification)
**Impact on plan:** The detail-endpoint fix was essential to satisfy the "upserted>0" success criterion; without it the search fix alone would not have unblocked ingestion. No scope creep — both changes are within the plan's stated intent (fix the 403 endpoints; make ingestion actually work).

## Issues Encountered
None — the live API was reachable from the sandbox, so ingestion was proven end-to-end rather than mock-only.

## Known Stubs
None found — the two changed source files contain no TODO/FIXME/placeholder/not-implemented markers, no swallowed errors, and no hardcoded responses. Ingestion is fully wired and proven against the live API.

## User Setup Required
None - no external service configuration required (Grants.gov public API needs no key).

## Next Phase Readiness
- Ingestion now works end-to-end; the browse/save/alerts/import/versions UAT flows (previously skipped as blocked) have data. Re-running Phase 8 UAT should now exercise tests 1–6.
- boot_smoke and review_blockers_open verdicts are on record for the execute-phase gate.
- Optional follow-up (not a blocker): harden the MEDIUM F-01 (validate `application_package_url`/`source_url` scheme) from 08-SECURITY.md.

## Self-Check: PASSED
- Created/modified files exist on disk (grantsGovService.ts, 08-06-SUMMARY.md verified).
- Task commits exist: 0f0e32e (fix), 6f8c3e3 (chore).
- Plan-level build ran and passed: `npm run build` → exit 0.
- Full backend test suite: 285/285 passing (`npm test`).
- Live ingestion proven: refreshAll {fetched:3, upserted:3, failed:0}; GET list total:3.
- `## Known Stubs` present with no blocking entries.

---
*Phase: 08-enhancements-grantsgov-ingestion*
*Completed: 2026-09-02*
