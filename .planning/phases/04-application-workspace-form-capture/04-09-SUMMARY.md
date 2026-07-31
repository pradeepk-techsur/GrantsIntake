---
phase: 04-application-workspace-form-capture
plan: 09
subsystem: ui
tags: [uswds, react, typescript, accessibility, wcag]

# Dependency graph
requires:
  - phase: 04-application-workspace-form-capture
    provides: AttachmentManager component with upload/delete/versioning functionality
provides:
  - USWDS-conformant AttachmentManager with usa-button-group, clip-positioned file input, borderless table, and semantic secondary delete button
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [usa-button-group for action button groups, CSS clip positioning for visually-hidden accessible inputs]

key-files:
  created: []
  modified:
    - client/src/components/workspace/AttachmentManager.tsx

key-decisions:
  - "CSS clip positioning (position:absolute, clip:rect) used instead of display:none for file input — USWDS class applies styles while keeping element non-interactive (tabIndex=-1)"
  - "usa-button--unstyled + usa-button--secondary combined on Delete — removes default button chrome while applying USWDS semantic red color token"

patterns-established:
  - "usa-button-group ul > li pattern: all action button groups in workspace UI use USWDS button-group markup"
  - "usa-table--borderless: attachment/budget tables use borderless variant for visual consistency"

# Metrics
duration: 1 min
completed: 2026-07-28
---

# Phase 4 Plan 9: AttachmentManager USWDS Conformance Fixes Summary

**Four USWDS cosmetic deviations corrected in AttachmentManager: usa-button-group wrapping, CSS clip positioning for file input, borderless table, and usa-button--secondary for delete semantics**

## Performance

- **Duration:** 1 min
- **Started:** 2026-07-28T03:09:32Z
- **Completed:** 2026-07-28T03:10:49Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Action buttons (Upload New File, Link from Library) wrapped in USWDS `usa-button-group` `ul > li` markup
- File input `display:none` replaced with CSS clip positioning — USWDS class now applies while input remains non-interactive via `tabIndex={-1}`
- Attachment table changed from `usa-table--striped` to `usa-table--borderless`, matching BudgetBuilder styling
- Delete button inline `color: '#b50909'` removed; replaced with `usa-button--secondary` semantic class
- All 220 existing tests pass; TypeScript compiles clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Apply four USWDS conformance fixes to AttachmentManager** - `f39b7b6` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified
- `client/src/components/workspace/AttachmentManager.tsx` — Four USWDS deviations corrected: button-group, file input clip positioning, borderless table, secondary delete button

## Decisions Made
- CSS clip positioning chosen over `display:none` for file input: USWDS styling requires the class to be applied to a visible element; clip approach satisfies USWDS while keeping the trigger button as the sole keyboard target
- `usa-button--unstyled usa-button--secondary` combination chosen for Delete: removes default button styling while applying USWDS semantic color variable instead of hardcoded `#b50909`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None found.

## Self-Check: PASSED
- `client/src/components/workspace/AttachmentManager.tsx` — exists ✓
- Commit `f39b7b6` exists ✓
- TypeScript: `npx tsc --noEmit` → exit 0 ✓
- Tests: 220 passed (24 test files) ✓
- No blocking stubs found ✓

## Next Phase Readiness
- AttachmentManager USWDS conformance gap (UAT Test 9) fully closed
- All 220 tests green; no regressions

---
*Phase: 04-application-workspace-form-capture*
*Completed: 2026-07-28*
