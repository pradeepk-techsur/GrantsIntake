---
phase: 05-q-a-submission-validation
plan: "07"
subsystem: workspace
tags: [react-query, hooks, authorization, certifications, readiness, attachments]

# Dependency graph
requires:
  - phase: 05-q-a-submission-validation
    provides: certificationService, readinessService, useIsAuthorizedRep, WorkspacePage
provides:
  - useIsAuthorizedRep(orgId) — prop-based, no localStorage read, reactive with React Query
  - certificationService.certify() marks certifications section complete after INSERT
  - readinessService auto-completes attachments section when 0 requirements exist
  - overall_completion_pct recomputed after attachment auto-complete for accurate 100% result
affects: [05-q-a-submission-validation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prop-based hook arguments instead of localStorage reads — avoids stale-closure on first render"
    - "In-memory section mutation + DB UPDATE for same-response accuracy in readinessService"
    - "let-then-reassign pattern for deferred computation after side-effecting middleware"

key-files:
  created: []
  modified:
    - client/src/hooks/useIsAuthorizedRep.ts
    - client/src/pages/applicant/WorkspacePage.tsx
    - src/services/workspace/certificationService.ts
    - src/services/workspace/readinessService.ts

key-decisions:
  - "useIsAuthorizedRep accepts orgId as prop (not localStorage) — React Query reactive, no stale-closure"
  - "certify() UPDATE application_sections section_type=certifications after INSERT (PRD-INTAKE-050)"
  - "attachments section auto-marked complete when 0 requirements — idempotent WHERE status=not_started"
  - "overall_completion_pct changed to let, recomputed after attachment auto-complete block"

patterns-established:
  - "Gap closure pattern: section status UPDATE co-located with the action that completes the section"
  - "In-memory mutation + DB UPDATE for same-call accuracy without re-fetch"

# Metrics
duration: 1min
completed: 2026-07-31
---

# Phase 5 Plan 07: UAT Blocker Fixes — CertificationPanel visibility, section completion, attachment auto-complete Summary

**Fixes three interdependent UAT blockers: useIsAuthorizedRep now receives orgId via prop (reactive, no stale localStorage read), certify() marks certifications section complete after INSERT, and readinessService auto-completes the attachments section when no requirements exist — enabling 100% workspace completion**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-07-31T19:52:02Z
- **Completed:** 2026-07-31T19:53:50Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Fixed stale-closure bug in `useIsAuthorizedRep`: hook now accepts `orgId` as prop from workspace data, making it reactive to React Query — CertificationPanel renders on first load without requiring page refresh
- Fixed `certificationService.certify()`: adds `UPDATE application_sections SET status='complete'` after successful INSERT, so certifications section flips to complete after user certifies (PRD-INTAKE-050)
- Fixed `readinessService.computeReadiness()`: when `attachment_requirements` returns 0 rows for the opportunity, auto-marks attachments section complete in DB and in-memory — `overall_completion_pct` is recomputed after this mutation so the same response reflects 100% correctly

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix useIsAuthorizedRep prop-based signature; update WorkspacePage call site** — `80ebc89` (fix)
2. **Task 2: certificationService marks section complete; readinessService auto-completes attachments** — `29f41ed` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `client/src/hooks/useIsAuthorizedRep.ts` — Signature changed from `()` to `(orgId?: string | null)`, removed `localStorage.getItem` read
- `client/src/pages/applicant/WorkspacePage.tsx` — Call site updated to `useIsAuthorizedRep(workspaceQuery.data?.org_id ?? null)`
- `src/services/workspace/certificationService.ts` — Added `UPDATE application_sections SET status='complete' WHERE section_type='certifications'` after certification INSERT
- `src/services/workspace/readinessService.ts` — Changed `overall_completion_pct` to `let`, added attachments auto-complete block, added recompute after attachment section mutation

## Decisions Made

- `useIsAuthorizedRep` now takes `orgId` as a prop instead of reading `localStorage.getItem('applicant_org_id')`. The `useEffect` in WorkspacePage that writes to localStorage is preserved for backward compatibility with other pages that may read it, but the hook no longer depends on it.
- `certify()` UPDATE is placed between the successful INSERT result capture and the audit event INSERT — it runs in the same try block, so an UPDATE failure rolls back naturally.
- Attachment auto-complete uses `WHERE status = 'not_started'` to be idempotent — if the section was already complete it doesn't reset it; if already running compose volumes persist across restarts, this guard prevents double-firing.
- `overall_completion_pct` recomputed at the end (after all section status mutations) using `sections.filter(s => s.is_visible && s.status === 'complete')` — `visibleSections` const retained at top since it's needed in the blocking_errors loop.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None found.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All three UAT blockers for Tests 4 and 5 are resolved
- CertificationPanel visible on first workspace load (UAT Test 4) ✓
- Submit button activates at 100% completion (UAT Test 5) ✓
- Phase 5 gap closure complete — ready for Phase 6 (notifications/email delivery) or verify-work

## Self-Check: PASSED

- `client/src/hooks/useIsAuthorizedRep.ts` — signature updated, no localStorage read ✓
- `client/src/pages/applicant/WorkspacePage.tsx` — call site passes org_id ✓
- `src/services/workspace/certificationService.ts` — UPDATE application_sections present ✓
- `src/services/workspace/readinessService.ts` — auto-complete + recompute present ✓
- Commits 80ebc89 and 29f41ed verified in git log ✓
- TypeScript clean on both client and server ✓
- No stubs found in modified files ✓

---
*Phase: 05-q-a-submission-validation*
*Completed: 2026-07-31*
