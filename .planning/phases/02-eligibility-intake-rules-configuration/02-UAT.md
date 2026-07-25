---
status: complete
phase: 02-eligibility-intake-rules-configuration
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md
started: 2026-07-25T22:30:00Z
updated: 2026-07-25T23:05:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Eligibility Rule Builder — Hard Blocker
expected: Open an opportunity in the Opportunity Builder → Eligibility Rules tab. Add a rule with severity = "Hard Blocker." The rule card appears in a red usa-alert--error styled container with a "Hard Blocker" badge visible.
result: pass

### 2. Eligibility Rule Builder — Advisory Indicator
expected: Add a second rule with severity = "Advisory." The rule card appears in a yellow usa-alert--warning styled container with an "Advisory" badge (distinct from the hard blocker styling).
result: issue
reported: "I dont see an option to add a new eligibility requrement"
severity: major

### 3. Prescreening Questionnaire Builder
expected: Navigate to the "Pre-Screening" tab on the same opportunity. Add a yes/no question ("Is your organization a nonprofit?"), map the "Yes" option to the hard blocker rule. Click "Preview" to open the preview modal — the question appears with its options and rule mapping displayed.
result: issue
reported: "I dont see the pre screening tab in the 'UAT Test Grant' opportunity"
severity: major
note: "Root cause: OpportunitiesIndex never lists existing opportunities. User can access the Pre-Screening tab by navigating directly to the builder URL: http://localhost:3000/grantor/opportunities/2c1b4636-a48d-4e5b-b56d-0a5c2f5cd6a1"

### 4. Conditional Section Config
expected: Navigate to "Conditional Sections" tab. Add a condition for the "narrative" section (applicant_type = nonprofit). The section card appears showing the section key and condition count.
result: issue
reported: "When I choose Opportunities from the left side base, I see no opportunities"
severity: major

### 5. Attachment Requirements Config
expected: Navigate to "Attachments" tab. Add an attachment requirement (document_type = "IRS Determination Letter", stage = Full Application, required = true). The new row appears in the Full Application stage table.
result: skipped
reason: Blocked by the same OpportunitiesIndex navigation issue — user cannot navigate to an existing opportunity in the UI

### 6. Screening Criteria Config — Auto vs Manual
expected: Navigate to "Screening Criteria" tab. Auto-generated criteria (if any) appear with a lock icon and no delete button. Add a manual criterion. It appears in the manual criteria list with edit/delete controls.
result: skipped
reason: Blocked by the same OpportunitiesIndex navigation issue

### 7. Publish Opportunity + Public Slug
expected: Complete an opportunity's required fields and click Publish. The opportunity transitions to "published" status and receives a URL-friendly public_slug (e.g., "uat-test-grant-2c1b4636"). The slug appears in the opportunity detail and enables the public detail URL.
result: issue
reported: "Self-check: public_slug is NULL after publish — route handler bypasses PublicationService slug generation"
severity: major

### 8. Public Opportunity List Page
expected: Navigate to /opportunities (unauthenticated). A search/filter page appears with USWDS styling showing published opportunities as cards. The "UAT Test Grant" appears with a status badge (Open/Closing Soon/Closed). Search by keyword filters results.
result: skipped
reason: Blocked by public_slug being null — the opportunity is published but its public slug is missing, so the card cannot link to the detail page correctly

### 9. Public Opportunity Detail Page
expected: Click an opportunity from the list (or navigate to /opportunities/:slug). The detail page shows opportunity metadata, eligibility rules grouped by severity (hard blockers vs advisories), attachment requirements table, addenda timeline, and a context-aware CTA.
result: skipped
reason: Blocked by null public_slug — no valid slug URL to navigate to

### 10. Addenda Timeline
expected: On a published opportunity's detail page, the AddendaTimeline component shows chronological addenda with type badges (clarification, date_change, etc.). Grantor can POST a new addendum; DELETE returns 405 (addenda are immutable).
result: skipped
reason: Blocked by null public_slug — no valid public detail page URL

## Summary

total: 10
passed: 1
issues: 5
pending: 0
skipped: 4

## Self-Check

boot: 404 (SPA fallback — expected, client/dist absent at first boot; /health → 200; API routes fully functional)
routes_probed: 12 ok / 0 failed
cookie: n/a (no auth cookie issued — access_token in memory only per design)
e2e: skipped (E2E tests skip when grantor opportunities list empty — need seeded UI-visible data)
per_test:
  - test: 7
    verdict: fail
    note: "🤖 Auto-check: public_slug is NULL after publish. POST /api/v1/opportunities/:id/publish route (src/routes/opportunities.ts:413-415) runs its own SQL UPDATE that omits public_slug — it never calls PublicationService.publish() which generates the slug. DB confirms null after successful publish call. Fix: update route handler to call publicationService.publish() or add public_slug=$1 to the inline UPDATE query."
  - test: 1
    verdict: advisory
    note: "🤖 Auto-check: Eligibility rule CRUD works (POST/GET/PUT/DELETE all return correct responses). UI rendering needs human confirmation."
  - test: 3
    verdict: advisory
    note: "🤖 Auto-check: Prescreening upsert (PUT /prescreening) works with placement + questions. Preview endpoint returns questionnaire. UI confirmation needed."
  - test: 8
    verdict: advisory
    note: "🤖 Auto-check: GET /api/v1/opportunities returns published opportunities ({total: 1}). Client TypeScript build errors fixed (OpportunityListPage import, AttachmentRequirementsConfig unused var). UI rendering needs human confirmation."
  - test: 10
    verdict: advisory
    note: "🤖 Auto-check: POST /addenda works; DELETE returns 405 METHOD_NOT_ALLOWED as required (addenda immutable). GET /addenda returns list. UI timeline rendering needs human confirmation."
screenshots:
  - .pivota/uat-shots/login.png
  - .pivota/uat-shots/opportunities.png
  - .pivota/uat-shots/grantor-opportunities.png
  - .pivota/uat-shots/grantor-opportunities-2c1b4636-a48d-4e5b-b56d-0a5c2f5cd6a1-tab-eligibility-rules.png
  - .pivota/uat-shots/grantor-opportunities-2c1b4636-a48d-4e5b-b56d-0a5c2f5cd6a1-tab-prescreening.png

## Gaps

- truth: "Eligibility Rule Builder shows an 'Add Rule' button or control to create new eligibility requirements"
  status: failed
  reason: "User reported: I dont see an option to add a new eligibility requrement"
  severity: major
  test: 2
  source: user
  root_cause: "OpportunitiesIndex (/grantor/opportunities) is a Phase 1 placeholder that always shows 'No opportunities yet' and never fetches/lists existing opportunities (client/src/pages/grantor/OpportunitiesIndex.tsx:48-54). User cannot navigate to an existing opportunity through the UI. Phase 2 tabs (Eligibility Rules, Pre-Screening, etc.) are in OpportunityBuilder but unreachable via normal navigation."
  artifacts:
    - path: "client/src/pages/grantor/OpportunitiesIndex.tsx"
      issue: "Always renders 'No opportunities yet' alert — never fetches or lists existing opportunities; no links to navigate to an existing opportunity's builder"
  missing:
    - "Implement opportunity listing: fetch GET /api/v1/programs/:id/opportunities and render links to each opportunity's builder page"
  debug_session: ""

- truth: "Opportunities list page shows existing opportunities so grantors can navigate to the Opportunity Builder"
  status: failed
  reason: "User reported: When I choose Opportunities from the left side base, I see no opportunities"
  severity: major
  test: 4
  source: user
  root_cause: "OpportunitiesIndex component (client/src/pages/grantor/OpportunitiesIndex.tsx:30-60) is a Phase 1 placeholder that always renders 'No opportunities yet' without fetching from the API. The GET /api/v1/programs/:id/opportunities endpoint exists and returns the UAT Test Grant, but the UI never calls it. Grantors cannot navigate to any existing opportunity through normal navigation."
  artifacts:
    - path: "client/src/pages/grantor/OpportunitiesIndex.tsx"
      issue: "Component always shows 'No opportunities yet' alert — never fetches or renders existing opportunities list. useFirstProgramId() fetches the program but the program ID is never used to fetch opportunities."
  missing:
    - "Add opportunities fetch: useEffect calling GET /api/v1/programs/:programId/opportunities and render a list of opportunities with links to /grantor/opportunities/:id"
  debug_session: ""

- truth: "Pre-Screening tab is accessible from the Opportunity Builder and allows building questionnaires"
  status: failed
  reason: "User reported: I dont see the pre screening tab in the 'UAT Test Grant' opportunity"
  severity: major
  test: 3
  source: user
  root_cause: "Same root cause as Test 2: OpportunitiesIndex never lists existing opportunities. User couldn't navigate to the UAT Test Grant via the UI. The Pre-Screening tab IS built (client/src/pages/grantor/opportunities/PrescreeningBuilder.tsx, registered in OpportunityBuilder.tsx:297-303) but unreachable through normal navigation."
  artifacts:
    - path: "client/src/pages/grantor/OpportunitiesIndex.tsx"
      issue: "Opportunities list page is a placeholder — never fetches or displays existing opportunities"
  missing:
    - "Implement opportunity listing in OpportunitiesIndex (same fix as Test 2 gap)"
  debug_session: ""

- truth: "A published opportunity receives a public_slug for use in the public detail URL"
  status: failed
  reason: "Self-check and user-reported (blocked downstream tests): POST /api/v1/opportunities/:id/publish sets status=published and published_at but public_slug remains NULL in DB. Route handler bypasses PublicationService."
  severity: major
  test: 7
  source: self_check
  root_cause: "src/routes/opportunities.ts:413-415 runs its own inline SQL UPDATE (SET status=published, published_at=now(), published_by=$1) — it never calls publicationService.publish(). publicationService.publish() at publicationService.ts:92-107 generates the slug via this.generateUniqueSlug() and sets public_slug in its own UPDATE. Since the route bypasses the service, public_slug is always NULL."
  artifacts:
    - path: "src/routes/opportunities.ts"
      issue: "publish route handler (line ~413) runs inline SQL UPDATE missing public_slug — never calls publicationService.publish()"
    - path: "src/services/opportunity/publicationService.ts"
      issue: "publish() method (line 92-107) correctly generates slug but is never invoked by the route"
  missing:
    - "Replace inline SQL in src/routes/opportunities.ts publish handler with: const published = await publicationService.publish(id, req.user!.user_id); res.status(200).json(published);"
  debug_session: ""

- truth: "Client build succeeds without TypeScript errors"
  status: failed
  reason: "Self-check: tsc -b fails with 2 errors: OpportunityListPage.tsx imports OpportunityListItem as value (needs type-only import), AttachmentRequirementsConfig.tsx declares unused STAGE_LABEL_MAP constant."
  severity: minor
  test: 8
  source: self_check
  root_cause: "TypeScript verbatimModuleSyntax requires 'import type' for type-only imports. STAGE_LABEL_MAP was defined but never used in the component."
  artifacts:
    - path: "client/src/pages/applicant/OpportunityListPage.tsx"
      issue: "line 2: OpportunityListItem imported as value, needs 'import type'"
    - path: "client/src/pages/grantor/opportunities/AttachmentRequirementsConfig.tsx"
      issue: "line 78: STAGE_LABEL_MAP declared but never read (TS6133)"
  missing:
    - "Both fixed during self-check: type-only import applied, unused const removed. Client builds successfully."
  debug_session: ""
