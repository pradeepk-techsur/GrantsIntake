---
status: complete
phase: 08-enhancements-grantsgov-ingestion
source: [08-01-SUMMARY.md, 08-02-SUMMARY.md, 08-03-SUMMARY.md, 08-04-SUMMARY.md, 08-05-SUMMARY.md]
started: 2026-09-02T11:44:44Z
updated: 2026-09-02T11:48:30Z
---

## Current Test

[testing complete]

## Tests

### 1. Browse Grants.gov Opportunities
expected: "Browse Grants.gov" sidebar link opens a filterable, paginated list (25/page) of external opportunity cards, each with status badge, award range, due date, eligibility snippet, source badge, save heart, and View Details. Filter apply/clear updates results.
result: issue
reported: "empty / no opportunities"
severity: blocker

### 2. View External Opportunity Detail
expected: Clicking View Details opens a detail page with the opportunity header, a metadata grid (agency, FON, assistance listing, due dates, award ceiling/floor, status), an eligibility panel, and a source-attribution footer (Source: Grants.gov · FON · import date).
result: skipped
reason: Blocked by the ingestion 403 blocker (test 1) — no external opportunity exists to open a detail page for.

### 3. Save and Unsave an External Opportunity
expected: Clicking the heart on a card or detail page saves the opportunity; it then appears in the "Saved from Grants.gov" section on the applicant dashboard (/applicant/applications). Unsaving removes it from that section.
result: skipped
reason: Blocked by the ingestion 403 blocker (test 1) — nothing to save; the list is empty.

### 4. Change Alerts Bell and Alerts Page
expected: A bell icon in the applicant header shows an unread count and a top-5 dropdown of change alerts for saved opportunities; each alert can be marked read inline. A full alerts page lists all change alerts.
result: skipped
reason: Blocked by the ingestion 403 blocker (test 1) — no saved opportunities can exist, so no change alerts can fire.

### 5. Import Grants.gov Opportunity into Workspace
expected: The detail page's "Import to Workspace" button opens a confirmation modal ("creates an internal copy… Proceed?"). Confirming imports the opportunity and redirects to /applicant/applications with a success message; the imported opportunity carries an "Imported from Grants.gov" badge. Re-importing does not create a duplicate.
result: skipped
reason: Blocked by the ingestion 403 blocker (test 1) — no external opportunity exists to import.

### 6. Version History Accordion and Snapshot Modal
expected: The detail page shows a "Version History (N versions)" accordion. Expanding it lists each version (V1, V2…) with its fetched date and changed-field labels (or "Initial import"). A "View snapshot" action opens a modal with the full pretty-printed JSON snapshot for that version.
result: skipped
reason: Blocked by the ingestion 403 blocker (test 1) — no opportunity, so no version history to display.

### 7. Grantor Grants.gov Sync Card
expected: A grantor_admin sees a "Grants.gov Sync" card on the grantor dashboard showing the last-sync time and a "Sync Now" button. Clicking Sync Now triggers a refresh with loading, then success/error feedback. The card is not shown to non-admin grantor users.
result: pass
reported: "card + Sync Now work"

## Summary

total: 7
passed: 1
issues: 1
pending: 0
skipped: 5

## Self-Check

boot: 200 (frontend :5173 up; backend :3000 API healthy; db + redis healthy)
data: NOT RUN — data-doctor not spawned; the ONLY source of external-opportunity data is Grants.gov ingestion, which is broken (see gap below), so no data-doctor seed could satisfy the UI preconditions. 0 external opportunities in DB.
routes_probed: 3 ok / 1 failed
cookie: n/a
browser_urls: none
per_test:
  - test: 1
    verdict: fail
    note: "🤖 Auto-check: GET /api/v1/external-opportunities returns { total: 0 } — no external opportunities exist to browse. Root cause: ingestion calls the wrong Grants.gov endpoint (403). See gap."
    confidence: proven
  - test: 2
    verdict: skipped (needs human)
    note: "🤖 No ingested opportunity exists to open a detail page for (blocked by ingestion 403)."
  - test: 3
    verdict: skipped (needs human)
    note: "🤖 Nothing to save — list is empty (blocked by ingestion 403)."
  - test: 4
    verdict: skipped (needs human)
    note: "🤖 No saved opportunities can exist, so no change alerts can fire (blocked by ingestion 403)."
  - test: 5
    verdict: skipped (needs human)
    note: "🤖 No external opportunity exists to import (blocked by ingestion 403)."
  - test: 6
    verdict: skipped (needs human)
    note: "🤖 No opportunity → no version history to display (blocked by ingestion 403)."
  - test: 7
    verdict: advisory
    note: "🤖 Auto-check: the Sync card UI + Sync Now button work (human-confirmed pass), but the manual admin refresh (POST /external-opportunities/admin/refresh, grantor_admin) returns { fetched: 0, upserted: 0, errors: [5× 'Grants.gov search failed: 403 Forbidden'] } — it cannot ingest anything until the ingestion endpoint gap (test 1) is fixed. Not a defect in the card itself."
    confidence: proven

## Gaps

- truth: "The system polls the Grants.gov Search API and upserts normalized opportunity records (SC #1); ingested opportunities are browsable/savable/importable (SC #2–5)"
  status: failed
  reason: "Ingestion calls the wrong Grants.gov endpoint and gets 403 Forbidden on every page, so zero opportunities are ever ingested. grantsGovService.ts:14 builds SEARCH_ENDPOINT = `${GRANTS_GOV_BASE}/search2/opportunities/search`, which returns HTTP 403. The correct endpoint is `${GRANTS_GOV_BASE}/search2` (POST), which returns HTTP 200 with the exact `data.oppHits` envelope the normalizer at grantsGovService.ts:76 already reads. Manual admin refresh returns {fetched:0, upserted:0, errors:[5× '403 Forbidden']}; GET /external-opportunities returns {total:0}. Every Phase 8 UAT flow (browse/save/alerts/import/versions/sync) is blocked because no external opportunity data can exist."
  severity: blocker
  test: 1
  source: self_check
  confidence: proven
  root_cause: "src/services/external/grantsGovService.ts:14 — SEARCH_ENDPOINT path is `/search2/opportunities/search` (403); should be `/search2` (200). Also verify DETAIL_ENDPOINT at line 15 (`${GRANTS_GOV_BASE}/opportunities/${id}`) resolves against the same live API."
  artifacts:
    - path: "src/services/external/grantsGovService.ts"
      issue: "SEARCH_ENDPOINT uses non-existent path /search2/opportunities/search → 403; correct path is /search2"
  missing:
    - "Change SEARCH_ENDPOINT to `${GRANTS_GOV_BASE}/search2` (verified 200 with the same request body and data.oppHits response shape)"
    - "Re-verify DETAIL_ENDPOINT against the live Grants.gov detail API and confirm a full ingest → detail round-trip"
    - "After fix: trigger admin refresh and confirm GET /external-opportunities returns items so UAT flows have data"
  debug_session: ""
