---
phase: 05-q-a-submission-validation
plan: 09
subsystem: database
tags: [seed, postgresql, react, grantor, q-and-a, opportunities]

requires:
  - phase: 05-q-a-submission-validation
    provides: QAManagementPage at /grantor/opportunities/:id/qa (05-06), Manage Q&A card links (05-08)
provides:
  - UAT-OPP-001 and UAT-OPP-002 seeded under General Grant Programs (admin@example.gov's org/program)
  - OpportunitiesIndex fetches all programs and flattens opportunities across all programs
  - admin@example.gov can navigate Opportunities → Manage Q&A → see submitted questions
affects: [05-q-a-submission-validation, uat-final-verification]

tech-stack:
  added: []
  patterns:
    - "SELECT-then-UPDATE idempotency pattern for re-parenting existing seed rows (UPDATE program_id on existing UAT opps)"
    - "Promise.all multi-fetch pattern: fetch all programs, then parallel fetch opportunities per program, flat() to combine"

key-files:
  created: []
  modified:
    - src/db/seed.ts
    - client/src/pages/grantor/OpportunitiesIndex.tsx

key-decisions:
  - "UAT opportunities moved from 'UAT Federal Agency'/'UAT Grant Program' to 'Example Federal Agency'/'General Grant Programs' — OpportunitiesIndex uses /programs scoped to logged-in user's org, so UAT opps must be under admin's org to appear"
  - "Multi-program fetch replaces single useFirstProgramId hook — all programs in org are covered, future-proofing for multiple programs"
  - "UPDATE idempotency pattern: existing UAT-OPP-001/002 rows get program_id corrected on each seed run; INSERT path uses mainProgramId for fresh environments"

patterns-established:
  - "Idempotent re-parent: SELECT existing row → UPDATE FK to new parent (instead of DELETE+INSERT) preserves all dependent rows (workspaces, Q&A comments)"

duration: 2min
completed: 2026-08-01
---

# Phase 5 Plan 09: Fix Q&A Management Visibility — Reseed UAT Opportunities Under Admin Org

**UAT-OPP-001 and UAT-OPP-002 moved from orphaned 'UAT Federal Agency' org to admin@example.gov's 'General Grant Programs', with OpportunitiesIndex updated to fetch all programs across the org so all opportunities appear in the grantor list**

## Performance

- **Duration:** 2 min
- **Started:** 2026-08-01T03:07:57Z
- **Completed:** 2026-08-01T03:10:06Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Root cause fixed: UAT opportunities were under 'UAT Federal Agency'/'UAT Grant Program' (separate org) — admin@example.gov had no membership there, so OpportunitiesIndex fetched 0 UAT opportunities
- `src/db/seed.ts`: removed 'UAT Federal Agency' and 'UAT Grant Program' seeding blocks; UAT-OPP-001 and UAT-OPP-002 now INSERT/UPDATE under `mainProgramId` (General Grant Programs)
- Idempotent re-parenting: existing UAT opp rows get `program_id` corrected via UPDATE on each seed run
- `client/src/pages/grantor/OpportunitiesIndex.tsx`: replaced `useFirstProgramId()` hook with a multi-program fetch that gets all programs for the org, then `Promise.all` fetches opportunities from each, flattened into one list

## Task Commits

Each task was committed atomically:

1. **Task 1: Reseed UAT opportunities under General Grant Programs** - `b305553` (fix)
2. **Task 2: Replace single-program fetch with multi-program fetch in OpportunitiesIndex** - `a0d4c4b` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/db/seed.ts` — Removed UAT Federal Agency/UAT Grant Program blocks; added mainProgramId capture; UAT-OPP-001/002 INSERT+UPDATE reference mainProgramId; funding_source updated to 'Example Federal Agency'
- `client/src/pages/grantor/OpportunitiesIndex.tsx` — Removed useFirstProgramId hook; new useEffect fetches all /programs then parallel-fetches opportunities per program; programId state kept for TemplateLibrary modal

## Decisions Made

- UAT-OPP-001 and UAT-OPP-002 re-parented to 'General Grant Programs' (under 'Example Federal Agency') — same org/program admin@example.gov manages — OpportunitiesIndex /programs endpoint is org-scoped so UAT opportunities only appear if they live in the admin's org
- Multi-program fetch (Promise.all) replaces single useFirstProgramId to ensure all programs in the org are covered, not just the first one returned

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None found. The `placeholder` strings in seed.ts are UI field placeholder values (form field data), not code stubs.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- After next docker compose up / seed run, admin@example.gov can: navigate to /grantor/opportunities → see UAT Community Health Innovation Grant → click "Manage Q&A" → see submitted question from applicant@example.com → publish answer
- TypeScript compiles clean (0 errors for both src/ and client/)
- Build exits 0
- Phase 5 complete — ready for verify-work or phase transition

## Self-Check: PASSED

- `src/db/seed.ts` — FOUND (modified)
- `client/src/pages/grantor/OpportunitiesIndex.tsx` — FOUND (modified)
- `.planning/phases/05-q-a-submission-validation/05-09-SUMMARY.md` — FOUND (created)
- Commit b305553 — FOUND
- Commit a0d4c4b — FOUND
- Build check: `npm run build` → exit 0
- No blocking stubs found

---
*Phase: 05-q-a-submission-validation*
*Completed: 2026-08-01*
