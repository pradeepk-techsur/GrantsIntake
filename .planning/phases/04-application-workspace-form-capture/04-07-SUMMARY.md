---
phase: 04-application-workspace-form-capture
plan: 07
subsystem: ui
tags: [react, react-router-dom, tanstack-query, uswds, workspace, preview]

# Dependency graph
requires:
  - phase: 04-application-workspace-form-capture
    provides: workspaceApi.createWorkspace, /applicant/workspaces/:id/preview route
provides:
  - Start Application CTA in OpportunityDetailPage with POST mutation + navigate
  - Continue Application href corrected to /applicant/workspaces/:id
  - Preview Application link in WorkspacePage header
  - Preview Application link in ReadinessDashboard card footer
  - E2E test for preview link navigation
affects: [04-application-workspace-form-capture]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useMutation for workspace creation with onSuccess navigate + 409 DUPLICATE_WORKSPACE handler"
    - "Link component for preview navigation from WorkspacePage header and ReadinessDashboard footer"

key-files:
  created: []
  modified:
    - client/src/pages/applicant/OpportunityDetailPage.tsx
    - client/src/pages/applicant/WorkspacePage.tsx
    - client/src/components/workspace/ReadinessDashboard.tsx
    - e2e/workspacePreview.spec.ts

key-decisions:
  - "useMutation wraps workspaceApi.createWorkspace; on 409 DUPLICATE_WORKSPACE navigates to existing workspace id if provided in error body"
  - "Preview Application Link placed in WorkspacePage page header (after opportunity hint) and ReadinessDashboard usa-card__footer"

patterns-established:
  - "Pattern: Start/Continue Application CTA uses react-router navigate (not href) to stay within SPA context"

# Metrics
duration: 2min
completed: 2026-07-28
---

# Phase 4 Plan 7: Fix Start/Continue Application CTAs and Add Preview Application Links Summary

**Gap closure: Start Application now POSTs to /api/v1/workspaces via useMutation and navigates to /applicant/workspaces/:id; Continue Application href fixed to /applicant prefix; Preview Application links added to WorkspacePage header and ReadinessDashboard footer**

## Performance

- **Duration:** 2 min
- **Started:** 2026-07-28T03:09:38Z
- **Completed:** 2026-07-28T03:11:38Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Fixed broken `Start Application` CTA: replaced `<a href="/apply/:id">` with `<button>` calling `useMutation(workspaceApi.createWorkspace)` → navigate to created workspace on success, handle 409 DUPLICATE_WORKSPACE gracefully
- Fixed `Continue Application` href: changed `/workspaces/:id` to `/applicant/workspaces/:id` (missing `/applicant` prefix)
- Added `Preview Application` link (data-testid=`preview-application-link`) in WorkspacePage page header → `/applicant/workspaces/:id/preview`
- Added `Preview Application` link (data-testid=`readiness-preview-link`) in ReadinessDashboard `usa-card__footer`
- Added E2E test in `workspacePreview.spec.ts` that logs in, navigates to workspace page, clicks the preview link, and verifies `/preview` URL and DRAFT PREVIEW text

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Start Application CTA and Continue Application href** - `8981c4c` (feat)
2. **Task 2: Add Preview Application link to WorkspacePage and ReadinessDashboard** - `e8f97e0` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `client/src/pages/applicant/OpportunityDetailPage.tsx` — Added useMutation for workspace creation, useNavigate, fixed renderCTA() for Start Application (button with mutation) and Continue Application (correct /applicant prefix)
- `client/src/pages/applicant/WorkspacePage.tsx` — Added Link import, added Preview Application link in page header
- `client/src/components/workspace/ReadinessDashboard.tsx` — Added Link import, added usa-card__footer with Preview Application link
- `e2e/workspacePreview.spec.ts` — Added test that clicks preview-application-link from workspace page and verifies preview navigation

## Decisions Made
- Used `useMutation` from `@tanstack/react-query` for the Start Application action (POST /workspaces) — consistent with existing patterns in the codebase
- 409 DUPLICATE_WORKSPACE handler navigates to the existing workspace when `workspace_id` is present in error response body; gracefully does nothing otherwise (no alert, per plan guidance)
- Preview Application link uses `<Link>` (react-router SPA navigation) not `<a>` — avoids full page reload inside the SPA

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None found.

## Self-Check: PASSED

- `client/src/pages/applicant/OpportunityDetailPage.tsx` — EXISTS ✓
- `client/src/pages/applicant/WorkspacePage.tsx` — EXISTS ✓
- `client/src/components/workspace/ReadinessDashboard.tsx` — EXISTS ✓
- `e2e/workspacePreview.spec.ts` — EXISTS ✓
- Task commits 8981c4c, e8f97e0 — FOUND ✓
- Build check: `npx tsc --noEmit` → exit 0 ✓
- Test suite: 220/220 passed ✓
- No blocking stubs ✓

## Next Phase Readiness
- UAT Test 2 (Start Application) and Test 10 (Continue Application href, Preview link) gaps are now closed
- Applicants can create workspaces from OpportunityDetailPage and navigate to them
- Applicants can reach the preview route from within the workspace UI via both the page header link and the ReadinessDashboard footer link
- All 220 existing integration tests continue to pass

---
*Phase: 04-application-workspace-form-capture*
*Completed: 2026-07-28*
