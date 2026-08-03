---
pivota_spec_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: completed
stopped_at: Completed 06-02-PLAN.md
last_updated: "2026-08-03T03:00:00.000Z"
last_activity: "2026-08-03 — GrantFlow Design System v1.0 migration complete: all 51 TSX files converted from usa-* to gf-* classes, @uswds/uswds removed, CSS 570KB→15KB"
progress:
  total_phases: 11
  completed_phases: 5
  total_plans: 46
  completed_plans: 45
  percent: 97
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-24)

**Core value:** Grantors receive better applications and applicants submit with less burden — by replacing fragmented, document-heavy intake with a structured, guided, data-driven workflow that enforces completeness, preserves auditability, and accelerates handoff from submission to review.
**Current focus:** Phase 5 — Q&A, Submission & Validation

## Current Position

Phase: 5 of 7 (Q&A, Submission & Validation)
Plan: 2 of 3 in current phase — Plan 05-02 complete
Status: Plan 05-02 Complete — Validation engine (three-tier), certification service (SHA-256), submit gate
Last activity: 2026-07-31 — Plan 05-02 complete: Continuous validation, AR certification, ReadinessDashboard submit gate

Progress: [█████████▒] 97%

## Performance Metrics

**Velocity:**

- Total plans completed: 4
- Average duration: 8.5 min
- Total execution time: 34 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 1: Platform Foundation | 4 of 4 | 34 min | 8.5 min |

**Recent Trend:**

- Last 5 plans: 7 min, 8 min, 10 min, 9 min
- Trend: stable

*Updated after each plan completion*

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 (Auth foundation) | 7 min | 2 | 22 |
| Phase 01-platform-foundation-opportunity-setup P02 | 8min | 2 tasks | 27 files |
| Phase 01-platform-foundation-opportunity-setup P03 | 10 min | 2 tasks | 20 files |
| Phase 01-platform-foundation-opportunity-setup P04 | 9min | 2 tasks | 14 files |
| Phase 01-platform-foundation-opportunity-setup P05 | 4min | 2 tasks | 2 files |
| Phase 01-platform-foundation-opportunity-setup P06 | 2 min | 2 tasks | 5 files |
| Phase 02-eligibility-intake-rules-configuration P01 | 10 min | 2 tasks | 14 files |
| Phase 02-eligibility-intake-rules-configuration P02 | 9 min | 2 tasks | 17 files |
| Phase 02-eligibility-intake-rules-configuration P03 | 10 min | 2 tasks | 17 files |
| Phase 02-eligibility-intake-rules-configuration P04 | 8min | 2 tasks | 2 files |
| Phase 02-eligibility-intake-rules-configuration P05 | 1 min | 1 tasks | 1 files |
| Phase 03-organization-profile-eligibility-pre-screening P01 | 6 min | 2 tasks | 6 files |
| Phase 03-organization-profile-eligibility-pre-screening P02 | 5 min | 2 tasks | 10 files |
| Phase 03-organization-profile-eligibility-pre-screening P04 | 1 min | 1 tasks | 1 files |
| Phase 03-organization-profile-eligibility-pre-screening P05 | 2min | 2 tasks | 4 files |
| Phase 04-application-workspace-form-capture P01 | 9 min | 2 tasks | 15 files |
| Phase 04-application-workspace-form-capture P02 | 7min | 2 tasks | 10 files |
| Phase 04-application-workspace-form-capture P03 | 6 min | 2 tasks | 11 files |
| Phase 04-application-workspace-form-capture P04 | 12 min | 2 tasks | 17 files |
| Phase 04-application-workspace-form-capture P05 | 2min | 2 tasks | 3 files |
| Phase 04-application-workspace-form-capture P06 | 4min | 2 tasks | 7 files |
| Phase 04-application-workspace-form-capture P09 | 1 min | 1 tasks | 1 files |
| Phase 04-application-workspace-form-capture P07 | 2min | 2 tasks | 4 files |
| Phase 04-application-workspace-form-capture P08 | 3 min | 2 tasks | 3 files |
| Phase 04-application-workspace-form-capture P11 | 3 min | 2 tasks | 2 files |
| Phase 04-application-workspace-form-capture P10 | 5 min | 2 tasks | 1 files |
| Phase 04-application-workspace-form-capture P12 | 5 min | 1 tasks | 1 files |
| Phase 04-application-workspace-form-capture P13 | 9min | 2 tasks | 5 files |
| Phase 05-q-a-submission-validation P01 | 13 min | 2 tasks | 13 files |
| Phase 05-q-a-submission-validation P02 | 12 min | 2 tasks | 17 files |
| Phase 05-q-a-submission-validation P04 | 3 min | 2 tasks | 3 files |
| Phase 05-q-a-submission-validation P05 | 3 min | 2 tasks | 2 files |
| Phase 05-q-a-submission-validation P07 | 1 min | 2 tasks | 4 files |
| Phase 05-q-a-submission-validation P06 | 3 min | 2 tasks | 6 files |
| Phase 05-q-a-submission-validation P08 | 1min | 2 tasks | 3 files |
| Phase 05-q-a-submission-validation P09 | 2min | 2 tasks | 2 files |
| Phase 05-q-a-submission-validation P10 | 3min | 2 tasks | 6 files |
| Phase 05-q-a-submission-validation P12 | 18 min | 1 tasks | 1 files |
| Phase 05-q-a-submission-validation P11 | 8min | 1 tasks | 1 files |
| Phase 06-intake-queue-screening-analytics P01 | 20 min | 2 tasks | 13 files |
| Phase 06-intake-queue-screening-analytics P02 | 11 min | 2 tasks | 4 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Layered monolith architecture — Auth Service → Opportunity Service → Organization Service → Application Service → Submission Service → Analytics & Notification Service
- [Roadmap]: Phase 1 includes US-1.0 (grantor portal shell + RBAC) as foundation prerequisite before any domain features
- [Roadmap]: Grantor-side configuration (Phases 1–2) precedes applicant-side features (Phases 3–4) because eligibility rules and form configs must exist before applicants can pre-screen or apply
- [Phase 01-platform-foundation-opportunity-setup]: jose 5 over jsonwebtoken for JWT (ESM-native, Edge-compatible)
- [Phase 01-platform-foundation-opportunity-setup]: Redis refresh token storage: refresh:{userId}:{jti} keys with TTL for fast invalidation
- [Phase 01-platform-foundation-opportunity-setup]: audit_events immutability enforced via PostgreSQL trigger (not application layer)
- [UI Migration 2026-08-03]: GrantFlow Design System v1.0 adopted — replaces @uswds/uswds with purpose-built grantflow.css (15KB vs 570KB USWDS). All usa-* classes replaced with gf-* across 51 TSX files. Color tokens: primary-dark #003558, primary #005EA6, page-bg #F7F9FC. Components: gf-sidebar, gf-header, gf-card, gf-table, gf-btn, gf-badge, gf-alert, gf-stat-card, gf-form-group, gf-input, gf-select, gf-pagination, gf-progress, gf-checklist.
- [UI Migration 2026-08-03]: @uswds/uswds package uninstalled from client/package.json — no longer a dependency. vite.config.ts alias for USWDS CSS removed. main.tsx imports only ./grantflow.css.
- [UI Migration 2026-08-03]: Figma GrantFlow DS v1.0 spec implemented — applicant dashboard matches "Good afternoon, Priya" layout (greeting + 3 stat cards + applications table); grantor dashboard matches "Program operations" layout (3 stat cards + work queue table). Login page is centered card. All pages use dark navy sidebar (#003558) with active highlight (#005EA6).
- [Phase 01-platform-foundation-opportunity-setup]: USWDS CSS was imported via vite alias — superseded by GrantFlow DS v1.0 migration on 2026-08-03
- [Phase 01-platform-foundation-opportunity-setup]: Access token in Zustand memory only (not localStorage) — XSS mitigation per T-02-04; refresh token in httpOnly cookie from server
- [Phase 01-platform-foundation-opportunity-setup]: getGrantorOrgIdForUser() pattern: grantor_org_id derived at runtime from grantor_roles WHERE user_id (never from request body) — T-02-01 IDOR mitigation
- [Phase 01-platform-foundation-opportunity-setup]: audit_events entity_type/entity_id column names (not resource_type/resource_id)
- [Phase 01-platform-foundation-opportunity-setup]: Two-step IDOR guard: EXISTS check (404) then org check (403) to prevent org enumeration
- [Phase 01-platform-foundation-opportunity-setup]: Test cleanup for immutable tables: ALTER TABLE DISABLE/ENABLE TRIGGER in afterAll — immutability trigger fires even during test cleanup
- [Phase 01-platform-foundation-opportunity-setup]: Dry run pattern: POST /publish?dry_run=true returns completeness result without state change (used by Check Readiness button)
- [Phase 01-platform-foundation-opportunity-setup]: Client-side completeness derived from opportunity prop for real-time checklist feedback; server is authoritative at actual publish
- [Phase 01-platform-foundation-opportunity-setup]: SELECT-then-INSERT for programs seed (no UNIQUE constraint on program_name) and for grantor_organizations fix
- [Phase 01-platform-foundation-opportunity-setup]: funding_amount_max is a builder field, not a creation prerequisite — optional at creation, consistent with updateOpportunitySchema
- [Phase 02-eligibility-intake-rules-configuration]: Migration numbering: 006/007 (not 005/006) — pre-existing 005_funding_amount_max_nullable.sql occupied slot 005
- [Phase 02-eligibility-intake-rules-configuration]: IDOR for eligibility rule update/delete: grantor_roles membership check inside service layer, returns 404 (not 403) to prevent org enumeration
- [Phase 02-eligibility-intake-rules-configuration]: criterion_value JSONB: string | string[] | number accepted at route layer (comma-separated treated as string array)
- [Phase 02-eligibility-intake-rules-configuration]: Migration numbered 008 (not 007) — 007_prescreening_schema.sql already occupied slot 007
- [Phase 02-eligibility-intake-rules-configuration]: Section conditions: PUT uses ON CONFLICT upsert — idempotent semantics for same section_key per opportunity
- [Phase 02-eligibility-intake-rules-configuration]: Auto-criteria delete guard implemented at service layer (screeningCriteriaService.delete) — cannot be bypassed
- [Phase 02-eligibility-intake-rules-configuration]: Migration numbered 009: slots 001-008 occupied; publicOpportunitiesRouter mounted before opportunitiesRouter for unauthenticated public access; GIN index uses executive_summary+eligibility_summary (not description); optional auth on detail route via dynamic verifyAccessToken import
- [Phase 02-eligibility-intake-rules-configuration]: Publish route delegates entirely to publicationService.publish() — no inline SQL in route handler; versioningService import retained (used by PATCH and GET /versions)
- [Phase 02-eligibility-intake-rules-configuration]: UUID_REGEX format guard gates WHERE opportunity_id = $1 query — slug-shaped params skip UUID lookup entirely, eliminating Postgres UUID parse error 500
- [Phase 03-organization-profile-eligibility-pre-screening]: Base64 JSON document upload (not multipart) — multer not in package.json; documented in route file as v1 decision
- [Phase 03-organization-profile-eligibility-pre-screening]: parseOrgRow() helper converts Postgres NUMERIC string to JS number — Postgres pg driver returns NUMERIC as string
- [Phase 03-organization-profile-eligibility-pre-screening]: Test afterAll disables audit_events_immutable trigger before deleting audit_events where actor_user_id matches test users — extends Phase 1 pattern
- [Phase 03-organization-profile-eligibility-pre-screening]: org_id stored in localStorage key applicant_org_id — non-sensitive UUID, org data requires auth token (T-03-10 accepted risk)
- [Phase 03-organization-profile-eligibility-pre-screening]: OrgDocumentsPage uses base64 JSON upload matching Plan 01 server contract (multer not in package.json)
- [Phase 03-organization-profile-eligibility-pre-screening]: UUID_REGEX guard gates handleAssignSubmit before assignMutation.mutate — prevents 422 when email entered in User ID field (PRD-INTAKE-022)
- [Phase 03-organization-profile-eligibility-pre-screening]: GET my-result derives org_id server-side via organizationService.getOrgIdForUser (T-03-22 pattern) — IDOR mitigation for applicant result fetch
- [Phase 03-organization-profile-eligibility-pre-screening]: 409 ALREADY_SUBMITTED navigates to result page with state:null so PrescreenResultPage API fallback activates automatically
- [Phase 04-application-workspace-form-capture]: GRANTOR_BLOCK at router layer before IDOR guard — prevents grantor roles from discovering workspace existence via timing (T-04-03)
- [Phase 04-application-workspace-form-capture]: Section assignment role check via DB query not JWT — org_roles not in JWT payload; mirrors T-03-22 pattern
- [Phase 04-application-workspace-form-capture]: Zustand for activeSectionType UI state; React Query for server state — section switching is in-page, no URL change
- [Phase 04-application-workspace-form-capture]: workspace + 9 sections created atomically in single DB transaction — atomicity guarantees sections always exist
- [Phase 04-application-workspace-form-capture]: blockGrantorOnWorkspace at workspacesRouter.use() level — blanket block on ALL workspace routes replaces per-route blockGrantors() on comments
- [Phase 04-application-workspace-form-capture]: readinessService gracefully handles missing attachments table via 42P01 error code guard (table created in future phase)
- [Phase 04-application-workspace-form-capture]: ReadinessDashboard uses refetchInterval: 30000 + staleTime: 20000 (React Query polling, no WebSocket — ws library not in package.json)
- [Phase 04-application-workspace-form-capture]: ON CONFLICT DO UPDATE for idempotent field response upserts (UNIQUE workspace_id+field_id)
- [Phase 04-application-workspace-form-capture]: FileReader base64 JSON for file_upload: { file_name, mime_type, file_size_bytes, content_base64 } — consistent with Phase 3 multer-free decision
- [Phase 04-application-workspace-form-capture]: onBlur save + 500ms deferred server validate — field saved on blur, validation triggered 500ms later to avoid excessive server roundtrips
- [Phase 04-application-workspace-form-capture]: Migration 013_budget_attachments_schema.sql registered separately; alphabetical sort means budget schema applied before form_field (form_field was already in DB)
- [Phase 04-application-workspace-form-capture]: match_requirement column not present in opportunities — validateBudget enforces only funding_amount_max ceiling; match validation deferred to future migration
- [Phase 04-application-workspace-form-capture]: Attachment version history: deactivate prior (is_active=false) then INSERT new with version_number = MAX+1; preview excludes workspace_comments by structural omission from all previewService queries
- [Phase 04-application-workspace-form-capture]: match_required DEFAULT FALSE preserves backward compat; MATCH_REQUIREMENT_NOT_MET emitted when match_required=true AND match_percentage>0 AND total_match < required_amount (PRD-INTAKE-040)
- [Phase 04-application-workspace-form-capture]: ON CONFLICT DO NOTHING for org_roles upsert (UNIQUE constraint on org_id+user_id); explicit ::type casts in INSERT SELECT WHERE NOT EXISTS for application_sections to avoid PostgreSQL 42P08 type inference error
- [Phase 04-application-workspace-form-capture]: CSS clip positioning for file input in AttachmentManager instead of display:none — USWDS class applies while element stays non-interactive via tabIndex=-1
- [Phase 04-application-workspace-form-capture]: useMutation wraps workspaceApi.createWorkspace; on 409 DUPLICATE_WORKSPACE navigates to existing workspace id if provided in error body
- [Phase 04-application-workspace-form-capture]: Preview Application Link placed in WorkspacePage page header (after opportunity hint) and ReadinessDashboard usa-card__footer
- [Phase 04-application-workspace-form-capture]: Grid columns corrected 3+6+3=12 to 2+5+2=9 to fit desktop:grid-col-9 ApplicantLayout parent (UAT Test 5)
- [Phase 04-application-workspace-form-capture]: BudgetBuilder Add Line Item button moved outside accordion gate to always-visible header; auto-expands accordion on click (UAT Test 7)
- [Phase 04-application-workspace-form-capture]: Save indicator placed before field list for immediate visibility on blur; isSuccess && !isPending prevents flicker
- [Phase 04-application-workspace-form-capture]: Playwright tests use window.history.pushState + PopStateEvent for in-SPA navigation to preserve Zustand in-memory accessToken across route changes
- [Phase 04-application-workspace-form-capture]: No workspace row seeded for UAT-OPP-002 — absence of workspace enables Start Application CTA (PRD-INTAKE-030 UAT Test 2)
- [Phase 04-application-workspace-form-capture]: opportunityQuery uses workspaceQuery.data?.opportunity_id as dependency (declared before loading/error guards); renders title with UUID fallback
- [Phase 04-application-workspace-form-capture]: playwright.config.ts baseURL corrected to localhost:5173 (Vite dev server) — API server on 3000 does not serve frontend routes
- [Phase 05-q-a-submission-validation]: audit_events column is 'payload' (not 'metadata') — aligned to existing schema from Phase 1
- [Phase 05-q-a-submission-validation]: Notification via audit_events: NOTIFICATION_SENT per workspace with payload containing notification_type, IDs, workspace_link — Phase 6 adds real email delivery
- [Phase 05-q-a-submission-validation]: Q&A window enforcement via opportunity.qa_config JSONB (enabled, question_window_open, question_window_close) — no extra migration needed
- [Phase 05-q-a-submission-validation]: org_roles query uses `roles @> '["authorized_representative"]'::jsonb` (JSONB array), not role_type column
- [Phase 05-q-a-submission-validation]: workspace_comments uses posted_by/visibility columns per migration 012 schema (not author_user_id/is_internal)
- [Phase 05-q-a-submission-validation]: useIsAuthorizedRep hook queries GET /organizations/:org_id/roles — no new backend endpoint needed for client-side AR detection
- [Phase 05-q-a-submission-validation]: App.tsx qa-inbox redirect left as-is — canonical path is OpportunityBuilder Q&A tab
- [Phase 05-q-a-submission-validation]: CompletenessChecklist phaseNote field and isPhase2 render branch removed entirely — no remaining usages after Phase 2 placeholder removal
- [Phase 05-q-a-submission-validation]: localStorage.applicant_org_id populated via useEffect in WorkspacePage — org is pre-seeded, user may never visit OrgProfilePage creation path
- [Phase 05-q-a-submission-validation]: budget/attachments/certifications sections excluded from SECTION_FIELDS seeding — dedicated UIs (BudgetBuilder/AttachmentManager) and POST /certify handle those sections
- [Phase 05-q-a-submission-validation]: useIsAuthorizedRep accepts orgId as prop (not localStorage) — React Query reactive, no stale-closure on first render
- [Phase 05-q-a-submission-validation]: certify() UPDATE application_sections section_type=certifications after INSERT (PRD-INTAKE-050 — certifications section now flips to complete)
- [Phase 05-q-a-submission-validation]: attachments section auto-marked complete when 0 requirements — idempotent WHERE status=not_started; overall_completion_pct recomputed after mutation
- [Phase 05-q-a-submission-validation]: GET /my-questions uses authenticate only (no requireRole); submitter_user_id from JWT req.user.user_id (T-05-06-01 IDOR mitigation)
- [Phase 05-q-a-submission-validation]: listAll() error propagates HTTP status+code; QAManagementPage distinguishes 401/403 from generic failures
- [Phase 05-q-a-submission-validation]: titleQuery uses public /api/v1/opportunities/:id endpoint with UUID fallback (T-05-06-03 accepted risk)
- [Phase 05-q-a-submission-validation]: Sidebar label changed from 'Q&A Inbox' to 'Q&A Management'; destination unchanged per prior decision
- [Phase 05-q-a-submission-validation]: Q&A card links use usa-card__footer placement in OpportunitiesIndex; Opportunity Builder subtitle uses muted uppercase p tag above h1
- [Phase 05-q-a-submission-validation]: UAT opportunities moved from 'UAT Federal Agency'/'UAT Grant Program' to 'General Grant Programs' under admin@example.gov's org — OpportunitiesIndex /programs is org-scoped so UAT opps must live in admin's org to appear
- [Phase 05-q-a-submission-validation]: Multi-program Promise.all fetch replaces useFirstProgramId in OpportunitiesIndex — fetches all programs then parallel-fetches opportunities per program, flattened to one list
- [Phase 05-q-a-submission-validation]: Pure prop-threading of workspace.is_locked as isLocked prop — no new context/state; WorkspacePage passes it to WorkspaceSectionPanel which threads to SectionFormPanel, BudgetBuilder, AttachmentManager
- [Phase 05-q-a-submission-validation]: handleFieldBlur returns early when isLocked to suppress save/validate mutations in locked state — UI-layer enforcement for PRD-INTAKE-054
- [Phase 05-q-a-submission-validation]: OrgRole[] mock shape must be array (not object) — useIsAuthorizedRep calls roles.find() which throws TypeError on non-array mock
- [Phase 05-q-a-submission-validation]: Test 6 hard (non-advisory) assertion: UAT Community Health Innovation Grant must appear in grantor opportunities list — absence fails test outright
- [Phase 06-intake-queue-screening-analytics]: Disposition history is append-only: each POST creates a new intake_dispositions row, entry status updated via pointer (disposition_id), no modification of existing rows (T-06-06 repudiation mitigation)
- [Phase 06-intake-queue-screening-analytics]: grantorOrgId server-derived via grantor_roles JOIN (not grantor_memberships — actual table name in migration 001), consistent with T-02-01 IDOR pattern
- [Phase 06-intake-queue-screening-analytics]: Array.isArray shape guard in NotificationsPage handles both raw array and { notifications: [] } API response shapes
- [Phase 06-intake-queue-screening-analytics]: Single Playwright route handler dispatches on method+URL for notifications tests to handle GET list and PUT mark-read in one handler

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-08-02T17:54:04.245Z
Stopped at: Completed 06-02-PLAN.md
Resume file: None
