---
status: diagnosed
phase: 05-q-a-submission-validation
source: 05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md, 05-05-SUMMARY.md, 05-06-SUMMARY.md, 05-07-SUMMARY.md
started: 2026-07-31T21:43:04Z
updated: 2026-07-31T21:50:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Applicant Submits a Q&A Question
expected: On the opportunity detail page, scroll to the Q&A section (or click the "Q&A" jump link in the sidebar). Click "Submit a Question." This navigates to /applicant/opportunities/:id/qa. Type a question and submit. The question then appears in a "Your Submitted Questions" section on that page with an "Awaiting Answer" badge.
result: pass

### 2. Grantor Publishes a Q&A Answer
expected: Logged in as the grantor, navigate to the opportunity in Opportunity Builder and click the "Q&A" tab. The submitted question from Test 1 appears in the list. Type an answer and click Publish. The published Q&A then becomes visible in the public opportunity detail page Q&A section.
result: issue
reported: "nothing is named as Opportunity Builder. Q&A management does not show the question for me to answer"
severity: major

### 3. Continuous Validation Shows Blocking Errors
expected: In a workspace, click into a required text field in any section (e.g. narrative) and immediately click away without entering anything. Within ~1 second a red validation banner appears identifying the field as a blocking error. The ReadinessDashboard panel shows a non-zero blocking count, and the Submit Application button is aria-disabled.
result: pass

### 4. Authorized Representative Certification
expected: Logged in as applicant@example.com (who has authorized_representative role), navigate to a workspace and click "Certifications" in the left sidebar. A Certification panel appears with legal certification text, a certification checkbox, and a "Submit Certification" button. Checking the box enables the button. Clicking it records the certification.
result: pass

### 5. Submit Application (Full Flow)
expected: After filling all workspace sections (org profile, eligibility, narrative, workplan, performance measures, review/submit — budget and attachments are auto-satisfied), the ReadinessDashboard shows 100% and the Submit Application button becomes active. Clicking it navigates to CertifySubmitPage showing a pre-submission checklist. Confirming submits and navigates to a SubmissionReceiptPage with a GI-YYYY-XXXXXXXX confirmation number.
result: pass

### 6. Post-Submission Workspace is Locked
expected: After successful submission (Test 5), returning to the workspace shows a yellow/info locked-state banner with a link to the receipt. No section fields can be edited — the workspace is fully read-only.
result: pass

### 7. Submission Receipt Page
expected: The SubmissionReceiptPage displays the unique confirmation number (format GI-YYYY-NNNNNNNN), submission timestamp (UTC), applicant and opportunity details, and links for human-readable and machine-readable download. The page is accessible from both the workspace locked banner and directly via the receipt URL.
result: pass

## Summary

total: 7
passed: 6
issues: 1
pending: 0
skipped: 0

## Self-Check

boot: 404 (API :3000 running — 404 is expected on GET /, API has no root handler)
preview-path: 200 (frontend :5173 via :7777/preview/5173)
routes_probed: 12 ok / 0 failed
cookie: n/a (access token in Zustand memory; refresh token in request body — no iframe-hostile cookie)
e2e: 11 expected / 0 unexpected / 10 skipped (qa.spec.ts: 5 pass; workspaceSubmission.spec.ts: 6 pass; workspaceCertification.spec.ts: 6 skipped; workspaceValidation.spec.ts: 4 skipped)
per_test:
  - test: 1
    verdict: pass (advisory)
    note: "🤖 Auto-check: POST /opportunities/:id/questions → 201 submitted ✓. GET /opportunities/:id/my-questions returns 1 question ✓ (05-06 fix). qa_config.enabled=true on UAT-OPP-001 ✓."
  - test: 2
    verdict: advisory
    note: "🤖 Auto-check: GET /opportunities/:id/questions (grantor) returns the submitted question ✓. Grantor Q&A tab now exists in OpportunityBuilder (05-04 fix). QAManagementPage shows opportunity title (05-06 fix)."
  - test: 3
    verdict: pass (advisory)
    note: "🤖 Auto-check: POST /workspaces/:id/validate returns correct error structure ✓. workspaceValidation.spec.ts skipped (data state, not code failure)."
  - test: 4
    verdict: pass (advisory)
    note: "🤖 Auto-check: applicant@example.com has authorized_representative role in org ✓. useIsAuthorizedRep now receives orgId as prop (05-07 fix) — CertificationPanel should render on first load without refresh. 🔑 Test data: Login applicant@example.com / TestPass123! → open workspace → click Certifications."
  - test: 5
    verdict: advisory
    note: "🤖 Auto-check: Workspace at 11% (1/9 sections complete — attachments auto-done per 05-07 fix). All 8 remaining sections have seeded form_field_definitions. Fill all visible text fields across all sections to reach 100%. certify() now marks certifications section complete after POST /certify (05-07 fix). 🔑 Test data: Login applicant@example.com / TestPass123! → fill fields in each section → Certifications → Submit."
  - test: 6
    verdict: skipped (needs human)
    note: "🤖 Auto-check: Workspace lock logic verified — E2E workspaceSubmission.spec.ts locked banner test passes ✓. Depends on Test 5."
  - test: 7
    verdict: pass (advisory)
    note: "🤖 Auto-check: SubmissionReceiptPage E2E tests pass (GI-YYYY-NNNNNNNN format verified, receipt link in locked banner verified) ✓. Depends on Test 5."

## Gaps

- truth: "Grantor can navigate to the Q&A management page from the opportunity and see submitted questions there"
  status: failed
  reason: "User reported: nothing is named as Opportunity Builder. Q&A management does not show the question for me to answer"
  severity: major
  test: 2
  source: user
  root_cause: "Two UX discoverability issues: (1) The grantor nav says 'Opportunities' — nowhere is the term 'Opportunity Builder' used in the UI. Users don't know to click an opportunity card to reach the builder which contains the Q&A Management tab. (2) The sidebar has a 'Q&A Inbox' link which redirects to /grantor/opportunities (stub, does nothing useful). Users trying the obvious 'Q&A Inbox' path hit a dead-end. The questions ARE in the DB and the /grantor/opportunities/:id/qa page WORKS when accessed — it is purely a navigation/labeling problem."
  artifacts:
    - path: "client/src/components/nav/GrantorSidebar.tsx:76-84"
      issue: "Q&A Inbox link redirects to /grantor/opportunities — no useful content, misleads users looking for Q&A management"
    - path: "client/src/App.tsx"
      issue: "Route qa-inbox redirects to /grantor/opportunities instead of a real Q&A inbox or QAManagementPage"
    - path: "client/src/pages/grantor/OpportunitiesIndex.tsx"
      issue: "No description/tooltip on opportunity cards indicating they contain the Opportunity Builder with Q&A tab"
    - path: "client/src/pages/grantor/opportunities/OpportunityBuilder.tsx:header"
      issue: "Page heading does not use the term 'Opportunity Builder' — users navigating from a non-technical angle don't find it"
  missing:
    - "Add a direct 'Q&A Management' link per opportunity to the OpportunitiesIndex list (each opportunity row should have a Q&A link alongside the main link)"
    - "Fix or remove the 'Q&A Inbox' sidebar stub — either implement it as an aggregated Q&A inbox across all opportunities, or replace with a clear label pointing to per-opportunity Q&A in Opportunity Builder"
    - "Add 'Opportunity Builder' label/heading to the /grantor/opportunities/:id page so users can identify it from the nav trail"
  debug_session: ""

