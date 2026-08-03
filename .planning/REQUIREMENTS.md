# Requirements: GrantsIntake

**Defined:** 2026-07-24
**Core Value:** Grantors receive better applications and applicants submit with less burden — by replacing fragmented, document-heavy intake with a structured, guided, data-driven workflow that enforces completeness, preserves auditability, and accelerates handoff from submission to review.

## v1 Requirements (MVP)

Requirements for the initial release. All items are from the reference PRD marked "MVP" across 11 intake stages. Preserving original PRD-INTAKE-XXX IDs.

### Stage 1 — Program and Opportunity Setup

- [ ] **PRD-INTAKE-001**: Grantor can create a new funding opportunity from configurable templates
- [ ] **PRD-INTAKE-002**: System captures structured opportunity metadata (title, funding source, announcement type, opportunity number, funding amount/range, expected number of awards, key dates, eligibility summary, contact information, executive summary)
- [ ] **PRD-INTAKE-003**: System supports plain-language guidance prompts for opportunity descriptions and applicant instructions
- [ ] **PRD-INTAKE-005**: Grantor can configure intake windows, deadlines, pre-application deadlines, letter-of-intent deadlines, and rolling review periods
- [ ] **PRD-INTAKE-006**: System validates opportunity setup completeness before publication
- [ ] **PRD-INTAKE-007**: System versions every published opportunity and maintains an audit trail of modifications and addenda

### Stage 2 — Eligibility and Intake Rules Configuration

- [ ] **PRD-INTAKE-008**: Grantor can define eligibility rules by applicant type, geography, entity status, UEI/SAM requirement, nonprofit status, tribal status, state/local status, prior award status, match requirement, and program-specific criteria
- [ ] **PRD-INTAKE-009**: System distinguishes hard eligibility blockers from advisory fit indicators
- [ ] **PRD-INTAKE-010**: System supports configurable pre-screening questionnaires
- [ ] **PRD-INTAKE-011**: System supports conditional forms and sections based on applicant type, program, geography, funding request amount, or eligibility response
- [ ] **PRD-INTAKE-012**: Grantor can define required attachments and evidence by opportunity, applicant type, and application stage
- [ ] **PRD-INTAKE-013**: Grantor can configure administrative screening criteria used after submission

### Stage 3 — Opportunity Publication and Discovery

- [ ] **PRD-INTAKE-014**: System publishes approved opportunities to an applicant-facing portal
- [ ] **PRD-INTAKE-015**: System provides search and filtering by funder, program area, geography, eligibility type, funding amount, due date, application stage, and keyword
- [ ] **PRD-INTAKE-017**: System supports public opportunity pages and authenticated applicant workspaces
- [ ] **PRD-INTAKE-018**: System displays opportunity changes, addenda, Q&A updates, and deadline changes to applicants

### Stage 4 — Organization Profile and Credential Readiness

- [ ] **PRD-INTAKE-019**: Applicant can create and maintain reusable organization profiles
- [ ] **PRD-INTAKE-020**: Organization profile captures legal name, DBA, address, entity type, UEI, SAM status, tax status, contacts, authorized representatives, banking readiness indicator, and standard documents
- [ ] **PRD-INTAKE-021**: System stores reusable standard attachments (IRS determination letter, W-9, audit reports, indirect cost agreement, board roster, insurance certificate, letters of support)
- [ ] **PRD-INTAKE-022**: System warns applicants when credentials, documents, or registrations are expired or approaching expiration (default 60-day configurable window)
- [ ] **PRD-INTAKE-023**: System supports role assignment for organization admin, proposal lead, contributor, finance contributor, and authorized representative
- [ ] **PRD-INTAKE-024**: Applicant can reuse profile fields across applications while preserving opportunity-specific snapshots at submission

### Stage 5 — Eligibility Pre-Screening

- [ ] **PRD-INTAKE-025**: System provides an eligibility pre-screen workflow before application workspace creation or before full submission, depending on opportunity configuration
- [ ] **PRD-INTAKE-026**: System shows applicants eligibility results as eligible, likely eligible, needs attention, or ineligible, with four distinct GrantFlow visual treatments (`gf-badge` variants)
- [ ] **PRD-INTAKE-027**: System explains which eligibility responses caused a blocker or warning
- [ ] **PRD-INTAKE-029**: System stores eligibility responses as part of the intake record and carries them into administrative screening

### Stage 6 — Application Workspace

- [ ] **PRD-INTAKE-030**: System creates one application workspace per applicant organization per opportunity (configurable for exceptions)
- [ ] **PRD-INTAKE-031**: Workspace includes sections for organization profile, eligibility, narrative, budget, workplan, performance measures, attachments, certifications, and review/submit
- [ ] **PRD-INTAKE-032**: System allows section ownership, due dates, internal tasks, comments, and contributor assignments
- [ ] **PRD-INTAKE-033**: System supports private internal applicant comments not visible to grantors
- [ ] **PRD-INTAKE-035**: System provides a readiness dashboard showing completion status, blocking errors, warnings, required attachments, and submit-role readiness
- [ ] **PRD-INTAKE-036**: System supports saving drafts without exposing content to the grantor until submission

### Stage 7 — Form, Budget, and Attachment Intake

- [ ] **PRD-INTAKE-037**: System supports configurable forms with text, number, date, currency, picklist, checkbox, file upload, calculated fields, and repeating tables
- [ ] **PRD-INTAKE-038**: System supports page/character limits, required fields, conditional fields, and formatting guidance
- [ ] **PRD-INTAKE-039**: System supports structured budget capture with configurable categories, cost-share/match, indirect cost, budget periods, and budget justification
- [ ] **PRD-INTAKE-040**: System validates budget totals, match requirements, funding request ceilings, and required budget justifications
- [ ] **PRD-INTAKE-041**: System supports attachment requirements by application section and applicant type
- [ ] **PRD-INTAKE-042**: System supports document versioning and replacement history for uploaded attachments
- [ ] **PRD-INTAKE-043**: System generates a submission package preview before final submission

### Stage 8 — Q&A, Clarifications, and Addenda

- [ ] **PRD-INTAKE-044**: Grantor can configure whether applicants can submit questions during an opportunity period
- [ ] **PRD-INTAKE-045**: Grantor can publish public Q&A responses visible to all applicants
- [ ] **PRD-INTAKE-047**: System maintains an auditable history of questions, responses, addenda, and date changes
- [ ] **PRD-INTAKE-048**: System notifies applicants of published addenda, changed dates, or required application changes (within 15-minute SLA)

### Stage 9 — Validation and Submission

- [ ] **PRD-INTAKE-049**: System supports continuous validation during drafting and final validation at submission
- [ ] **PRD-INTAKE-050**: System classifies validation messages as informational, warning, or blocking
- [ ] **PRD-INTAKE-051**: System blocks submission when mandatory fields, certifications, signatures, attachments, eligibility responses, budget requirements, or authorized submitter requirements are missing; includes AR concern flag (grantee-private, non-blocking)
- [ ] **PRD-INTAKE-052**: System requires final certification by an authorized representative before submission
- [ ] **PRD-INTAKE-053**: System generates a final immutable submission snapshot, timestamp, confirmation number (GI-{YEAR}-{8-digit-seq}), and receipt
- [ ] **PRD-INTAKE-054**: System preserves both human-readable application package and machine-readable structured data package
- [ ] **PRD-INTAKE-055**: System prevents post-submission edits unless the application is withdrawn, reopened, or returned for correction

### Stage 10 — Intake Queue and Administrative Screening

- [ ] **PRD-INTAKE-056**: System routes submitted applications into an intake queue by opportunity, applicant type, region, funding track, or configured workflow
- [ ] **PRD-INTAKE-057**: System displays submission status, timestamp, applicant profile, eligibility results, validation summary, attachments, and requested amount
- [ ] **PRD-INTAKE-058**: System supports administrative screening dispositions (accepted for review, returned for correction, withdrawn, ineligible, duplicate, late, administratively rejected); includes correction window expiry auto-reject with admin override capability
- [ ] **PRD-INTAKE-059**: Grantor can request correction or clarification when allowed by opportunity rules
- [ ] **PRD-INTAKE-060**: System preserves original submission snapshots when corrections or resubmissions are requested
- [ ] **PRD-INTAKE-061**: System routes accepted applications to review, scoring, or applicant risk assessment workflows

### Stage 11 — Intake Analytics and Reporting

- [ ] **PRD-INTAKE-062**: System provides grantor dashboards for opportunity views, started/submitted/incomplete applications, validation errors, late submissions, and intake disposition
- [ ] **PRD-INTAKE-063**: System provides applicant dashboards for saved opportunities, application progress, upcoming deadlines, missing items, and submission history
- [ ] **PRD-INTAKE-064**: System allows export of intake data for reporting and audit purposes

### Cross-Cutting (Added in Validation)

- [ ] **US-1.0**: Grantor portal shell with role-appropriate navigation, landing dashboard, and WCAG 2.1 AA compliance

## v2 Requirements

Deferred to Phase 2. Tracked but not in current roadmap.

### Stage 1 — Extended Opportunity Types

- **PRD-INTAKE-004**: System supports extended opportunity types: competitive, formula, rolling intake, invitation-only, continuation, renewal, and pass-through subaward

### Stage 3 — Discovery Enhancements

- **PRD-INTAKE-016**: Applicants can save opportunities, subscribe to notifications, and compare eligibility requirements

### Stage 5 — Exception Handling

- **PRD-INTAKE-028**: Grantors can decide whether ineligible applicants may still submit with an exception explanation

### Stage 6 — Internal Approval

- **PRD-INTAKE-034**: System supports applicant-side internal review and approval before final submission

### Stage 8 — Private Q&A

- **PRD-INTAKE-046**: System allows private applicant-specific clarification when configured and permitted by funder policy

### Stage 11 — Advanced Analytics

- **PRD-INTAKE-065**: System provides analytics on common validation failures and applicant burden indicators
- **PRD-INTAKE-066**: System supports portfolio-level intake analytics across funders, programs, or cycles

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full merit review and scoring execution | Post-intake lifecycle — separate module |
| Award creation and acceptance | Post-intake lifecycle — separate module |
| Post-award reporting | Outside intake boundary |
| Reimbursement and payment requests | Separate financial workflow |
| Subrecipient monitoring after award | Post-award management |
| Closeout and retention (beyond intake) | Separate lifecycle stage |
| Full ERP accounting integration | Enterprise integration deferred |
| Automated award decisioning | AI should assist, not decide |
| Autonomous AI-generated application submission | Human certification required |
| Grants.gov System-to-System integration (MVP) | Phase 3 network/interoperability |
| Advanced portfolio optimization | Phase 3 |
| Complex multi-stage subrecipient monitoring | Post-award |
| Full cross-funder universal applicant profile network | Phase 3 |
| AI-generated proposal content as core feature | MVP non-goal; assistive AI is Phase 2 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| US-1.0 | Phase 1 — Platform Foundation & Opportunity Setup | Pending |
| PRD-INTAKE-001 | Phase 1 — Platform Foundation & Opportunity Setup | Pending |
| PRD-INTAKE-002 | Phase 1 — Platform Foundation & Opportunity Setup | Pending |
| PRD-INTAKE-003 | Phase 1 — Platform Foundation & Opportunity Setup | Pending |
| PRD-INTAKE-005 | Phase 1 — Platform Foundation & Opportunity Setup | Pending |
| PRD-INTAKE-006 | Phase 1 — Platform Foundation & Opportunity Setup | Pending |
| PRD-INTAKE-007 | Phase 1 — Platform Foundation & Opportunity Setup | Pending |
| PRD-INTAKE-008 | Phase 2 — Eligibility & Intake Rules Configuration | Pending |
| PRD-INTAKE-009 | Phase 2 — Eligibility & Intake Rules Configuration | Pending |
| PRD-INTAKE-010 | Phase 2 — Eligibility & Intake Rules Configuration | Pending |
| PRD-INTAKE-011 | Phase 2 — Eligibility & Intake Rules Configuration | Pending |
| PRD-INTAKE-012 | Phase 2 — Eligibility & Intake Rules Configuration | Pending |
| PRD-INTAKE-013 | Phase 2 — Eligibility & Intake Rules Configuration | Pending |
| PRD-INTAKE-014 | Phase 2 — Eligibility & Intake Rules Configuration | Pending |
| PRD-INTAKE-015 | Phase 2 — Eligibility & Intake Rules Configuration | Pending |
| PRD-INTAKE-017 | Phase 2 — Eligibility & Intake Rules Configuration | Pending |
| PRD-INTAKE-018 | Phase 2 — Eligibility & Intake Rules Configuration | Pending |
| PRD-INTAKE-019 | Phase 3 — Organization Profile & Eligibility Pre-Screening | Pending |
| PRD-INTAKE-020 | Phase 3 — Organization Profile & Eligibility Pre-Screening | Pending |
| PRD-INTAKE-021 | Phase 3 — Organization Profile & Eligibility Pre-Screening | Pending |
| PRD-INTAKE-022 | Phase 3 — Organization Profile & Eligibility Pre-Screening | Pending |
| PRD-INTAKE-023 | Phase 3 — Organization Profile & Eligibility Pre-Screening | Pending |
| PRD-INTAKE-024 | Phase 3 — Organization Profile & Eligibility Pre-Screening | Pending |
| PRD-INTAKE-025 | Phase 3 — Organization Profile & Eligibility Pre-Screening | Pending |
| PRD-INTAKE-026 | Phase 3 — Organization Profile & Eligibility Pre-Screening | Pending |
| PRD-INTAKE-027 | Phase 3 — Organization Profile & Eligibility Pre-Screening | Pending |
| PRD-INTAKE-029 | Phase 3 — Organization Profile & Eligibility Pre-Screening | Pending |
| PRD-INTAKE-030 | Phase 4 — Application Workspace & Form Capture | Pending |
| PRD-INTAKE-031 | Phase 4 — Application Workspace & Form Capture | Pending |
| PRD-INTAKE-032 | Phase 4 — Application Workspace & Form Capture | Pending |
| PRD-INTAKE-033 | Phase 4 — Application Workspace & Form Capture | Pending |
| PRD-INTAKE-035 | Phase 4 — Application Workspace & Form Capture | Pending |
| PRD-INTAKE-036 | Phase 4 — Application Workspace & Form Capture | Pending |
| PRD-INTAKE-037 | Phase 4 — Application Workspace & Form Capture | Pending |
| PRD-INTAKE-038 | Phase 4 — Application Workspace & Form Capture | Pending |
| PRD-INTAKE-039 | Phase 4 — Application Workspace & Form Capture | Pending |
| PRD-INTAKE-040 | Phase 4 — Application Workspace & Form Capture | Pending |
| PRD-INTAKE-041 | Phase 4 — Application Workspace & Form Capture | Pending |
| PRD-INTAKE-042 | Phase 4 — Application Workspace & Form Capture | Pending |
| PRD-INTAKE-043 | Phase 4 — Application Workspace & Form Capture | Pending |
| PRD-INTAKE-044 | Phase 5 — Q&A, Submission & Validation | Pending |
| PRD-INTAKE-045 | Phase 5 — Q&A, Submission & Validation | Pending |
| PRD-INTAKE-047 | Phase 5 — Q&A, Submission & Validation | Pending |
| PRD-INTAKE-048 | Phase 5 — Q&A, Submission & Validation | Pending |
| PRD-INTAKE-049 | Phase 5 — Q&A, Submission & Validation | Pending |
| PRD-INTAKE-050 | Phase 5 — Q&A, Submission & Validation | Pending |
| PRD-INTAKE-051 | Phase 5 — Q&A, Submission & Validation | Pending |
| PRD-INTAKE-052 | Phase 5 — Q&A, Submission & Validation | Pending |
| PRD-INTAKE-053 | Phase 5 — Q&A, Submission & Validation | Pending |
| PRD-INTAKE-054 | Phase 5 — Q&A, Submission & Validation | Pending |
| PRD-INTAKE-055 | Phase 5 — Q&A, Submission & Validation | Pending |
| PRD-INTAKE-056 | Phase 6 — Intake Queue, Screening & Analytics | Pending |
| PRD-INTAKE-057 | Phase 6 — Intake Queue, Screening & Analytics | Pending |
| PRD-INTAKE-058 | Phase 6 — Intake Queue, Screening & Analytics | Pending |
| PRD-INTAKE-059 | Phase 6 — Intake Queue, Screening & Analytics | Pending |
| PRD-INTAKE-060 | Phase 6 — Intake Queue, Screening & Analytics | Pending |
| PRD-INTAKE-061 | Phase 6 — Intake Queue, Screening & Analytics | Pending |
| PRD-INTAKE-062 | Phase 6 — Intake Queue, Screening & Analytics | Pending |
| PRD-INTAKE-063 | Phase 6 — Intake Queue, Screening & Analytics | Pending |
| PRD-INTAKE-064 | Phase 6 — Intake Queue, Screening & Analytics | Pending |

**Coverage:**
- v1 requirements: 61 total (60 MVP + US-1.0 grantor shell)
- Mapped to phases: 61
- Unmapped: 0 ✓

**Phase mapping (11 PRD stages → 6 roadmap phases):**
- Phase 1: US-1.0 + Stage 1 (7 requirements)
- Phase 2: Stage 2 + Stage 3 (10 requirements)
- Phase 3: Stage 4 + Stage 5 (10 requirements)
- Phase 4: Stage 6 + Stage 7 (13 requirements)
- Phase 5: Stage 8 + Stage 9 (11 requirements)
- Phase 6: Stage 10 + Stage 11 (9 requirements)

---
*Requirements defined: 2026-07-24*
*Last updated: 2026-07-24 — Traceability updated after roadmap creation (6-phase structure)*
