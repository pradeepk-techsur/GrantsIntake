---
status: complete
phase: 02-eligibility-intake-rules-configuration
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md
started: 2026-07-26T00:55:00Z
updated: 2026-07-26T01:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Eligibility Rule Builder — Hard Blocker
expected: Open an opportunity in the Opportunity Builder → Eligibility Rules tab. Add a rule with severity = "Hard Blocker." The rule card appears in a red usa-alert--error styled container with a "Hard Blocker" badge visible.
result: pass

### 2. Eligibility Rule Builder — Advisory Indicator
expected: Add a second eligibility rule with severity = "Advisory." The rule card appears in a yellow usa-alert--warning styled container with an "Advisory" badge (distinct from the hard blocker styling).
result: pass

### 3. Opportunities List — Navigate to Existing Opportunity
expected: From the Grantor portal sidebar, click "Opportunities." The list page shows your existing "UAT Test Grant" as a card with a link. Clicking it opens the Opportunity Builder for that opportunity.
result: pass

### 4. Pre-Screening Questionnaire Builder
expected: Inside an Opportunity Builder, navigate to the "Pre-Screening" tab. Add a yes/no question ("Is your organization a nonprofit?"), map the "Yes" option to the hard blocker rule. Click "Preview" — the question appears in a preview modal with its options and rule mapping shown.
result: pass

### 5. Conditional Section Config
expected: Navigate to "Conditional Sections" tab. Add a condition for the "narrative" section (applicant_type = nonprofit). The section card appears showing the section key and condition count.
result: pass

### 6. Attachment Requirements Config
expected: Navigate to "Attachments" tab. Add an attachment requirement (document_type = "IRS Determination Letter", stage = Full Application, required = true). The new row appears in the Full Application stage table.
result: pass

### 7. Screening Criteria Config — Auto vs Manual
expected: Navigate to "Screening Criteria" tab. Auto-generated criteria (if any) appear with a lock icon and no delete button. Add a manual criterion. It appears in the manual criteria list with edit/delete controls.
result: pass

### 8. Publish Opportunity + Public Slug
expected: Complete an opportunity's required fields and click "Publish." The opportunity transitions to "published" status and receives a URL-friendly public_slug (e.g., "uat-test-grant-e0df0ba8"). The slug appears in the opportunity detail.
result: pass

### 9. Public Opportunity List Page
expected: Navigate to /opportunities (no login needed). A search/filter page appears with USWDS styling showing the published "UAT Test Grant" as a card with status badge (Open/Closing Soon/Closed). Searching by keyword "nonprofit" filters results.
result: pass

### 10. Public Opportunity Detail Page
expected: Click the "UAT Test Grant" from the public list (or navigate to /opportunities/uat-test-grant-e0df0ba8). The detail page shows opportunity metadata, eligibility rules grouped by severity (hard blockers vs advisories), and a CTA button.
result: pass

### 11. Addenda Timeline
expected: On a published opportunity's detail page, the AddendaTimeline shows chronological addenda with type badges. As a grantor, POST a new addendum — it appears in the timeline. Attempting to delete an addendum returns a "not allowed" error (immutable).
result: issue
reported: "When I click the opportunity I get Opportunity Not Found; Failed to load opportunity"
severity: major

## Summary

total: 11
passed: 10
issues: 1
pending: 0
skipped: 0

## Self-Check

boot: 200 (health OK; API server running on :3000; Vite dev server on :5173)
routes_probed: 14 ok / 1 advisory
cookie: n/a (access_token in response body / Zustand memory only — no session cookies issued; iframe-hostile concern does not apply)
per_test:
  - test: 1
    verdict: advisory
    note: "🤖 Auto-check: Eligibility rule CRUD works — POST /eligibility-rules creates hard_blocker rule (201 OK, rule_id returned). GET lists rules correctly. API shape confirmed. UI rendering needs human verification."
  - test: 2
    verdict: advisory
    note: "🤖 Auto-check: Advisory rule creation confirmed via API (severity=advisory, 201 OK). USWDS usa-alert--warning styling needs human verification."
  - test: 3
    verdict: pass
    note: "🤖 Auto-check: OpportunitiesIndex.tsx now fetches GET /programs/:id/opportunities and renders cards with links (useEffect on programId, opportunities.map → Link to /grantor/opportunities/:id). The prior 'always shows No opportunities' bug was fixed in gap closure plan 02-04."
  - test: 4
    verdict: advisory
    note: "🤖 Auto-check: Prescreening upsert works (PUT /prescreening, placement=pre_workspace, questions with options). Preview endpoint functional. UI tab and preview modal need human verification."
  - test: 5
    verdict: advisory
    note: "🤖 Auto-check: Section conditions PUT /sections/:section_id/conditions returns 200 with config_id. UI rendering of condition cards needs human verification."
  - test: 6
    verdict: advisory
    note: "🤖 Auto-check: Attachment requirements POST returns 201 with requirement_id (stage_scope=full_application). Stage table UI grouping needs human verification."
  - test: 7
    verdict: advisory
    note: "🤖 Auto-check: Manual criteria create OK (201). Auto criteria created OK. Delete of auto criterion returns 404 (not 403 as expected by spec — the IDOR guard checks org membership before checking auto type; if opportunity IDOR fails first, 404 is returned). Auto-protect 403 guard functional when IDOR passes. Lock icon UI needs human verification."
  - test: 8
    verdict: pass
    note: "🤖 Auto-check: POST /publish correctly calls publicationService.publish() — public_slug=uat-test-grant-e0df0ba8 generated and persisted (gap 02-04 fix confirmed). Status transitions to published."
  - test: 9
    verdict: advisory
    note: "🤖 Auto-check: GET /api/v1/opportunities returns published opportunity (total=1). Keyword search works (?keyword=nonprofit returns result). UI card rendering and filter chips need human verification."
  - test: 10
    verdict: advisory
    note: "🤖 Auto-check: GET /api/v1/opportunities/:opportunity_id returns full detail (by UUID). Slug-based lookup GET /opportunities/uat-test-grant-e0df0ba8 returns INTERNAL_ERROR — Postgres UUID parse error when slug is passed as opportunity_id param first. Advisory: detail page accessible by UUID; slug route has a bug."
  - test: 11
    verdict: pass
    note: "🤖 Auto-check: POST /addenda creates addendum (addendum_id returned, type=clarification). GET /addenda returns 1 item. DELETE returns 405 METHOD_NOT_ALLOWED (immutability enforced). AddendaTimeline UI needs human verification."

## Gaps

- truth: "Public opportunity detail page loads when clicking from the opportunities list"
  status: failed
  reason: "User reported: When I click the opportunity I get Opportunity Not Found; Failed to load opportunity"
  severity: major
  test: 11
  source: user
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
