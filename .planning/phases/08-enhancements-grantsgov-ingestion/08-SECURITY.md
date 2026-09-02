# Security Report — Phase 8: Enhancements — Grants.gov Opportunity Ingestion

**Mode:** retroactive
**Audited:** 2026-09-02
**Verdict:** SECURED
**Confirmed HIGH/CRITICAL:** 0

## Summary
This audit retroactively built a STRIDE register from the Phase-8 implemented diff (Grants.gov ingestion: outbound API client, upsert/versioning/change-alert service, node-cron scheduler, import-to-workspace service, REST routes, and the applicant/grantor React surface) and adversarially audited each entry point. The authorization posture is sound: every authenticated endpoint derives the acting user from the JWT (`req.user!.user_id`), never from the request body; the admin refresh routes are correctly gated with `requireRole('grantor_admin')`; and all SQL is parameterized (static ORDER BY, bound LIMIT/OFFSET, numerically-clamped paging). No SSRF, no IDOR, no injection, and no secret leakage survived refutation. One **MEDIUM** defense-in-depth gap was found (unvalidated URL scheme on externally-sourced `href` links — a `javascript:`-scheme stored-XSS vector constrained by a trusted upstream), plus one **LOW** informational note (public detail endpoint over-exposes the raw `api_reference`/`raw_metadata` blobs). Neither is a HIGH/CRITICAL exploitable issue, so the phase is **ship-able**; the MEDIUM should be hardened.

## Attack surface audited
| Area | STRIDE | Verdict | Evidence (file:line) |
|------|--------|---------|----------------------|
| `GET /external-opportunities` (public list/filter/paginate) | T (SQLi) | SAFE | src/services/external/externalOpportunityService.ts:430-479 (parameterized WHERE, static ORDER BY, bound LIMIT/OFFSET) |
| List paging params (`page`/`limit`) | D | SAFE | externalOpportunityService.ts:426-428 (page≥1, limit clamped 1–100) |
| `GET /external-opportunities/:id` + `/:id/versions` (public detail) | I | SAFE (LOW note) | src/routes/externalOpportunities.ts:225-244; externalOpportunityService.ts:84-110 (no user/org join; exposes non-sensitive raw snapshot — see F-02) |
| `GET /external-opportunities/saved` (list saved) | E / IDOR | SAFE | routes:46-59; service:409-420 (`WHERE s.user_id = $1` from JWT) |
| `GET /external-opportunities/alerts` (unread alerts) | E / IDOR | SAFE | routes:62-75; service:531-548 (`WHERE user_id = $1` from JWT) |
| `PUT /external-opportunities/alerts/:alertId/read` (mark read) | E / IDOR | SAFE | routes:77-91; service:550-556 (`WHERE id=$1 AND user_id=$2`) |
| `POST /external-opportunities/:id/save` / `DELETE .../save` | E / IDOR | SAFE | routes:146-192; service:365-407 (user from JWT; unsave scoped by user_id) |
| `POST /external-opportunities/:id/import` | E / IDOR / T | SAFE | routes:196-222; src/services/external/importService.ts:30-205 (actor=JWT user; status/source hardcoded; idempotency key = external UUID PK) |
| `POST /external-opportunities/admin/refresh[/:oppNumber]` | E (authz) | SAFE | routes:94-122 (`authenticate` + `requireRole('grantor_admin')`) |
| Outbound Grants.gov fetch (search/detail) | T / SSRF | SAFE | src/services/external/grantsGovService.ts:11-17, 57-61, 94-97 (base URL fixed via `GRANTS_GOV_API_BASE`; no user value steers host) |
| `refreshSingle(:opportunityNumber)` | SSRF | SAFE | src/services/external/ingestionScheduler.ts:93-131; grantsGovService.ts:46-88 (param used only as search `keyword`; detail id comes from API response, not user) |
| Import trust-boundary (external → internal `opportunities`) | T (tampering/forgery) | SAFE | importService.ts:149-205 (status `imported`, source `grants_gov_import` hardcoded; fields length-clamped; created_by = JWT user) |
| Import idempotency / aliasing | T | SAFE | src/db/migrations/018_opportunity_external_link.sql:14-16 (unique partial index) + importService.ts:45-58 (existence guard) |
| Upsert / versioning SQL | T (SQLi) | SAFE | externalOpportunityService.ts:151-316 (all `$n` params; JSON.stringify for JSONB) |
| Audit trail (IMPORTED/REFRESHED/SAVED) | R | SAFE | externalOpportunityService.ts:277-289, 365-396; importService.ts:76-87 (server-set actor/entity; NULL actor for scheduler is intentional; payload not request-derived) |
| Secret handling (Grants.gov `token`, keys, creds) | I | SAFE | grep: no token/apiKey/secret persisted in src/services/external; `api_reference` sourced from detail (not search `token`) response |
| React text rendering (title/agency/eligibility/alerts/snapshot) | T (XSS) | SAFE | ExternalOpportunityCard.tsx:96, 105-108, 151; ExternalOpportunityDetailPage.tsx:131, 212, 399 (auto-escaped `{value}`; snapshot in `<pre>{JSON.stringify}`) |
| External URL rendered as `href` (`application_package_url`, `source_url`) | T (XSS) | **FINDING** | ExternalOpportunityDetailPage.tsx:182, 196 (no scheme validation — see F-01) |

## Confirmed findings
> OPEN findings only. Each survived adversarial refutation.

### F-01: Unvalidated URL scheme on externally-sourced links (`javascript:` stored-XSS vector) — MEDIUM
- **Category:** xss (stored, scheme-injection)
- **Location:** client/src/pages/applicant/ExternalOpportunityDetailPage.tsx:182 (`href={opp.application_package_url}`) and :196 (`href={opp.source_url}`); untrusted origin at src/services/external/grantsGovService.ts:134-137 (`packageURL` copied verbatim from `raw.packages[0].packageURL`).
- **Description:** `application_package_url` is copied verbatim from the Grants.gov detail response (`raw.packages[0].packageURL`) into the canonical record with no scheme validation, persisted, served by the **public** `GET /external-opportunities/:id` endpoint, and rendered directly as an anchor `href` on the applicant detail page. React 19 does **not** neutralize `javascript:`-scheme URLs in `href` at runtime, so a stored value like `javascript:fetch('/api/v1/...',{headers:{Authorization:...}})` would execute in the victim's session on click. `source_url` is server-constructed (`PUBLIC_DETAIL_URL`, grantsGovService.ts:16-17) and therefore not attacker-influenced, but it shares the same unvalidated rendering path, so any future change to its source would reintroduce the risk — both should be guarded.
- **Exploit:** Requires the injected value to appear in the Grants.gov detail payload the ingester consumes — i.e. a malicious/compromised upstream response, a MitM on the outbound fetch, or an operator setting `GRANTS_GOV_API_BASE` to an attacker-controlled host. Given a hostile `packageURL`, any applicant (or unauthenticated visitor, since detail is public) who opens the opportunity and clicks "Open package" runs attacker script in-origin. The trusted-federal-API upstream and lack of a direct user-injection path cap this at MEDIUM rather than HIGH.
- **Fix:** Validate the URL scheme before storing and/or before rendering — allow only `http:`/`https:` (reject/blank `javascript:`, `data:`, `vbscript:`). Preferred: sanitize at normalize time in `grantsGovService.normalizeOpportunity` (so the persisted/public value is always safe), and add a render-time guard helper (e.g. `safeHref()`) used by both `href` sites as defense-in-depth.

## Resolved findings
_None — first audit of this phase._

## Accepted risks
| ID | Risk | Why accepted | Owner |
|----|------|--------------|-------|
| F-02 | Public `GET /external-opportunities/:id` returns the full `api_reference` (raw Grants.gov detail snapshot) and `raw_metadata` blobs | LOW/informational: the blob is sourced from the Grants.gov **detail** response (public data), not the search response's `token`; no internal user/org/tenant data is joined into the response. Over-exposure of already-public federal data only. Recommend trimming `api_reference` from public responses to reduce surface, but no confidentiality boundary is crossed. | Phase 8 owner |

## Audit trail
- Diff scoped via: SUMMARY.md key-files list (git history squashed to 2 commits, root 996dc45 — phase-isolated `git diff` unavailable), cross-referenced with 08-01…08-05 SUMMARY key-files.
- Register: built retroactively from the diff (no PLAN.md `<threat_model>` block, no SUMMARY `## Threat Flags`).
- Upstream guards verified: src/middleware/authenticate.ts (JWT → `req.user`, 401 on missing/invalid) and src/middleware/requireRole.ts (403 on role mismatch) — confirmed applied to every authenticated/admin route in src/routes/externalOpportunities.ts.
- Refutation: 11 candidates examined (IDOR ×5, admin-authz, SQLi, SSRF, import-forgery, secret-leak, XSS), 1 confirmed (F-01, MEDIUM), 1 downgraded to accepted-risk (F-02, LOW), 9 refuted as SAFE with file:line evidence above.
