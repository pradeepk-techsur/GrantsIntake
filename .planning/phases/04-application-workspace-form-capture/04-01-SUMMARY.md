---
phase: 04-application-workspace-form-capture
plan: 01
subsystem: api
tags: [workspace, postgresql, express, react, zustand, react-query, uswds]

# Dependency graph
requires:
  - phase: 03-organization-profile-eligibility-pre-screening
    provides: organizationService.getOrgIdForUser, verifyOrgMember, org_roles table, organizations table
  - phase: 01-platform-foundation-opportunity-setup
    provides: authenticate middleware, audit_events, Two-step IDOR guard pattern, GRANTOR_ROLES
provides:
  - application_workspaces table with UNIQUE(opportunity_id, org_id) constraint
  - application_sections table with 9 auto-created sections per workspace
  - workspace_tasks table for assignable tasks
  - workspace_comments table (grantee-private, grantor-blocked at router)
  - workspaceService with createWorkspace, getWorkspace, listSections, assignSection, createTask, addComment
  - workspacesRouter with full REST API including grantor-block on comments
  - WorkspaceListPage at /applicant/applications (USWDS card-group)
  - WorkspacePage at /applicant/workspaces/:workspaceId (section sidebar + panel swap)
affects:
  - 04-02-narrative-form-fields (depends on application_sections)
  - 04-03-budget-module (depends on workspace schema and service)
  - 04-04-submission-flow (depends on workspace status transitions)

# Tech tracking
tech-stack:
  added: [zustand (client workspaceStore)]
  patterns:
    - Two-step IDOR guard (EXISTS→404, then membership→403)
    - org_id derived server-side via organizationService.getOrgIdForUser (never from request body)
    - Grantor block at router layer (before IDOR guard) — hardcoded, not bypassable
    - Workspace + 9 sections created atomically in DB transaction
    - Section switching via Zustand store (no URL change)
    - React Query for server state; Zustand for UI state

key-files:
  created:
    - src/db/migrations/012_workspace_schema.sql
    - src/types/workspace.ts
    - src/services/workspace/workspaceService.ts
    - src/routes/workspaces.ts
    - tests/integration/workspaces.test.ts
    - client/src/types/workspace.ts
    - client/src/api/workspaceApi.ts
    - client/src/store/workspaceStore.ts
    - client/src/components/workspace/WorkspaceSidebar.tsx
    - client/src/components/workspace/WorkspaceSectionPanel.tsx
    - client/src/pages/applicant/WorkspaceListPage.tsx
    - client/src/pages/applicant/WorkspacePage.tsx
    - e2e/workspace.spec.ts
  modified:
    - src/server.ts (workspacesRouter mount)
    - client/src/App.tsx (WorkspaceListPage + WorkspacePage routes)
    - client/src/components/nav/ApplicantSidebar.tsx (data-testid="nav-my-applications")

key-decisions:
  - "GRANTOR_BLOCK at router layer before IDOR guard — prevents grantor roles from discovering workspace existence via timing (T-04-03)"
  - "Two-step IDOR guard: workspace EXISTS check (404) then org membership check (403) — prevents org enumeration (T-04-02)"
  - "Section assignment role check via DB query (not JWT roles) — org_roles not in JWT payload, mirrors T-03-22 pattern"
  - "workspace_comments visibility permanently internal; grantor block is hardcoded in router, cannot be bypassed"
  - "Zustand for activeSectionType UI state; React Query for server state — section switching is in-page, no URL change"
  - "Auto-create 9 DEFAULT_SECTIONS in same transaction as workspace creation — atomicity guarantees sections always exist"

patterns-established:
  - "Workspace creation: derive org_id server-side → INSERT → catch 23505 → 409 DUPLICATE_WORKSPACE"
  - "Grantor block pattern: GRANTOR_ROLES.some(r => userRoles.includes(r)) → 403 before IDOR check"
  - "Section panel swap: Zustand activeSectionType → WorkspaceSidebar click → setActiveSectionType → WorkspaceSectionPanel re-renders"

# Metrics
duration: 9min
completed: 2026-07-26
---

# Phase 4 Plan 01: Application Workspace Foundation Summary

**Migration 012 workspace schema (4 tables), WorkspaceService with 9-section auto-creation and grantor-blocking, full REST API with two-step IDOR guard, and React workspace UI with in-page section switching via Zustand**

## Performance

- **Duration:** 9 min
- **Started:** 2026-07-26T18:59:31Z
- **Completed:** 2026-07-26T19:08:24Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments

- Migration 012 applied: `application_workspaces` (UNIQUE org+opportunity), `application_sections` (9 per workspace), `workspace_tasks`, `workspace_comments` (grantor-blocked at router)
- WorkspaceService with transactional workspace+sections creation, DUPLICATE_WORKSPACE detection, verifyWorkspaceMember IDOR guard
- workspacesRouter mounted with 11 endpoints; comments permanently blocked for GRANTOR_ROLES at router layer (T-04-03); section assignment requires proposal_lead or org_admin (T-04-04)
- React UI: WorkspaceListPage (USWDS cards with empty state), WorkspacePage (two-column: sidebar + panel swap), WorkspaceSidebar (status badges), WorkspaceSectionPanel (tasks + comments + comment form)
- App.tsx updated: `/applicant/applications` → WorkspaceListPage, `/applicant/workspaces/:workspaceId` → WorkspacePage
- 13 integration tests pass (0 failing): covers 201 create, 409 duplicate, 401 unauth, 200 GET, 403 non-member, 9 sections, assignment, tasks, comments, grantor 403

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration 012 + WorkspaceService + workspace REST API** - `7b52a49` (feat)
2. **Task 2: Workspace React UI** - `579dc1d` (feat)

**Plan metadata:** (see docs commit below)

## Files Created/Modified

- `src/db/migrations/012_workspace_schema.sql` — 4 workspace tables + eligibility_responses FK
- `src/types/workspace.ts` — TypeScript interfaces for all workspace entities
- `src/services/workspace/workspaceService.ts` — WorkspaceService with 12 methods
- `src/routes/workspaces.ts` — 11 REST endpoints with IDOR guard and grantor block
- `src/server.ts` — Added workspacesRouter mount after organizationsRouter
- `tests/integration/workspaces.test.ts` — 13 integration tests (all passing)
- `client/src/types/workspace.ts` — Frontend type mirrors
- `client/src/api/workspaceApi.ts` — Axios API client for all workspace endpoints
- `client/src/store/workspaceStore.ts` — Zustand store (activeSectionType, isSidebarCollapsed)
- `client/src/components/workspace/WorkspaceSidebar.tsx` — Section nav with status badges
- `client/src/components/workspace/WorkspaceSectionPanel.tsx` — Section detail, tasks, comments
- `client/src/pages/applicant/WorkspaceListPage.tsx` — /applicant/applications page
- `client/src/pages/applicant/WorkspacePage.tsx` — /applicant/workspaces/:workspaceId page
- `client/src/App.tsx` — Replaced Phase 3 placeholder with workspace routes
- `client/src/components/nav/ApplicantSidebar.tsx` — Added data-testid="nav-my-applications"
- `e2e/workspace.spec.ts` — 4 Playwright tests written (deferred to verify phase)

## Decisions Made

- **GRANTOR_BLOCK before IDOR guard**: Grantor roles get 403 GRANTOR_ACCESS_DENIED before even checking if workspace exists. This prevents information disclosure via timing differences between "exists but you're blocked" vs "doesn't exist". Required by T-04-03.
- **Section assignment via DB query**: The JWT only contains grantor_roles; org_roles are not in the token. Followed T-03-22 pattern from Phase 3 — query `org_roles @> '["proposal_lead"]'::jsonb` directly.
- **Zustand for section state**: React Query manages server state; Zustand manages the active section type. Section switching is purely in-page state — no URL navigation, no re-fetching workspace data.
- **Atomic transaction for workspace + sections**: Both INSERT statements (workspace row + 9 section rows) run in a single transaction. Failure rolls back both.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed wrong audit_events column names**
- **Found during:** Task 1 (first integration test run)
- **Issue:** workspaceService used `action` and `details` column names; actual schema uses `event_type` and `payload`
- **Fix:** Corrected INSERT statement to `event_type, actor_user_id, entity_type, entity_id, payload`
- **Files modified:** src/services/workspace/workspaceService.ts
- **Verification:** Integration tests passed after fix (13/13)
- **Committed in:** 7b52a49 (Task 1 commit)

**2. [Rule 3 - Blocking] Installed missing zustand dependency in client**
- **Found during:** Task 2 (client build check)
- **Issue:** zustand in client/package.json but not installed in node_modules (client npm install not run)
- **Fix:** Ran `npm install` in client directory to install all dependencies
- **Files modified:** client/node_modules/zustand (runtime only, not in git)
- **Verification:** `npm run build` succeeded after install
- **Committed in:** 579dc1d (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both auto-fixes essential for correctness. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Migration 012 applied; application_workspaces, application_sections, workspace_tasks, workspace_comments all exist in DB
- workspacesRouter mounted at /api/v1 — all endpoints tested and operational
- WorkspacePage + WorkspaceListPage wired into App.tsx
- Ready for Phase 4 Plans 02–04 (narrative form fields, budget module, submission flow)
- Playwright tests written in e2e/workspace.spec.ts; execution deferred to verify phase

---
*Phase: 04-application-workspace-form-capture*
*Completed: 2026-07-26*

## Self-Check: PASSED

All key files confirmed present on disk. Both commits (7b52a49, 579dc1d) verified in git log.
