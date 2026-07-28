# Roadmap: GrantsIntake

## Overview

GrantsIntake delivers the complete "front door" of the grants lifecycle — from a grantor publishing a structured opportunity through an applicant submitting a validated, certified application and a program administrator screening and routing it for review. The roadmap follows the natural dependency chain of the platform: platform foundation and auth first, then grantor-side opportunity configuration, then applicant-side profile and eligibility, then the application workspace and form capture, then submission and intake screening, and finally analytics and reporting that spans both sides.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Platform Foundation & Opportunity Setup** - Auth, RBAC, grantor portal shell, and Stage 1 opportunity creation tools
- [ ] **Phase 2: Eligibility & Intake Rules Configuration** - Stage 2 eligibility rule builder and Stage 3 opportunity publication and discovery
- [ ] **Phase 3: Organization Profile & Eligibility Pre-Screening** - Stages 4–5: reusable applicant org profile, credentials, roles, and eligibility pre-screen workflow
- [ ] **Phase 4: Application Workspace & Form Capture** - Stages 6–7: workspace creation, structured sections, forms, budget, and attachments
- [ ] **Phase 5: Q&A, Submission & Validation** - Stages 8–9: Q&A/addenda, continuous validation, authorized submission, and immutable snapshot
- [ ] **Phase 6: Intake Queue, Screening & Analytics** - Stages 10–11: intake queue routing, administrative screening, dispositions, and reporting

## Phase Details

### Phase 1: Platform Foundation & Opportunity Setup
**Status**: passed
**Goal**: Grantors can authenticate, access a role-appropriate portal, and create well-structured, validated funding opportunities from templates
**Depends on**: Nothing (first phase)
**Requirements**: US-1.0, PRD-INTAKE-001, PRD-INTAKE-002, PRD-INTAKE-003, PRD-INTAKE-005, PRD-INTAKE-006, PRD-INTAKE-007
**Success Criteria** (what must be TRUE):
  1. A grantor user can log in and see a role-appropriate dashboard with navigation limited to their permitted actions (RBAC enforced, WCAG 2.1 AA compliant)
  2. A grantor can create a new funding opportunity from a template library (federal NOFO, state grant, philanthropic RFP, pass-through subaward) and fill in all required structured metadata fields
  3. A grantor can configure intake windows, pre-application deadlines, LOI deadlines, and rolling review periods on an opportunity
  4. The system blocks publication of an opportunity with missing required metadata and shows a clear remediation checklist
  5. Every published opportunity modification creates a new immutable version snapshot with a modification reason and audit trail
**Plans:** 6 plans

Plans:
- [ ] 01-01-PLAN.md — Project scaffold, docker-compose (PostgreSQL 16 + Redis 7), auth schema (users, grantor_organizations, grantor_roles, audit_events), Auth Service with JWT (15min/7day), RBAC middleware (authenticate, requireRole), GRANTOR_LOGIN audit event
- [ ] 01-02-PLAN.md — Opportunity schema (programs, opportunity_templates), 5 system templates seeded, Programs + Templates APIs, Grantor portal React shell with USWDS navigation, role-restricted sidebar, role-appropriate dashboard, WCAG 2.1 AA, Playwright e2e
- [ ] 01-03-PLAN.md — Opportunities + guidance_prompts schema (full DDL), Opportunity Service (create/update with audit events), Opportunity Builder UI (template picker, all F1 metadata fields, collapsible guidance panels, readability indicator)
- [ ] 01-04-PLAN.md — opportunity_versions schema (immutable), DeadlineService (F4 validation), CompletenessService (F5 publication blockers), VersioningService (F6 snapshots + delta), Deadline form + CompletenessChecklist + VersionHistory React UI
- [ ] 01-05-PLAN.md — Gap closure: seed default program in programs table (unblocks Create Opportunity modal), upgrade no-programs warning alert with accessible heading and actionable guidance
- [ ] 01-06-PLAN.md — Gap closure: make funding_amount_max optional in createOpportunitySchema, remove funding_amount_max: 0 from TemplateLibrary payload, surface create errors via USWDS alert (fixes silent "Create Opportunity" failure — unblocks UAT Tests 3–7)

### Phase 2: Eligibility & Intake Rules Configuration
**Status**: passed
**Completed**: 2026-07-25
**Goal**: Grantors can define enforceable eligibility rules, configure pre-screening questionnaires, set attachment requirements and administrative screening criteria, and publish opportunities to an applicant-facing portal with search and discovery
**Depends on**: Phase 1
**Requirements**: PRD-INTAKE-008, PRD-INTAKE-009, PRD-INTAKE-010, PRD-INTAKE-011, PRD-INTAKE-012, PRD-INTAKE-013, PRD-INTAKE-014, PRD-INTAKE-015, PRD-INTAKE-017, PRD-INTAKE-018
**Success Criteria** (what must be TRUE):
  1. A grantor can define eligibility rules (by applicant type, geography, entity status, UEI/SAM, match requirements, and program-specific criteria) and designate each as a hard blocker or advisory indicator
  2. A grantor can build a pre-screening questionnaire with conditional question logic that maps responses to eligibility rule outcomes
  3. A grantor can configure conditional forms/sections, required attachment types by applicant type and stage, and administrative screening criteria
  4. An applicant (unauthenticated) can browse published opportunities with search and filters (funder, program area, geography, eligibility type, funding amount, deadline, keyword) and view public opportunity detail pages
  5. Applicants with in-progress applications see opportunity changes, addenda, Q&A updates, and deadline changes displayed on the opportunity page
**Plans:** 5 plans

Plans:
- [ ] 02-01-PLAN.md — eligibility_rules + prescreening_questionnaires/questions/options migrations; EligibilityService + PrescreeningService; REST API (eligibility-rules, prescreening); EligibilityRuleBuilder + PrescreeningBuilder UI tabs wired into OpportunityBuilder; USWDS Error/Warning alert styling for hard blockers vs advisory; integration + Playwright tests
- [ ] 02-02-PLAN.md — section_condition_configs + attachment_requirements + screening_criteria migration; SectionConditionService + AttachmentRequirementService + ScreeningCriteriaService; REST APIs; ConditionalSectionConfig + AttachmentRequirementsConfig + ScreeningCriteriaConfig UI tabs; auto-criteria lock; integration + Playwright tests
- [ ] 02-03-PLAN.md — addenda migration + GIN full-text index; PublicationService (public_slug, OPPORTUNITY_PUBLISHED audit) + AddendaService (immutable) + SearchService (GIN keyword + facets); public GET /opportunities search + detail + workspace-status; POST /addenda (grantor); OpportunityListPage + OpportunityDetailPage + AddendaTimeline; "Find Opportunities" nav link; integration + Playwright tests
- [ ] 02-04-PLAN.md — Gap closure: implement opportunity listing in OpportunitiesIndex (fetches /programs/:id/opportunities, renders linked cards); fix publish route to delegate to publicationService.publish() so public_slug is generated correctly
- [ ] 02-05-PLAN.md — Gap closure: add UUID format guard to public opportunity detail route so slug-based URLs (e.g., /opportunities/my-grant-abc123) resolve correctly instead of returning 500 INTERNAL_ERROR

### Phase 3: Organization Profile & Eligibility Pre-Screening
**Status**: passed
**Goal**: Applicants can create a reusable organization profile with credentials and team roles, and run an eligibility pre-screen to get a clear, explained determination before investing effort in an application
**Depends on**: Phase 2
**Requirements**: PRD-INTAKE-019, PRD-INTAKE-020, PRD-INTAKE-021, PRD-INTAKE-022, PRD-INTAKE-023, PRD-INTAKE-024, PRD-INTAKE-025, PRD-INTAKE-026, PRD-INTAKE-027, PRD-INTAKE-029
**Success Criteria** (what must be TRUE):
  1. An applicant organization can create a reusable profile capturing legal name, entity type, UEI, SAM status, tax status, contacts, authorized representatives, banking readiness, and standard documents — and this profile pre-populates future application forms
  2. The system warns applicants when credentials or registrations are expired or within the configurable warning window (default 60 days) in both the org profile and workspace checklist
  3. An org admin can assign team members to roles (org admin, proposal lead, contributor, finance contributor, authorized representative) with role-based access enforced at section and submission levels
  4. An applicant completing an eligibility pre-screen sees one of four distinct USWDS-styled result states (Eligible, Likely Eligible, Needs Attention, Ineligible) with a plain-language explanation of which responses caused any blocker or warning
  5. All eligibility pre-screen responses are stored in the intake record and visible to intake administrators during administrative screening
**Plans:** 5 plans

Plans:
- [ ] 03-01-PLAN.md — Migration 010 (organizations, org_contacts, org_roles, org_attachments); organizationService (CRUD, getOrgIdForUser, verifyOrgMember/Admin, getCredentialStatus, listDocuments, uploadDocument, listDocumentVersions); 11 REST endpoints (org CRUD, credential-status, roles, documents); integration tests (PRD-INTAKE-019, F18; PRD-INTAKE-020, F19; PRD-INTAKE-021, F20; PRD-INTAKE-022, F21)
- [ ] 03-02-PLAN.md — ApplicantLayout shell (USWDS header + sidebar auth guard); ApplicantSidebar (My Profile, Find Opportunities, My Applications); organizationsApi client; OrgProfilePage (create/edit form, completeness %, credential warning banners); OrgRolesPage (team assign/revoke); OrgDocumentsPage (standard library upload + expiration badges); /applicant/* routes in App.tsx; Playwright e2e tests (PRD-INTAKE-019, F18; PRD-INTAKE-021, F20; PRD-INTAKE-022, F21; PRD-INTAKE-023, F22; PRD-INTAKE-024, F23)
- [ ] 03-03-PLAN.md — Migration 011 (eligibility_responses, uq_elig_response); prescreeningEvaluationService (evaluateResponses → EligibilityResult, 409 ALREADY_SUBMITTED, response storage); POST /prescreening/submit + GET /workspaces/:id/eligibility-responses routes; PrescreenPage (conditional question logic); PrescreenResultPage (four USWDS alert states, all blockers shown, advisory section); Check Eligibility link in OpportunityDetailPage; integration + Playwright tests (PRD-INTAKE-025, F24; PRD-INTAKE-026, F25; PRD-INTAKE-027, F26; PRD-INTAKE-029, F28)
- [ ] 03-04-PLAN.md — Gap closure: add UUID regex guard to OrgRolesPage.handleAssignSubmit — clear inline error before API call when user enters non-UUID value (e.g. email address); fixes UAT Test 4 422 error (PRD-INTAKE-022)
- [ ] 03-05-PLAN.md — Gap closure: add GET /prescreening/my-result endpoint + prescreeningApi.getMyResult(); update PrescreenResultPage to fetch stored result on mount when location.state is null; fix PrescreenPage 409 handler to navigate to result page instead of dead-end error; fixes UAT Test 9 (PRD-INTAKE-026, PRD-INTAKE-027)

### Phase 4: Application Workspace & Form Capture
**Status**: passed
**Completed**: 2026-07-27
**Goal**: Applicants have a collaborative, structured workspace for building their application — with configurable forms, a structured budget builder, attachment management, and a readiness dashboard — all kept grantee-private until submission
**Depends on**: Phase 3
**Requirements**: PRD-INTAKE-030, PRD-INTAKE-031, PRD-INTAKE-032, PRD-INTAKE-033, PRD-INTAKE-035, PRD-INTAKE-036, PRD-INTAKE-037, PRD-INTAKE-038, PRD-INTAKE-039, PRD-INTAKE-040, PRD-INTAKE-041, PRD-INTAKE-042, PRD-INTAKE-043
**Success Criteria** (what must be TRUE):
  1. The system creates exactly one application workspace per applicant organization per opportunity, with structured sections (org profile, eligibility, narrative, budget, workplan, performance measures, attachments, certifications, review/submit) and section-level completion tracking
  2. A proposal lead can assign section ownership, set internal due dates, create tasks, and leave private internal comments that are never visible to the grantor
  3. A readiness dashboard shows overall completion percentage, all blocking errors with links, missing required attachments, and authorized submitter role readiness — updated in real time
  4. Applicants can enter structured form data (text, number, currency, date, picklist, file upload, calculated fields, repeating tables) with character/page limits enforced and a structured budget with category-level validation against funding ceilings and match requirements
  5. Applicants can manage attachments with version history and generate a submission package preview showing exactly what the grantor will receive — without initiating submission
**Plans:** 9 plans

Plans:
- [x] 04-01-PLAN.md — Migration 012 (application_workspaces, application_sections, workspace_tasks, workspace_comments); WorkspaceService (createWorkspace with 9-section auto-create, uniqueness enforcement, IDOR guards); workspacesRouter (all workspace, section, task, comment endpoints; grantor 403 on comments at router layer); WorkspaceListPage + WorkspacePage (left-sidebar section nav, section-panel swap, no URL change); App.tsx + ApplicantSidebar wiring; integration + Playwright tests (PRD-INTAKE-030 F29, PRD-INTAKE-031 F30, PRD-INTAKE-032 F31, PRD-INTAKE-033 F32)
- [x] 04-02-PLAN.md — blockGrantorOnWorkspace middleware (applied router-level to ALL /workspaces/* routes; grantor 403 WORKSPACE_GRANTEE_PRIVATE); readinessService.computeReadiness (overall_completion_pct, authorized_rep_assigned, blocking_errors, warnings, attachment_status); GET /workspaces/:id/readiness; ReadinessDashboard React component (sticky right panel, 30s polling via React Query); WorkspacePage updated to 3-column layout; integration + Playwright tests (PRD-INTAKE-035 F34, PRD-INTAKE-036 F35)
- [x] 04-03-PLAN.md — Migration 013 part 1 (form_field_definitions, field_responses); formFieldService (getFieldsForSection, saveFieldResponse ON CONFLICT upsert, validateSection → updates section.validation_errors); GET/PUT /fields/:fieldId + POST /validate routes; FormFieldRenderer (all 11 types: text, textarea, number, currency, date, picklist, multi_select, checkbox, file_upload via FileReader base64, calculated, repeating_table); SectionFormPanel (onBlur save + 500ms debounced validate); WorkspaceSectionPanel integration; integration + Playwright tests (PRD-INTAKE-037 F36, PRD-INTAKE-038 F37)
- [x] 04-04-PLAN.md — Migration 013 part 2 / 014 (budgets UNIQUE workspace_id, budget_line_items 3 CHK constraints, attachments version history); budgetService (addLineItem, recalculateTotals: federal vs match split, validateBudget: ceiling + match check → updates budget section validation_errors); attachmentService (uploadAttachment base64, linkLibraryDoc, listVersions, deactivate); previewService (excludes workspace_comments at query layer, label: 'DRAFT PREVIEW — NOT SUBMITTED'); all budget + attachment + preview routes; BudgetBuilder (10 categories, auto-totals); AttachmentManager (upload + library link + version history); WorkspacePreviewPage at /applicant/workspaces/:id/preview; integration + Playwright tests (PRD-INTAKE-039 F38, PRD-INTAKE-040 F39, PRD-INTAKE-041 F40, PRD-INTAKE-042 F41, PRD-INTAKE-043 F42)
- [x] 04-05-PLAN.md — Gap closure: Migration 014 adds match_required/match_percentage to opportunities; budgetService.validateBudget enforces MATCH_REQUIREMENT_NOT_MET when cost-share insufficient; integration tests (PRD-INTAKE-040 F39 full compliance)
- [x] 04-06-PLAN.md — Gap closure: Fix Playwright credentials (applicant@example.com), seed UAT scenario idempotently (grantor org + program + published opportunity + applicant org + org_role + workspace + 9 sections), add serverHeaders integration tests (helmet CORP/COOP/COEP regression)
- [ ] 04-07-PLAN.md — Gap closure (UAT Tests 2+10): Fix Start Application CTA (POST /workspaces mutation + navigate to /applicant/workspaces/:id), fix Continue Application href (/applicant prefix), add Preview Application link to WorkspacePage header and ReadinessDashboard footer
- [ ] 04-08-PLAN.md — Gap closure (UAT Tests 5+7+6): Fix WorkspacePage 3-column grid (2+5+2=9 inside desktop:grid-col-9), move BudgetBuilder Add Line Item button outside accordion, seed form_field_definitions for UAT narrative section
- [ ] 04-09-PLAN.md — Gap closure (UAT Test 9 cosmetic): AttachmentManager USWDS fixes — usa-button-group, clip-positioned file input, usa-table--borderless, usa-button--secondary delete button

### Phase 5: Q&A, Submission & Validation
**Goal**: Grantors can manage public Q&A and addenda with an auditable history; applicants experience continuous validation during drafting and can submit a fully certified, immutable application that is locked post-submission
**Depends on**: Phase 4
**Requirements**: PRD-INTAKE-044, PRD-INTAKE-045, PRD-INTAKE-047, PRD-INTAKE-048, PRD-INTAKE-049, PRD-INTAKE-050, PRD-INTAKE-051, PRD-INTAKE-052, PRD-INTAKE-053, PRD-INTAKE-054, PRD-INTAKE-055
**Success Criteria** (what must be TRUE):
  1. A grantor can enable applicant question submission, draft and publish public Q&A responses visible to all applicants, and all questions, responses, addenda, and date changes are preserved in an immutable auditable history
  2. Applicants with saved applications automatically receive in-app and email notifications within 15 minutes of addenda, deadline changes, or Q&A updates
  3. Validation errors are classified as informational, warning, or blocking with distinct USWDS visual treatments; blocking errors are surfaced continuously during drafting (not only at final submission) and the submit button remains disabled until all blocking items are cleared
  4. An authorized representative can certify the application (with legal certification text), and only authorized representative role users can initiate final submission
  5. Upon successful submission the system generates an immutable snapshot with a unique confirmation number (GI-{YEAR}-{8-digit-seq}), a UTC-timestamped receipt, and both a human-readable and machine-readable (JSON) submission package; the application is locked and no edits are permitted without a formal withdrawal or return-for-correction workflow
**Plans**: TBD

Plans:
- [ ] 05-01: Grantor Q&A configuration (F43), public Q&A response publishing (F44), auditable Q&A and addenda history (F46), applicant notifications for addenda and changes (F47)
- [ ] 05-02: Continuous validation engine (F48), validation message classification (F49), submission blocking (F50), authorized representative certification (F51)
- [ ] 05-03: Immutable submission snapshot and receipt (F52), human-readable and machine-readable submission package (F53), post-submission edit prevention (F54)

### Phase 6: Intake Queue, Screening & Analytics
**Goal**: Grantor intake administrators have a structured queue for receiving, triaging, and routing applications; both grantors and applicants have dashboards and export capabilities to monitor intake status and generate audit-ready reports
**Depends on**: Phase 5
**Requirements**: PRD-INTAKE-056, PRD-INTAKE-057, PRD-INTAKE-058, PRD-INTAKE-059, PRD-INTAKE-060, PRD-INTAKE-061, PRD-INTAKE-062, PRD-INTAKE-063, PRD-INTAKE-064
**Success Criteria** (what must be TRUE):
  1. Submitted applications are automatically routed into the intake queue by configurable rules (opportunity, applicant type, region, funding track) and the queue displays submission status, timestamp, applicant profile summary, eligibility results, validation summary, attachments, and requested amount
  2. An intake administrator can apply a formal screening disposition (accepted, returned for correction, withdrawn, ineligible, duplicate, late, administratively rejected) with the action logged, applicant notified, and original submission snapshot preserved on correction requests
  3. When a correction window expires without resubmission, the system automatically applies an administratively rejected disposition and notifies both the applicant team and intake administrator; the administrator can override with a required reason
  4. Accepted applications are automatically routed to the review, scoring, or risk assessment workflow with a logged handoff event
  5. Grantors can view dashboards (opportunity views, application counts, validation error summaries, disposition summaries) and applicants can view their own dashboard (saved opportunities, application progress, deadlines, missing items, submission history); both sides can export intake data in CSV/Excel/JSON for audit and reporting purposes
**Plans**: TBD

Plans:
- [ ] 06-01: Intake queue routing (F55), intake queue display (F56), administrative screening dispositions (F57)
- [ ] 06-02: Correction and clarification requests (F58), original submission snapshot preservation on correction (F59), accepted application routing to review (F60)
- [ ] 06-03: Grantor intake dashboards (F61), applicant dashboards (F62), intake data export (F63)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Platform Foundation & Opportunity Setup | 0/4 | Not started | - |
| 2. Eligibility & Intake Rules Configuration | 0/3 | Not started | - |
| 3. Organization Profile & Eligibility Pre-Screening | 0/3 | Not started | - |
| 4. Application Workspace & Form Capture | 0/4 | Not started | - |
| 5. Q&A, Submission & Validation | 0/3 | Not started | - |
| 6. Intake Queue, Screening & Analytics | 0/3 | Not started | - |

---
*Roadmap created: 2026-07-24*
*Granularity: standard (6 phases, 20 plans)*
*Coverage: 61/61 v1 requirements mapped*