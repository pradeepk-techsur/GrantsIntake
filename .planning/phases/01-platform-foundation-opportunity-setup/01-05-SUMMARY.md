---
phase: 01-platform-foundation-opportunity-setup
plan: "05"
subsystem: database, ui
tags: [seed, programs, grantor, uswds, idempotent]

# Dependency graph
requires:
  - phase: 01-platform-foundation-opportunity-setup
    provides: grantor_organizations table, grantor_roles table, programs table schema, OpportunitiesIndex.tsx component
provides:
  - Idempotent program seed row in programs table linked to seeded grantor org
  - Accessible "No programs configured" warning alert with usa-alert__heading and data-testid
affects: [UAT Test 3–7, TemplateLibrary modal, useFirstProgramId hook]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SELECT-then-INSERT idempotency pattern for tables without UNIQUE constraints on seeded columns"

key-files:
  created: []
  modified:
    - src/db/seed.ts
    - client/src/pages/grantor/OpportunitiesIndex.tsx

key-decisions:
  - "SELECT-then-INSERT for programs seed (no UNIQUE constraint on program_name, same pattern as existing grantor_org block)"
  - "Fixed grantor_organizations ON CONFLICT DO NOTHING bug — replaced with SELECT-then-INSERT since org_name has no UNIQUE constraint"

patterns-established:
  - "SELECT-then-INSERT: Use when seeding tables with no UNIQUE constraint on the seeded identifier column"

# Metrics
duration: 4min
completed: 2026-07-25
---

# Phase 1 Plan 05: Programs Seed and No-Programs Warning Alert Summary

**Idempotent programs seed (SELECT-then-INSERT) added to seed.ts plus accessible usa-alert__heading "No programs configured" warning with data-testid in OpportunitiesIndex.tsx, unblocking UAT Tests 3–7**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-07-25T04:22:03Z
- **Completed:** 2026-07-25T04:25:53Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added SELECT-then-INSERT program seed for 'General Grant Programs' linked to seeded grantor org and admin user — `GET /api/v1/programs` now returns ≥1 program after seed, enabling TemplateLibrary modal
- Upgraded the `!programId` warning alert in OpportunitiesIndex.tsx with `usa-alert__heading "No programs configured"`, actionable text, and `data-testid="no-programs-warning"` for Playwright coverage
- Fixed pre-existing `grantor_organizations` seed bug where `ON CONFLICT DO NOTHING` (without a UNIQUE constraint on org_name) created duplicate org rows on each seed run

## Task Commits

Each task was committed atomically:

1. **Task 1: Seed a default program in src/db/seed.ts** - `f17711e` (feat)
2. **Task 2: Upgrade the 'no programs' warning alert in OpportunitiesIndex.tsx** - `550e119` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `src/db/seed.ts` - Added SELECT-then-INSERT program seed block; fixed grantor_organizations idempotency bug
- `client/src/pages/grantor/OpportunitiesIndex.tsx` - Upgraded warning alert with heading, actionable text, and data-testid

## Decisions Made
- Used SELECT-then-INSERT for programs seed (no UNIQUE constraint on program_name — same rationale as documented in plan)
- Fixed grantor_organizations duplicate bug inline as auto-fix (Rule 1 - Bug): `ON CONFLICT DO NOTHING` silently fails without a unique constraint, creating duplicate org rows

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed grantor_organizations duplicate seed bug**
- **Found during:** Task 1 (Seed a default program)
- **Issue:** The existing `grantor_organizations` seed block used `ON CONFLICT DO NOTHING` but the table has no UNIQUE constraint on `org_name` — only a PRIMARY KEY on `org_id`. This caused a new org row to be inserted on every seed run, producing duplicate orgs. Each subsequent seed then found a different `orgId` and inserted a new program row, defeating the program idempotency check.
- **Fix:** Replaced `ON CONFLICT DO NOTHING` + `RETURNING` + fallback SELECT with a clean SELECT-then-INSERT pattern (same as the new programs block and as originally described in the plan's rationale section)
- **Files modified:** `src/db/seed.ts`
- **Verification:** Running `npm run seed` twice produced exactly 1 org and 1 program row; `SELECT COUNT(*) FROM programs WHERE program_name = 'General Grant Programs'` returns 1
- **Committed in:** `f17711e` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The auto-fix was necessary for the primary plan objective (idempotent program seed) to work correctly. Without it, the programs SELECT-then-INSERT would compare against different org IDs on each run and still produce duplicates. No scope creep.

## Issues Encountered

None - migrations needed to be run first (DB was fresh after restart), which is expected first-boot behavior.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Program seed is complete: `useFirstProgramId()` returns a non-null UUID on fresh boot, enabling the TemplateLibrary modal
- UAT Tests 3–7 are now unblocked: "Create New Opportunity" opens the modal, template selection works, Opportunity Builder is reachable
- The edge-case warning alert (`data-testid="no-programs-warning"`) is ready for Playwright E2E coverage in the verify phase
- All 86 existing tests pass

## Self-Check: PASSED

- ✅ `src/db/seed.ts` exists with `INSERT INTO programs` (line 64)
- ✅ `client/src/pages/grantor/OpportunitiesIndex.tsx` exists with heading "No programs configured" (line 87) and `data-testid="no-programs-warning"` (line 84)
- ✅ `01-05-SUMMARY.md` created
- ✅ Commit `f17711e` exists (Task 1: seed + org bug fix)
- ✅ Commit `550e119` exists (Task 2: warning alert upgrade)
- ✅ Exactly 1 program row after two seed runs
- ✅ All 86 tests pass

---
*Phase: 01-platform-foundation-opportunity-setup*
*Completed: 2026-07-25*
