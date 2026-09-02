# Security Report — Phase 8: Enhancements — Grants.gov Opportunity Ingestion

**Mode:** retroactive (RE-AUDIT — reconciled against prior 2026-09-02 report)
**Audited:** 2026-09-02 (re-audit)
**Verdict:** SECURED
**Confirmed HIGH/CRITICAL:** 0

## Summary
This is a **re-audit** of Phase 8 following the 08-06 gap-closure work (endpoint URLs corrected to `/search2` + POST `/fetchOpportunity`, `normalizeOpportunity` made shape-tolerant, new `normalizePackages` helper, scheduler detail-enrichment). The STRIDE register was rebuilt from the on-disk external-opportunity subsystem (no `main`/`develop` base branch exists — git history is squashed on `phase-8`, so a phase-isolated `git diff` is unavailable; the file set below was audited directly). The prior authorization posture holds: every authenticated endpoint derives the acting user from the JWT (`req.user!.user_id`), never from the request body; the admin refresh routes remain gated by `authenticate` + `requireRole('grantor_admin')`; all SQL is parameterized (static ORDER BY, clamped LIMIT/OFFSET). The 08-06 gap-closure `<threat_model>` claims (T-08-01 deserialization, T-08-02 admin authz, T-08-03 endpoint-URL disclosure) were re-verified against current code and all hold. The 08-06 changes introduced **no new HIGH/CRITICAL issue**. Prior finding **F-01 (MEDIUM, `javascript:`-scheme stored-XSS on external `href`s) remains OPEN** — re-confirmed at the shifted-but-present code path (`normalizePackages` copies `packageURL` verbatim with no scheme validation; no `safeHref` render guard was added). Prior **F-02 (LOW) remains an accepted risk**. Ship-able; F-01 should be hardened.

## Attack surface audited
| Area | STRIDE | Verdict | Evidence (file:line) |
|------|--------|---------|----------------------|
| `GET /external-opportunities` (public list/filter/paginate) | T (SQLi) | SAFE | src/services/external/externalOpportunityService.ts:434-479 (parameterized WHERE via `$${idx}`, static ORDER BY, bound LIMIT/OFFSET) |
| List paging params (`page`/`limit`) | D | SAFE | externalOpportunityService.ts:426-428 (page≥1, limit clamped 1–100) |
| `GET /external-opportunities/:id` + `/:id/versions` (public detail) | I | SAFE (LOW note) | src/routes/externalOpportunities.ts:124-141, 224-244; externalOpportunityService.ts:503-510 (UUID-gated; exposes non-sensitive public federal snapshot — see F-02) |
| `GET /external-opportunities/saved` (list saved) | E / IDOR | SAFE | routes:46-59; service:409-420 (`WHERE s.user_id = $1` from JWT `req.user!.user_id`) |
| `GET /external-opportunities/alerts` (unread alerts) | E / IDOR | SAFE | routes:62-75; service:531-548 (`WHERE user_id = $1` from JWT) |
| `PUT /external-opportunities/alerts/:alertId/read` (mark read) | E / IDOR | SAFE | routes:77-91; service:550-556 (`WHERE id=$1 AND user_id=$2`; user from JWT) |
| `POST /external-opportunities/:id/save` / `DELETE .../save` | E / IDOR | SAFE | routes:146-192; service:365-407 (user from JWT; unsave scoped `WHERE user_id=$1 AND external_opportunity_id=$2`) |
| `POST /external-opportunities/:id/import` | E / IDOR / T | SAFE | routes:196-222; src/services/external/importService.ts:30-205 (actor=JWT user; status/source hardcoded; idempotency key = external UUID) |
| `POST /external-opportunities/admin/refresh[/:oppNumber]` | E (authz) — T-08-02 | SAFE | routes:94-122 (`authenticate` + `requireGrantorAdmin` = `requireRole('grantor_admin')`, routes:14) |
| Outbound Grants.gov fetch (search `/search2` / detail POST `/fetchOpportunity`) | T / SSRF — T-08-03 | SAFE | src/services/external/grantsGovService.ts:11-19, 106-110, 145-149 (base URL fixed via `GRANTS_GOV_API_BASE`; no user value steers host; no secret in URL) |
| `refreshSingle(:opportunityNumber)` | SSRF | SAFE | src/services/external/ingestionScheduler.ts:101-144 (param used only as search `keyword`, :111; detail id = API-returned `match.opportunityId`, :127, not user) |
| Unsafe deserialization of Grants.gov envelope | T — T-08-01 | SAFE | grantsGovService.ts:23-87, 169-276 (every field coerced via `String()`/`toNumberOrNull`/`toIsoDateOrNull`; no eval, no attacker-controlled dynamic key exec; raw blob stored as JSONB only) |
| Import trust-boundary (external → internal `opportunities`) | T (tampering/forgery) | SAFE | importService.ts:149-205 (status `imported`, source `grants_gov_import` hardcoded; fields `.slice()` length-clamped; created_by = JWT actor) |
| Import idempotency / aliasing | T | SAFE | src/db/migrations/018_opportunity_external_link.sql:14-16 (unique partial index) + importService.ts:45-58 (existence guard, txn) |
| Upsert / versioning SQL | T (SQLi) | SAFE | externalOpportunityService.ts:151-316 (all `$n` params; JSON.stringify for JSONB) |
| Audit trail (IMPORTED/REFRESHED/SAVED) | R | SAFE | externalOpportunityService.ts:277-289, 365-396; importService.ts:76-87 (server-set actor/entity; NULL actor for scheduler intentional; payload not request-derived) |
| Secret handling (Grants.gov token/keys/creds) | I | SAFE | grep across src/services/external: no token/apiKey/secret/password/Authorization referenced; public unauthenticated API, no key in URL or logs |
| React text rendering (title/agency/eligibility/alerts/snapshot) | T (XSS) | SAFE | ExternalOpportunityDetailPage.tsx:131, 212, 399 (auto-escaped `{value}`; snapshot in `<pre>{JSON.stringify}`); no `dangerouslySetInnerHTML` in phase-8 components |
| External URL rendered as `href` (`application_package_url`, `source_url`) | T (XSS) | **FINDING** | ExternalOpportunityDetailPage.tsx:182, 196 (no scheme validation; untrusted origin grantsGovService.ts:55/71/220/267 — see F-01) |
| Phase-8 cards/bell/browser/saved external links | T (XSS) | SAFE | grep: ExternalOpportunityCard.tsx / ChangeAlertsBell.tsx / SavedOpportunities.tsx / ExternalOpportunityBrowserPage.tsx render NO external `href` (only detail page does) |

## Confirmed findings
> OPEN findings only. Each survived adversarial refutation.

### F-01: Unvalidated URL scheme on externally-sourced links (`javascript:` stored-XSS vector) — MEDIUM
- **Status:** Unchanged from prior audit — not fixed. (Re-verified against the 08-06 `normalizePackages`/`normalizeOpportunity` rewrite; the copy-verbatim path persists and no `safeHref`/scheme guard was added anywhere in `client/src`.)
- **Category:** xss (stored, scheme-injection)
- **Location:** client/src/pages/applicant/ExternalOpportunityDetailPage.tsx:182 (`href={opp.application_package_url}`) and :196 (`href={opp.source_url}`); untrusted origin at src/services/external/grantsGovService.ts:55 (`flat[0].packageURL` copied via `String(...)`), :71 (`first.packageURL`), surfaced through :220 (`packageUrl = pkgs.packageUrl`) and :267 (`application_package_url: packageUrl`).
- **Description:** `application_package_url` is copied verbatim from the Grants.gov detail response (`packages[0].packageURL` or `opportunityPkgs[].packageURL`) into the canonical record with **no scheme validation** — the new `normalizePackages` helper (08-06) only `String(...)`-coerces the type, it does not restrict the scheme. The value is persisted, served by the **public** `GET /external-opportunities/:id` endpoint, and rendered directly as an anchor `href` on the applicant detail page. React 19 does not neutralize `javascript:`-scheme URLs in `href` at runtime, so a stored value like `javascript:fetch('/api/v1/...',{headers:{Authorization:...}})` would execute in the victim's session on click. `source_url` is server-constructed (`PUBLIC_DETAIL_URL`, grantsGovService.ts:20-21, :256) and therefore not attacker-influenced, but it shares the same unvalidated rendering path and should be guarded as defense-in-depth.
- **Exploit:** Requires the injected value to appear in the Grants.gov detail payload the ingester consumes — a malicious/compromised upstream response, a MitM on the outbound fetch, or an operator pointing `GRANTS_GOV_API_BASE` at an attacker-controlled host. Given a hostile `packageURL`, any applicant (or unauthenticated visitor, since detail is public) who opens the opportunity and clicks "Open package ↗" runs attacker script in-origin. The trusted-federal-API upstream and absence of a direct user-injection path cap this at MEDIUM, not HIGH.
- **Fix:** Validate the URL scheme before storing and/or before rendering — allow only `http:`/`https:` (reject/blank `javascript:`, `data:`, `vbscript:`). Preferred: sanitize at normalize time in `grantsGovService` (`normalizePackages` / `normalizeOpportunity`) so the persisted/public value is always safe, plus a render-time `safeHref()` guard used by both `href` sites.

## Resolved findings
_None fixed this cycle — F-01 remains open (see above); no other prior finding existed to close._

## Accepted risks
| ID | Risk | Why accepted | Owner |
|----|------|--------------|-------|
| F-02 | Public `GET /external-opportunities/:id` returns the full `api_reference` (raw Grants.gov detail snapshot) and `raw_metadata` blobs (externalOpportunityService.ts:503-510 → rowToOpportunity:84-110, no trimming) | LOW/informational — unchanged from prior audit and **still accepted**. The blob is sourced from the Grants.gov **detail** response (public federal data), not the search response's `token`; no internal user/org/tenant data is joined into the response. Over-exposure of already-public data only. Recommend trimming `api_reference` from public responses to reduce surface, but no confidentiality boundary is crossed. | Phase 8 owner |

## Audit trail
- Diff scoped via: on-disk file set (no `main`/`develop` base branch — `phase-8` history squashed to 2 commits, root `798ef3d` gap-closure + `0a90b65` execution-complete; phase-isolated `git diff` unavailable). Audited: src/routes/externalOpportunities.ts, src/services/external/{grantsGovService,externalOpportunityService,importService,ingestionScheduler}.ts, src/types/externalOpportunity.ts, src/db/migrations/017+018, and client/src external-opportunity api/components/pages/types.
- Register: rebuilt retroactively from the diff; the 08-06 `<threat_model>` (T-08-01/02/03) treated as a narrow gap-closure register and verified against current code (all three claims hold), not as the phase-wide register.
- Upstream guards verified: src/middleware/authenticate.ts (JWT → `req.user`, 401 on missing/invalid) and src/middleware/requireRole.ts (403 on role mismatch) — confirmed applied to every authenticated/admin route in src/routes/externalOpportunities.ts.
- Re-verification of 08-06 changes: `SEARCH_ENDPOINT`=`${GRANTS_GOV_BASE}/search2` (grantsGovService.ts:14), detail POST `/fetchOpportunity` (:19, :145), `normalizePackages` (:49-87) — none widen SSRF (host still fixed) or introduce injection; F-01's upstream `packageURL` handling re-confirmed unguarded.
- Refutation: 12 candidates examined (IDOR ×5, admin-authz, SQLi, SSRF ×2, import-forgery, deserialization, secret-leak, XSS), 1 confirmed open (F-01, MEDIUM), 1 held as accepted-risk (F-02, LOW), remainder refuted SAFE with file:line evidence above. 0 confirmed HIGH/CRITICAL.
