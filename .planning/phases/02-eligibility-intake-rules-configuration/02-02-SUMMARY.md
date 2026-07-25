---
phase: 02-eligibility-intake-rules-configuration
plan: "02"
subsystem: api
tags: [postgres, express, react, uswds, playwright, vitest, typescript]

# Dependency graph
requires:
  - phase: 02-01
    provides: eligibility_rules table, EligibilityRule type, verifyOpportunityAccess pattern
provides:
  - Migration 008 with section_condition_configs, attachment_requirements, screening_criteria tables
  - SectionConditionService, AttachmentRequirementService, ScreeningCriteriaService with full CRUD
  - sectionConditionsRouter, attachmentRequirementsRouter, screeningCriteriaRouter
  - ConditionalSectionConfig, AttachmentRequirementsConfig, ScreeningCriteriaConfig React components
  - OpportunityBuilder extended with 3 new tabs
  - intakeConfig types: SectionConditionConfig, AttachmentRequirement, ScreeningCriterion
affects:
  - 02-03 (publish flow that consumes attachment/screening config)
  - 03 (applicant-facing form rendering uses section conditions)
  - 04 (application sections FK will connect to section_condition_configs)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Upsert pattern: INSERT ... ON CONFLICT DO UPDATE for section conditions (idempotent PUT)"
    - "Auto-criteria protection: SELECT criterion_type → 403 if auto before DELETE (T-02-07)"
    - "IDOR guard: join to grantor_roles in service layer for attachment requirement update (T-02-09)"
    - "Condition array validation: Zod max(20) + field/operator shape (T-02-08)"
    - "DoS mitigation: file_format_restrictions max 20 entries, each ≤ 10 chars (T-02-11)"
    - "XSS: all DB strings rendered via JSX interpolation, never dangerouslySetInnerHTML (T-02-12)"

key-files:
  created:
    - src/db/migrations/008_conditional_and_intake_schema.sql
    - src/types/intakeConfig.ts
    - src/services/eligibility/sectionConditionService.ts
    - src/services/eligibility/attachmentRequirementService.ts
    - src/services/eligibility/screeningCriteriaService.ts
    - src/routes/sectionConditions.ts
    - src/routes/attachmentRequirements.ts
    - src/routes/screeningCriteria.ts
    - tests/integration/sectionConditions.test.ts
    - tests/integration/attachmentRequirements.test.ts
    - tests/integration/screeningCriteria.test.ts
    - client/src/pages/grantor/opportunities/ConditionalSectionConfig.tsx
    - client/src/pages/grantor/opportunities/AttachmentRequirementsConfig.tsx
    - client/src/pages/grantor/opportunities/ScreeningCriteriaConfig.tsx
    - e2e/intake-config.spec.ts
  modified:
    - src/server.ts
    - client/src/pages/grantor/opportunities/OpportunityBuilder.tsx

key-decisions:
  - "Migration numbered 008 (not 007) — 007_prescreening_schema.sql already occupied slot 007 from plan 02-01"
  - "Section conditions: PUT uses ON CONFLICT upsert — idempotent semantics for the same section_key per opportunity"
  - "Auto-criteria delete guard: implemented at service layer (screeningCriteriaService.delete) before route handler — cannot be bypassed by direct route call"
  - "Attachment requirement IDOR (T-02-09): grantor_roles membership check in service update() method via join to opportunities+programs+grantor_roles"

patterns-established:
  - "Intake config services follow same pool.query pattern as eligibilityService.ts"
  - "Route validation at route layer (Zod), business validation at service layer"
  - "React config components: fetch on mount, inline form toggle, USWDS cards/tables for display"

# Metrics
duration: 9min
completed: 2026-07-25
---

# Phase 2 Plan 02: Conditional Sections, Attachment Requirements, and Screening Criteria Summary

**Three intake configuration subsystems (F10/F11/F12) implemented: section-level display conditions with upsert, attachment requirements with stage/type scoping, and screening criteria with auto-criteria protection (403 guard)**

## Performance

- **Duration:** 9 min
- **Started:** 2026-07-25T21:33:21Z
- **Completed:** 2026-07-25T21:42:50Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments

- Migration 008 creates `section_condition_configs` (UNIQUE key on opportunity_id+section_key), `attachment_requirements`, and `screening_criteria` tables with indexes
- Three backend services + three routers with full CRUD, auth guards, validation, and security mitigations (T-02-07 through T-02-12)
- Three React UI tab panels (ConditionalSectionConfig, AttachmentRequirementsConfig, ScreeningCriteriaConfig) wired into OpportunityBuilder
- 16 integration tests pass (CRUD, 401/403/400/422 guards); 4 Playwright e2e tests written for verify phase

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration + backend services + integration tests** - `aa62edd` (feat)
2. **Task 2: UI components + OpportunityBuilder + e2e tests** - `a7bbf24` (feat)

**Plan metadata:** see docs commit below

## Files Created/Modified

- `src/db/migrations/008_conditional_and_intake_schema.sql` - Three new tables with DDL from plan (verbatim), indexes
- `src/types/intakeConfig.ts` - SectionConditionConfig, SectionCondition, AttachmentRequirement, ScreeningCriterion interfaces
- `src/services/eligibility/sectionConditionService.ts` - list, upsert (ON CONFLICT), delete
- `src/services/eligibility/attachmentRequirementService.ts` - list, create (stage/size/format validation + T-02-09 IDOR), update, delete
- `src/services/eligibility/screeningCriteriaService.ts` - list, create (auto_criterion_key validation), update, delete (T-02-07: 403 for auto)
- `src/routes/sectionConditions.ts` - PUT/GET/DELETE with authenticate + requireRole + T-02-08 Zod condition validation
- `src/routes/attachmentRequirements.ts` - GET/POST/PUT/DELETE with T-02-11 format restrictions validation
- `src/routes/screeningCriteria.ts` - GET/POST/PUT/DELETE with 403 on auto-criteria delete
- `src/server.ts` - Registered sectionConditionsRouter, attachmentRequirementsRouter, screeningCriteriaRouter
- `tests/integration/sectionConditions.test.ts` - 5 tests (upsert, duplicate prevention, 401, 422)
- `tests/integration/attachmentRequirements.test.ts` - 6 tests (CRUD, 400 invalid stage, 401)
- `tests/integration/screeningCriteria.test.ts` - 5 tests (manual CRUD, auto creation, 403, 401)
- `client/src/pages/grantor/opportunities/ConditionalSectionConfig.tsx` - USWDS condition builder, PUT/DELETE, summary cards
- `client/src/pages/grantor/opportunities/AttachmentRequirementsConfig.tsx` - USWDS inline form, table grouped by stage_scope
- `client/src/pages/grantor/opportunities/ScreeningCriteriaConfig.tsx` - Auto criteria locked rows (lock icon + aria-label), manual criteria list with drag-to-reorder
- `client/src/pages/grantor/opportunities/OpportunityBuilder.tsx` - Added conditional-sections, attachments, screening tabs
- `e2e/intake-config.spec.ts` - 4 Playwright scenarios (written for verify phase)

## Decisions Made

- Migration numbered 008 instead of 007 — slot 007 already occupied by prescreening migration from plan 02-01
- Used `INSERT ... ON CONFLICT DO UPDATE` for section conditions — idempotent PUT semantics for the same (opportunity_id, section_key)
- Auto-criteria protection implemented at service layer not route layer — cannot be bypassed
- Attachment requirement IDOR check joins opportunities → programs → grantor_roles inside update() service method

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration renumbered from 007 to 008**
- **Found during:** Task 1 setup
- **Issue:** The plan specified `007_conditional_and_intake_schema.sql` but `007_prescreening_schema.sql` already exists (created in 02-01). Applying 007 would be a naming conflict.
- **Fix:** Created `008_conditional_and_intake_schema.sql` with identical DDL content from the plan
- **Files modified:** src/db/migrations/008_conditional_and_intake_schema.sql
- **Verification:** Migration applied cleanly; all three tables confirmed in DB; integration contracts updated to reference 008
- **Committed in:** aa62edd (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Migration rename only — all DDL content matches plan verbatim. No functional impact. Integration contracts verified with `grep` per plan spec.

## Issues Encountered

None — all tasks completed without blocking issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three intake configuration subsystems (F10/F11/F12) ready
- section_condition_configs, attachment_requirements, screening_criteria tables populated and queryable
- 02-03 can consume attachment/screening config for opportunity publish readiness checks
- Playwright e2e tests deferred to verify phase (as per test execution boundary rules)

---
*Phase: 02-eligibility-intake-rules-configuration*
*Completed: 2026-07-25*
