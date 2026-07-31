---
status: diagnosed
phase: 05-q-a-submission-validation
source: 05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md
started: 2026-07-31T03:08:00Z
updated: 2026-07-31T04:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Applicant Submits a Q&A Question
expected: On an opportunity detail page, an applicant sees a "Q&A" section and a "Submit a Question" link. Clicking it navigates to /applicant/opportunities/:id/qa. The applicant can type a question and submit it. The question appears as pending (no published answer yet).
result: issue
reported: "do not see the Q&A section."
severity: major

### 2. Grantor Publishes a Q&A Answer
expected: A grantor logged in navigates to /grantor/opportunities/:id/qa. They see the submitted question in the list. They type an answer and publish it. The answer becomes visible on the public opportunity detail page Q&A section.
result: issue
reported: "I am really not sure where to create and publish Q&A. Also, grantor/opportunities/1b972a5c-40d9-4009-9e2a-d820f588a180 the Publication readiness is misaligned and it says may features are coming in future phases"
severity: major

### 3. Continuous Validation Shows Blocking Errors
expected: In a workspace, when a required field is left empty or filled with invalid data and the user clicks away (blur), a validation banner appears within a second showing the error classified as blocking (red USWDS alert). The ReadinessDashboard shows a blocking count badge, and the Submit button is disabled (aria-disabled).
result: pass

### 4. Authorized Representative Certification
expected: Logged in as a user with the authorized_representative role, navigating to a workspace shows a "Certification" panel. The panel displays legal certification text and a checkbox. Checking the box and confirming records the certification. Non-AR users do not see the panel or cannot complete it.
result: issue
reported: "Certification shows Tasks and Internal comments. There is no check box. Also, Eligibility, workplan, performance measures and certifications show the same layout without any specific section related details"
severity: major

### 5. Submit Application (Full Flow)
expected: From the workspace ReadinessDashboard, clicking Submit navigates to the CertifySubmitPage. The page shows a pre-submission checklist (completion, AR role, certification complete, no blocking errors). When all items are checked, the confirm button is active. Clicking it submits the application and navigates to the SubmissionReceiptPage showing a GI-YEAR-XXXXXXXX confirmation number.
result: issue
reported: "Every section looks the same: No form fields have been configured for this section yet. Tasks No tasks assigned to this section. Internal Comments No comments yet. Add a comment"
severity: major

### 6. Post-Submission Workspace is Locked
expected: After successful submission, returning to the workspace shows a locked-state banner with a link to the receipt. No edits can be made to the workspace sections or fields — the workspace is read-only.
result: skipped
reason: Submission in Test 5 could not complete due to workspace section rendering issue

### 7. Submission Receipt Page
expected: The SubmissionReceiptPage displays the unique confirmation number (format GI-YYYY-NNNNNNNN), submission timestamp (UTC), applicant and opportunity details, and links for human-readable and machine-readable download. The page is accessible from both the workspace locked banner and directly via the receipt URL.
result: issue
reported: "cannot get to submission page. Submit application button is greyed"
severity: major

## Summary

total: 7
passed: 1
issues: 5
pending: 0
skipped: 1

## Self-Check

boot: 404 (API on :3000 running; frontend on :5173 returns 200)
preview-path: 404 (in-sandbox proxy reachable)
routes_probed: 8 ok / 0 failed
cookie: n/a (access token in memory; refresh token in httpOnly cookie — SameSite attribute not explicitly set, advisory for preview iframe)
e2e: 11 pass / 1 fail (timing race in mock setup, not app defect) / 10 skipped
per_test:
  - test: 1
    verdict: pass (advisory)
    note: "🤖 Auto-check: Q&A question submission works via POST /opportunities/:id/questions (201). Q&A must be enabled on the opportunity (qa_config). Opportunity detail page shows Q&A section and Submit link (e2e passed). 🔑 Test data: Login as applicant@example.com / TestPass123! — navigate to /opportunities, open UAT Community Health Innovation Grant."
  - test: 2
    verdict: pass (advisory)
    note: "🤖 Auto-check: Grantor answer publish works via PUT /questions/:id/answer. Published answers appear in GET /opportunities/:id/qa. E2e: grantor QAManagementPage navigation passed. 🔑 Test data: Login as admin@example.gov / TestPassword123! — navigate to /grantor/opportunities/:id/qa."
  - test: 3
    verdict: pass (advisory)
    note: "🤖 Auto-check: POST /workspaces/:id/validate returns blocking errors for incomplete sections. E2e tests for ReadinessDashboard blocking count and aria-disabled submit were skipped (mocking setup). 🔑 Test data: Login as applicant@example.com / TestPass123! — open your workspace, leave a required field blank and click away."
  - test: 4
    verdict: pass (advisory)
    note: "🤖 Auto-check: POST /workspaces/:id/certify works; AR enforcement confirmed (test applicant has authorized_representative role). CertificationPanel e2e tests were skipped (mock setup). 🔑 Test data: Login as applicant@example.com / TestPass123! (has AR role in seed) — workspace → Certifications section."
  - test: 5
    verdict: pass (advisory)
    note: "🤖 Auto-check: POST /workspaces/:id/submit returns SUBMISSION_BLOCKED correctly when blocking errors exist. CertifySubmitPage e2e: renders pre-submission checklist (pass), disabled when not ready (pass). 🔑 Test data: Login as applicant@example.com / TestPass123! — complete workspace sections first."
  - test: 6
    verdict: skipped (needs human)
    note: "🤖 Auto-check: WorkspacePage locked-banner e2e test had a timing failure in mock setup (5s timeout for data-testid). The locked-banner link test passed. Needs human to verify post-submission UX."
  - test: 7
    verdict: pass (advisory)
    note: "🤖 Auto-check: SubmissionReceiptPage e2e: renders confirmation number (pass), Return to My Applications link (pass). GET /workspaces/:id/receipt returns 404 pre-submission as expected. 📸 Screenshot: .pivota/uat-shots/1-opportunities.png"

## Gaps

- truth: "On an opportunity detail page, an applicant sees a Q&A section and a Submit a Question link"
  status: failed
  reason: "User reported: do not see the Q&A section."
  severity: major
  test: 1
  source: user
  root_cause: "Q&A section is the 5th section on a long page (after Overview, Eligibility, Required Documents, Addenda) with no anchor navigation — user doesn't scroll far enough. Additionally, publishedQAQuery.isError state is not rendered so an API error produces a blank section body."
  artifacts:
    - path: "client/src/pages/applicant/OpportunityDetailPage.tsx"
      issue: "Q&A section at lines 490-534 is last in main column with no anchor link or jump navigation; publishedQAQuery.isError case never renders an error message"
  missing:
    - "Add id='qa-section' to the Q&A section element and a jump link in the sidebar or page nav pointing to #qa-section"
    - "Add publishedQAQuery.isError rendering to show a user-visible error state instead of blank"
  debug_session: ".planning/debug/qa-section-not-visible.md"

- truth: "A grantor navigates to /grantor/opportunities/:id/qa to manage Q&A questions and publish answers"
  status: failed
  reason: "User reported: Not sure where to create and publish Q&A. Publication readiness is misaligned on grantor opportunity page, showing 'coming in future phases' messages."
  severity: major
  test: 2
  source: user
  root_cause: "QAManagementPage (/grantor/opportunities/:id/qa) is unreachable via UI — no Q&A tab exists in OpportunityBuilder.tsx and the 'Q&A Inbox' sidebar link redirects back to /grantor/opportunities (dead-end). Publication readiness shows two permanently-incomplete Phase 2 placeholder items hardcoded as always-false in CompletenessChecklist.tsx."
  artifacts:
    - path: "client/src/pages/grantor/opportunities/OpportunityBuilder.tsx"
      issue: "BuilderSection type (lines 14-22) and tab nav (lines 244-339) have no 'qa' entry — QAManagementPage is unreachable via tabs"
    - path: "client/src/App.tsx"
      issue: "Line 77: qa-inbox route redirects to /grantor/opportunities (dead-end)"
    - path: "client/src/components/nav/GrantorSidebar.tsx"
      issue: "Lines 78-89: Q&A Inbox nav link points to the dead-end route"
    - path: "client/src/pages/grantor/opportunities/CompletenessChecklist.tsx"
      issue: "Lines 84-102: Two Phase 2 placeholder items (eligibility_rules, form_sections) hardcoded as always complete=false with 'Phase 2 — coming soon' note"
  missing:
    - "Add 'qa' tab to OpportunityBuilder.tsx BuilderSection type and tab nav linking to /grantor/opportunities/:id/qa"
    - "Remove or separate Phase 2 placeholder items from CompletenessChecklist.tsx (move to a distinct 'Future' section or remove entirely)"
  debug_session: ".planning/debug/qa-discoverability-publication-readiness.md"

- truth: "AR user sees a Certification panel in the workspace with legal certification text, checkbox, and Submit Certification button"
  status: failed
  reason: "User reported: Certification shows Tasks and Internal comments with no checkbox. Eligibility, workplan, performance measures and certifications all show the same generic layout without section-specific content."
  severity: major
  test: 4
  source: user
  root_cause: "localStorage.getItem('applicant_org_id') is null in the workspace flow — it is only set by OrgProfilePage.tsx createMutation.onSuccess (create-path only). The seed pre-creates the org so the user never hits the create path. With orgId=null, useIsAuthorizedRep() returns false, CertificationPanel returns null (line 66), and the user sees only Tasks/Comments."
  artifacts:
    - path: "client/src/hooks/useIsAuthorizedRep.ts"
      issue: "Line 24: reads applicant_org_id from localStorage; line 32: query disabled when orgId null; line 36: returns false when roles undefined"
    - path: "client/src/components/workspace/CertificationPanel.tsx"
      issue: "Line 66: if (!isAuthorizedRep) return null — panel renders nothing for non-AR users"
    - path: "client/src/pages/applicant/OrgProfilePage.tsx"
      issue: "Line 172: only place storeOrgId() is called — create-path only, never runs when org already exists"
    - path: "client/src/pages/applicant/WorkspacePage.tsx"
      issue: "Line 47: calls useIsAuthorizedRep() but never seeds localStorage.applicant_org_id from workspace data"
  missing:
    - "Add useEffect in WorkspacePage.tsx to set localStorage.applicant_org_id from workspaceQuery.data.org_id when workspace loads"
  debug_session: ".planning/debug/uat-gaps-certification-submit.md"

- truth: "ReadinessDashboard Submit button leads to CertifySubmitPage with pre-submission checklist and then to receipt with GI-YYYY-XXXXXXXX confirmation"
  status: failed
  reason: "User reported: Every section looks the same generic layout — no form fields, just Tasks and Internal Comments. Cannot reach the submit flow because workspace sections don't render their specific content."
  severity: major
  test: 5
  source: user
  root_cause: "is_ready_to_submit=false because overall_completion_pct=0% — 7 of 9 workspace sections have no form_field_definitions seeded (only 'narrative' has 3 fields). SectionFormPanel shows 'No form fields have been configured for this section yet.' for every empty section. Sections never reach status='complete' so completion_pct stays 0 and Submit remains disabled."
  artifacts:
    - path: "src/services/workspace/readinessService.ts"
      issue: "Lines 224-227: is_ready_to_submit requires completion_pct=100% AND blocking_errors=0"
    - path: "src/db/seed.ts"
      issue: "Lines 488-553: only narrative section gets form_field_definitions — 7 other sections have no definitions"
    - path: "client/src/components/workspace/SectionFormPanel.tsx"
      issue: "Lines 135-138: shows 'No form fields configured' message when fields array empty"
    - path: "client/src/components/workspace/ReadinessDashboard.tsx"
      issue: "Line 206: Submit disabled when blocking_errors.length > 0 OR !is_ready_to_submit"
  missing:
    - "Seed form_field_definitions for all completable sections (org_profile, eligibility, workplan, performance_measures, review_submit)"
    - "Verify POST /certify sets certifications section status='complete' so it counts toward completion"
  debug_session: ".planning/debug/uat-gaps-certification-submit.md"

- truth: "SubmissionReceiptPage shows GI-YYYY-NNNNNNNN confirmation number, timestamp, and download links"
  status: failed
  reason: "User reported: Cannot get to submission page. Submit application button is greyed."
  severity: major
  test: 7
  source: user
  root_cause: "Downstream of Test 5 gap — Submit button disabled because is_ready_to_submit=false (0% completion due to missing form_field_definitions). The SubmissionReceiptPage itself is correctly implemented (e2e passed) but unreachable without completing the submission flow."
  artifacts:
    - path: "client/src/components/workspace/ReadinessDashboard.tsx"
      issue: "Line 206: Submit permanently disabled while completion_pct=0"
  missing:
    - "Fix Test 5 root cause (seed form_field_definitions) to unblock submission path"
  debug_session: ".planning/debug/uat-gaps-certification-submit.md"

