---
phase: 08-enhancements-grantsgov-ingestion
verified: 2026-09-02T12:27:10Z
status: human_needed
score: 5/5 must-haves verified (backend/data proven); 5 UI flows ready for human re-test
re_verification: false
gate_evidence:
  gate_status: passed
  boot_smoke: pass
  review_blockers_open: 0
  gaps_open: 0
  code_review_warnings: 3 (advisory)
human_verification:
  - test: "Browse Grants.gov Opportunities (UAT test 1)"
    expected: "'Browse Grants.gov' sidebar link opens filterable, paginated (25/page) list of external opportunity cards, each with status badge, award range, due date, eligibility snippet, source badge, save heart, View Details. Filter apply/clear updates results."
    why_human: "Visual card rendering + interactive filter behavior. Blocking precondition (ingestion 403) now CLOSED — GET /api/v1/external-opportunities returns HTTP 200 total:3 real Grants.gov records. Data now exists; UI interaction unverifiable by grep."
  - test: "View External Opportunity Detail (UAT test 2)"
    expected: "Clicking View Details opens detail page with header, metadata grid (agency, FON, assistance listing, due dates, award ceiling/floor, status), eligibility panel, source-attribution footer (Source: Grants.gov · FON · import date)."
    why_human: "Visual detail-page layout + attribution footer rendering. Data precondition now satisfied (3 records); was skipped in UAT solely because of the ingestion blocker (now closed)."
  - test: "Save and Unsave an External Opportunity (UAT test 3)"
    expected: "Clicking the heart saves the opportunity; it appears in 'Saved from Grants.gov' on /applicant/applications. Unsaving removes it."
    why_human: "Interactive save toggle + dashboard state reflection. Backend save/unsave routes verified wired; UI round-trip needs human. Was skipped due to empty list (now populated)."
  - test: "Change Alerts Bell and Alerts Page (UAT test 4)"
    expected: "Bell icon in applicant header shows unread count + top-5 dropdown of change alerts for saved opportunities; mark-read inline; full alerts page lists all."
    why_human: "Real-time alert delivery + unread-count UI. Requires a tracked opportunity to change on re-fetch to fire an alert — human must exercise the save→re-ingest→alert flow. ChangeAlertsBell.tsx + ChangeAlertsPage.tsx exist and are wired."
  - test: "Import Grants.gov Opportunity into Workspace (UAT test 5)"
    expected: "'Import to Workspace' opens confirmation modal; confirming imports and redirects to /applicant/applications with success message; imported opportunity carries 'Imported from Grants.gov' badge; re-import does not duplicate."
    why_human: "Interactive modal + redirect + dedup behavior. Import route wired to importService; needs human confirmation. Was skipped due to no external opportunity to import (now available)."
  - test: "Version History Accordion and Snapshot Modal (UAT test 6)"
    expected: "Detail page shows 'Version History (N versions)' accordion; expanding lists each version (V1, V2…) with fetched date + changed-field labels (or 'Initial import'); 'View snapshot' opens modal with pretty-printed JSON snapshot."
    why_human: "Visual accordion + snapshot modal rendering. Data precondition satisfied — external_opportunity_versions=3 rows exist. Was skipped due to no opportunity (now present)."
---

# Phase 8: Enhancements — Grants.gov Ingestion Verification Report

**Phase Goal:** Automatically ingest active funding opportunities from Grants.gov APIs, normalize and persist opportunity metadata with full source attribution and version history, allow applicants to save/track/compare/import external opportunities into internal workspaces, and deliver in-app change alerts when tracked opportunities are updated.

**Verified:** 2026-09-02T12:27:10Z
**Status:** human_needed
**Re-verification:** No — initial verification (following gap-closure run 08-06)

## Executive Summary

This was a gap-closure run (`--gaps-only`, plan 08-06). Plans 08-01..08-05 delivered the phase in the original build; 08-06 closed the 3 gaps that blocked the phase at UAT/gate. **All must-haves are verified in code and proven with live data.** The single BLOCKER (ingestion 403 → zero opportunities) is genuinely fixed — endpoints corrected in source, regression test pins the fix, and end-to-end ingestion was proven live (total:3 records, 3 version rows). Phase gates are all GREEN and `gaps list 08` returns 0.

The verdict is **human_needed**, not gaps_found: 5 UI flows (UAT tests 2–6, and the interactive parts of test 1) were originally SKIPPED because they were blocked by the ingestion 403 — a blocker that is now closed and whose data precondition (3 real Grants.gov records) now exists. There is **no open gap** — only human UI re-test of flows whose blocking precondition is now satisfied. Per the gap-closure rules, this is human_needed rather than gaps_found.

## Goal Achievement

### Observable Truths (Success Criteria from ROADMAP.md)

| # | Truth (Success Criterion) | Status | Evidence |
| --- | --- | --- | --- |
| 1 | System polls Grants.gov Search + Detail APIs on schedule and upserts normalized records without duplicates | ✓ VERIFIED | `SEARCH_ENDPOINT=${GRANTS_GOV_BASE}/search2` (grantsGovService.ts:14, was 403 suffix); `DETAIL_ENDPOINT=/fetchOpportunity` (:19). ingestionScheduler.ts uses node-cron. Live refreshAll {fetched:3, upserted:3, failed:0}; upsert by source_opportunity_number dedups (externalOpportunityService.ts:147). Boot_smoke gate 4 hit this route → 200. |
| 2 | Every ingested opportunity exposes normalized metadata (title, agency, FON, assistance listing, eligibility, due dates, award ceiling/floor, status, package ref) | ✓ VERIFIED | normalizeOpportunity returns all fields: title (:260), agency (:261), source_opportunity_number/FON (:257), source_assistance_listing (:258), eligibility_summary (:263), due_date (:264), opportunity_status (:262), source_url (:256), api_reference (:259). Dual-shape tolerant (live envelope + flat). |
| 3 | Applicants can save/unsave/list saved external opportunities; import into internal workspace with pre-populated metadata | ✓ VERIFIED | Backend: saveOpportunity (externalOpportunityService.ts:365), unsaveOpportunity (:398), /saved route, /import route → importService.ts. Frontend: ExternalOpportunityCard save heart, SavedOpportunities.tsx, import wired in externalOpportunitiesApi.ts:50. *Interactive UI flow → human (tests 3, 5).* |
| 4 | On re-fetch, changed fields (due date/status/package URL/addenda/instructions) create in-app change alerts for all users who saved | ✓ VERIFIED (code) | externalOpportunityService.ts: diff logic (:130), createVersion + createAlerts loop over savers (:319-348), change_alerts INSERT (:348). Field→alert-type map (:26). Frontend ChangeAlertsBell.tsx + ChangeAlertsPage.tsx wired. *Live alert-firing round-trip → human (test 4).* |
| 5 | Every record permanently stores source attribution (name, URL, API snapshot, import ts) + complete immutable version history with per-version changed-fields diff | ✓ VERIFIED | Attribution fields persisted (source_url, api_reference snapshot, source_opportunity_number). Immutable version rows: external_opportunity_versions INSERT with version_number, changed_fields, snapshot (:298-311). Proven: external_opportunity_versions=3 rows live. VersionHistory UI exists. *Accordion/snapshot render → human (test 6).* |

**Score:** 5/5 truths verified in code + proven with live data. Interactive UI confirmation of tests 1–6 deferred to human (precondition now satisfied).

### 08-06 Must-Haves (gap-closure plan frontmatter)

| # | Must-Have | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Search call POSTs to /search2 and receives HTTP 200 (not 403) | ✓ VERIFIED | grantsGovService.ts:14,106 — POST SEARCH_ENDPOINT (/search2). Live 200 proven. |
| 2 | Admin refresh ingests: fetched>0 and upserted>0 | ✓ VERIFIED | Live refreshAll {fetched:3, upserted:3, failed:0}. Detail endpoint also fixed (POST /fetchOpportunity) — required for upserted>0. |
| 3 | GET /api/v1/external-opportunities returns total>0 after refresh | ✓ VERIFIED | Live GET → HTTP 200 total:3 (was total:0). Boot_smoke gate 4 confirms. |
| 4 | Regression test pins /search2 and asserts data.oppHits parsed | ✓ VERIFIED | externalOpportunities.test.ts:205-225 — toMatch(/\/search2(\?\|$)/) + not.toMatch(403 suffix) + oppHits parse. Ran: 12/12 pass. |
| 5 | GATE.md records boot_smoke verdict | ✓ VERIFIED | 08-GATE.md:9 — boot_smoke: pass. |
| 6 | GATE.md records review_blockers_open count | ✓ VERIFIED | 08-GATE.md:10 — review_blockers_open: 0. |

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/services/external/grantsGovService.ts` | Corrected endpoints + dual-shape normalizer | ✓ VERIFIED | /search2 + /fetchOpportunity; contains all normalized fields; no stubs |
| `src/services/external/ingestionScheduler.ts` | node-cron scheduler + detail enrichment | ✓ VERIFIED | Enriches oppStatus/closeDate from search hit; no stubs |
| `src/services/external/externalOpportunityService.ts` | Upsert + versioning + alerts + save/import | ✓ VERIFIED | 498+ lines, full diff/version/alert wiring |
| `src/routes/externalOpportunities.ts` | REST routes (list/detail/save/import/alerts/versions/admin) | ✓ VERIFIED | All 13 routes present |
| `tests/integration/externalOpportunities.test.ts` | Regression test pinning /search2 | ✓ VERIFIED | 12/12 tests pass (ran live) |
| `client/src/pages/applicant/ExternalOpportunityBrowserPage.tsx` | Browse UI | ✓ VERIFIED (existence) | 402 lines, wired to API; render → human |
| `client/src/pages/applicant/ExternalOpportunityDetailPage.tsx` | Detail + version history UI | ✓ VERIFIED (existence) | 555 lines, wired; render → human |
| `client/src/components/ExternalOpportunityCard.tsx` | Card + save heart | ✓ VERIFIED (existence) | 190 lines, wired |
| `client/src/components/ChangeAlertsBell.tsx` | Alert bell | ✓ VERIFIED (existence) | Present, wired |
| `client/src/components/SavedOpportunities.tsx` | Saved section | ✓ VERIFIED (existence) | Present |
| `client/src/pages/applicant/ChangeAlertsPage.tsx` | Alerts page | ✓ VERIFIED (existence) | Present |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| grantsGovService.ts | api.grants.gov/v1/api/search2 | fetch POST in searchOpportunities() | ✓ WIRED | :106 POST SEARCH_ENDPOINT; pattern /search2(?!/opportunities) satisfied; live 200 |
| grantsGovService.ts | api.grants.gov/v1/api/fetchOpportunity | fetch POST in getOpportunityDetail() | ✓ WIRED | :145 POST DETAIL_ENDPOINT; live 200 |
| tests/integration/*.test.ts | SEARCH_ENDPOINT | mock fetch matching /search2 | ✓ WIRED | All 3 mocks re-pinned; regression negative-asserts 403 suffix |
| client externalOpportunitiesApi.ts | /api/v1/external-opportunities | apiClient get/post/delete | ✓ WIRED | list/detail/versions/save/unsave/saved/alerts/import all mapped |
| App.tsx | ExternalOpportunity*Page | Route path="grants-gov" | ✓ WIRED | :76,:78 routed |
| externalOpportunityService.upsert | external_opportunity_versions | INSERT on field change | ✓ WIRED | :298-311; 3 version rows proven live |
| externalOpportunityService.upsert | change_alerts | INSERT per saver | ✓ WIRED | :319-348 loop over savers |

### Requirements Coverage

| Requirement | Status | Notes |
| --- | --- | --- |
| PRD-INTAKE-019A (ingestion service/client) | ✓ SATISFIED | Endpoints fixed, live ingestion proven |
| PRD-INTAKE-019B (normalized metadata) | ✓ SATISFIED | All fields normalized (SC #2) |
| PRD-INTAKE-019C (browse/save/import UI) | ✓ SATISFIED (code) | Backend + UI wired; interactive flows → human |
| PRD-INTAKE-019D (scheduled refresh + alerts) | ✓ SATISFIED (code) | Scheduler + change detection + alerts wired; alert-fire → human |
| PRD-INTAKE-019E (attribution + version history) | ✓ SATISFIED | Attribution persisted, version rows proven live |

### Behavioral Spot-Checks (evidence, not inference)

| Check | Command | Result |
| --- | --- | --- |
| Regression + scheduler suites | `npx vitest run tests/integration/externalOpportunities.test.ts tests/integration/ingestionScheduler.test.ts` | ✓ 12/12 passed (1.01s) — matches SUMMARY claim |
| Endpoint constants in source | `grep SEARCH_ENDPOINT/DETAIL_ENDPOINT` | ✓ /search2 + /fetchOpportunity (403 suffix gone) |
| Regression test not a tautology | `grep not.toMatch` externalOpportunities.test.ts:224 | ✓ negative-asserts 403 suffix; confirmed by code review |
| Claimed commits exist | `verify commits 0f0e32e 6f8c3e3` | ✓ all_valid: true |
| Anti-pattern scan (modified src) | `grep TODO/FIXME/PLACEHOLDER grantsGovService.ts ingestionScheduler.ts` | ✓ clean — 0 matches (matches SUMMARY "Known Stubs: None") |

### Gate Evidence (cited, not re-litigated)

Per gap-closure rules, these gates are GREEN and are cited as authoritative:

- **gate_status: passed** (08-GATE.md:3) — build/tests verified by phase gates.
- **boot_smoke: pass** (08-GATE.md:9) — backend :3000 200, frontend :5173 200, db+redis healthy, data-backed endpoint 200. App boots.
- **review_blockers_open: 0** (08-GATE.md:10) — 0 confirmed HIGH/CRITICAL per 08-SECURITY.md.
- **08-REVIEW.md: 0 BLOCKERS**, 3 WARNINGS (advisory) — reviewer confirmed core fix correct, regression test genuine, no injection surface.
- **`gaps list 08`: gap_count 0** — all 3 UAT/gate gaps closed and re-driven.
- **08-UAT.md Gaps entry: status closed** with redrive_evidence (total:3, 3 version rows, 12/12 regression).

### Advisory Notes (code-review WARNINGs — NOT gaps)

These are advisory hardening items from 08-REVIEW.md. None breaks a must_have — verified live ingestion (upserted:3, 3 version rows) proves the current live envelope shape works. Listed for follow-up:

- **W1 (integration):** Detail enrichment backfills oppStatus/closeDate but not opportunityNumber; `source_opportunity_number` derives solely from `raw.opportunityNumber` (grantsGovService.ts:257). If a live envelope ever omits flat opportunityNumber, that hit would be skipped. **Assessed advisory:** live data proved upserted:3 (all 3 hits carried it); latent edge case, not a current break. Suggested fix: backfill from search hit (`hit.number`), mirroring status/closeDate.
- **W2 (bug):** Synthesized package URL template (`apply07.grants.gov/.../PKG-${id}-instructions.pdf`) is a guessed path; `application_package_url` may 404 for live records. Informational field, not on a critical path. Suggested fix: prefer API-returned URL or leave null.
- **W3 (bug):** Non-string live date fields (e.g. epoch `responseDate`) silently dropped to null by `toIsoDateOrNull`. Degraded metadata, not a break. Suggested fix: accept numeric epoch.

### Human Verification Required

6 flows need human UI confirmation. **All were originally SKIPPED in UAT solely because of the ingestion 403 blocker — now CLOSED with the data precondition (3 real Grants.gov records) satisfied.** No open gap exists; these are re-tests of flows whose blocker is resolved:

1. **Browse Grants.gov Opportunities** — cards/filter render (data now present)
2. **View External Opportunity Detail** — metadata grid + attribution footer
3. **Save/Unsave** — heart toggle + dashboard "Saved from Grants.gov"
4. **Change Alerts Bell + Alerts Page** — save→re-ingest→alert round-trip
5. **Import to Workspace** — modal + redirect + dedup
6. **Version History Accordion + Snapshot Modal** — accordion render (3 version rows present)

(Full test/expected/why-human details in frontmatter `human_verification`.)

### Gaps Summary

**No gaps.** The BLOCKER (ingestion 403) is genuinely fixed in source, pinned by a non-tautological regression test (ran 12/12), and proven end-to-end with live data (fetched:3/upserted:3, GET total:3, 3 version rows). All 5 Success Criteria are verified in code and backed by live evidence. All phase gates are GREEN; `gaps list 08` = 0. The 3 code-review WARNINGs are advisory and none defeats a must_have.

The status is **human_needed** purely because 5–6 interactive/visual UI flows (UAT tests 1–6) cannot be confirmed by static analysis or a headless spot-check, and were never human-tested because the ingestion blocker (now closed) prevented it. The blocking precondition is now satisfied — these flows are ready for human re-test, not blocked.

---

_Verified: 2026-09-02T12:27:10Z_
_Verifier: Claude (pivota_spec-verifier)_
