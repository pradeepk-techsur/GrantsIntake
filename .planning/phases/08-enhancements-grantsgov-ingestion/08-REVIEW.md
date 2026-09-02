---
phase: 8
status: issues_found
blockers: 0
warnings: 3
files_reviewed: 5
files_reviewed_list:
  - src/services/external/grantsGovService.ts
  - src/services/external/ingestionScheduler.ts
  - tests/integration/externalOpportunities.test.ts
  - tests/integration/externalOpportunityAttribution.test.ts
  - tests/integration/ingestionScheduler.test.ts
reviewed_at: 2026-09-02T12:21:50Z
iteration: 1
---

# Phase 8 Code Review

Gap-closure run (08-06). Reviewed the diff from `e3c38ea^` → `HEAD`
(commits `f233d7e`, `0f0e32e`, `6f8c3e3`, `b8650f1`, `b16516a`), focused on the
Grants.gov endpoint fix, the normalizer's new envelope tolerance, and the
regression test. `tsc --noEmit` passes (exit 0); the 3 affected integration
suites pass (17/17). No BLOCKERs found.

## BLOCKERs

None.

The core fix is correct:
- `SEARCH_ENDPOINT` → `/search2` and `DETAIL_ENDPOINT` → POST `/fetchOpportunity`
  match the documented Grants.gov REST API, with a `Content-Type: application/json`
  header now sent on the detail POST (previously absent).
- The regression test (`externalOpportunities.test.ts:205`) is **not** a
  tautology: `toMatch(/\/search2(\?|$)/)` fails for the old `/search2/opportunities/search`
  path (it does not end in `/search2`), and `not.toMatch(/\/search2\/opportunities\/search/)`
  independently fails on a revert. Either regression breaks the assertion. Confirmed genuine.
- No injection surface introduced: the detail body is `JSON.stringify`'d, not string-interpolated.

## WARNINGs

### W1: Detail enrichment backfills `oppStatus`/`closeDate` but not `opportunityNumber`; a live envelope without a flat `opportunityNumber` silently skips every hit
- **File:** src/services/external/ingestionScheduler.ts:68-72, 129-133; src/services/external/grantsGovService.ts:257
- **Category:** integration
- **Evidence:** The `enriched` object explicitly reasons that the live
  `/fetchOpportunity` detail "carries no flat status field and may omit the
  closeDate" and backfills those two fields from the search hit. `normalizeOpportunity`
  derives `source_opportunity_number` **solely** from `raw.opportunityNumber`
  (line 257, no synopsis/search fallback). If the live detail envelope also lacks
  a flat `opportunityNumber` (the same class of omission the comment acknowledges
  for status/closeDate), `source_opportunity_number` becomes `''`, `refreshAll`
  throws `missing source_opportunity_number after normalize` (line 75), and the
  opportunity is caught+logged+`failed++` — i.e. **every** ingested opportunity
  is skipped on the live API. This is degraded (skip, not corruption; the search
  hit's `opportunityNumber` is available and could be backfilled the same way),
  and I cannot confirm the live envelope shape from here, so it is a WARNING
  rather than a BLOCKER.
- **Fix direction:** Add `opportunityNumber: detail.opportunityNumber ?? hit.opportunityNumber`
  to both `enriched` objects (or fall back to the search hit's number inside the
  normalizer), mirroring the status/closeDate backfill.

### W2: Synthesized package URL for the live `opportunityPkgs` shape is a guessed path that may not resolve
- **File:** src/services/external/grantsGovService.ts:72-76
- **Category:** bug
- **Evidence:** When the live `opportunityPkgs` entry has no `packageURL`, the code
  fabricates `https://apply07.grants.gov/apply/opportunities/instructions/PKG-${packageId}-instructions.pdf`.
  This URL template is not returned by the API and is unverified against the live
  service; if the real instructions-download path differs, `application_package_url`
  will point at a broken/404 link for live-sourced records. Non-blocking (the field
  is informational, not on a critical path), but it can surface dead links to users.
- **Fix direction:** Prefer a URL the API actually returns; if none exists, leave
  `application_package_url` null rather than emit a fabricated path, or verify the
  template against a live round-trip before relying on it.

### W3: Non-string live date fields (e.g. epoch `responseDate`) are silently dropped by the normalizer
- **File:** src/services/external/grantsGovService.ts:30-31, 231-234
- **Category:** bug
- **Evidence:** `due_date` falls back to `synopsis.responseDateStr` then
  `synopsis.responseDate`, but `toIsoDateOrNull` returns null for any non-string
  input. If the live envelope delivers `responseDate` as a numeric epoch (a common
  Grants.gov representation) and `responseDateStr` is absent, the due date is
  silently dropped to null rather than parsed. Degraded metadata, not a break.
- **Fix direction:** Extend `toIsoDateOrNull` to accept numeric epoch millis/seconds,
  or narrow the fallback to string-typed date fields only and document the assumption.

## Cross-file seams checked
- `SEARCH_ENDPOINT` (`/search2`) ↔ all three test mocks re-pinned to `POST` + `/search2($|?)` regex — OK (no mock still matches the old 403 suffix).
- `DETAIL_ENDPOINT` (`POST /fetchOpportunity`) ↔ all three test mocks match `/fetchOpportunity` — OK; detail regex cannot collide with the search regex (distinct path segments).
- `getOpportunityDetail` unwraps `{ data: {...} }` ↔ mocks return `{ data: detail() }` — OK; flat fallback preserved for pre-normalized fixtures.
- `normalizeOpportunity` new fields (`raw.cfdas`, `raw.opportunityPkgs`, `raw.agencyDetails`, `raw.oppStatus`) ↔ `GrantsGovDetail` index signature `[key: string]: unknown` — OK (tsc passes).
- `ingestionScheduler` `enriched.{oppStatus,closeDate}` ↔ normalizer status/date reads — OK for flat fixtures; `opportunityNumber` gap — see W1.
- Mutating admin routes `/admin/refresh` + `/admin/refresh/:opportunityNumber` ↔ `authenticate` + `requireGrantorAdmin` — OK (unchanged by this diff, auth intact).
</content>
</invoke>
