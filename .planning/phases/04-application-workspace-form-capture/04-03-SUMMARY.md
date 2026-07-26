---
phase: 04-application-workspace-form-capture
plan: 03
subsystem: api
tags: [form-fields, postgresql, express, react, uswds, validation, vitest]

# Dependency graph
requires:
  - phase: 04-application-workspace-form-capture
    plan: 01
    provides: application_sections table, workspaceService, workspacesRouter, two-step IDOR guard pattern
provides:
  - form_field_definitions table (11 field types, validation_config JSONB, formula, columns)
  - field_responses table (UNIQUE workspace+field, ON CONFLICT upsert)
  - formFieldService with getFieldsForSection, saveFieldResponse, validateSection
  - GET /api/v1/workspaces/:id/sections/:sectionId/fields endpoint
  - PUT /api/v1/workspaces/:id/sections/:sectionId/fields/:fieldId endpoint (upsert + 423 lock check)
  - POST /api/v1/workspaces/:id/sections/:sectionId/validate endpoint
  - FormFieldRenderer React component (all 11 field types, USWDS patterns)
  - SectionFormPanel React component (onBlur save, server-side validate, inline errors)
  - WorkspaceSectionPanel updated to integrate SectionFormPanel
affects:
  - 04-04-budget-attachments (needs field_responses + migration 013 base)
  - verify-phase (Playwright formFields.spec.ts)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ON CONFLICT DO UPDATE for idempotent field response upserts (UNIQUE workspace_id+field_id)
    - LEFT JOIN responses onto field definitions (current_response is null when no response exists)
    - onBlur save + 500ms deferred server validate (not per-keystroke)
    - FileReader base64 JSON for file_upload (file_name, mime_type, file_size_bytes, content_base64)
    - USWDS usa-form-group--error + usa-error-message inline validation pattern
    - UUID_REGEX guard on fieldId param (T-04-11)

key-files:
  created:
    - src/db/migrations/013_form_field_definitions_schema.sql
    - src/types/formField.ts
    - src/services/workspace/formFieldService.ts
    - tests/integration/formFields.test.ts
    - client/src/types/formField.ts
    - client/src/components/workspace/FormFieldRenderer.tsx
    - client/src/components/workspace/SectionFormPanel.tsx
    - e2e/formFields.spec.ts
  modified:
    - src/routes/workspaces.ts (added 3 field routes)
    - client/src/api/workspaceApi.ts (added getFields, saveField, validateSection + type re-exports)
    - client/src/components/workspace/WorkspaceSectionPanel.tsx (integrated SectionFormPanel, added data-testid)

key-decisions:
  - "Route path bug auto-fixed: new routes used /:id/... but workspacesRouter is mounted at /api/v1 and existing routes use /workspaces/:id/... — corrected to /workspaces/:id/sections/:sectionId/fields"
  - "formFieldService uses pool (not pool.connect) for read/save — transactions not needed since each operation is atomic"
  - "Router-level authenticate + blockGrantorOnWorkspace already applied to all field routes (redundant per-route authenticate harmless)"
  - "Playwright E2E tests written; execution deferred to verify phase per test execution boundary rules"

patterns-established:
  - "Field response upsert: ON CONFLICT (workspace_id, field_id) DO UPDATE — idempotent, no duplicate rows"
  - "Section status lifecycle: not_started → in_progress (first save) → error (validation fail) → complete (all required filled)"
  - "validation_errors JSONB persisted on application_sections.validation_errors by validateSection"

# Metrics
duration: 6min
completed: 2026-07-26
---

# Phase 4 Plan 03: Form Field Definitions and Capture Summary

**Migration 013 (form_field_definitions + field_responses), formFieldService with section validation, 3 field routes on workspacesRouter, and FormFieldRenderer supporting all 11 USWDS field types with onBlur-save and inline validation in SectionFormPanel**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-26T19:23:05Z
- **Completed:** 2026-07-26T19:29:47Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Migration 013 applied: `form_field_definitions` (11 field types, validation_config JSONB, formula, columns) and `field_responses` (UNIQUE workspace+field constraint enabling ON CONFLICT upsert)
- formFieldService: getFieldsForSection (LEFT JOIN with responses), saveFieldResponse (upsert + section status auto-update), validateSection (enforces required/char/word/number/date/picklist constraints; persists validation_errors JSONB and status to application_sections)
- 3 routes added to workspacesRouter: GET fields, PUT field response (with 423 lock check, T-04-11 UUID guard, T-04-13 size limit), POST validate (T-04-15 membership check)
- FormFieldRenderer.tsx: all 11 field types with USWDS patterns; file_upload uses FileReader base64 JSON; calculated uses simple SUM formula evaluator; repeating_table with add/remove rows
- SectionFormPanel.tsx: React Query for server state, onBlur save, 500ms deferred server-side validate, inline USWDS error-message display
- WorkspaceSectionPanel.tsx: SectionFormPanel integrated replacing the Phase 4 placeholder alert
- 11 integration tests pass (0 failing): empty fields, field with response, upsert, section status, 404/403/423 guards, validate invalid/valid

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration 013 + FormFieldService + field routes + integration tests** - `1f6c463` (feat)
2. **Task 2: FormFieldRenderer + SectionFormPanel + Playwright tests** - `e1ecc47` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/db/migrations/013_form_field_definitions_schema.sql` — form_field_definitions and field_responses DDL with indexes
- `src/types/formField.ts` — TypeScript interfaces: FormFieldDefinition, FieldResponse, SaveFieldResponseInput, ValidationResult
- `src/services/workspace/formFieldService.ts` — FormFieldService with getFieldsForSection, saveFieldResponse, validateSection
- `src/routes/workspaces.ts` — Added GET fields, PUT field response, POST validate routes; imported formFieldService
- `tests/integration/formFields.test.ts` — 11 integration tests (all passing)
- `client/src/types/formField.ts` — Client-side type mirrors matching server types
- `client/src/api/workspaceApi.ts` — Added getFields, saveField, validateSection methods + type re-exports
- `client/src/components/workspace/FormFieldRenderer.tsx` — All 11 field types with USWDS patterns
- `client/src/components/workspace/SectionFormPanel.tsx` — Field fetch, onBlur save, deferred validate, inline errors
- `client/src/components/workspace/WorkspaceSectionPanel.tsx` — Integrated SectionFormPanel; added data-testid
- `e2e/formFields.spec.ts` — 3 Playwright tests (execution deferred to verify phase)

## Decisions Made

- **Route path fix (auto)**: New field routes initially used `/:id/...` path prefix but the workspacesRouter is mounted at `/api/v1` and all existing routes use the full `/workspaces/:id/...` pattern. Fixed before committing — all 11 integration tests confirmed correct routing.
- **Redundant authenticate acceptable**: Router-level `workspacesRouter.use(authenticate)` already applies to field routes; the per-route `authenticate` in field handlers is redundant but harmless (Express calls next immediately when req.user is already set).
- **Playwright tests deferred**: Per test execution boundary rules, E2E tests that require a browser/server are not run during execute phase. Test files are written as artifacts; execution is strictly the verifier's responsibility.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed route path mismatch on field routes**
- **Found during:** Task 1 (integration test run)
- **Issue:** New routes used `/:id/sections/:sectionId/fields` but workspacesRouter uses `/workspaces/:id/sections/:sectionId/...` — all tests returned 404
- **Fix:** Changed route paths to include `/workspaces` prefix: `/workspaces/:id/sections/:sectionId/fields`, `/workspaces/:id/sections/:sectionId/fields/:fieldId`, `/workspaces/:id/sections/:sectionId/validate`
- **Files modified:** src/routes/workspaces.ts
- **Verification:** All 11 integration tests passed after fix
- **Committed in:** 1f6c463 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Routing bug essential to fix for all field API tests to pass. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviation above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Migration 013 applied; form_field_definitions and field_responses tables exist in DB
- formFieldService.getFieldsForSection, saveFieldResponse, validateSection all operational
- PUT /workspaces/:id/sections/:sectionId/fields/:fieldId route with upsert and lock check
- POST /workspaces/:id/sections/:sectionId/validate route with section status update
- FormFieldRenderer and SectionFormPanel ready for all 11 field types
- WorkspaceSectionPanel renders SectionFormPanel for all sections
- Ready for Phase 4 Plan 04 (budget/attachments) which will append to migration 013 or create 014
- Playwright tests in e2e/formFields.spec.ts awaiting verifier execution

---
*Phase: 04-application-workspace-form-capture*
*Completed: 2026-07-26*

## Self-Check: PASSED

All key files confirmed present on disk. Both commits (1f6c463, e1ecc47) verified in git log.
