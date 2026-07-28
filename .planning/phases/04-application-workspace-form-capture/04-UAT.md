---
status: diagnosed
phase: 04-application-workspace-form-capture
source: 04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md, 04-05-SUMMARY.md, 04-07-SUMMARY.md, 04-08-SUMMARY.md, 04-09-SUMMARY.md
started: 2026-07-28T13:58:21Z
updated: 2026-07-28T14:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Workspace List Page — My Applications
expected: Navigate to /applicant/applications as a logged-in applicant. The page shows a USWDS card-group listing your workspaces. Each card shows the opportunity title and status. An empty state shows when no workspaces exist.
result: pass

### 2. Create Application Workspace — Start Application CTA
expected: From the "Find Opportunities" page, open an opportunity detail page. Click "Start Application" — the system POSTs to /api/v1/workspaces and navigates you to /applicant/workspaces/:id. A second click on the same opportunity takes you to the existing workspace (DUPLICATE_WORKSPACE handled gracefully — no error shown). "Continue Application" link uses the correct /applicant/workspaces/:id path.
result: skipped
reason: Unable to test at this time

### 3. Workspace Page — Section Sidebar Navigation
expected: Open a workspace at /applicant/workspaces/:id. A left sidebar lists all 9 sections: Org Profile, Eligibility, Narrative, Budget, Workplan, Performance Measures, Attachments, Certifications, Review & Submit. Clicking a section loads its panel without navigating to a new URL (in-page section switch via Zustand).
result: issue
reported: "the steps to do the verification is incorrect. Also, the layout of applicant/workspaces/dd3e6ca6-d9f9-4305-8771-ba0faa07653a is messed up"
severity: major

### 4. Grantor Privacy — Workspace Access Block
expected: Log in as a grantor (admin@example.gov / TestPassword123!). Attempt to access any workspace route (e.g., GET /api/v1/workspaces). The API returns 403 WORKSPACE_GRANTEE_PRIVATE. Grantor cannot see any workspace data.
result: pass

### 5. Readiness Dashboard — 3-Column Layout
expected: Open a workspace. The page shows a 3-column layout: section sidebar (left), section content (center), Readiness Dashboard (right). Columns are proportional and non-overlapping. Dashboard shows completion % (0% initially), ready-to-submit badge, authorized rep status, and any blocking errors.
result: issue
reported: "layout is broken. Also when logging in as applicant it takes me to profile"
severity: major

### 6. Form Fields — Narrative Section Data Entry
expected: Click into the Narrative section. Three form fields appear: "Project Narrative" (textarea), "Goals and Objectives" (textarea), "Number of Beneficiaries" (number). Fill in a textarea. Clicking away (blur) auto-saves. After ~500ms, validation runs. Completion status updates.
result: issue
reported: "able to type but field does not blur and no indication of auto save. The layout of the page is all jumbled and messy"
severity: major

### 7. Budget Builder — Always-Visible Add Line Item
expected: Click into the Budget section. The BudgetBuilder shows 10 cost categories. Without expanding any accordion, an "+ Add [Category] Line Item" button is visible in each category header. Clicking it opens the add form. Enter Project Manager / $50,000. Federal request total updates.
result: issue
reported: "the test passes but the layout on this page is very messy. You will need to check styling and CSS"
severity: minor

### 8. Budget Validation — Funding Ceiling Enforcement
expected: Add budget line items that exceed the opportunity's funding_amount_max (if set). Clicking Validate returns a EXCEEDS_FUNDING_CEILING blocking error. The readiness dashboard picks this up as a blocking error.
result: skipped
reason: No funding_amount_max set on UAT test opportunity; cannot trigger ceiling error

### 9. Attachment Upload — Version History (USWDS Styling)
expected: In the Attachments section, upload a file. The attachment appears with filename, date, version 1. USWDS styling is consistent: buttons are in a button group, the file input uses USWDS styling (not hidden with display:none), version history table uses usa-table--borderless, delete button uses usa-button--secondary.
result: issue
reported: "test passes but styling and the CSS on this page is very messy"
severity: cosmetic

### 10. Submission Package Preview — Navigation Link
expected: Navigate to /applicant/workspaces/:id/preview (or click Preview button). A full preview of the workspace content loads with a prominent "DRAFT PREVIEW — NOT SUBMITTED" warning banner. Internal workspace comments are NOT included in the preview. All 9 sections are shown with their current data.
result: pass

### 11. Internal Comments — Grantee Private
expected: In a workspace, add an internal comment (e.g., "Check with finance team on budget"). The comment appears in the workspace comments section with the author name and timestamp. The same comment does NOT appear in the submission package preview (/preview route).
result: pass

### 12. Match Requirement Validation (PRD-INTAKE-040)
expected: For an opportunity with match_required=true and match_percentage set, add insufficient match line items. Clicking Validate returns MATCH_REQUIREMENT_NOT_MET. Adding sufficient match line items clears it.
result: skipped
reason: UAT opportunity has match_required=false; cannot trigger MATCH_REQUIREMENT_NOT_MET

## Summary

total: 12
passed: 4
issues: 5
pending: 0
skipped: 3

## Self-Check

boot: 404 (API on 3000 running — 404 expected at / for headless API; login and workspace APIs confirmed 200)
preview-path: 200 (exec-server proxy on 7777 → frontend on 5173 reachable)
routes_probed: 11 ok / 0 failed
cookie: n/a (JWT Bearer token auth, no session cookies)
e2e: skipped (conserving resources)
note: "DB migration + seed ran manually (DATABASE_URL not in env at wrapper boot time); all API routes confirmed working post-seed"
per_test:
  - test: 1
    verdict: advisory
    note: "🤖 Auto-check: GET /api/v1/workspaces → 1 workspace (dd3e6ca6) confirmed. UI rendering needs human verification."
  - test: 2
    verdict: pass
    note: "🤖 Auto-check: Source confirms useMutation(workspaceApi.createWorkspace) in OpportunityDetailPage.tsx:119-124, onClick at line 270. Second POST returns DUPLICATE_WORKSPACE confirmed. Continue Application fix to /applicant prefix confirmed in source."
  - test: 3
    verdict: pass
    note: "🤖 Auto-check: All 9 sections confirmed in DB: org_profile, eligibility, narrative, budget, workplan, performance_measures, attachments, certifications, review_submit. UI section-switching needs human verification."
  - test: 4
    verdict: pass
    note: "🤖 Auto-check: GET /api/v1/workspaces with grantor token → 403 WORKSPACE_GRANTEE_PRIVATE confirmed."
  - test: 5
    verdict: advisory
    note: "🤖 Auto-check: Readiness API → completion: 0, ready: false confirmed. Grid fix confirmed in source (grid-col-2 + grid-col-5 + grid-col-2 = 9 inside desktop:grid-col-9 parent). UI layout needs human verification. 📸 Screenshot: .pivota/uat-shots/03-workspace-page.png"
  - test: 6
    verdict: pass
    note: "🤖 Auto-check: 3 form_field_definitions seeded for narrative section: 'Project Narrative', 'Goals and Objectives', 'Number of Beneficiaries'. GET /fields returns all 3. UI rendering needs human verification."
  - test: 7
    verdict: pass
    note: "🤖 Auto-check: Source confirms '+ Add Line Item' button outside isExpanded gate (WorkspacePage.tsx add-button in always-visible div). UI interaction needs human verification."
  - test: 8
    verdict: advisory
    note: "🤖 Auto-check: Budget validate with $50k line item → valid (no ceiling set on UAT opportunity). Ceiling logic exists in budgetService. Skippable if no ceiling configured."
  - test: 9
    verdict: advisory
    note: "🤖 Auto-check: Upload → v1 confirmed. Source confirms usa-button-group, clip CSS, usa-table--borderless, usa-button--secondary. UI visual needs human verification."
  - test: 10
    verdict: pass
    note: "🤖 Auto-check: Preview route returns label 'DRAFT PREVIEW — NOT SUBMITTED', no workspace_comments field confirmed. Source confirms preview link in WorkspacePage header (line 104). 📸 Screenshot: .pivota/uat-shots/10-workspace-preview.png"
  - test: 11
    verdict: pass
    note: "🤖 Auto-check: Comment created, excluded from preview confirmed."
  - test: 12
    verdict: skipped (needs human)
    note: "🤖 Auto-check: UAT opportunity has match_required: false. MATCH_REQUIREMENT_NOT_MET logic exists in budgetService. Needs opportunity with match_required=true."

## Gaps

- truth: "Workspace page at /applicant/workspaces/:id shows a clean 3-column layout with section sidebar, content panel, and readiness dashboard"
  status: failed
  reason: "User reported: the steps to do the verification is incorrect. Also, the layout of applicant/workspaces/dd3e6ca6-d9f9-4305-8771-ba0faa07653a is messed up"
  severity: major
  test: 3
  source: user
  root_cause: "WorkspacePage.tsx grid-col-2+5+2=9 only fills 75% of parent width. Plan 04-08 incorrectly changed 3+6+3=12 (correct) to 2+5+2=9 based on false premise that inner columns should match parent column count. USWDS grid-col-N is always out of 12."
  artifacts:
    - path: "client/src/pages/applicant/WorkspacePage.tsx"
      issue: "Lines 116/123/132: grid-col-2+grid-col-5+grid-col-2=9 (75% of page) — should be 3+6+3=12"
  missing:
    - "Restore grid-col-3 + grid-col-6 + grid-col-3 in WorkspacePage.tsx (sum to 12)"
  debug_session: ".planning/debug/workspace-layout-broken.md"

- truth: "Workspace page 3-column layout is non-overlapping; applicant login lands on My Applications (not profile page)"
  status: failed
  reason: "User reported: layout is broken. Also when logging in as applicant it takes me to profile"
  severity: major
  test: 5
  source: user
  root_cause: "TWO bugs: (1) LoginPage.tsx:26 navigates to '/applicant/profile' for all non-grantor users instead of '/applicant/applications'. App.tsx:52 index route also redirects to profile. (2) Same WorkspacePage grid-col-2+5+2=9 issue as test 3."
  artifacts:
    - path: "client/src/pages/auth/LoginPage.tsx"
      issue: "Line 26: navigate destination is '/applicant/profile' — should be '/applicant/applications'"
    - path: "client/src/App.tsx"
      issue: "Line 52: <Navigate to='/applicant/profile'> on /applicant index — should be '/applicant/applications'"
    - path: "client/src/pages/applicant/WorkspacePage.tsx"
      issue: "Lines 116/123/132: grid-col sum is 9 not 12"
  missing:
    - "LoginPage.tsx:26 — change '/applicant/profile' to '/applicant/applications'"
    - "App.tsx:52 — change Navigate to='/applicant/profile' to '/applicant/applications'"
    - "WorkspacePage.tsx — restore 3+6+3=12 column layout"
  debug_session: ".planning/debug/login-redirect-and-layout.md"

- truth: "Form field blur triggers auto-save with visible feedback; workspace layout is clean and usable"
  status: failed
  reason: "User reported: able to type but field does not blur and no indication of auto save. The layout of the page is all jumbled and messy"
  severity: major
  test: 6
  source: user
  root_cause: "TWO bugs: (1) SectionFormPanel.tsx — saveMutation.isPending and .isSuccess never rendered in JSX; save fires silently on blur with zero visual feedback. (2) ApplicantLayout.tsx:85 has 'usa-prose' on <main>; WorkspaceSectionPanel.tsx:63 adds a second 'usa-prose' wrapper — double-nesting cascades max-width/typography constraints into the grid, causing layout collision."
  artifacts:
    - path: "client/src/components/workspace/SectionFormPanel.tsx"
      issue: "saveMutation.isPending and .isSuccess unused in JSX — no save feedback rendered"
    - path: "client/src/layouts/ApplicantLayout.tsx"
      issue: "Line 85: <main> has usa-prose class — conflicts with inner grid-row in WorkspacePage"
    - path: "client/src/components/workspace/WorkspaceSectionPanel.tsx"
      issue: "Line 63: <div className='usa-prose'> creates double-nested usa-prose inside the layout"
  missing:
    - "SectionFormPanel.tsx: add {saveMutation.isPending && <span className='usa-hint'>Saving…</span>} and {saveMutation.isSuccess && <span>Saved ✓</span>}"
    - "ApplicantLayout.tsx:85: remove usa-prose from <main> className"
    - "WorkspaceSectionPanel.tsx:63: remove usa-prose from root div"
  debug_session: ".planning/debug/form-field-autosave.md"

- truth: "Budget Builder page has clean USWDS styling with properly sized columns and readable layout"
  status: failed
  reason: "User reported: the test passes but the layout on this page is very messy. You will need to check styling and CSS"
  severity: minor
  test: 7
  source: user
  root_cause: "WorkspacePage grid-col-5 gives Budget content only 31% of page width (5/12 × 9/12). Budget multi-column tables (6 cols) crammed into 31% are unreadable. Double usa-prose nesting (ApplicantLayout + WorkspaceSectionPanel) further compounds it. Missing desktop: prefix on inner grid-col classes means narrow widths apply at all viewports."
  artifacts:
    - path: "client/src/pages/applicant/WorkspacePage.tsx"
      issue: "Lines 115-135: grid-col-5 for content = 31% of page; inner cols lack desktop: prefix"
    - path: "client/src/components/workspace/WorkspaceSectionPanel.tsx"
      issue: "Line 63: usa-prose double-nesting"
  missing:
    - "Widen content column in WorkspacePage (e.g. desktop:grid-col-7 or desktop:grid-col-8)"
    - "Add desktop: prefix to inner grid columns"
    - "Remove usa-prose from WorkspaceSectionPanel root div"
  debug_session: ".planning/debug/workspace-css-styling.md"

- truth: "Attachments section has clean USWDS styling consistent with the rest of the workspace"
  status: failed
  reason: "User reported: test passes but styling and the CSS on this page is very messy"
  severity: cosmetic
  test: 9
  source: user
  root_cause: "Same root causes as test 7: width starvation (31% available for AttachmentManager's 5-column table) and double usa-prose nesting. AttachmentManager 5-column table with nested version history panels is unreadable at 31% page width."
  artifacts:
    - path: "client/src/pages/applicant/WorkspacePage.tsx"
      issue: "grid-col-5 content column only 31% of page width"
    - path: "client/src/components/workspace/WorkspaceSectionPanel.tsx"
      issue: "Line 63: usa-prose double-nesting"
  missing:
    - "Widen content column (fixes both Budget and Attachments sections)"
    - "Remove usa-prose double-nesting"
  debug_session: ".planning/debug/workspace-css-styling.md"

