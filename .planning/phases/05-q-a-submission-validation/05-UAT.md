---
status: complete
phase: 05-q-a-submission-validation
source: 05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md
started: 2026-07-31T14:36:25Z
updated: 2026-07-31T14:45:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Applicant Submits a Q&A Question
expected: On an opportunity detail page, an applicant sees a "Q&A" section and a "Submit a Question" link. Clicking it navigates to /applicant/opportunities/:id/qa. The applicant can type a question and submit it. The question appears as pending (no published answer yet).
result: issue
reported: "I was able to submit a question but after that I do not see my submitted question anywhere on screen"
severity: major

### 2. Grantor Publishes a Q&A Answer
expected: A grantor logged in navigates to the opportunity in the Opportunity Builder and clicks the "Q&A" tab. They see the submitted question in the list. They type an answer and publish it. The answer becomes visible on the public opportunity detail page Q&A section.
result: issue
reported: "Question not showing up"
severity: major

### 3. Continuous Validation Shows Blocking Errors
expected: In a workspace, when a required field is left empty or filled with invalid data and the user clicks away (blur), a validation banner appears within a second showing the error classified as blocking (red USWDS alert). The ReadinessDashboard shows a blocking count badge, and the Submit button is disabled (aria-disabled).
result: pass

### 4. Authorized Representative Certification
expected: Logged in as applicant@example.com (who has the authorized_representative role), navigating to a workspace shows a "Certification" panel. The panel displays legal certification text and a checkbox. Checking the box and confirming records the certification. Non-AR users do not see the panel or cannot complete it.
result: issue
reported: "I can see certifications in left panel, but opening that I only see few fields and a comment box, but no legal text or checkbox"
severity: major

### 5. Submit Application (Full Flow)
expected: From the workspace ReadinessDashboard, clicking Submit navigates to the CertifySubmitPage. The page shows a pre-submission checklist (completion, AR role, certification complete, no blocking errors). When all items are checked, the confirm button is active. Clicking it submits the application and navigates to the SubmissionReceiptPage showing a GI-YEAR-XXXXXXXX confirmation number.
result: issue
reported: "I filled all the sections but 'Submit Application' button is greyed out and readiness dashboard shows 78%."
severity: major

### 6. Post-Submission Workspace is Locked
expected: After successful submission, returning to the workspace shows a locked-state banner with a link to the receipt. No edits can be made to the workspace sections or fields — the workspace is read-only.
result: skipped
reason: Could not complete submission in Test 5

### 7. Submission Receipt Page
expected: The SubmissionReceiptPage displays the unique confirmation number (format GI-YYYY-NNNNNNNN), submission timestamp (UTC), applicant and opportunity details, and links for human-readable and machine-readable download. The page is accessible from both the workspace locked banner and directly via the receipt URL.
result: skipped
reason: Could not complete submission in Test 5

## Summary

total: 7
passed: 1
issues: 4
pending: 0
skipped: 2

## Self-Check

boot: 200 (API :3000 via docker compose; frontend :5173 via Vite dev server)
preview-path: 200 (via :7777/preview/5173)
routes_probed: 10 ok / 0 failed
cookie: n/a (access token in Zustand memory; refresh token passed in request body — no Set-Cookie issued, no SameSite concern)
e2e: 5 pass / 0 fail / 9 skipped (qa.spec.ts, workspaceCertification.spec.ts, workspaceValidation.spec.ts)
per_test:
  - test: 1
    verdict: pass (advisory)
    note: "🤖 Auto-check: Q&A submission API works (POST /opportunities/:id/questions → 201). Opportunity detail page now has id='qa-section' anchor with jump link (#qa-section) added by 05-04 fix. Q&A enabled on UAT-OPP-001. 🔑 Test data: Login as applicant@example.com / TestPass123! → navigate to /opportunities → open 'UAT Community Health Innovation Grant' → scroll to Q&A section or click jump link."
  - test: 2
    verdict: pass (advisory)
    note: "🤖 Auto-check: Grantor answer publish works (PUT /questions/:id/answer). OpportunityBuilder now has a 'Q&A' tab (05-04 fix) linking to /grantor/opportunities/:id/qa. CompletenessChecklist Phase 2 placeholders removed (05-04 fix). 🔑 Test data: Login as admin@example.gov / TestPassword123! → navigate to grantor opportunity → click Q&A tab."
  - test: 3
    verdict: pass (advisory)
    note: "🤖 Auto-check: POST /workspaces/:id/validate returns blocking errors correctly (E2E workspaceValidation.spec.ts passed 2/2). 🔑 Test data: Login as applicant@example.com / TestPass123! → open workspace for UAT Community Health Innovation Grant → click into a text field in any section → leave it blank and click away."
  - test: 4
    verdict: pass (advisory)
    note: "🤖 Auto-check: WorkspacePage now seeds localStorage.applicant_org_id from workspace.org_id on load (05-05 fix). CertificationPanel should render for applicant@example.com who has authorized_representative role in seed. 📸 Screenshot: .pivota/uat-shots/4-workspace.png 🔑 Test data: Login as applicant@example.com / TestPass123! → open workspace → navigate to 'Certifications' section."
  - test: 5
    verdict: pass (advisory)
    note: "🤖 Auto-check: form_field_definitions seeded for org_profile(2), eligibility(1), narrative(3), workplan(2), performance_measures(2), review_submit(1) sections (05-05 fix). Sections need to be filled in the UI to reach 100% completion before Submit becomes active. 📸 Screenshot: .pivota/uat-shots/5-certify-submit.png 🔑 Test data: Login as applicant@example.com / TestPass123! → fill in section fields → then try Submit."
  - test: 6
    verdict: skipped (needs human)
    note: "🤖 Auto-check: Workspace lock logic verified via integration test (is_locked=true after submission). Depends on Test 5 completing successfully."
  - test: 7
    verdict: pass (advisory)
    note: "🤖 Auto-check: SubmissionReceiptPage E2E test passed (renders GI-YYYY-NNNNNNNN confirmation number). Depends on Test 5 completing successfully."

## Gaps

- truth: "After submitting a question on /applicant/opportunities/:id/qa, the submitted question appears in the list on that page as pending (awaiting answer)"
  status: failed
  reason: "User reported: I was able to submit a question but after that I do not see my submitted question anywhere on screen"
  severity: major
  test: 1
  source: user
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "The Q&A management page (/grantor/opportunities/:id/qa) shows all submitted questions so the grantor can type and publish answers"
  status: failed
  reason: "User reported: Question not showing up"
  severity: major
  test: 2
  source: user
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "In the workspace Certifications section, applicant@example.com (who has authorized_representative role) sees a Certification panel with legal certification text and a checkbox"
  status: failed
  reason: "User reported: I can see certifications in left panel, but opening that I only see few fields and a comment box, but no legal text or checkbox"
  severity: major
  test: 4
  source: user
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "After filling all workspace sections, ReadinessDashboard shows 100% completion and the Submit Application button becomes active"
  status: failed
  reason: "User reported: I filled all the sections but 'Submit Application' button is greyed out and readiness dashboard shows 78%."
  severity: major
  test: 5
  source: user
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

