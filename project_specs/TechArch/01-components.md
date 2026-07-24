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

| Level | Severity | Blocks Submission | USWDS Component |
|-------|----------|-------------------|-----------------|
| Informational | `info` | No | Info alert (blue) |
| Warning | `warning` | No | Warning alert (yellow) |
| Blocking | `blocking` | Yes | Error alert (red) |

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
│   ├── uswds-components/       # USWDS React wrapper components
│   │   ├── Alert/              # Blocking, warning, info alerts (USWDS Alert)
│   │   ├── Button/             # USWDS Button
│   │   ├── Form/               # USWDS Form inputs, labels, error messages
│   │   ├── Table/              # USWDS Table
│   │   └── StepIndicator/      # USWDS Step Indicator (submission progress)
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

**USWDS Integration:**
- USWDS design tokens loaded globally via CSS custom properties
- All form validation errors surface via USWDS Error Message component (`usa-error-message`)
- Eligibility blockers use USWDS Error Alert (`usa-alert--error`)
- Advisory indicators use USWDS Warning Alert (`usa-alert--warning`)
- Step Indicator tracks application section completion
- Section 508 / WCAG 2.1 AA compliance enforced via USWDS component defaults + accessibility linting in CI

**State management:**
- React Query for server state (API data fetching, caching, background refetch)
- Zustand for local UI state (workspace session, readiness dashboard state)
- WebSocket for real-time validation updates during workspace editing
