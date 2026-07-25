---
phase: 02-eligibility-intake-rules-configuration
plan: 01
subsystem: eligibility
tags: [eligibility-rules, prescreening, postgres, express, react, uswds, audit-trail]

# Dependency graph
requires:
  - phase: 01-platform-foundation-opportunity-setup
    provides: opportunities table, programs table, grantor_roles RBAC, audit_events, authenticate/requireRole middleware, USWDS component pattern

provides:
  - eligibility_rules table with chk_enforcement_point constraint and FK to opportunities
  - prescreening_questionnaires, prescreening_questions, prescreening_options tables with FK chain to eligibility_rules
  - EligibilityRule, PrescreeningQuestionnaire, PrescreeningQuestion, PrescreeningOption TypeScript interfaces
  - eligibilityService: list, create (IDOR+audit), update (IDOR+audit), delete (IDOR+audit)
  - prescreeningService: get (nested), upsert (transactional delete+reinsert), preview
  - REST API: GET/POST /eligibility-rules, PUT/DELETE /eligibility-rules/:rule_id, GET/PUT/POST /prescreening
  - EligibilityRuleBuilder UI tab with hard blocker (usa-alert--error) and advisory (usa-alert--warning) styling
  - PrescreeningBuilder UI tab with question types, conditional display, option-to-rule mapping, preview modal
  - ELIGIBILITY_RULE_CREATED/UPDATED/DELETED audit events on every mutation

affects: [03-opportunity-publication-discovery, 05-eligibility-prescreening, eligibility-enforcement, prescreening-workflow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "IDOR guard: rule-level grantor_org membership check in eligibilityService.update/delete (T-02-02)"
    - "criterion_value JSONB schema validation at route layer (T-02-03): string | string[] | number only"
    - "T-02-04: GET /eligibility-rules requires grantor membership (not just any authenticated user)"
    - "T-02-05: questions ≤ 50, options per question ≤ 20 enforced via zod at route layer"
    - "T-02-06: explanation_text in React JSX text interpolation (not dangerouslySetInnerHTML)"
    - "Prescreening upsert: delete+reinsert questions/options in transaction for clean slate"
    - "Migration numbering: 006/007 (not 005/006) due to pre-existing 005_funding_amount_max_nullable.sql"

key-files:
  created:
    - src/db/migrations/006_eligibility_schema.sql
    - src/db/migrations/007_prescreening_schema.sql
    - src/types/eligibility.ts
    - src/services/eligibility/eligibilityService.ts
    - src/services/eligibility/prescreeningService.ts
    - src/routes/eligibility.ts
    - src/routes/prescreening.ts
    - tests/integration/eligibility.test.ts
    - tests/integration/prescreening.test.ts
    - client/src/pages/grantor/opportunities/EligibilityRuleBuilder.tsx
    - client/src/pages/grantor/opportunities/PrescreeningBuilder.tsx
    - e2e/eligibility-rules.spec.ts
  modified:
    - src/server.ts
    - client/src/pages/grantor/opportunities/OpportunityBuilder.tsx

key-decisions:
  - "Migration files named 006/007 (plan specified 005/006) — pre-existing 005_funding_amount_max_nullable.sql occupied 005"
  - "IDOR for rule update/delete implemented inside service layer (not route): verifies caller has grantor_roles membership on rule's org"
  - "criterion_value accepted as string, string[] (comma-separated shorthand), or number; serialized to JSONB"
  - "Prescreening upsert uses delete+reinsert (not merge) for questions/options — simpler and idempotent"
  - "Playwright e2e tests written but not run during execute phase (deferred to verify phase)"

patterns-established:
  - "STRIDE threat mitigations implemented for all 6 T-02-0x threats (T-02-01 through T-02-06)"
  - "Audit events use entity_type='eligibility_rule' (not 'opportunity') for finer-grained audit trail"

# Metrics
duration: 10min
completed: 2026-07-25
---

# Phase 02 Plan 01: Eligibility Rules + Prescreening Configuration Summary

**Eligibility rule CRUD with hard_blocker/advisory severity, enforcement_point constraint, and prescreening questionnaire builder — backend + USWDS UI tabs with full STRIDE mitigation**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-25T21:18:50Z
- **Completed:** 2026-07-25T21:29:32Z
- **Tasks:** 2
- **Files modified:** 14 (12 created, 2 modified)

## Accomplishments

- Database migrations with eligibility_rules table (chk_enforcement_point DB constraint) and prescreening questionnaires/questions/options with FK chain to eligibility_rules
- Backend services with full CRUD, IDOR protection (T-02-02), JSONB validation (T-02-03), org-scoped GET (T-02-04), questionnaire limits (T-02-05), and ELIGIBILITY_RULE_CREATED/UPDATED/DELETED audit events
- EligibilityRuleBuilder UI: hard blockers in red usa-alert--error cards, advisories in yellow usa-alert--warning cards, client-side enforcement_point validation (T-02-06)
- PrescreeningBuilder UI: yes_no/multiple_choice/text question types, conditional display, option-to-rule mapping, HTML5 drag-and-drop ordering, preview modal
- All 18 new integration tests pass (104 total across the test suite)

## Task Commits

Each task was committed atomically:

1. **Task 1: DB migrations, services, routes, integration tests** - `51e7b53` (feat)
2. **Task 2: EligibilityRuleBuilder + PrescreeningBuilder UI + Playwright tests** - `ccf2807` (feat)

**Plan metadata:** (see final commit below)

_Note: E2E Playwright tests written in e2e/eligibility-rules.spec.ts; execution deferred to verify phase._

## Files Created/Modified

- `src/db/migrations/006_eligibility_schema.sql` - eligibility_rules with chk_enforcement_point constraint
- `src/db/migrations/007_prescreening_schema.sql` - prescreening_questionnaires/questions/options tables
- `src/types/eligibility.ts` - EligibilityRule, PrescreeningQuestionnaire, PrescreeningQuestion, PrescreeningOption interfaces
- `src/services/eligibility/eligibilityService.ts` - CRUD with IDOR guard and audit events
- `src/services/eligibility/prescreeningService.ts` - get (nested), upsert (transactional), preview
- `src/routes/eligibility.ts` - GET/POST /eligibility-rules, PUT/DELETE /eligibility-rules/:rule_id
- `src/routes/prescreening.ts` - GET/PUT /prescreening, POST /prescreening/preview
- `src/server.ts` - registered eligibilityRouter and prescreeningRouter
- `tests/integration/eligibility.test.ts` - 12 tests (happy path, 400/401/403, audit events, delete)
- `tests/integration/prescreening.test.ts` - 6 tests (empty GET, upsert, nested GET, conditional display, preview)
- `client/src/pages/grantor/opportunities/EligibilityRuleBuilder.tsx` - rule builder UI with USWDS alert styling
- `client/src/pages/grantor/opportunities/PrescreeningBuilder.tsx` - questionnaire builder with preview modal
- `client/src/pages/grantor/opportunities/OpportunityBuilder.tsx` - added Eligibility Rules + Pre-Screening tabs
- `e2e/eligibility-rules.spec.ts` - 4 Playwright scenarios for verify phase

## Decisions Made

- Migration files renamed 006/007 (plan listed 005/006) because 005_funding_amount_max_nullable.sql already existed
- IDOR guard for rule update/delete implemented inside service layer (verifies caller's grantor_roles membership on rule's opportunity org)
- criterion_value accepted as string | string[] (comma-separated shorthand) | number; coerced at route layer before storing as JSONB
- Prescreening upsert uses delete+reinsert pattern for questions/options in a transaction (simpler than merge, idempotent)
- E2E Playwright tests written but execution deferred to verify phase (per test execution boundary protocol)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration numbering conflict**
- **Found during:** Task 1 (creating migration files)
- **Issue:** Plan specified 005_eligibility_schema.sql and 006_prescreening_schema.sql, but 005_funding_amount_max_nullable.sql already existed from Phase 1 Plan 06
- **Fix:** Named files 006_eligibility_schema.sql and 007_prescreening_schema.sql to avoid overwriting existing migration
- **Files modified:** 006_eligibility_schema.sql, 007_prescreening_schema.sql
- **Verification:** Both migrations applied cleanly, all constraints verified
- **Committed in:** 51e7b53 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix was necessary to avoid overwriting existing migration. All contracts (table names, constraints, FK chain) delivered exactly as specified. No scope creep.

## Issues Encountered

None - all planned work completed successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- eligibility_rules table available for pre-screening enforcement (Phase 3/5)
- prescreening_questionnaires/questions/options tables ready for applicant-facing pre-screening workflow (Phase 5)
- EligibilityRuleBuilder and PrescreeningBuilder UI accessible via OpportunityBuilder tabs
- Playwright e2e tests in e2e/eligibility-rules.spec.ts await verify phase execution

---
*Phase: 02-eligibility-intake-rules-configuration*
*Completed: 2026-07-25*

## Self-Check: PASSED

- [x] `src/db/migrations/006_eligibility_schema.sql` — exists
- [x] `src/db/migrations/007_prescreening_schema.sql` — exists
- [x] `src/types/eligibility.ts` — exists
- [x] `src/services/eligibility/eligibilityService.ts` — exists
- [x] `src/services/eligibility/prescreeningService.ts` — exists
- [x] `src/routes/eligibility.ts` — exists
- [x] `src/routes/prescreening.ts` — exists
- [x] `client/src/pages/grantor/opportunities/EligibilityRuleBuilder.tsx` — exists
- [x] `client/src/pages/grantor/opportunities/PrescreeningBuilder.tsx` — exists
- [x] `e2e/eligibility-rules.spec.ts` — exists
- [x] Commit 51e7b53 — exists (Task 1)
- [x] Commit ccf2807 — exists (Task 2)
