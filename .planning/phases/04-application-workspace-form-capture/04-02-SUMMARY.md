---
phase: 04-application-workspace-form-capture
plan: 02
subsystem: api
tags: [workspace, readiness, middleware, react-query, uswds, express, postgresql]

# Dependency graph
requires:
  - phase: 04-application-workspace-form-capture
    plan: 01
    provides: workspacesRouter, workspaceService.verifyWorkspaceMember, application_workspaces, application_sections tables, GRANTOR_ROLES
  - phase: 01-platform-foundation-opportunity-setup
    provides: authenticate middleware, GRANTOR_ROLES, Two-step IDOR guard pattern
provides:
  - blockGrantorOnWorkspace middleware applied at router level — returns 403 WORKSPACE_GRANTEE_PRIVATE for ANY grantor role on ANY workspace route
  - readinessService.computeReadiness(workspaceId) → ReadinessSummary
  - GET /api/v1/workspaces/:id/readiness endpoint
  - ReadinessDashboard React component with 30s polling
  - WorkspacePage 3-column layout (sidebar 3, content 6, readiness 3)
affects:
  - 04-03-budget-module (readiness must reflect budget section completion)
  - 04-04-submission-flow (readiness is_ready_to_submit gate for submission)
  - 04-04-preview-generation (readiness must show preview readiness per PRD-INTAKE-043)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Router-level middleware for uniform grantor block (blockGrantorOnWorkspace at workspacesRouter.use())
    - ReadinessSummary computed from section status ratios + org_roles JSONB query
    - Graceful fallback for missing future-phase tables (42P01 error code guard on attachments join)
    - React Query polling (refetchInterval: 30000) for live dashboard updates (no WebSocket)

key-files:
  created:
    - src/middleware/blockGrantorOnWorkspace.ts
    - src/services/workspace/readinessService.ts
    - tests/integration/workspaceReadiness.test.ts
    - client/src/components/workspace/ReadinessDashboard.tsx
    - e2e/workspaceReadiness.spec.ts
  modified:
    - src/routes/workspaces.ts (router-level middleware + readiness route)
    - tests/integration/workspaces.test.ts (updated 3 tests to WORKSPACE_GRANTEE_PRIVATE)
    - client/src/types/workspace.ts (ReadinessSummary interface added)
    - client/src/api/workspaceApi.ts (getReadiness method added)
    - client/src/pages/applicant/WorkspacePage.tsx (3-column layout + ReadinessDashboard)

key-decisions:
  - "blockGrantorOnWorkspace at workspacesRouter.use() level — blanket block on ALL workspace routes replaces per-route blockGrantors() on comments"
  - "readinessService gracefully handles missing attachments table via 42P01 error code guard (table created in future phase)"
  - "ReadinessDashboard uses refetchInterval: 30000 + staleTime: 20000 (React Query polling, no WebSocket)"
  - "WorkspacePage 3-column USWDS grid: 3+6+3 cols for sidebar+content+readiness"

patterns-established:
  - "Router-level middleware: workspacesRouter.use(authenticate); workspacesRouter.use(blockGrantorOnWorkspace) — runs before ALL route handlers, cannot be bypassed"
  - "Future-phase table guard: catch 42P01 (undefined_table) in service, skip silently, return empty collection"

# Metrics
duration: 7min
completed: 2026-07-26
---

# Phase 4 Plan 02: Readiness Dashboard & Grantor Privacy Middleware Summary

**blockGrantorOnWorkspace middleware at router level blocks ALL grantor roles on ALL workspace routes, plus readinessService.computeReadiness() feeding a React Query-polled ReadinessDashboard in WorkspacePage's new 3-column layout**

## Performance

- **Duration:** 7 min
- **Started:** 2026-07-26T19:13:13Z
- **Completed:** 2026-07-26T19:20:19Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- `blockGrantorOnWorkspace` middleware applied at `workspacesRouter.use()` level — ALL workspace routes return 403 `WORKSPACE_GRANTEE_PRIVATE` for any grantor role token (PRD-INTAKE-036 / T-04-07)
- `readinessService.computeReadiness(workspaceId)` computes full ReadinessSummary: overall_completion_pct from visible sections with status='complete', blocking_errors from JSONB validation_errors, authorized_rep_assigned from org_roles JSONB query, attachment_status with graceful 42P01 fallback
- GET /api/v1/workspaces/:id/readiness endpoint with two-step IDOR guard (EXISTS→404, membership→403)
- `ReadinessDashboard` React component with refetchInterval:30000 React Query polling (no WebSocket), rendering completion %, ready-to-submit badge, auth rep status, blocking errors with links, warnings, attachment status
- WorkspacePage updated to 3-column USWDS grid (3+6+3: sidebar, section content, readiness panel)
- 10 integration tests all pass; existing 13 workspace tests updated and still pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Draft privacy middleware + readinessService + GET /readiness + integration tests** - `75e15b4` (feat)
2. **Task 2: ReadinessDashboard + WorkspacePage 3-column layout** - `15823f1` (feat)

**Plan metadata:** see docs commit below

## Files Created/Modified

- `src/middleware/blockGrantorOnWorkspace.ts` — PRD-INTAKE-036 blanket grantor block middleware
- `src/services/workspace/readinessService.ts` — ReadinessSummary computation with 42P01 fallback
- `src/routes/workspaces.ts` — Router-level middleware + GET /readiness route
- `tests/integration/workspaceReadiness.test.ts` — 10 integration tests (all passing)
- `tests/integration/workspaces.test.ts` — Updated 3 tests to WORKSPACE_GRANTEE_PRIVATE error code
- `client/src/types/workspace.ts` — ReadinessSummary TypeScript interface
- `client/src/api/workspaceApi.ts` — getReadiness(workspaceId) method
- `client/src/components/workspace/ReadinessDashboard.tsx` — Polling readiness dashboard component
- `client/src/pages/applicant/WorkspacePage.tsx` — 3-column layout with ReadinessDashboard in right col
- `e2e/workspaceReadiness.spec.ts` — 4 Playwright E2E tests (deferred to verify phase)

## Decisions Made

- **Router-level middleware over per-route**: `workspacesRouter.use(blockGrantorOnWorkspace)` ensures no route can accidentally bypass the grantor block. The previous per-route `blockGrantors()` on comments only was insufficient for PRD-INTAKE-036 which requires ALL workspace endpoints to be blocked.
- **42P01 graceful fallback**: `attachments` table doesn't exist yet (planned for future phase). Rather than adding a migration now, the readinessService catches `code: '42P01'` (PostgreSQL "undefined_table") and returns empty attachment_status. Any other error is re-thrown. This keeps the service correct today and naturally becomes functional when the attachment phase runs.
- **React Query polling, no WebSocket**: ws library is not in package.json. refetchInterval:30000 + staleTime:20000 achieves live readiness updates with no infrastructure cost.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated existing workspace tests for new error code**
- **Found during:** Task 1 (workspaces.test.ts compatibility check)
- **Issue:** Existing tests expected `GRANTOR_ACCESS_DENIED` (old per-route error code) but new `blockGrantorOnWorkspace` middleware returns `WORKSPACE_GRANTEE_PRIVATE`
- **Fix:** Updated 3 test assertions in workspaces.test.ts to match new error code; also updated test description to clarify blanket middleware behavior
- **Files modified:** tests/integration/workspaces.test.ts
- **Verification:** All 13 existing workspace tests still pass after fix
- **Committed in:** 75e15b4 (Task 1 commit)

**2. [Rule 1 - Bug] Graceful 42P01 handling for missing attachments table**
- **Found during:** Task 1 (first integration test run — 500 on GET /readiness)
- **Issue:** readinessService queried `LEFT JOIN attachments a` but `attachments` table not yet migrated (planned for future phase); caused "relation does not exist" 500 error
- **Fix:** Wrapped attachment query in try/catch; catches `pgErr.code === '42P01'` silently, re-throws all other errors. Returns empty `attachment_status: []` when table absent.
- **Files modified:** src/services/workspace/readinessService.ts
- **Verification:** GET /readiness returns 200 with empty attachment_status; 10 tests pass
- **Committed in:** 75e15b4 (Task 1 commit)

**3. [Rule 1 - Bug] Non-member cleanup test needed audit_events FK guard**
- **Found during:** Task 1 (integration test cleanup)
- **Issue:** Inline test cleanup for non-member user hit FK constraint from audit_events (login creates audit row)
- **Fix:** Added `DISABLE/ENABLE TRIGGER audit_events_immutable` around audit_events DELETE before user DELETE
- **Files modified:** tests/integration/workspaceReadiness.test.ts
- **Verification:** Test cleanup succeeds, 10 tests pass
- **Committed in:** 75e15b4 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1 - Bug)
**Impact on plan:** All fixes essential for correctness. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- blockGrantorOnWorkspace middleware permanently applied — all grantor roles blocked from workspace endpoints
- GET /workspaces/:id/readiness operational; returns ReadinessSummary with all 8 required fields
- ReadinessDashboard polling every 30s visible in WorkspacePage right column
- Integration tests: 23 total passing (10 new + 13 existing)
- attachment_status will auto-populate when attachments migration runs in future phase (42P01 guard in place)
- E2E tests written in e2e/workspaceReadiness.spec.ts; execution deferred to verify phase
- Ready for Phase 04 Plans 03–04 (narrative form fields, budget module, submission flow)

---
*Phase: 04-application-workspace-form-capture*
*Completed: 2026-07-26*

## Self-Check: PASSED

All key files confirmed present on disk:
- `src/middleware/blockGrantorOnWorkspace.ts` ✓
- `src/services/workspace/readinessService.ts` ✓
- `src/routes/workspaces.ts` ✓ (readiness route + router-level middleware)
- `tests/integration/workspaceReadiness.test.ts` ✓
- `client/src/components/workspace/ReadinessDashboard.tsx` ✓
- `client/src/pages/applicant/WorkspacePage.tsx` ✓ (3-column layout)
- `e2e/workspaceReadiness.spec.ts` ✓

Both commits (75e15b4, 15823f1) verified in git log.
