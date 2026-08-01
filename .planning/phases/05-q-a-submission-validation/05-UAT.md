---
status: complete
phase: 05-q-a-submission-validation
source: 05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md, 05-05-SUMMARY.md, 05-06-SUMMARY.md, 05-07-SUMMARY.md, 05-08-SUMMARY.md
started: 2026-08-01T02:21:45Z
updated: 2026-08-01T02:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Applicant Submits a Q&A Question
expected: On the opportunity detail page, scroll to the Q&A section (or click the "Q&A" jump link). Click "Submit a Question." This navigates to /applicant/opportunities/:id/qa. Type a question and submit. The question appears in a "Your Submitted Questions" section with an "Awaiting Answer" badge.
result: pass

### 2. Grantor Publishes a Q&A Answer (Navigation Fix — gap from prior UAT)
expected: Logged in as grantor (admin@example.gov / TestPassword123!), the left sidebar now shows "Q&A Management" (not "Q&A Inbox"). Each opportunity card in the Opportunities list now has a direct "Manage Q&A" link. Clicking it opens the Q&A management page showing submitted questions. The grantor can type an answer and click Publish. The published answer becomes visible on the public opportunity detail page Q&A section.
result: issue
reported: "Q&A Management page loads but shows no questions"
severity: major

### 3. Continuous Validation Shows Blocking Errors
expected: In a workspace, click into a required text field in any section (e.g. narrative) and immediately click away without entering anything. Within ~1 second a red USWDS validation banner appears identifying the field as a blocking error. The ReadinessDashboard panel shows a non-zero blocking count, and the Submit Application button is aria-disabled.
result: pass

### 4. Authorized Representative Certification
expected: Logged in as applicant@example.com (who has authorized_representative role), navigate to a workspace and click "Certifications" in the left sidebar. A Certification panel appears with legal certification text, a certification checkbox, and a "Submit Certification" button. Checking the box enables the button. Clicking it records the certification.
result: pass

### 5. Submit Application (Full Flow)
expected: After filling all workspace sections (org profile, eligibility, narrative, workplan, performance measures, review/submit — budget and attachments are auto-satisfied), the ReadinessDashboard shows 100% and the Submit Application button becomes active. Clicking it navigates to CertifySubmitPage showing a pre-submission checklist. Confirming submits and navigates to a SubmissionReceiptPage with a GI-YYYY-XXXXXXXX confirmation number.
result: pass

### 6. Post-Submission Workspace is Locked
expected: After successful submission (Test 5), returning to the workspace shows a yellow/info locked-state banner with a link to the receipt. No section fields can be edited — the workspace is fully read-only.
result: issue
reported: "Locked banner appears but fields are still editable"
severity: major

### 7. Submission Receipt Page
expected: The SubmissionReceiptPage displays the unique confirmation number (format GI-YYYY-NNNNNNNN), submission timestamp (UTC), applicant and opportunity details, and links for human-readable and machine-readable download. The page is accessible from both the workspace locked banner and directly via the receipt URL.
result: pass

## Summary

total: 7
passed: 5
issues: 2
pending: 0
skipped: 0

## Self-Check

boot: 404 (API :3000 running — 404 expected on GET /, no root handler; :5173 frontend responding 200)
preview-path: 200 (frontend :5173 via :7777/preview/5173)
routes_probed: 8 ok / 0 failed
cookie: n/a (access token in Zustand memory; no iframe-hostile cookie)
e2e: workspaceSubmission.spec.ts 6/6 pass; qa.spec.ts 4/5 pass (1 test locator strictness advisory — "text=Q&A Management" resolves to 2 elements: sidebar link + h1, not a functional failure)
per_test:
  - test: 1
    verdict: pass (advisory)
    note: "🤖 Auto-check: POST /opportunities/:id/questions → 201 ✓. GET /my-questions returns question ✓. qa_config.enabled=true on UAT-OPP-001 ✓. 🔑 Test data: Login applicant@example.com / TestPass123! → /opportunities/0cb8c7dd-2859-4d3f-8015-b02b1c5b0bf4"
  - test: 2
    verdict: pass (advisory)
    note: "🤖 Auto-check: 05-08 gap fix confirmed in source — sidebar label changed to 'Q&A Management' ✓; OpportunitiesIndex has 'Manage Q&A' aria-label per opportunity card ✓; OpportunityBuilder page has 'Opportunity Builder' subtitle label ✓. PUT /questions/:id/answer → 200 ✓. 🔑 Test data: Login admin@example.gov / TestPassword123! → Opportunities list → find UAT Community Health Innovation Grant → click Manage Q&A link"
  - test: 3
    verdict: pass (advisory)
    note: "🤖 Auto-check: POST /workspaces/:id/validate returns correct 3-tier structure ✓. workspaceSubmission.spec.ts 6/6 pass ✓. 🔑 Test data: Login applicant@example.com / TestPass123! → workspace → Narrative section → click into field, click away"
  - test: 4
    verdict: pass (advisory)
    note: "🤖 Auto-check: applicant@example.com has authorized_representative + proposal_lead roles in UAT Test Nonprofit ✓. useIsAuthorizedRep accepts orgId as prop (05-07 fix) ✓. 🔑 Test data: Login applicant@example.com / TestPass123! → workspace → Certifications sidebar"
  - test: 5
    verdict: advisory
    note: "🤖 Auto-check: Workspace at 11% completion (attachments auto-done per 05-07 fix). All 8 remaining sections have seeded form_field_definitions. certify() marks certifications complete. 📸 Screenshot: .pivota/uat-shots/1-opportunity-detail.png. 🔑 Test data: Login applicant@example.com / TestPass123! → fill fields in each section → Certifications → Submit"
  - test: 6
    verdict: skipped (needs human)
    note: "🤖 Auto-check: Submission E2E locked-banner test passes ✓. Depends on Test 5."
  - test: 7
    verdict: pass (advisory)
    note: "🤖 Auto-check: SubmissionReceiptPage E2E tests pass (GI-YYYY-NNNNNNNN format verified) ✓. Depends on Test 5."

## Gaps

- truth: "Grantor opens Q&A Management page and sees submitted questions from applicants"
  status: failed
  reason: "User reported: Q&A Management page loads but shows no questions"
  severity: major
  test: 2
  source: user
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "After submission, workspace form fields become read-only (not editable)"
  status: failed
  reason: "User reported: Locked banner appears but fields are still editable"
  severity: major
  test: 6
  source: user
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

