---
status: complete
phase: 08-enhancements-grantsgov-ingestion
source: [08-07-SUMMARY.md]
started: 2026-09-02T14:03:45Z
updated: 2026-09-02T14:24:23Z
---

## Current Test

[testing complete]

## Tests

### 5. Import Grants.gov Opportunity into Workspace
expected: Confirming the import modal redirects to /applicant/applications where a success banner shows AND the imported opportunity is listed with an "Imported from Grants.gov" badge; re-importing does not create a duplicate.
result: pass

## Summary

total: 1
passed: 1
issues: 0
pending: 0
skipped: 0

## Self-Check

boot: 200 (frontend :5173 up; backend :3000 /health 200; db + redis healthy; no fatal markers in compose/dev logs)
data: seeded 125 preconditions | ran the app's own ingestion (ingestionScheduler.refreshAll) against the live Grants.gov API + compose DB — 125 external_opportunities upserted (fetched:125/upserted:125/failed:0). External-opportunity data has no other source (data-doctor cannot seed it), so populating it means running ingestion, which is proven working end-to-end.
routes_probed: 5 ok / 0 failed
cookie: n/a
browser_urls: none
repairs:
  - kind: data
    what: "Ran ingestionScheduler.refreshAll() to populate 125 external_opportunities (test 5 import precondition). No source files changed; HEAD unchanged."
    resolution: reconciled by replay
per_test:
  - test: 5
    verdict: pass
    note: "🤖 Auto-check (round-2 re-verify of the 08-07 gap fix): drove the full import flow authenticated as applicant@example.com. POST /external-opportunities/:id/import → 201 (created); re-import same opp → 200 already_imported:true; NEW GET /external-opportunities/imported → 200 returns the imported opp (source=grants_gov_import) and count stays 1 after re-import (no duplicate); unauth GET /imported → 401. Frontend wiring confirmed: WorkspaceListPage reads location.state.importedFromGrantsGov (banner) + queries ['imported-opportunities'] and renders the reused gf-badge--info 'Imported from Grants.gov' badge; detail page navigates with that state + invalidates the query. The round-1 gap (redirect destination showed nothing) is closed at the API + wiring level. Visual banner/badge render is for the human to confirm."
    confidence: proven

## Gaps

[none — round-2 re-verify of the 08-07 gap fix; Test 5 now passes]
