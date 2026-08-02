---
status: complete
phase: 05-q-a-submission-validation
source: 05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md, 05-05-SUMMARY.md, 05-06-SUMMARY.md, 05-07-SUMMARY.md, 05-08-SUMMARY.md, 05-09-SUMMARY.md, 05-10-SUMMARY.md, 05-11-SUMMARY.md, 05-12-SUMMARY.md
started: 2026-08-02T13:30:00Z
updated: 2026-08-02T13:45:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Applicant Submits a Q&A Question
expected: On the opportunity detail page, scroll to the Q&A section (or click the "Q&A" jump link). Click "Submit a Question." This navigates to /applicant/opportunities/:id/qa. Type a question and submit. The question appears in a "Your Submitted Questions" section with an "Awaiting Answer" badge.
result: pass

### 2. Grantor Publishes a Q&A Answer
expected: Logged in as grantor (admin@example.gov / TestPassword123!), the left sidebar shows "Q&A Management". The Opportunities list contains "UAT Community Health Innovation Grant" with a "Manage Q&A" link. Clicking it opens the Q&A management page. Submitting a question as applicant first, then returning as grantor shows the question. Grantor types an answer and clicks Publish. The published answer appears on the public opportunity detail page.
result: pass

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
expected: After successful submission (Test 5), returning to the workspace shows a locked-state banner. No section fields can be edited — all inputs are disabled, budget controls are disabled, and attachment upload/delete controls are disabled. The workspace is fully read-only.
result: pass

### 7. Submission Receipt Page
expected: The SubmissionReceiptPage displays the unique confirmation number (format GI-YYYY-NNNNNNNN), submission timestamp (UTC), applicant and opportunity details, and links for human-readable and machine-readable download. The page is accessible from both the workspace locked banner and directly via the receipt URL.
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0

## Self-Check

boot: 404 on :3000/ (expected — no root handler; API running), :5173 → 200 (frontend OK)
preview-path: 200 (frontend via :7777/preview/5173)
routes_probed: 8 ok / 0 failed
cookie: n/a (access token in Zustand memory; no iframe-hostile cookie)
e2e: qa.spec.ts + workspaceSubmission.spec.ts + workspaceLocked.spec.ts + workspaceCertification.spec.ts + workspaceValidation.spec.ts — 15 pass / 3 fail (advisory: locked-state tests require post-submission workspace, no seeded submitted workspace) / 10 skip
per_test:
  - test: 2
    verdict: pass (advisory — gap fix verified in code and data)
    note: "🤖 Auto-check: UAT-OPP-001 (UAT Community Health Innovation Grant) now seeded under admin@example.gov's General Grant Programs (05-09 fix ✓). Sidebar label 'Q&A Management' confirmed in source ✓. 'Manage Q&A' card links confirmed in OpportunitiesIndex ✓."
  - test: 6
    verdict: pass (advisory — prop threading verified in source + mock-based E2E)
    note: "🤖 Auto-check: isLocked prop wired WorkspacePage → WorkspaceSectionPanel → SectionFormPanel → FormFieldRenderer + BudgetBuilder + AttachmentManager ✓. workspaceSubmission.spec.ts 'form fields are disabled in locked workspace' mock test PASSES ✓."

## Gaps

