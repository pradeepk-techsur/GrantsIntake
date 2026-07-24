# Requirements Traceability Matrix: GrantsIntake

**Product:** GrantsIntake — Dual-Sided Grants Lifecycle Management Platform  
**Module:** Grants Intake  
**Document Type:** Requirements Traceability Matrix (RTM)  
**Version:** 1.0 Draft  
**Date:** July 24, 2026  
**Scope:** MVP features F0–F63 (60 P0 features) across 11 intake stages  
**Phase 2 Deferred:** F3, F15, F27, F33, F45, F64, F65

---

## 1. Overview

This Requirements Traceability Matrix (RTM) provides bidirectional traceability between all GrantsIntake specification documents. It ensures every product requirement (PRD) is implemented by a functional requirement (FRD), architecturally supported by a technical component (TechArch), expressed as a deliverable user story (UserStories), and covered by a defined test case. The RTM serves as the authoritative cross-reference document for the GrantsIntake MVP release.

GrantsIntake is a dual-sided grants lifecycle management platform covering the full intake boundary from opportunity setup (Stage 1) through validated application submission and handoff to review (Stage 11). The platform serves U.S. grant markets including federal, state/local, philanthropic, corporate, and pass-through grant programs. Regulatory alignment with 2 CFR 200.204 (NOFO), 2 CFR 200.205 (Merit Review), and 2 CFR 200.206 (Risk Assessment) is a hard requirement, not optional.

Traceability in this document operates at four levels. The first level is product-to-functional traceability, which maps PRD feature IDs (F0–F63) to their corresponding functional requirement sections in the FRD, confirming that every product capability has a fully specified functional behavior. The second level is functional-to-architecture traceability, which maps FRD requirements to the TechArch components (database tables, API endpoints, and backend service boundaries) that implement them. The third level is architecture-to-story traceability, which maps TechArch implementations to the user stories that express the end-to-end value delivered. The fourth level is test coverage traceability, which maps every MVP feature to a defined test case category and expected coverage target.

The MVP scope is 60 user stories (US-1.0 through US-11.3) covering all P0 features across 11 intake stages. Six features (F3, F15, F27, F33, F45, F64, F65) are deferred to Phase 2 and are excluded from this RTM's coverage targets. All traceability entries in this document reference actual IDs extracted from the source specification documents.

---

## 2. Requirements Summary

### 2.1 PRD Feature Count by Stage

- **Stage 1 — Program and Opportunity Setup:** F0, F1, F2, F4, F5, F6 (6 MVP features; F3 deferred)
- **Stage 2 — Eligibility and Intake Rules Configuration:** F7, F8, F9, F10, F11, F12 (6 MVP features)
- **Stage 3 — Opportunity Publication and Discovery:** F13, F14, F16, F17 (4 MVP features; F15 deferred)
- **Stage 4 — Organization Profile and Credential Readiness:** F18, F19, F20, F21, F22, F23 (6 MVP features)
- **Stage 5 — Eligibility Pre-Screening:** F24, F25, F26, F28 (4 MVP features; F27 deferred)
- **Stage 6 — Application Workspace:** F29, F30, F31, F32, F34, F35 (6 MVP features; F33 deferred)
- **Stage 7 — Form, Budget, and Attachment Intake:** F36, F37, F38, F39, F40, F41, F42 (7 MVP features)
- **Stage 8 — Q&A, Clarifications, and Addenda:** F43, F44, F46, F47 (4 MVP features; F45 deferred)
- **Stage 9 — Validation and Submission:** F48, F49, F50, F51, F52, F53, F54 (7 MVP features)
- **Stage 10 — Intake Queue and Administrative Screening:** F55, F56, F57, F58, F59, F60 (6 MVP features)
- **Stage 11 — Intake Analytics and Reporting:** F61, F62, F63 (3 MVP features; F64, F65 deferred)

### 2.2 FRD Functional Requirement Coverage

- **Total FRD feature sections (MVP):** 60 feature chunks across 14 FRD chunk files (F00–F63)
- **Cross-cutting FRD sections:** Scope, Conventions, Terminology, Status Models, Roles and Permissions, Notification Model
- **Schema modules:** Y0a (core), Y0b (org), Y0c (application), Y0d (submission)
- **API modules:** Y1a (opportunity), Y1b (org), Y1c (application), Y1d (submission)
- **Error catalog:** Y2 (cross-feature)
- **Integrations:** Y3 (external)

### 2.3 TechArch Component Coverage

- **Backend service boundaries:** Auth Service, Opportunity Service, Organization Service, Application Service, Submission Service, Analytics & Notification Service
- **Database tables (core schema):** `programs`, `opportunity_templates`, `opportunities`, `opportunity_versions`, `eligibility_rules`, `prescreening_questionnaires`, `prescreening_questions`, `prescreening_options`, `attachment_requirements`, `screening_criteria`, `guidance_prompts`, `section_conditions`
- **Database tables (org schema):** `users`, `grantor_organizations`, `organizations`, `org_contacts`, `org_roles`, `org_attachments`, `grantor_roles`
- **Database tables (application schema):** `application_workspaces`, `application_sections`, `form_field_definitions`, `field_responses`, `workspace_tasks`, `workspace_comments`, `eligibility_responses`, `budgets`, `budget_line_items`, `attachments`, `certifications`
- **Database tables (submission schema):** `submission_snapshots`, `intake_queue_entries`, `intake_dispositions`, `correction_requests`, `review_handoffs`, `qa_items`, `addenda`, `audit_events`, `notification_records`, `export_jobs`
- **API endpoints:** `/api/v1/opportunities`, `/api/v1/organizations`, `/api/v1/applications`, `/api/v1/submissions`, `/api/v1/intake-queue`, `/api/v1/export`, `/api/v1/guidance`
- **Frontend applications:** `grantor-portal` (OpportunityBuilder, IntakeQueue, Analytics), `applicant-portal` (OpportunitySearch, OrgProfile, Workspace, Dashboard)

### 2.4 User Story Coverage

- **Total MVP user stories:** 60 (US-1.0 through US-11.3)
- **Grantor-side stories:** 26 (US-1.0–US-1.6, US-2.1–US-2.6, US-3.1, US-8.1–US-8.3, US-10.1–US-10.6, US-11.1, US-11.3)
- **Applicant-side stories:** 27 (US-3.2–US-3.4, US-4.1–US-4.6, US-5.1–US-5.4, US-6.1–US-6.6, US-7.1–US-7.7, US-8.4, US-9.1–US-9.2, US-11.2)
- **Cross-role stories:** 7 (US-2.4, US-6.5, US-7.7, US-9.3–US-9.7)
- **Phase 2 deferred stories:** 7 (F3, F15, F27, F33, F45, F64, F65)

### 2.5 Non-Functional Requirements

- **Accessibility:** USWDS design system; Section 508 / WCAG 2.1 AA compliance for all applicant-facing interfaces
- **Privacy / Data Visibility:** Three-zone boundary enforcement (Grantor-private, Grantee-private, Shared) at data and UI layers
- **Auditability:** 100% of final submissions generate immutable snapshots with UTC timestamps, confirmation numbers, and full audit trails
- **Regulatory Compliance:** 2 CFR 200.204 (NOFO), 2 CFR 200.205 (Merit Review), 2 CFR 200.206 (Risk Assessment)
- **Security:** Role-based access control (RBAC); authorized representative required for final submission
- **Data Integrity:** Immutable submission snapshots; post-submission edits blocked except via formal workflow
- **AI Guardrails:** AI features labeled assistive only; human action required for all certifications and submissions
- **Notifications:** In-app and email for all key intake events; addendum notifications within 15 minutes

---

## 3. Traceability Matrix

### 3.1 Stage 1: Program and Opportunity Setup

| PRD Feature ID | PRD-INTAKE ID | Feature Name | FRD Section | TechArch: DB Tables | TechArch: API Endpoint | TechArch: Service | User Story |
|---|---|---|---|---|---|---|---|
| F0 | PRD-INTAKE-001 | Opportunity Creation from Configurable Templates | FRD §F0 (F00-F02-stage1a.md) | `opportunities`, `opportunity_templates`, `audit_events` | `POST /api/v1/opportunities` | Opportunity Service | US-1.1 |
| F1 | PRD-INTAKE-002 | Structured Opportunity Metadata Capture | FRD §F1 (F00-F02-stage1a.md) | `opportunities`, `audit_events` | `PUT /api/v1/opportunities/{id}/metadata` | Opportunity Service | US-1.2 |
| F2 | PRD-INTAKE-003 | Plain-Language Guidance Prompts | FRD §F2 (F00-F02-stage1a.md) | `guidance_prompts` | `GET /api/v1/guidance/prompts`, `POST /api/v1/guidance/readability` | Opportunity Service | US-1.3 |
| F3 | PRD-INTAKE-004 | Opportunity Type Configuration *(Phase 2)* | Deferred | — | — | — | Deferred |
| F4 | PRD-INTAKE-005 | Intake Windows and Deadline Configuration | FRD §F4 (F04-F06-stage1b.md) | `opportunities`, `audit_events` | `PUT /api/v1/opportunities/{id}/deadlines` | Opportunity Service | US-1.4 |
| F5 | PRD-INTAKE-006 | Opportunity Setup Completeness Validation | FRD §F5 (F04-F06-stage1b.md) | `opportunities`, `eligibility_rules`, `attachment_requirements`, `screening_criteria` | `POST /api/v1/opportunities/{id}/validate`, `POST /api/v1/opportunities/{id}/publish` | Opportunity Service | US-1.5 |
| F6 | PRD-INTAKE-007 | Opportunity Versioning and Audit Trail | FRD §F6 (F04-F06-stage1b.md) | `opportunity_versions`, `audit_events`, `addenda` | `GET /api/v1/opportunities/{id}/versions`, `POST /api/v1/opportunities/{id}/modifications` | Opportunity Service | US-1.6 |

**Grantor Portal Shell:**

| PRD Feature ID | PRD-INTAKE ID | Feature Name | FRD Section | TechArch: DB Tables | TechArch: Service | User Story |
|---|---|---|---|---|---|---|
| Shell | F0–F63 shell | Grantor Portal Navigation and Role-Appropriate Landing | FRD §Roles and Permissions | `users`, `grantor_roles`, `grantor_organizations`, `audit_events` | Auth Service | US-1.0 |

---

### 3.2 Stage 2: Eligibility and Intake Rules Configuration

| PRD Feature ID | PRD-INTAKE ID | Feature Name | FRD Section | TechArch: DB Tables | TechArch: API Endpoint | TechArch: Service | User Story |
|---|---|---|---|---|---|---|---|
| F7 | PRD-INTAKE-008 | Eligibility Rule Definition | FRD §F7 (F07-F09-stage2a.md) | `eligibility_rules`, `audit_events` | `POST /api/v1/opportunities/{id}/eligibility-rules`, `PUT /api/v1/eligibility-rules/{rule_id}` | Opportunity Service | US-2.1 |
| F8 | PRD-INTAKE-009 | Hard Eligibility Blockers vs. Advisory Fit Indicators | FRD §F8 (F07-F09-stage2a.md) | `eligibility_rules`, `eligibility_responses` | `POST /api/v1/applications/{id}/eligibility/evaluate` | Opportunity Service, Application Service | US-2.2 |
| F9 | PRD-INTAKE-010 | Configurable Pre-Screening Questionnaires | FRD §F9 (F07-F09-stage2a.md) | `prescreening_questionnaires`, `prescreening_questions`, `prescreening_options`, `eligibility_responses` | `POST /api/v1/opportunities/{id}/prescreening` | Opportunity Service | US-2.3 |
| F10 | PRD-INTAKE-011 | Conditional Forms and Sections | FRD §F10 (F10-F12-stage2b.md) | `section_conditions`, `application_sections` | `GET /api/v1/applications/{id}/sections` | Application Service | US-2.4 |
| F11 | PRD-INTAKE-012 | Required Attachments and Evidence Configuration | FRD §F11 (F10-F12-stage2b.md) | `attachment_requirements`, `attachments` | `POST /api/v1/opportunities/{id}/attachment-requirements` | Opportunity Service | US-2.5 |
| F12 | PRD-INTAKE-013 | Administrative Screening Criteria Configuration | FRD §F12 (F10-F12-stage2b.md) | `screening_criteria` | `POST /api/v1/opportunities/{id}/screening-criteria` | Opportunity Service | US-2.6 |

---

### 3.3 Stage 3: Opportunity Publication and Discovery

| PRD Feature ID | PRD-INTAKE ID | Feature Name | FRD Section | TechArch: DB Tables | TechArch: API Endpoint | TechArch: Service | User Story |
|---|---|---|---|---|---|---|---|
| F13 | PRD-INTAKE-014 | Applicant-Facing Opportunity Portal Publication | FRD §F13 (F13-F17-stage3.md) | `opportunities`, `audit_events` | `POST /api/v1/opportunities/{id}/publish` | Opportunity Service | US-3.1 |
| F14 | PRD-INTAKE-015 | Search and Filtering | FRD §F14 (F13-F17-stage3.md) | `opportunities` (FTS index: `idx_opportunities_fts`) | `GET /api/v1/opportunities?q=&filters=` | Opportunity Service | US-3.2 |
| F15 | PRD-INTAKE-016 | Saved Opportunities, Notifications, and Comparison *(Phase 2)* | Deferred | — | — | — | Deferred |
| F16 | PRD-INTAKE-017 | Public Opportunity Pages and Authenticated Workspaces | FRD §F16 (F13-F17-stage3.md) | `opportunities`, `application_workspaces` | `GET /api/v1/opportunities/{slug}` | Opportunity Service, Application Service | US-3.3 |
| F17 | PRD-INTAKE-018 | Opportunity Changes and Addenda Display | FRD §F17 (F13-F17-stage3.md) | `addenda`, `opportunity_versions`, `notification_records` | `GET /api/v1/opportunities/{id}/addenda` | Opportunity Service, Analytics & Notification Service | US-3.4 |

---

### 3.4 Stage 4: Organization Profile and Credential Readiness

| PRD Feature ID | PRD-INTAKE ID | Feature Name | FRD Section | TechArch: DB Tables | TechArch: API Endpoint | TechArch: Service | User Story |
|---|---|---|---|---|---|---|---|
| F18 | PRD-INTAKE-019 | Reusable Organization Profile | FRD §F18 (F18-F23-stage4.md) | `organizations`, `audit_events` | `POST /api/v1/organizations`, `GET /api/v1/organizations/{id}` | Organization Service | US-4.1 |
| F19 | PRD-INTAKE-020 | Organization Profile Data Capture | FRD §F19 (F18-F23-stage4.md) | `organizations`, `org_contacts` | `PUT /api/v1/organizations/{id}` | Organization Service | US-4.2 |
| F20 | PRD-INTAKE-021 | Reusable Standard Attachments Library | FRD §F20 (F18-F23-stage4.md) | `org_attachments` | `POST /api/v1/organizations/{id}/attachments`, `GET /api/v1/organizations/{id}/attachments` | Organization Service | US-4.3 |
| F21 | PRD-INTAKE-022 | Credential Expiration Warnings | FRD §F21 (F18-F23-stage4.md) | `org_attachments` (`expiration_date`), `organizations` (`sam_expiration_date`) | `GET /api/v1/organizations/{id}/credentials/status` | Organization Service | US-4.4 |
| F22 | PRD-INTAKE-023 | Organization Role Assignment | FRD §F22 (F18-F23-stage4.md) | `org_roles`, `grantor_roles`, `users` | `POST /api/v1/organizations/{id}/roles`, `PUT /api/v1/organizations/{id}/roles/{role_id}` | Organization Service, Auth Service | US-4.5 |
| F23 | PRD-INTAKE-024 | Profile Reuse with Submission Snapshots | FRD §F23 (F18-F23-stage4.md) | `organizations`, `submission_snapshots` (`org_profile_snapshot`) | `GET /api/v1/organizations/{id}/profile-for-workspace` | Organization Service, Submission Service | US-4.6 |

---

### 3.5 Stage 5: Eligibility Pre-Screening

| PRD Feature ID | PRD-INTAKE ID | Feature Name | FRD Section | TechArch: DB Tables | TechArch: API Endpoint | TechArch: Service | User Story |
|---|---|---|---|---|---|---|---|
| F24 | PRD-INTAKE-025 | Eligibility Pre-Screen Workflow | FRD §F24 (F24-F28-stage5.md) | `prescreening_questionnaires`, `prescreening_questions`, `eligibility_responses` | `POST /api/v1/applications/{id}/prescreening/submit` | Application Service | US-5.1 |
| F25 | PRD-INTAKE-026 | Eligibility Result Display | FRD §F25 (F24-F28-stage5.md) | `eligibility_responses` (`overall_result`) | `GET /api/v1/applications/{id}/prescreening/result` | Application Service | US-5.2 |
| F26 | PRD-INTAKE-027 | Eligibility Blocker Explanation | FRD §F26 (F24-F28-stage5.md) | `eligibility_rules` (`explanation_text`), `eligibility_responses` | `GET /api/v1/applications/{id}/prescreening/result` | Application Service | US-5.3 |
| F27 | PRD-INTAKE-028 | Ineligible Applicant Exception Submission *(Phase 2)* | Deferred | — | — | — | Deferred |
| F28 | PRD-INTAKE-029 | Eligibility Response Storage | FRD §F28 (F24-F28-stage5.md) | `eligibility_responses`, `submission_snapshots` (`eligibility_snapshot`) | `GET /api/v1/intake-queue/{entry_id}/eligibility` | Application Service, Submission Service | US-5.4 |

---

### 3.6 Stage 6: Application Workspace

| PRD Feature ID | PRD-INTAKE ID | Feature Name | FRD Section | TechArch: DB Tables | TechArch: API Endpoint | TechArch: Service | User Story |
|---|---|---|---|---|---|---|---|
| F29 | PRD-INTAKE-030 | One Workspace Per Organization Per Opportunity | FRD §F29 (F29-F35-stage6.md) | `application_workspaces` (`UNIQUE(opportunity_id, org_id)`) | `POST /api/v1/applications` | Application Service | US-6.1 |
| F30 | PRD-INTAKE-031 | Structured Workspace Sections | FRD §F30 (F29-F35-stage6.md) | `application_sections` | `GET /api/v1/applications/{id}/sections` | Application Service | US-6.2 |
| F31 | PRD-INTAKE-032 | Section Ownership, Tasks, and Contributor Assignments | FRD §F31 (F29-F35-stage6.md) | `application_sections` (`owner_id`, `internal_due_date`), `workspace_tasks` | `PUT /api/v1/applications/{id}/sections/{section_id}`, `POST /api/v1/applications/{id}/tasks` | Application Service | US-6.3 |
| F32 | PRD-INTAKE-033 | Private Internal Applicant Comments | FRD §F32 (F29-F35-stage6.md) | `workspace_comments` (`visibility='internal'`) | `POST /api/v1/applications/{id}/comments` | Application Service | US-6.4 |
| F33 | PRD-INTAKE-034 | Applicant-Side Internal Review and Approval *(Phase 2)* | Deferred | — | — | — | Deferred |
| F34 | PRD-INTAKE-035 | Readiness Dashboard | FRD §F34 (F29-F35-stage6.md) | `application_sections` (`validation_status`, `validation_errors`), `application_workspaces`, `org_roles` | `GET /api/v1/applications/{id}/readiness` | Application Service | US-6.5 |
| F35 | PRD-INTAKE-036 | Draft Privacy Until Submission | FRD §F35 (F29-F35-stage6.md) | `application_workspaces` (`visibility='grantee_private'`), `WorkspaceVisibilityGuard` middleware | (enforced at middleware layer) | Application Service (Visibility Enforcement Middleware) | US-6.6 |

---

### 3.7 Stage 7: Form, Budget, and Attachment Intake

| PRD Feature ID | PRD-INTAKE ID | Feature Name | FRD Section | TechArch: DB Tables | TechArch: API Endpoint | TechArch: Service | User Story |
|---|---|---|---|---|---|---|---|
| F36 | PRD-INTAKE-037 | Configurable Form Field Types | FRD §F36 (F36-F42-stage7.md) | `form_field_definitions`, `field_responses` | `POST /api/v1/opportunities/{id}/form-fields`, `PUT /api/v1/applications/{id}/fields/{field_id}` | Opportunity Service, Application Service | US-7.1 |
| F37 | PRD-INTAKE-038 | Form Constraints and Formatting Guidance | FRD §F37 (F36-F42-stage7.md) | `form_field_definitions` (`validation_config`), `field_responses` | `PUT /api/v1/applications/{id}/fields/{field_id}` (validated by `validation_config`) | Application Service | US-7.2 |
| F38 | PRD-INTAKE-039 | Structured Budget Capture | FRD §F38 (F36-F42-stage7.md) | `budgets`, `budget_line_items` | `POST /api/v1/applications/{id}/budget/line-items`, `GET /api/v1/applications/{id}/budget` | Application Service | US-7.3 |
| F39 | PRD-INTAKE-040 | Budget Validation | FRD §F39 (F36-F42-stage7.md) | `budgets` (`validation_status`, `validation_errors`), `budget_line_items` | `POST /api/v1/applications/{id}/budget/validate` | Application Service | US-7.4 |
| F40 | PRD-INTAKE-041 | Attachment Requirements by Section and Applicant Type | FRD §F40 (F36-F42-stage7.md) | `attachment_requirements`, `attachments`, `org_attachments` | `GET /api/v1/applications/{id}/sections/{section_id}/attachments`, `POST /api/v1/applications/{id}/attachments` | Application Service | US-7.5 |
| F41 | PRD-INTAKE-042 | Attachment Document Versioning | FRD §F41 (F36-F42-stage7.md) | `attachments` (`version_number`, `is_active`), `org_attachments` (`version_number`) | `PUT /api/v1/applications/{id}/attachments/{attachment_id}` | Application Service, Organization Service | US-7.6 |
| F42 | PRD-INTAKE-043 | Submission Package Preview | FRD §F42 (F36-F42-stage7.md) | `application_workspaces`, `application_sections`, `budgets`, `attachments` | `POST /api/v1/applications/{id}/preview` | Application Service | US-7.7 |

---

### 3.8 Stage 8: Q&A, Clarifications, and Addenda

| PRD Feature ID | PRD-INTAKE ID | Feature Name | FRD Section | TechArch: DB Tables | TechArch: API Endpoint | TechArch: Service | User Story |
|---|---|---|---|---|---|---|---|
| F43 | PRD-INTAKE-044 | Grantor Q&A Configuration | FRD §F43 (F43-F47-stage8.md) | `opportunities` (`qa_config`), `qa_items` | `PUT /api/v1/opportunities/{id}/qa-config` | Opportunity Service | US-8.1 |
| F44 | PRD-INTAKE-045 | Public Q&A Response Publishing | FRD §F44 (F43-F47-stage8.md) | `qa_items` (`status='answered'`, `published_at`), `notification_records`, `addenda` | `PUT /api/v1/qa/{qa_id}/publish` | Submission Service, Analytics & Notification Service | US-8.2 |
| F45 | PRD-INTAKE-046 | Private Applicant-Specific Clarification *(Phase 2)* | Deferred | — | — | — | Deferred |
| F46 | PRD-INTAKE-047 | Auditable Q&A and Addenda History | FRD §F46 (F43-F47-stage8.md) | `qa_items`, `addenda`, `audit_events` | `GET /api/v1/opportunities/{id}/qa`, `GET /api/v1/opportunities/{id}/addenda` | Submission Service | US-8.3 |
| F47 | PRD-INTAKE-048 | Applicant Notifications for Addenda and Changes | FRD §F47 (F43-F47-stage8.md) | `notification_records`, `addenda` | (triggered server-side on addendum publish) | Analytics & Notification Service | US-8.4 |

---

### 3.9 Stage 9: Validation and Submission

| PRD Feature ID | PRD-INTAKE ID | Feature Name | FRD Section | TechArch: DB Tables | TechArch: API Endpoint | TechArch: Service | User Story |
|---|---|---|---|---|---|---|---|
| F48 | PRD-INTAKE-049 | Continuous Validation During Drafting | FRD §F48 (F48-F54-stage9.md) | `application_sections` (`validation_status`, `validation_errors`), `field_responses` | `PUT /api/v1/applications/{id}/fields/{field_id}` (triggers validation engine) | Application Service (Continuous Validation Engine) | US-9.1 |
| F49 | PRD-INTAKE-050 | Validation Message Classification | FRD §F49 (F48-F54-stage9.md) | `application_sections` (`validation_errors`: `severity: blocking|warning|info`) | `GET /api/v1/applications/{id}/readiness` | Application Service | US-9.2 |
| F50 | PRD-INTAKE-051 | Submission Blocking | FRD §F50 (F48-F54-stage9.md) | `application_workspaces` (`status`), `application_sections` (`validation_errors`), `certifications`, `attachments` | `POST /api/v1/applications/{id}/submit` (gate check) | Submission Service | US-9.3 |
| F51 | PRD-INTAKE-052 | Authorized Representative Certification | FRD §F51 (F48-F54-stage9.md) | `certifications` (`certification_text_hash` SHA-256), `audit_events` | `POST /api/v1/applications/{id}/certify` | Submission Service, Auth Service | US-9.4 |
| F52 | PRD-INTAKE-053 | Immutable Submission Snapshot and Receipt | FRD §F52 (F48-F54-stage9.md) | `submission_snapshots` (`confirmation_number: GI-{YEAR}-{8-digit-seq}`), `audit_events` | `POST /api/v1/applications/{id}/submit` → returns `confirmation_number` | Submission Service | US-9.5 |
| F53 | PRD-INTAKE-054 | Human-Readable and Machine-Readable Submission Package | FRD §F53 (F48-F54-stage9.md) | `submission_snapshots` (`human_readable_pdf_path`, `machine_readable_json_path`), S3 Object Storage | `GET /api/v1/submissions/{snapshot_id}/download?format=pdf|json` | Submission Service (Background Worker) | US-9.6 |
| F54 | PRD-INTAKE-055 | Post-Submission Edit Prevention | FRD §F54 (F48-F54-stage9.md) | `application_workspaces` (`is_locked=true`, `visibility='shared'`), `application_sections` (`is_locked=true`), `audit_events` | (enforced on all `PUT`/`PATCH` to locked workspace) | Application Service, Submission Service | US-9.7 |

---

### 3.10 Stage 10: Intake Queue and Administrative Screening

| PRD Feature ID | PRD-INTAKE ID | Feature Name | FRD Section | TechArch: DB Tables | TechArch: API Endpoint | TechArch: Service | User Story |
|---|---|---|---|---|---|---|---|
| F55 | PRD-INTAKE-056 | Intake Queue Routing | FRD §F55 (F55-F60-stage10.md) | `intake_queue_entries`, `audit_events` (`SUBMISSION_RECEIVED`) | `GET /api/v1/intake-queue` | Submission Service | US-10.1 |
| F56 | PRD-INTAKE-057 | Intake Queue Display | FRD §F56 (F55-F60-stage10.md) | `intake_queue_entries`, `submission_snapshots`, `organizations`, `eligibility_responses`, `attachments` | `GET /api/v1/intake-queue/{entry_id}` | Submission Service | US-10.2 |
| F57 | PRD-INTAKE-058 | Administrative Screening Dispositions | FRD §F57 (F55-F60-stage10.md) | `intake_dispositions`, `intake_queue_entries`, `audit_events`, `notification_records` | `POST /api/v1/intake-queue/{entry_id}/disposition` | Submission Service, Analytics & Notification Service | US-10.3 |
| F58 | PRD-INTAKE-059 | Correction and Clarification Requests | FRD §F58 (F55-F60-stage10.md) | `correction_requests`, `intake_queue_entries`, `notification_records`, `audit_events` (`CORRECTION_WINDOW_EXPIRED`) | `POST /api/v1/intake-queue/{entry_id}/correction-request` | Submission Service, Analytics & Notification Service | US-10.4 |
| F59 | PRD-INTAKE-060 | Original Submission Snapshot Preservation on Correction | FRD §F59 (F55-F60-stage10.md) | `submission_snapshots` (`is_original`, `is_current`, `supersedes_snapshot_id`) | `POST /api/v1/applications/{id}/submit` (resubmission creates new snapshot) | Submission Service | US-10.5 |
| F60 | PRD-INTAKE-061 | Accepted Application Routing to Review | FRD §F60 (F55-F60-stage10.md) | `review_handoffs`, `audit_events` (`INTAKE_HANDOFF`) | `POST /api/v1/intake-queue/{entry_id}/handoff-to-review` | Submission Service | US-10.6 |

---

### 3.11 Stage 11: Intake Analytics and Reporting

| PRD Feature ID | PRD-INTAKE ID | Feature Name | FRD Section | TechArch: DB Tables | TechArch: API Endpoint | TechArch: Service | User Story |
|---|---|---|---|---|---|---|---|
| F61 | PRD-INTAKE-062 | Grantor Intake Dashboards | FRD §F61 (F61-F63-stage11.md) | `opportunities`, `application_workspaces`, `intake_dispositions`, `intake_queue_entries` | `GET /api/v1/analytics/grantor-dashboard` | Analytics & Notification Service | US-11.1 |
| F62 | PRD-INTAKE-063 | Applicant Dashboards | FRD §F62 (F61-F63-stage11.md) | `application_workspaces`, `submission_snapshots`, `opportunities` | `GET /api/v1/analytics/applicant-dashboard` | Analytics & Notification Service | US-11.2 |
| F63 | PRD-INTAKE-064 | Intake Data Export | FRD §F63 (F61-F63-stage11.md) | `export_jobs`, `submission_snapshots`, `eligibility_responses`, `intake_dispositions`, `audit_events` | `POST /api/v1/export`, `GET /api/v1/export/{job_id}/download` | Analytics & Notification Service (Background Worker) | US-11.3 |

---

## 4. Requirements Detail

### 4.1 Stage 1: Program and Opportunity Setup

**F0 — Opportunity Creation from Configurable Templates** *(PRD-INTAKE-001)*
- Grantor selects from system templates: Federal NOFO, State/Local Grant, Philanthropic RFP, Corporate Grant, Pass-Through Subaward
- Custom templates can be created from a completed/published opportunity
- Instantiation creates a `Draft` status opportunity with system-generated `opportunity_id` (UUID)
- Audit event: `OPPORTUNITY_CREATED` (timestamp, user, template reference)
- Traceability: F0 → FRD §F0 → `opportunities`, `opportunity_templates` → `POST /api/v1/opportunities` → US-1.1

**F1 — Structured Opportunity Metadata Capture** *(PRD-INTAKE-002)*
- Required fields: title, funding_source, announcement_type, opportunity_number (unique per program), funding_amount_max, eligibility_summary, executive_summary, contact_name, contact_email, program_area
- Conditional required: assistance_listing_number (format `\d{2}\.\d{3}`) when is_federal = true
- Validation: funding_amount_min ≤ max; contact_email per RFC 5322; opportunity_number unique within program
- Regulatory alignment: 2 CFR 200.204 NOFO fields
- Traceability: F1 → FRD §F1 → `opportunities` (all metadata columns) → `PUT /api/v1/opportunities/{id}/metadata` → US-1.2

**F2 — Plain-Language Guidance Prompts** *(PRD-INTAKE-003)*
- In-line guidance prompts for: executive_summary, eligibility_summary, applicant_instructions, program_description
- Readability indicator (Flesch-Kincaid grade level) — advisory only, non-blocking
- `guidance_prompts` table: field_id, prompt_text, example_text, uswds_tips
- Traceability: F2 → FRD §F2 → `guidance_prompts` → `GET /api/v1/guidance/prompts` → US-1.3

**F4 — Intake Windows and Deadline Configuration** *(PRD-INTAKE-005)*
- Required: application_open_date, application_close_date, deadline_timezone (IANA)
- Optional: pre_application_deadline, loi_deadline, loi_required, rolling_review_enabled
- Validation: open < close; pre-app deadline < open; LOI < close; dates in future at publication
- Date change on published opportunity auto-creates Addendum + triggers F47 notification
- Traceability: F4 → FRD §F4 → `opportunities` (deadline columns) → `PUT /api/v1/opportunities/{id}/deadlines` → US-1.4

**F5 — Opportunity Setup Completeness Validation** *(PRD-INTAKE-006)*
- Publication readiness checklist: metadata (F1) + deadlines (F4) + ≥1 eligibility rule (F7) + ≥1 form section + assistance_listing if federal + admin screening criteria if admin_screening_enabled
- Dry-run: `POST /api/v1/opportunities/{id}/validate` returns `is_ready`, `blockers`, `warnings`, `checklist_items`
- Publish: status transitions Draft/Approved → Published; audit event: `OPPORTUNITY_PUBLISHED`
- Traceability: F5 → FRD §F5 → reads all related tables → `POST /api/v1/opportunities/{id}/publish` → US-1.5

**F6 — Opportunity Versioning and Audit Trail** *(PRD-INTAKE-007)*
- Every post-publication modification creates new `opportunity_versions` record (version_number sequential, snapshot JSONB, delta JSONB, modification_reason required)
- Versions immutable once created; prior versions accessible in Opportunity Builder
- Removes of required NOFO fields blocked
- Traceability: F6 → FRD §F6 → `opportunity_versions`, `audit_events` → `POST /api/v1/opportunities/{id}/modifications` → US-1.6

---

### 4.2 Stage 2: Eligibility and Intake Rules Configuration

**F7 — Eligibility Rule Definition** *(PRD-INTAKE-008)*
- Rule types: applicant_type, geography, entity_status, uei_sam, nonprofit_status, tribal_status, state_local_status, prior_award_status, match_requirement, custom
- Each rule: criterion_field, operator (equals/not_equals/includes/excludes/greater_than/less_than/is_true/is_false), criterion_value, severity, explanation_text (max 500 chars), optional rule_group_id with AND/OR operator
- At least one rule required before publication (enforced by F5)
- Traceability: F7 → FRD §F7 → `eligibility_rules` → `POST /api/v1/opportunities/{id}/eligibility-rules` → US-2.1

**F8 — Hard Eligibility Blockers vs. Advisory Fit Indicators** *(PRD-INTAKE-009)*
- severity: hard_blocker (requires enforcement_point: pre_workspace or pre_submission) or advisory
- Hard blockers: USWDS Error alert (red); Advisory: USWDS Warning alert (yellow)
- All hard blockers displayed (not just first); pre_workspace blockers disable workspace creation button
- Constraint: `chk_enforcement_point` on `eligibility_rules` table
- Traceability: F8 → FRD §F8 → `eligibility_rules` (severity, enforcement_point), `eligibility_responses` → `POST /api/v1/applications/{id}/eligibility/evaluate` → US-2.2

**F9 — Configurable Pre-Screening Questionnaires** *(PRD-INTAKE-010)*
- Question types: yes_no, multiple_choice, text; each option mapped to rule + outcome (met/violated/advisory)
- Placement: pre_workspace or pre_submission (stored in `prescreening_questionnaires.placement`)
- Conditional display logic per question; grantor preview before publication
- Responses stored in `eligibility_responses`; visible in admin screening panel
- Traceability: F9 → FRD §F9 → `prescreening_questionnaires`, `prescreening_questions`, `prescreening_options` → `POST /api/v1/opportunities/{id}/prescreening` → US-2.3

**F10 — Conditional Forms and Sections** *(PRD-INTAKE-011)*
- Section-level conditions based on: applicant type, program area, geography, funding amount, eligibility response
- Real-time section show/hide; hidden sections excluded from validation
- Hidden section data preserved in DB but excluded from submission package
- Traceability: F10 → FRD §F10 → `section_conditions`, `application_sections` (`is_visible`) → `GET /api/v1/applications/{id}/sections` → US-2.4

**F11 — Required Attachments and Evidence Configuration** *(PRD-INTAKE-012)*
- `attachment_requirements`: document_type, applicant_type_scope (JSONB), stage_scope (pre_application/loi/full_application), is_required, file_format_restrictions, max_file_size_mb
- Required attachment missing → blocking error in readiness dashboard; blocks submission
- Traceability: F11 → FRD §F11 → `attachment_requirements` → `POST /api/v1/opportunities/{id}/attachment-requirements` → US-2.5

**F12 — Administrative Screening Criteria Configuration** *(PRD-INTAKE-013)*
- `screening_criteria`: criterion_text (max 500 chars), criterion_type (auto/manual), auto_criterion_key (deadline_check, completeness_check, eligibility_check, attachment_check, duplicate_check), is_required, suggested_disposition_on_failure
- Standard auto-criteria always present; custom manual criteria addable per opportunity
- Required criteria must be evaluated before disposition can be applied
- Traceability: F12 → FRD §F12 → `screening_criteria` → `POST /api/v1/opportunities/{id}/screening-criteria` → US-2.6

---

### 4.3 Stage 3: Opportunity Publication and Discovery

**F13 — Applicant-Facing Opportunity Portal Publication** *(PRD-INTAKE-014)*
- visibility: public or restricted_authenticated; public_slug auto-generated (title + FON)
- USWDS-compliant listing and detail pages; status badge: Open, Closing Soon, Closed, Not Yet Open
- Audit event: `OPPORTUNITY_PUBLISHED`
- Traceability: F13 → FRD §F13 → `opportunities` (status, public_slug, visibility) → `POST /api/v1/opportunities/{id}/publish` → US-3.1

**F14 — Search and Filtering** *(PRD-INTAKE-015)*
- Full-text search: PostgreSQL `tsvector` GIN index on title + executive_summary + eligibility_summary
- Faceted filters: funder, program_area, geography, eligibility type, funding amount range, due date range, stage
- Sort: relevance (keyword active), deadline ascending, newest posted; results default open opportunities
- Traceability: F14 → FRD §F14 → `opportunities` (`idx_opportunities_fts` GIN index) → `GET /api/v1/opportunities?q=&filters=` → US-3.2

**F16 — Public Opportunity Pages and Authenticated Workspaces** *(PRD-INTAKE-017)*
- Public page: no login required; includes metadata, deadlines, eligibility summary, Q&A, addenda, "Sign in to Apply" CTA
- Authenticated: "Start Application" (if window open) or "Continue Application" (with section %, blocking error count)
- WCAG 2.1 AA compliant; breadcrumb navigation, print-friendly, shareable URL
- Traceability: F16 → FRD §F16 → `opportunities`, `application_workspaces` → `GET /api/v1/opportunities/{slug}` → US-3.3

**F17 — Opportunity Changes and Addenda Display** *(PRD-INTAKE-018)*
- `addenda` table: addendum_type (date_change/content_change/qa_response/correction/required_application_change)
- Addenda displayed reverse-chronological with timestamps; deadline changes show before/after values
- "Updated" badge on listing card for 14 days post-addendum; addenda immutable once published
- Notifications triggered within 15 minutes via Analytics & Notification Service
- Traceability: F17 → FRD §F17 → `addenda`, `notification_records` → `GET /api/v1/opportunities/{id}/addenda` → US-3.4

---

### 4.4 Stage 4: Organization Profile and Credential Readiness

**F18 — Reusable Organization Profile** *(PRD-INTAKE-019)*
- One profile per organization; duplicate creation blocked
- `profile_completeness_pct` computed and displayed to org admin
- Audit events: `ORGANIZATION_PROFILE_CREATED`, `ORGANIZATION_PROFILE_UPDATED`
- Traceability: F18 → FRD §F18 → `organizations` → `POST /api/v1/organizations` → US-4.1

**F19 — Organization Profile Data Capture** *(PRD-INTAKE-020)*
- Required: legal_name, address, city, state (USPS 2-letter), zip, entity_type, primary_contact_name, primary_contact_email, banking_readiness
- Validated: UEI (`^[A-Za-z0-9]{12}$`), EIN (`^\d{9}$`), SAM expiration date must be future when sam_registered=true
- entity_type values: nonprofit_501c3, nonprofit_other, for_profit, government_federal/state/local, tribal, university, individual, other
- Optional: dba_name, tax_exempt_status, indirect_cost_rate, congressional_district
- Traceability: F19 → FRD §F19 → `organizations`, `org_contacts` → `PUT /api/v1/organizations/{id}` → US-4.2

**F20 — Reusable Standard Attachments Library** *(PRD-INTAKE-021)*
- `org_attachments`: document_type (irs_determination_letter, w9, audit_report, indirect_cost_agreement, board_roster, insurance_certificate, letters_of_support, other)
- Version history: new upload creates new version_number record; prior versions accessible for audit
- Stored at org level; attachable to any application section without re-uploading
- Traceability: F20 → FRD §F20 → `org_attachments` → `POST /api/v1/organizations/{id}/attachments` → US-4.3

**F21 — Credential Expiration Warnings** *(PRD-INTAKE-022)*
- Tracks: `org_attachments.expiration_date`, `organizations.sam_expiration_date`
- Status: valid | expiring_soon (within configurable window, default 60 days) | expired
- Org admin can configure warning window per credential type; warnings in org profile + workspace readiness dashboard
- Expired required credential → blocking error in readiness dashboard
- Traceability: F21 → FRD §F21 → `org_attachments` (expiration_date), `organizations` (sam_expiration_date) → `GET /api/v1/organizations/{id}/credentials/status` → US-4.4

**F22 — Organization Role Assignment** *(PRD-INTAKE-023)*
- `org_roles.roles` JSONB array: org_admin, proposal_lead, contributor, finance_contributor, authorized_representative, external_contributor
- Only authorized_representative can certify and submit; role enforced at route level + service level
- External contributors: scoped section access only; role assignment visible in readiness dashboard
- Traceability: F22 → FRD §F22 → `org_roles`, `grantor_roles` → `POST /api/v1/organizations/{id}/roles` → US-4.5

**F23 — Profile Reuse with Submission Snapshots** *(PRD-INTAKE-024)*
- Profile pre-populates application form fields at workspace creation
- At submission: `submission_snapshots.org_profile_snapshot` (JSONB) captures complete profile state
- Post-submission profile updates do not modify snapshot
- Traceability: F23 → FRD §F23 → `submission_snapshots` (org_profile_snapshot) → `GET /api/v1/organizations/{id}/profile-for-workspace` → US-4.6

---

### 4.5 Stage 5: Eligibility Pre-Screening

**F24 — Eligibility Pre-Screen Workflow** *(PRD-INTAKE-025)*
- Placement at: pre_workspace (blocks access) or pre_submission (blocks submit)
- Applicants answer all required questions; conditional question logic applies
- Results stored in `eligibility_responses` per question per org per opportunity
- Traceability: F24 → FRD §F24 → `prescreening_questions`, `eligibility_responses` → `POST /api/v1/applications/{id}/prescreening/submit` → US-5.1

**F25 — Eligibility Result Display** *(PRD-INTAKE-026)*
- Four states: Eligible (USWDS success/green), Likely Eligible (USWDS info/blue-teal), Needs Attention (USWDS warning/yellow), Ineligible (USWDS error/red)
- Semantically and visually distinct; displayed immediately after final question answered
- Stored in `eligibility_responses.overall_result`
- Traceability: F25 → FRD §F25 → `eligibility_responses` (overall_result) → `GET /api/v1/applications/{id}/prescreening/result` → US-5.2

**F26 — Eligibility Blocker Explanation** *(PRD-INTAKE-027)*
- Each triggered rule displays plain-language `explanation_text` (not rule code); identifies which response triggered it
- Link to relevant opportunity eligibility section; all triggered blockers shown (not just first)
- Advisory warnings displayed separately with distinct visual treatment
- Traceability: F26 → FRD §F26 → `eligibility_rules` (explanation_text), `eligibility_responses` → `GET /api/v1/applications/{id}/prescreening/result` → US-5.3

**F28 — Eligibility Response Storage** *(PRD-INTAKE-029)*
- All responses stored at questionnaire completion; `UNIQUE(opportunity_id, org_id, question_id)` on `eligibility_responses`
- Responses visible in admin screening panel; included in `submission_snapshots.eligibility_snapshot`
- Stored responses immutable post-submission
- Traceability: F28 → FRD §F28 → `eligibility_responses`, `submission_snapshots` (eligibility_snapshot) → `GET /api/v1/intake-queue/{entry_id}/eligibility` → US-5.4

---

### 4.6 Stage 6: Application Workspace

**F29 — One Workspace Per Organization Per Opportunity** *(PRD-INTAKE-030)*
- `UNIQUE(opportunity_id, org_id)` constraint on `application_workspaces`; bypassed when `opportunities.duplicate_allowed=true`
- Duplicate attempt returns clear error; workspace accessible to all team members with roles
- Traceability: F29 → FRD §F29 → `application_workspaces` (uq_workspace_org_opp) → `POST /api/v1/applications` → US-6.1

**F30 — Structured Workspace Sections** *(PRD-INTAKE-031)*
- section_type values: org_profile, eligibility, narrative, budget, workplan, performance_measures, attachments, certifications, review_submit, custom
- Section visibility configurable per opportunity; section completion tracked (not_started/in_progress/complete/error/locked)
- Traceability: F30 → FRD §F30 → `application_sections` → `GET /api/v1/applications/{id}/sections` → US-6.2

**F31 — Section Ownership, Tasks, and Contributor Assignments** *(PRD-INTAKE-032)*
- `application_sections`: owner_id, internal_due_date (grantee-private, not visible to grantor)
- `workspace_tasks`: task_title, assignee_id, task_due_date, status (open/complete)
- Section-level comments visible to assigned team members
- Traceability: F31 → FRD §F31 → `application_sections` (owner_id, internal_due_date), `workspace_tasks` → `PUT /api/v1/applications/{id}/sections/{section_id}` → US-6.3

**F32 — Private Internal Applicant Comments** *(PRD-INTAKE-033)*
- `workspace_comments.visibility = 'internal'`; enforced at router layer (403 for grantor roles)
- Not included in submission snapshot or grantor intake queue view
- Max 5000 chars per comment; all in grantee-private data zone
- Traceability: F32 → FRD §F32 → `workspace_comments` → `POST /api/v1/applications/{id}/comments` → US-6.4

**F34 — Readiness Dashboard** *(PRD-INTAKE-035)*
- Aggregates: overall completion %, blocking errors list with links, warnings, informational items, required attachment status, authorized_representative role assignment status
- Real-time updates via WebSocket to active workspace clients
- Traceability: F34 → FRD §F34 → `application_sections` (validation_status, validation_errors), `org_roles` → `GET /api/v1/applications/{id}/readiness` → US-6.5

**F35 — Draft Privacy Until Submission** *(PRD-INTAKE-036)*
- `application_workspaces.visibility = 'grantee_private'` until submission
- Enforced by `WorkspaceVisibilityGuard` middleware (blocks all grantor API access)
- `OpportunityDraftGuard` blocks applicant access to draft opportunities
- `DataZoneContext` middleware injects zone context into all service calls
- Traceability: F35 → FRD §F35 → `application_workspaces` (visibility), middleware layer → enforced on all endpoints → US-6.6

---

### 4.7 Stage 7: Form, Budget, and Attachment Intake

**F36 — Configurable Form Field Types** *(PRD-INTAKE-037)*
- field_type values: text, textarea, number, currency, date, picklist, multi_select, checkbox, file_upload, calculated, repeating_table
- `form_field_definitions.validation_config` JSONB: max_length, max_chars, max_words, min, max, decimal_places, allowed_values, file_formats, max_size_mb, min_date, max_date
- Grantor form builder + preview before publication; calculated fields use `formula` column
- Traceability: F36 → FRD §F36 → `form_field_definitions`, `field_responses` → `POST /api/v1/opportunities/{id}/form-fields` → US-7.1

**F37 — Form Constraints and Formatting Guidance** *(PRD-INTAKE-038)*
- Real-time character counter; required field indicators; conditional field display
- In-line help text per field (stored in `form_field_definitions.help_text`)
- Exceeding limits prevents additional input or surfaces immediate inline error
- Traceability: F37 → FRD §F37 → `form_field_definitions` (validation_config, help_text), `field_responses` → `PUT /api/v1/applications/{id}/fields/{field_id}` → US-7.2

**F38 — Structured Budget Capture** *(PRD-INTAKE-039)*
- `budgets`: budget_periods_count, total_federal_request, total_match, total_indirect, total_project_cost (all computed)
- `budget_line_items`: category (personnel/fringe/travel/equipment/supplies/contractual/indirect/other_direct/match_cash/match_in_kind), quantity, unit_cost, total_cost, fte, fringe_rate, justification_text
- Constraints: chk_total_cost_nonneg, chk_fte_range (0.001–1.000), chk_fringe_range (0–100%)
- Traceability: F38 → FRD §F38 → `budgets`, `budget_line_items` → `POST /api/v1/applications/{id}/budget/line-items` → US-7.3

**F39 — Budget Validation** *(PRD-INTAKE-040)*
- Auto-calculate totals; validate funding request vs. opportunity ceiling (blocking); enforce match requirements (blocking); require justification per configured categories (blocking)
- All budget errors in readiness dashboard with links to specific budget line/category
- Traceability: F39 → FRD §F39 → `budgets` (validation_status, validation_errors) → `POST /api/v1/applications/{id}/budget/validate` → US-7.4

**F40 — Attachment Requirements by Section and Applicant Type** *(PRD-INTAKE-041)*
- Per-section attachment enforcement; applicant-type-specific rules from `attachment_requirements.applicant_type_scope`
- Reusable org-level attachments (`source_type='library'`, `org_document_id`) vs. direct upload (`source_type='upload'`)
- Missing required attachments → blocking error in readiness dashboard; blocks submission
- Traceability: F40 → FRD §F40 → `attachment_requirements`, `attachments`, `org_attachments` → `GET /api/v1/applications/{id}/sections/{section_id}/attachments` → US-7.5

**F41 — Attachment Document Versioning** *(PRD-INTAKE-042)*
- Replacing attachment increments `version_number`; old record: `is_active=false`; new: `is_active=true`
- Prior versions accessible to applicant team; submission snapshot captures only active version
- Version history: timestamp + uploaded_by attribution per version
- Traceability: F41 → FRD §F41 → `attachments` (version_number, is_active), `org_attachments` (version_number) → `PUT /api/v1/applications/{id}/attachments/{attachment_id}` → US-7.6

**F42 — Submission Package Preview** *(PRD-INTAKE-043)*
- Generates human-readable preview of all sections, form data, budget, attachments in USWDS-styled format
- Labeled "PREVIEW — NOT SUBMITTED"; read-only; does not lock or change application status
- Grantee-private internal comments excluded from preview
- Traceability: F42 → FRD §F42 → `application_workspaces`, `application_sections`, `budgets`, `attachments` → `POST /api/v1/applications/{id}/preview` → US-7.7

---

### 4.8 Stage 8: Q&A, Clarifications, and Addenda

**F43 — Grantor Q&A Configuration** *(PRD-INTAKE-044)*
- `opportunities.qa_config` JSONB: {qa_enabled, question_window_open, question_window_close, responder_user_ids}
- Q&A status (open/closed) visible on opportunity page; applicants cannot submit outside window
- Traceability: F43 → FRD §F43 → `opportunities` (qa_config), `qa_items` → `PUT /api/v1/opportunities/{id}/qa-config` → US-8.1

**F44 — Public Q&A Response Publishing** *(PRD-INTAKE-045)*
- `qa_items`: status transitions submitted → under_review → answered; published_at, published_by recorded
- Published answers visible to all applicants; notifications within 15 minutes; creates Addendum record
- Q&A displayed chronologically with timestamps
- Traceability: F44 → FRD §F44 → `qa_items`, `addenda`, `notification_records` → `PUT /api/v1/qa/{qa_id}/publish` → US-8.2

**F46 — Auditable Q&A and Addenda History** *(PRD-INTAKE-047)*
- Complete immutable history: `qa_items`, `addenda`, `audit_events`; all with timestamps and user attribution
- No record can be deleted or edited after creation; history included in intake data exports (F63)
- Traceability: F46 → FRD §F46 → `qa_items`, `addenda`, `audit_events` → `GET /api/v1/opportunities/{id}/qa` → US-8.3

**F47 — Applicant Notifications for Addenda and Changes** *(PRD-INTAKE-048)*
- Automatic notifications within 15 minutes of addendum publication
- Deadline change notifications include old and new values; required-change notifications link to impacted section
- Only applicants with saved/started workspaces receive notifications
- Traceability: F47 → FRD §F47 → `notification_records`, `addenda` → server-side trigger on addendum publish → US-8.4

---

### 4.9 Stage 9: Validation and Submission

**F48 — Continuous Validation During Drafting** *(PRD-INTAKE-049)*
- Engine: field-level validation on save → section-level validation → update `application_sections.validation_status` and `validation_errors` JSONB → recompute readiness dashboard → WebSocket push to active clients
- Final validation gate triggered at submission attempt
- Traceability: F48 → FRD §F48 → `application_sections` (validation_status, validation_errors), `field_responses` → `PUT /api/v1/applications/{id}/fields/{field_id}` (engine trigger) → US-9.1

**F49 — Validation Message Classification** *(PRD-INTAKE-050)*
- Three tiers in `validation_errors` JSONB: `severity: blocking|warning|info`
- USWDS components: blocking = Error alert (red); warning = Warning alert (yellow); info = Info alert (blue)
- Only blocking prevents submission; all three tiers in readiness dashboard; blocking includes source link
- Traceability: F49 → FRD §F49 → `application_sections` (validation_errors with severity) → `GET /api/v1/applications/{id}/readiness` → US-9.2

**F50 — Submission Blocking** *(PRD-INTAKE-051)*
- Submit button disabled when any blocking item unresolved: mandatory fields, certifications, attachments, eligibility hard blockers, budget failures, AR role not assigned
- Final gate at `POST /api/v1/applications/{id}/submit` returns `422 SUBMISSION_BLOCKED`
- Traceability: F50 → FRD §F50 → `application_sections`, `certifications`, `attachments`, `org_roles` → `POST /api/v1/applications/{id}/submit` → US-9.3

**F51 — Authorized Representative Certification** *(PRD-INTAKE-052)*
- `certifications` table: certifying_user_id, certification_text, certification_text_hash (SHA-256), certification_timestamp
- Only `authorized_representative` role can certify; grantor-configurable certification language
- Pre-certification concern flag: AR can leave grantee-private comment on any section of preview; notifies Proposal Lead; does not change application status
- Audit event: `CERTIFICATION_COMPLETED`
- Traceability: F51 → FRD §F51 → `certifications`, `audit_events` → `POST /api/v1/applications/{id}/certify` → US-9.4

**F52 — Immutable Submission Snapshot and Receipt** *(PRD-INTAKE-053)*
- On submit: `submission_snapshots` INSERT with: confirmation_number (`GI-{YEAR}-{8-digit-seq}`), submitted_at (UTC), org_profile_snapshot, eligibility_snapshot, sections_snapshot, budget_snapshot, attachment_refs
- DB-level immutability: trigger `trg_submission_snapshots_no_update` + `trg_submission_snapshots_no_delete`
- `application_workspaces`: is_locked=true, visibility='shared'
- Audit event: `APPLICATION_SUBMITTED`; intake queue entry created
- Traceability: F52 → FRD §F52 → `submission_snapshots`, `audit_events`, `intake_queue_entries` → `POST /api/v1/applications/{id}/submit` → US-9.5

**F53 — Human-Readable and Machine-Readable Submission Package** *(PRD-INTAKE-054)*
- `submission_snapshots`: human_readable_pdf_path (S3 key), machine_readable_json_path (S3 key)
- Both generated by background worker queued at submission; both accessible in grantor intake queue
- Neither format modifiable after generation
- Traceability: F53 → FRD §F53 → `submission_snapshots` (pdf_path, json_path), S3 Object Storage → `GET /api/v1/submissions/{id}/download?format=pdf|json` → US-9.6

**F54 — Post-Submission Edit Prevention** *(PRD-INTAKE-055)*
- `application_workspaces.is_locked=true` + `application_sections.is_locked=true` on submission
- Enforced on all PUT/PATCH operations to locked workspace/sections/attachments
- Unlock only via: withdrawal, formal reopening, grantor return-for-correction
- All lock/unlock events: `WORKSPACE_LOCKED`, `WORKSPACE_UNLOCKED` audit events
- Traceability: F54 → FRD §F54 → `application_workspaces` (is_locked), `application_sections` (is_locked), `audit_events` → all PUT/PATCH endpoints (lock enforced) → US-9.7

---

### 4.10 Stage 10: Intake Queue and Administrative Screening

**F55 — Intake Queue Routing** *(PRD-INTAKE-056)*
- `intake_queue_entries` created at submission; routing by: applicant type, geographic region, funding track, custom workflow (from `opportunities.review_routing_config` JSONB)
- `routed_to` column stores queue segment; status: pending_screening
- Audit event: `SUBMISSION_RECEIVED`
- Traceability: F55 → FRD §F55 → `intake_queue_entries`, `audit_events` → `GET /api/v1/intake-queue` → US-10.1

**F56 — Intake Queue Display** *(PRD-INTAKE-057)*
- Queue entry shows: submission status + timestamp, org profile summary, eligibility result, validation summary, attachment completeness, funding amount
- Sort/filter by: submission date, org name, funding amount, eligibility result, disposition status
- Real-time updates as new submissions arrive
- Traceability: F56 → FRD §F56 → `intake_queue_entries`, `submission_snapshots`, `organizations`, `eligibility_responses`, `attachments` → `GET /api/v1/intake-queue/{entry_id}` → US-10.2

**F57 — Administrative Screening Dispositions** *(PRD-INTAKE-058)*
- `intake_dispositions`: disposition values: accepted_for_review, returned_for_correction, ineligible, late, duplicate, withdrawn, administratively_rejected
- `screening_criteria_results` JSONB: {criterion_id, criterion_text, result: pass|fail|na}
- Required criteria must be completed before disposition applied; triggers applicant notification
- Disposition history immutable in audit trail
- Traceability: F57 → FRD §F57 → `intake_dispositions`, `audit_events`, `notification_records` → `POST /api/v1/intake-queue/{entry_id}/disposition` → US-10.3

**F58 — Correction and Clarification Requests** *(PRD-INTAKE-059)*
- `correction_requests`: correction_sections (JSONB array of section_ids), correction_instructions, correction_deadline
- Auto-rejection on window expiry: application → administratively_rejected; audit event: `CORRECTION_WINDOW_EXPIRED`; admin can override with required reason
- Traceability: F58 → FRD §F58 → `correction_requests`, `intake_queue_entries`, `audit_events` → `POST /api/v1/intake-queue/{entry_id}/correction-request` → US-10.4

**F59 — Original Submission Snapshot Preservation on Correction** *(PRD-INTAKE-060)*
- `submission_snapshots`: is_original (bool), is_current (bool), supersedes_snapshot_id (FK self-ref)
- Corrected resubmission: new snapshot with `is_original=false`, `supersedes_snapshot_id` pointing to original
- Both versions accessible in intake queue; neither modifiable after creation
- Traceability: F59 → FRD §F59 → `submission_snapshots` (is_original, is_current, supersedes_snapshot_id) → `POST /api/v1/applications/{id}/submit` (resubmission) → US-10.5

**F60 — Accepted Application Routing to Review** *(PRD-INTAKE-061)*
- `review_handoffs`: review_workflow_type (merit_review/risk_assessment/scoring), assigned_reviewer_ids (JSONB)
- Routing configurable by opportunity/program via `opportunities.review_routing_config`
- Audit event: `INTAKE_HANDOFF`; reviewer access provisioned on handoff
- Traceability: F60 → FRD §F60 → `review_handoffs`, `audit_events` → `POST /api/v1/intake-queue/{entry_id}/handoff-to-review` → US-10.6

---

### 4.11 Stage 11: Intake Analytics and Reporting

**F61 — Grantor Intake Dashboards** *(PRD-INTAKE-062)*
- Opportunity views: published/active/closed; application counts: started/submitted/incomplete/late
- Validation error summary by opportunity; intake disposition summary by disposition state
- Filterable by opportunity, program, date range; real-time data
- Traceability: F61 → FRD §F61 → `opportunities`, `application_workspaces`, `intake_dispositions`, `intake_queue_entries` → `GET /api/v1/analytics/grantor-dashboard` → US-11.1

**F62 — Applicant Dashboards** *(PRD-INTAKE-063)*
- Saved/started applications with section progress + overall %; upcoming deadlines with countdown
- Missing required items with workspace links; full submission history with status + receipt access
- Personalized to logged-in user's org; no cross-org data
- Traceability: F62 → FRD §F62 → `application_workspaces`, `submission_snapshots`, `opportunities` → `GET /api/v1/analytics/applicant-dashboard` → US-11.2

**F63 — Intake Data Export** *(PRD-INTAKE-064)*
- `export_jobs`: format (csv/json), status (queued/processing/complete/failed), filters JSONB, file_path (S3 key)
- Export includes: submission metadata, eligibility results, disposition history, audit events
- Access controlled by role (compliance_analyst, intake_administrator, grantor_admin); excludes grantee-private content
- Async background job; export formats: CSV, Excel, structured JSON
- Traceability: F63 → FRD §F63 → `export_jobs`, `submission_snapshots`, `eligibility_responses`, `intake_dispositions`, `audit_events` → `POST /api/v1/export` + `GET /api/v1/export/{job_id}/download` → US-11.3

---

## 5. Test Case Coverage Matrix

### 5.1 Coverage by Feature and Stage

| Feature ID | Feature Name | User Story | Test Type | Test Cases (Planned) | Coverage Target |
|---|---|---|---|---|---|
| F0 | Opportunity Creation from Templates | US-1.1 | Unit, Integration, E2E | TEST-F0-001–005 | 100% |
| F1 | Structured Opportunity Metadata Capture | US-1.2 | Unit, Integration, E2E | TEST-F1-001–008 | 100% |
| F2 | Plain-Language Guidance Prompts | US-1.3 | Unit, UI | TEST-F2-001–004 | 100% |
| F4 | Intake Windows and Deadline Configuration | US-1.4 | Unit, Integration, E2E | TEST-F4-001–007 | 100% |
| F5 | Opportunity Setup Completeness Validation | US-1.5 | Unit, Integration, E2E | TEST-F5-001–008 | 100% |
| F6 | Opportunity Versioning and Audit Trail | US-1.6 | Unit, Integration | TEST-F6-001–006 | 100% |
| F7 | Eligibility Rule Definition | US-2.1 | Unit, Integration, E2E | TEST-F7-001–007 | 100% |
| F8 | Hard Eligibility Blockers vs. Advisory Indicators | US-2.2 | Unit, Integration, E2E | TEST-F8-001–007 | 100% |
| F9 | Configurable Pre-Screening Questionnaires | US-2.3 | Unit, Integration, E2E | TEST-F9-001–006 | 100% |
| F10 | Conditional Forms and Sections | US-2.4 | Unit, Integration, E2E | TEST-F10-001–006 | 100% |
| F11 | Required Attachments Configuration | US-2.5 | Unit, Integration, E2E | TEST-F11-001–006 | 100% |
| F12 | Administrative Screening Criteria Configuration | US-2.6 | Unit, Integration | TEST-F12-001–005 | 100% |
| F13 | Applicant-Facing Portal Publication | US-3.1 | Integration, E2E | TEST-F13-001–005 | 100% |
| F14 | Search and Filtering | US-3.2 | Unit, Integration, E2E, Performance | TEST-F14-001–007 | 100% |
| F16 | Public Pages and Authenticated Workspaces | US-3.3 | Integration, E2E, Accessibility | TEST-F16-001–006 | 100% |
| F17 | Opportunity Changes and Addenda Display | US-3.4 | Unit, Integration, E2E | TEST-F17-001–005 | 100% |
| F18 | Reusable Organization Profile | US-4.1 | Unit, Integration, E2E | TEST-F18-001–005 | 100% |
| F19 | Organization Profile Data Capture | US-4.2 | Unit, Integration, E2E | TEST-F19-001–007 | 100% |
| F20 | Reusable Standard Attachments Library | US-4.3 | Unit, Integration, E2E | TEST-F20-001–005 | 100% |
| F21 | Credential Expiration Warnings | US-4.4 | Unit, Integration, E2E | TEST-F21-001–006 | 100% |
| F22 | Organization Role Assignment | US-4.5 | Unit, Integration, E2E, Security | TEST-F22-001–007 | 100% |
| F23 | Profile Reuse with Submission Snapshots | US-4.6 | Unit, Integration | TEST-F23-001–004 | 100% |
| F24 | Eligibility Pre-Screen Workflow | US-5.1 | Unit, Integration, E2E | TEST-F24-001–005 | 100% |
| F25 | Eligibility Result Display | US-5.2 | Unit, UI, E2E, Accessibility | TEST-F25-001–006 | 100% |
| F26 | Eligibility Blocker Explanation | US-5.3 | Unit, Integration, E2E | TEST-F26-001–005 | 100% |
| F28 | Eligibility Response Storage | US-5.4 | Unit, Integration | TEST-F28-001–004 | 100% |
| F29 | One Workspace Per Org Per Opportunity | US-6.1 | Unit, Integration, E2E | TEST-F29-001–004 | 100% |
| F30 | Structured Workspace Sections | US-6.2 | Unit, Integration, E2E | TEST-F30-001–004 | 100% |
| F31 | Section Ownership, Tasks, Contributor Assignments | US-6.3 | Unit, Integration, E2E | TEST-F31-001–006 | 100% |
| F32 | Private Internal Applicant Comments | US-6.4 | Unit, Integration, Security | TEST-F32-001–005 | 100% |
| F34 | Readiness Dashboard | US-6.5 | Unit, Integration, E2E | TEST-F34-001–007 | 100% |
| F35 | Draft Privacy Until Submission | US-6.6 | Unit, Integration, Security | TEST-F35-001–006 | 100% |
| F36 | Configurable Form Field Types | US-7.1 | Unit, Integration, E2E | TEST-F36-001–009 | 100% |
| F37 | Form Constraints and Formatting Guidance | US-7.2 | Unit, Integration, E2E | TEST-F37-001–006 | 100% |
| F38 | Structured Budget Capture | US-7.3 | Unit, Integration, E2E | TEST-F38-001–007 | 100% |
| F39 | Budget Validation | US-7.4 | Unit, Integration, E2E | TEST-F39-001–006 | 100% |
| F40 | Attachment Requirements by Section/Type | US-7.5 | Unit, Integration, E2E | TEST-F40-001–006 | 100% |
| F41 | Attachment Document Versioning | US-7.6 | Unit, Integration | TEST-F41-001–005 | 100% |
| F42 | Submission Package Preview | US-7.7 | Integration, E2E | TEST-F42-001–005 | 100% |
| F43 | Grantor Q&A Configuration | US-8.1 | Unit, Integration, E2E | TEST-F43-001–005 | 100% |
| F44 | Public Q&A Response Publishing | US-8.2 | Unit, Integration, E2E | TEST-F44-001–006 | 100% |
| F46 | Auditable Q&A and Addenda History | US-8.3 | Unit, Integration | TEST-F46-001–005 | 100% |
| F47 | Applicant Notifications for Addenda/Changes | US-8.4 | Unit, Integration, E2E | TEST-F47-001–005 | 100% |
| F48 | Continuous Validation During Drafting | US-9.1 | Unit, Integration, E2E | TEST-F48-001–007 | 100% |
| F49 | Validation Message Classification | US-9.2 | Unit, UI, E2E, Accessibility | TEST-F49-001–005 | 100% |
| F50 | Submission Blocking | US-9.3 | Unit, Integration, E2E, Security | TEST-F50-001–007 | 100% |
| F51 | Authorized Representative Certification | US-9.4 | Unit, Integration, E2E, Security | TEST-F51-001–007 | 100% |
| F52 | Immutable Submission Snapshot and Receipt | US-9.5 | Unit, Integration, E2E | TEST-F52-001–006 | 100% |
| F53 | Human/Machine-Readable Submission Package | US-9.6 | Unit, Integration | TEST-F53-001–005 | 100% |
| F54 | Post-Submission Edit Prevention | US-9.7 | Unit, Integration, Security | TEST-F54-001–006 | 100% |
| F55 | Intake Queue Routing | US-10.1 | Unit, Integration, E2E | TEST-F55-001–005 | 100% |
| F56 | Intake Queue Display | US-10.2 | Integration, E2E | TEST-F56-001–006 | 100% |
| F57 | Administrative Screening Dispositions | US-10.3 | Unit, Integration, E2E | TEST-F57-001–007 | 100% |
| F58 | Correction and Clarification Requests | US-10.4 | Unit, Integration, E2E | TEST-F58-001–007 | 100% |
| F59 | Original Snapshot Preservation on Correction | US-10.5 | Unit, Integration | TEST-F59-001–005 | 100% |
| F60 | Accepted Application Routing to Review | US-10.6 | Unit, Integration, E2E | TEST-F60-001–005 | 100% |
| F61 | Grantor Intake Dashboards | US-11.1 | Integration, E2E | TEST-F61-001–005 | 100% |
| F62 | Applicant Dashboards | US-11.2 | Integration, E2E | TEST-F62-001–006 | 100% |
| F63 | Intake Data Export | US-11.3 | Unit, Integration, E2E, Security | TEST-F63-001–006 | 100% |

### 5.2 Non-Functional Test Coverage

| Requirement Category | Test Type | Test Cases (Planned) | Coverage Target |
|---|---|---|---|
| Accessibility — WCAG 2.1 AA | Automated (axe-core), Manual screen reader | TEST-NFR-A-001–010 | 100% of applicant-facing pages |
| Data Visibility Zones | Security / Integration | TEST-NFR-V-001–010 | Grantor-private, Grantee-private, Shared — all three zones verified |
| Auditability — Immutable Snapshots | Integration, DB-level | TEST-NFR-AU-001–006 | 100% of submissions; DB trigger tests for UPDATE/DELETE rejection |
| Regulatory — 2 CFR 200.204 | Integration | TEST-NFR-REG-001–005 | NOFO required fields for federal opportunities |
| RBAC / Security | Security, Unit | TEST-NFR-SEC-001–010 | All roles × all sensitive endpoints |
| Data Integrity — Immutable Audit Events | DB-level | TEST-NFR-DI-001–004 | `audit_events` trigger tests |
| Notification SLA (15 min) | Integration | TEST-NFR-NOT-001–003 | Addendum + Q&A notification delivery |
| Post-Submission Lock | Integration, Security | TEST-NFR-LOCK-001–005 | All locked-state endpoints for all roles |
| AI Guardrails | Unit, UI | TEST-NFR-AI-001–003 | AI outputs labeled advisory; no binding decisions |

### 5.3 Test Coverage Summary

| Stage | MVP Features | User Stories | Test Case Groups | Coverage Target |
|---|---|---|---|---|
| Stage 1: Program and Opportunity Setup | 6 | 7 (US-1.0–US-1.6) | TEST-F0–F6 (38 cases) | 100% |
| Stage 2: Eligibility and Intake Rules | 6 | 6 (US-2.1–US-2.6) | TEST-F7–F12 (37 cases) | 100% |
| Stage 3: Opportunity Publication | 4 | 4 (US-3.1–US-3.4) | TEST-F13–F17 (23 cases) | 100% |
| Stage 4: Organization Profile | 6 | 6 (US-4.1–US-4.6) | TEST-F18–F23 (34 cases) | 100% |
| Stage 5: Eligibility Pre-Screening | 4 | 4 (US-5.1–US-5.4) | TEST-F24–F28 (20 cases) | 100% |
| Stage 6: Application Workspace | 6 | 6 (US-6.1–US-6.6) | TEST-F29–F35 (32 cases) | 100% |
| Stage 7: Form, Budget, Attachments | 7 | 7 (US-7.1–US-7.7) | TEST-F36–F42 (43 cases) | 100% |
| Stage 8: Q&A, Clarifications, Addenda | 4 | 4 (US-8.1–US-8.4) | TEST-F43–F47 (21 cases) | 100% |
| Stage 9: Validation and Submission | 7 | 7 (US-9.1–US-9.7) | TEST-F48–F54 (43 cases) | 100% |
| Stage 10: Intake Queue and Screening | 6 | 6 (US-10.1–US-10.6) | TEST-F55–F60 (35 cases) | 100% |
| Stage 11: Analytics and Reporting | 3 | 3 (US-11.1–US-11.3) | TEST-F61–F63 (17 cases) | 100% |
| Non-Functional Requirements | — | Cross-cutting | TEST-NFR (56 cases) | 100% |
| **TOTAL** | **60 MVP** | **60 stories** | **~399 planned cases** | **100%** |

---

## 6. Bidirectional Traceability Quick Reference

### 6.1 PRD → FRD Mapping

| PRD Feature | Maps To FRD Chunk | FRD Chunk File |
|---|---|---|
| F0, F1, F2 | Stage 1a | F00-F02-stage1a.md |
| F4, F5, F6 | Stage 1b | F04-F06-stage1b.md |
| F7, F8, F9 | Stage 2a | F07-F09-stage2a.md |
| F10, F11, F12 | Stage 2b | F10-F12-stage2b.md |
| F13, F14, F16, F17 | Stage 3 | F13-F17-stage3.md |
| F18, F19, F20, F21, F22, F23 | Stage 4 | F18-F23-stage4.md |
| F24, F25, F26, F28 | Stage 5 | F24-F28-stage5.md |
| F29, F30, F31, F32, F34, F35 | Stage 6 | F29-F35-stage6.md |
| F36, F37, F38, F39, F40, F41, F42 | Stage 7 | F36-F42-stage7.md |
| F43, F44, F46, F47 | Stage 8 | F43-F47-stage8.md |
| F48, F49, F50, F51, F52, F53, F54 | Stage 9 | F48-F54-stage9.md |
| F55, F56, F57, F58, F59, F60 | Stage 10 | F55-F60-stage10.md |
| F61, F62, F63 | Stage 11 | F61-F63-stage11.md |

### 6.2 User Story → PRD Feature Reverse Map

| User Story | PRD Feature | PRD-INTAKE ID | Stage |
|---|---|---|---|
| US-1.0 | Shell | F0–F63 (grantor portal) | 1 |
| US-1.1 | F0 | PRD-INTAKE-001 | 1 |
| US-1.2 | F1 | PRD-INTAKE-002 | 1 |
| US-1.3 | F2 | PRD-INTAKE-003 | 1 |
| US-1.4 | F4 | PRD-INTAKE-005 | 1 |
| US-1.5 | F5 | PRD-INTAKE-006 | 1 |
| US-1.6 | F6 | PRD-INTAKE-007 | 1 |
| US-2.1 | F7 | PRD-INTAKE-008 | 2 |
| US-2.2 | F8 | PRD-INTAKE-009 | 2 |
| US-2.3 | F9 | PRD-INTAKE-010 | 2 |
| US-2.4 | F10 | PRD-INTAKE-011 | 2 |
| US-2.5 | F11 | PRD-INTAKE-012 | 2 |
| US-2.6 | F12 | PRD-INTAKE-013 | 2 |
| US-3.1 | F13 | PRD-INTAKE-014 | 3 |
| US-3.2 | F14 | PRD-INTAKE-015 | 3 |
| US-3.3 | F16 | PRD-INTAKE-017 | 3 |
| US-3.4 | F17 | PRD-INTAKE-018 | 3 |
| US-4.1 | F18 | PRD-INTAKE-019 | 4 |
| US-4.2 | F19 | PRD-INTAKE-020 | 4 |
| US-4.3 | F20 | PRD-INTAKE-021 | 4 |
| US-4.4 | F21 | PRD-INTAKE-022 | 4 |
| US-4.5 | F22 | PRD-INTAKE-023 | 4 |
| US-4.6 | F23 | PRD-INTAKE-024 | 4 |
| US-5.1 | F24 | PRD-INTAKE-025 | 5 |
| US-5.2 | F25 | PRD-INTAKE-026 | 5 |
| US-5.3 | F26 | PRD-INTAKE-027 | 5 |
| US-5.4 | F28 | PRD-INTAKE-029 | 5 |
| US-6.1 | F29 | PRD-INTAKE-030 | 6 |
| US-6.2 | F30 | PRD-INTAKE-031 | 6 |
| US-6.3 | F31 | PRD-INTAKE-032 | 6 |
| US-6.4 | F32 | PRD-INTAKE-033 | 6 |
| US-6.5 | F34 | PRD-INTAKE-035 | 6 |
| US-6.6 | F35 | PRD-INTAKE-036 | 6 |
| US-7.1 | F36 | PRD-INTAKE-037 | 7 |
| US-7.2 | F37 | PRD-INTAKE-038 | 7 |
| US-7.3 | F38 | PRD-INTAKE-039 | 7 |
| US-7.4 | F39 | PRD-INTAKE-040 | 7 |
| US-7.5 | F40 | PRD-INTAKE-041 | 7 |
| US-7.6 | F41 | PRD-INTAKE-042 | 7 |
| US-7.7 | F42 | PRD-INTAKE-043 | 7 |
| US-8.1 | F43 | PRD-INTAKE-044 | 8 |
| US-8.2 | F44 | PRD-INTAKE-045 | 8 |
| US-8.3 | F46 | PRD-INTAKE-047 | 8 |
| US-8.4 | F47 | PRD-INTAKE-048 | 8 |
| US-9.1 | F48 | PRD-INTAKE-049 | 9 |
| US-9.2 | F49 | PRD-INTAKE-050 | 9 |
| US-9.3 | F50 | PRD-INTAKE-051 | 9 |
| US-9.4 | F51 | PRD-INTAKE-052 | 9 |
| US-9.5 | F52 | PRD-INTAKE-053 | 9 |
| US-9.6 | F53 | PRD-INTAKE-054 | 9 |
| US-9.7 | F54 | PRD-INTAKE-055 | 9 |
| US-10.1 | F55 | PRD-INTAKE-056 | 10 |
| US-10.2 | F56 | PRD-INTAKE-057 | 10 |
| US-10.3 | F57 | PRD-INTAKE-058 | 10 |
| US-10.4 | F58 | PRD-INTAKE-059 | 10 |
| US-10.5 | F59 | PRD-INTAKE-060 | 10 |
| US-10.6 | F60 | PRD-INTAKE-061 | 10 |
| US-11.1 | F61 | PRD-INTAKE-062 | 11 |
| US-11.2 | F62 | PRD-INTAKE-063 | 11 |
| US-11.3 | F63 | PRD-INTAKE-064 | 11 |

### 6.3 TechArch Service → Features Supported

| TechArch Service | PRD Features Supported | Key DB Tables | Key API Modules |
|---|---|---|---|
| Auth Service | US-1.0, F22, F51 (RBAC enforcement) | `users`, `org_roles`, `grantor_roles` | All endpoints (JWT validation) |
| Opportunity Service | F0–F14, F16–F17, F43, F46 | `programs`, `opportunities`, `opportunity_templates`, `opportunity_versions`, `eligibility_rules`, `prescreening_questionnaires`, `prescreening_questions`, `prescreening_options`, `attachment_requirements`, `screening_criteria`, `guidance_prompts`, `section_conditions`, `addenda`, `qa_items` | Y1a-api-opportunity.md |
| Organization Service | F18–F23 | `organizations`, `org_contacts`, `org_roles`, `org_attachments`, `grantor_organizations`, `grantor_roles` | Y1b-api-org.md |
| Application Service | F24–F26, F28–F32, F34–F42, F48–F50 | `application_workspaces`, `application_sections`, `form_field_definitions`, `field_responses`, `workspace_tasks`, `workspace_comments`, `eligibility_responses`, `budgets`, `budget_line_items`, `attachments`, `certifications` | Y1c-api-application.md |
| Submission Service | F44, F46–F47, F51–F60 | `submission_snapshots`, `intake_queue_entries`, `intake_dispositions`, `correction_requests`, `review_handoffs`, `qa_items`, `addenda` | Y1d-api-submission.md |
| Analytics & Notification Service | F17, F44, F47, F61–F63 | `notification_records`, `export_jobs`, aggregated reads from all tables | Y1d-api-submission.md (export); analytics endpoints |
| Visibility Enforcement Middleware | F35 (all data zone enforcement) | Row-level visibility on `application_workspaces`, `application_sections` | Applied to all HTTP routes |
| Background Workers (PDF/Export) | F53, F63 | `submission_snapshots` (pdf_path, json_path), `export_jobs` (file_path), S3 Object Storage | Queued; not directly REST-accessible |

---

## 7. Phase 2 Deferred Features (Out of MVP RTM Scope)

The following features are explicitly deferred to Phase 2. They have no MVP user stories, no MVP test cases, and are excluded from all coverage calculations above.

| Feature ID | PRD-INTAKE ID | Feature Name | Deferral Reason |
|---|---|---|---|
| F3 | PRD-INTAKE-004 | Opportunity Type Configuration | Phase 2 — advanced opportunity taxonomy not required for core intake |
| F15 | PRD-INTAKE-016 | Saved Opportunities, Notifications, and Comparison | Phase 2 — applicant discovery enhancement |
| F27 | PRD-INTAKE-028 | Ineligible Applicant Exception Submission | Phase 2 — exception workflow adds complexity beyond MVP eligibility |
| F33 | PRD-INTAKE-034 | Applicant-Side Internal Review and Approval | Phase 2 — internal approval workflow deferred |
| F45 | PRD-INTAKE-046 | Private Applicant-Specific Clarification | Phase 2 — private Q&A channel deferred |
| F64 | PRD-INTAKE-065 | Validation Failure Analytics | Phase 2 — advanced analytics depth deferred |
| F65 | PRD-INTAKE-066 | Portfolio-Level Intake Analytics | Phase 2 — cross-program analytics deferred |

---

## 8. Change Management

| Change ID | Date | Version | Description | Changed By | Impact |
|---|---|---|---|---|---|
| CHG-001 | 2026-07-24 | 1.0 Draft | Initial RTM created; covers all 60 MVP features (F0–F63 minus Phase 2 items) | TechSur Labs | All sections |
| CHG-002 | 2026-07-24 | 1.0 Draft | US-1.0 (Grantor Portal Shell) added to scope — Wave 6 validation confirmed 60 total MVP stories | TechSur Labs | Section 1, 2.4, 6.2 |

---

## 9. RTM Validation Checklist

- [x] All 60 MVP PRD features (F0–F63, excluding F3, F15, F27, F33, F45, F64, F65) have traceability entries
- [x] All FRD sections reference actual source chunk files (stage1a–stage11, Y0a–Y1d)
- [x] All TechArch DB tables extracted from DDL in TechArch document are referenced
- [x] All API endpoints reference actual paths from TechArch §API Design and FRD API Surface entries
- [x] All TechArch service boundaries (Auth, Opportunity, Organization, Application, Submission, Analytics & Notification) mapped to features
- [x] All 60 user stories (US-1.0 through US-11.3) have reverse traceability to PRD features
- [x] 7 Phase 2 deferred features (F3, F15, F27, F33, F45, F64, F65) identified and excluded from coverage
- [x] Test cases planned for all 60 MVP features + NFR categories
- [x] Non-functional requirements (Accessibility, Privacy, Auditability, Regulatory, Security, AI Guardrails) covered in test matrix
- [x] Notification SLA (15 minutes for addendum/Q&A) reflected in test coverage
- [x] DB-level immutability triggers for `submission_snapshots` and `audit_events` referenced in coverage
- [x] Three-zone data visibility enforcement (Grantor-private, Grantee-private, Shared) traced to middleware and test coverage
- [x] Regulatory alignment (2 CFR 200.204, 200.205, 200.206) referenced in relevant feature detail entries

---

## 10. Approval

| Role | Name | Organization | Signature | Date |
|---|---|---|---|---|
| Product Owner | — | TechSur Labs | _______________ | __________ |
| Technical Lead | — | TechSur Labs | _______________ | __________ |
| QA Lead | — | TechSur Labs | _______________ | __________ |
| Compliance / Regulatory Lead | — | TechSur Labs | _______________ | __________ |
| Grantor Stakeholder Representative | — | — | _______________ | __________ |
| Applicant Stakeholder Representative | — | — | _______________ | __________ |

---

*Document generated: July 24, 2026*  
*Source documents: PRD-GrantsIntake.md (v1.0 Draft), FRD-GrantsIntake.md (v1.0 Draft), TechArch-GrantsIntake.md (v1.0 Draft), UserStories-GrantsIntake.md (v1.0 Draft), .planning/PROJECT.md*  
*Next review: Prior to MVP launch gate*
