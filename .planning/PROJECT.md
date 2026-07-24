# GrantsIntake

## What This Is

GrantsIntake is a dual-sided grants lifecycle management platform focused on the intake module — the structured "front door" that connects grantors and applicants through the full intake process. It enables grantors to publish well-structured funding opportunities and applicants to submit complete, compliant, and high-quality applications with minimal administrative burden. The platform covers the full intake boundary: from opportunity setup through validated application submission and handoff to review, serving U.S. grant markets including federal, state/local, philanthropic, corporate, and pass-through grant programs.

## Core Value

Grantors receive better applications and applicants submit with less burden — by replacing fragmented, document-heavy intake with a structured, guided, data-driven workflow that enforces completeness, preserves auditability, and accelerates handoff from submission to review.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Stage 1 — Program and Opportunity Setup**
- [ ] PRD-INTAKE-001: Grantor can create a new funding opportunity from configurable templates
- [ ] PRD-INTAKE-002: System captures structured opportunity metadata (title, funding source, announcement type, opportunity number, funding amount/range, expected awards, key dates, eligibility summary, contact info, executive summary)
- [ ] PRD-INTAKE-003: Platform supports plain-language guidance prompts for opportunity descriptions and applicant instructions
- [ ] PRD-INTAKE-005: Grantor can configure intake windows, deadlines, pre-application deadlines, LOI deadlines, and rolling review periods
- [ ] PRD-INTAKE-006: System validates opportunity setup completeness before publication
- [ ] PRD-INTAKE-007: System versions every published opportunity and maintains audit trail of modifications and addenda

**Stage 2 — Eligibility and Intake Rules Configuration**
- [ ] PRD-INTAKE-008: Grantor can define eligibility rules by applicant type, geography, entity status, UEI/SAM requirement, nonprofit status, tribal status, state/local status, prior award status, match requirement, and program-specific criteria
- [ ] PRD-INTAKE-009: System distinguishes hard eligibility blockers from advisory fit indicators
- [ ] PRD-INTAKE-010: System supports configurable pre-screening questionnaires
- [ ] PRD-INTAKE-011: System supports conditional forms and sections based on applicant type, program, geography, funding request amount, or eligibility response
- [ ] PRD-INTAKE-012: Grantor can define required attachments and evidence by opportunity, applicant type, and application stage
- [ ] PRD-INTAKE-013: Grantor can configure administrative screening criteria used after submission

**Stage 3 — Opportunity Publication and Discovery**
- [ ] PRD-INTAKE-014: System publishes approved opportunities to applicant-facing portal
- [ ] PRD-INTAKE-015: System provides search and filtering by funder, program area, geography, eligibility type, funding amount, due date, application stage, and keyword
- [ ] PRD-INTAKE-017: System supports public opportunity pages and authenticated applicant workspaces
- [ ] PRD-INTAKE-018: System displays opportunity changes, addenda, Q&A updates, and deadline changes to applicants

**Stage 4 — Organization Profile and Credential Readiness**
- [ ] PRD-INTAKE-019: Applicant can create and maintain reusable organization profile
- [ ] PRD-INTAKE-020: Organization profile captures legal name, DBA, address, entity type, UEI, SAM status, tax status, contacts, authorized representatives, banking readiness indicator, and standard documents
- [ ] PRD-INTAKE-021: System stores reusable standard attachments (IRS determination letter, W-9, audit reports, indirect cost agreement, board roster, insurance certificate, letters of support)
- [ ] PRD-INTAKE-022: System warns applicants when credentials, documents, or registrations are expired or approaching expiration
- [ ] PRD-INTAKE-023: System supports role assignment for org admin, proposal lead, contributor, finance contributor, and authorized representative
- [ ] PRD-INTAKE-024: Applicant can reuse profile fields across applications while preserving opportunity-specific snapshots at submission

**Stage 5 — Eligibility Pre-Screening**
- [ ] PRD-INTAKE-025: System provides eligibility pre-screen workflow before workspace creation or before full submission
- [ ] PRD-INTAKE-026: System shows applicants eligibility results as eligible, likely eligible, needs attention, or ineligible
- [ ] PRD-INTAKE-027: System explains which eligibility responses caused a blocker or warning
- [ ] PRD-INTAKE-029: System stores eligibility responses as part of intake record for administrative screening

**Stage 6 — Application Workspace**
- [ ] PRD-INTAKE-030: System creates one application workspace per applicant organization per opportunity
- [ ] PRD-INTAKE-031: Workspace includes sections for org profile, eligibility, narrative, budget, workplan, performance measures, attachments, certifications, and review/submit
- [ ] PRD-INTAKE-032: System allows section ownership, due dates, internal tasks, comments, and contributor assignments
- [ ] PRD-INTAKE-033: System supports private internal applicant comments not visible to grantors
- [ ] PRD-INTAKE-035: System provides readiness dashboard showing completion status, blocking errors, warnings, required attachments, and submit-role readiness
- [ ] PRD-INTAKE-036: System supports saving drafts without exposing content to grantor until submission

**Stage 7 — Form, Budget, and Attachment Intake**
- [ ] PRD-INTAKE-037: System supports configurable forms with text, number, date, currency, picklist, checkbox, file upload, calculated fields, and repeating tables
- [ ] PRD-INTAKE-038: System supports page/character limits, required fields, conditional fields, and formatting guidance
- [ ] PRD-INTAKE-039: System supports structured budget capture with configurable categories, cost-share/match, indirect cost, budget periods, and budget justification
- [ ] PRD-INTAKE-040: System validates budget totals, match requirements, funding request ceilings, and required budget justifications
- [ ] PRD-INTAKE-041: System supports attachment requirements by application section and applicant type
- [ ] PRD-INTAKE-042: System supports document versioning and replacement history for uploaded attachments
- [ ] PRD-INTAKE-043: System generates submission package preview before final submission

**Stage 8 — Q&A, Clarifications, and Addenda**
- [ ] PRD-INTAKE-044: Grantor can configure whether applicants can submit questions during opportunity period
- [ ] PRD-INTAKE-045: Grantor can publish public Q&A responses visible to all applicants
- [ ] PRD-INTAKE-047: System maintains auditable history of questions, responses, addenda, and date changes
- [ ] PRD-INTAKE-048: System notifies applicants of published addenda, changed dates, or required application changes

**Stage 9 — Validation and Submission**
- [ ] PRD-INTAKE-049: System supports continuous validation during drafting and final validation at submission
- [ ] PRD-INTAKE-050: System classifies validation messages as informational, warning, or blocking
- [ ] PRD-INTAKE-051: System blocks submission when mandatory fields, certifications, signatures, attachments, eligibility responses, budget requirements, or authorized submitter requirements are missing
- [ ] PRD-INTAKE-052: System requires final certification by an authorized representative before submission
- [ ] PRD-INTAKE-053: System generates final immutable submission snapshot, timestamp, confirmation number, and receipt
- [ ] PRD-INTAKE-054: System preserves both human-readable and machine-readable structured data package
- [ ] PRD-INTAKE-055: System prevents post-submission edits unless application is withdrawn, reopened, or returned for correction

**Stage 10 — Intake Queue and Administrative Screening**
- [ ] PRD-INTAKE-056: System routes submitted applications into intake queue by opportunity, applicant type, region, funding track, or configured workflow
- [ ] PRD-INTAKE-057: System displays submission status, timestamp, applicant profile, eligibility results, validation summary, attachments, and requested amount
- [ ] PRD-INTAKE-058: System supports administrative screening dispositions (accepted, returned, withdrawn, ineligible, duplicate, late, administratively rejected)
- [ ] PRD-INTAKE-059: Grantor can request correction or clarification when allowed by opportunity rules
- [ ] PRD-INTAKE-060: System preserves original submission snapshots when corrections or resubmissions are requested
- [ ] PRD-INTAKE-061: System routes accepted applications to review, scoring, or risk assessment workflows

**Stage 11 — Intake Analytics and Reporting**
- [ ] PRD-INTAKE-062: System provides grantor dashboards for opportunity views, started/submitted/incomplete applications, validation errors, late submissions, and intake disposition
- [ ] PRD-INTAKE-063: System provides applicant dashboards for saved opportunities, application progress, upcoming deadlines, missing items, and submission history
- [ ] PRD-INTAKE-064: System allows export of intake data for reporting and audit purposes

### Out of Scope

- Full merit review and scoring execution — post-intake, separate module
- Award creation and acceptance — post-intake lifecycle
- Post-award reporting — outside intake boundary
- Reimbursement and payment requests — separate financial workflow
- Subrecipient monitoring after award — post-award management
- Closeout and retention beyond intake submission records — separate lifecycle stage
- Full ERP accounting integration — enterprise integration deferred
- Automated award decisioning — AI should assist, not decide
- Autonomous AI-generated application submission — human certification required
- Grants.gov System-to-System integration at MVP launch — Phase 3
- Advanced portfolio optimization — Phase 3
- Complex multi-stage subrecipient monitoring — post-award
- Full cross-funder universal applicant profile network — Phase 3

## Context

**Regulatory Environment:** The system must align with U.S. federal grant regulations including 2 CFR 200.204 (Notices of Funding Opportunities), 2 CFR 200.205 (Merit Review), 2 CFR 200.206 (Risk Assessment). Federal opportunities require specific structured metadata including agency name, opportunity title, announcement type, FON, Assistance Listing number, funding details, key dates, executive summary, and contact information.

**Design Standards:** The platform uses USWDS (U.S. Web Design System) design standards for accessibility, usability, and plain language — aligned with https://designsystem.digital.gov/. This ensures applicants with varying levels of grant-writing maturity can navigate the system.

**Market Context:** The Simpler.Grants.gov modernization initiative establishes the direction: reduce applicant burden, improve application experience, move toward simpler and more accessible grant interactions. Candid's "Demographics via Candid" initiative reflects the broader sector need to reduce repeated data collection.

**Workflow Zones:** The platform must manage three distinct data visibility zones: Grantor-private (program setup, opportunity drafts, internal rules), Grantee-private (draft application, internal comments, reusable profile), and Shared transaction (published opportunity, submitted application, Q&A, addenda, receipt).

**Key Data Objects:** Program, Opportunity, Eligibility Rule, Application Workspace, Organization Profile, Contact/User Role, Application Section, Budget, Attachment, Question/Answer, Addendum, Submission Snapshot, Intake Disposition, Audit Event.

**Reference PRD:** Full product requirements documented in `project_specs/ref_docs/grants_intake.pdf` (version 1.0 Draft, July 2026).

## Constraints

- **Regulatory**: Must support 2 CFR 200 compliance requirements for federal grant programs — eligibility logic, audit trail, and structured intake are mandatory, not optional
- **Accessibility**: USWDS design standards required — Section 508 / WCAG 2.1 AA compliance for all applicant-facing interfaces
- **Privacy**: Draft application content must remain grantee-private until submission — strict data visibility boundaries between grantor-private, grantee-private, and shared zones
- **Auditability**: All final submissions must generate immutable snapshots with timestamps, confirmation numbers, and full audit trails — 100% coverage required
- **AI Guardrails**: AI may assist (summarize, suggest, extract) but final certifications and submissions require human action — AI decisions must be labeled and non-binding
- **Scope Boundary**: Intake ends at handoff to review — post-award features are explicitly excluded from this module

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| USWDS design system | Federal accessibility standards, plain language, and usability alignment with grants.gov ecosystem | — Pending |
| MVP scope = Stages 1-11 (MVP requirements only) | Deliver complete intake boundary before Phase 2 advanced features | — Pending |
| Phase 2 deferred items | Advanced eligibility exceptions, private Q&A, internal applicant approval, applicant opportunity comparison, SAM API integration, analytics depth | — Pending |
| Structured data over document-only | Capture grant data in forms/fields/tables wherever possible — reduces review burden and enables downstream analytics | — Pending |
| Single application workspace per org per opportunity | Prevents duplicates and establishes clear ownership; configurable exception for multi-track programs | — Pending |

---
*Last updated: 2026-07-24 after initialization*
