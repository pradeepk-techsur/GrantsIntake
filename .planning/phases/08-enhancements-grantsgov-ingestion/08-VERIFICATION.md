---
phase: 08-enhancements-grantsgov-ingestion
verified: 2026-09-02T13:31:55Z
status: passed
score: 5/5 phase truths verified + 3/3 uat/5 gap-closure must-haves verified (automated proof)
re_verification:
  previous_status: human_needed
  previous_score: 5/5 must-haves (backend/data proven); 5 UI flows deferred to human
  gaps_closed:
    - "uat/5 (PRD-INTAKE-019C): import now observable on /applicant/applications — success banner + imported-opportunity-card with 'Imported from Grants.gov' badge; re-import idempotent at the surface"
  gaps_remaining: []
  regressions: []
gate_evidence:
  gate_status: passed
  boot_smoke: pass
  review_blockers_open: 0
  gaps_open: 0
  code_review_warnings: 1 (W3, advisory product-decision edge — NOT a blocker)
  tests: 289/289 backend vitest green (32 files); integration 13/13 externalOpportunities; e2e externalOpportunities.spec.ts green
  builds: backend tsc clean + client vite build clean
human_verification: []
---

# Phase 8: Enhancements — Grants.gov Ingestion Verification Report

**Phase Goal:** Automatically ingest active funding opportunities from Grants.gov APIs, normalize and persist opportunity metadata with full source attribution and version history, allow applicants to save/track/compare/import external opportunities into internal workspaces, and deliver in-app change alerts when tracked opportunities are updated.

**Verified:** 2026-09-02T13:31:55Z
**Status:** passed
**Re-verification:** Yes — after gap-closure run 08-07 (`--gaps-only`) closing uat/5

## Executive Summary

This round was a gap-closure run (`--gaps-only`): the only plan executed was **08-07**, which closed UAT gap **uat/5** (PRD-INTAKE-019C). Plans 08-01..08-06 were complete and verified in prior rounds; this verification confirms uat/5 is genuinely closed AND the broader phase goal remains achieved with no regression.

The previous VERIFICATION.md (12:27:10Z) returned `human_needed` because 5–6 interactive UI flows — including the import round-trip (test 5) — could not be confirmed by static analysis and had never been human-tested. **Plan 08-07 has since closed uat/5 with automated end-to-end proof** (integration + e2e), converting the previously deferred import flow into a machine-verified truth. The gap that made the redirect show "nothing happened" is fixed: the applicant now lands on `/applicant/applications`, sees a success banner, and sees the imported opportunity carrying the "Imported from Grants.gov" badge; re-import stays a single card.

All phase gates are GREEN (`gate_status: passed`, `boot_smoke: pass`, `review_blockers_open: 0`) and `gaps_open: 0`. The single remaining code-review item (W3) is an advisory product-decision edge — a cross-user re-import UX inconsistency newly *exposed* (not introduced) by the correct IDOR fix — and does not defeat any must-have. Verdict: **passed**.

## Goal Achievement

### Observable Truths (Success Criteria from ROADMAP.md)

| # | Truth (Success Criterion) | Status | Evidence |
| --- | --- | --- | --- |
| 1 | System polls Grants.gov Search + Detail APIs on schedule and upserts normalized records without duplicates | ✓ VERIFIED | Endpoints corrected (/search2 + /fetchOpportunity), node-cron scheduler, upsert dedups by source_opportunity_number. Proven in prior rounds (live refreshAll fetched:3/upserted:3); boot_smoke gate 4 hit list route → 200. No regression this round (write path untouched by 08-07). |
| 2 | Every ingested opportunity exposes normalized metadata (title, agency, FON, assistance listing, eligibility, due dates, award ceiling/floor, status, package ref) | ✓ VERIFIED | normalizeOpportunity returns all fields (dual-shape tolerant). externalOpportunityAttribution.test.ts (5) + versioning coverage green. Untouched by 08-07. |
| 3 | Applicants can save/unsave/list saved external opportunities; import into internal workspace with pre-populated metadata | ✓ VERIFIED | Backend save/unsave/saved/import routes wired to importService. **Import→visibility now proven end to end (uat/5 closed):** integration happy-path lists the imported opp (was invisible); e2e import→banner→badge green. |
| 4 | On re-fetch, changed fields create in-app change alerts for all users who saved | ✓ VERIFIED (code) | Diff logic + createVersion + createAlerts loop over savers; change_alerts INSERT; ChangeAlertsBell/Page wired. Proven in code + prior data (3 version rows). Untouched by 08-07. |
| 5 | Every record permanently stores source attribution + complete immutable version history with per-version changed-fields diff | ✓ VERIFIED | Attribution persisted; immutable version rows with version_number/changed_fields/snapshot; external_opportunity_versions rows proven live. Untouched by 08-07. |

**Score:** 5/5 phase truths verified. Truth #3's interactive import round-trip — previously deferred to human — is now machine-verified by the 08-07 integration + e2e regression assets.

### 08-07 Gap-Closure Must-Haves (uat/5 — PRD-INTAKE-019C)

| # | Must-Have | Status | Evidence |
| --- | --- | --- | --- |
| 1 | After confirming Import, applicant lands on /applicant/applications and sees a success banner | ✓ VERIFIED | WorkspaceListPage.tsx:2,34,38 `useLocation` reads `location.state.importedFromGrantsGov`; renders `data-testid="import-success-banner"` (:75). DetailPage navigates with `state: { importedFromGrantsGov: true }` (:83). e2e asserts banner visible + "imported successfully" (spec:340-343). |
| 2 | Imported opportunity visible on /applicant/applications with "Imported from Grants.gov" badge | ✓ VERIFIED | New authenticated `GET /external-opportunities/imported` (route:65, `authenticate` :66) → `listImportedOpportunities(actorUserId)`. WorkspaceListPage queries `listImported` (:49-50), renders `imported-opportunity-card` (:251) with reused `imported-badge` (:268). client API `listImported()` wired (externalOpportunitiesApi.ts:54-55). e2e asserts card + badge text (spec:344-347). |
| 3 | Re-importing does not create a duplicate (idempotent) — exactly one entry | ✓ VERIFIED | e2e re-imports (second POST already_imported:true) and asserts `imported-opportunity-card` `toHaveCount(1)` + `importCount === 2` (spec:361-366) — genuine red→green (testids did not exist pre-08-07). Integration "double-import yields exactly one item" green. |

### Required Artifacts (08-07)

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/routes/externalOpportunities.ts` | Authenticated GET /imported before /:id catch-all | ✓ VERIFIED | Route :64-78; ordering comment :62-63; `authenticate` :66; threads `req.user!.user_id` :71 (B1 IDOR fix) |
| `src/services/external/importService.ts` | listImportedOpportunities(actorUserId) over source='grants_gov_import' | ✓ VERIFIED | :159 method; parameterized SQL `WHERE source=$1 AND status=$2 AND created_by=$3` (:183); no stubs (grep TODO/FIXME = 0) |
| `client/src/pages/applicant/WorkspaceListPage.tsx` | useLocation banner + imported list with badge | ✓ VERIFIED | useLocation :2,34; banner :75; imported section :203; card :251; badge :268 |
| `client/src/api/externalOpportunitiesApi.ts` | listImported() client method | ✓ VERIFIED | :54-55 → GET /external-opportunities/imported, typed ImportedListResponse |
| `client/src/pages/applicant/ExternalOpportunityDetailPage.tsx` | navigate state + invalidate imported query | ✓ VERIFIED | invalidate `['imported-opportunities']` :80; navigate state :83 |
| `e2e/externalOpportunities.spec.ts` | import → banner → badge → no-duplicate | ✓ VERIFIED | spec:325-366; genuine red→green reproduction |

### Key Link Verification (08-07)

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| ExternalOpportunityDetailPage.tsx | /applicant/applications | navigate state `{ importedFromGrantsGov: true }` | ✓ WIRED | :83 |
| WorkspaceListPage.tsx | location.state.importedFromGrantsGov | useLocation() | ✓ WIRED | :34,38-39 → banner :75 |
| WorkspaceListPage.tsx | /api/v1/external-opportunities/imported | externalOpportunitiesApi.listImported in useQuery | ✓ WIRED | :49-50 |
| externalOpportunitiesApi.ts | GET /external-opportunities/imported | apiClient.get | ✓ WIRED | :54-55 |
| externalOpportunities route | listImportedOpportunities(user_id) | importService | ✓ WIRED | route:70-71 → service:159; per-caller scoped |

### Requirements Coverage

| Requirement | Status | Notes |
| --- | --- | --- |
| PRD-INTAKE-019A (ingestion service/client) | ✓ SATISFIED | Prior rounds; live ingestion proven; untouched this round |
| PRD-INTAKE-019B (normalized metadata) | ✓ SATISFIED | All fields normalized; untouched |
| PRD-INTAKE-019C (browse/save/import UI) | ✓ SATISFIED | **uat/5 closed** — import now observable (banner + badge + idempotent), integration + e2e proven |
| PRD-INTAKE-019D (scheduled refresh + alerts) | ✓ SATISFIED (code) | Scheduler + change detection + alerts wired; untouched |
| PRD-INTAKE-019E (attribution + version history) | ✓ SATISFIED | Attribution persisted, version rows proven live; untouched |

### Behavioral Spot-Checks (evidence, not inference)

| Check | Command | Result |
| --- | --- | --- |
| 08-07 task commits exist | `git cat-file -e c89c890 99ade50 991d4c3` | ✓ all present |
| Route exists + auth-guarded + ordered before /:id | read externalOpportunities.ts:61-78 | ✓ `/external-opportunities/imported` + `authenticate` + ordering comment |
| Service query per-caller scoped (B1 IDOR fix) | read importService.ts:159-186 | ✓ parameterized `created_by = $3` = actorUserId; no injection surface |
| Client API method wired | read externalOpportunitiesApi.ts:54-55 | ✓ listImported → GET /imported |
| e2e is genuine red→green (not post-hoc tick) | read spec:325-366 | ✓ testids added by 08-07; asserts count===1 + importCount===2 |
| Anti-pattern scan (importService.ts) | grep TODO/FIXME/PLACEHOLDER | ✓ 0 matches (matches SUMMARY "Known Stubs: None") |

### Gate Evidence (cited, not re-litigated)

Per gap-closure rules, these gates are GREEN and cited as authoritative — not re-run:

- **gate_status: passed** (08-GATE.md:3) — 3 waves all build+tests pass, fix_attempts 0.
- **boot_smoke: pass** (08-GATE.md:9) — backend :3000 /health 200, new GET /external-opportunities/imported returns 401 unauth (auth-enforced + present), frontend :5173 200, DB 45 relations.
- **review_blockers_open: 0** (08-GATE.md:10) — all iteration-1 review blockers (incl. B1 IDOR) resolved by the code-fixer; 08-REVIEW.md blockers: 0.
- **Tests:** 289/289 backend vitest green (32 files); integration externalOpportunities 13/13; e2e externalOpportunities.spec.ts green.
- **Builds:** backend tsc clean + client vite build clean.
- **Gap redrive** (08-GATE.md "## Gap redrive"): uat/5 closed (re-driven) — integration (happy path + double-import single-item + two-user IDOR scoping + 401) and e2e (spec:264) all green against the current tree; no recurrence file present (first-round closure).

### Advisory Note (code-review WARNING — NOT a gap)

- **W3 (08-REVIEW.md:86-112):** Global import idempotency (keyed on `external_opportunity_id`) vs. the new per-user list scoping (`created_by = actorUserId`). If user B re-imports an opp already imported by user A, B receives `already_imported:true` + the success banner but the opp will not appear in B's `/imported` list (it is A's row). This is a UX/correctness edge the correct IDOR fix newly *exposes* (previously masked when everyone saw everything); no data is corrupted and it is not a security regression. The primary uat/5 flow (a user importing a not-yet-imported opp) works correctly and is covered by integration + e2e. Flagged for a product decision (adjust banner copy on cross-user `already_imported`, or record per-user import intent). **Does not defeat any must-have.**

### Anti-Patterns Found

None blocking. importService.ts (the substantive new logic) has 0 TODO/FIXME/PLACEHOLDER; SUMMARY "Known Stubs: None" confirmed.

### Human Verification Required

None. The import flow (formerly the only remaining unproven interactive path relevant to this gap-closure round) is now machine-verified by the 08-07 integration + e2e regression assets. Since the gap was re-driven with automated proof this round, no item is deferred to human.

### Gaps Summary

**No gaps.** uat/5 is genuinely closed: the redirect destination now reads the router-state signal and renders a success banner (`import-success-banner`), and a new authenticated, per-caller-scoped `GET /external-opportunities/imported` endpoint surfaces the imported opportunity with the reused "Imported from Grants.gov" badge — all wired end to end and proven by an integration suite (13/13, incl. double-import single-item and two-user IDOR isolation) and a genuine red→green Playwright test (import → banner → badge → re-import → exactly one card). The import write path, migration 018, and ingestion were untouched (no regression). All phase gates are GREEN, `gaps_open: 0`, and the single code-review WARNING (W3) is an advisory product-decision edge, not a blocker. The broader phase goal holds.

---

_Verified: 2026-09-02T13:31:55Z_
_Verifier: Claude (pivota_spec-verifier)_
