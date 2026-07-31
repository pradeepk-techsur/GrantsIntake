---
phase: 04-application-workspace-form-capture
plan: 12
subsystem: database
tags: [seed, postgresql, opportunities, uat]

# Dependency graph
requires:
  - phase: 04-application-workspace-form-capture
    provides: UAT-OPP-001 seed with workspace (UAT Test 1 baseline)
provides:
  - UAT-OPP-002 published opportunity in seed with no pre-created workspace (enables Start Application CTA for UAT Test 2)
affects: [playwright-e2e, uat-test-2]

# Tech tracking
tech-stack:
  added: []
  patterns: ["SELECT-then-INSERT idempotency pattern (no UNIQUE constraint on opportunity_number)"]

key-files:
  created: []
  modified: ["src/db/seed.ts"]

key-decisions:
  - "No workspace row seeded for UAT-OPP-002 — absence of workspace is the precondition for Start Application CTA to render"
  - "SELECT-then-INSERT pattern reused from UAT-OPP-001 block (no UNIQUE constraint on opportunity_number)"

patterns-established:
  - "Second published opportunity without workspace: uatProgramId + adminUserId reused from UAT-OPP-001 block scope"

# Metrics
duration: 5min
completed: 2026-07-30
---

# Phase 04 Plan 12: UAT-OPP-002 Seed (Start Application CTA) Summary

**Idempotent seed of a second published opportunity (UAT-OPP-002, 'UAT Community Health Grant 2') with no workspace for the UAT applicant, enabling the Start Application CTA to be exercised in UAT Test 2**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-30T19:29:00Z
- **Completed:** 2026-07-30T19:34:49Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Added SELECT-then-INSERT block for UAT-OPP-002 to `src/db/seed.ts` between UAT-OPP-001 and the applicant org section
- UAT-OPP-002 is seeded as `status='published'` using the same `uatProgramId` and `adminUserId` already in scope
- No `application_workspaces` row is created for UAT-OPP-002 — this absence makes the 'Start Application' button appear instead of 'Continue Application'
- TypeScript compiles with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Add UAT-OPP-002 published opportunity to seed (no workspace)** - `9dac382` (feat)

**Plan metadata:** _(committed in final docs commit)_

## Files Created/Modified

- `src/db/seed.ts` — Added 32 lines: idempotent UAT-OPP-002 opportunity seed block (no workspace)

## Decisions Made

- No workspace row seeded for UAT-OPP-002: the absence of a workspace is the exact precondition that makes the Start Application CTA render on the opportunity detail page
- SELECT-then-INSERT pattern (not ON CONFLICT) reused from existing UAT-OPP-001 block, consistent with seed convention for tables without UNIQUE constraints on opportunity_number

## Known Stubs

None found.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- UAT-OPP-002 seed is in place; Playwright UAT Test 2 can now navigate to UAT-OPP-002 detail page and assert the 'Start Application' button is present (not 'Continue Application')
- All gap-closure plans for Phase 04 are now complete

---

## Self-Check: PASSED

- [x] `src/db/seed.ts` modified — contains UAT-OPP-002 SELECT-then-INSERT block
- [x] Commit `9dac382` confirmed in git log
- [x] Build check: `npx tsc --noEmit` → exit 0
- [x] `## Known Stubs` section present — None found (no blocking stubs)
- [x] No workspace row references UAT-OPP-002 in seed

---
*Phase: 04-application-workspace-form-capture*
*Completed: 2026-07-30*
