# Technical Architecture Document: GrantsIntake

**Product:** GrantsIntake — Dual-Sided Grants Lifecycle Management Platform  
**Module:** Grants Intake  
**Document Type:** Technical Architecture Document (TechArch)  
**Version:** 1.1  
**Date:** August 3, 2026  
**Design Standard:** GrantFlow Design System v1.0 (USWDS accessibility foundations + Carbon-inspired operational patterns)  
**Regulatory Alignment:** 2 CFR 200.204, 2 CFR 200.205, 2 CFR 200.206

---

## 1. Architectural Overview

### Architecture Pattern

GrantsIntake uses a **layered monolith with service boundaries** architecture. The system is organized as a single deployable backend service with clearly separated internal service boundaries (Opportunity, Organization, Application, Submission, Analytics), a shared data layer with row-level visibility enforcement, and a dedicated frontend application. This pattern is chosen for MVP because:

- The data model has deep relational joins across domains (opportunity → workspace → snapshot → disposition)
- Strict three-zone data visibility is easier to audit and test in a single service than across microservices
- A monolith-first approach with clean internal boundaries enables a microservices extraction path in Phase 2/3 without rewriting the domain model

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                    │
│  ┌───────────────────────┐   ┌──────────────────────────────┐    │
│  │  Grantor Portal       │   │  Applicant Portal            │    │
│  │  (React + GrantFlow)  │   │  (React + GrantFlow)         │    │
│  │  - Opportunity Builder│   │  - Opportunity Discovery     │    │
│  │  - Intake Queue       │   │  - Application Workspace     │    │
│  │  - Analytics Dashboard│   │  - Org Profile               │    │
│  └──────────┬────────────┘   └──────────────┬───────────────┘    │
└─────────────┼────────────────────────────────┼───────────────────┘
              │ HTTPS                          │ HTTPS
              ▼                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                    API GATEWAY / REVERSE PROXY                    │
│              (Nginx or AWS API Gateway)                           │
│  - TLS termination  - Rate limiting  - Auth header forwarding    │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    APPLICATION BACKEND                            │
│              (Node.js / Express or NestJS)                        │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐  │
│  │  Auth Service  │  │ Opportunity    │  │ Organization       │  │
│  │  - JWT issue   │  │ Service        │  │ Service            │  │
│  │  - RBAC enforce│  │ - Programs     │  │ - Org Profiles     │  │
│  │  - Session mgmt│  │ - Templates    │  │ - Roles            │  │
│  └────────────────┘  │ - Eligibility  │  │ - Attachments      │  │
│                      │ - Pub/versioning│  │ - Credential Mgmt  │  │
│                      └────────────────┘  └────────────────────┘  │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐  │
│  │ Application    │  │ Submission     │  │ Analytics &        │  │
│  │ Service        │  │ Service        │  │ Notification       │  │
│  │ - Workspaces   │  │ - Snapshots    │  │ Service            │  │
│  │ - Sections     │  │ - Intake Queue │  │ - Dashboards       │  │
│  │ - Budget       │  │ - Dispositions │  │ - Export Jobs      │  │
│  │ - Validation   │  │ - Q&A / Addenda│  │ - Notifications    │  │
│  │ - Prescreening │  │ - Review Handoff│ │                    │  │
│  └────────────────┘  └────────────────┘  └────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Visibility Enforcement Middleware                          │  │
│  │  Grantor-private | Grantee-private | Shared transaction     │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────┬─────────────────────┬──────────────────────────────┘
              │                     │
     ┌────────▼──────┐    ┌────────▼──────────┐
     │  PostgreSQL   │    │  Object Storage   │
     │  Primary DB   │    │  (S3-compatible)  │
     │  (RDS/Neon)   │    │  - Attachments    │
     │               │    │  - PDF snapshots  │
     │  Read Replica │    │  - Export files   │
     └───────────────┘    └───────────────────┘
              │
     ┌────────▼──────┐
     │  Redis Cache  │
     │  - Sessions   │
     │  - Validation │
     │    results    │
     └───────────────┘
```

### Data Visibility Zone Enforcement

The three visibility zones are enforced at the middleware and query layers:

```
GRANTOR-PRIVATE          GRANTEE-PRIVATE          SHARED TRANSACTION
─────────────────        ─────────────────        ──────────────────
Programs                 Draft workspaces          Published opportunities
Opportunity drafts       Application sections      Submitted snapshots
Eligibility rules        Budget (draft)            Q&A responses (published)
Screening criteria       Internal comments         Addenda
Internal opportunity     Org profile (live)        Intake dispositions
  review                 Eligibility responses     Receipts / confirmations
                           (pre-submit)            Audit events
```

**Enforcement mechanism:**
1. `WorkspaceVisibilityGuard` — blocks grantor API access to any workspace with `visibility = 'grantee_private'`
2. `DataZoneContext` middleware — injects the caller's zone context into all service calls
3. `OpportunityDraftGuard` — blocks applicant API access to opportunity records with `status IN ('draft', 'internal_review', 'approved')`
4. Internal comments endpoint — permanently restricted (`403`) for grantor roles at the router layer

### Deployment Topology

```
                    ┌─────────────────────────┐
                    │     CDN / CloudFront     │
                    │  (Static React assets)   │
                    └─────────────┬───────────┘
                                  │
                    ┌─────────────▼───────────┐
                    │   Load Balancer (ALB)   │
                    └──────┬──────────┬───────┘
                           │          │
              ┌────────────▼──┐  ┌────▼───────────┐
              │  API Server 1 │  │  API Server 2  │
              │  (Node.js)    │  │  (Node.js)     │
              └────────────┬──┘  └────┬───────────┘
                           │          │
              ┌────────────▼──────────▼───────────┐
              │         PostgreSQL Primary         │
              │         + Read Replica(s)          │
              └───────────────────────────────────┘
              ┌────────────────────────────────────┐
              │  Redis (ElastiCache)               │
              └────────────────────────────────────┘
              ┌────────────────────────────────────┐
              │  S3-Compatible Object Storage      │
              └────────────────────────────────────┘
              ┌────────────────────────────────────┐
              │  Background Job Worker             │
              │  (export generation, notifications,│
              │   PDF package generation)          │
              └────────────────────────────────────┘
```

**MVP Deployment Target:** AWS (ECS Fargate or EC2 + RDS PostgreSQL + S3 + ElastiCache Redis). A single-region, multi-AZ deployment. Blue/green deployments via ECS service updates.

---

## 2. Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Layered monolith over microservices | Deep relational joins, strict audit trail, simpler RBAC enforcement at MVP scale |
| PostgreSQL as primary database | JSONB support for snapshot/config fields; strong ACID guarantees for immutable audit records; native UUID generation |
| JSONB for snapshots and config | Submission snapshots are append-only point-in-time captures; JSONB allows versioned schema without DDL migrations |
| Object storage for files | S3-compatible storage decouples file bytes from relational records; supports large attachment files (up to 50MB) and PDF generation |
| Redis for sessions | Stateless JWT tokens with Redis session invalidation on logout; supports multi-server deployments |
| Background workers for heavy ops | PDF generation, export jobs, and notification delivery are queued to avoid blocking API responses |
| Three-zone visibility at middleware | Enforced at HTTP middleware layer before any business logic; prevents data leakage from service-level bugs |
| Immutable audit table (no UPDATE/DELETE) | `audit_events` and `submission_snapshots` have DB-level triggers that reject UPDATE/DELETE; application cannot bypass this |
| GrantFlow Design System v1.0 | All UI components use purpose-built `gf-*` CSS classes and CSS custom property tokens; Section 508 / WCAG 2.1 AA compliance via skip nav, aria labels, and focus management; replaces `@uswds/uswds` package entirely |
---

## 3. Component Architecture

### Backend Service Boundaries

#### Auth Service
**Responsibilities:**
- JWT token issuance and validation (access token: 15 min TTL; refresh token: 7 days TTL)
- Role-based access control (RBAC) enforcement at the request level
- Session invalidation on logout via Redis key deletion
- SSO integration hook (Phase 2; email/password at MVP)
- `GET /auth/me` returning user profile + org memberships + grantor memberships

**RBAC Role Matrix:**

| Role | Domain | Key Permissions |
|------|--------|-----------------|
| `grantor_admin` | Grantor org | Full opportunity/program CRUD, publish, user management |
| `program_officer` | Grantor org | Create/edit opportunities, configure eligibility, manage Q&A |
| `intake_administrator` | Grantor org | Intake queue access, apply dispositions, correction requests |
| `compliance_analyst` | Grantor org | Read-only access to submitted applications, audit events, exports |
| `reviewer` | Grantor org | Read submitted application after intake handoff only |
| `org_admin` | Applicant org | Org profile management, team role management |
| `proposal_lead` | Applicant org | Full workspace edit, section assignment, task management |
| `finance_contributor` | Applicant org | Budget section only |
| `external_contributor` | Applicant org | Assigned section(s) only |
| `authorized_representative` | Applicant org | Certify and submit application |

**Enforcement layers:**
1. Route-level middleware — checks role membership before controller execution
2. Service-level guards — secondary check within service methods for sensitive operations
3. Database-level RLS (Row-Level Security) for multi-tenant query isolation

---

#### Opportunity Service
**Responsibilities:**
- Program lifecycle management (create, update, archive)
- Opportunity Builder: template instantiation, metadata capture, deadline configuration
- Opportunity publication workflow: draft → internal review → approved → published
- Post-publication modification and versioning (immutable version snapshots)
- Eligibility rule definition and configuration (hard blockers vs. advisory)
- Pre-screening questionnaire builder (questions, options, rule mappings)
- Attachment requirement and screening criteria configuration
- Form field definition builder (section-level field templates)
- Conditional form section logic (section_conditions)
- Public opportunity listing and search (full-text + faceted filtering)
- Plain-language guidance prompt delivery
- Addenda creation and publication
- Q&A configuration

**Key processes:**
- Publication readiness check: validates all required fields, deadlines, eligibility rules before status transition to `published`
- Version snapshot: on every post-publication modification, captures full opportunity JSONB snapshot + change delta
- Search: uses PostgreSQL full-text search with `tsvector` columns on `title`, `executive_summary`, `eligibility_summary` + index-based faceting

---

#### Organization Service
**Responsibilities:**
- Applicant organization profile create/update (legal identity, UEI, SAM, tax status)
- Contact management (authorized representatives, financial contacts)
- Org team role assignment and invitation workflow
- Reusable standard attachment library management (upload, version, retrieve)
- Credential expiration tracking and warning generation
- Org profile completeness scoring (`profile_completeness_pct`)
- Grantor organization management and grantor role assignment

**Credential expiration logic:**
- Checks `org_attachments.expiration_date` and `organizations.sam_expiration_date`
- Returns status: `valid` | `expiring_soon` (within 60 days) | `expired`
- Warning surfaced in org profile view and in workspace readiness dashboard

---

#### Application Service
**Responsibilities:**
- Application workspace creation (one per org per opportunity; enforces uniqueness constraint)
- Workspace status lifecycle management
- Section management: visibility, ownership assignment, internal due dates
- Form field response capture and auto-save
- Section-level and workspace-level conditional logic evaluation
- Section validation: field-level validation rules from `form_field_definitions.validation_config`
- Workspace tasks and internal comments (grantee-private)
- Pre-screening workflow execution: submit responses, evaluate eligibility rules, return result
- Budget management: line item CRUD, auto-calculation of totals, budget validation
- Attachment management: upload, library reference, version replacement
- Submission readiness dashboard compilation
- Submission package preview generation (HTML/PDF preview, labeled "PREVIEW — NOT SUBMITTED")
- Continuous validation engine: triggered on field save; full validation triggered at submission attempt

**Continuous validation engine:**

```
Field Save
    │
    ▼
Field-level validation (type, format, required, length)
    │
    ▼
Section-level validation (completeness, cross-field rules)
    │
    ▼
Update section.validation_status + section.validation_errors (JSONB)
    │
    ▼
Readiness dashboard re-computed (aggregate across sections)
    │
    ▼
WebSocket event pushed to active workspace clients (real-time update)
```

**Validation message classification:**

| Level | Severity | Blocks Submission | GrantFlow Component |
|-------|----------|-------------------|---------------------|
| Informational | `info` | No | `gf-alert gf-alert--info` (teal left border) |
| Warning | `warning` | No | `gf-alert gf-alert--warning` (amber left border) |
| Blocking | `blocking` | Yes | `gf-alert gf-alert--error` (red left border) |

---

#### Submission Service
**Responsibilities:**
- Final pre-submission validation gate (all blocking errors must be cleared)
- Authorized representative certification capture (with SHA-256 hash of certification text)
- Submission snapshot generation: captures immutable JSONB snapshot of org profile, eligibility responses, all section field data, budget, attachment references
- Confirmation number assignment (`GI-{YEAR}-{8-digit-seq}`)
- Post-submission workspace lock (`is_locked = true`, `visibility = 'shared'`)
- Human-readable PDF generation (queued background job)
- Machine-readable JSON package generation (queued background job)
- Intake queue entry creation and routing
- Disposition management: apply disposition, trigger notification
- Correction request: unlock targeted sections, track correction window
- Snapshot preservation on correction: original snapshot preserved; corrected resubmission creates new snapshot with `supersedes_snapshot_id`
- Review handoff: create `review_handoffs` record, provision reviewer access
- Q&A item management (submission, answer publishing, audit history)
- Addendum publication

**Submission flow sequence:**

```
POST /workspaces/{id}/certify  ──► Record certification (certifications table)
                                       │
                                       ▼
POST /workspaces/{id}/submit   ──► Run final validation gate
                                       │ (any blocking error → 422 SUBMISSION_BLOCKED)
                                       ▼
                                  Generate confirmation number
                                       │
                                       ▼
                                  INSERT submission_snapshots (JSONB payload)
                                       │
                                       ▼
                                  Lock workspace (is_locked=true, visibility=shared)
                                       │
                                       ▼
                                  INSERT intake_queue_entry
                                       │
                                       ▼
                                  Queue: PDF generation + JSON package
                                       │
                                       ▼
                                  Emit NOTIFICATION: submission_received
                                       │
                                       ▼
                                  Return confirmation number + receipt URL
```

---

#### Analytics & Notification Service
**Responsibilities:**
- Grantor intake dashboard metrics aggregation
- Applicant dashboard (active applications, deadlines, submission history)
- Export job management (async CSV/JSON generation, S3 storage, download link)
- Notification delivery: in-app (database records) + email (via email provider)
- Deadline approaching notifications (scheduled job, runs daily)
- Audit event creation (all services call `audit_events.insert()`)

**Notification triggers:**

| Event | Recipient(s) | Channel |
|-------|-------------|---------|
| Opportunity published | Subscribers | Email + In-app |
| Addendum published | Applicants with workspace | Email + In-app |
| Deadline change | Applicants with workspace | Email + In-app |
| Q&A answer published | All applicants | In-app |
| Workspace created | Applicant team | In-app |
| Deadline approaching | Proposal Lead | Email + In-app |
| Blocking validation detected | Proposal Lead | In-app |
| Submission received | Applicant team + Grantor intake admin | Email + In-app |
| Returned for correction | Applicant team | Email + In-app |
| Accepted for review | Applicant team + Reviewers | Email + In-app |

---

### Frontend Architecture

The frontend is a **React SPA** served from CDN, structured as two portals sharing a component library:

```
frontend/
├── packages/
│   ├── grantflow-components/   # GrantFlow DS v1.0 component classes (gf-*)
│   │   ├── Alert/              # Blocking, warning, info, success alerts (gf-alert)
│   │   ├── Button/             # gf-btn variants: primary, outline, ghost, danger
│   │   ├── Form/               # gf-input, gf-select, gf-textarea, gf-label, gf-error-msg
│   │   ├── Table/              # gf-table with gf-table-wrap overflow container
│   │   └── Lifecycle/          # gf-lifecycle tracker (step dots + connectors)
│   └── shared-api-client/      # Generated TypeScript API client
├── apps/
│   ├── grantor-portal/         # Grantor-facing React app
│   │   ├── OpportunityBuilder/ # F0–F12 setup and configuration UI
│   │   ├── IntakeQueue/        # F55–F60 queue and screening UI
│   │   └── Analytics/          # F61, F63 dashboards and exports
│   └── applicant-portal/       # Applicant-facing React app
│       ├── OpportunitySearch/  # F13–F17 discovery and portal
│       ├── OrgProfile/         # F18–F23 profile management
│       ├── Workspace/          # F24–F54 application workspace
│       │   ├── PreScreen/      # F24–F26 eligibility pre-screen
│       │   ├── Sections/       # F29–F37 section editing
│       │   ├── Budget/         # F38–F39 budget builder
│       │   ├── Attachments/    # F40–F41 attachment management
│       │   ├── Readiness/      # F34, F48–F50 readiness dashboard
│       │   └── Submit/         # F51–F54 certification and submission
│       └── Dashboard/          # F62 applicant dashboard
```

**GrantFlow Design System v1.0 Integration:**
- Design tokens loaded globally via `client/src/grantflow.css` CSS custom properties (`--gf-*`)
- All form validation errors surface via `gf-error-msg` class and `gf-alert gf-alert--error` component
- Eligibility blockers use error alert (`gf-alert gf-alert--error`, red left border)
- Advisory indicators use warning alert (`gf-alert gf-alert--warning`, amber left border)
- Section 508 / WCAG 2.1 AA compliance enforced via skip nav (`gf-skipnav`), aria labels, role attributes, and focus management + accessibility linting in CI

**State management:**
- React Query for server state (API data fetching, caching, background refetch)
- Zustand for local UI state (workspace session, readiness dashboard state)
- WebSocket for real-time validation updates during workspace editing
---

## 4. Data Model

### Entity Relationship Overview

```
grantor_organizations ──< programs ──< opportunities >── opportunity_templates
                                              │
                    ┌─────────────────────────┼──────────────────────────┐
                    │                         │                          │
              eligibility_rules    prescreening_questionnaires    attachment_requirements
              section_conditions   prescreening_questions         screening_criteria
                                   prescreening_options           form_field_definitions
                                   guidance_prompts               opportunity_versions

organizations ──< org_roles (users)
             ──< org_contacts (users)
             ──< org_attachments

organizations + opportunities ──> application_workspaces
                                          │
                    ┌─────────────────────┼──────────────────────────┐
                    │                     │                           │
              application_sections   eligibility_responses        budgets
              field_responses        workspace_tasks                  │
              workspace_comments     attachments              budget_line_items
              section_conditions     certifications

application_workspaces ──> submission_snapshots ──> intake_queue_entries
                                                           │
                                          ┌────────────────┼──────────────┐
                                          │                │              │
                                   intake_dispositions  correction_requests  review_handoffs

opportunities ──< qa_items
             ──< addenda

audit_events (references all entities)
notification_records
export_jobs
```

---

### DDL: Core Schema (Programs, Opportunities, Eligibility)

Source: `FRD/Y0a-schema-core.md`

```sql
-- ─────────────────────────────────────────────────────────────────
-- CORE SCHEMA: Programs, Opportunities, Eligibility, Prescreening
-- All timestamps UTC. UUIDs as primary keys.
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE programs (
    program_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grantor_org_id      UUID NOT NULL REFERENCES grantor_organizations(org_id),
    program_name        VARCHAR(250) NOT NULL,
    program_area        VARCHAR(100),
    is_federal          BOOLEAN NOT NULL DEFAULT FALSE,
    program_description TEXT,
    created_by          UUID NOT NULL REFERENCES users(user_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived_at         TIMESTAMPTZ
);
CREATE INDEX idx_programs_grantor ON programs(grantor_org_id);

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE opportunity_templates (
    template_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name       VARCHAR(250) NOT NULL,
    template_type       VARCHAR(50) NOT NULL,
    -- federal_nofo, state_grant, philanthropic_rfp, corporate_grant, pass_through_subaward
    grant_market        VARCHAR(50),
    default_sections    JSONB,          -- array of section definitions
    default_metadata    JSONB,          -- default field values
    is_system_template  BOOLEAN NOT NULL DEFAULT TRUE,
    owner_org_id        UUID REFERENCES grantor_organizations(org_id),  -- null for system templates
    created_by          UUID REFERENCES users(user_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE opportunities (
    opportunity_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id                  UUID NOT NULL REFERENCES programs(program_id),
    template_id                 UUID REFERENCES opportunity_templates(template_id),

    -- Core Metadata (F1)
    title                       VARCHAR(250) NOT NULL,
    funding_source              VARCHAR(250) NOT NULL,
    announcement_type           VARCHAR(50) NOT NULL,
    -- initial, modification, continuation, supplemental, correction
    opportunity_number          VARCHAR(100) NOT NULL,
    assistance_listing_number   VARCHAR(10),       -- XX.XXX; required for federal
    funding_amount_min          NUMERIC(15,2),
    funding_amount_max          NUMERIC(15,2) NOT NULL,
    total_program_funding       NUMERIC(15,2),
    expected_awards_min         INTEGER,
    expected_awards_max         INTEGER,
    eligibility_summary         TEXT NOT NULL,
    executive_summary           TEXT NOT NULL,
    contact_name                VARCHAR(250) NOT NULL,
    contact_email               VARCHAR(320) NOT NULL,
    contact_phone               VARCHAR(30),
    contact_title               VARCHAR(250),
    program_area                VARCHAR(100) NOT NULL,
    geography                   JSONB,             -- array of geography strings
    application_url             VARCHAR(2048),

    -- Status and Publication (F5, F13)
    status                      VARCHAR(50) NOT NULL DEFAULT 'draft',
    -- draft, internal_review, approved, published, modified, closed, archived
    visibility                  VARCHAR(30) NOT NULL DEFAULT 'public',
    -- public, restricted_authenticated
    public_slug                 VARCHAR(300) UNIQUE,
    published_at                TIMESTAMPTZ,
    published_by                UUID REFERENCES users(user_id),

    -- Deadlines (F4)
    application_open_date       TIMESTAMPTZ,
    application_close_date      TIMESTAMPTZ,
    pre_application_deadline    TIMESTAMPTZ,
    loi_deadline                TIMESTAMPTZ,
    loi_required                BOOLEAN NOT NULL DEFAULT FALSE,
    rolling_review_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    rolling_review_cadence_days INTEGER,
    deadline_timezone           VARCHAR(64) NOT NULL DEFAULT 'America/New_York',

    -- Q&A Config (F43)
    qa_config                   JSONB,
    -- {qa_enabled, question_window_open, question_window_close, responder_user_ids}

    -- Review Routing Config (F60)
    review_routing_config       JSONB,
    -- {review_workflow_type, assigned_reviewer_ids}

    -- Admin Screening Config (F12)
    admin_screening_enabled     BOOLEAN NOT NULL DEFAULT TRUE,

    -- Attachment Config (F11)
    attachments_required        BOOLEAN NOT NULL DEFAULT FALSE,

    -- Duplicate Application Config (F29)
    duplicate_allowed           BOOLEAN NOT NULL DEFAULT FALSE,

    -- Audit
    created_by                  UUID NOT NULL REFERENCES users(user_id),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_opportunity_number_program UNIQUE (program_id, opportunity_number),
    CONSTRAINT chk_funding_range CHECK (
        funding_amount_min IS NULL OR funding_amount_min <= funding_amount_max
    ),
    CONSTRAINT chk_date_sequence CHECK (
        application_open_date IS NULL OR application_close_date IS NULL OR
        application_open_date < application_close_date
    )
);
CREATE INDEX idx_opportunities_program ON opportunities(program_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_close_date ON opportunities(application_close_date);
-- Full-text search index
CREATE INDEX idx_opportunities_fts ON opportunities
    USING GIN (to_tsvector('english', title || ' ' || executive_summary || ' ' || eligibility_summary));

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE opportunity_versions (
    version_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id          UUID NOT NULL REFERENCES opportunities(opportunity_id),
    version_number          INTEGER NOT NULL,
    snapshot                JSONB NOT NULL,    -- complete opportunity field snapshot
    delta                   JSONB,             -- field-level diff from previous version
    modification_reason     TEXT NOT NULL,
    created_by              UUID NOT NULL REFERENCES users(user_id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_opportunity_version UNIQUE (opportunity_id, version_number)
);
CREATE INDEX idx_opp_versions_opportunity ON opportunity_versions(opportunity_id);

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE eligibility_rules (
    rule_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id          UUID NOT NULL REFERENCES opportunities(opportunity_id),
    rule_type               VARCHAR(50) NOT NULL,
    -- applicant_type, geography, entity_status, uei_sam, nonprofit_status,
    -- tribal_status, state_local_status, prior_award_status, match_requirement, custom
    criterion_field         VARCHAR(100) NOT NULL,
    operator                VARCHAR(20) NOT NULL,
    -- equals, not_equals, includes, excludes, greater_than, less_than, is_true, is_false
    criterion_value         JSONB NOT NULL,    -- string, string[], or number
    severity                VARCHAR(20) NOT NULL,   -- hard_blocker, advisory
    enforcement_point       VARCHAR(20),            -- pre_workspace, pre_submission
    explanation_text        TEXT NOT NULL,
    rule_group_id           UUID,
    rule_group_operator     VARCHAR(5),             -- AND, OR
    display_order           INTEGER NOT NULL DEFAULT 0,
    created_by              UUID NOT NULL REFERENCES users(user_id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_enforcement_point CHECK (
        severity != 'hard_blocker' OR enforcement_point IS NOT NULL
    )
);
CREATE INDEX idx_elig_rules_opportunity ON eligibility_rules(opportunity_id);

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE prescreening_questionnaires (
    questionnaire_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id) UNIQUE,
    placement           VARCHAR(20) NOT NULL,   -- pre_workspace, pre_submission
    created_by          UUID NOT NULL REFERENCES users(user_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE prescreening_questions (
    question_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    questionnaire_id        UUID NOT NULL REFERENCES prescreening_questionnaires(questionnaire_id),
    question_text           VARCHAR(500) NOT NULL,
    question_type           VARCHAR(20) NOT NULL,  -- yes_no, multiple_choice, text
    is_required             BOOLEAN NOT NULL DEFAULT TRUE,
    display_order           INTEGER NOT NULL DEFAULT 0,
    conditional_display     JSONB  -- {depends_on_question_id, trigger_response_value}
);
CREATE INDEX idx_ps_questions_questionnaire ON prescreening_questions(questionnaire_id);

CREATE TABLE prescreening_options (
    option_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id         UUID NOT NULL REFERENCES prescreening_questions(question_id),
    option_text         VARCHAR(250) NOT NULL,
    mapped_rule_id      UUID REFERENCES eligibility_rules(rule_id),
    rule_outcome        VARCHAR(10)   -- met, violated, advisory
);
CREATE INDEX idx_ps_options_question ON prescreening_options(question_id);

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE attachment_requirements (
    requirement_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id              UUID NOT NULL REFERENCES opportunities(opportunity_id),
    document_type               VARCHAR(100) NOT NULL,
    custom_document_name        VARCHAR(250),
    applicant_type_scope        JSONB,   -- array of entity_type values; empty = all
    stage_scope                 VARCHAR(30) NOT NULL,
    -- pre_application, loi, full_application
    is_required                 BOOLEAN NOT NULL DEFAULT TRUE,
    instructions                TEXT,
    file_format_restrictions    JSONB,   -- array of file extensions
    max_file_size_mb            INTEGER NOT NULL DEFAULT 50,
    created_by                  UUID NOT NULL REFERENCES users(user_id),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attach_req_opportunity ON attachment_requirements(opportunity_id);

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE screening_criteria (
    criterion_id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id                  UUID NOT NULL REFERENCES opportunities(opportunity_id),
    criterion_text                  VARCHAR(500) NOT NULL,
    criterion_type                  VARCHAR(10) NOT NULL,  -- auto, manual
    auto_criterion_key              VARCHAR(50),
    -- deadline_check, completeness_check, eligibility_check, attachment_check, duplicate_check
    is_required                     BOOLEAN NOT NULL DEFAULT TRUE,
    suggested_disposition_on_failure VARCHAR(50),
    display_order                   INTEGER NOT NULL DEFAULT 0,
    created_by                      UUID NOT NULL REFERENCES users(user_id),
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_screening_criteria_opp ON screening_criteria(opportunity_id);

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE guidance_prompts (
    prompt_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id        VARCHAR(100) NOT NULL UNIQUE,
    -- e.g., 'executive_summary', 'eligibility_summary', 'applicant_instructions'
    prompt_text     TEXT NOT NULL,
    example_text    TEXT,
    uswds_tips      JSONB,   -- array of plain-language tip strings
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE section_conditions (
    condition_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id              UUID NOT NULL REFERENCES application_sections(section_id),
    trigger_field           VARCHAR(100) NOT NULL,
    operator                VARCHAR(20) NOT NULL,
    trigger_value           JSONB NOT NULL,
    condition_group_operator VARCHAR(5),  -- AND, OR
    created_by              UUID NOT NULL REFERENCES users(user_id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_section_conditions_section ON section_conditions(section_id);
```
---

### DDL: Organization Schema (Users, Orgs, Roles, Documents)

Source: `FRD/Y0b-schema-org.md`

```sql
-- ─────────────────────────────────────────────────────────────────
-- ORGANIZATION SCHEMA: Users, Organizations, Roles, Documents
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE users (
    user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(320) NOT NULL UNIQUE,
    full_name       VARCHAR(250) NOT NULL,
    phone           VARCHAR(30),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at   TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX idx_users_email ON users(email);

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE grantor_organizations (
    org_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_name        VARCHAR(250) NOT NULL,
    org_type        VARCHAR(50),
    -- federal_agency, state_agency, foundation, corporate, other
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────
-- Applicant organization profile (F18, F19)

CREATE TABLE organizations (
    org_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name              VARCHAR(250) NOT NULL,
    dba_name                VARCHAR(250),
    address_line1           VARCHAR(250) NOT NULL,
    address_line2           VARCHAR(250),
    city                    VARCHAR(100) NOT NULL,
    state                   CHAR(2) NOT NULL,
    zip                     VARCHAR(10) NOT NULL,
    country                 CHAR(2) NOT NULL DEFAULT 'US',
    entity_type             VARCHAR(50) NOT NULL,
    -- nonprofit_501c3, nonprofit_other, for_profit, government_federal,
    -- government_state, government_local, tribal, university, individual, other
    ein                     CHAR(9),                    -- 9 digits, stored without hyphen
    uei                     CHAR(12),                   -- 12-char alphanumeric
    sam_registered          BOOLEAN NOT NULL DEFAULT FALSE,
    sam_expiration_date     DATE,
    tax_exempt_status       VARCHAR(20),
    -- 501c3, 501c4, 501c6, other, not_applicable
    congressional_district  VARCHAR(20),
    primary_contact_name    VARCHAR(250) NOT NULL,
    primary_contact_email   VARCHAR(320) NOT NULL,
    primary_contact_phone   VARCHAR(30),
    banking_readiness       VARCHAR(20) NOT NULL DEFAULT 'unknown',
    -- ready, not_ready, unknown
    indirect_cost_rate      NUMERIC(5,2),               -- percentage
    indirect_cost_base      VARCHAR(100),
    profile_completeness_pct NUMERIC(5,2) DEFAULT 0,    -- computed field
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_uei_format CHECK (uei IS NULL OR uei ~ '^[A-Za-z0-9]{12}$'),
    CONSTRAINT chk_ein_format CHECK (ein IS NULL OR ein ~ '^\d{9}$')
);
CREATE INDEX idx_organizations_uei ON organizations(uei);
CREATE INDEX idx_organizations_ein ON organizations(ein);

-- ─────────────────────────────────────────────────────────────────
-- Additional contacts: authorized representatives, financial contacts (F19)

CREATE TABLE org_contacts (
    contact_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(org_id),
    user_id         UUID REFERENCES users(user_id),
    contact_name    VARCHAR(250) NOT NULL,
    contact_email   VARCHAR(320) NOT NULL,
    contact_phone   VARCHAR(30),
    contact_title   VARCHAR(250),
    contact_type    VARCHAR(50) NOT NULL,
    -- primary, authorized_representative, financial, technical, other
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_org_contacts_org ON org_contacts(org_id);

-- ─────────────────────────────────────────────────────────────────
-- Role assignments for applicant organization team members (F22)

CREATE TABLE org_roles (
    role_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID NOT NULL REFERENCES organizations(org_id),
    user_id                 UUID NOT NULL REFERENCES users(user_id),
    roles                   JSONB NOT NULL,
    -- array of: org_admin, proposal_lead, contributor, finance_contributor,
    --           authorized_representative, external_contributor
    invited_by              UUID REFERENCES users(user_id),
    invitation_sent_at      TIMESTAMPTZ,
    invitation_accepted_at  TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at              TIMESTAMPTZ,

    CONSTRAINT uq_org_user_role UNIQUE (org_id, user_id)
);
CREATE INDEX idx_org_roles_org ON org_roles(org_id);
CREATE INDEX idx_org_roles_user ON org_roles(user_id);

-- ─────────────────────────────────────────────────────────────────
-- Reusable standard attachment library at organization level (F20)

CREATE TABLE org_attachments (
    attachment_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID NOT NULL REFERENCES organizations(org_id),
    document_type           VARCHAR(100) NOT NULL,
    -- irs_determination_letter, w9, audit_report, indirect_cost_agreement,
    -- board_roster, insurance_certificate, letters_of_support, other
    custom_document_name    VARCHAR(250),
    version_number          INTEGER NOT NULL DEFAULT 1,
    file_name               VARCHAR(500) NOT NULL,
    file_path               VARCHAR(2048) NOT NULL,     -- S3 object key
    mime_type               VARCHAR(100) NOT NULL,
    file_size_bytes         BIGINT NOT NULL,
    expiration_date         DATE,                       -- credential tracking (F21)
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_by             UUID NOT NULL REFERENCES users(user_id),
    uploaded_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_version_positive CHECK (version_number > 0)
);
CREATE INDEX idx_org_attachments_org ON org_attachments(org_id);
CREATE INDEX idx_org_attachments_type ON org_attachments(org_id, document_type);
CREATE INDEX idx_org_attachments_active ON org_attachments(org_id, document_type, is_active);

-- ─────────────────────────────────────────────────────────────────
-- Role assignments for grantor organization users

CREATE TABLE grantor_roles (
    role_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grantor_org_id  UUID NOT NULL REFERENCES grantor_organizations(org_id),
    user_id         UUID NOT NULL REFERENCES users(user_id),
    roles           JSONB NOT NULL,
    -- array of: grantor_admin, program_officer, intake_administrator,
    --           compliance_analyst, reviewer
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at      TIMESTAMPTZ,

    CONSTRAINT uq_grantor_user_role UNIQUE (grantor_org_id, user_id)
);
CREATE INDEX idx_grantor_roles_org ON grantor_roles(grantor_org_id);
CREATE INDEX idx_grantor_roles_user ON grantor_roles(user_id);
```
---

### DDL: Application Workspace Schema

Source: `FRD/Y0c-schema-app.md`

```sql
-- ─────────────────────────────────────────────────────────────────
-- APPLICATION SCHEMA: Workspaces, Sections, Budget, Attachments
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE application_workspaces (
    workspace_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id),
    org_id              UUID NOT NULL REFERENCES organizations(org_id),
    track_id            UUID,               -- for multi-track opportunities
    status              VARCHAR(50) NOT NULL DEFAULT 'workspace_created',
    -- workspace_created, in_progress, ready_for_internal_review,
    -- ready_to_submit, submitted, intake_screening, returned_for_correction,
    -- resubmitted, accepted_for_review, withdrawn, administratively_rejected
    visibility          VARCHAR(20) NOT NULL DEFAULT 'grantee_private',
    -- grantee_private (draft) | shared (submitted)
    is_locked           BOOLEAN NOT NULL DEFAULT FALSE,
    created_by          UUID NOT NULL REFERENCES users(user_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_workspace_org_opp UNIQUE (opportunity_id, org_id)
    -- Note: constraint is conditionally bypassed when opportunity.duplicate_allowed = true
);
CREATE INDEX idx_workspaces_opportunity ON application_workspaces(opportunity_id);
CREATE INDEX idx_workspaces_org ON application_workspaces(org_id);
CREATE INDEX idx_workspaces_status ON application_workspaces(status);

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE application_sections (
    section_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    section_type        VARCHAR(50) NOT NULL,
    -- org_profile, eligibility, narrative, budget, workplan, performance_measures,
    -- attachments, certifications, review_submit, custom
    section_name        VARCHAR(250) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'not_started',
    -- not_started, in_progress, complete, error, locked
    is_visible          BOOLEAN NOT NULL DEFAULT TRUE,     -- conditional logic F10
    is_locked           BOOLEAN NOT NULL DEFAULT FALSE,    -- locked after submission F54
    display_order       INTEGER NOT NULL DEFAULT 0,
    owner_id            UUID REFERENCES users(user_id),    -- section owner F31
    internal_due_date   DATE,                              -- internal due date F31
    validation_status   VARCHAR(20) DEFAULT 'not_validated',
    validation_errors   JSONB,
    -- array of {field_id, severity: blocking|warning|info, message, field_label}
    visibility          VARCHAR(20) NOT NULL DEFAULT 'grantee_private',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sections_workspace ON application_sections(workspace_id);
CREATE INDEX idx_sections_type ON application_sections(workspace_id, section_type);

-- ─────────────────────────────────────────────────────────────────
-- Grantor-configured form field definitions per section (F36)

CREATE TABLE form_field_definitions (
    field_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id),
    section_id          UUID NOT NULL REFERENCES application_sections(section_id),
    field_type          VARCHAR(30) NOT NULL,
    -- text, textarea, number, currency, date, picklist, multi_select,
    -- checkbox, file_upload, calculated, repeating_table
    label               VARCHAR(200) NOT NULL,
    placeholder         VARCHAR(500),
    help_text           VARCHAR(1000),
    is_required         BOOLEAN NOT NULL DEFAULT FALSE,
    display_order       INTEGER NOT NULL DEFAULT 0,
    validation_config   JSONB,
    -- {max_length, max_chars, max_words, min, max, decimal_places,
    --  allowed_values, min_selected, max_selected, file_formats,
    --  max_size_mb, min_date, max_date}
    formula             TEXT,              -- for calculated fields
    columns             JSONB,             -- for repeating_table: array of column defs
    created_by          UUID NOT NULL REFERENCES users(user_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_form_fields_opportunity_section ON form_field_definitions(opportunity_id, section_id);

-- ─────────────────────────────────────────────────────────────────
-- Applicant-entered form data per field per workspace

CREATE TABLE field_responses (
    response_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    section_id          UUID NOT NULL REFERENCES application_sections(section_id),
    field_id            UUID NOT NULL REFERENCES form_field_definitions(field_id),
    response_value      TEXT,              -- for simple fields
    response_json       JSONB,             -- for complex types (repeating_table, multi_select)
    updated_by          UUID NOT NULL REFERENCES users(user_id),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_field_response UNIQUE (workspace_id, field_id)
);
CREATE INDEX idx_field_responses_workspace ON field_responses(workspace_id);
CREATE INDEX idx_field_responses_section ON field_responses(section_id);

-- ─────────────────────────────────────────────────────────────────
-- Internal tasks within application workspace (F31)

CREATE TABLE workspace_tasks (
    task_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    section_id      UUID REFERENCES application_sections(section_id),
    task_title      VARCHAR(500) NOT NULL,
    assignee_id     UUID NOT NULL REFERENCES users(user_id),
    task_due_date   DATE,
    task_notes      TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'open',  -- open, complete
    created_by      UUID NOT NULL REFERENCES users(user_id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);
CREATE INDEX idx_tasks_workspace ON workspace_tasks(workspace_id);
CREATE INDEX idx_tasks_assignee ON workspace_tasks(assignee_id);

-- ─────────────────────────────────────────────────────────────────
-- Private internal applicant comments (F32)
-- CRITICAL: These records MUST NEVER be visible to grantor roles

CREATE TABLE workspace_comments (
    comment_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    section_id      UUID REFERENCES application_sections(section_id),
    comment_text    TEXT NOT NULL CHECK (char_length(comment_text) <= 5000),
    visibility      VARCHAR(20) NOT NULL DEFAULT 'internal',
    -- always 'internal'; API enforces no grantor access
    posted_by       UUID NOT NULL REFERENCES users(user_id),
    posted_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_workspace ON workspace_comments(workspace_id);

-- ─────────────────────────────────────────────────────────────────
-- Per-applicant eligibility pre-screen responses (F24, F28)

CREATE TABLE eligibility_responses (
    response_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id          UUID NOT NULL REFERENCES opportunities(opportunity_id),
    org_id                  UUID NOT NULL REFERENCES organizations(org_id),
    workspace_id            UUID REFERENCES application_workspaces(workspace_id),
    question_id             UUID NOT NULL REFERENCES prescreening_questions(question_id),
    selected_option_id      UUID REFERENCES prescreening_options(option_id),
    response_text           TEXT,           -- for text-type questions
    rule_evaluation_result  VARCHAR(20),    -- met, violated, advisory, not_applicable
    overall_result          VARCHAR(20),
    -- eligible, likely_eligible, needs_attention, ineligible
    submitted_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_elig_response UNIQUE (opportunity_id, org_id, question_id)
);
CREATE INDEX idx_elig_responses_workspace ON eligibility_responses(workspace_id);
CREATE INDEX idx_elig_responses_org_opp ON eligibility_responses(org_id, opportunity_id);

-- ─────────────────────────────────────────────────────────────────
-- Budget header per workspace (F38)

CREATE TABLE budgets (
    budget_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id            UUID NOT NULL REFERENCES application_workspaces(workspace_id) UNIQUE,
    budget_periods_count    INTEGER NOT NULL DEFAULT 1,
    total_federal_request   NUMERIC(15,2),   -- computed
    total_match             NUMERIC(15,2),   -- computed
    total_indirect          NUMERIC(15,2),   -- computed
    total_project_cost      NUMERIC(15,2),   -- computed (federal + match)
    validation_status       VARCHAR(20) DEFAULT 'not_validated',
    validation_errors       JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────
-- Budget line items (F38)

CREATE TABLE budget_line_items (
    line_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id           UUID NOT NULL REFERENCES budgets(budget_id),
    budget_period       INTEGER NOT NULL DEFAULT 1,
    category            VARCHAR(50) NOT NULL,
    -- personnel, fringe, travel, equipment, supplies, contractual,
    -- indirect, other_direct, match_cash, match_in_kind
    description         VARCHAR(500) NOT NULL,
    quantity            NUMERIC(10,2),
    unit_cost           NUMERIC(15,2),
    total_cost          NUMERIC(15,2) NOT NULL,
    -- Personnel-specific fields
    personnel_name      VARCHAR(250),
    fte                 NUMERIC(4,3),              -- 0.001 to 1.000
    annual_salary       NUMERIC(15,2),
    fringe_rate         NUMERIC(5,2),              -- percentage
    -- Cost-share fields
    match_source        VARCHAR(250),
    match_type          VARCHAR(10),               -- cash, in_kind
    -- Justification
    justification_text  TEXT,
    created_by          UUID NOT NULL REFERENCES users(user_id),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_total_cost_nonneg CHECK (total_cost >= 0),
    CONSTRAINT chk_fte_range CHECK (fte IS NULL OR (fte >= 0.001 AND fte <= 1.000)),
    CONSTRAINT chk_fringe_range CHECK (
        fringe_rate IS NULL OR (fringe_rate >= 0 AND fringe_rate <= 100)
    )
);
CREATE INDEX idx_budget_items_budget ON budget_line_items(budget_id);
CREATE INDEX idx_budget_items_period ON budget_line_items(budget_id, budget_period);

-- ─────────────────────────────────────────────────────────────────
-- Application-level uploaded attachments (F40, F41)

CREATE TABLE attachments (
    attachment_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    section_id          UUID REFERENCES application_sections(section_id),
    requirement_id      UUID REFERENCES attachment_requirements(requirement_id),
    source_type         VARCHAR(10) NOT NULL,      -- upload, library
    org_document_id     UUID REFERENCES org_attachments(attachment_id),
    -- populated when source_type = 'library'
    file_name           VARCHAR(500),
    file_path           VARCHAR(2048),              -- S3 object key; null for library source
    mime_type           VARCHAR(100),
    file_size_bytes     BIGINT,
    version_number      INTEGER NOT NULL DEFAULT 1,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_by         UUID REFERENCES users(user_id),
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attachments_workspace ON attachments(workspace_id);
CREATE INDEX idx_attachments_requirement ON attachments(requirement_id, is_active);

-- ─────────────────────────────────────────────────────────────────
-- Authorized representative certification records (F51)

CREATE TABLE certifications (
    cert_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id            UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    certifying_user_id      UUID NOT NULL REFERENCES users(user_id),
    certification_text      TEXT NOT NULL,
    certification_text_hash VARCHAR(64) NOT NULL,   -- SHA-256 of certification text
    certification_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_certification_workspace UNIQUE (workspace_id)
);
```
---

### DDL: Submission, Intake Queue, Audit Schema

Source: `FRD/Y0d-schema-submission.md`

```sql
-- ─────────────────────────────────────────────────────────────────
-- SUBMISSION SCHEMA: Snapshots, Queue, Dispositions, Q&A, Audit
-- CRITICAL: submission_snapshots and audit_events are IMMUTABLE —
-- no UPDATE or DELETE operations are ever permitted on these tables.
-- ─────────────────────────────────────────────────────────────────

-- Immutable final submitted application package (F52, F53, F59)
CREATE TABLE submission_snapshots (
    snapshot_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id                UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    opportunity_id              UUID NOT NULL REFERENCES opportunities(opportunity_id),
    org_id                      UUID NOT NULL REFERENCES organizations(org_id),
    confirmation_number         VARCHAR(30) NOT NULL UNIQUE,
    -- Format: GI-{YEAR}-{8-digit-seq}, e.g., GI-2026-00001234
    submitted_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_by                UUID NOT NULL REFERENCES users(user_id),

    -- Immutable snapshot payloads (JSONB)
    org_profile_snapshot        JSONB NOT NULL,    -- org profile state at submission
    eligibility_snapshot        JSONB NOT NULL,    -- eligibility responses and results
    sections_snapshot           JSONB NOT NULL,    -- all section field data
    budget_snapshot             JSONB NOT NULL,    -- complete budget data
    attachment_refs             JSONB NOT NULL,    -- list of attachment metadata (not file bytes)

    -- Certification reference
    certification_id            UUID REFERENCES certifications(cert_id),

    -- Version tracking (F59)
    is_original                 BOOLEAN NOT NULL DEFAULT TRUE,
    is_current                  BOOLEAN NOT NULL DEFAULT TRUE,
    supersedes_snapshot_id      UUID REFERENCES submission_snapshots(snapshot_id),

    -- Generated packages (F53)
    human_readable_pdf_path     VARCHAR(2048),     -- S3 object key
    machine_readable_json_path  VARCHAR(2048),     -- S3 object key

    -- Validation summary at submission
    validation_summary          JSONB
);
CREATE INDEX idx_snapshots_workspace ON submission_snapshots(workspace_id);
CREATE INDEX idx_snapshots_opportunity ON submission_snapshots(opportunity_id);
CREATE INDEX idx_snapshots_confirmation ON submission_snapshots(confirmation_number);
CREATE INDEX idx_snapshots_current ON submission_snapshots(workspace_id, is_current);

-- DB-level immutability trigger (no updates/deletes)
CREATE OR REPLACE FUNCTION fn_submission_snapshots_immutable()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'submission_snapshots records are immutable and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_submission_snapshots_no_update
    BEFORE UPDATE ON submission_snapshots
    FOR EACH ROW EXECUTE FUNCTION fn_submission_snapshots_immutable();

CREATE TRIGGER trg_submission_snapshots_no_delete
    BEFORE DELETE ON submission_snapshots
    FOR EACH ROW EXECUTE FUNCTION fn_submission_snapshots_immutable();

-- ─────────────────────────────────────────────────────────────────
-- Routing and screening queue entries (F55, F56)

CREATE TABLE intake_queue_entries (
    entry_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id),
    org_id              UUID NOT NULL REFERENCES organizations(org_id),
    snapshot_id         UUID NOT NULL REFERENCES submission_snapshots(snapshot_id),
    routed_to           VARCHAR(250),   -- queue segment or assigned team name
    status              VARCHAR(50) NOT NULL DEFAULT 'pending_screening',
    -- pending_screening, accepted_for_review, returned_for_correction,
    -- ineligible, late, duplicate, withdrawn, administratively_rejected
    disposition_id      UUID REFERENCES intake_dispositions(disposition_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_queue_opportunity ON intake_queue_entries(opportunity_id);
CREATE INDEX idx_queue_status ON intake_queue_entries(status);
CREATE INDEX idx_queue_org ON intake_queue_entries(org_id);

-- ─────────────────────────────────────────────────────────────────
-- Administrative screening disposition records (F57)

CREATE TABLE intake_dispositions (
    disposition_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id                    UUID NOT NULL REFERENCES intake_queue_entries(entry_id),
    snapshot_id                 UUID NOT NULL REFERENCES submission_snapshots(snapshot_id),
    disposition                 VARCHAR(50) NOT NULL,
    -- accepted_for_review, returned_for_correction, ineligible, late,
    -- duplicate, withdrawn, administratively_rejected
    rationale                   TEXT,     -- required for non-acceptance dispositions
    screening_criteria_results  JSONB,
    -- array of {criterion_id, criterion_text, result: pass|fail|na}
    applied_by                  UUID NOT NULL REFERENCES users(user_id),
    applied_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dispositions_entry ON intake_dispositions(entry_id);

-- ─────────────────────────────────────────────────────────────────
-- Grantor correction/clarification requests (F58)

CREATE TABLE correction_requests (
    request_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id                UUID NOT NULL REFERENCES intake_queue_entries(entry_id),
    snapshot_id             UUID NOT NULL REFERENCES submission_snapshots(snapshot_id),
    correction_sections     JSONB NOT NULL,      -- array of section_ids requiring correction
    correction_instructions TEXT NOT NULL,
    correction_deadline     TIMESTAMPTZ NOT NULL,
    requested_by            UUID NOT NULL REFERENCES users(user_id),
    requested_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at             TIMESTAMPTZ
);
CREATE INDEX idx_correction_requests_entry ON correction_requests(entry_id);

-- ─────────────────────────────────────────────────────────────────
-- Accepted application routing to review module (F60)

CREATE TABLE review_handoffs (
    handoff_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id                UUID NOT NULL REFERENCES intake_queue_entries(entry_id),
    snapshot_id             UUID NOT NULL REFERENCES submission_snapshots(snapshot_id),
    review_workflow_type    VARCHAR(100),    -- merit_review, risk_assessment, scoring
    assigned_reviewer_ids   JSONB,           -- array of user_ids
    handed_off_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID NOT NULL REFERENCES users(user_id)
);
CREATE INDEX idx_review_handoffs_entry ON review_handoffs(entry_id);

-- ─────────────────────────────────────────────────────────────────
-- Q&A questions and published answers (F43, F44)

CREATE TABLE qa_items (
    qa_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id),
    submitter_org_id    UUID NOT NULL REFERENCES organizations(org_id),
    submitter_user_id   UUID NOT NULL REFERENCES users(user_id),
    question_text       TEXT NOT NULL,
    answer_text         TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'submitted',
    -- submitted, under_review, answered, archived
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_by        UUID REFERENCES users(user_id),
    published_at        TIMESTAMPTZ
);
CREATE INDEX idx_qa_items_opportunity ON qa_items(opportunity_id);
CREATE INDEX idx_qa_items_status ON qa_items(opportunity_id, status);

-- ─────────────────────────────────────────────────────────────────
-- Published opportunity changes (F17, F46)

CREATE TABLE addenda (
    addendum_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id),
    version_id          UUID REFERENCES opportunity_versions(version_id),
    addendum_type       VARCHAR(50) NOT NULL,
    -- date_change, content_change, qa_response, correction, required_application_change
    title               VARCHAR(250) NOT NULL,
    description         TEXT NOT NULL,
    effective_date      DATE NOT NULL,
    published_by        UUID NOT NULL REFERENCES users(user_id),
    published_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    superseded_at       TIMESTAMPTZ
);
CREATE INDEX idx_addenda_opportunity ON addenda(opportunity_id);
CREATE INDEX idx_addenda_published ON addenda(opportunity_id, published_at DESC);

-- ─────────────────────────────────────────────────────────────────
-- Immutable system-generated audit event records
-- CRITICAL: No UPDATE or DELETE operations are ever permitted

CREATE TABLE audit_events (
    event_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type      VARCHAR(100) NOT NULL,
    -- OPPORTUNITY_CREATED, OPPORTUNITY_METADATA_UPDATED, OPPORTUNITY_PUBLISHED,
    -- OPPORTUNITY_VERSION_CREATED, ELIGIBILITY_RULE_CREATED, WORKSPACE_CREATED,
    -- APPLICATION_SUBMITTED, SUBMISSION_BLOCKED, CERTIFICATION_COMPLETED,
    -- DISPOSITION_APPLIED, CORRECTION_REQUESTED, APPLICATION_ACCEPTED_FOR_REVIEW,
    -- QA_ANSWER_PUBLISHED, ADDENDUM_PUBLISHED, NOTIFICATION_SENT, EXPORT_GENERATED,
    -- WORKSPACE_LOCKED, WORKSPACE_UNLOCKED, ROLE_ASSIGNED,
    -- ORGANIZATION_PROFILE_CREATED, ORGANIZATION_PROFILE_UPDATED
    entity_type     VARCHAR(50) NOT NULL,   -- opportunity, workspace, snapshot, disposition, etc.
    entity_id       UUID NOT NULL,
    actor_user_id   UUID REFERENCES users(user_id),  -- null for system-generated events
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    before_state    JSONB,
    after_state     JSONB,
    ip_address      INET,
    metadata        JSONB   -- additional event-specific data
);
CREATE INDEX idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_events_actor ON audit_events(actor_user_id);
CREATE INDEX idx_audit_events_occurred ON audit_events(occurred_at DESC);
CREATE INDEX idx_audit_events_type ON audit_events(event_type);

-- DB-level immutability trigger for audit_events
CREATE OR REPLACE FUNCTION fn_audit_events_immutable()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_events records are immutable and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_events_no_update
    BEFORE UPDATE ON audit_events
    FOR EACH ROW EXECUTE FUNCTION fn_audit_events_immutable();

CREATE TRIGGER trg_audit_events_no_delete
    BEFORE DELETE ON audit_events
    FOR EACH ROW EXECUTE FUNCTION fn_audit_events_immutable();

-- ─────────────────────────────────────────────────────────────────
-- Notification delivery tracking (F47)

CREATE TABLE notification_records (
    notification_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id   UUID NOT NULL REFERENCES users(user_id),
    trigger_event       VARCHAR(50) NOT NULL,
    -- addendum_published, deadline_changed, required_change, qa_answered,
    -- submission_received, returned_for_correction, accepted_for_review,
    -- workspace_created, deadline_approaching
    opportunity_id      UUID REFERENCES opportunities(opportunity_id),
    entity_id           UUID,     -- addendum_id, qa_id, etc.
    message_text        TEXT NOT NULL,
    channel             VARCHAR(10) NOT NULL,  -- email, in_app
    sent_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    delivered_at        TIMESTAMPTZ,
    delivery_status     VARCHAR(20) NOT NULL DEFAULT 'sent',
    -- sent, delivered, failed, bounced
    read_at             TIMESTAMPTZ
);
CREATE INDEX idx_notifications_recipient ON notification_records(recipient_user_id);
CREATE INDEX idx_notifications_opportunity ON notification_records(opportunity_id);

-- ─────────────────────────────────────────────────────────────────
-- Intake data export job tracking (F63)

CREATE TABLE export_jobs (
    job_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requested_by    UUID NOT NULL REFERENCES users(user_id),
    opportunity_id  UUID NOT NULL REFERENCES opportunities(opportunity_id),
    filters         JSONB NOT NULL,
    -- {date_from, date_to, disposition_filter, include_eligibility,
    --  include_budget, include_audit_events}
    format          VARCHAR(5) NOT NULL,   -- csv, json
    status          VARCHAR(20) NOT NULL DEFAULT 'queued',
    -- queued, processing, complete, failed
    file_path       VARCHAR(2048),         -- S3 object key when complete
    requested_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    row_count       INTEGER
);
CREATE INDEX idx_export_jobs_requested_by ON export_jobs(requested_by);
```
---

## 5. API Design

**Base URL:** `/api/v1`  
**Authentication:** JWT Bearer token on all endpoints except public opportunity reads  
**Content-Type:** `application/json` (multipart/form-data for file uploads)  
**API Versioning:** URL-based (`/api/v1/`)  
**Pagination:** All list endpoints support `page` + `page_size` parameters

### Standard Response Shapes

```typescript
// Standard list response
interface ListResponse<T> {
  items: T[];
  total_count: number;
  page: number;
  page_size: number;
}

// Standard error response
interface ApiError {
  error_code: string;
  message: string;
  field?: string;
  timestamp: string;  // ISO 8601 UTC
}

// Validation error (multi-field)
interface ValidationErrorResponse {
  error_code: 'VALIDATION_FAILED';
  message: string;
  errors: Array<{ field: string; error_code: string; message: string }>;
}
```

---

### API: Programs

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/programs` | List programs for authenticated grantor org | Grantor roles |
| POST | `/programs` | Create a new program | Grantor Admin, Program Officer |
| GET | `/programs/{program_id}` | Get program details | Grantor roles |
| PUT | `/programs/{program_id}` | Update program | Grantor Admin, Program Officer |

```typescript
interface Program {
  program_id: string;
  grantor_org_id: string;
  program_name: string;
  program_area?: string;
  is_federal: boolean;
  program_description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
}

// POST /programs body
interface CreateProgramRequest {
  program_name: string;     // required
  program_area?: string;
  is_federal: boolean;      // required
  program_description?: string;
}
```

---

### API: Opportunity Templates

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/opportunity-templates` | List all templates (system + org custom) | Grantor roles |
| GET | `/opportunity-templates/{template_id}` | Get template details | Grantor roles |
| POST | `/opportunities/{opportunity_id}/save-as-template` | Save published opportunity as custom template | Grantor Admin |

---

### API: Opportunities (Grantor + Public)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| POST | `/opportunities` | Create opportunity from template (F0) | Grantor Admin, Program Officer |
| GET | `/opportunities` | Search and list published opportunities (F14) | Public |
| GET | `/opportunities/{opportunity_id}` | Get opportunity detail (F16) | Public / Authenticated |
| PUT | `/opportunities/{opportunity_id}/metadata` | Update metadata (F1) | Program Officer, Grantor Admin |
| PUT | `/opportunities/{opportunity_id}/deadlines` | Update deadline config (F4) | Program Officer, Grantor Admin |
| GET | `/opportunities/{opportunity_id}/preview` | Grantor preview before publish (F13) | Grantor roles |
| POST | `/opportunities/{opportunity_id}/validate` | Dry-run completeness check (F5) | Grantor roles |
| POST | `/opportunities/{opportunity_id}/publish` | Publish opportunity (F5, F13) | Grantor Admin, Program Officer |
| POST | `/opportunities/{opportunity_id}/modifications` | Post-publication modification (F6) | Grantor Admin, Program Officer |
| GET | `/opportunities/{opportunity_id}/versions` | List version history (F6) | Grantor roles |
| GET | `/opportunities/{opportunity_id}/versions/{version_number}` | Get specific version (F6) | Grantor roles |
| GET | `/opportunities/{opportunity_id}/workspace-status` | Get applicant's workspace status (F16) | Applicant roles |
| GET | `/opportunities/{opportunity_id}/addenda` | List addenda (F17) | Public |
| PUT | `/opportunities/{opportunity_id}/qa-config` | Configure Q&A settings (F43) | Grantor Admin, Program Officer |

```typescript
interface Opportunity {
  opportunity_id: string;
  program_id: string;
  template_id?: string;
  title: string;
  funding_source: string;
  announcement_type: 'initial' | 'modification' | 'continuation' | 'supplemental' | 'correction';
  opportunity_number: string;
  assistance_listing_number?: string;
  funding_amount_min?: number;
  funding_amount_max: number;
  total_program_funding?: number;
  expected_awards_min?: number;
  expected_awards_max?: number;
  eligibility_summary: string;
  executive_summary: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  contact_title?: string;
  program_area: string;
  geography?: string[];
  application_url?: string;
  status: 'draft' | 'internal_review' | 'approved' | 'published' | 'modified' | 'closed' | 'archived';
  visibility: 'public' | 'restricted_authenticated';
  public_slug?: string;
  published_at?: string;
  application_open_date?: string;
  application_close_date?: string;
  pre_application_deadline?: string;
  loi_deadline?: string;
  loi_required: boolean;
  rolling_review_enabled: boolean;
  rolling_review_cadence_days?: number;
  deadline_timezone: string;
  admin_screening_enabled: boolean;
  attachments_required: boolean;
  duplicate_allowed: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// POST /opportunities
interface CreateOpportunityRequest {
  template_id: string;   // required
  program_id?: string;
}

// GET /opportunities — search query params
interface OpportunitySearchParams {
  keyword?: string;
  funder?: string;
  program_area?: string;
  geography?: string;
  eligibility_type?: string;
  funding_min?: number;
  funding_max?: number;
  due_date_from?: string;
  due_date_to?: string;
  application_stage?: string;
  sort_by?: 'relevance' | 'deadline' | 'amount';
  page?: number;
  page_size?: number;
}

// POST /opportunities/{id}/validate — response
interface ReadinessResult {
  is_ready: boolean;
  blockers: Array<{
    section: string;
    field?: string;
    message: string;
    error_code: string;
  }>;
  warnings: Array<{ section: string; message: string }>;
  checklist_items: Array<{
    item: string;
    status: 'complete' | 'incomplete' | 'not_applicable';
  }>;
}

// Opportunity version
interface OpportunityVersion {
  version_id: string;
  opportunity_id: string;
  version_number: number;
  snapshot: Record<string, unknown>;
  delta?: Record<string, unknown>;
  modification_reason: string;
  created_by: string;
  created_at: string;
}
```

---

### API: Opportunity Guidance (F2)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/guidance/prompts?field_id={field_id}` | Get plain-language guidance for a field | Grantor roles |
| POST | `/guidance/readability` | Get readability score for text content | Grantor roles |

```typescript
interface GuidancePrompt {
  field_id: string;
  prompt_text: string;
  example_text?: string;
  uswds_tips: string[];
}

interface ReadabilityRequest {
  text: string;
}

interface ReadabilityResponse {
  grade_level: number;        // Flesch-Kincaid grade level estimate
  reading_ease: number;       // Flesch Reading Ease score
  label: 'very_easy' | 'easy' | 'fairly_easy' | 'standard' | 'fairly_difficult' | 'difficult' | 'very_difficult';
  word_count: number;
  is_advisory: true;          // always advisory, never blocking
}
```

---

### API: Eligibility Rules (F7, F8)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/opportunities/{opportunity_id}/eligibility-rules` | List rules | Grantor roles |
| POST | `/opportunities/{opportunity_id}/eligibility-rules` | Create rule | Program Officer, Grantor Admin |
| PUT | `/eligibility-rules/{rule_id}` | Update rule | Program Officer, Grantor Admin |
| DELETE | `/eligibility-rules/{rule_id}` | Delete rule | Program Officer, Grantor Admin |

```typescript
interface EligibilityRule {
  rule_id: string;
  opportunity_id: string;
  rule_type: 'applicant_type' | 'geography' | 'entity_status' | 'uei_sam' |
             'nonprofit_status' | 'tribal_status' | 'state_local_status' |
             'prior_award_status' | 'match_requirement' | 'custom';
  criterion_field: string;
  operator: 'equals' | 'not_equals' | 'includes' | 'excludes' |
            'greater_than' | 'less_than' | 'is_true' | 'is_false';
  criterion_value: string | string[] | number;
  severity: 'hard_blocker' | 'advisory';
  enforcement_point?: 'pre_workspace' | 'pre_submission';  // required for hard_blocker
  explanation_text: string;
  rule_group_id?: string;
  rule_group_operator?: 'AND' | 'OR';
  display_order: number;
  created_by: string;
  created_at: string;
}
```

---

### API: Prescreening Questionnaire (F9, Grantor config)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/opportunities/{opportunity_id}/prescreening` | Get questionnaire (grantor config view) | Grantor roles |
| PUT | `/opportunities/{opportunity_id}/prescreening` | Update questionnaire | Program Officer, Grantor Admin |
| POST | `/opportunities/{opportunity_id}/prescreening/preview` | Preview as applicant | Grantor roles |

---

### API: Attachment Requirements (F11)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/opportunities/{opportunity_id}/attachment-requirements` | List requirements | Grantor / Applicant roles |
| POST | `/opportunities/{opportunity_id}/attachment-requirements` | Create requirement | Program Officer, Grantor Admin |
| PUT | `/attachment-requirements/{requirement_id}` | Update requirement | Program Officer, Grantor Admin |
| DELETE | `/attachment-requirements/{requirement_id}` | Delete requirement | Program Officer, Grantor Admin |

```typescript
interface AttachmentRequirement {
  requirement_id: string;
  opportunity_id: string;
  document_type: string;
  custom_document_name?: string;
  applicant_type_scope: string[];   // empty = all entity types
  stage_scope: 'pre_application' | 'loi' | 'full_application';
  is_required: boolean;
  instructions?: string;
  file_format_restrictions?: string[];
  max_file_size_mb: number;
}
```

---

### API: Screening Criteria (F12)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/opportunities/{opportunity_id}/screening-criteria` | List criteria | Grantor roles |
| POST | `/opportunities/{opportunity_id}/screening-criteria` | Create criterion | Program Officer, Grantor Admin |
| PUT | `/screening-criteria/{criterion_id}` | Update criterion | Program Officer, Grantor Admin |
| DELETE | `/screening-criteria/{criterion_id}` | Delete criterion (system criteria protected) | Grantor Admin |

---

### API: Form Builder (F36, F10)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/opportunities/{opportunity_id}/sections/{section_id}/fields` | List field definitions | Grantor roles |
| POST | `/form-fields` | Create field definition | Program Officer, Grantor Admin |
| PUT | `/form-fields/{field_id}` | Update field | Program Officer, Grantor Admin |
| DELETE | `/form-fields/{field_id}` | Delete field | Program Officer, Grantor Admin |
| PUT | `/opportunities/{opportunity_id}/sections/{section_id}/conditions` | Set section conditional rules | Program Officer |

```typescript
interface FormFieldDefinition {
  field_id: string;
  opportunity_id: string;
  section_id: string;
  field_type: 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'picklist' |
              'multi_select' | 'checkbox' | 'file_upload' | 'calculated' | 'repeating_table';
  label: string;
  placeholder?: string;
  help_text?: string;
  is_required: boolean;
  display_order: number;
  validation_config?: {
    max_length?: number;
    max_chars?: number;
    max_words?: number;
    min?: number;
    max?: number;
    decimal_places?: number;
    allowed_values?: string[];
    min_selected?: number;
    max_selected?: number;
    file_formats?: string[];
    max_size_mb?: number;
    min_date?: string;
    max_date?: string;
  };
  formula?: string;
  columns?: Array<{ name: string; field_type: string; is_required?: boolean }>;
}
```
---

### API: Authentication & Organizations

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| POST | `/auth/login` | Authenticate (email/password or SSO) | Public |
| POST | `/auth/refresh` | Refresh JWT access token | Authenticated |
| POST | `/auth/logout` | Invalidate session | Authenticated |
| GET | `/auth/me` | Get current user profile and org memberships | Authenticated |

```typescript
interface CurrentUser {
  user_id: string;
  email: string;
  full_name: string;
  org_memberships: Array<{
    org_id: string;
    org_name: string;
    org_type: 'applicant';
    roles: ApplicantRole[];
  }>;
  grantor_memberships: Array<{
    org_id: string;
    org_name: string;
    org_type: 'grantor';
    roles: GrantorRole[];
  }>;
}

type GrantorRole = 'grantor_admin' | 'program_officer' | 'intake_administrator' |
                  'compliance_analyst' | 'reviewer';

type ApplicantRole = 'org_admin' | 'proposal_lead' | 'contributor' |
                     'finance_contributor' | 'external_contributor' | 'authorized_representative';
```

---

### API: Organizations (Applicant Profile)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| POST | `/organizations` | Create applicant organization profile (F18) | Any authenticated user |
| GET | `/organizations/{org_id}` | Get org profile (F18, F19) | Org team / Grantor (submitted data only) |
| PUT | `/organizations/{org_id}` | Update org profile (F18, F19) | Org Admin |
| GET | `/organizations/{org_id}/credential-status` | Get credential expiration status (F21) | Org team |
| GET | `/organizations/{org_id}/roles` | List org team roles (F22) | Org team |
| POST | `/organizations/{org_id}/roles` | Invite user and assign role(s) (F22) | Org Admin |
| PUT | `/organizations/{org_id}/roles/{role_id}` | Update role assignment (F22) | Org Admin |
| DELETE | `/organizations/{org_id}/roles/{role_id}` | Revoke role (F22) | Org Admin |
| GET | `/organizations/{org_id}/documents` | List org-level documents (F20) | Org team |
| POST | `/organizations/{org_id}/documents` | Upload new org document (F20) | Org Admin |
| GET | `/organizations/{org_id}/documents/{doc_id}` | Get document metadata | Org team |
| GET | `/organizations/{org_id}/documents/{doc_id}/download` | Download document | Org team |
| GET | `/organizations/{org_id}/documents/{doc_id}/versions` | List version history (F20) | Org team |

```typescript
interface Organization {
  org_id: string;
  legal_name: string;
  dba_name?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;          // 2-char US state code
  zip: string;
  country: string;
  entity_type: 'nonprofit_501c3' | 'nonprofit_other' | 'for_profit' | 'government_federal' |
               'government_state' | 'government_local' | 'tribal' | 'university' | 'individual' | 'other';
  ein?: string;           // 9 digits, no hyphen
  uei?: string;           // 12-char alphanumeric
  sam_registered: boolean;
  sam_expiration_date?: string;
  tax_exempt_status?: '501c3' | '501c4' | '501c6' | 'other' | 'not_applicable';
  congressional_district?: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone?: string;
  banking_readiness: 'ready' | 'not_ready' | 'unknown';
  indirect_cost_rate?: number;
  indirect_cost_base?: string;
  profile_completeness_pct: number;
  created_at: string;
  updated_at: string;
}

interface CredentialStatus {
  org_id: string;
  credentials: Array<{
    item_type: string;  // sam_registration, audit_report, irs_determination_letter, etc.
    expiration_date?: string;
    status: 'valid' | 'expiring_soon' | 'expired';
    days_remaining: number;
  }>;
}

interface OrgDocument {
  attachment_id: string;
  document_type: 'irs_determination_letter' | 'w9' | 'audit_report' | 'indirect_cost_agreement' |
                 'board_roster' | 'insurance_certificate' | 'letters_of_support' | 'other';
  custom_document_name?: string;
  file_name: string;
  version_number: number;
  uploaded_at: string;
  expiration_date?: string;
  is_active: boolean;
  expiration_status: 'valid' | 'expiring_soon' | 'expired';
}
```

---

### API: Application Workspaces (F24–F54)

**Pre-Screening (Applicant)**

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/opportunities/{opportunity_id}/prescreening` | Get applicant-facing questionnaire (F24) | Applicant roles |
| POST | `/opportunities/{opportunity_id}/prescreening/submit` | Submit responses; get eligibility result (F24–F26, F28) | Applicant roles |
| GET | `/workspaces/{workspace_id}/eligibility-responses` | Get stored eligibility responses (F28) | Applicant / Grantor (after submission) |

```typescript
interface PrescreeningSubmitRequest {
  org_id: string;
  questionnaire_responses: Array<{
    question_id: string;
    selected_option_id?: string;
    response_text?: string;
  }>;
}

interface EligibilityResult {
  overall_result: 'eligible' | 'likely_eligible' | 'needs_attention' | 'ineligible';
  triggered_rules: Array<{
    rule_id: string;
    severity: 'hard_blocker' | 'advisory';
    explanation_text: string;
    opportunity_section_link?: string;
  }>;
  next_step: string;
  workspace_access_granted: boolean;
}
```

**Workspaces**

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| POST | `/workspaces` | Create application workspace (F29) | Applicant roles |
| GET | `/workspaces/{workspace_id}` | Get workspace details | Applicant team / Grantor (after submission) |
| GET | `/workspaces/{workspace_id}/readiness` | Get submission readiness summary (F34) | Applicant team |
| GET | `/workspaces/{workspace_id}/sections` | List sections with status (F30) | Applicant team |
| GET | `/workspaces/{workspace_id}/sections/{section_id}` | Get section details and fields | Applicant team |
| PUT | `/workspaces/{workspace_id}/sections/{section_id}/assignment` | Assign owner and due date (F31) | Proposal Lead, Org Admin |
| PUT | `/workspaces/{workspace_id}/sections/{section_id}/fields/{field_id}` | Save field response | Applicant team (scoped) |
| POST | `/workspaces/{workspace_id}/sections/{section_id}/validate` | Validate section (F48) | Applicant team |
| POST | `/workspaces/{workspace_id}/sections/evaluate` | Re-evaluate section visibility (F10) | Applicant team |
| GET | `/workspaces/{workspace_id}/tasks` | List tasks (F31) | Applicant team |
| POST | `/workspaces/{workspace_id}/tasks` | Create task (F31) | Proposal Lead, Org Admin |
| PUT | `/workspaces/{workspace_id}/tasks/{task_id}` | Update task | Assignee, Proposal Lead |
| DELETE | `/workspaces/{workspace_id}/tasks/{task_id}` | Delete task | Proposal Lead, Org Admin |
| GET | `/workspaces/{workspace_id}/comments` | List internal comments (F32) | Applicant team ONLY |
| POST | `/workspaces/{workspace_id}/comments` | Post comment (F32) | Applicant team ONLY |

```typescript
interface ApplicationWorkspace {
  workspace_id: string;
  opportunity_id: string;
  org_id: string;
  status: 'workspace_created' | 'in_progress' | 'ready_for_internal_review' |
          'ready_to_submit' | 'submitted' | 'intake_screening' | 'returned_for_correction' |
          'resubmitted' | 'accepted_for_review' | 'withdrawn' | 'administratively_rejected';
  visibility: 'grantee_private' | 'shared';
  is_locked: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ReadinessSummary {
  workspace_id: string;
  overall_completion_pct: number;
  is_ready_to_submit: boolean;
  authorized_rep_assigned: boolean;
  blocking_errors: Array<{
    section_id: string;
    section_name: string;
    field_id?: string;
    field_label?: string;
    error_code: string;
    message: string;
    severity: 'blocking';
    link: string;
  }>;
  warnings: Array<{
    section_id: string;
    field_label?: string;
    message: string;
    severity: 'warning';
  }>;
  informational: Array<{ message: string; severity: 'info' }>;
  attachment_status: Array<{
    requirement_id: string;
    document_type: string;
    is_required: boolean;
    is_fulfilled: boolean;
    document_name?: string;
  }>;
}
```

**Budget (F38–F39)**

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/workspaces/{workspace_id}/budget` | Get budget with line items | Applicant team / Grantor (after submission) |
| PUT | `/workspaces/{workspace_id}/budget` | Update budget metadata | Finance Contributor, Proposal Lead, Org Admin |
| POST | `/workspaces/{workspace_id}/budget/line-items` | Add line item | Finance Contributor, Proposal Lead |
| PUT | `/workspaces/{workspace_id}/budget/line-items/{line_id}` | Update line item | Finance Contributor |
| DELETE | `/workspaces/{workspace_id}/budget/line-items/{line_id}` | Delete line item | Finance Contributor |
| POST | `/workspaces/{workspace_id}/budget/validate` | Validate budget (F39) | Applicant team |

```typescript
interface BudgetLineItem {
  line_id: string;
  budget_id: string;
  budget_period: number;
  category: 'personnel' | 'fringe' | 'travel' | 'equipment' | 'supplies' |
            'contractual' | 'indirect' | 'other_direct' | 'match_cash' | 'match_in_kind';
  description: string;
  quantity?: number;
  unit_cost?: number;
  total_cost: number;
  personnel_name?: string;
  fte?: number;
  annual_salary?: number;
  fringe_rate?: number;
  match_source?: string;
  match_type?: 'cash' | 'in_kind';
  justification_text?: string;
}

interface BudgetValidationResult {
  is_valid: boolean;
  total_federal_request: number;
  total_match: number;
  funding_ceiling: number;
  match_required: boolean;
  match_required_amount?: number;
  errors: Array<{ error_code: string; message: string; severity: 'blocking' | 'warning' }>;
}
```

**Attachments (F40–F41)**

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/workspaces/{workspace_id}/attachments` | List all attachments | Applicant team / Grantor (after submission) |
| POST | `/workspaces/{workspace_id}/sections/{section_id}/attachments` | Upload or reference library doc | Applicant team |
| GET | `/workspaces/{workspace_id}/attachments/{attachment_id}/download` | Download file | Applicant team / Grantor (after submission) |
| POST | `/workspaces/{workspace_id}/attachments/{attachment_id}/replace` | Upload replacement version (F41) | Applicant team |
| GET | `/workspaces/{workspace_id}/attachments/{attachment_id}/versions` | Version history (F41) | Applicant team |

**Validation & Preview (F48–F50, F42)**

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| POST | `/workspaces/{workspace_id}/validate` | Full workspace validation | Applicant team |
| POST | `/workspaces/{workspace_id}/preview` | Generate submission preview (F42) | Applicant team |

---

### API: Submission Workflow (F51–F54)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| POST | `/workspaces/{workspace_id}/certify` | AR certification — triggers submit flow (F51) | Authorized Representative |
| POST | `/workspaces/{workspace_id}/submit` | Submit application (F50, F52) | Authorized Representative |
| GET | `/workspaces/{workspace_id}/receipt` | Download submission receipt (F52) | Applicant team |
| POST | `/workspaces/{workspace_id}/unlock` | Grantor-initiated workspace unlock (F54, F58) | Grantor Admin, Intake Administrator |
| GET | `/submissions/{snapshot_id}` | Get submission snapshot metadata | Applicant / Grantor |
| GET | `/submissions/{snapshot_id}/package/human-readable` | Download human-readable PDF (F53) | Applicant / Grantor |
| GET | `/submissions/{snapshot_id}/package/machine-readable` | Download JSON package (F53) | Grantor roles |
| GET | `/workspaces/{workspace_id}/snapshots` | List all snapshots incl. correction versions (F59) | Applicant / Grantor |

```typescript
interface SubmissionConfirmation {
  snapshot_id: string;
  confirmation_number: string;  // GI-{YEAR}-{8-digit-seq}
  submitted_at: string;
  opportunity_title: string;
  applicant_org_name: string;
  receipt_download_url: string;
}

interface SubmissionBlockedError {
  error_code: 'SUBMISSION_BLOCKED';
  message: string;
  blocking_errors: Array<{
    section_id: string;
    field_label: string;
    error_code: string;
    severity: 'blocking';
  }>;
}
```

---

### API: Intake Queue & Dispositions (F55–F60)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/intake-queue` | List intake queue with filters (F55, F56) | Grantor roles |
| GET | `/intake-queue/{entry_id}` | Get application detail from snapshot (F56) | Grantor roles |
| POST | `/intake-queue/{entry_id}/disposition` | Apply administrative screening disposition (F57) | Intake Administrator, Grantor Admin |
| POST | `/intake-queue/{entry_id}/correction-request` | Request correction/clarification (F58) | Intake Administrator, Grantor Admin |
| GET | `/intake-queue/{entry_id}/snapshots` | List all submission snapshots (F59) | Grantor roles |

---

### API: Q&A (F43–F44, F46)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/opportunities/{opportunity_id}/qa` | List published Q&A (public) | Public |
| GET | `/opportunities/{opportunity_id}/questions` | List all questions incl. unanswered (F44) | Grantor roles |
| POST | `/opportunities/{opportunity_id}/questions` | Submit a question (F43) | Applicant roles |
| PUT | `/questions/{question_id}/answer` | Publish answer (F44) | Designated Q&A responders |
| GET | `/opportunities/{opportunity_id}/audit-history` | Full audit history (F46) | Grantor roles |

---

### API: Notifications, Analytics, Export (F47, F61–F63)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/notifications` | List notifications for authenticated user | Authenticated |
| PUT | `/notifications/{notification_id}/read` | Mark notification as read | Authenticated |
| GET | `/analytics/grantor/dashboard` | Grantor intake dashboard metrics (F61) | Grantor roles |
| GET | `/analytics/grantor/opportunities` | Opportunity-level breakdown (F61) | Grantor roles |
| GET | `/analytics/applicant/dashboard` | Applicant dashboard (F62) | Applicant roles |
| GET | `/analytics/applicant/applications` | Detailed application list (F62) | Applicant roles |
| POST | `/analytics/export` | Create export job (F63) | Grantor Admin, Program Officer, Intake Administrator, Compliance Analyst |
| GET | `/analytics/export/{job_id}/status` | Get export job status | Export requester |
| GET | `/analytics/export/{job_id}/download` | Download completed export | Export requester |
---

## 6. Security Architecture

### Authentication

GrantsIntake uses **JWT (JSON Web Token) Bearer authentication** with dual-token strategy:

| Token | TTL | Storage | Purpose |
|-------|-----|---------|---------|
| Access token | 15 minutes | Memory (not localStorage) | API request authorization |
| Refresh token | 7 days | HttpOnly secure cookie | Silent access token renewal |

**Session invalidation:** Refresh tokens are tracked in Redis with `user_id` + `jti` (JWT ID) as the key. On logout, the Redis key is deleted, invalidating the token regardless of its remaining TTL. This enables secure remote logout across all sessions.

**MVP authentication flow:** Email + password with bcrypt hashing (work factor ≥ 12). SSO (SAML/OIDC) hook is planned for Phase 2 for federal agency SSO providers.

---

### Authorization (RBAC)

Role-based access control is enforced at three layers:

**Layer 1 — Route Middleware (HTTP)**

Every API route declares its required role(s). Middleware validates the decoded JWT claims against the declared role requirements before the request reaches any controller. Requests failing role checks return `403 PERMISSION_DENIED` without executing business logic.

```
Request → JWT validate → Extract roles → Role check → Controller
                              │
                         (fail → 403)
```

**Layer 2 — Service Guards (Business Logic)**

Sensitive operations have secondary role checks inside service methods. Examples:
- `SubmissionService.certify()` verifies `authorized_representative` role on the specific `org_id`
- `WorkspaceService.getComments()` explicitly rejects any user with a grantor-side role membership regardless of other conditions
- `DispositionService.applyDisposition()` verifies `intake_administrator` or `grantor_admin` role on the specific `grantor_org_id`

**Layer 3 — Data Visibility Enforcement (Query Layer)**

The `DataZoneContext` middleware injects the caller's zone type (`grantor` | `grantee` | `public`) into all database queries. Key rules:

| Caller Zone | Workspace Access Rule |
|-------------|----------------------|
| `grantee` | Can only access workspaces where `org_id` matches their own org |
| `grantor` | Can only access workspaces where `visibility = 'shared'` (submitted applications) |
| `public` | No workspace access; only published opportunity data |

**Internal comments permanent restriction:**
```typescript
// In WorkspaceController — router level
router.get('/workspaces/:id/comments', [
  requireRole(['org_admin', 'proposal_lead', 'contributor', 
               'finance_contributor', 'external_contributor', 'authorized_representative']),
  // No grantor roles listed — any grantor token returns 403 immediately
]);
```

---

### Data Visibility Zone Enforcement

The three-zone data boundary is the core privacy guarantee of GrantsIntake:

```
ZONE                  ENFORCED BY                         APPLIES TO
─────────────────────────────────────────────────────────────────────────
Grantor-private       OpportunityDraftGuard               opportunity.status IN (draft, 
                      (blocks applicant reads)            internal_review, approved)
                      
Grantee-private       WorkspaceVisibilityGuard            workspace.visibility = 'grantee_private'
                      (blocks grantor reads)              
                      CommentsEndpointGuard               workspace_comments (always)
                      (permanent grantor block)           
                      
Shared                No access restriction once          workspace.visibility = 'shared'
                      workspace.visibility = 'shared'     (set on submission)
                      and opportunity.status = 'published'
```

**Draft privacy implementation (F35):**
- `application_workspaces.visibility` starts as `'grantee_private'`
- The field is set to `'shared'` only in the `SubmissionService.submit()` method, after the submission snapshot is generated
- No other code path can change `visibility` to `'shared'`
- Database-level: a `CHECK` constraint ensures `visibility` can only be set to `'shared'` when `status = 'submitted'` or later

---

### Data Protection

**Encryption at rest:**
- PostgreSQL database: AES-256 encryption at rest (AWS RDS encryption enabled)
- S3 object storage: Server-side encryption (SSE-S3 or SSE-KMS) for all stored files
- Secrets (DB credentials, JWT signing keys, email API keys): AWS Secrets Manager; never stored in code or environment files in plaintext

**Encryption in transit:**
- All client-to-server communication: TLS 1.2 minimum, TLS 1.3 preferred
- All internal service-to-database communication: TLS (RDS enforced)
- All S3 requests: HTTPS only

**Sensitive field handling:**
- EIN stored as 9-digit string without hyphen; never logged or returned in list responses
- Passwords hashed with bcrypt (work factor ≥ 12); never stored or logged in plaintext
- Certification text SHA-256 hash stored for tamper detection
- JWT signing uses RS256 (asymmetric RSA) — public key for verification, private key stored in Secrets Manager

---

### Immutability Enforcement

Two categories of records are immutable by design:

**1. `submission_snapshots`** — the authoritative submitted application record
- No UPDATE or DELETE permitted after INSERT
- Enforced by PostgreSQL triggers (`trg_submission_snapshots_no_update`, `trg_submission_snapshots_no_delete`)
- Application code never issues UPDATE/DELETE on this table
- Correction workflow creates a new snapshot (`supersedes_snapshot_id` links versions); original is preserved

**2. `audit_events`** — the complete system audit trail
- No UPDATE or DELETE permitted after INSERT
- Enforced by PostgreSQL triggers (`trg_audit_events_no_update`, `trg_audit_events_no_delete`)
- All audit events are append-only; attribution (user, timestamp, IP) is required for all user-initiated events

---

### Input Validation and Injection Prevention

- All request bodies validated using a schema validation library (Zod or class-validator) before processing
- Parameterized queries / ORM query builders used exclusively — no raw string concatenation in SQL
- File uploads: MIME type validation + file extension whitelist; malware scan via ClamAV or cloud-native scanning service before file is accessible
- Character limits enforced at both API layer and database column level
- JSONB inputs validated against expected schema before storage

---

### AI Guardrails (PRD Requirement)

Per product principles, AI assistance features are:
- Labeled as assistive, non-binding, and non-authoritative in all UI and API responses
- Never able to submit forms, certify applications, or apply dispositions autonomously
- Readability scores are advisory only (`is_advisory: true` in API response)
- Plain-language guidance prompts are pre-authored by human specialists and stored in `guidance_prompts` table — no generative AI at MVP
- All AI-related responses include metadata: `{ "is_ai_generated": true, "is_binding": false, "human_review_required": true }`

---

### Security Headers and API Protection

| Control | Implementation |
|---------|---------------|
| CORS | Restricted to known frontend origins; wildcard `*` not permitted |
| Rate limiting | 100 req/min per authenticated user; 20 req/min for public search endpoints |
| Content-Security-Policy | Strict CSP headers on all frontend responses |
| HSTS | Strict-Transport-Security with 1-year max-age |
| X-Frame-Options | `DENY` to prevent clickjacking |
| File upload limits | 50MB per file; enforced at Nginx and application layer |
| Audit logging | All authentication events, permission checks, and submission actions are logged to `audit_events` |
---

## 7. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Design System** | GrantFlow Design System v1.0 | 1.0 | All UI components via `grantflow.css`; WCAG 2.1 AA; replaces `@uswds/uswds` |
| **Frontend Framework** | React | 18.x | SPA for grantor and applicant portals |
| **Frontend Routing** | React Router | 6.x | Client-side routing within SPAs |
| **Frontend State — Server** | React Query (TanStack Query) | 5.x | API data fetching, caching, background refetch |
| **Frontend State — Local** | Zustand | 4.x | Workspace session state, readiness dashboard |
| **Frontend Build** | Vite | 5.x | Build tool, dev server, HMR |
| **TypeScript** | TypeScript | 5.x | Type safety across frontend and backend |
| **Backend Framework** | Node.js + Express or NestJS | Node 20 LTS | REST API server |
| **ORM / Query Builder** | Prisma or Drizzle ORM | Latest stable | Type-safe PostgreSQL queries; no raw string concatenation |
| **Database** | PostgreSQL | 15+ | Primary relational database with JSONB, UUID, full-text search |
| **Database Hosting** | AWS RDS PostgreSQL (Multi-AZ) | — | Managed PostgreSQL with automated backups, encryption at rest |
| **Cache / Session Store** | Redis | 7.x | JWT refresh token invalidation, session management |
| **Cache Hosting** | AWS ElastiCache (Redis) | — | Managed Redis |
| **Object Storage** | AWS S3 (or S3-compatible) | — | Attachment files, PDF packages, JSON packages, export files |
| **Background Jobs** | BullMQ + Redis | 4.x | PDF generation, export jobs, notification delivery, daily deadline alerts |
| **PDF Generation** | Puppeteer (headless Chrome) or WeasyPrint | Latest | Human-readable submission package PDF generation |
| **Email Delivery** | AWS SES or SendGrid | — | Transactional email notifications |
| **Real-time Updates** | WebSocket (Socket.io or ws) | 4.x | Real-time validation feedback during workspace editing |
| **Authentication** | Custom JWT (RS256) + bcrypt | — | Access + refresh token pair; bcrypt for password hashing |
| **API Documentation** | OpenAPI 3.1 + Swagger UI | — | Auto-generated from route definitions |
| **CDN** | AWS CloudFront | — | Static React asset delivery with cache headers |
| **Reverse Proxy** | Nginx | 1.25+ | TLS termination, rate limiting, static file serving |
| **Container Runtime** | Docker | — | Application containerization |
| **Orchestration** | AWS ECS Fargate | — | Container orchestration, auto-scaling |
| **Load Balancing** | AWS ALB (Application Load Balancer) | — | Multi-AZ load distribution, health checks |
| **Secret Management** | AWS Secrets Manager | — | DB credentials, JWT signing keys, API keys |
| **Monitoring** | AWS CloudWatch + Datadog or Grafana | — | Application metrics, log aggregation, alerts |
| **Error Tracking** | Sentry | Latest | Frontend and backend error capture and alerting |
| **CI/CD** | GitHub Actions | — | Automated test, lint, build, and deploy pipeline |
| **Accessibility Testing** | axe-core (automated) + manual audit | — | WCAG 2.1 AA compliance validation in CI |
| **Input Validation** | Zod (backend + shared types) | 3.x | Schema validation for all API request bodies |
| **Full-text Search** | PostgreSQL `tsvector` + GIN index | — | Opportunity keyword search (no external search engine at MVP) |

---

### Key Dependency Decisions

| Decision | Rationale |
|----------|-----------|
| Node.js backend (not Python/Java) | TypeScript end-to-end from API client through backend; team velocity; rich NPM ecosystem for grants/gov tooling |
| PostgreSQL over MySQL | JSONB native support critical for snapshot storage and config fields; array types; row-level security; better UUID ergonomics |
| BullMQ over simple cron | PDF generation and export jobs are CPU-intensive and should not block API responses; BullMQ provides retry, priority queuing, and job progress tracking |
| React Query over Redux for server state | Grants intake is read-heavy with many derived views; React Query's cache + background refetch eliminates most boilerplate state management |
| Prisma/Drizzle ORM (not raw SQL) | Parameterized queries prevent SQL injection by construction; TypeScript inference from schema reduces runtime type errors |
| GrantFlow Design System v1.0 over raw USWDS | USWDS provides accessibility foundations but lacks grants-specific operational patterns (work queues, stat cards, readiness dashboards, lifecycle trackers). GrantFlow DS v1.0 builds grants-specific patterns on top of USWDS accessibility principles. CSS bundle reduced 97% (570KB → 15KB). All `usa-*` classes replaced with `gf-*` across 51 components. |
| PostgreSQL full-text search (not Elasticsearch) | MVP scale does not require distributed search; Postgres FTS handles keyword search adequately; eliminates operational overhead |
---

## 8. Integration Points

### MVP Integrations (Manual / Assisted)

| Integration | Approach | Status |
|-------------|----------|--------|
| UEI / SAM.gov lookup | Manual entry with assisted validation (format check only); no live API call | MVP |
| Assistance Listing Number | Manual entry with format validation (`XX.XXX`); no CFDA API integration | MVP |
| Email notifications | AWS SES or SendGrid transactional email API | MVP |
| File storage | AWS S3 or S3-compatible storage; pre-signed URLs for secure file access | MVP |

---

### Phase 2 Integrations (Planned)

| Integration | Description | Trigger |
|-------------|-------------|---------|
| SAM.gov API | Live UEI validation and SAM registration status lookup; replace manual entry with API-verified data | Phase 2 |
| External opportunity feeds | Inbound opportunity data from external funder portals or data standards | Phase 2 |
| SSO / SAML / OIDC | Federal agency SSO providers (Login.gov, MAX.gov, agency SAML IdPs) | Phase 2 |

---

### Phase 3 Integrations (Deferred)

| Integration | Description |
|-------------|-------------|
| Grants.gov System-to-System (S2S) | Machine-to-machine opportunity submission and status sync with federal Grants.gov portal |
| Common Data Standard exports | Structured opportunity and application data exports aligned with Open Opportunity Data standard |
| Full cross-funder universal applicant profile | Federated organization profile network across multiple funders |

---

### Internal Integration Points

| Service | Consumed By | Protocol |
|---------|-------------|----------|
| Object Storage (S3) | Submission Service (PDF/JSON package storage), Organization Service (org document storage), Application Service (attachment storage), Analytics Service (export file storage) | AWS SDK (HTTPS) |
| Redis | Auth Service (refresh token store), BullMQ job queue, session cache | Redis protocol (TLS) |
| Email Provider (SES/SendGrid) | Analytics & Notification Service | HTTPS REST API |
| BullMQ Worker | PDF generation job, JSON package generation job, export job, deadline notification job | Internal Redis queue |
| PostgreSQL Read Replica | Analytics Service (dashboard queries), Search (opportunity listing) | PostgreSQL protocol (TLS) |

---

### Notification Delivery Architecture

```
Event (e.g., APPLICATION_SUBMITTED)
    │
    ▼
Notification Service creates notification_records (in_app channel)
    │
    ▼
BullMQ email job enqueued
    │
    ▼
Email Worker processes job → AWS SES / SendGrid API call
    │
    ├── Success → notification_records.delivery_status = 'delivered'
    └── Failure → retry up to 3x with exponential backoff
                  → after 3 failures: delivery_status = 'failed', alert to ops
```

---

### File Storage Architecture

All file I/O uses pre-signed URLs to avoid proxying large files through the API server:

```
Upload flow:
  1. Client requests upload URL: POST /api/v1/attachments/upload-url
  2. API generates S3 pre-signed PUT URL (15-min TTL)
  3. Client uploads file directly to S3 via pre-signed URL
  4. Client confirms upload: POST /api/v1/workspaces/{id}/sections/{id}/attachments
  5. API validates upload (file exists, size, MIME type) and records metadata

Download flow:
  1. Client requests download: GET /api/v1/workspaces/{id}/attachments/{id}/download
  2. API validates access permission (role + visibility zone)
  3. API generates S3 pre-signed GET URL (5-min TTL) and redirects
  4. Client downloads directly from S3
```

**S3 bucket structure:**
```
grants-intake-files/
├── org-documents/{org_id}/{doc_type}/{attachment_id}/{file_name}
├── application-attachments/{workspace_id}/{section_id}/{attachment_id}/{file_name}
├── submission-packages/{snapshot_id}/human-readable.pdf
├── submission-packages/{snapshot_id}/machine-readable.json
└── exports/{job_id}/{export_filename}.csv
```

---

### External API Error Handling

| Integration | Failure Mode | Fallback |
|-------------|-------------|----------|
| Email (SES/SendGrid) | API unavailable | BullMQ retry (3x); in-app notification always created regardless of email delivery |
| S3 storage | Upload failure | Return error to client with retry guidance; do not mark attachment as uploaded |
| SAM.gov API (Phase 2) | API timeout / unavailable | Fall back to manual entry with warning to user; cache last-known status for 24 hours |
| Readability scoring | Service error | Return HTTP 200 with readability indicator hidden; field remains editable (degraded gracefully) |
