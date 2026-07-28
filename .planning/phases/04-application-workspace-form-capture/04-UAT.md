---
status: diagnosed
phase: 04-application-workspace-form-capture
source: 04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md, 04-05-SUMMARY.md
started: 2026-07-27T20:55:00Z
updated: 2026-07-27T21:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Workspace List Page — My Applications
expected: Navigate to /applicant/applications as a logged-in applicant. The page shows a USWDS card-group listing your workspaces. Each card shows the opportunity title and status. An empty state shows when no workspaces exist.
result: pass

### 2. Create Application Workspace
expected: From the "Find Opportunities" page or via the applicant portal, start an application for an opportunity. The system creates exactly one workspace for your org + opportunity combination. A second attempt to create a workspace for the same opportunity returns an error (DUPLICATE_WORKSPACE). The workspace is visible in /applicant/applications.
result: issue
reported: "No Apply or Start Application button visible — button links to /apply/:id which has no registered route"
severity: major

### 3. Workspace Page — Section Sidebar Navigation
expected: Open a workspace at /applicant/workspaces/:id. A left sidebar lists all 9 sections: Org Profile, Eligibility, Narrative, Budget, Workplan, Performance Measures, Attachments, Certifications, Review & Submit. Clicking a section loads its panel without navigating to a new URL (in-page section switch via Zustand).
result: pass

### 4. Grantor Privacy — Workspace Access Block
expected: Log in as a grantor (admin@example.gov). Attempt to access any workspace route (e.g., GET /api/v1/workspaces). The API returns 403 WORKSPACE_GRANTEE_PRIVATE. Grantor cannot see any workspace data.
result: pass

### 5. Readiness Dashboard — Completion Tracking
expected: Open a workspace. The right column shows a Readiness Dashboard with: overall completion percentage (0% on a fresh workspace), ready-to-submit badge (not ready initially), authorized rep assigned status, and any blocking errors. The dashboard updates every 30 seconds via polling.
result: issue
reported: "Layout broken — panels overlapping or stacked wrong; the dashboard shows but the styling is all messed up"
severity: minor

### 6. Form Fields — Section Data Entry
expected: Click into the Narrative section of a workspace. Form fields appear with USWDS styling. Fill in a text field (e.g., project description). Clicking away (blur) auto-saves the field. After 500ms, validation runs and shows inline errors if a required field is empty. Completion status updates.
result: issue
reported: "No Project Description field in Narrative section; fields are not editable — section appears empty with no form fields"
severity: major

### 7. Budget Builder — Line Items and Totals
expected: Click into the Budget section. The BudgetBuilder shows 10 cost categories (Personnel, Fringe, Travel, Equipment, Supplies, Contractual, Indirect, Other Direct, Match Cash, Match In-Kind). Add a line item: Project Manager, Personnel, $50,000. The federal request and project cost totals update automatically. Click Validate — if within the funding ceiling, shows valid.
result: issue
reported: "Categories show but can't add line items"
severity: minor

### 8. Budget Validation — Funding Ceiling Enforcement
expected: Add budget line items that exceed the opportunity's funding_amount_max (if set). Clicking Validate returns a EXCEEDS_FUNDING_CEILING blocking error. The readiness dashboard picks this up as a blocking error.
result: skipped
reason: No funding_amount_max set on UAT test opportunity; cannot trigger ceiling error

### 9. Attachment Upload — Version History
expected: In the Attachments section, upload a file (e.g., a PDF budget narrative). The attachment appears in the list with filename, upload date, and version 1. Upload the same document again — it creates version 2 and deactivates version 1. Version history shows both versions with the latest marked active.
result: issue
reported: "Passed functionally but styling is all over the place"
severity: cosmetic

### 10. Submission Package Preview
expected: Navigate to /applicant/workspaces/:id/preview (or click Preview button). A full preview of the workspace content loads with a prominent "DRAFT PREVIEW — NOT SUBMITTED" warning banner. Internal workspace comments are NOT included in the preview. All 9 sections are shown with their current data.
result: issue
reported: "Can't find the Preview button or link in the workspace — no navigation to the preview page"
severity: major

### 11. Internal Comments — Grantee Private
expected: In a workspace, add an internal comment (e.g., "Check with finance team on budget"). The comment appears in the workspace comments section with the author name and timestamp. The same comment does NOT appear in the submission package preview (/preview route).
result: pass

### 12. Match Requirement Validation (PRD-INTAKE-040)
expected: For an opportunity with match_required=true and match_percentage set, add budget line items where the match contribution is insufficient. Clicking Validate on the budget returns a MATCH_REQUIREMENT_NOT_MET error. Adding sufficient match line items (match_cash or match_in_kind categories) clears this error.
result: skipped
reason: UAT opportunity has match_required=false; cannot trigger MATCH_REQUIREMENT_NOT_MET error in test environment

## Summary

total: 12
passed: 4
issues: 6
pending: 0
skipped: 2

## Self-Check

boot: 404 (API server running — 404 expected at / for headless API)
preview-path: 200 (exec-server proxy available, frontend on 5173 reachable via 7777)
routes_probed: 10 ok / 0 failed
cookie: n/a (JWT Bearer token auth, no session cookies)
e2e: skipped (not run to conserve resources)
per_test:
  - test: 1
    verdict: advisory
    note: "🤖 Auto-check: GET /api/v1/workspaces with applicant token → 200 with 1 workspace (workspace_id: 94175f78, opportunity_id: 837fe274, status: workspace_created). UI rendering needs human verification."
  - test: 2
    verdict: pass
    note: "🤖 Auto-check: Second POST /api/v1/workspaces for same opportunity → 409 DUPLICATE_WORKSPACE confirmed. Test data: applicant@example.com / TestPass123!, workspace 94175f78 already exists for UAT Community Health Innovation Grant."
  - test: 3
    verdict: skipped (needs human)
    note: "🤖 Auto-check: Cannot verify in-page section switching (Zustand state) via HTTP. All 9 sections exist: org_profile, eligibility, narrative, budget, workplan, performance_measures, attachments, certifications, review_submit."
  - test: 4
    verdict: pass
    note: "🤖 Auto-check: GET /api/v1/workspaces with grantor token → 403 WORKSPACE_GRANTEE_PRIVATE. GET /api/v1/workspaces/94175f78 with grantor token → 403 WORKSPACE_GRANTEE_PRIVATE. Both confirmed."
  - test: 5
    verdict: pass
    note: "🤖 Auto-check: GET /api/v1/workspaces/94175f78/readiness → 200 with overall_completion_pct: 0, is_ready_to_submit: false, blocking_errors: 0 on fresh workspace. All 9 sections status: not_started."
  - test: 6
    verdict: skipped (needs human)
    note: "🤖 Auto-check: Form field definitions API works but no fields seeded for this test opportunity (template_id: null). FormFieldRenderer UI component exists — needs human verification with seeded field data."
  - test: 7
    verdict: pass
    note: "🤖 Auto-check: POST /budget/line-items with {category: personnel, description: Project Manager, total_cost: 50000} → 201. GET /budget shows total_federal_request: 50000, total_project_cost: 50000. POST /budget/validate → {errors: [], valid: true}."
  - test: 8
    verdict: advisory
    note: "🤖 Auto-check: Budget validate with $50k line item → valid (no ceiling set on UAT opportunity). Ceiling enforcement logic exists in budgetService but UAT opportunity has no funding_amount_max. Needs human to test UI error display."
  - test: 9
    verdict: advisory
    note: "🤖 Auto-check: POST /attachments with source_type=upload → 201, version_number: 1. Second upload creates independent v1 (no requirement_id links them). Version history deactivation is requirement_id-scoped per service code (attachmentService.ts:35-36). Needs human to verify UI version history display."
  - test: 10
    verdict: pass
    note: "🤖 Auto-check: GET /api/v1/workspaces/94175f78/preview → 200 with label: 'DRAFT PREVIEW — NOT SUBMITTED', 9 sections, keys: workspace_id/generated_at/label/sections/budget/attachments. No workspace_comments field present — confirmed excluded."
  - test: 11
    verdict: pass
    note: "🤖 Auto-check: POST /comments → 201 with comment text. GET /preview response does NOT contain workspace_comments field. Internal comments excluded from preview at query layer confirmed."
  - test: 12
    verdict: skipped (needs human)
    note: "🤖 Auto-check: UAT opportunity has match_required: false. MATCH_REQUIREMENT_NOT_MET logic confirmed in budgetService source. Needs an opportunity with match_required=true to trigger via UI."

## Gaps

- truth: "From Find Opportunities, clicking Start Application creates a workspace and takes the applicant to their workspace"
  status: failed
  reason: "User reported: No Apply or Start Application button visible — button links to /apply/:id which has no registered route"
  severity: major
  test: 2
  source: user
  root_cause: "OpportunityDetailPage.tsx:247 — 'Start Application' CTA uses <a href={`/apply/${opportunity.opportunity_id}`}> pointing to a non-existent route. The flow requires a POST /api/v1/workspaces then navigate to /applicant/workspaces/:id. The 'Continue Application' branch (line 235) also uses /workspaces/:id missing /applicant prefix."
  artifacts:
    - path: "client/src/pages/applicant/OpportunityDetailPage.tsx"
      issue: "Line 247: href=/apply/:id links to non-existent route. Line 235: href=/workspaces/:id missing /applicant prefix."
    - path: "client/src/App.tsx"
      issue: "No /apply/* route defined. Workspace route is /applicant/workspaces/:workspaceId."
  missing:
    - "Replace bare <a> with a button that calls POST /api/v1/workspaces and navigates to /applicant/workspaces/:newWorkspaceId via useNavigate()"
    - "Fix 'Continue Application' href from /workspaces/:id to /applicant/workspaces/:id"
  debug_session: ""

- truth: "Workspace page shows 3-column layout: section sidebar (left), section content (center), Readiness Dashboard (right)"
  status: failed
  reason: "User reported: Layout broken — panels overlapping or stacked wrong; the dashboard shows but the styling is all messed up"
  severity: minor
  test: 5
  source: user
  root_cause: "WorkspacePage.tsx:103-123 uses grid-col-3 + grid-col-6 + grid-col-3 = 12 columns inside ApplicantLayout's main area which is already constrained to desktop:grid-col-9. The 12 columns overflow a 9-column container, causing overlap and stacking."
  artifacts:
    - path: "client/src/pages/applicant/WorkspacePage.tsx"
      issue: "Lines 103-123: grid-col-3 + grid-col-6 + grid-col-3 = 12 cols inside a 9-col parent"
    - path: "client/src/layouts/ApplicantLayout.tsx"
      issue: "Line 85: <main> is desktop:grid-col-9, leaving only 9 of 12 grid units for WorkspacePage"
  missing:
    - "Reduce WorkspacePage column widths to fit 9 columns (e.g., grid-col-2 + grid-col-5 + grid-col-2) or move WorkspacePage outside ApplicantLayout's sidebar constraint"
  debug_session: ""

- truth: "Narrative section shows form fields (e.g. Project Description text area) that are editable with auto-save on blur"
  status: failed
  reason: "User reported: No Project Description field in Narrative section; fields are not editable — section appears empty with no form fields"
  severity: major
  test: 6
  source: user
  root_cause: "src/db/seed.ts:431-454 creates 9 workspace sections for the UAT opportunity but inserts zero rows into form_field_definitions. formFieldService.getFieldsForSection() returns empty; SectionFormPanel shows 'No form fields configured' message. Schema and service are correct — seed data is missing."
  artifacts:
    - path: "src/db/seed.ts"
      issue: "Lines 431-454: Inserts workspace sections but no INSERT INTO form_field_definitions statements"
  missing:
    - "Extend UAT seed to INSERT form_field_definitions rows for narrative section (e.g. textarea for 'Project Narrative', 'Goals and Objectives'; number for 'Number of Beneficiaries') linked to UAT opportunity and section IDs"
  debug_session: ""

- truth: "BudgetBuilder shows 10 categories; clicking a category expands it to reveal Add Line Item form; entering description + amount adds a line item and updates totals"
  status: failed
  reason: "User reported: Categories show but can't add line items"
  severity: minor
  test: 7
  source: user
  root_cause: "BudgetBuilder.tsx:482-495 — the '+ Add Line Item' button is hidden INSIDE the accordion content (gated on isExpanded). Users must first click the category header to expand, then find the add button inside — a non-obvious two-step interaction. The button is invisible until the accordion is expanded."
  artifacts:
    - path: "client/src/components/workspace/BudgetBuilder.tsx"
      issue: "Lines 482-495: '+ Add Line Item' button only visible after accordion expanded (inside isExpanded gate). Users don't know to click category header first."
  missing:
    - "Move '+ Add Line Item' button outside the accordion content div so it is visible without expanding — render it in the category header row alongside the subtotal amount"
  debug_session: ""

- truth: "Attachment section has consistent USWDS styling — upload form, file list, and version history are visually coherent"
  status: failed
  reason: "User reported: Passed functionally but styling is all over the place"
  severity: cosmetic
  test: 9
  source: user
  root_cause: "AttachmentManager.tsx has multiple USWDS deviations: (1) buttons not in usa-button-group, (2) hidden usa-file-input with display:none bypasses USWDS styling, (3) usa-table--striped instead of usa-table--borderless used elsewhere, (4) inline color style on delete button instead of usa-button--secondary."
  artifacts:
    - path: "client/src/components/workspace/AttachmentManager.tsx"
      issue: "Button container lacks usa-button-group; file input hidden with display:none; usa-table--striped inconsistent; delete button uses inline color instead of usa-button--secondary"
  missing:
    - "Wrap buttons in usa-button-group list markup"
    - "Use visible USWDS file input pattern instead of display:none"
    - "Change usa-table--striped to usa-table--borderless"
    - "Use usa-button--secondary for delete action instead of inline color"
  debug_session: ""

- truth: "WorkspacePage has a Preview button or link that navigates to /applicant/workspaces/:id/preview"
  status: failed
  reason: "User reported: Can't find the Preview button or link in the workspace — no navigation to the preview page"
  severity: major
  test: 10
  source: user
  root_cause: "WorkspacePage.tsx header (lines 86-100) has no 'Preview Application' link. ReadinessDashboard.tsx (lines 53-179) also has no preview/submit CTA. The WorkspacePreviewPage route exists at App.tsx:58 but is unreachable from the workspace UI."
  artifacts:
    - path: "client/src/pages/applicant/WorkspacePage.tsx"
      issue: "Lines 86-100: No 'Preview Application' button or link in page header"
    - path: "client/src/components/workspace/ReadinessDashboard.tsx"
      issue: "Lines 53-179: No preview/submit CTA despite being the logical place for it"
  missing:
    - "Add <Link to={`/applicant/workspaces/${workspaceId}/preview`}> as usa-button usa-button--outline in WorkspacePage header"
    - "Optionally surface same preview link in ReadinessDashboard card"
  debug_session: ""
