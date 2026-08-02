---
phase: 05-q-a-submission-validation
plan: "04"
subsystem: ui
tags: [react, uswds, react-router, qa, navigation, gap-closure]

requires:
  - phase: 05-q-a-submission-validation
    provides: Q&A backend routes and QAManagementPage component

provides:
  - Q&A section with id=qa-section anchor on OpportunityDetailPage
  - Sidebar "Jump to Q&A Section" anchor link
  - publishedQAQuery.isError USWDS error alert rendering
  - Q&A Management tab in OpportunityBuilder tab nav
  - Link to /grantor/opportunities/:id/qa from builder Q&A section
  - CompletenessChecklist without Phase 2 placeholder items

affects:
  - 05-q-a-submission-validation
  - applicant opportunity detail page navigation
  - grantor opportunity builder tab nav

tech-stack:
  added: []
  patterns:
    - "id=qa-section anchor + href=#qa-section sidebar link for in-page scroll navigation"
    - "publishedQAQuery.isError renders usa-alert--error (not blank) for network failures"
    - "BuilderSection union extended with 'qa' — Link navigates to full QAManagementPage"

key-files:
  created: []
  modified:
    - client/src/pages/applicant/OpportunityDetailPage.tsx
    - client/src/pages/grantor/opportunities/OpportunityBuilder.tsx
    - client/src/pages/grantor/opportunities/CompletenessChecklist.tsx

key-decisions:
  - "App.tsx qa-inbox redirect to /grantor/opportunities left as-is — canonical path is now the OpportunityBuilder Q&A tab"
  - "Phase 2 phaseNote interface field and isPhase2 render branch removed entirely — no remaining usages"
  - "Q&A tab in builder uses Link (not inline render) to navigate to full QAManagementPage — clean separation"

patterns-established:
  - "Sidebar anchor jump links: <a href='#section-id'> for in-page section navigation"

duration: 3min
completed: "2026-07-31"
---

# Phase 5 Plan 04: Q&A Discoverability + Publication Readiness Gap Closure Summary

**Four UAT navigation dead-ends fixed with surgical client-side edits: Q&A anchor scroll, sidebar jump link, isError alert, grantor Q&A tab, and Phase 2 checklist placeholder removal**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-31T04:58:58Z
- **Completed:** 2026-07-31T05:02:19Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added `id="qa-section"` to Q&A section + USWDS error alert for publishedQAQuery.isError on OpportunityDetailPage
- Added sidebar "Jump to Q&A Section" anchor link enabling in-page scroll navigation
- Added `'qa'` to BuilderSection union + Q&A Management tab button + Link to QAManagementPage in OpportunityBuilder
- Removed two permanently-false Phase 2 placeholder items (eligibility_rules, form_sections) from CompletenessChecklist; cleaned up phaseNote interface field and isPhase2 render branch

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Q&A anchor + jump link + isError state to OpportunityDetailPage** - `dac90ed` (feat)
2. **Task 2: Add Q&A tab to OpportunityBuilder + remove CompletenessChecklist Phase 2 placeholders** - `074b98d` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `client/src/pages/applicant/OpportunityDetailPage.tsx` — id="qa-section" on section; isError branch with usa-alert--error; sidebar jump link with data-testid=jump-to-qa-link
- `client/src/pages/grantor/opportunities/OpportunityBuilder.tsx` — 'qa' added to BuilderSection union; Q&A Management tab button (data-testid=tab-qa); qa section with Link to /grantor/opportunities/:id/qa (data-testid=open-qa-management-link)
- `client/src/pages/grantor/opportunities/CompletenessChecklist.tsx` — Phase 2 placeholder items removed; phaseNote interface field removed; isPhase2 render branch removed

## Decisions Made

- App.tsx `qa-inbox` redirect to `/grantor/opportunities` left unchanged — the real fix for Q&A discoverability is the new OpportunityBuilder Q&A tab
- The `phaseNote` interface field and `isPhase2` render branch in CompletenessChecklist were removed entirely since no remaining usages exist after removing the placeholder push block — keeps the component clean
- Q&A tab in builder renders a Link to the full QAManagementPage rather than inlining the component — maintains clean page-level separation

## Deviations from Plan

None - plan executed exactly as written. The plan noted App.tsx required no changes, which was confirmed (qa-inbox redirect already points to /grantor/opportunities at line 77).

## Issues Encountered

- `npm build` failed initially due to missing client `node_modules` (pre-existing environment issue, not caused by this plan). Running `npm install` in the client directory resolved it. Build succeeded with exit code 0.

## Known Stubs

None found.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Phase 5 UAT gap items addressed — Q&A discoverability (PRD-INTAKE-044), grantor Q&A reachability (PRD-INTAKE-045), publication readiness accuracy, and error state visibility
- Phase 5 plans complete; ready for Phase 6 (Notifications & Analytics) or verify-work on Phase 5

## Self-Check

- [x] `client/src/pages/applicant/OpportunityDetailPage.tsx` modified — verified id="qa-section", qa-error, jump-to-qa-link present
- [x] `client/src/pages/grantor/opportunities/OpportunityBuilder.tsx` modified — verified 'qa' in union, tab-qa, open-qa-management-link present
- [x] `client/src/pages/grantor/opportunities/CompletenessChecklist.tsx` modified — verified grep -c 'Phase 2' returns 0
- [x] Task 1 commit `dac90ed` exists: `git log --oneline | grep dac90ed`
- [x] Task 2 commit `074b98d` exists: `git log --oneline | grep 074b98d`
- [x] Build check: `npm run build` in client/ → exit 0, "✓ built in 273ms"
- [x] TypeScript: `npx tsc --noEmit` → exit 0 (no errors)

## Self-Check: PASSED

---
*Phase: 05-q-a-submission-validation*
*Completed: 2026-07-31*
