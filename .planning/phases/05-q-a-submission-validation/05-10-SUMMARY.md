---
phase: 05-q-a-submission-validation
plan: 10
subsystem: ui
tags: [react, typescript, workspace, locked-state, read-only, playwright]

# Dependency graph
requires:
  - phase: 05-q-a-submission-validation
    provides: "workspace.is_locked flag set by submissionService after successful submission"
provides:
  - "WorkspaceSectionPanel.isLocked prop threads locked state down component tree"
  - "SectionFormPanel.isLocked disables all FormFieldRenderer inputs and suppresses saves"
  - "BudgetBuilder.isLocked disables Add/Remove line item controls and all inputs"
  - "AttachmentManager.isLocked disables upload, link, and delete controls"
  - "Playwright advisory e2e spec for locked workspace verification"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "isLocked prop-threading: top-level page passes server flag down component tree to disable all interactive elements"
    - "handleFieldBlur early-return pattern: locked state suppresses saves and validation at the handler level"

key-files:
  created:
    - e2e/workspaceLocked.spec.ts
  modified:
    - client/src/pages/applicant/WorkspacePage.tsx
    - client/src/components/workspace/WorkspaceSectionPanel.tsx
    - client/src/components/workspace/SectionFormPanel.tsx
    - client/src/components/workspace/BudgetBuilder.tsx
    - client/src/components/workspace/AttachmentManager.tsx

key-decisions:
  - "Pure prop-threading approach — no new state or context needed; workspace.is_locked flows as isLocked prop through existing component hierarchy"
  - "handleFieldBlur returns early when isLocked to prevent mutation calls on blur events in locked state"
  - "Playwright test uses advisory pattern — conditional on workspace being in locked state (requires prior submission flow)"
  - "Read-only notice rendered in WorkspaceSectionPanel (not SectionFormPanel) so it appears once per section above all content types"

patterns-established:
  - "isLocked prop threading: PRD-INTAKE-054 pattern for post-submission read-only enforcement at UI layer"

# Metrics
duration: 3min
completed: 2026-08-01
---

# Phase 5 Plan 10: Locked Workspace Read-Only Enforcement Summary

**Pure prop-threading of workspace.is_locked through WorkspacePage → WorkspaceSectionPanel → SectionFormPanel/BudgetBuilder/AttachmentManager, disabling all form inputs, budget controls, and upload controls after submission**

## Performance

- **Duration:** 3 min
- **Started:** 2026-08-01T03:08:08Z
- **Completed:** 2026-08-01T03:11:47Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Wired `workspace.is_locked` from WorkspacePage down to all interactive components via `isLocked` prop
- All form fields (`input`, `textarea`, `select`) receive `disabled={isLocked}` via FormFieldRenderer
- `handleFieldBlur` returns early when locked, preventing any save/validate mutations from firing
- BudgetBuilder disables Add Line Item buttons, Remove buttons, and all inline form inputs when locked
- AttachmentManager disables Upload New File, Link from Library, and Delete buttons when locked
- Section-level read-only notice renders in each section when `isLocked=true`
- Advisory Playwright spec created verifying locked state UI behavior

## Task Commits

Each task was committed atomically:

1. **Task 1: Thread isLocked prop from WorkspacePage through WorkspaceSectionPanel and SectionFormPanel to FormFieldRenderer** - `0e10c09` (feat)
2. **Task 2: Add isLocked support to BudgetBuilder and AttachmentManager, and write Playwright locked-workspace test** - `9ffb6ae` (feat)

## Files Created/Modified
- `client/src/pages/applicant/WorkspacePage.tsx` - Added `isLocked={workspace?.is_locked ?? false}` to WorkspaceSectionPanel
- `client/src/components/workspace/WorkspaceSectionPanel.tsx` - Added `isLocked?: boolean` prop; threads to SectionFormPanel, BudgetBuilder, AttachmentManager; renders read-only notice
- `client/src/components/workspace/SectionFormPanel.tsx` - Added `isLocked?: boolean` prop; passes `disabled={isLocked}` to FormFieldRenderer; handleFieldBlur returns early when locked
- `client/src/components/workspace/BudgetBuilder.tsx` - Added `isLocked?: boolean` prop; disables Add Line Item, Remove, and all inline form inputs
- `client/src/components/workspace/AttachmentManager.tsx` - Added `isLocked?: boolean` prop; disables Upload, Link from Library, Delete, and file input
- `e2e/workspaceLocked.spec.ts` - New Playwright advisory spec verifying locked state disables form fields, budget controls, and attachment upload controls

## Decisions Made
- Pure prop-threading approach (no new context/state) — `workspace.is_locked` is already available in WorkspacePage from the workspace query; passing it as `isLocked` prop is the minimal, correct fix
- `handleFieldBlur` returns early when locked to prevent unnecessary mutation calls rather than relying solely on disabled attribute
- Advisory Playwright test pattern — locked state depends on prior submission flow; test is meaningful when run after workspaceSubmission.spec.ts

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Known Stubs
None found — the one `placeholder` match is a HTML textarea `placeholder` attribute for the internal comment input (cosmetic HTML UI text, not a code stub).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 5 Plan 10 complete — PRD-INTAKE-054 locked workspace read-only enforcement implemented at UI layer
- Server-side enforcement of locked state (rejecting mutations on locked workspaces) was established in Phase 05-03 (submissionService sets is_locked=true, workspace route guards check is_locked)
- Ready for Phase 6 (analytics and notifications) or Phase 5 verification

## Self-Check: PASSED
- `client/src/components/workspace/WorkspaceSectionPanel.tsx` — exists with isLocked prop ✓
- `client/src/components/workspace/SectionFormPanel.tsx` — exists with isLocked prop ✓
- `client/src/components/workspace/BudgetBuilder.tsx` — exists with isLocked prop ✓
- `client/src/components/workspace/AttachmentManager.tsx` — exists with isLocked prop ✓
- `e2e/workspaceLocked.spec.ts` — created ✓
- Build check: `npx tsc --noEmit --project client/tsconfig.json` → exit 0 ✓
- Commits 0e10c09 and 9ffb6ae present ✓
- No blocking stubs ✓

---
*Phase: 05-q-a-submission-validation*
*Completed: 2026-08-01*
