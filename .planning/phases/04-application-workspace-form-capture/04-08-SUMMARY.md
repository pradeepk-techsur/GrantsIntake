---
phase: 04-application-workspace-form-capture
plan: "08"
subsystem: ui
tags: [uswds, react, grid-layout, budget-builder, seed, form-fields]

requires:
  - phase: 04-application-workspace-form-capture
    provides: WorkspacePage, BudgetBuilder components, UAT seed with workspace and sections
provides:
  - WorkspacePage with corrected 3-column grid layout (2+5+2=9 fits in desktop:grid-col-9 parent)
  - BudgetBuilder "Add Line Item" button visible in category header (outside accordion gate)
  - form_field_definitions seed rows for UAT narrative section (Project Narrative, Goals and Objectives, Number of Beneficiaries)
affects: [04-application-workspace-form-capture, UAT-Tests-5-6-7]

tech-stack:
  added: []
  patterns:
    - "USWDS grid: inner columns must sum to parent column width (2+5+2=9 inside desktop:grid-col-9)"
    - "Idempotent seed with explicit PostgreSQL ::type casts in SELECT WHERE NOT EXISTS to avoid 42P08 type inference error"
    - "BudgetBuilder: always-visible action button outside accordion; accordion expands on click via setExpandedCategories"

key-files:
  created: []
  modified:
    - client/src/pages/applicant/WorkspacePage.tsx
    - client/src/components/workspace/BudgetBuilder.tsx
    - src/db/seed.ts

key-decisions:
  - "Grid columns changed from 3+6+3=12 to 2+5+2=9 to fit inside ApplicantLayout's desktop:grid-col-9 main area"
  - "Add Line Item button moved outside {isExpanded} to always-visible header position; clicking auto-expands accordion"
  - "Explicit ::type casts in seed INSERT SELECT WHERE NOT EXISTS (extends Phase 4 P06 pattern) to prevent PostgreSQL 42P08"

patterns-established:
  - "BudgetBuilder always-visible CTA: place interactive buttons outside accordion conditional for discoverability"

duration: 3min
completed: 2026-07-28
---

# Phase 4 Plan 08: UAT Gap Closure — Grid Layout, Budget Add Button, Narrative Seed Fields

**USWDS 3-column grid corrected (2+5+2=9), BudgetBuilder add-button made always-visible outside accordion, and 3 narrative form_field_definitions rows seeded for UAT**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-28T03:14:10Z
- **Completed:** 2026-07-28T03:17:21Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Fixed WorkspacePage 3-column grid overflow: columns `grid-col-3+grid-col-6+grid-col-3=12` exceeded the `desktop:grid-col-9` ApplicantLayout parent, causing visual overlap. Corrected to `grid-col-2+grid-col-5+grid-col-2=9`
- Moved BudgetBuilder "+ Add Line Item" button from inside `{isExpanded && ...}` accordion gate to always-visible header area; clicking the button now auto-expands the accordion category via `setExpandedCategories`
- Extended UAT seed with step 8 inserting 3 `form_field_definitions` rows for the narrative section: "Project Narrative" (textarea), "Goals and Objectives" (textarea), "Number of Beneficiaries" (number) — idempotent and verified in DB

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix WorkspacePage grid layout + move BudgetBuilder Add Line Item button** - `d20b7fa` (fix)
2. **Task 2: Seed form_field_definitions for UAT narrative section** - `96b8d3b` (feat)

**Plan metadata:** `(docs commit to follow)` (docs: complete plan)

## Files Created/Modified

- `client/src/pages/applicant/WorkspacePage.tsx` — Grid column classes corrected: sidebar `grid-col-2`, content `grid-col-5`, readiness `grid-col-2`; Preview link from 04-07 preserved
- `client/src/components/workspace/BudgetBuilder.tsx` — "+ Add Line Item" button moved outside accordion gate to always-visible position
- `src/db/seed.ts` — Step 8 added: inserts 3 form_field_definitions rows for UAT narrative section with idempotent WHERE NOT EXISTS guard and explicit ::type casts

## Decisions Made

- Grid columns changed from 12-column inner layout to 9-column to fit `desktop:grid-col-9` parent (UAT Test 5)
- Add button moved to always-visible position outside accordion (UAT Test 7) — clicking triggers both `setAddingCategory` and `setExpandedCategories` to expand and show the form simultaneously
- Explicit `::uuid`/`::varchar`/`::boolean`/`::int`/`::jsonb` casts added in INSERT SELECT WHERE NOT EXISTS to avoid PostgreSQL 42P08 "inconsistent types deduced for parameter" error (extends Phase 4 P06 pattern)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] PostgreSQL type inference error in seed INSERT SELECT WHERE NOT EXISTS**
- **Found during:** Task 2 (Seed form_field_definitions for UAT narrative section)
- **Issue:** `inconsistent types deduced for parameter $4` — PostgreSQL cannot infer type when parameter `$4` (label) appears in both SELECT list and WHERE clause without explicit casts
- **Fix:** Added explicit `::uuid`, `::varchar`, `::boolean`, `::int`, `::jsonb` casts to all parameters in the INSERT SELECT and WHERE NOT EXISTS clauses
- **Files modified:** src/db/seed.ts
- **Verification:** `npm run seed` completed successfully; DB confirmed 3 rows; second seed run produced no duplicates
- **Committed in:** 96b8d3b (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — PostgreSQL type cast)
**Impact on plan:** Auto-fix was required for seed to execute. No scope creep. Follows existing Phase 4 pattern from P06 summary.

## Issues Encountered

None — all tasks completed successfully.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None found.

## Next Phase Readiness

- UAT Tests 5, 6 (narrative fields), and 7 (budget add button) gaps are now closed
- Preview Application link from 04-07 preserved in WorkspacePage
- All 220 tests pass; TypeScript compiles clean
- Ready for Phase 4 completion review

## Self-Check: PASSED

- [x] `client/src/pages/applicant/WorkspacePage.tsx` — exists, contains `grid-col-2` and `grid-col-5`
- [x] `client/src/components/workspace/BudgetBuilder.tsx` — exists, add-button testid before isExpanded block
- [x] `src/db/seed.ts` — exists, contains `form_field_definitions`
- [x] Commits: `d20b7fa` (Task 1), `96b8d3b` (Task 2) — both present in git log
- [x] TypeScript clean: client and server both pass `--noEmit`
- [x] All 220 tests pass

---
*Phase: 04-application-workspace-form-capture*
*Completed: 2026-07-28*
