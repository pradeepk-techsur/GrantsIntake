---
phase: 04-application-workspace-form-capture
plan: 04
subsystem: application-workspace
tags: [budget, attachments, preview, postgres, react, vitest, uswds]

# Dependency graph
requires:
  - phase: 04-01
    provides: application_workspaces, application_sections, workspaceService
  - phase: 04-02
    provides: readinessService, blockGrantorOnWorkspace middleware
  - phase: 04-03
    provides: form_field_definitions, field_responses, formFieldService, SectionFormPanel
provides:
  - budgets table (UNIQUE workspace_id) + budget_line_items (3 CHK constraints) DDL
  - attachments table with version history DDL
  - budgetService with auto-calculated totals (federal/match split) and ceiling validation
  - attachmentService with base64 upload, versioning (deactivate prior), library linking, listVersions
  - previewService generating 'DRAFT PREVIEW — NOT SUBMITTED' response (workspace_comments excluded at query layer)
  - GET/POST/PUT/DELETE /api/v1/workspaces/:id/budget/line-items routes
  - GET /api/v1/workspaces/:id/attachments + POST + versions + DELETE routes
  - GET /api/v1/workspaces/:id/preview route
  - BudgetBuilder React component (10 categories, line item CRUD, auto-totals, validate button)
  - AttachmentManager React component (base64 upload, version history, soft-delete)
  - WorkspacePreviewPage at /applicant/workspaces/:workspaceId/preview
affects:
  - Phase 5 (submission): workspace, budget, attachments, preview all consumed at submission
  - readinessService: budget validation writes to application_sections.validation_errors for readiness pickup

# Tech tracking
tech-stack:
  added: [Node.js fs module (base64 file writes), USWDS usa-alert usa-table usa-accordion]
  patterns:
    - Lazy budget creation: INSERT ON CONFLICT DO UPDATE (budget auto-created on first GET)
    - Version history pattern: deactivate prior is_active=false before insert with version_number=max+1
    - Preview isolation: workspace_comments excluded by omission from all previewService queries (T-04-03)
    - Budget totals: server-side recalculateTotals after every line item mutation (not client-side)
    - IDOR guard: workspaceService.getWorkspace (404) then verifyWorkspaceMember (403) on all budget/attachment/preview routes

key-files:
  created:
    - src/db/migrations/013_budget_attachments_schema.sql
    - src/types/budget.ts
    - src/types/attachment.ts
    - src/services/workspace/budgetService.ts
    - src/services/workspace/attachmentService.ts
    - src/services/workspace/previewService.ts
    - tests/integration/workspaceBudget.test.ts
    - tests/integration/workspaceAttachments.test.ts
    - client/src/types/budget.ts
    - client/src/types/attachment.ts
    - client/src/types/preview.ts
    - client/src/components/workspace/BudgetBuilder.tsx
    - client/src/components/workspace/AttachmentManager.tsx
    - client/src/pages/applicant/WorkspacePreviewPage.tsx
    - e2e/workspaceBudget.spec.ts
    - e2e/workspacePreview.spec.ts
  modified:
    - src/routes/workspaces.ts (budget + attachment + preview routes added)
    - client/src/api/workspaceApi.ts (budget/attachment/preview methods added)
    - client/src/components/workspace/WorkspaceSectionPanel.tsx (routes budget → BudgetBuilder, attachments → AttachmentManager)
    - client/src/App.tsx (WorkspacePreviewPage replaces placeholder)

key-decisions:
  - "Migration 013_budget_attachments_schema.sql created as separate file alongside 013_form_field_definitions_schema.sql — both registered in schema_migrations; alphabetical sort order means budget migration applied first (acceptable as form_field already existed in DB)"
  - "match_requirement column absent from opportunities table — validateBudget only checks funding_amount_max ceiling; match validation deferred to future schema addition"
  - "BudgetBuilder totals are real-time from server (React Query refetch on mutation) not purely client-side — server is authoritative"
  - "E2E tests written as artifacts; execution deferred to verify phase (Playwright not run during execute to avoid hanging processes)"
  - "AttachmentManager 'Link from Library' button shows alert placeholder — full org library modal deferred (fetch pattern established)"

patterns-established:
  - "Version history: deactivate prior (is_active=false) then INSERT new with version_number = MAX+1"
  - "Preview exclusion: workspace_comments absent from ALL previewService queries (enforced structurally, not by filter)"
  - "Budget recalculation: CASE WHEN category = ANY($1) pattern for federal vs match category split using array param"

# Metrics
duration: 12min
completed: 2026-07-26
---

# Phase 4 Plan 4: Budget, Attachments, and Preview Summary

**Structured budget with auto-calculated federal/match totals, versioned file attachments with base64 upload, and on-demand draft preview excluding internal comments via previewService query isolation**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-26T19:34:23Z
- **Completed:** 2026-07-26T19:46:41Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments

- Budget subsystem: `budgets` + `budget_line_items` schema, BudgetService with auto-calculated totals (federal vs match category split), ceiling validation writing blocking errors to `application_sections.validation_errors` for readiness dashboard
- Attachment subsystem: `attachments` schema with version history, AttachmentService with base64 file upload + version deactivation + org library linking + listVersions
- Preview subsystem: previewService that assembles workspace content excluding `workspace_comments` at query layer; `DRAFT PREVIEW — NOT SUBMITTED` label enforced in both API response and UI
- Full React frontend: BudgetBuilder (10 categories, inline line item CRUD, real-time totals), AttachmentManager (upload + versions + soft-delete), WorkspacePreviewPage with prominent draft warning
- 17 integration tests pass (10 budget + 7 attachment/preview)

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration + backend services + routes + integration tests** - `3360070` (feat)
2. **Task 2: React components + client types + E2E specs** - `371e520` (feat)

**Plan metadata:** (see docs commit below)

## Files Created/Modified

- `src/db/migrations/013_budget_attachments_schema.sql` - budgets (UNIQUE workspace_id), budget_line_items (3 CHK constraints), attachments DDL + indexes
- `src/types/budget.ts` + `src/types/attachment.ts` - Server-side types
- `src/services/workspace/budgetService.ts` - BudgetService: getOrCreateBudget, addLineItem, updateLineItem, deleteLineItem, recalculateTotals, validateBudget
- `src/services/workspace/attachmentService.ts` - AttachmentService: listAttachments, uploadAttachment (versioning), linkLibraryDoc, listVersions, deactivate
- `src/services/workspace/previewService.ts` - PreviewService: generatePreview (workspace_comments excluded at query layer)
- `src/routes/workspaces.ts` - Extended with budget CRUD+validate, attachment CRUD+versions, preview route
- `tests/integration/workspaceBudget.test.ts` - 10 integration tests (auto-create, CRUD, totals, ceiling validation, IDOR)
- `tests/integration/workspaceAttachments.test.ts` - 7 integration tests (versioning, active filter, preview label, no-comments verification)
- `client/src/types/budget.ts` + `attachment.ts` + `preview.ts` - Client-side types
- `client/src/api/workspaceApi.ts` - Budget, attachment, preview API methods added
- `client/src/components/workspace/BudgetBuilder.tsx` - 10 category sections with line item CRUD, auto-totals, validate button, data-testid attributes
- `client/src/components/workspace/AttachmentManager.tsx` - File upload (FileReader→base64), version history, soft-delete, data-testid attributes
- `client/src/pages/applicant/WorkspacePreviewPage.tsx` - /applicant/workspaces/:workspaceId/preview with USWDS warning alert banner
- `client/src/components/workspace/WorkspaceSectionPanel.tsx` - Routes budget/attachments sections to new components
- `client/src/App.tsx` - WorkspacePreviewPage replaces placeholder route
- `e2e/workspaceBudget.spec.ts` + `e2e/workspacePreview.spec.ts` - Playwright E2E test artifacts

## Decisions Made

- Migration 013_budget_attachments_schema.sql created as separate file — alphabetical sort after b meant it ran before 013_form_field (which was already applied and registered)
- `match_requirement` column not present in `opportunities` table — validateBudget only enforces `funding_amount_max` ceiling; match validation skipped pending schema addition
- BudgetBuilder uses server-side totals via React Query invalidation after mutations (authoritative); client-side auto-calc of total_cost = qty × unit_cost is UX-only
- E2E tests (Playwright) written as artifacts only; execution deferred to verify phase per test_execution_boundary rules

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed missing `match_requirement` column in validateBudget**
- **Found during:** Task 1 (budget integration tests — validate tests fail)
- **Issue:** `src/services/workspace/budgetService.ts` queried `SELECT funding_amount_max, match_requirement FROM opportunities` but `match_requirement` column does not exist in the `opportunities` table schema
- **Fix:** Removed `match_requirement` from SELECT; removed match validation block; added comment noting deferred status
- **Files modified:** `src/services/workspace/budgetService.ts`
- **Verification:** All 10 budget integration tests pass after fix
- **Committed in:** `3360070` (part of Task 1 commit)

**2. [Rule 3 - Blocking] Registered `013_form_field_definitions_schema` in schema_migrations**
- **Found during:** Task 1 (migration run — `npm run migrate`)
- **Issue:** Migration 013_form_field_definitions_schema was applied to DB during Plan 04-03 but never registered in `schema_migrations` table; alphabetical sort caused budget migration to run first, then re-running form_field migration failed with "relation already exists"
- **Fix:** `INSERT INTO schema_migrations (version) VALUES ('013_form_field_definitions_schema') ON CONFLICT DO NOTHING` — registers the migration as already applied
- **Files modified:** DB `schema_migrations` table (runtime fix, not file)
- **Verification:** `npm run migrate` completes cleanly with "All migrations complete"
- **Committed in:** `3360070` (migration ran as part of task setup)

**3. [Rule 1 - Bug] Fixed column name in attachment integration test setup**
- **Found during:** Task 1 (attachment tests — beforeAll fails)
- **Issue:** Test used `document_name` column but actual `attachment_requirements` schema has `custom_document_name` + `created_by` (NOT NULL)
- **Fix:** Updated INSERT to use `custom_document_name` and include `created_by` param
- **Files modified:** `tests/integration/workspaceAttachments.test.ts`
- **Verification:** All 7 attachment integration tests pass after fix
- **Committed in:** `3360070` (part of Task 1 commit)

---

**Total deviations:** 3 auto-fixed (2 Rule 1 - Bug, 1 Rule 3 - Blocking)
**Impact on plan:** All auto-fixes required for correctness or test execution. No scope creep. Match validation deferred (schema gap, not implementation gap).

## Issues Encountered

- E2E Playwright tests written but not executed (per test_execution_boundary rules: E2E tests deferred to verify phase to avoid hanging browser processes). Tests written; execution deferred to verify phase.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 4 complete: all 4 plans delivered — workspace creation + sections (04-01), readiness dashboard + grantor privacy (04-02), form field capture (04-03), budget + attachments + preview (04-04)
- Ready for Phase 5 (Submission & Intake Screening): workspace, budget, attachments, and preview API all available for submission package assembly
- Potential follow-up: add `match_requirement` column to `opportunities` table when match validation is needed (Phase 5 or later)

## Self-Check: PASSED

All key files verified present on disk. Both task commits (3360070, 371e520) confirmed in git log.

---
*Phase: 04-application-workspace-form-capture*
*Completed: 2026-07-26*
