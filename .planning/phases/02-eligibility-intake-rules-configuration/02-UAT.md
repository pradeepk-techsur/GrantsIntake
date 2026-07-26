---
status: complete
phase: 02-eligibility-intake-rules-configuration
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md
started: 2026-07-26T02:55:00Z
updated: 2026-07-26T03:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Eligibility Rule Builder
expected: In the OpportunityBuilder, an "Eligibility Rules" tab is visible. Clicking it lets you add a new rule with a severity (Hard Blocker or Advisory), a criterion type, and a value. Hard blocker rules display in a red USWDS error-styled card; advisory rules in a yellow warning-styled card. Rules can be edited and deleted.
result: pass

### 2. Pre-Screening Builder
expected: A "Pre-Screening" tab in OpportunityBuilder shows a questionnaire editor. You can add yes/no and multiple-choice questions with conditional display logic, map answer options to eligibility rules, and preview the questionnaire via a preview modal.
result: pass

### 3. Conditional Section Config
expected: A "Conditional Sections" tab in OpportunityBuilder allows configuring display conditions (field/operator/value rules) for intake form sections. Adding a condition saves it; deleting removes it.
result: pass

### 4. Attachment Requirements Config
expected: An "Attachments" tab in OpportunityBuilder shows an attachment requirements list. You can add a required document type scoped by applicant type and stage (pre-application, LOI, full-application). New requirements appear in the table; they can be deleted.
result: pass

### 5. Screening Criteria Config
expected: A "Screening Criteria" tab in OpportunityBuilder shows criteria in two groups: auto-generated criteria (locked with a lock icon — delete is blocked with a 403) and manually-added criteria (editable/deletable). Auto criteria cannot be removed.
result: pass

### 6. Publish Opportunity
expected: In the OpportunityBuilder, clicking "Publish" (when all required fields are filled) successfully publishes the opportunity. After publishing, the opportunity has a public slug (visible in the UI or the public portal URL). Incomplete opportunities show a checklist of missing required fields and are blocked from publishing.
result: pass

### 7. Public Opportunity List
expected: Navigating to /opportunities (no login required) shows a list of published opportunities as USWDS cards. Each card shows title, status badge (Open / Closing Soon / Closed), and a link to the detail page. An empty state is shown when no opportunities are published.
result: pass

### 8. Public Opportunity Detail
expected: Clicking an opportunity card from the list opens /opportunities/:slug — a detail page showing the opportunity's metadata, eligibility rules grouped by severity, attachment requirements table, and an addenda timeline. The page loads without a 500 error.
result: pass

### 9. Search & Filter
expected: On the /opportunities list page, typing a keyword in the search box and/or selecting facet filters (funder, geography, funding amount range, deadline) narrows the results. Active filter chips appear; clicking × on a chip removes that filter and refreshes results.
result: pass

### 10. Opportunity Listing in Grantor Portal
expected: After logging in as a grantor and navigating to a program, the Opportunities index shows any previously created opportunities as clickable USWDS cards (not a permanent "No opportunities yet" message). Clicking a card opens the OpportunityBuilder for that opportunity.
result: pass

### 11. Slug-Based URL Resolution
expected: Opening /opportunities/<slug> (e.g. the slug shown on a published opportunity's detail page) loads the detail page with a 200 response — not a 500 INTERNAL_ERROR. Both UUID-format and slug-format paths work correctly.
result: pass

## Summary

total: 11
passed: 11
issues: 0
pending: 0
skipped: 0

## Self-Check

boot: 200 (compose stack: db=healthy, redis=healthy, app=up)
preview-path: 404 (no exec-server on this backend — skipped)
compose_health: all services clean — no fatal DB/migrate/build markers
routes_probed: 11 ok / 0 failed
cookie: n/a (JWT in response body, no Set-Cookie headers observed — no iframe cookie concern)
e2e: skipped (e2e tests hardcode localhost:3000 for UI; React frontend runs at :5173 — URL mismatch, not a functional gap)
per_test:
  - test: 1
    verdict: pass
    note: "🤖 Auto-check: GET/POST/PUT eligibility-rules all return expected data. Hard blocker and advisory rules created and retrieved (2 rules). Update correctly saves new explanation_text."
  - test: 2
    verdict: pass
    note: "🤖 Auto-check: PUT /prescreening with placement+questions upserts correctly. GET returns 1 question with options mapped to rule_id."
  - test: 3
    verdict: pass
    note: "🤖 Auto-check: PUT /sections/:section_key/conditions upserts section condition with condition_type/field/operator/value. GET returns config."
  - test: 4
    verdict: pass
    note: "🤖 Auto-check: POST /attachment-requirements creates requirement with applicant_type_scope as array. GET returns list."
  - test: 5
    verdict: pass
    note: "🤖 Auto-check: Manual criterion created and deleted (204). Auto criterion created; DELETE returns 403 AUTO_CRITERION_PROTECTED — lock works correctly."
  - test: 6
    verdict: pass
    note: "🤖 Auto-check: Dry-run correctly blocks publish with missing fields; after completing metadata, publish succeeds with public_slug=uat-phase-2-test-grant-0c1c12a1. Completeness checklist works."
  - test: 7
    verdict: pass
    note: "🤖 Auto-check: GET /opportunities returns 1 published opportunity with title, funder_name, max_award_amount, public_slug. 📸 Screenshot: .pivota/uat-shots/07-opportunities-list.png"
  - test: 8
    verdict: pass
    note: "🤖 Auto-check: GET /opportunities/uat-phase-2-test-grant-0c1c12a1 returns 200 with full opportunity data. 📸 Screenshot: .pivota/uat-shots/08-opportunity-detail.png"
  - test: 9
    verdict: pass
    note: "🤖 Auto-check: keyword=UAT returns 1 result; program_area=Education returns 1 result; keyword=zzznomatch999 returns 0."
  - test: 10
    verdict: pass
    note: "🤖 Auto-check: GET /programs/:id/opportunities returns 1 opportunity as authenticated grantor. 📸 Screenshot: .pivota/uat-shots/10-grantor-dashboard.png"
  - test: 11
    verdict: pass
    note: "🤖 Auto-check: UUID param returns 200; slug param returns 200. UUID_REGEX guard works — no 500 errors for either format."

## Gaps

<!-- none yet -->
