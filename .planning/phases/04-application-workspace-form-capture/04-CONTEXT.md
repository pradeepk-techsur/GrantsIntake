# Phase 4: Application Workspace & Form Capture - Context

**Gathered:** 2026-07-26
**Status:** Ready for planning

<domain>
## Phase Boundary

The collaborative, section-based application drafting environment where applicants build and manage their grant application. Scope includes: workspace creation and uniqueness enforcement, structured sections with completion tracking, section ownership and team tasks, private internal comments (grantee-only), a live readiness dashboard, draft privacy enforcement, configurable form field capture (all types), structured budget builder with validation, attachment management with version history, and a submission package preview. Submission itself is Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Workspace Navigation Model
- Claude's Discretion — no user preference expressed; planner should follow USWDS and PRD guidance
- Recommended: left sidebar section list (matching the ApplicantLayout.tsx sidebar pattern already established) showing each section name + completion status badge (not-started / in-progress / complete / error)
- Section switching does NOT navigate to a new URL for each section — single workspace page with section-panel swap to avoid full page reloads during drafting
- All 9 sections defined in TechArch spec must be present: org_profile, eligibility, narrative, budget, workplan, performance_measures, attachments, certifications, review_submit
- Section visibility is controlled by server-side `is_visible` flag (driven by Phase 2 conditional section config)

### Validation Timing & Feedback
- Claude's Discretion on exact implementation, but the spec is clear: continuous validation during drafting (TechArch WebSocket pattern)
- Field-level validation fires on blur (not every keystroke) — reduces noise
- Section-level validation updates after each field save — WebSocket pushes updated section status to all workspace clients
- Blocking errors surface in the readiness dashboard and as USWDS Error alerts inline — NOT blocking the form from saving
- Only final submission is blocked by outstanding blocking errors (Phase 5 concern, but validation engine starts here)

### Budget Builder Layout
- Claude's Discretion — follow TechArch budget schema exactly
- Single budget period at MVP (budget_periods_count defaults to 1) — multi-period is a Phase 5+ concern
- Line items organized by category (personnel, fringe, travel, equipment, supplies, contractual, indirect, other_direct, match_cash, match_in_kind)
- Each line item: description, quantity, unit_cost, total_cost (auto-calculated); personnel lines also capture name, FTE, annual_salary, fringe_rate
- Budget totals auto-calculated and displayed: total federal request, total match, total indirect, total project cost
- Validation: total federal request must not exceed opportunity funding_amount_max; match amount validated against opportunity match_requirement when configured

### Readiness Dashboard Placement
- Claude's Discretion — planner should use a sensible USWDS pattern
- Recommended: Sticky right-side panel (desktop) that shows overall completion %, blocking error count with section links, missing attachment count, and authorized rep assignment status
- On mobile: collapsed by default, expandable
- Updates in real-time via WebSocket when team members make changes
- The readiness dashboard data comes from GET /workspaces/:id/readiness (TechArch-defined endpoint)

### Draft Privacy Enforcement
- All workspace content remains in grantee_private visibility zone until submission
- API enforces at middleware layer: grantor roles receive 403 on any workspace endpoint while status = grantee_private
- No UI surfacing of draft data to grantor — this is backend-enforced, not just frontend-hidden

### Form Field Types (MVP scope)
- All field types from TechArch must be supported: text, textarea, number, currency, date, picklist, multi_select, checkbox, file_upload, calculated, repeating_table
- Character/page limit enforcement: validation_config.max_length / max_chars / max_words per field definition
- Conditional field visibility driven by section_condition_configs (configured in Phase 2, evaluated in Phase 4)
- file_upload fields use the same base64 JSON pattern established in Phase 3 (multer not in package.json)

### Attachment Management
- Applicants can upload new files OR select from their org-level document library (Phase 3's org_attachments)
- Each workspace attachment stores version history: new upload for same document type creates new version, prior versions accessible
- File size and format restrictions enforced per attachment_requirements configuration (Phase 2)
- Unfulfilled required attachments surface as blocking errors in readiness dashboard

### Submission Package Preview
- Preview is generated on demand (not auto-generated) — applicant explicitly requests it
- Preview labeled "DRAFT PREVIEW — NOT SUBMITTED" prominently
- Preview shows: all section content, budget summary, attachment list with names, eligibility responses
- Does NOT initiate submission — submission is Phase 5

### Claude's Discretion
- Exact section-panel animation/transition behavior
- Loading skeleton design for workspace content
- Exact spacing, typography, color palette (USWDS tokens apply)
- Repeating table UX for multi-row form entries
- Budget line item add/remove UX details
- Error boundary behavior within individual sections
- Preview format (HTML rendered in modal vs new tab)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Spec
- `project_specs/FRD-GrantsIntake.md` — Functional requirements for F29–F42 (workspace, sections, budget, attachments, preview); includes full API surface and validation rules
- `project_specs/TechArch-GrantsIntake.md` §4 — Exact DDL for application_workspaces, application_sections, form_field_definitions, field_responses, workspace_tasks, workspace_comments, budgets, budget_line_items, attachments; §5 API endpoints for workspaces, sections, budget, attachments
- `project_specs/UserStories-GrantsIntake.md` — US-6.1 through US-6.6 (workspace), US-7.x (forms/budget/attachments); acceptance criteria per story
- `.planning/REQUIREMENTS.md` — PRD-INTAKE-030 through PRD-INTAKE-043 (Phase 4 requirements)
- `.planning/ROADMAP.md` §Phase 4 — Success criteria and plan breakdown

### Prior Phase Integration Contracts
- `.planning/phases/03-organization-profile-eligibility-pre-screening/` — organizationService.getOrgIdForUser() pattern, ApplicantLayout, ApplicantSidebar, base64 JSON upload pattern, org_roles RBAC
- `src/db/migrations/008_conditional_and_intake_schema.sql` — section_condition_configs table (Phase 2; workspace sections reference these for conditional visibility)
- `src/db/migrations/009_addenda_schema.sql` — attachment_requirements table (Phase 2; workspace enforces these)
- `src/db/migrations/010_org_profile_schema.sql` — org_attachments table (Phase 3; workspace can pull from org document library)
- `src/db/migrations/011_eligibility_responses_schema.sql` — eligibility_responses (Phase 3; workspace reads these for eligibility section pre-fill)

### Design Standards
- USWDS design system (https://designsystem.digital.gov/) — all form inputs, alerts, step indicator, tables, cards must use USWDS component patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `client/src/layouts/ApplicantLayout.tsx` + `client/src/components/nav/ApplicantSidebar.tsx` — Workspace pages wire into this shell under `/applicant/*` routes
- `client/src/api/client.ts` — Axios instance with JWT auth interceptor; all new workspace API calls use this
- `client/src/api/organizationsApi.ts` + `client/src/api/prescreeningApi.ts` — Established pattern for new `workspaceApi.ts` module
- `client/src/hooks/useAuth.ts`, `useCurrentUser.ts` — Auth state hooks; workspace needs org role checking
- `client/src/pages/grantor/opportunities/CompletenessChecklist.tsx` — Sidebar completion checklist pattern; adapt for workspace readiness dashboard
- `client/src/pages/grantor/opportunities/GuidancePanel.tsx` — Collapsible guidance panel; could be reused inside form sections
- `client/src/store/authStore.ts` (Zustand) — Access token storage; workspace may need a `workspaceStore.ts` for local workspace session state

### Established Patterns
- **React Query** for all server state (GET queries + mutations); workspace polling or WebSocket for live readiness updates
- **Zustand** for local UI state (e.g., active section, unsaved field state)
- **USWDS CSS via Vite alias** — import `@uswds/uswds/css` not direct CSS path (Phase 1 decision)
- **Two-step IDOR guard**: EXISTS check (404) then org membership check (403) — all workspace endpoints must follow this
- **getOrgIdForUser() pattern**: org_id derived server-side from org_roles, never from request body (Phase 3 pattern)
- **Base64 JSON for file uploads** — `{ file_name, mime_type, file_size_bytes, content_base64 }` — multer not in package.json
- **audit_events** table uses `entity_type` / `entity_id` column names (not resource_type/resource_id)
- **Migration slots**: 001–011 occupied; next available = **012**

### Integration Points
- `client/src/App.tsx` — New routes needed: `/applicant/workspaces/:workspaceId` (main workspace page), `/applicant/workspaces/:workspaceId/preview` (submission preview)
- `client/src/components/nav/ApplicantSidebar.tsx` — Add "My Applications" link pointing to workspace list
- `src/server.ts` or route registration — New `workspaces.ts` router mounts at `/api/v1/workspaces`

</code_context>

<specifics>
## Specific Ideas

No specific requirements expressed by user — open to standard approaches following USWDS and TechArch spec.

**Design system note:** User mentioned interest in changing from USWDS to another design system. This is a cross-cutting project-level change affecting all 6 phases and all already-completed code. It is deferred — see Deferred Ideas below.

</specifics>

<deferred>
## Deferred Ideas

- **Design system migration (USWDS → other)**: User expressed interest in replacing USWDS with a different design system. This is a project-wide architectural change affecting Phases 1–6 and all existing code. Requires its own initiative, not in scope for any single phase. Should be evaluated as a separate project decision before any phase planning proceeds for that migration.

</deferred>

---

*Phase: 04-application-workspace-form-capture*
*Context gathered: 2026-07-26*
