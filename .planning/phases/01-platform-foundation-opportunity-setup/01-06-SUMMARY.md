---
phase: 01-platform-foundation-opportunity-setup
plan: "06"
subsystem: api
tags: [zod, validation, react, typescript, uswds, opportunity]

# Dependency graph
requires:
  - phase: 01-platform-foundation-opportunity-setup
    provides: Opportunity routes, TemplateLibrary component, programs seed (01-05)
provides:
  - createOpportunitySchema with funding_amount_max optional
  - TemplateLibrary without dummy funding_amount_max value
  - Visible USWDS error alert for create failures
  - Working template-selection → Opportunity Builder navigation flow
affects:
  - UAT Test 3 (Create Opportunity from template) — now unblocked
  - UAT Tests 4-7 (Opportunity Builder flows) — transitively unblocked

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Optional schema fields: make builder-stage fields optional at creation time, consistent with updateOpportunitySchema"
    - "Error surfacing: replace silent catch {} with USWDS error alert via createError state"

key-files:
  created: []
  modified:
    - src/routes/opportunities.ts
    - src/types/opportunity.ts
    - src/services/opportunity/opportunityService.ts
    - client/src/hooks/useOpportunity.ts
    - client/src/pages/grantor/opportunities/TemplateLibrary.tsx

key-decisions:
  - "funding_amount_max is a builder field, not a creation prerequisite — optional at creation, same as updateOpportunitySchema"
  - "Error surfacing via createError state + USWDS usa-alert instead of silent swallow"

patterns-established:
  - "CreateOpportunityInput type: funding_amount_max?: number (optional in both schema and type)"

# Metrics
duration: 2min
completed: 2026-07-25
---

# Phase 1 Plan 6: Create Opportunity Gap Fix Summary

**Zod schema and TemplateLibrary fix unblocking UAT Test 3: funding_amount_max made optional at creation, silent catch replaced with USWDS error alert**

## Performance

- **Duration:** 2 min
- **Started:** 2026-07-25T13:19:10Z
- **Completed:** 2026-07-25T13:21:47Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Made `funding_amount_max` optional in `createOpportunitySchema` (consistent with `updateOpportunitySchema`)
- Removed `funding_amount_max: 0` dummy value from `TemplateLibrary` create payload
- Replaced silent `catch {}` with error-surfacing `createError` state and USWDS alert
- Updated `CreateOpportunityInput` and `CreateOpportunityPayload` types to match optional schema
- TypeScript compilation clean (0 errors), build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Make funding_amount_max optional in createOpportunitySchema** - `32dbffa` (fix)
2. **Task 2: Remove funding_amount_max from TemplateLibrary payload and surface create errors** - `6ffd4e9` (fix)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/routes/opportunities.ts` — `funding_amount_max` changed from required to `.optional()` in `createOpportunitySchema`
- `src/types/opportunity.ts` — `CreateOpportunityInput.funding_amount_max` changed from `number` to `number | undefined`
- `src/services/opportunity/opportunityService.ts` — `data.funding_amount_max` → `data.funding_amount_max ?? null` for SQL insert
- `client/src/hooks/useOpportunity.ts` — `CreateOpportunityPayload.funding_amount_max` changed from `number` to `number | undefined`
- `client/src/pages/grantor/opportunities/TemplateLibrary.tsx` — removed `funding_amount_max: 0`, added `createError` state, replaced silent catch, added USWDS error alert JSX

## Decisions Made

- `funding_amount_max` is a builder field filled in after creation; requiring it at creation time forced a dummy `0` value that failed the `.positive()` check. Making it optional at creation is the correct UX model.
- Error surfacing via `createError` state with USWDS `usa-alert--error` is consistent with the existing `showSelectionError` pattern in the same component.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript error: CreateOpportunityInput type mismatch**
- **Found during:** Task 1 (after making schema optional, `npx tsc --noEmit` revealed type error)
- **Issue:** `opportunityService.create()` received `data: CreateOpportunityInput` with `funding_amount_max: number` (required), but Zod schema now emits `funding_amount_max?: number`. TypeScript error TS2345.
- **Fix:** Updated `CreateOpportunityInput.funding_amount_max` to `funding_amount_max?: number` in `src/types/opportunity.ts`, and updated the SQL parameter to use `data.funding_amount_max ?? null`
- **Files modified:** `src/types/opportunity.ts`, `src/services/opportunity/opportunityService.ts`
- **Verification:** `npx tsc --noEmit` exits 0 after fix
- **Committed in:** `32dbffa` (Task 1 commit)

**2. [Rule 1 - Bug] Updated CreateOpportunityPayload client type to match optional schema**
- **Found during:** Task 2 (noted in plan's TypeScript note)
- **Issue:** `CreateOpportunityPayload.funding_amount_max: number` (required) would cause TypeScript error when `funding_amount_max` is omitted from the payload
- **Fix:** Updated `funding_amount_max?: number` in `client/src/hooks/useOpportunity.ts`
- **Files modified:** `client/src/hooks/useOpportunity.ts`
- **Verification:** `npx tsc --noEmit` exits 0, build succeeds
- **Committed in:** `6ffd4e9` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 type consistency bugs)
**Impact on plan:** Both auto-fixes necessary for TypeScript correctness. Plan anticipated the client-side type fix (noted in TypeScript note). No scope creep.

## Issues Encountered

None — both tasks completed cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- UAT Test 3 (Create Opportunity from template) is now unblocked
- UAT Tests 4–7 (Opportunity Builder flows) are transitively unblocked since the builder is now reachable
- Phase 1 plan 6 of 6 complete — Phase 1 fully executed

---
*Phase: 01-platform-foundation-opportunity-setup*
*Completed: 2026-07-25*

## Self-Check: PASSED

All key files verified on disk. Both commits (32dbffa, 6ffd4e9) confirmed in git log. Content checks confirm schema fix and TemplateLibrary cleanup are in place.
