# Product Requirements Document: GrantsIntake

**Product:** GrantsIntake — Dual-Sided Grants Lifecycle Management Platform  
**Module:** Grants Intake  
**Document Type:** Product Requirements Document (PRD)  
**Version:** 1.0 Draft  
**Date:** July 24, 2026  
**Scope Boundary:** Opportunity setup through validated application intake and handoff to review  
**Design Standard:** GrantFlow Design System v1.0 (built on USWDS accessibility foundations)  
**Reference PRD:** `project_specs/ref_docs/grants_intake.pdf` (v1.0 Draft, July 2026)

---

## 1. Executive Summary

GrantsIntake is a dual-sided grants lifecycle management platform focused on the intake module — the structured "front door" that connects grantors and applicants through the full intake process. It enables grantors to publish well-structured funding opportunities and applicants to submit complete, compliant, and high-quality applications with minimal administrative burden. The platform covers the full intake boundary from opportunity setup through validated application submission and handoff to review, serving U.S. grant markets including federal, state/local, philanthropic, corporate, and pass-through grant programs.

---

## 2. Problem Statement

The current grants intake landscape is fragmented, document-heavy, and burdensome for both sides of the transaction.

**Grantor pain points:**
- Opportunity setup is inconsistent, lacking required structure and plain-language guidance
- Eligibility rules are buried in documents rather than enforced by system logic
- Grantors receive incomplete applications that require manual rework and clarification cycles
- Intake handoff to review lacks a clean, structured, auditable record
- Administrative screening is manual and email-driven

**Applicant pain points:**
- Organizations repeatedly re-enter the same profile data across every portal and funder
- Eligibility requirements are unclear until after significant application effort
- Fatal submission errors surface at the last moment rather than continuously during drafting
- Collaboration happens across email, shared drives, and disconnected forms
- Role confusion — authorized representatives often lack clear submit authority until too late

**Shared transaction pain points:**
- No single authoritative application record with clear status, audit history, and receipts
- Q&A and addenda are managed through email without transparency or equal access
- Official submissions lack immutable, timestamped records suitable for audit and downstream review

The Simpler.Grants.gov modernization initiative, the Candid Demographics via Candid initiative, and federal regulations under 2 CFR 200 all point to the same direction: reduce applicant burden, improve application experience, move toward structured and accessible grant interactions, and preserve auditability at every step.

---

## 3. Product Vision

Create a low-burden, rules-driven, auditable grants intake experience that allows grantors to publish well-structured opportunities, allows applicants to reuse profile data and submit complete applications, and gives grant administrators a clean, validated, review-ready intake queue.

**Strategic goals:**
- Reduce grantor burden by eliminating manual setup, repetitive form building, unclear eligibility logic, and incomplete submissions
- Reduce applicant burden by eliminating duplicate profile entry, unclear requirements, last-minute validation failures, and role confusion
- Reduce shared transaction burden by creating a single authoritative application record with clear status, audit history, receipts, and downstream handoff
- Enforce completeness, preserve auditability, and accelerate handoff from submission to review

**Product principles:**
- Intake should be structured, not document-only — capture data in forms, fields, tables, and objects wherever possible
- Applicants should enter data once and reuse it across opportunities
- Validation should happen early — applicants should not discover fatal errors only at final submission
- Private work must stay private — draft application content remains grantee-private until submission
- Shared transactions must be immutable — final submissions, receipts, and official communications are preserved
- Grantors need configuration with guardrails — program-specific flexibility with strong defaults
- Accessibility and plain language matter — WCAG 2.1 AA standards, Section 508 / WCAG 2.1 AA compliance
- AI should assist, not decide — AI may summarize, extract, or suggest, but final certifications and submissions require human action

---

## 4. Technical Architecture

| Layer | Technology / Approach |
|---|---|
| Design System | GrantFlow Design System v1.0 — purpose-built for grants workflows |
| Accessibility | Section 508 / WCAG 2.1 AA compliance for all applicant-facing interfaces |
| Data Visibility Zones | Grantor-private, Grantee-private, Shared transaction — strict boundary enforcement |
| Regulatory Alignment | 2 CFR 200.204 (NOFO), 2 CFR 200.205 (Merit Review), 2 CFR 200.206 (Risk Assessment) |
| Application State | Immutable submission snapshots with timestamps, confirmation numbers, and full audit trails |
| Integrations (MVP) | Manual UEI/SAM entry with assisted lookup; external integrations deferred to Phase 2/3 |
| Integrations (Phase 2) | SAM.gov API integration, external opportunity feeds |
| Integrations (Phase 8) | Grants.gov Opportunity Search and Detail APIs — automated ingestion, normalization, save/track/import, change alerts, source attribution, version history |
| Integrations (Phase 3) | Grants.gov System-to-System connector, common data standard exports |
| AI Guardrails | AI assists only — assistive summarization, extraction, suggestions; non-binding, labeled |

**Key Data Objects:**

| Object | Description | Ownership |
|---|---|---|
| Program | Funder-defined program or funding stream | Grantor |
| Opportunity | Published or draft funding opportunity | Grantor / Shared after publication |
| Eligibility Rule | Configured rules for applicant fit and blockers | Grantor |
| Application Workspace | Applicant-private drafting environment | Grantee |
| Organization Profile | Reusable applicant entity record | Grantee |
| Contact / User Role | User identity and application permissions | Tenant / Organization |
| Application Section | Narrative, budget, attachment, certification, or form section | Grantee before submit / Shared after submit |
| Budget | Structured request and match/cost-share details | Grantee before submit / Shared after submit |
| Attachment | Uploaded evidence, documents, letters, or forms | Depends on context |
| Question / Answer | Applicant question and grantor response | Shared or grantor-private until published |
| Addendum | Published opportunity change | Grantor / Shared after publication |
| Submission Snapshot | Immutable final submitted application package | Shared |
| Intake Disposition | Administrative screening outcome | Grantor / Shared when configured |
| Audit Event | System-generated event record | System |

---

## 5. Feature Requirements

The 66 product requirements (PRD-INTAKE-001 through PRD-INTAKE-066) are organized across 11 intake stages. MVP requirements are all items marked "MVP" in the reference document. Phase 2 items are explicitly deferred. Feature IDs (F0–F65) map sequentially to PRD-INTAKE-001 through PRD-INTAKE-066.

---

### Stage 1: Program and Opportunity Setup

*Objective: Enable grantors to create structured, accessible, and configurable grant opportunities.*

---

#### F0: Opportunity Creation from Configurable Templates
*Maps to: PRD-INTAKE-001*

**Description:** Grantors can create a new funding opportunity by selecting from a library of configurable templates. Templates encode program type, required metadata fields, default sections, and common eligibility structures, reducing setup time and improving consistency across programs.

**Capabilities:**
- Create funding opportunity from a pre-built template
- Configure and save custom templates for reuse
- Template library organized by program type and grant market

**Priority:** P0 — MVP

---

#### F1: Structured Opportunity Metadata Capture
*Maps to: PRD-INTAKE-002*

**Description:** Every opportunity captures a complete set of structured metadata fields required for federal and non-federal grant programs. This ensures applicants have full information and downstream systems receive clean, searchable data.

**Capabilities:**
- Opportunity title, funding source, announcement type, opportunity number
- Funding amount and range, expected number of awards
- Key dates (open, close, pre-application, LOI, rolling period)
- Eligibility summary, contact information, executive summary
- Assistance Listing number (for federal opportunities)

**Priority:** P0 — MVP

---

#### F2: Plain-Language Guidance Prompts
*Maps to: PRD-INTAKE-003*

**Description:** The system surfaces plain-language guidance prompts to grantors when writing opportunity descriptions and applicant instructions, aligned with plain language standards and the Simpler.Grants.gov modernization direction.

**Capabilities:**
- In-line guidance prompts during opportunity description authoring
- Plain-language suggestions for applicant instructions
- GrantFlow-aligned readability indicators

**Priority:** P0 — MVP

---

#### F3: Opportunity Type Configuration *(Phase 2)*
*Maps to: PRD-INTAKE-004*

**Description:** Grantors can configure opportunity types such as competitive, formula, rolling intake, invitation-only, continuation, renewal, and pass-through subaward.

**Priority:** P2 — Deferred

---

#### F4: Intake Windows and Deadline Configuration
*Maps to: PRD-INTAKE-005*

**Description:** Grantors configure the complete timeline for an opportunity, including the primary application window, pre-application deadlines, letter-of-intent deadlines, and rolling review periods. The system enforces these dates during applicant interaction.

**Capabilities:**
- Intake window open/close dates
- Pre-application and LOI deadline configuration
- Rolling review period support
- Deadline enforcement in applicant workspace

**Priority:** P0 — MVP

---

#### F5: Opportunity Setup Completeness Validation
*Maps to: PRD-INTAKE-006*

**Description:** Before a grantor can publish an opportunity, the system validates that all required metadata, eligibility rules, and form configurations are complete. Incomplete setups are blocked from publication with clear error messaging.

**Capabilities:**
- Required metadata completeness check before publication
- Blocking errors with clear remediation guidance
- Publication readiness checklist for grantor

**Priority:** P0 — MVP

---

#### F6: Opportunity Versioning and Audit Trail
*Maps to: PRD-INTAKE-007*

**Description:** Every published opportunity is versioned. All modifications, addenda, and date changes are tracked in an immutable audit trail, preserving the history of what applicants saw at any point in time.

**Capabilities:**
- Version history for every published opportunity
- Immutable audit trail of modifications, addenda, and date changes
- Audit record attributable to grantor user action and timestamp

**Priority:** P0 — MVP

---

### Stage 2: Eligibility and Intake Rules Configuration

*Objective: Allow grantors to convert eligibility and submission requirements into enforceable system rules.*

---

#### F7: Eligibility Rule Definition
*Maps to: PRD-INTAKE-008*

**Description:** Grantors define eligibility rules that the system enforces during applicant pre-screening. Rules can be based on applicant type, geography, entity status, UEI/SAM registration, nonprofit status, tribal status, state/local status, prior award status, match requirements, and program-specific criteria.

**Capabilities:**
- Eligibility rules by applicant type, geography, entity status
- UEI/SAM requirement configuration
- Nonprofit, tribal, state/local, prior award status rules
- Match requirement and program-specific custom criteria

**Priority:** P0 — MVP

---

#### F8: Hard Eligibility Blockers vs. Advisory Fit Indicators
*Maps to: PRD-INTAKE-009*

**Description:** The system distinguishes between hard eligibility blockers — which prevent workspace creation or submission — and advisory fit indicators, which warn the applicant but do not block progress. This distinction is configured by the grantor per opportunity.

**Capabilities:**
- Configure rules as hard blocker or advisory warning
- Different UX treatment for blockers vs. warnings in applicant interface
- Blocker prevents workspace creation or submission when configured

**Priority:** P0 — MVP

---

#### F9: Configurable Pre-Screening Questionnaires
*Maps to: PRD-INTAKE-010*

**Description:** Grantors can configure pre-screening questionnaires that applicants complete before accessing the application workspace. Questions drive eligibility determinations and are stored as part of the intake record.

**Capabilities:**
- Question builder for pre-screening questionnaires
- Map questionnaire responses to eligibility rules
- Store responses in intake record for administrative screening

**Priority:** P0 — MVP

---

#### F10: Conditional Forms and Sections
*Maps to: PRD-INTAKE-011*

**Description:** The system supports conditional forms and sections that appear or hide based on applicant type, program, geography, funding request amount, or eligibility responses. This reduces irrelevant form burden for applicants.

**Capabilities:**
- Section-level conditional display logic
- Conditions based on applicant type, geography, program, funding amount, or eligibility response
- Real-time form adaptation as applicant enters data

**Priority:** P0 — MVP

---

#### F11: Required Attachments and Evidence Configuration
*Maps to: PRD-INTAKE-012*

**Description:** Grantors define which attachments and evidence documents are required for each opportunity, differentiated by applicant type and application stage. The system enforces these requirements before allowing submission.

**Capabilities:**
- Configure required attachments by opportunity, applicant type, and stage
- Stage-specific attachment rules (pre-application, LOI, full application)
- System enforces required attachment completion before submission

**Priority:** P0 — MVP

---

#### F12: Administrative Screening Criteria Configuration
*Maps to: PRD-INTAKE-013*

**Description:** Grantors configure the administrative screening criteria that intake administrators apply after submission. These criteria are codified in the system rather than living in program officer memory or email threads.

**Capabilities:**
- Configure administrative screening checklist per opportunity
- Criteria available to intake administrators in the screening panel
- Criteria linked to disposition workflow (accepted, returned, rejected)

**Priority:** P0 — MVP

---

### Stage 3: Opportunity Publication and Discovery

*Objective: Provide applicants with a clear, searchable, accessible view of available opportunities.*

---

#### F13: Applicant-Facing Opportunity Portal Publication
*Maps to: PRD-INTAKE-014*

**Description:** Approved opportunities are published to an applicant-facing portal where they are discoverable by the public or by authenticated applicants, depending on opportunity configuration. The portal is built to WCAG 2.1 AA standards.

**Capabilities:**
- Publish approved opportunities to public or authenticated portal
- GrantFlow-compliant opportunity listing and detail pages
- Opportunity preview for grantor before publication

**Priority:** P0 — MVP

---

#### F14: Search and Filtering
*Maps to: PRD-INTAKE-015*

**Description:** Applicants can search and filter opportunities by funder, program area, geography, eligibility type, funding amount range, due date, application stage, and keyword. This enables applicants to quickly identify relevant opportunities.

**Capabilities:**
- Full-text keyword search across opportunity content
- Faceted filtering by funder, program area, geography, eligibility type, funding amount, due date, and stage
- Search results sorted by relevance and deadline

**Priority:** P0 — MVP

---

#### F15: Saved Opportunities, Notifications, and Comparison *(Phase 2)*
*Maps to: PRD-INTAKE-016*

**Description:** Applicants can save opportunities, subscribe to notifications, and compare eligibility requirements across opportunities.

**Priority:** P2 — Deferred

---

#### F16: Public Opportunity Pages and Authenticated Applicant Workspaces
*Maps to: PRD-INTAKE-017*

**Description:** The system supports both public-facing opportunity pages accessible without login and authenticated applicant workspace views that provide personalized status, saved drafts, and team collaboration.

**Capabilities:**
- Public opportunity detail page (no login required)
- Authenticated workspace view with personalized application status
- Clear separation between public and authenticated experiences

**Priority:** P0 — MVP

---

#### F17: Opportunity Changes and Addenda Display
*Maps to: PRD-INTAKE-018*

**Description:** When a grantor publishes changes, addenda, Q&A updates, or deadline changes, the system displays these to all applicants in a visible, timestamped, and attributable way. Applicants with started applications receive notifications.

**Capabilities:**
- Display opportunity modifications, addenda, and Q&A updates on opportunity page
- Deadline changes prominently surfaced to applicants
- In-app notifications for applicants with started or saved applications

**Priority:** P0 — MVP

---

### Stage 4: Organization Profile and Credential Readiness

*Objective: Reduce repeated application burden by maintaining reusable applicant data.*

---

#### F18: Reusable Organization Profile
*Maps to: PRD-INTAKE-019*

**Description:** Applicant organizations create and maintain a single reusable profile that persists across all applications. Profile data flows into application forms, eliminating repeated manual entry across funder portals.

**Capabilities:**
- Create and maintain organization profile independent of any single application
- Profile persists and is reusable across all opportunities
- Profile data pre-populates application form fields

**Priority:** P0 — MVP

---

#### F19: Organization Profile Data Capture
*Maps to: PRD-INTAKE-020*

**Description:** The organization profile captures all standard fields required across federal and non-federal grant programs, including legal and operational identity, registration status, tax status, contacts, and banking readiness.

**Capabilities:**
- Legal name, DBA, address, entity type
- UEI, SAM status (where applicable), tax status
- Authorized representatives, contacts, banking readiness indicator
- Standard documents stored in profile

**Priority:** P0 — MVP

---

#### F20: Reusable Standard Attachments Library
*Maps to: PRD-INTAKE-021*

**Description:** The system stores a library of reusable standard attachments at the organization level. Applicants upload these documents once and can attach them to any application without re-uploading.

**Capabilities:**
- IRS determination letter, W-9, audit reports, indirect cost agreement
- Board roster, insurance certificate, letters of support
- Stored at org level, attachable to any application
- Version history for each stored document

**Priority:** P0 — MVP

---

#### F21: Credential Expiration Warnings
*Maps to: PRD-INTAKE-022*

**Description:** The system monitors the expiration status of credentials, documents, and registrations stored in the organization profile. Applicants are warned when items are expired or approaching expiration before they become submission blockers. The warning window is configurable per credential type by the organization administrator, defaulting to 60 days.

**Capabilities:**
- Org-admin-configurable expiration warning window per credential type (default: 60 days); applies to SAM registration, IRS letters, audit reports, insurance
- In-app warnings when credentials are expired or within the configured expiration window
- Warnings surfaced in organization profile and application workspace checklist

**Priority:** P0 — MVP

---

#### F22: Organization Role Assignment
*Maps to: PRD-INTAKE-023*

**Description:** The system supports multi-user organization teams with distinct roles and permission levels. Role assignment is managed by the organization administrator.

**Capabilities:**
- Organization admin, proposal lead, contributor, finance contributor roles
- Authorized representative role with explicit submission authority
- Role-based access enforced at section, budget, and submission levels
- External contributor / subapplicant scoped access

**Priority:** P0 — MVP

---

#### F23: Profile Reuse with Submission Snapshots
*Maps to: PRD-INTAKE-024*

**Description:** Applicants can reuse profile fields across applications while the system automatically preserves an opportunity-specific snapshot of the profile at the time of submission. This ensures the submitted record is accurate even if the profile is updated afterward.

**Capabilities:**
- Profile fields pre-populate into application forms
- Submission snapshot preserves profile state at time of submit
- Profile updates after submission do not modify the submission record

**Priority:** P0 — MVP

---

### Stage 5: Eligibility Pre-Screening

*Objective: Help applicants determine whether to proceed and help grantors reduce unqualified submissions.*

---

#### F24: Eligibility Pre-Screen Workflow
*Maps to: PRD-INTAKE-025*

**Description:** Before creating an application workspace or before final submission (depending on opportunity configuration), applicants complete an eligibility pre-screen workflow. This surfaces eligibility determinations early, before significant application effort is invested.

**Capabilities:**
- Configurable placement: before workspace creation or before submission
- Guided questionnaire driven by grantor-configured eligibility rules
- Results determine whether workspace access is granted

**Priority:** P0 — MVP

---

#### F25: Eligibility Result Display
*Maps to: PRD-INTAKE-026*

**Description:** After completing the pre-screen questionnaire, applicants receive a clear eligibility result displayed as one of four states: Eligible, Likely Eligible, Needs Attention, or Ineligible. Each state carries a **distinct visual treatment** and guidance. Likely Eligible and Needs Attention are semantically different and must not share the same visual treatment.

**Capabilities:**
- Four-state result display: Eligible, Likely Eligible, Needs Attention, Ineligible
- Distinct visual treatment per state using GrantFlow alert components (`gf-alert`): Eligible = green (success), Likely Eligible = blue/teal (info), Needs Attention = yellow (warning), Ineligible = red (error)
- Guidance on next steps for each result state

**Priority:** P0 — MVP

---

#### F26: Eligibility Blocker Explanation
*Maps to: PRD-INTAKE-027*

**Description:** When an eligibility pre-screen returns a blocker or warning, the system explains specifically which eligibility responses caused the determination. Applicants are not left guessing why they were blocked.

**Capabilities:**
- Per-response explanation of which answer triggered a blocker or warning
- Plain-language explanation text (not rule code)
- Link to relevant opportunity eligibility section for reference

**Priority:** P0 — MVP

---

#### F27: Ineligible Applicant Exception Submission *(Phase 2)*
*Maps to: PRD-INTAKE-028*

**Description:** Grantors can optionally allow ineligible applicants to submit an exception explanation and proceed with application.

**Priority:** P2 — Deferred

---

#### F28: Eligibility Response Storage
*Maps to: PRD-INTAKE-029*

**Description:** All eligibility pre-screen responses are stored as part of the intake record and carried forward into the administrative screening phase. Intake administrators can review eligibility responses alongside the submitted application without asking applicants to repeat information.

**Capabilities:**
- Eligibility responses stored in application record at time of pre-screen
- Responses visible in intake queue administrative screening panel
- Responses included in submission snapshot

**Priority:** P0 — MVP

---

### Stage 6: Application Workspace

*Objective: Provide a collaborative, structured, and controlled application preparation environment.*

---

#### F29: One Workspace Per Organization Per Opportunity
*Maps to: PRD-INTAKE-030*

**Description:** The system creates exactly one application workspace per applicant organization per opportunity by default, preventing duplicate submissions and establishing clear ownership. Duplicate applications may be allowed by configuration for multi-track programs.

**Capabilities:**
- Single workspace enforced per org per opportunity
- Configurable exception for multi-track programs
- Duplicate workspace attempt surfaced with clear messaging

**Priority:** P0 — MVP

---

#### F30: Structured Workspace Sections
*Maps to: PRD-INTAKE-031*

**Description:** Every application workspace includes a standard set of structured sections covering the full application scope. Sections can be configured, conditionally displayed, or hidden based on opportunity rules.

**Capabilities:**
- Sections: Organization Profile, Eligibility, Narrative, Budget, Workplan, Performance Measures, Attachments, Certifications, Review/Submit
- Section visibility configurable by opportunity
- Section-level completion tracking

**Priority:** P0 — MVP

---

#### F31: Section Ownership, Tasks, and Contributor Assignments
*Maps to: PRD-INTAKE-032*

**Description:** The proposal lead can assign section ownership to specific team members, set internal due dates, create tasks, and leave comments. This replaces email-based application coordination with a structured workspace.

**Capabilities:**
- Assign section owner to a team member
- Set internal section due dates independent of submission deadline
- Create and assign internal tasks within workspace
- Section-level comments visible to assigned team members

**Priority:** P0 — MVP

---

#### F32: Private Internal Applicant Comments
*Maps to: PRD-INTAKE-033*

**Description:** The workspace supports private internal comments between applicant team members that are never visible to the grantor. These comments are preserved in the grantee-private zone and are not included in the submission package.

**Capabilities:**
- Internal comments visible only to applicant team
- Comments clearly labeled as grantee-private
- Not included in submission snapshot or grantor view

**Priority:** P0 — MVP

---

#### F33: Applicant-Side Internal Review and Approval *(Phase 2)*
*Maps to: PRD-INTAKE-034*

**Description:** Applicants can configure an internal review and approval workflow before final submission.

**Priority:** P2 — Deferred

---

#### F34: Readiness Dashboard
*Maps to: PRD-INTAKE-035*

**Description:** The workspace provides a readiness dashboard showing the overall completion status of the application, all blocking errors, warnings, required attachments, and whether the authorized submitter role is assigned and ready. This dashboard is the applicant's primary tool for submission readiness.

**Capabilities:**
- Overall completion percentage by section
- Blocking errors list with links to source fields
- Warnings and informational items
- Required attachments status with missing item indicators
- Authorized submitter role readiness indicator

**Priority:** P0 — MVP

---

#### F35: Draft Privacy Until Submission
*Maps to: PRD-INTAKE-036*

**Description:** Application drafts remain grantee-private until the applicant submits. Grantors cannot see draft application content during preparation. Exceptions exist only for configured pre-application or Q&A workflows explicitly shared by the applicant.

**Capabilities:**
- Draft content grantee-private until final submission
- Strict enforcement of data visibility boundary
- Configured pre-application or Q&A workflow exceptions clearly labeled

**Priority:** P0 — MVP

---

### Stage 7: Form, Budget, and Attachment Intake

*Objective: Capture intake data as structured data wherever possible, not only as uploaded PDFs.*

---

#### F36: Configurable Form Field Types
*Maps to: PRD-INTAKE-037*

**Description:** The platform supports a full range of configurable form field types to capture structured application data. Forms are configured by the grantor and adapt dynamically based on conditional logic.

**Capabilities:**
- Field types: text, number, date, currency, picklist, checkbox, file upload, calculated fields, repeating tables
- Grantor-configured form builder with field validation settings
- Form preview for grantors before publication

**Priority:** P0 — MVP

---

#### F37: Form Constraints and Formatting Guidance
*Maps to: PRD-INTAKE-038*

**Description:** The system enforces page and character limits, required field markers, conditional field display, and provides in-line formatting guidance so applicants understand exactly what is expected in each field.

**Capabilities:**
- Character and page limit enforcement with real-time counter
- Required field indicators and validation
- Conditional field display based on prior responses
- In-line formatting guidance and help text per field

**Priority:** P0 — MVP

---

#### F38: Structured Budget Capture
*Maps to: PRD-INTAKE-039*

**Description:** The system provides a structured budget builder with configurable budget categories, cost-share and match tracking, indirect cost capture, budget period management, and budget justification fields — replacing narrative-only budget attachments with structured data.

**Capabilities:**
- Configurable budget categories (personnel, fringe, travel, equipment, supplies, indirect, other)
- Cost-share / match and indirect cost fields
- Budget period management (single-year and multi-year)
- Budget justification narrative fields per category

**Priority:** P0 — MVP

---

#### F39: Budget Validation
*Maps to: PRD-INTAKE-040*

**Description:** The system validates budget data against configured rules, including total calculations, match requirements, funding request ceilings, and required budget justification completeness. Budget errors are surfaced in the readiness dashboard.

**Capabilities:**
- Auto-calculate totals and subtotals
- Validate funding request against opportunity ceiling
- Enforce cost-share / match requirements
- Require budget justification completeness per configured categories

**Priority:** P0 — MVP

---

#### F40: Attachment Requirements by Section and Applicant Type
*Maps to: PRD-INTAKE-041*

**Description:** Attachment requirements are enforced at the section level and differentiated by applicant type. The system tracks which attachments have been uploaded, which are missing, and which are pulled from the organization's reusable document library.

**Capabilities:**
- Per-section attachment requirement enforcement
- Applicant-type-specific attachment rules
- Reusable org-level attachments attachable to application sections
- Missing attachment indicators in readiness dashboard

**Priority:** P0 — MVP

---

#### F41: Attachment Document Versioning
*Maps to: PRD-INTAKE-042*

**Description:** When applicants replace an uploaded attachment, the system maintains a replacement history with timestamps and file metadata. Prior versions are preserved for audit purposes.

**Capabilities:**
- Version history for each uploaded attachment
- Replacement history with timestamp and uploader attribution
- Prior versions accessible to applicant team
- Final submission snapshot captures the current version at time of submit

**Priority:** P0 — MVP

---

#### F42: Submission Package Preview
*Maps to: PRD-INTAKE-043*

**Description:** Before finalizing submission, applicants can generate a preview of the complete submission package. This preview shows exactly what the grantor will receive — forms, budget, attachments, certifications — in human-readable format.

**Capabilities:**
- Generate preview of full submission package before submit
- Preview includes all sections, form data, budget, and attachments
- Preview rendered in human-readable format (GrantFlow-styled)
- Preview does not initiate submission

**Priority:** P0 — MVP

---

### Stage 8: Q&A, Clarifications, and Addenda

*Objective: Manage applicant questions and opportunity clarifications in a transparent, auditable way.*

---

#### F43: Grantor Q&A Configuration
*Maps to: PRD-INTAKE-044*

**Description:** Grantors configure whether applicants can submit questions during the opportunity period. Public Q&A is configurable — it can be enabled or disabled per opportunity, with optional question submission windows.

**Capabilities:**
- Enable or disable applicant question submission per opportunity
- Configure question submission window (open/close dates)
- Route submitted questions to designated grantor staff

**Priority:** P0 — MVP

---

#### F44: Public Q&A Response Publishing
*Maps to: PRD-INTAKE-045*

**Description:** Grantors can publish Q&A responses that are visible to all applicants on the opportunity page. This ensures all applicants have equal access to clarifications, consistent with federal fairness requirements.

**Capabilities:**
- Grantor drafts and publishes Q&A responses
- Published responses visible to all applicants on opportunity page
- Applicants notified when new answers are published
- Q&A displayed chronologically with timestamps

**Priority:** P0 — MVP

---

#### F45: Private Applicant-Specific Clarification *(Phase 2)*
*Maps to: PRD-INTAKE-046*

**Description:** Private applicant-specific clarification channels, when configured and permitted by funder policy.

**Priority:** P2 — Deferred

---

#### F46: Auditable Q&A and Addenda History
*Maps to: PRD-INTAKE-047*

**Description:** The system maintains a complete, immutable, auditable history of all questions submitted, responses published, addenda issued, and date changes made. This history is timestamped and attributable.

**Capabilities:**
- Immutable record of all questions, responses, addenda, and date changes
- Timestamps and user attribution for all actions
- History accessible to grantor and visible on opportunity page for applicants

**Priority:** P0 — MVP

---

#### F47: Applicant Notifications for Addenda and Changes
*Maps to: PRD-INTAKE-048*

**Description:** The system automatically notifies applicants of published addenda, changed deadlines, or required application changes. Applicants with saved or in-progress applications receive timely in-app and email notifications.

**Capabilities:**
- Automatic notification triggered by addendum publication
- Deadline change notifications to all applicants with saved or started applications
- Required application change notifications with link to impacted section

**Priority:** P0 — MVP

---

### Stage 9: Validation and Submission

*Objective: Ensure only authorized, complete, and review-ready submissions enter the grantor intake queue.*

---

#### F48: Continuous Validation During Drafting
*Maps to: PRD-INTAKE-049*

**Description:** The system validates application data continuously as applicants draft, surfacing issues in real time rather than saving all errors for the final submission attempt. Final validation is also triggered at the point of submission.

**Capabilities:**
- Real-time field-level validation during data entry
- Section-level validation summary in readiness dashboard
- Final validation run triggered at submission attempt
- Validation results actionable with links to source fields

**Priority:** P0 — MVP

---

#### F49: Validation Message Classification
*Maps to: PRD-INTAKE-050*

**Description:** Validation messages are classified into three levels — informational, warning, and blocking — so applicants and proposal leads clearly understand which issues prevent submission and which are advisory.

**Capabilities:**
- Three-tier classification: Informational, Warning, Blocking
- Distinct visual treatment per message type (USWDS alert components)
- Blocking messages prevent submission; warnings and informational messages do not
- All messages displayed in readiness dashboard

**Priority:** P0 — MVP

---

#### F50: Submission Blocking
*Maps to: PRD-INTAKE-051*

**Description:** The system blocks final submission when any mandatory field, certification, signature, attachment, eligibility response, budget requirement, or authorized submitter requirement is incomplete. Submission is not permitted until all blocking items are resolved.

**Capabilities:**
- Blocking validation enforced at final submission attempt
- Complete list of blocking items displayed with remediation links
- Submit button disabled until all blocking items are cleared
- Authorized submitter role required for submission action

**Priority:** P0 — MVP

---

#### F51: Authorized Representative Certification
*Maps to: PRD-INTAKE-052*

**Description:** Before submission, the system requires a final certification action by an authorized representative. This certification is a formal, legally meaningful step that must be completed by a user with the authorized representative role. Before certifying, the Authorized Representative can flag concerns on any section of the submission preview; concerns notify the Proposal Lead without blocking the application.

**Capabilities:**
- Certification step required as final action before submission
- Only users with Authorized Representative role can certify
- Certification includes legal language configurable by grantor
- Certification action logged as an audit event with timestamp
- Pre-certification concern flag: Authorized Representative can leave a private comment or flag on any section of the submission package preview; flag is grantee-private, notifies the Proposal Lead, and does not change application status or initiate submission

**Priority:** P0 — MVP

---

#### F52: Immutable Submission Snapshot and Receipt
*Maps to: PRD-INTAKE-053*

**Description:** Upon successful submission, the system generates a final, immutable submission snapshot with a unique confirmation number, UTC timestamp, and downloadable receipt. This snapshot is the authoritative record of what was submitted.

**Capabilities:**
- Immutable submission snapshot generated on submit
- Unique confirmation number assigned
- Timestamped receipt (UTC) provided to applicant
- Receipt downloadable by applicant and accessible in grantor intake queue

**Priority:** P0 — MVP

---

#### F53: Human-Readable and Machine-Readable Submission Package
*Maps to: PRD-INTAKE-054*

**Description:** The submission snapshot preserves both a human-readable application package (formatted for review) and a machine-readable structured data package (JSON/XML). This supports downstream review tooling, analytics, and interoperability.

**Capabilities:**
- Human-readable package (PDF or GrantFlow-styled HTML)
- Machine-readable structured data package (JSON or XML)
- Both formats generated and stored at time of submission
- Both accessible in grantor intake queue

**Priority:** P0 — MVP

---

#### F54: Post-Submission Edit Prevention
*Maps to: PRD-INTAKE-055*

**Description:** After submission, the application is locked and no edits are permitted unless the application is formally withdrawn, reopened, or returned for correction through the configured workflow. Ad-hoc post-submission edits are not allowed.

**Capabilities:**
- Application locked on submission
- Edit prevention enforced at field, section, and attachment levels
- Unlock only via withdrawal, formal reopening, or grantor-initiated return-for-correction
- All lock/unlock events logged in audit trail

**Priority:** P0 — MVP

---

### Stage 10: Intake Queue and Administrative Screening

*Objective: Give grantors a structured queue for receiving, validating, triaging, and routing applications.*

---

#### F55: Intake Queue Routing
*Maps to: PRD-INTAKE-056*

**Description:** Submitted applications are automatically routed into a structured intake queue based on configurable routing rules. Routing criteria include opportunity, applicant type, geographic region, funding track, or custom workflow configuration.

**Capabilities:**
- Automatic routing of submitted applications into intake queue
- Routing by opportunity, applicant type, region, funding track
- Configurable routing rules per opportunity or program
- Queue assignment visible in grantor administrative panel

**Priority:** P0 — MVP

---

#### F56: Intake Queue Display
*Maps to: PRD-INTAKE-057*

**Description:** The intake queue displays a comprehensive view of each submitted application, giving intake administrators all the information needed to make informed screening decisions without requiring them to open individual application files.

**Capabilities:**
- Submission status and timestamp
- Applicant organization profile summary
- Eligibility pre-screen results
- Validation summary (blocking errors cleared at submission)
- Attachment list and completeness status
- Requested funding amount

**Priority:** P0 — MVP

---

#### F57: Administrative Screening Dispositions
*Maps to: PRD-INTAKE-058*

**Description:** Intake administrators can apply a formal administrative screening disposition to each application in the queue. Dispositions are configurable but include standard states aligned with federal and sector practice.

**Capabilities:**
- Disposition states: Accepted for Review, Returned for Correction, Withdrawn, Ineligible, Duplicate, Late, Administratively Rejected
- Disposition action logged with timestamp and user attribution
- Disposition triggers applicant notification
- Disposition history preserved in audit trail

**Priority:** P0 — MVP

---

#### F58: Correction and Clarification Requests
*Maps to: PRD-INTAKE-059*

**Description:** When permitted by opportunity rules, grantors can formally request that an applicant correct or clarify specific aspects of their submission. The request is tracked, timestamped, and tied to the original submission record. If the correction window expires without a resubmission, the system automatically applies an Administratively Rejected disposition with notifications and audit logging; the intake administrator can override the auto-rejection with a required reason.

**Capabilities:**
- Grantor-initiated correction or clarification request
- Request tied to specific sections or attachments
- Request triggers applicant notification with instructions
- Correction window configurable per opportunity
- Automatic Administratively Rejected disposition when correction window expires without resubmission; applicant team and intake administrator notified; `CORRECTION_WINDOW_EXPIRED` audit event logged
- Intake administrator can override the auto-rejection post-expiry with a required override reason

**Priority:** P0 — MVP

---

#### F59: Original Submission Snapshot Preservation on Correction
*Maps to: PRD-INTAKE-060*

**Description:** When a correction or resubmission is requested and the applicant makes changes, the system preserves the original submission snapshot alongside the corrected version. Neither version is overwritten.

**Capabilities:**
- Original submission snapshot preserved on correction request
- Corrected resubmission creates a new versioned snapshot
- Both original and corrected versions accessible in intake queue
- Version history linked to intake record

**Priority:** P0 — MVP

---

#### F60: Accepted Application Routing to Review
*Maps to: PRD-INTAKE-061*

**Description:** Applications accepted through administrative screening are automatically routed to the appropriate review, scoring, or applicant risk assessment workflow. This handoff is the boundary of the intake module.

**Capabilities:**
- Accepted applications routed to review, scoring, or risk assessment workflow
- Routing configurable by opportunity or program
- Handoff event logged in audit trail
- Review workflow access provisioned for assigned reviewers

**Priority:** P0 — MVP

---

### Stage 11: Intake Analytics and Reporting

*Objective: Provide grantors and applicants visibility into intake status, bottlenecks, and quality.*

---

#### F61: Grantor Intake Dashboards
*Maps to: PRD-INTAKE-062*

**Description:** Grantors have access to dashboards that provide real-time visibility into opportunity and application intake status. Dashboards support program management, deadline tracking, and quality monitoring.

**Capabilities:**
- Opportunity views: published, active, closed
- Application counts: started, submitted, incomplete, late
- Validation error summary by opportunity
- Intake disposition summary by disposition state
- Filterable by opportunity, program, date range

**Priority:** P0 — MVP

---

#### F62: Applicant Dashboards
*Maps to: PRD-INTAKE-063*

**Description:** Applicants have access to a personal dashboard showing all their activity across opportunities. The dashboard surfaces upcoming deadlines, application progress, missing required items, and full submission history.

**Capabilities:**
- Saved opportunities list
- Application progress by opportunity (by section and overall)
- Upcoming deadlines with countdown indicators
- Missing required items with links to workspace
- Full submission history with status and receipt access

**Priority:** P0 — MVP

---

#### F63: Intake Data Export
*Maps to: PRD-INTAKE-064*

**Description:** Grantors and authorized administrators can export intake data for external reporting, audit, and compliance purposes. Exports include submission data, eligibility results, disposition history, and audit events.

**Capabilities:**
- Export intake data by opportunity, date range, or disposition state
- Export formats support reporting and audit requirements (CSV, Excel, structured JSON)
- Export includes submission metadata, eligibility results, disposition history, and audit events
- Export access controlled by role

**Priority:** P0 — MVP

---

#### F64: Validation Failure Analytics *(Phase 2)*
*Maps to: PRD-INTAKE-065*

**Description:** Analytics on common validation failures and applicant burden indicators to support continuous platform improvement.

**Priority:** P2 — Deferred

---

#### F65: Portfolio-Level Intake Analytics *(Phase 2)*
*Maps to: PRD-INTAKE-066*

**Description:** Portfolio-level intake analytics across funders, programs, or cycles.

**Priority:** P2 — Deferred

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Accessibility** | GrantFlow Design System v1.0 required across all interfaces; Section 508 / WCAG 2.1 AA compliance for all applicant-facing pages |
| **Privacy / Data Visibility** | Strict three-zone data boundary: Grantor-private, Grantee-private, Shared transaction — enforced at data and UI layers |
| **Auditability** | 100% of final submissions generate immutable snapshots with UTC timestamps, confirmation numbers, and full audit trails; all intake events attributed to user and timestamp |
| **Regulatory Compliance** | Opportunity metadata structures must satisfy 2 CFR 200.204 (NOFO); intake must capture data to support 2 CFR 200.205 (merit review) and 2 CFR 200.206 (risk assessment) |
| **Security** | Role-based access control enforced for all grantor and applicant actions; authorized representative role required for final submission |
| **Performance** | Application workspace and intake queue must remain responsive under concurrent multi-user access; no specific SLA defined at MVP planning stage |
| **Data Integrity** | Submitted application snapshots are immutable; post-submission edits blocked except via formal withdrawal or return-for-correction workflow |
| **AI Guardrails** | AI features labeled as assistive; no AI decision is binding; final certifications and submissions require explicit human action |
| **Notifications** | In-app and email notifications required for key intake events (see Notification Model); MVP notifications cover opportunity lifecycle, application status, and screening dispositions |
| **Export / Portability** | Submission snapshots available in human-readable and machine-readable formats; intake data exportable for audit and reporting |

---

## 7. Success Metrics

| Metric | Definition | Target |
|---|---|---|
| Setup completeness rate | Published opportunities that pass all required metadata validation checks on first publish attempt | ≥ 90% |
| Applicant profile reuse rate | Percentage of application fields populated from reusable organization profile across repeat applications within 12 months | ≥ 60% |
| Validation error reduction | Reduction in final-submit blocking errors after continuous validation is active vs. baseline | ≥ 40% reduction |
| Incomplete submission rate | Applications returned or rejected for missing required data or attachments | < 10% |
| Intake cycle time | Median time from submission to administrative disposition | Reduce by 30% |
| Applicant satisfaction | Applicant rating of intake clarity and ease (post-submission survey) | ≥ 4.2 / 5.0 |
| Grantor satisfaction | Grantor rating of intake queue usability (post-launch survey) | ≥ 4.2 / 5.0 |
| Audit completeness | Final submissions with full immutable snapshot, confirmation receipt, and complete audit trail | 100% |

---

## 8. Risks and Mitigations

| Risk ID | Risk | Impact | Mitigation |
|---|---|---|---|
| R-001 | Over-configurable forms become hard to manage | Grantors create inconsistent, unusable applications | Provide templates, guardrails, and required metadata validation with strong defaults |
| R-002 | Applicants expect this product to replace all federal portals (SAM.gov, Grants.gov) | User confusion, adoption friction | Clearly position as intake orchestration layer; add external integrations in phases |
| R-003 | Eligibility logic is too complex for simple rule configuration | False blockers prevent valid submissions | Separate hard blockers from advisory warnings; support exception flows (Phase 2) |
| R-004 | Draft privacy boundaries are misunderstood by applicants | Applicant trust and compliance risk | Explicit private/shared labels on all content; submission preview showing exactly what grantor receives |
| R-005 | Grantors request post-award functions inside MVP scope | Scope creep and delivery risk | Keep intake handoff boundary explicit; route post-award requests to future module roadmap |
| R-006 | AI-generated guidance is treated as official determination | Legal and compliance risk | Label all AI outputs as assistive only; require source-linked, human-approved guidance before publication |

---

## 9. Feature Index

| Feature ID | PRD-INTAKE ID | Feature Name | Stage | Priority | MVP / Phase |
|---|---|---|---|---|---|
| F0 | PRD-INTAKE-001 | Opportunity Creation from Configurable Templates | 1 | P0 | MVP |
| F1 | PRD-INTAKE-002 | Structured Opportunity Metadata Capture | 1 | P0 | MVP |
| F2 | PRD-INTAKE-003 | Plain-Language Guidance Prompts | 1 | P0 | MVP |
| F3 | PRD-INTAKE-004 | Opportunity Type Configuration | 1 | P2 | Phase 2 |
| F4 | PRD-INTAKE-005 | Intake Windows and Deadline Configuration | 1 | P0 | MVP |
| F5 | PRD-INTAKE-006 | Opportunity Setup Completeness Validation | 1 | P0 | MVP |
| F6 | PRD-INTAKE-007 | Opportunity Versioning and Audit Trail | 1 | P0 | MVP |
| F7 | PRD-INTAKE-008 | Eligibility Rule Definition | 2 | P0 | MVP |
| F8 | PRD-INTAKE-009 | Hard Eligibility Blockers vs. Advisory Fit Indicators | 2 | P0 | MVP |
| F9 | PRD-INTAKE-010 | Configurable Pre-Screening Questionnaires | 2 | P0 | MVP |
| F10 | PRD-INTAKE-011 | Conditional Forms and Sections | 2 | P0 | MVP |
| F11 | PRD-INTAKE-012 | Required Attachments and Evidence Configuration | 2 | P0 | MVP |
| F12 | PRD-INTAKE-013 | Administrative Screening Criteria Configuration | 2 | P0 | MVP |
| F13 | PRD-INTAKE-014 | Applicant-Facing Opportunity Portal Publication | 3 | P0 | MVP |
| F14 | PRD-INTAKE-015 | Search and Filtering | 3 | P0 | MVP |
| F15 | PRD-INTAKE-016 | Saved Opportunities, Notifications, and Comparison | 3 | P2 | Phase 2 |
| F16 | PRD-INTAKE-017 | Public Opportunity Pages and Authenticated Workspaces | 3 | P0 | MVP |
| F17 | PRD-INTAKE-018 | Opportunity Changes and Addenda Display | 3 | P0 | MVP |
| F18 | PRD-INTAKE-019 | Reusable Organization Profile | 4 | P0 | MVP |
| F19 | PRD-INTAKE-020 | Organization Profile Data Capture | 4 | P0 | MVP |
| F20 | PRD-INTAKE-021 | Reusable Standard Attachments Library | 4 | P0 | MVP |
| F21 | PRD-INTAKE-022 | Credential Expiration Warnings | 4 | P0 | MVP |
| F22 | PRD-INTAKE-023 | Organization Role Assignment | 4 | P0 | MVP |
| F23 | PRD-INTAKE-024 | Profile Reuse with Submission Snapshots | 4 | P0 | MVP |
| F24 | PRD-INTAKE-025 | Eligibility Pre-Screen Workflow | 5 | P0 | MVP |
| F25 | PRD-INTAKE-026 | Eligibility Result Display | 5 | P0 | MVP |
| F26 | PRD-INTAKE-027 | Eligibility Blocker Explanation | 5 | P0 | MVP |
| F27 | PRD-INTAKE-028 | Ineligible Applicant Exception Submission | 5 | P2 | Phase 2 |
| F28 | PRD-INTAKE-029 | Eligibility Response Storage | 5 | P0 | MVP |
| F29 | PRD-INTAKE-030 | One Workspace Per Organization Per Opportunity | 6 | P0 | MVP |
| F30 | PRD-INTAKE-031 | Structured Workspace Sections | 6 | P0 | MVP |
| F31 | PRD-INTAKE-032 | Section Ownership, Tasks, and Contributor Assignments | 6 | P0 | MVP |
| F32 | PRD-INTAKE-033 | Private Internal Applicant Comments | 6 | P0 | MVP |
| F33 | PRD-INTAKE-034 | Applicant-Side Internal Review and Approval | 6 | P2 | Phase 2 |
| F34 | PRD-INTAKE-035 | Readiness Dashboard | 6 | P0 | MVP |
| F35 | PRD-INTAKE-036 | Draft Privacy Until Submission | 6 | P0 | MVP |
| F36 | PRD-INTAKE-037 | Configurable Form Field Types | 7 | P0 | MVP |
| F37 | PRD-INTAKE-038 | Form Constraints and Formatting Guidance | 7 | P0 | MVP |
| F38 | PRD-INTAKE-039 | Structured Budget Capture | 7 | P0 | MVP |
| F39 | PRD-INTAKE-040 | Budget Validation | 7 | P0 | MVP |
| F40 | PRD-INTAKE-041 | Attachment Requirements by Section and Applicant Type | 7 | P0 | MVP |
| F41 | PRD-INTAKE-042 | Attachment Document Versioning | 7 | P0 | MVP |
| F42 | PRD-INTAKE-043 | Submission Package Preview | 7 | P0 | MVP |
| F43 | PRD-INTAKE-044 | Grantor Q&A Configuration | 8 | P0 | MVP |
| F44 | PRD-INTAKE-045 | Public Q&A Response Publishing | 8 | P0 | MVP |
| F45 | PRD-INTAKE-046 | Private Applicant-Specific Clarification | 8 | P2 | Phase 2 |
| F46 | PRD-INTAKE-047 | Auditable Q&A and Addenda History | 8 | P0 | MVP |
| F47 | PRD-INTAKE-048 | Applicant Notifications for Addenda and Changes | 8 | P0 | MVP |
| F48 | PRD-INTAKE-049 | Continuous Validation During Drafting | 9 | P0 | MVP |
| F49 | PRD-INTAKE-050 | Validation Message Classification | 9 | P0 | MVP |
| F50 | PRD-INTAKE-051 | Submission Blocking | 9 | P0 | MVP |
| F51 | PRD-INTAKE-052 | Authorized Representative Certification | 9 | P0 | MVP |
| F52 | PRD-INTAKE-053 | Immutable Submission Snapshot and Receipt | 9 | P0 | MVP |
| F53 | PRD-INTAKE-054 | Human-Readable and Machine-Readable Submission Package | 9 | P0 | MVP |
| F54 | PRD-INTAKE-055 | Post-Submission Edit Prevention | 9 | P0 | MVP |
| F55 | PRD-INTAKE-056 | Intake Queue Routing | 10 | P0 | MVP |
| F56 | PRD-INTAKE-057 | Intake Queue Display | 10 | P0 | MVP |
| F57 | PRD-INTAKE-058 | Administrative Screening Dispositions | 10 | P0 | MVP |
| F58 | PRD-INTAKE-059 | Correction and Clarification Requests | 10 | P0 | MVP |
| F59 | PRD-INTAKE-060 | Original Submission Snapshot Preservation on Correction | 10 | P0 | MVP |
| F60 | PRD-INTAKE-061 | Accepted Application Routing to Review | 10 | P0 | MVP |
| F61 | PRD-INTAKE-062 | Grantor Intake Dashboards | 11 | P0 | MVP |
| F62 | PRD-INTAKE-063 | Applicant Dashboards | 11 | P0 | MVP |
| F63 | PRD-INTAKE-064 | Intake Data Export | 11 | P0 | MVP |
| F64 | PRD-INTAKE-065 | Validation Failure Analytics | 11 | P2 | Phase 2 |
| F65 | PRD-INTAKE-066 | Portfolio-Level Intake Analytics | 11 | P2 | Phase 2 |
| F66 | PRD-INTAKE-019A | Grants.gov API Automated Ingestion | Phase 8 | P0 | MVP |
| F67 | PRD-INTAKE-019B | Grants.gov Metadata Normalization | Phase 8 | P0 | MVP |
| F68 | PRD-INTAKE-019C | Save, Track, Compare, and Import External Opportunities | Phase 8 | P0 | MVP |
| F69 | PRD-INTAKE-019D | Scheduled Refresh and Change Alerts | Phase 8 | P0 | MVP |
| F70 | PRD-INTAKE-019E | Source Attribution, Version History, and API Reference Preservation | Phase 8 | P0 | MVP |

**Summary:** 65 MVP features (P0), 6 Phase 2 features (P2 — deferred)

---

## Appendix A: Out of Scope

The following are explicitly out of scope for the GrantsIntake module:

- Full merit review and scoring execution — post-intake, separate module
- Award creation and acceptance — post-intake lifecycle
- Post-award reporting — outside intake boundary
- Reimbursement and payment requests — separate financial workflow
- Subrecipient monitoring after award — post-award management
- Closeout and retention beyond intake submission records — separate lifecycle stage
- Full ERP accounting integration — enterprise integration deferred
- Automated award decisioning — AI should assist, not decide
- Autonomous AI-generated application submission — human certification required
- Grants.gov System-to-System integration at MVP launch — Phase 3 (note: Grants.gov REST API ingestion added in Phase 8)
- Advanced portfolio optimization — Phase 3
- Complex multi-stage subrecipient monitoring — post-award
- Full cross-funder universal applicant profile network — Phase 3

---

## Appendix B: Status Model Reference

**Opportunity Status:** Draft → Internal Review → Approved → Published → Modified → Closed → Archived

**Application Status:** Not Started → Workspace Created → In Progress → Ready for Internal Review → Ready to Submit → Submitted → Intake Screening → Returned for Correction → Resubmitted → Accepted for Review → Withdrawn → Administratively Rejected

**Q&A / Addendum Status:** Draft → Internal Review → Published → Superseded / Archived

**Intake Disposition Status:** Pending Screening → Accepted for Review → Returned for Correction → Ineligible → Late → Duplicate → Withdrawn → Administratively Rejected

---

## Appendix C: Regulatory References

- 2 CFR 200.204 — Notices of Funding Opportunities
- 2 CFR 200.205 — Federal Agency Review of Merit of Proposals
- 2 CFR 200.206 — Federal Agency Review of Risk Posed by Applicants
- Grants.gov Applicant Registration
- Grants.gov Workspace Roles
- Simpler.Grants.gov Vision and Roadmap
- Candid: Demographics via Candid
