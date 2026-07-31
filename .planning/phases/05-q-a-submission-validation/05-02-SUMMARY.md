---
phase: 05-q-a-submission-validation
plan: 02
subsystem: validation
tags: [validation, certification, sha256, uswds, react-query, zod, postgres]

requires:
  - phase: 05-q-a-submission-validation
    provides: certifications table (migration 015), qa_items, submission_snapshots schema
  - phase: 04-application-workspace-form-capture
    provides: readinessService, ReadinessDashboard, WorkspacePage, SectionFormPanel, formFieldService

provides:
  - validationService.runValidation() with three-tier classification (blocking/warning/info)
  - certificationService.certify() with SHA-256 hash and CERTIFICATION_COMPLETED audit event
  - POST /workspaces/:id/validate continuous validation endpoint
  - POST /workspaces/:id/certify AR-only certification endpoint (403/409/200)
  - POST /workspaces/:id/concern non-blocking AR concern flag
  - GET /workspaces/:id/certification certification status endpoint
  - ValidationBanner component with USWDS three-tier alerts
  - CertificationPanel component with legal text, checkbox, concern flag
  - useValidation hook with 500ms debounce on field blur
  - ReadinessDashboard submit gate (aria-disabled when blocking_count > 0)
affects: [05-03-submission-snapshot, 06-notification-delivery]

tech-stack:
  added: []
  patterns: [three-tier-validation-classification, ar-only-certification-with-sha256-hash, continuous-validation-on-blur]

key-files:
  created:
    - src/services/workspace/validationService.ts
    - src/services/workspace/certificationService.ts
    - client/src/types/validation.ts
    - client/src/api/validationApi.ts
    - client/src/hooks/useValidation.ts
    - client/src/hooks/useIsAuthorizedRep.ts
    - client/src/components/workspace/ValidationBanner.tsx
    - client/src/components/workspace/CertificationPanel.tsx
    - tests/integration/workspaceValidation.test.ts
    - tests/integration/workspaceCertification.test.ts
    - e2e/workspaceValidation.spec.ts
    - e2e/workspaceCertification.spec.ts
  modified:
    - src/routes/workspaces.ts
    - client/src/components/workspace/ReadinessDashboard.tsx
    - client/src/components/workspace/SectionFormPanel.tsx
    - client/src/components/workspace/WorkspaceSectionPanel.tsx
    - client/src/pages/applicant/WorkspacePage.tsx

key-decisions:
  - "org_roles uses roles JSONB array (not role_type column) — fixed from plan to match actual schema"
  - "workspace_comments uses posted_by/visibility columns (not author_user_id/is_internal) — fixed from plan to match migration 012"
  - "audit_events uses payload column (not metadata) — consistent with Phase 1 schema and 05-01 decision"
  - "useIsAuthorizedRep hook queries org roles API via existing GET /organizations/:org_id/roles endpoint — no new endpoint needed"

patterns-established:
  - "Three-tier validation: blocking (red usa-alert--error), warning (yellow usa-alert--warning), informational (blue usa-alert--info)"
  - "Continuous validation on blur: useValidation hook with 500ms debounce triggers POST /validate and invalidates readiness cache"
  - "AR-only certification: service-layer role check using server-derived org_id from workspace row (IDOR prevention)"
  - "SHA-256 hash of certification text stored for tamper detection and non-repudiation"

duration: 12min
completed: 2026-07-31
---

# Phase 5 Plan 2: Validation Engine, Certification, and Submission Gate Summary

**Three-tier continuous validation engine with USWDS-styled inline alerts, SHA-256 AR certification with audit trail, and ReadinessDashboard submit gate that disables submission when blocking errors exist**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-31T02:27:59Z
- **Completed:** 2026-07-31T02:40:33Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- Validation engine classifies errors into three tiers (blocking/warning/informational) from section JSONB + structural checks
- Continuous validation fires on field blur during drafting (not only at submit) via 500ms debounced useValidation hook
- ReadinessDashboard blocking count badge always visible; Submit button disabled (aria-disabled) when blocking_count > 0
- POST /certify enforces AR role at service layer using server-derived org_id; SHA-256 hash stored with CERTIFICATION_COMPLETED audit event
- CertificationPanel AR-only UI functional with legal text, agreement checkbox, concern flag non-blocking
- 14 integration tests passing (6 validation + 8 certification)
- 10 Playwright e2e tests written (4 validation + 6 certification, deferred to verify phase)

## Task Commits

Each task was committed atomically:

1. **Task 1: Validation service + certification service + backend routes** - `895ba74` (feat)
2. **Task 2: Validation UI + CertificationPanel + ReadinessDashboard submit gate** - `9968dda` (feat)

## Files Created/Modified
- `src/services/workspace/validationService.ts` — Three-tier validation from section JSONB + structural checks
- `src/services/workspace/certificationService.ts` — AR certification with SHA-256 hash + audit event + concern flags
- `src/routes/workspaces.ts` — 4 new routes: validate, certify, concern, certification
- `tests/integration/workspaceValidation.test.ts` — 6 integration tests for validation API
- `tests/integration/workspaceCertification.test.ts` — 8 integration tests for certification API
- `client/src/types/validation.ts` — Client-side validation type definitions
- `client/src/api/validationApi.ts` — Client API for validation, certification, concern endpoints
- `client/src/hooks/useValidation.ts` — 500ms debounced validation trigger on field blur
- `client/src/hooks/useIsAuthorizedRep.ts` — Hook to check AR role via org roles API
- `client/src/components/workspace/ValidationBanner.tsx` — USWDS three-tier alert component
- `client/src/components/workspace/CertificationPanel.tsx` — AR-only certification UI with concern flag
- `client/src/components/workspace/ReadinessDashboard.tsx` — Added blocking count badge + submit gate
- `client/src/components/workspace/SectionFormPanel.tsx` — Added onFieldBlur prop for workspace-level validation
- `client/src/components/workspace/WorkspaceSectionPanel.tsx` — Passes onFieldBlur to SectionFormPanel
- `client/src/pages/applicant/WorkspacePage.tsx` — Integrated useValidation, CertificationPanel, useIsAuthorizedRep
- `e2e/workspaceValidation.spec.ts` — 4 Playwright tests for validation UI
- `e2e/workspaceCertification.spec.ts` — 6 Playwright tests for certification UI

## Decisions Made
- org_roles uses `roles` JSONB array (`roles @> '["authorized_representative"]'::jsonb`) — plan incorrectly assumed `role_type` column
- workspace_comments uses `posted_by` / `visibility` columns — plan assumed `author_user_id` / `is_internal`
- audit_events `payload` column (not `metadata`) — consistent with Phase 1 schema
- useIsAuthorizedRep queries existing org roles API — avoids adding a new backend endpoint

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed org_roles query: roles JSONB array, not role_type column**
- **Found during:** Task 1 (validationService + certificationService)
- **Issue:** Plan code used `role_type = 'authorized_representative'` but actual org_roles table uses `roles JSONB` array column
- **Fix:** Changed all queries to `roles @> '["authorized_representative"]'::jsonb AND revoked_at IS NULL`
- **Files modified:** src/services/workspace/validationService.ts, src/services/workspace/certificationService.ts
- **Verification:** All 14 integration tests pass
- **Committed in:** 895ba74 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed workspace_comments column names**
- **Found during:** Task 1 (certificationService.recordConcernFlag)
- **Issue:** Plan used `author_user_id` and `is_internal` columns but migration 012 defines `posted_by` and `visibility` columns
- **Fix:** Updated INSERT to use `posted_by` and `visibility = 'internal'`
- **Files modified:** src/services/workspace/certificationService.ts
- **Verification:** Concern flag test passes, workspace_comment created correctly
- **Committed in:** 895ba74 (Task 1 commit)

**3. [Rule 1 - Bug] Fixed opportunities table INSERT in tests (no grantor_org_id column)**
- **Found during:** Task 1 (test setup)
- **Issue:** Plan test code used `grantor_org_id` column which doesn't exist; opportunities requires many NOT NULL fields
- **Fix:** Updated INSERT to provide all required fields matching qa.test.ts pattern (via program_id FK)
- **Files modified:** tests/integration/workspaceValidation.test.ts, tests/integration/workspaceCertification.test.ts
- **Verification:** All tests pass with correct data setup
- **Committed in:** 895ba74 (Task 1 commit)

**4. [Rule 1 - Bug] Fixed application_workspaces INSERT (missing created_by NOT NULL)**
- **Found during:** Task 1 (test setup)
- **Issue:** Test INSERT omitted `created_by` column which is NOT NULL
- **Fix:** Added `created_by` to workspace INSERT in both test files
- **Files modified:** tests/integration/workspaceValidation.test.ts, tests/integration/workspaceCertification.test.ts
- **Verification:** Tests pass
- **Committed in:** 895ba74 (Task 1 commit)

**5. [Rule 1 - Bug] Fixed audit_events cleanup in test afterAll (immutability trigger)**
- **Found during:** Task 1 (test cleanup)
- **Issue:** audit_events_immutable trigger blocked DELETE of audit events during test cleanup, cascading FK violation on user deletion
- **Fix:** Added DISABLE/ENABLE TRIGGER pattern for audit_events cleanup in afterAll (extends Phase 1 pattern)
- **Files modified:** tests/integration/workspaceValidation.test.ts, tests/integration/workspaceCertification.test.ts
- **Verification:** Tests pass with clean teardown
- **Committed in:** 895ba74 (Task 1 commit)

**6. [Rule 2 - Missing Critical] Added useIsAuthorizedRep hook for client-side AR detection**
- **Found during:** Task 2 (CertificationPanel integration)
- **Issue:** Plan assumed AR role available as prop but no existing mechanism to detect AR role on client side
- **Fix:** Created useIsAuthorizedRep hook that queries GET /organizations/:org_id/roles and checks for authorized_representative
- **Files modified:** client/src/hooks/useIsAuthorizedRep.ts, client/src/pages/applicant/WorkspacePage.tsx
- **Verification:** Client builds, hook returns boolean for AR check
- **Committed in:** 9968dda (Task 2 commit)

---

**Total deviations:** 6 auto-fixed (5 × Rule 1 bugs, 1 × Rule 2 missing critical)
**Impact on plan:** All fixes necessary for correctness — aligned code to actual database schema. No scope creep.

## Known Stubs

None found.

## Issues Encountered
None

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Validation engine and certification complete, ready for submission snapshot (Plan 05-03)
- certificationService provides contract: certify(workspaceId, userId, certText) → Certification
- validationService provides contract: runValidation(workspaceId) → ValidationResult with three-tier classification
- ReadinessDashboard submit gate enforces blocking errors before submission

## Self-Check: PASSED

- All 12 key created files verified present on disk
- Both task commits verified in git history (895ba74, 9968dda)
- Backend TypeScript check passed (npx tsc --noEmit → exit 0)
- Client build passed (npm run build --prefix client → exit 0)
- 14 integration tests pass (6 validation + 8 certification)
- No blocking stubs found
- Known Stubs section present: "None found"
- Playwright e2e tests deferred to verify phase (10 tests written)

---
*Phase: 05-q-a-submission-validation*
*Completed: 2026-07-31*
