# Functional Requirements Document: GrantsIntake

**Product:** GrantsIntake — Dual-Sided Grants Lifecycle Management Platform  
**Module:** Grants Intake  
**Document Type:** Functional Requirements Document (FRD)  
**Version:** 1.0 Draft  
**Date:** July 24, 2026  
**Scope Boundary:** Opportunity setup through validated application intake and handoff to review  
**Design Standard:** USWDS (https://designsystem.digital.gov/)  
**Regulatory Alignment:** 2 CFR 200.204 (NOFO), 2 CFR 200.205 (Merit Review), 2 CFR 200.206 (Risk Assessment)  
**Source PRD:** `project_specs/PRD-GrantsIntake.md` / `project_specs/ref_docs/grants_intake.pdf`

---

## Scope

This FRD specifies the functional behavior of the GrantsIntake platform's Grants Intake module. It covers all MVP requirements (F0–F63, excluding Phase 2 items F3, F15, F27, F33, F45, F64, F65) across all 11 intake stages: Program and Opportunity Setup, Eligibility and Intake Rules Configuration, Opportunity Publication and Discovery, Organization Profile and Credential Readiness, Eligibility Pre-Screening, Application Workspace, Form/Budget/Attachment Intake, Q&A/Clarifications/Addenda, Validation and Submission, Intake Queue and Administrative Screening, and Intake Analytics and Reporting.

---

## How to Read This Document

- **Feature IDs** (F0, F1…) map directly to PRD-INTAKE-001, PRD-INTAKE-002… Feature IDs are listed at each section header.
- **Error States** tables use columns: Scenario | HTTP Status | Error Code | Message.
- **API Surface** entries in feature chunks are summaries; full request/response schemas are in `Y1a–Y1d-api-*.md`.
- **Schema Surface** entries in feature chunks are bullets; full DDL is in `Y0a–Y0d-schema-*.md`.
- **Validation** rules use MUST/SHOULD/MAY (RFC 2119 style).
- **Data Zones:** Content is labeled Grantor-private, Grantee-private, or Shared to clarify visibility.

---

## Conventions

| Convention | Meaning |
|---|---|
| MUST | Mandatory; system cannot proceed without this |
| SHOULD | Strongly recommended; deviation requires justification |
| MAY | Optional; configurable |
| Grantor-private | Visible only to grantor users; not exposed to applicants |
| Grantee-private | Visible only to applicant org team; not exposed to grantors |
| Shared | Visible to both parties per status and permission rules |
| UTC | All timestamps stored and displayed in UTC |
| Immutable | Record cannot be edited, only superseded or archived |

---

## Cross-Cutting Terminology

| Term | Definition |
|---|---|
| **Grantor** | The funding organization (federal agency, state/local agency, foundation, corporate funder) that publishes opportunities |
| **Grantee / Applicant** | The organization or individual applying for grant funding |
| **Program** | A funder-defined funding stream or initiative under which one or more opportunities are published |
| **Opportunity** | A specific funding opportunity published by a grantor with defined eligibility, deadlines, forms, and funding parameters |
| **FON** | Funding Opportunity Number — unique identifier assigned to each opportunity |
| **Assistance Listing Number** | Federal catalog identifier (formerly CFDA number) required for federal opportunities under 2 CFR 200.204 |
| **UEI** | Unique Entity Identifier — SAM.gov-assigned identifier required for federal applicants |
| **SAM** | System for Award Management (SAM.gov) — federal registration system for entities receiving federal awards |
| **Application Workspace** | The applicant's private, collaborative drafting environment for a specific opportunity |
| **Submission Snapshot** | The immutable, timestamped, authoritative record of a submitted application |
| **Intake Disposition** | The administrative screening outcome assigned by a grantor intake administrator |
| **Audit Event** | A system-generated, immutable record of a user action or state change |
| **Eligibility Pre-Screen** | The questionnaire-driven workflow that determines applicant eligibility before workspace creation or submission |
| **Hard Blocker** | An eligibility rule violation that prevents workspace creation or submission |
| **Advisory Indicator** | An eligibility rule concern that warns but does not block the applicant |
| **Authorized Representative** | A user with explicit authority to certify and submit a final application |
| **Readiness Dashboard** | The applicant workspace view showing completion status, blocking errors, and submission readiness |
| **Addendum** | A grantor-published change to a published opportunity |
| **NOFO** | Notice of Funding Opportunity — the structured announcement required by 2 CFR 200.204 for federal programs |
| **USWDS** | U.S. Web Design System — the federal design system used for all applicant-facing interfaces |
| **WCAG 2.1 AA** | Web Content Accessibility Guidelines Level AA — the minimum accessibility compliance standard |

---

## Intake Status Models

### Opportunity Status
`Draft` → `Internal Review` → `Approved` → `Published` → `Modified` → `Closed` → `Archived`

### Application Status
`Not Started` → `Workspace Created` → `In Progress` → `Ready for Internal Review` → `Ready to Submit` → `Submitted` → `Intake Screening` → `Returned for Correction` → `Resubmitted` → `Accepted for Review` → `Withdrawn` → `Administratively Rejected`

### Question / Addendum Status
`Draft` → `Internal Review` → `Published` → `Superseded / Archived`

### Intake Disposition Status
`Pending Screening` → `Accepted for Review` → `Returned for Correction` → `Ineligible` → `Late` → `Duplicate` → `Withdrawn` → `Administratively Rejected`

---

## Roles and Permissions Summary

| Role | Create Opportunity | Configure Rules | Draft Application | Submit Application | Manage Q&A | Screen Intake | View Submission |
|---|---|---|---|---|---|---|---|
| Grantor Admin | Yes | Yes | No | No | Yes | Yes | Yes |
| Program Officer | Yes | Yes | No | No | Yes | Yes | Yes |
| Intake Administrator | Limited | Limited | No | No | Yes | Yes | Yes |
| Compliance Analyst | Review | Review | No | No | Review | Yes | Yes |
| Applicant Org Admin | No | No | Yes | Depends | No | No | Own org only |
| Proposal Lead | No | No | Yes | Depends | Ask questions | No | Own app only |
| Finance Contributor | No | No | Budget only | No | No | No | Own app budget only |
| External Contributor | No | No | Scoped sections | No | No | No | Scoped only |
| Authorized Representative | No | No | Review | Yes | Ask questions | No | Own app only |
| Reviewer | No | No | No | No | No | No | After intake handoff only |

---

## Notification Model (MVP)

| Notification | Recipient | Trigger |
|---|---|---|
| Opportunity published | Subscribers / applicants | Opportunity status → Published |
| Opportunity modified | Applicants with saved/started application | Addendum or date change published |
| Question answered | Applicants | Public answer posted |
| Workspace created | Applicant team | Application workspace creation |
| Deadline approaching | Applicant team | Configured days before due date |
| Missing required item | Proposal lead | Blocking validation detected |
| Ready for submission | Authorized representative | Internal checklist complete |
| Submission received | Applicant team + grantor intake admin | Final submit |
| Returned for correction | Applicant team | Grantor disposition |
| Intake accepted for review | Applicant team + reviewers | Screening complete |

---

## Master Table of Contents

| Chunk | Contents |
|---|---|
| `00-header.md` | Title, scope, conventions, terminology, TOC |
| `F00-F02-stage1a.md` | F0: Opportunity Creation; F1: Metadata Capture; F2: Plain-Language Guidance |
| `F04-F06-stage1b.md` | F4: Deadline Config; F5: Setup Validation; F6: Versioning & Audit Trail |
| `F07-F09-stage2a.md` | F7: Eligibility Rule Definition; F8: Blockers vs. Indicators; F9: Pre-Screen Questionnaires |
| `F10-F12-stage2b.md` | F10: Conditional Forms; F11: Attachment Config; F12: Admin Screening Criteria Config |
| `F13-F17-stage3.md` | F13: Portal Publication; F14: Search & Filter; F16: Public Pages & Workspaces; F17: Addenda Display |
| `F18-F23-stage4.md` | F18: Org Profile; F19: Profile Data; F20: Standard Attachments; F21: Expiration Warnings; F22: Role Assignment; F23: Profile Reuse |
| `F24-F28-stage5.md` | F24: Pre-Screen Workflow; F25: Eligibility Results; F26: Blocker Explanation; F28: Response Storage |
| `F29-F35-stage6.md` | F29: One Workspace; F30: Workspace Sections; F31: Section Ownership; F32: Private Comments; F34: Readiness Dashboard; F35: Draft Privacy |
| `F36-F42-stage7.md` | F36: Form Field Types; F37: Form Constraints; F38: Budget Capture; F39: Budget Validation; F40: Attachment Requirements; F41: Doc Versioning; F42: Submission Preview |
| `F43-F47-stage8.md` | F43: Q&A Config; F44: Public Q&A Publishing; F46: Auditable History; F47: Applicant Notifications |
| `F48-F54-stage9.md` | F48: Continuous Validation; F49: Validation Classification; F50: Submission Blocking; F51: AR Certification; F52: Snapshot & Receipt; F53: Dual-Format Package; F54: Post-Submission Lock |
| `F55-F60-stage10.md` | F55: Queue Routing; F56: Queue Display; F57: Dispositions; F58: Correction Requests; F59: Snapshot Preservation; F60: Review Routing |
| `F61-F63-stage11.md` | F61: Grantor Dashboards; F62: Applicant Dashboards; F63: Data Export |
| `Y0a-schema-core.md` | DDL: programs, opportunities, opportunity_versions, eligibility_rules |
| `Y0b-schema-org.md` | DDL: organizations, org_contacts, org_roles, org_attachments |
| `Y0c-schema-app.md` | DDL: application_workspaces, application_sections, budgets, budget_line_items, attachments |
| `Y0d-schema-submission.md` | DDL: submission_snapshots, qa_items, addenda, audit_events, intake_dispositions |
| `Y1a-api-opportunity.md` | REST API: Opportunities, Programs, Eligibility Rules, Templates |
| `Y1b-api-org.md` | REST API: Organizations, Profiles, Roles, Standard Attachments |
| `Y1c-api-application.md` | REST API: Workspaces, Sections, Budget, Attachments, Pre-Screen |
| `Y1d-api-submission.md` | REST API: Submission, Intake Queue, Dispositions, Q&A, Addenda, Export |
| `Y2-errors.md` | Cross-feature error catalog |
| `Y3-integrations.md` | External integration points |
