---
phase: 05-q-a-submission-validation
plan: 08
subsystem: ui
tags: [react, uswds, grantor, q-and-a, navigation, discoverability]

requires:
  - phase: 05-q-a-submission-validation
    provides: QAManagementPage at /grantor/opportunities/:id/qa (05-06)
provides:
  - Per-opportunity "Manage Q&A" link in OpportunitiesIndex card footer
  - GrantorSidebar "Q&A Management" label with data-testid
  - "Opportunity Builder" uppercase subtitle in OpportunityBuilder page header
affects: [05-q-a-submission-validation, uat-test-2]

tech-stack:
  added: []
  patterns:
    - "usa-card__footer used for card action links (USWDS pattern)"
    - "Muted uppercase p label above h1 for page section context"

key-files:
  created: []
  modified:
    - client/src/pages/grantor/OpportunitiesIndex.tsx
    - client/src/components/nav/GrantorSidebar.tsx
    - client/src/pages/grantor/opportunities/OpportunityBuilder.tsx

key-decisions:
  - "Sidebar label changed from 'Q&A Inbox' to 'Q&A Management' — destination (/grantor/qa-inbox → /grantor/opportunities redirect) unchanged per prior decision"
  - "Opportunity Builder subtitle placed as muted uppercase p tag above h1 per USWDS pattern for page section context"
  - "Q&A link uses usa-card__footer placement within usa-card__container per USWDS card spec"

patterns-established:
  - "usa-card__footer: canonical place for card action links in grantor opportunity cards"

duration: 1min
completed: 2026-08-01
---

# Phase 5 Plan 08: Q&A Discoverability — Sidebar Relabel, Card Q&A Links, and Opportunity Builder Label

**Three surgical UI changes creating a discoverable path from the grantor sidebar to per-opportunity Q&A management: card footer "Manage Q&A" links, sidebar "Q&A Management" label, and "Opportunity Builder" page subtitle**

## Performance

- **Duration:** 1 min
- **Started:** 2026-08-01T01:30:10Z
- **Completed:** 2026-08-01T01:31:24Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Each opportunity card in `/grantor/opportunities` now has a `usa-card__footer` containing a "Manage Q&A" link directly to `/grantor/opportunities/:id/qa`
- GrantorSidebar "Q&A Inbox" relabeled to "Q&A Management" with `data-testid="nav-qa-management"`
- OpportunityBuilder page header shows muted uppercase "OPPORTUNITY BUILDER" label above the opportunity title `<h1>`, with `data-testid="opportunity-builder-label"`

## Task Commits

Each task was committed atomically:

1. **Task 1: Add per-opportunity Q&A links to OpportunitiesIndex + relabel sidebar** - `df05fc9` (feat)
2. **Task 2: Add 'Opportunity Builder' subtitle to OpportunityBuilder page header** - `faa0d23` (feat)

## Files Created/Modified

- `client/src/pages/grantor/OpportunitiesIndex.tsx` — Added `usa-card__footer` with `<Link to={/grantor/opportunities/:id/qa} data-testid="qa-link-{id}">` per opportunity card
- `client/src/components/nav/GrantorSidebar.tsx` — Relabeled Q&A Inbox → Q&A Management, added `data-testid="nav-qa-management"`
- `client/src/pages/grantor/opportunities/OpportunityBuilder.tsx` — Added muted uppercase "Opportunity Builder" `<p>` with `data-testid="opportunity-builder-label"` above the title `<h1>`

## Decisions Made

- Sidebar destination (`/grantor/qa-inbox`) unchanged per prior decision (App.tsx redirect to /grantor/opportunities is acceptable); only the label was updated to reflect intent
- "Opportunity Builder" subtitle uses USWDS-compatible `<p>` tag with muted gray color and uppercase letterSpacing — no new CSS classes needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- UAT Test 2 is now achievable: grantor → click "Q&A Management" sidebar → opportunity list → click "Manage Q&A" on card → QAManagementPage with submitted questions
- All three artifact contracts from the plan are satisfied (grep verifications passed)
- TypeScript compiles clean (0 TS errors); build exits 0
- Ready for phase completion / verify-work

## Self-Check

- `client/src/pages/grantor/OpportunitiesIndex.tsx` — FOUND (modified)
- `client/src/components/nav/GrantorSidebar.tsx` — FOUND (modified)
- `client/src/pages/grantor/opportunities/OpportunityBuilder.tsx` — FOUND (modified)
- Commit df05fc9 — FOUND
- Commit faa0d23 — FOUND
- Build check: `npm run build` → exit 0
- No blocking stubs found

## Self-Check: PASSED

---
*Phase: 05-q-a-submission-validation*
*Completed: 2026-08-01*
