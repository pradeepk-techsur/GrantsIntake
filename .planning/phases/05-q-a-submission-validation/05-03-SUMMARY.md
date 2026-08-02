---
phase: 05-q-a-submission-validation
plan: 03
subsystem: submission
tags: [submission, snapshot, immutability, confirmation-number, workspace-lock, uswds, playwright]

# Dependency graph
requires:
  - phase: 05-q-a-submission-validation
    provides: submission_snapshots schema, certifications table, immutability triggers (plan 01); validationService, certificationService (plan 02)
provides:
  - submissionService (submit, getReceipt, getSnapshot)
  - POST /workspaces/:id/submit route
  - GET /workspaces/:id/receipt route
  - GET /submissions/:snapshotId route (grantor-accessible)
  - CertifySubmitPage and SubmissionReceiptPage UI
  - WorkspacePage locked state banner
  - submission_snapshots rows with GI-YEAR-8digit confirmation numbers
affects: [06-intake-review-queue]

# Tech tracking
tech-stack:
  added: []
  patterns: [immutable-snapshot-INSERT-with-precomputed-paths, confirmation-number-MAX-plus-1, immutable-table-trigger-cleanup-in-tests]

key-files:
  created:
    - src/services/workspace/submissionService.ts
    - tests/integration/workspaceSubmission.test.ts
    - client/src/types/submission.ts
    - client/src/api/submissionApi.ts
    - client/src/pages/applicant/CertifySubmitPage.tsx
    - client/src/pages/applicant/SubmissionReceiptPage.tsx
    - e2e/workspaceSubmission.spec.ts
  modified:
    - src/routes/workspaces.ts
    - src/server.ts
    - client/src/App.tsx
    - client/src/pages/applicant/WorkspacePage.tsx
    - client/src/components/workspace/ReadinessDashboard.tsx

key-decisions:
  - "Package paths (human_readable_pdf_path, machine_readable_json_path) computed before INSERT to avoid post-INSERT UPDATE on immutable table"
  - "Confirmation number uses MAX()+1 with UNIQUE constraint as collision guard; paths derived from confirmation_number (not snapshot_id)"
  - "GET /submissions/:snapshotId mounted on server.ts (not workspacesRouter) to allow grantor access in Phase 6 — blockGrantorOnWorkspace middleware only applies to workspacesRouter"
  - "ReadinessDashboard Submit button uses react-router navigate() instead of window.location.href for SPA-safe navigation"
  - "Ephemeral opportunities created per test case to avoid uq_workspace_org_opp constraint violation"

patterns-established:
  - "Pattern: Immutable table INSERT with precomputed derived fields (no post-INSERT UPDATE needed)"
  - "Pattern: Separate router mounting for cross-role access (grantor + applicant routes on different routers)"

# Metrics
duration: 11min
completed: 2026-07-31
---

# Phase 5 Plan 3: Submission Orchestration Summary

**Full submission pipeline with GI-YEAR-8digit confirmation numbers, immutable snapshots, workspace locking, CertifySubmitPage checklist, SubmissionReceiptPage, and locked WorkspacePage banner**

## Performance

- **Duration:** 11 min
- **Started:** 2026-07-31T02:44:50Z
- **Completed:** 2026-07-31T02:56:38Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Complete submission orchestration pipeline: validate → cert check → confirmation# → snapshot INSERT → workspace lock → audit event
- CertifySubmitPage with 4-item pre-submission checklist (completion, AR, certification, no blockers) and gated submit button
- SubmissionReceiptPage with prominent confirmation number display, submission details, download links, and locked workspace notice
- WorkspacePage locked state banner with receipt link when is_locked=true
- 12 integration tests covering full submission lifecycle including immutability trigger verification
- 7 Playwright e2e tests covering UI rendering, disabled states, navigation wiring

## Task Commits

Each task was committed atomically:

1. **Task 1: Submission service + routes + integration tests** - `f4a8251` (feat)
2. **Task 2: CertifySubmitPage + SubmissionReceiptPage + locked workspace state + App.tsx wiring** - `c5f8f83` (feat)

## Files Created/Modified
- `src/services/workspace/submissionService.ts` - Full submission orchestration (validate → confirm# → snapshot → lock → audit)
- `src/routes/workspaces.ts` - POST /submit, GET /receipt routes with IDOR guards
- `src/server.ts` - GET /submissions/:snapshotId (grantor-accessible, outside workspace router)
- `tests/integration/workspaceSubmission.test.ts` - 12 integration tests with immutable table cleanup pattern
- `client/src/types/submission.ts` - SubmissionConfirmation, ReceiptData, SubmissionBlockedError types
- `client/src/api/submissionApi.ts` - submit() and getReceipt() API client
- `client/src/pages/applicant/CertifySubmitPage.tsx` - Pre-submission checklist + confirm button
- `client/src/pages/applicant/SubmissionReceiptPage.tsx` - Post-submission receipt with confirmation number
- `client/src/pages/applicant/WorkspacePage.tsx` - Locked state banner with receipt link
- `client/src/components/workspace/ReadinessDashboard.tsx` - Submit button navigates to CertifySubmitPage
- `client/src/App.tsx` - Routes for certify-submit and receipt pages
- `e2e/workspaceSubmission.spec.ts` - 7 Playwright tests for UI and navigation

## Decisions Made
- Package paths (human_readable_pdf_path, machine_readable_json_path) precomputed from confirmation_number before INSERT — avoids UPDATE on immutable table
- GET /submissions/:snapshotId mounted directly on express app (not workspacesRouter) — allows grantor access in Phase 6 without blockGrantorOnWorkspace interference
- ReadinessDashboard Submit button uses react-router navigate() for SPA-safe navigation (replaces window.location.href)
- Integration tests create separate opportunities per test case to avoid uq_workspace_org_opp unique constraint on (opportunity_id, org_id)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed unique workspace constraint violations in tests**
- **Found during:** Task 1 (integration tests)
- **Issue:** Tests creating multiple workspaces for same org+opportunity hit uq_workspace_org_opp constraint
- **Fix:** Created separate opportunities per test case instead of reusing the same opportunity
- **Files modified:** tests/integration/workspaceSubmission.test.ts
- **Verification:** All 12 tests pass
- **Committed in:** f4a8251 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential for test correctness. No scope creep.

## Known Stubs

None found.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 5 complete — all 3 plans (05-01 schema, 05-02 validation/certification, 05-03 submission) delivered
- Phase 6 can consume submission_snapshots via `SELECT ... FROM submission_snapshots WHERE is_current = true`
- Phase 6 can read workspace lock status via application_workspaces.is_locked
- GET /submissions/:snapshotId already available for grantor intake queue

## Self-Check: PASSED

- All 7 created files exist on disk
- Both task commits (f4a8251, c5f8f83) verified in git log
- Build check: `npx tsc --noEmit` → exit 0
- Known Stubs section: None found
- 12 integration tests passed, 7 Playwright e2e tests passed

---
*Phase: 05-q-a-submission-validation*
*Completed: 2026-07-31*
