---
phase: 02-eligibility-intake-rules-configuration
plan: 05
subsystem: api
tags: [express, postgres, uuid, slug, public-opportunities, gap-closure]

# Dependency graph
requires:
  - phase: 02-eligibility-intake-rules-configuration
    provides: publicOpportunitiesRouter with GET /opportunities/:opportunity_id (02-03), public_slug generation via publicationService (02-03/02-04)
provides:
  - UUID-aware public opportunity detail route that skips UUID lookup for non-UUID params
  - UUID_REGEX guard eliminating Postgres UUID parse error for slug-shaped URL params
  - Slug-based opportunity URLs (e.g. /opportunities/uat-test-grant-e0df0ba8) return 200 instead of 500
affects: ["03-applicant-workspace", "04-application-form", "verify-phase"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "UUID_REGEX format gate: test param before submitting to Postgres UUID column — prevents invalid input cast errors"
    - "Dual-lookup with isUUID flag: UUID path → slug path; non-UUID param skips UUID path entirely"

key-files:
  created: []
  modified:
    - src/routes/publicOpportunities.ts

key-decisions:
  - "UUID_REGEX placed inside handler (after extracting opportunity_id, before try/catch) — scoped to this route's logic"
  - "isUUID flag controls conditional UUID query; slug query runs unconditionally as fallback (both UUID-based and slug-based params resolve via slug path when UUID query finds nothing)"

patterns-established:
  - "UUID format guard pattern: always check param format before using in WHERE <uuid_column> = $1 queries"

# Metrics
duration: 1min
completed: 2026-07-26
---

# Phase 2 Plan 5: UUID Format Guard for Public Opportunity Detail Route Summary

**UUID_REGEX guard in `GET /opportunities/:opportunity_id` gates the UUID lookup so slug-shaped params (e.g. `uat-test-grant-e0df0ba8`) skip the Postgres UUID column query entirely and resolve via `public_slug` fallback — eliminating the 500 INTERNAL_ERROR for slug-based URLs**

## Performance

- **Duration:** 1 min
- **Started:** 2026-07-26T01:54:12Z
- **Completed:** 2026-07-26T01:55:05Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Added `UUID_REGEX` constant and `isUUID` flag immediately after extracting `opportunity_id` from `req.params`
- UUID lookup (`WHERE o.opportunity_id = $1`) now runs only when `isUUID` is true
- Slug fallback (`WHERE o.public_slug = $1`) runs whenever UUID query finds nothing OR param was not a UUID
- Postgres UUID parse error (`invalid input syntax for type uuid`) is impossible for slug-shaped params
- TypeScript compilation clean (0 errors)
- Closes UAT gap: "Public opportunity detail page loads when clicking from the opportunities list" (PRD-INTAKE-017)
- Mitigates T-02-19 DoS/500-storm threat

## Task Commits

Each task was committed atomically:

1. **Task 1: Add UUID format guard to public opportunity detail route** - `20dbe01` (fix)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified

- `src/routes/publicOpportunities.ts` — Added `UUID_REGEX` + `isUUID` flag; UUID query gated inside `if (isUUID)` block; slug fallback unchanged; all other route logic untouched

## Decisions Made

- UUID_REGEX placed inside the handler function (not module scope) — scoped to the handler where it is needed, consistent with plan instruction to place it "immediately after extracting `opportunity_id`"
- Slug query runs as unconditional fallback in both UUID and non-UUID cases — ensures that a UUID that matches by ID skips slug lookup, but any UUID-formatted param that has no UUID match still gets a slug lookup chance

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Public opportunity detail route now handles both UUID and slug params correctly
- Slug-based URLs (from the OpportunityCard links in OpportunityListPage) will resolve to 200 responses for published opportunities
- UUID-based URLs continue to work (no regression)
- Phase 2 gap closure complete: all 5 must-haves from VERIFICATION.md are satisfied

## Self-Check

- `src/routes/publicOpportunities.ts` — modified and committed
- Commit `20dbe01` verified: `git log --oneline -1` returns `fix(02-05): add UUID format guard to public opportunity detail route`
- `grep -n 'UUID_REGEX' src/routes/publicOpportunities.ts` → line 75 ✓
- `npx tsc --noEmit` → exits 0 ✓

## Self-Check: PASSED

---
*Phase: 02-eligibility-intake-rules-configuration*
*Completed: 2026-07-26*
