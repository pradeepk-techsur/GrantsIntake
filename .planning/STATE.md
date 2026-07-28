---
pivota_spec_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: completed
stopped_at: Completed 04-07-PLAN.md
last_updated: "2026-07-28T03:12:26.028Z"
last_activity: "2026-07-28 — Plan 04-09 complete: AttachmentManager USWDS cosmetic gap (UAT Test 9) closed"
progress:
  total_phases: 7
  completed_phases: 3
  total_plans: 27
  completed_plans: 26
  percent: 93
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-24)

**Core value:** Grantors receive better applications and applicants submit with less burden — by replacing fragmented, document-heavy intake with a structured, guided, data-driven workflow that enforces completeness, preserves auditability, and accelerates handoff from submission to review.
**Current focus:** Phase 1 — Platform Foundation & Opportunity Setup (COMPLETE)

## Current Position

Phase: 4 of 6 (Application Workspace & Form Capture) — gap closure plans in progress
Plan: 9 of 9 in current phase — Plan 04-09 complete
Status: Plan 04-09 Complete — AttachmentManager four USWDS conformance fixes (usa-button-group, clip file input, borderless table, secondary delete btn)
Last activity: 2026-07-28 — Plan 04-09 complete: AttachmentManager USWDS cosmetic gap (UAT Test 9) closed

Progress: [█████████░] 93%

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
- [Phase 01-platform-foundation-opportunity-setup]: USWDS CSS imported via vite alias — Vite 8 rolldown exports map does not expose CSS under browser/import conditions
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

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-07-28T03:12:26.027Z
Stopped at: Completed 04-07-PLAN.md
Resume file: None
