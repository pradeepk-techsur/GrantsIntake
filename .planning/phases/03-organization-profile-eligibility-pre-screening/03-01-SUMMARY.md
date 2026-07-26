---
phase: 03-organization-profile-eligibility-pre-screening
plan: "01"
subsystem: api
tags: [organizations, postgres, prisma, zod, supertest, vitest, audit-events, idor]

# Dependency graph
requires:
  - phase: 01-platform-foundation-opportunity-setup
    provides: auth, users table, pool.query pattern, audit_events table, authenticate middleware
  - phase: 02-eligibility-intake-rules-configuration
    provides: eligibilityService pattern, migration numbering (001-009 occupied)
provides:
  - Migration 010: organizations, org_contacts, org_roles, org_attachments tables
  - organizationService with 11 methods (createOrg, getOrg, getOrgIdForUser, verifyOrgMember, verifyOrgAdmin, updateOrg, getCredentialStatus, listDocuments, uploadDocument, listDocumentVersions, listRoles)
  - REST API: 11 endpoints at /api/v1/organizations/*
  - org_id FK usable by Phase 3 Plans 02/03 (eligibility responses, workspace pre-population)
affects: [03-02, 03-03, future-workspace-phase]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "parseOrgRow() helper: Postgres NUMERIC returned as string — parse to JS number in service layer"
    - "Base64 JSON document upload: multer not available; file_content_base64 in JSON body for v1"
    - "UUID_REGEX format guard: gates UUID param queries — prevents Postgres parse error 500 (same pattern as Phase 2 Plan 05)"
    - "computeCompleteness: 12 required fields, each worth 1/12 × 100, rounds to 2 decimal places"
    - "getCredentialStatus: SAM expiration + active attachment expiration dates with configurable warningWindowDays (default 60)"

key-files:
  created:
    - src/db/migrations/010_org_profile_schema.sql
    - src/types/organization.ts
    - src/services/organization/organizationService.ts
    - src/routes/organizations.ts
    - tests/integration/organizations.test.ts
  modified:
    - src/server.ts

key-decisions:
  - "Document upload uses base64 JSON body (not multipart) — multer not in package.json; documented in route file as v1 decision"
  - "parseOrgRow() helper converts Postgres NUMERIC string to JS number — Postgres pg driver returns NUMERIC as string, not number"
  - "Test afterAll disables audit_events_immutable trigger before deleting audit_events and users — same pattern established in Phase 1"

patterns-established:
  - "OrganizationService class with pool.query pattern (same as eligibilityService)"
  - "IDOR guard: UUID format check (→ 404) then verifyOrgMember/verifyOrgAdmin (→ 403)"
  - "computeCompleteness: numeric field normalization in service layer, not SQL"

# Metrics
duration: 6min
completed: 2026-07-26
---

# Phase 3 Plan 01: Organization Profile Schema + REST API Summary

**PostgreSQL org profile schema (migration 010) with organizations, org_contacts, org_roles, org_attachments tables; OrganizationService with 11 methods; 11 REST endpoints at /api/v1/organizations with IDOR guards, credential expiration warnings, and document version history**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-26T13:46:47Z
- **Completed:** 2026-07-26T13:53:29Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Migration 010 applied with 4 tables (organizations, org_contacts, org_roles, org_attachments), all DDL constraints (chk_uei_format, chk_ein_format, uq_org_user_role, chk_version_positive), and 9 indexes
- OrganizationService: profile completeness computation (12 required fields), full CRUD, credential expiration status (SAM + attachment types, configurable 60-day warning window), document version management with local file storage
- 11 REST endpoints with Zod validation, STRIDE mitigations (T-03-01 through T-03-08), ORGANIZATION_PROFILE_CREATED/UPDATED audit events
- 16 integration tests: all pass (0 failing, 0 skipped); full test suite 155 tests pass (0 regressions from previous 139)

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration 010 — org profile schema + organizationService** - `c85d101` (feat)
2. **Task 2: Organization REST API routes + server mount + integration tests** - `5372ffd` (feat)

## Files Created/Modified

- `src/db/migrations/010_org_profile_schema.sql` — Verbatim DDL: organizations, org_contacts, org_roles, org_attachments with all constraints and indexes
- `src/types/organization.ts` — Organization, OrgRole, OrgDocument, CredentialStatus, CreateOrgInput, UpdateOrgInput, UploadDocumentMeta interfaces
- `src/services/organization/organizationService.ts` — OrganizationService class with 11 methods + parseOrgRow() numeric coercion helper
- `src/routes/organizations.ts` — 11 REST endpoints with Zod schemas, IDOR guards, UUID format guards, base64 document upload
- `src/server.ts` — Mount organizationsRouter at /api/v1
- `tests/integration/organizations.test.ts` — 16 integration tests covering all endpoints, IDOR, auth enforcement, UEI validation, credential-status expired case

## Decisions Made

- **Base64 JSON document upload (not multipart):** multer is not in package.json. For v1, document uploads use a JSON body with `file_content_base64` field. Files stored locally under `uploads/orgs/`. This avoids multipart parsing complexity; upgrade to multer in a future iteration.
- **parseOrgRow() numeric coercion:** Postgres `pg` driver returns NUMERIC columns as strings. Added a `parseOrgRow()` helper to parse `profile_completeness_pct` and `indirect_cost_rate` to JS numbers before returning from service methods.
- **Test afterAll trigger pattern:** Disabling `audit_events_immutable` trigger to clean up audit_events AND actor_user_id references — consistent with pattern from Phase 1 auth tests.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Postgres NUMERIC returned as string, not number**
- **Found during:** Task 2 (integration test run 1)
- **Issue:** `profile_completeness_pct` field returned as `'100.00'` (string) instead of `100` (number); test `typeof res.body.profile_completeness_pct === 'number'` failed
- **Fix:** Added `parseOrgRow()` helper in organizationService.ts to convert NUMERIC fields to JS numbers using `parseFloat()`
- **Files modified:** src/services/organization/organizationService.ts
- **Verification:** Integration test #1 passes (typeof profile_completeness_pct === 'number')
- **Committed in:** 5372ffd (Task 2 commit)

**2. [Rule 1 - Bug] Test afterAll failed: users with audit_events (actor_user_id FK) couldn't be deleted**
- **Found during:** Task 2 (integration test run 1)
- **Issue:** `DELETE FROM users` failed with FK violation because `audit_events.actor_user_id` referenced test user IDs; original afterAll only deleted org audit_events by entity_id, not actor-based events
- **Fix:** Expanded afterAll to also delete audit_events WHERE actor_user_id matches test user IDs before deleting users; wrapped all in trigger-disable/enable block
- **Files modified:** tests/integration/organizations.test.ts
- **Verification:** All 16 tests pass including afterAll cleanup
- **Committed in:** 5372ffd (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both auto-fixes were necessary for correctness; no scope creep. Plan executed as specified otherwise.

## Issues Encountered

None beyond the auto-fixed bugs above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Organizations schema and API fully operational
- `organizationService.getOrgIdForUser()` and `organizationService.verifyOrgMember/verifyOrgAdmin()` ready for Plans 02 and 03
- `org_id` FK available for eligibility_responses (Plan 03-03) and workspace pre-population
- Plans 03-02 and 03-03 can now proceed (both require organizations table and organizationService)

---
*Phase: 03-organization-profile-eligibility-pre-screening*
*Completed: 2026-07-26*
