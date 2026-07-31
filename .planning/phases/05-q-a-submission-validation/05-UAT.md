---
status: diagnosed
phase: 05-q-a-submission-validation
source: 05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md
started: 2026-07-31T14:36:25Z
updated: 2026-07-31T14:50:00Z
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
  root_cause: "QASubmitPage only shows published/answered questions (GET /opportunities/:id/qa returns only answered items). A freshly submitted question has status='pending' and no answer so it never appears. There is no 'pending questions' list shown to the applicant after submit — only a text success message."
  artifacts:
    - path: "client/src/pages/applicant/QASubmitPage.tsx:28-44"
      issue: "publishedQuery calls listPublished() which returns only answered items; onSuccess invalidates that query but pending questions still won't appear"
    - path: "client/src/api/qaApi.ts:14-18"
      issue: "listPublished() calls GET /api/v1/opportunities/:id/qa — public endpoint, answered-only"
  missing:
    - "After submit success, display a 'Your submitted questions (awaiting answer)' list using an authenticated endpoint for the submitter's own questions"
    - "Add GET /opportunities/:id/my-questions endpoint or reuse existing grantor endpoint with user-scoped filter, and render submitted-but-pending questions on QASubmitPage"
  debug_session: ""

- truth: "The Q&A management page (/grantor/opportunities/:id/qa) shows all submitted questions so the grantor can type and publish answers"
  status: failed
  reason: "User reported: Question not showing up"
  severity: major
  test: 2
  source: user
  root_cause: "Opportunity ID mismatch between what the applicant submitted to and what the grantor is viewing. The applicant submits via their applicant URL opportunity ID, and the grantor views via a different opportunity ID in OpportunityBuilder. Additionally, QAManagementPage shows only the raw UUID (not opportunity title) making it impossible to verify the correct opportunity."
  artifacts:
    - path: "client/src/pages/grantor/QAManagementPage.tsx:73"
      issue: "Displays raw UUID not opportunity title — no visual confirmation of correct opportunity"
    - path: "client/src/api/qaApi.ts:22-25"
      issue: "Error from listAll() does not propagate HTTP status code — auth failures (401/403) indistinguishable from empty results"
  missing:
    - "Verify and align the opportunity IDs used by applicant QA submit path and grantor QA management path"
    - "Add opportunity title to QAManagementPage header via GET /opportunities/:id"
    - "Propagate HTTP status on listAll() errors so 401/403 is distinguishable from empty"
  debug_session: ""

- truth: "In the workspace Certifications section, applicant@example.com (who has authorized_representative role) sees a Certification panel with legal certification text and a checkbox"
  status: failed
  reason: "User reported: I can see certifications in left panel, but opening that I only see few fields and a comment box, but no legal text or checkbox"
  severity: major
  test: 4
  source: user
  root_cause: "useIsAuthorizedRep hook reads orgId from localStorage synchronously at render time. WorkspacePage.tsx sets localStorage.applicant_org_id in a useEffect that fires AFTER the first render. On the initial render orgId is null, the query is disabled, isAuthorizedRep stays false, and CertificationPanel returns null. The fix in 05-05 sets localStorage but the hook is not reactive to localStorage changes — it only picks up the value on the NEXT hard refresh."
  artifacts:
    - path: "client/src/hooks/useIsAuthorizedRep.ts:24"
      issue: "orgId read from localStorage once at render — not reactive to useEffect writes that happen after initial render"
    - path: "client/src/pages/applicant/WorkspacePage.tsx:55-59"
      issue: "useEffect sets localStorage.applicant_org_id after mount, but hook has already captured orgId=null and disabled the query"
    - path: "client/src/components/workspace/CertificationPanel.tsx:66"
      issue: "if (!isAuthorizedRep) return null — correctly gated but never receives true due to above timing issue"
  missing:
    - "Pass org_id directly as prop to useIsAuthorizedRep instead of reading from localStorage — WorkspacePage already has workspaceQuery.data.org_id available"
    - "Change hook signature to useIsAuthorizedRep(orgId?: string | null) and remove localStorage.getItem call from hook"
  debug_session: ""

- truth: "After filling all workspace sections, ReadinessDashboard shows 100% completion and the Submit Application button becomes active"
  status: failed
  reason: "User reported: I filled all the sections but 'Submit Application' button is greyed out and readiness dashboard shows 78%."
  severity: major
  test: 5
  source: user
  root_cause: "Two compounding issues: (A) certificationService.certify() inserts a cert record but never updates application_sections SET status='complete' WHERE section_type='certifications', so the certifications section permanently stays not_started. (B) The attachments section also stays not_started when no attachments are uploaded, even when no attachment requirements exist. 7/9 sections = 78%; the 2 stuck sections (certifications + attachments) make 100% mathematically impossible. is_ready_to_submit requires overall_completion_pct===100."
  artifacts:
    - path: "src/services/workspace/certificationService.ts:62-88"
      issue: "certify() inserts into certifications table but never UPDATE application_sections SET status='complete' WHERE section_type='certifications'"
    - path: "src/services/workspace/readinessService.ts:67-72"
      issue: "overall_completion_pct counts application_sections.status='complete' — certifications section never reaches complete without the UPDATE"
    - path: "src/services/workspace/readinessService.ts:224-227"
      issue: "is_ready_to_submit requires overall_completion_pct===100 — unreachable with 2 sections stuck at not_started"
  missing:
    - "In certificationService.certify(): after INSERT into certifications, UPDATE application_sections SET status='complete' WHERE workspace_id=$1 AND section_type='certifications'"
    - "For attachments section: when no attachment requirements exist for the opportunity, auto-mark attachments section as complete (or exclude it from completion denominator)"
    - "Fix Gap 3 (CertificationPanel visibility) first so user can trigger POST /certify to flip certifications to complete"
  debug_session: ""

