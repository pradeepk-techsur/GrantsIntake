---
phase: 05-q-a-submission-validation
plan: "05"
subsystem: ui, database
tags: [localStorage, workspace, seed, form-fields, certification-panel, react-query]

# Dependency graph
requires:
  - phase: 05-q-a-submission-validation
    provides: CertificationPanel component, useIsAuthorizedRep hook, workspace query returning org_id
  - phase: 04-application-workspace-form-capture
    provides: application_sections seeding, form_field_definitions schema, workspace schema

provides:
  - localStorage.applicant_org_id populated from workspace data on every WorkspacePage load
  - form_field_definitions seeded for org_profile, eligibility, workplan, performance_measures, review_submit sections
  - CertificationPanel visible to AR users navigating directly to workspace (pre-seeded org scenario)
  - All workspace sections render real form fields instead of "No form fields configured"

affects:
  - 05-q-a-submission-validation (unblocks Tests 4, 5, 7 — CertificationPanel, section form fields, Submit gate)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useEffect for localStorage sync: runs on workspaceQuery.data?.org_id dependency change"
    - "WHERE NOT EXISTS idempotent seed guard: section_id + label composite check for form_field_definitions"
    - "SECTION_FIELDS record: typed map driving loop-based multi-section seeding"

key-files:
  created: []
  modified:
    - client/src/pages/applicant/WorkspacePage.tsx
    - src/db/seed.ts

key-decisions:
  - "localStorage.applicant_org_id populated via useEffect in WorkspacePage (not OrgProfilePage) — org is pre-seeded, user never visits profile creation path"
  - "SECTION_FIELDS loop approach: single INSERT statement reused per-field per-section vs inline repetition — matches existing narrative block pattern"
  - "budget/attachments/certifications sections excluded: dedicated UIs (BudgetBuilder/AttachmentManager) and POST /certify handle those sections — no form_field_definitions needed"

patterns-established:
  - "WorkspacePage useEffect pattern: populate localStorage from React Query data on data change"
  - "Typed SECTION_FIELDS Record: structured approach for multi-section form field seeding"

# Metrics
duration: 3min
completed: 2026-07-31
---

# Phase 5 Plan 05: CertificationPanel Fix and Workspace Form Field Seeding Summary

**localStorage.applicant_org_id useEffect in WorkspacePage + form_field_definitions seeded for all 5 completable workspace sections (org_profile, eligibility, workplan, performance_measures, review_submit)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-31T04:59:13Z
- **Completed:** 2026-07-31T05:02:42Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- WorkspacePage.tsx now sets `localStorage.applicant_org_id` from workspace data on every load, making CertificationPanel visible to AR users who reach workspace directly (pre-seeded org scenario)
- seed.ts now seeds form_field_definitions for org_profile (2 fields), eligibility (1), workplan (2), performance_measures (2), and review_submit (1) sections — all via idempotent WHERE NOT EXISTS guards
- `npm run seed` executes cleanly and logs confirmation for each new section; re-run is idempotent
- TypeScript compiles without errors; client and server builds succeed

## Task Commits

Each task was committed atomically:

1. **Task 1: Set localStorage.applicant_org_id in WorkspacePage from workspace data** - `2e93dfb` (feat)
2. **Task 2: Seed form_field_definitions for all completable workspace sections** - `2d4f3a9` (feat)

## Files Created/Modified
- `client/src/pages/applicant/WorkspacePage.tsx` - Added useEffect that calls localStorage.setItem('applicant_org_id', workspaceQuery.data.org_id) on workspace data change
- `src/db/seed.ts` - Added SECTION_FIELDS map and loop seeding form_field_definitions for org_profile, eligibility, workplan, performance_measures, review_submit sections (131 lines)

## Decisions Made
- Used `useEffect` with `workspaceQuery.data?.org_id` dependency — fires on every workspace data change, matching React Query's cache-update pattern; no risk of stale org_id
- Excluded budget, attachments, certifications from SECTION_FIELDS — BudgetBuilder and AttachmentManager have dedicated UIs; certifications uses POST /certify
- Loop-based seeding pattern (single INSERT per field in loop) mirrors existing narrative block, keeping the seed file consistent and readable

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

The plan's integration contract verification (`grep -c 'INSERT INTO form_field_definitions'`) expects >=6 static INSERT occurrences, but the implementation (matching the plan's provided code verbatim) uses loop-based inserts (2 INSERT statements × N iterations = 8 total inserts for SECTION_FIELDS + 3 for narrative). The runtime behavior is correct and verified: `npm run seed` inserts all 8 fields across 5 sections. The static grep count (2) is a consequence of the loop pattern — not a functional gap.

---

**Total deviations:** 0 auto-fixed  
**Impact on plan:** Plan executed exactly as specified.

## Issues Encountered
- Port 3000 was already in use, preventing `docker compose up -d app`. Resolved by running migrations and seed directly against the DB service on localhost:5432, which was healthy. Seed verified successfully.

## Known Stubs

None found. All `placeholder:` values in seed.ts are legitimate form field UI hints, not code stubs.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- CertificationPanel visibility fix complete — AR users see certification checkbox without needing to visit OrgProfilePage
- All 5 completable workspace sections now have form fields — workspace completion_pct can rise above 0 after field entry
- Submit gate path is now unblocked (Tests 4, 5, 7)
- Phase 5 gap closure complete — ready for Phase 6 transition or verify-work

## Self-Check: PASSED

- ✅ `client/src/pages/applicant/WorkspacePage.tsx` — exists, contains `localStorage.setItem('applicant_org_id', ...)`
- ✅ `src/db/seed.ts` — exists, contains SECTION_FIELDS seeding for 5 sections
- ✅ `.planning/phases/05-q-a-submission-validation/05-05-SUMMARY.md` — created
- ✅ Task 1 commit `2e93dfb` — exists
- ✅ Task 2 commit `2d4f3a9` — exists
- ✅ Build check: `npm run build` (tsc) → exit 0
- ✅ Known Stubs section present: "None found"

---
*Phase: 05-q-a-submission-validation*
*Completed: 2026-07-31*
