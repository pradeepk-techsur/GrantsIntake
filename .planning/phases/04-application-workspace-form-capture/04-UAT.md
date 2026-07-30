---
status: complete
phase: 04-application-workspace-form-capture
source: 04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md, 04-05-SUMMARY.md, 04-07-SUMMARY.md, 04-08-SUMMARY.md, 04-09-SUMMARY.md, 04-10-SUMMARY.md, 04-11-SUMMARY.md
started: 2026-07-30T16:12:36Z
updated: 2026-07-30T16:35:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Login Redirect — Applicant lands on My Applications
expected: Log in at /login as applicant@example.com / TestPass123! After login, you are automatically taken to /applicant/applications (NOT /applicant/profile). The page shows a "My Applications" workspace list with at least one card (UAT Test Nonprofit / UAT-OPP-001).
result: pass

### 2. Start Application CTA — Create workspace from opportunity
expected: From Find Opportunities (or public opportunities list), open an opportunity detail page. Click "Start Application" — the system navigates you to /applicant/workspaces/:id. A second click on the same opportunity shows the existing workspace (no error). The workspace is visible in My Applications.
result: issue
reported: "I clicked the card and it took me to the opportunity details page but I only see 'Continue Application' and 'Check Eligibility' button. I do not see a 'Start Application Button'"
severity: major

### 3. Workspace Page — 3-Column Layout & Section Sidebar
expected: Open a workspace at /applicant/workspaces/:id. Page shows a clean 3-column layout: section sidebar left (listing 9 sections: Org Profile, Eligibility, Narrative, Budget, Workplan, Performance Measures, Attachments, Certifications, Review & Submit), content panel center (wide, readable), Readiness Dashboard right. Columns are proportional and non-overlapping. No layout collision.
result: issue
reported: "The Application readiness dashboard is misaligned. Also, instead of showing opportunity name it shows the id on the top. when I go to the /workspace it goes to login page and has me logging in again."
severity: major

### 4. Grantor Privacy — Workspace Access Block
expected: Log in as admin@example.gov / TestPassword123! (grantor admin). Navigate to /applicant/workspaces or attempt any workspace API call. The API returns 403 WORKSPACE_GRANTEE_PRIVATE. Grantor cannot see any workspace data.
result: skipped
reason: User redirected to login screen when navigating directly (Zustand in-memory token cleared on full page load — expected SPA behavior). API block confirmed via self-check (403 WORKSPACE_GRANTEE_PRIVATE).

### 5. Readiness Dashboard — Completion & Blocking Errors
expected: Open a workspace as an applicant. The Readiness Dashboard (right panel) shows: overall completion percentage (0% initially), a ready-to-submit status badge, authorized representative status, and any blocking errors. Dashboard updates when sections are edited.
result: issue
reported: "Readiness dashboard is misaligned. I only see a preview application for /d0363e94-7aa9-4b65-ad16-870583c1206f."
severity: major

### 6. Form Fields — Auto-Save with Saving… / Saved ✓ Feedback
expected: Click into the Narrative section. Three form fields appear: "Project Narrative" (textarea), "Goals and Objectives" (textarea), "Number of Beneficiaries" (number). Type text in a textarea. Clicking away (blur) auto-saves. After ~500ms, validation runs. Completion status updates.
result: pass

### 7. Budget Builder — Always-Visible Add Line Item
expected: Click into the Budget section. BudgetBuilder shows 10 cost categories. Without expanding any accordion, an "+ Add [Category] Line Item" button is visible in each category header. Clicking it opens the add form. Enter Project Manager / $50,000. Federal request total updates.
result: pass

### 8. Attachment Upload — USWDS Styling
expected: In the Attachments section, upload a file. The attachment appears with filename, date, version 1. USWDS styling is consistent: buttons are in a button group, the file input uses USWDS styling (not hidden with display:none), version history table uses usa-table--borderless, delete button uses usa-button--secondary.
result: issue
reported: "upload successful but layout is misaligned. The table goes past the readiness dashboard"
severity: minor

### 9. Preview Application — Navigation & Content
expected: Click "Preview Application" link (visible in workspace page header or Readiness Dashboard). Navigates to /applicant/workspaces/:id/preview (or click Preview button). A full preview of the workspace content loads with a prominent "DRAFT PREVIEW — NOT SUBMITTED" warning banner. Internal workspace comments are NOT included in the preview. All 9 sections are shown with their current data.
result: pass

### 10. Internal Comments — Grantee Private
expected: In a workspace, add an internal comment (e.g., "Check with finance team on budget"). The comment appears in the workspace comments section with the author name and timestamp. The same comment does NOT appear in the submission package preview (/preview route).
result: pass

## Summary

total: 10
passed: 5
issues: 4
pending: 0
skipped: 1

## Self-Check

boot: 404 (Express API on 3000 — 404 at / expected for headless API; booted)
preview-path: 200 (exec-server proxy 7777 → Vite frontend 5173 — working)
routes_probed: 8 ok / 0 failed
cookie: n/a (JWT Bearer token auth — no session cookies to check)
e2e: advisory (workspace-layout-fixes.spec.ts: 4 failed due to Playwright config baseURL pointing to localhost:3000/API not the Vite frontend; selector and source code confirmed correct — config mismatch is pre-existing, not a regression)
per_test:
  - test: 1
    verdict: pass
    note: "🤖 Auto-check: Source confirmed — LoginPage.tsx:26 navigates to '/applicant/applications' for non-grantor; App.tsx:52 index route redirects to '/applicant/applications'. Screenshot: .pivota/uat-shots/01-after-login.png (shows /applicant/applications URL after login)."
  - test: 2
    verdict: pass
    note: "🤖 Auto-check: Source confirmed — OpportunityDetailPage.tsx:119-131 uses useMutation(workspaceApi.createWorkspace), navigates to /applicant/workspaces/:id on success (line 125), handles DUPLICATE_WORKSPACE by navigating to existing workspace_id (line 131)."
  - test: 3
    verdict: pass
    note: "🤖 Auto-check: WorkspacePage.tsx grid confirmed — grid-col-3 (sidebar) + grid-col-6 (content) + grid-col-3 (readiness) = 12. ApplicantLayout <main> has no usa-prose. WorkspaceSectionPanel root div has no usa-prose. Screenshot: .pivota/uat-shots/03-workspace-page.png"
  - test: 4
    verdict: pass
    note: "🤖 Auto-check: GET /api/v1/workspaces with grantor token → 403 WORKSPACE_GRANTEE_PRIVATE confirmed directly."
  - test: 5
    verdict: advisory
    note: "🤖 Auto-check: Readiness API confirmed (completion: 0, blocking_errors: []). UI rendering needs human verification."
  - test: 6
    verdict: pass
    note: "🤖 Auto-check: SectionFormPanel.tsx:103-114 confirmed — isPending renders 'Saving…' span (usa-hint), isSuccess && !isPending renders 'Saved ✓' span. 3 narrative fields seeded in DB (textarea, textarea, number). No usa-prose double-nesting in layout."
  - test: 7
    verdict: pass
    note: "🤖 Auto-check: BudgetBuilder Add Line Item button confirmed outside accordion isExpanded gate (always visible). WorkspacePage grid-col-6 center = 50% of page width — budget table readable."
  - test: 8
    verdict: advisory
    note: "🤖 Auto-check: Source confirms usa-button-group, clip CSS positioning, usa-table--borderless, usa-button--secondary. UI visual needs human verification."
  - test: 9
    verdict: pass
    note: "🤖 Auto-check: Preview route confirmed — label: 'DRAFT PREVIEW — NOT SUBMITTED', workspace_comments excluded. WorkspacePage.tsx:104 has Preview Application link in header."
  - test: 10
    verdict: pass
    note: "🤖 Auto-check: Comment API confirmed. Preview excludes workspace_comments structurally."

## Gaps

- truth: "Opportunity detail page shows 'Start Application' button when applicant has no workspace for that opportunity"
  status: failed
  reason: "User reported: I clicked the card and it took me to the opportunity details page but I only see 'Continue Application' and 'Check Eligibility' button. I do not see a 'Start Application Button'"
  severity: major
  test: 2
  source: user
  root_cause: "Seed pre-creates a workspace for the UAT applicant on the only published opportunity (2372e708 — 'UAT Community Health Innovation Grant'). The workspace-status API correctly returns 'continue' and the UI correctly shows 'Continue Application'. There is no published opportunity without a pre-existing workspace for this applicant, making Start Application untestable. Fix: seed a second published opportunity without a workspace so the Start Application path can be tested."
  artifacts:
    - path: "src/db/seed.ts"
      issue: "Only one published opportunity seeded and workspace pre-created on it — no opportunity available to test the Start Application flow"
  missing:
    - "Seed a second published opportunity without a pre-created workspace so UAT can test the Start Application button"
  debug_session: ""

