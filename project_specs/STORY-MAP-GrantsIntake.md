# Story Map: GrantsIntake

| Field | Value |
|---|---|
| **Product** | GrantsIntake — Dual-Sided Grants Lifecycle Management Platform |
| **Module** | Grants Intake |
| **Document Type** | User Story Map |
| **Version** | 1.0 Draft |
| **Date** | July 24, 2026 |
| **Related Personas** | `project_specs/PERSONAS-GrantsIntake.md` |
| **Related JTBD** | `project_specs/JTBD-GrantsIntake.md` |
| **Related Journeys** | `project_specs/JOURNEYS-GrantsIntake.md` |
| **Related User Stories** | `project_specs/UserStories-GrantsIntake.md` |
| **Related PRD** | `project_specs/PRD-GrantsIntake.md` |

---

## Overview

This story map organizes GrantsIntake's 67 user stories (60 MVP + 7 deferred) across two axes:

- **X-axis (columns):** The 11 intake stages from the PRD, derived from user journey stages in JOURNEYS-GrantsIntake.md. These represent the natural flow of both grantors (Stages 1–3, 8, 11) and applicants (Stages 4–9) through the intake process, converging at Stages 10–11.
- **Y-axis (rows):** Activities within each stage, organized by epic and mapped to specific user stories (US-X.Y).

Each story entry includes a **Natural Acceptance Criteria (NaC)** statement derived from the intersection of:
1. A JTBD outcome (the "what matters" to a specific persona)
2. The journey stage context (the "when/where" it matters)
3. The user story itself (the "what is built")

NaC bridge JTBD functional outcomes to testable, scenario-oriented acceptance criteria that complement the formal story acceptance criteria.

**Release Assignment:**
- **R1 (MVP):** All 59 P0 user stories — complete end-to-end intake boundary
- **R2 (Phase 2):** 7 deferred features enhancing experience within the intake boundary
- **R3 (Phase 3):** Advanced network/interoperability features (Grants.gov S2S, SAM API, cross-funder network)

---

## Story Map Matrix

### Stage 1: Program and Opportunity Setup
*Grantor side | Journey: JRN-01.1 | Epic 1 | Primary Persona: PER-01 Marcus Webb*

| SM-ID | Activity | Story | NaC (from JTBD) | Release |
|---|---|---|---|---|
| SM-1.1 | Create opportunity from template library | **US-1.1** Create Opportunity from Template (F0) | JTBD-01.1 → *Given Marcus selects a template, when the new opportunity is instantiated, then required metadata fields are pre-populated and setup time is reduced to under 2 hours* | R1 |
| SM-1.2 | Fill in structured metadata fields | **US-1.2** Capture Structured Opportunity Metadata (F1) | JTBD-01.1 → *Given Marcus enters metadata, when he saves, then all required NOFO fields (2 CFR 200.204) are validated and a field-change audit event is logged* | R1 |
| SM-1.3 | Write descriptions with plain-language guidance | **US-1.3** Write Descriptions with Plain-Language Guidance (F2) | JTBD-01.1 → *Given Marcus is writing narrative fields, when guidance prompts are visible, then applicant instructions are clear before publication and readability grade is displayed* | R1 |
| SM-1.4 | Configure intake windows and deadlines | **US-1.4** Configure Intake Windows and Deadlines (F4) | JTBD-01.1 → *Given Marcus sets open/close dates, when the opportunity is published, then the system enforces those dates automatically and any date change triggers an addendum* | R1 |
| SM-1.5 | Run completeness check before publishing | **US-1.5** Validate Opportunity Completeness Before Publishing (F5) | JTBD-01.1 → *Given Marcus clicks "Check Readiness," when validation runs, then all blockers are listed with section links — and ≥ 90% of opportunities pass on the first publish attempt* | R1 |
| SM-1.6 | Track post-publication modifications | **US-1.6** Track Opportunity Versions and Modification History (F6) | JTBD-01.1 → *Given a published opportunity is modified, when the change is saved, then a new immutable version record is created with timestamp and user attribution* | R1 |

---

### Stage 2: Eligibility and Intake Rules Configuration
*Grantor side | Journey: JRN-01.1 (Stage 3–4) | Epic 2 | Primary Persona: PER-01 Marcus Webb, PER-02 Diana Reyes*

| SM-ID | Activity | Story | NaC (from JTBD) | Release |
|---|---|---|---|---|
| SM-2.1 | Define eligibility rules with AND/OR logic | **US-2.1** Define Eligibility Rules (F7) | JTBD-01.2 → *Given Marcus configures a SAM registration rule, when an unregistered applicant completes pre-screen, then the system surfaces the hard blocker and prevents workspace creation* | R1 |
| SM-2.2 | Configure hard blockers vs. advisory warnings | **US-2.2** Distinguish Hard Blockers from Advisory Warnings (F8) | JTBD-01.2 → *Given an eligibility rule is set to hard_blocker at pre_workspace, when a violating applicant tries to start, then workspace creation is disabled and a `gf-alert gf-alert--error` is shown prominently* | R1 |
| SM-2.3 | Build pre-screening questionnaire | **US-2.3** Configure Pre-Screening Questionnaires (F9) | JTBD-01.2 → *Given Marcus maps questionnaire responses to eligibility rules, when an applicant answers the pre-screen, then responses are stored in the intake record and visible to Diana during screening* | R1 |
| SM-2.4 | Configure conditional form sections | **US-2.4** Show and Hide Sections Conditionally (F10) | JTBD-04.1 → *Given a section has a conditional display rule, when Jordan's org type changes, then irrelevant sections hide in real time and hidden sections are excluded from completeness validation* | R1 |
| SM-2.5 | Specify required attachment types by applicant | **US-2.5** Configure Required Attachments (F11) | JTBD-01.2 → *Given Marcus marks an IRS letter as required for nonprofits, when a nonprofit applicant submits without it, then the system blocks submission with a specific missing-attachment error* | R1 |
| SM-2.6 | Codify administrative screening checklist | **US-2.6** Configure Administrative Screening Criteria (F12) | JTBD-02.1 → *Given Marcus configures screening criteria for an opportunity, when Diana opens a submission in the queue, then all required criteria are pre-loaded and must be checked before a disposition can be applied* | R1 |

---

### Stage 3: Opportunity Publication and Discovery
*Shared | Journey: JRN-01.1 (Stage 5–6), JRN-04.1 | Epic 3 | Primary Personas: PER-01, PER-04*

| SM-ID | Activity | Story | NaC (from JTBD) | Release |
|---|---|---|---|---|
| SM-3.1 | Publish opportunity to applicant portal | **US-3.1** Publish Opportunities to Applicant Portal (F13) | JTBD-01.1 → *Given all publication blockers are cleared, when Marcus clicks Publish, then the opportunity appears in the portal listing immediately and an OPPORTUNITY_PUBLISHED audit event is logged* | R1 |
| SM-3.2 | Search and filter available opportunities | **US-3.2** Search and Filter Opportunities (F14) | JTBD-04.1 → *Given Jordan searches by keyword and program area, when results load, then only eligible open opportunities are shown and can be sorted by deadline* | R1 |
| SM-3.3 | View public page and authenticated workspace status | **US-3.3** Access Public Pages and Authenticated Workspace View (F16) | JTBD-04.1 → *Given Jordan is authenticated with a workspace, when she opens the opportunity page, then she sees section completion percentage and blocking error count without navigating the workspace* | R1 |
| SM-3.4 | Track addenda and deadline changes | **US-3.4** See Opportunity Changes and Addenda (F17) | JTBD-04.3 → *Given Marcus publishes an addendum, when Jordan views the opportunity page, then the addendum appears in reverse-chronological order and an in-app notification is sent to applicants with started workspaces* | R1 |

---

### Stage 4: Organization Profile and Credential Readiness
*Grantee side | Journey: JRN-03.1 | Epic 4 | Primary Persona: PER-03 Priya Nair*

| SM-ID | Activity | Story | NaC (from JTBD) | Release |
|---|---|---|---|---|
| SM-4.1 | Create reusable organization profile | **US-4.1** Create and Maintain a Reusable Organization Profile (F18) | JTBD-03.1 → *Given Priya completes the org profile, when Jordan opens a new application workspace, then ≥ 60% of applicable fields are pre-populated without manual entry* | R1 |
| SM-4.2 | Enter all required org data fields | **US-4.2** Enter All Required Organization Data Fields (F19) | JTBD-03.1 → *Given Priya enters EIN, UEI, SAM status, and entity type, when the profile is saved, then data is validated (9-digit EIN, 12-char UEI) and a profile completeness percentage is displayed* | R1 |
| SM-4.3 | Upload and manage standard document library | **US-4.3** Store and Reuse Standard Documents (F20) | JTBD-03.1 → *Given Priya uploads an IRS determination letter to the library, when Jordan attaches it to an application, then no re-upload is required and a version history is maintained* | R1 |
| SM-4.4 | Monitor credential expiration | **US-4.4** Receive Credential Expiration Warnings (F21) | JTBD-03.2 → *Given a SAM registration expiration date is within 60 days, when Priya opens the org profile or application workspace, then an in-app warning is displayed before the credential becomes a submission blocker* | R1 |
| SM-4.5 | Assign roles to team members | **US-4.5** Assign Roles to Team Members (F22) | JTBD-03.3 → *Given Priya designates Sandra as Authorized Representative, when the role is saved, then only Sandra can certify and submit — and the readiness dashboard reflects the authorized submitter is confirmed* | R1 |
| SM-4.6 | Reuse profile while preserving submission snapshot | **US-4.6** Reuse Profile Data While Preserving Submission Snapshots (F23) | JTBD-03.1 → *Given Priya updates the org address after a submission, when Diana views the intake queue, then the submitted record still shows the address as it was at submission time* | R1 |

---

### Stage 5: Eligibility Pre-Screening
*Grantee side | Journey: JRN-04.1 (pre-workspace), JRN-03.1 | Epic 5 | Primary Personas: PER-04 Jordan Kim, PER-02 Diana Reyes*

| SM-ID | Activity | Story | NaC (from JTBD) | Release |
|---|---|---|---|---|
| SM-5.1 | Complete eligibility pre-screen questionnaire | **US-5.1** Complete the Eligibility Pre-Screen Workflow (F24) | JTBD-01.2 → *Given Jordan begins a new application, when she completes all required pre-screen questions, then eligibility is determined before any workspace effort is invested* | R1 |
| SM-5.2 | Receive clear four-state eligibility result | **US-5.2** See a Clear Eligibility Result (F25) | JTBD-01.2 → *Given Jordan answers a hard-blocker question negatively, when the result screen appears, then the Ineligible state is shown with a USWDS Error alert and a recommended next-step message* | R1 |
| SM-5.3 | Understand specific blocker explanations | **US-5.3** Understand Why I Was Blocked (F26) | JTBD-01.2 → *Given Jordan is shown an Ineligible result, when she reads the explanation, then she sees which specific answer triggered the blocker in plain language — not a rule code — and a link to the relevant eligibility section* | R1 |
| SM-5.4 | Store pre-screen responses in intake record | **US-5.4** Store Eligibility Responses in the Intake Record (F28) | JTBD-02.1 → *Given Jordan completes the pre-screen, when Diana opens the screening panel, then all responses and the four-state result are visible without asking the applicant to repeat eligibility information* | R1 |

---

### Stage 6: Application Workspace
*Grantee side | Journey: JRN-04.1 | Epic 6 | Primary Personas: PER-04 Jordan Kim, PER-05 Sandra Okafor*

| SM-ID | Activity | Story | NaC (from JTBD) | Release |
|---|---|---|---|---|
| SM-6.1 | Access single workspace per org per opportunity | **US-6.1** Enforce One Workspace Per Organization Per Opportunity (F29) | JTBD-04.1 → *Given Jordan's org has an existing workspace for an opportunity, when a second workspace creation is attempted, then it is blocked with a clear error — one source of truth is maintained* | R1 |
| SM-6.2 | Navigate structured workspace sections | **US-6.2** Navigate Structured Workspace Sections (F30) | JTBD-04.1 → *Given Jordan opens the workspace, when she views the section list, then all required sections are visible with completion status indicators (complete, incomplete, has errors)* | R1 |
| SM-6.3 | Assign section owners, tasks, and deadlines | **US-6.3** Assign Section Owners, Tasks, and Internal Deadlines (F31) | JTBD-04.1 → *Given Jordan assigns the budget section to Maria with an internal due date, when Maria logs in, then she sees only her assigned sections with the due date and any tasks — section ownership is grantee-private* | R1 |
| SM-6.4 | Leave private internal comments | **US-6.4** Leave Private Internal Comments (F32) | JTBD-04.1 → *Given Jordan leaves an internal comment on the budget section, when the application is submitted, then the comment is excluded from the submission snapshot and grantor view* | R1 |
| SM-6.5 | Monitor readiness dashboard | **US-6.5** Use the Readiness Dashboard (F34) | JTBD-04.2 → *Given a required field is left empty during drafting, when Jordan views the readiness dashboard, then the blocking error is listed with a direct link to the source field — before any submission attempt is made* | R1 |
| SM-6.6 | Maintain draft privacy until submission | **US-6.6** Keep Draft Content Private Until Submission (F35) | JTBD-04.1 → *Given the application is in draft status, when Marcus logs into the grantor portal, then no draft content is visible to him — the grantee-private boundary is enforced at both data and UI layers* | R1 |

---

### Stage 7: Form, Budget, and Attachment Intake
*Grantee side | Journey: JRN-04.1 (Stage 2–5), JRN-03.1 (Stage 2) | Epic 7 | Primary Personas: PER-04 Jordan Kim, PER-03 Priya Nair*

| SM-ID | Activity | Story | NaC (from JTBD) | Release |
|---|---|---|---|---|
| SM-7.1 | Fill out forms with all required field types | **US-7.1** Complete Forms with Configurable Field Types (F36) | JTBD-04.2 → *Given the grantor configured a repeating table for personnel costs, when Jordan adds rows, then the table updates dynamically and calculated fields update automatically* | R1 |
| SM-7.2 | See character limits and formatting guidance | **US-7.2** See Field Limits and Formatting Guidance (F37) | JTBD-04.2 → *Given Jordan types in a character-limited narrative field, when she approaches the limit, then a real-time counter displays and further input is blocked at the limit — no post-draft surprises* | R1 |
| SM-7.3 | Build a structured budget | **US-7.3** Enter a Structured Budget (F38) | JTBD-04.2 → *Given Maria (Finance Contributor) enters budget line items, when totals and subtotals are updated, then they are auto-calculated in real time with no manual override — budget is captured as structured data* | R1 |
| SM-7.4 | Validate budget against opportunity rules | **US-7.4** Validate the Budget Automatically (F39) | JTBD-04.2 → *Given the application has a budget total exceeding the opportunity ceiling, when Maria views the readiness dashboard, then a blocking error with a link to the specific budget line is shown before submission* | R1 |
| SM-7.5 | Attach required documents per section and type | **US-7.5** Fulfill Attachment Requirements by Section and Type (F40) | JTBD-04.2 → *Given Jordan's org must provide an IRS letter for nonprofits, when she selects it from the org document library, then it fulfills the attachment requirement without re-uploading* | R1 |
| SM-7.6 | Replace attachments with version history | **US-7.6** Replace Attachments with Full Version History (F41) | JTBD-03.1 → *Given Priya uploads a new version of the audit report, when the replacement is saved, then the prior version is preserved in history and the submission snapshot captures the current version at submission time* | R1 |
| SM-7.7 | Preview complete submission package | **US-7.7** Preview the Complete Submission Package (F42) | JTBD-04.2 + JTBD-05.1 → *Given Jordan generates the preview, when Sandra reviews it, then all sections, form data, budget, and attachments appear in human-readable GrantFlow-styled format — no grantor-private comments included* | R1 |

---

### Stage 8: Q&A, Clarifications, and Addenda
*Shared | Journey: JRN-01.2, JRN-04.1 (Stage 4) | Epic 8 | Primary Personas: PER-01 Marcus Webb, PER-04 Jordan Kim*

| SM-ID | Activity | Story | NaC (from JTBD) | Release |
|---|---|---|---|---|
| SM-8.1 | Enable and configure Q&A window | **US-8.1** Configure Q&A for an Opportunity (F43) | JTBD-01.3 → *Given Marcus enables Q&A with a configured submission window, when an applicant submits a question outside the window, then the system blocks the submission and shows the window close date* | R1 |
| SM-8.2 | Draft and publish Q&A responses to all applicants | **US-8.2** Publish Q&A Responses Visible to All Applicants (F44) | JTBD-01.3 → *Given Marcus publishes a Q&A response, when the response is saved, then all applicants with started workspaces receive an in-app and email notification within 15 minutes and the response appears on the public page* | R1 |
| SM-8.3 | Access complete immutable Q&A and addenda history | **US-8.3** View the Complete Auditable Q&A and Addenda History (F46) | JTBD-01.3 → *Given the intake window closes, when Marcus or Diana opens the Q&A history, then every question, response, addendum, and date change is listed with timestamp and user attribution — immutable and legally defensible* | R1 |
| SM-8.4 | Receive notifications for addenda and deadline changes | **US-8.4** Receive Notifications When Addenda or Deadlines Change (F47) | JTBD-04.3 → *Given Marcus publishes a deadline extension addendum, when Jordan's workspace is active, then she receives an in-app notification within 15 minutes showing old and new deadline values with a link to the impacted workspace section* | R1 |

---

### Stage 9: Validation and Submission
*Grantee side | Journey: JRN-04.1 (Stage 5–6), JRN-05.1 | Epic 9 | Primary Personas: PER-04 Jordan Kim, PER-05 Sandra Okafor*

| SM-ID | Activity | Story | NaC (from JTBD) | Release |
|---|---|---|---|---|
| SM-9.1 | See field-level validation errors during drafting | **US-9.1** See Validation Errors as I Draft (F48) | JTBD-04.2 → *Given Jordan leaves a required narrative field empty, when she moves to the next field, then an inline error appears immediately and the count in the readiness dashboard header increments* | R1 |
| SM-9.2 | Understand which issues block submission | **US-9.2** Understand Which Validation Issues Block Submission (F49) | JTBD-04.2 → *Given the readiness dashboard shows 3 blocking errors and 2 warnings, when Jordan reviews the list, then Blocking items are shown in red with remediation links and Warnings are shown in yellow — clearly separated* | R1 |
| SM-9.3 | Be prevented from submitting incomplete application | **US-9.3** Be Prevented from Submitting an Incomplete Application (F50) | JTBD-02.1 → *Given any blocking item remains unresolved, when Sandra clicks Submit, then the button is disabled and the full list of blocking items with remediation links is displayed — incomplete applications never enter the intake queue* | R1 |
| SM-9.4 | Certify application as Authorized Representative | **US-9.4** Certify the Application as Authorized Representative (F51) | JTBD-05.1 → *Given Sandra opens the certification step, when she reads and completes it, then the certification is logged as an audit event with timestamp and user attribution, and the submit button activates — completed in < 10 minutes* | R1 |
| SM-9.5 | Receive immutable snapshot and downloadable receipt | **US-9.5** Receive an Immutable Submission Snapshot and Receipt (F52) | JTBD-05.2 → *Given Sandra submits the application, when submission is confirmed, then a downloadable receipt with unique confirmation number and UTC timestamp is generated immediately and accessible from her account at any future point* | R1 |
| SM-9.6 | Access human-readable and machine-readable formats | **US-9.6** Confirm Both Human and Machine-Readable Submission Formats (F53) | JTBD-02.2 → *Given an application is submitted, when Diana opens the intake queue, then both a human-readable package (PDF/HTML) and a structured JSON/XML package are available simultaneously — neither can be modified after generation* | R1 |
| SM-9.7 | Application locked after submission | **US-9.7** Have the Application Locked After Submission (F54) | JTBD-02.2 → *Given an application is submitted, when any team member attempts to edit a field, then the edit is blocked — only formal withdrawal or return-for-correction unlocks it, and all lock events are audit-logged* | R1 |

---

### Stage 10: Intake Queue and Administrative Screening
*Grantor side | Journey: JRN-02.1 | Epic 10 | Primary Persona: PER-02 Diana Reyes*

| SM-ID | Activity | Story | NaC (from JTBD) | Release |
|---|---|---|---|---|
| SM-10.1 | Route submitted applications automatically | **US-10.1** Route Submitted Applications to the Intake Queue Automatically (F55) | JTBD-02.1 → *Given an application is submitted, when Diana opens the intake queue, then the application is already present with its routing assignment — no manual routing or entry is required* | R1 |
| SM-10.2 | View all submission details in intake queue | **US-10.2** View Complete Application Details in the Intake Queue (F56) | JTBD-02.1 → *Given Diana opens the intake queue, when she scans a submitted application row, then submission timestamp, eligibility result, validation summary, attachment status, and funding amount are all visible without opening any individual file* | R1 |
| SM-10.3 | Apply administrative screening disposition | **US-10.3** Apply an Administrative Screening Disposition (F57) | JTBD-02.1 → *Given Diana completes all required screening criteria, when she applies "Accepted for Review," then the disposition is logged with timestamp and user attribution, and the applicant is automatically notified* | R1 |
| SM-10.4 | Send correction or clarification request | **US-10.4** Send a Correction or Clarification Request (F58) | JTBD-02.1 → *Given Diana identifies a missing IRS letter, when she sends the correction request tied to the Attachments section, then the applicant receives a notification with targeted instructions and Diana tracks the status in the queue view — no email required* | R1 |
| SM-10.5 | Preserve original snapshot on correction | **US-10.5** Preserve the Original Submission on Correction (F59) | JTBD-02.2 → *Given Diana issues a correction request and the applicant resubmits, when the corrected version is saved, then the original snapshot is preserved unmodified and both versions are visible in the intake record with linked version history* | R1 |
| SM-10.6 | Route accepted applications to review workflow | **US-10.6** Route Accepted Applications to the Review Workflow (F60) | JTBD-02.3 → *Given Diana applies "Accepted for Review," when the disposition is saved, then the application automatically appears in the review workflow queue and a INTAKE_HANDOFF audit event is logged — no email handoff required* | R1 |

---

### Stage 11: Intake Analytics and Reporting
*Shared | Journey: JRN-01.2 (Stage 4), JRN-02.1 (Stage 6) | Epic 11 | Primary Personas: PER-01 Marcus Webb, PER-02 Diana Reyes, PER-04 Jordan Kim*

| SM-ID | Activity | Story | NaC (from JTBD) | Release |
|---|---|---|---|---|
| SM-11.1 | Monitor intake status on grantor dashboard | **US-11.1** Monitor Intake Status on a Grantor Dashboard (F61) | JTBD-02.1 → *Given the intake window is active, when Marcus or Diana views the dashboard, then application counts (started, submitted, incomplete, late) and disposition summaries update in real time without manual refresh* | R1 |
| SM-11.2 | Track applications on personal applicant dashboard | **US-11.2** Track My Applications on a Personal Dashboard (F62) | JTBD-04.1 + JTBD-03.2 → *Given Jordan has active applications, when she opens her dashboard, then upcoming deadlines with countdown indicators and missing required items with workspace links are displayed — all personalized to her org* | R1 |
| SM-11.3 | Export intake data for reporting and audit | **US-11.3** Export Intake Data for Reporting and Audit (F63) | JTBD-02.2 + JTBD-02.3 → *Given the intake window closes, when Diana exports by opportunity and date range, then a CSV/JSON download includes submission metadata, eligibility results, disposition history, and audit events — grantee-private content excluded* | R1 |

---

## NaC Derivation Table

Full traceability: JTBD outcome → journey stage → NaC → user story

| JTBD-ID | JTBD Outcome | Journey Stage | NaC Statement | Stories |
|---|---|---|---|---|
| JTBD-01.1 | Publish a structured, complete funding opportunity without rework | JRN-01.1 Stage 1: Initiate | Given a grantor selects a template, when the new opportunity is instantiated, then required metadata fields are pre-populated and setup time is under 2 hours | US-1.1, US-1.2 |
| JTBD-01.1 | ≥ 90% first-publish completeness rate | JRN-01.1 Stage 5: Validate and Preview | Given a grantor completes all required metadata fields, when they attempt to publish, then the system validates completeness and allows publication without a second attempt — for ≥ 90% of opportunities | US-1.3, US-1.4, US-1.5 |
| JTBD-01.1 | Immutable audit trail captures publication | JRN-01.1 Stage 6: Publish | Given a grantor publishes an opportunity, when any post-publication modification is made, then a new immutable version record is created with field-level change delta and user attribution | US-1.6, US-3.1 |
| JTBD-01.2 | Zero eligibility questions about system-enforced rules | JRN-01.1 Stage 3: Configure Eligibility | Given an eligibility rule is configured as a hard blocker, when an ineligible applicant completes the pre-screen, then the system surfaces a plain-language explanation and prevents workspace creation — without any grantor intervention | US-2.1, US-2.2, US-2.3, US-5.1, US-5.2, US-5.3 |
| JTBD-01.2 | Required attachments enforced by system | JRN-01.1 Stage 4: Configure Deadlines/Attachments | Given required attachments are configured per applicant type, when an applicant submits without a required document, then the system blocks submission with a targeted missing-attachment error | US-2.5, US-7.5 |
| JTBD-01.3 | 100% Q&A published in-system with equal access | JRN-01.2 Stage 2: Publish Q&A Response | Given a grantor publishes a Q&A response, when the response is saved, then all applicants with started applications receive notification within 15 minutes and the response appears on the public opportunity page | US-8.1, US-8.2, US-8.3 |
| JTBD-01.3 | Complete immutable addenda history for audit | JRN-01.2 Stage 3–5: Issue / Monitor / Audit Addendum | Given a grantor publishes an addendum, when the intake window closes, then every addendum, response, and date change is timestamped, attributed, and immutable in the Q&A history | US-3.4, US-8.3, US-8.4 |
| JTBD-02.1 | Intake cycle time reduced ≥ 30% | JRN-02.1 Stage 1–3: Open Queue / Review / Disposition | Given an application is submitted, when Diana opens the intake queue, then all submission details — eligibility result, validation summary, attachment status, requested amount — are visible without opening any individual file | US-10.1, US-10.2, US-10.3, US-10.4 |
| JTBD-02.1 | Dispositions applied in-system, not spreadsheet | JRN-02.1 Stage 3: Apply Disposition | Given Diana completes required screening criteria, when she applies a disposition, then it is logged with timestamp and attribution and triggers automatic applicant notification | US-2.6, US-10.3, US-11.1 |
| JTBD-02.2 | 100% immutable snapshot coverage with version history | JRN-02.1 Stage 4: Verify Snapshot Preservation | Given Diana issues a correction request and the applicant resubmits, when the corrected version is saved, then the original snapshot is preserved unmodified and both versions are visible in the intake record | US-9.5, US-9.6, US-9.7, US-10.5 |
| JTBD-02.3 | Accepted applications route automatically to review | JRN-02.1 Stage 5: Accept and Route | Given Diana marks an application "Accepted for Review," when the disposition is saved, then the application automatically appears in the review workflow queue and a handoff event is logged | US-10.6, US-11.3 |
| JTBD-03.1 | ≥ 60% field pre-population from org profile | JRN-03.1 Stage 1: Create Organization Profile | Given an org profile is complete, when Jordan opens a new application workspace, then all applicable profile fields are pre-populated without manual entry | US-4.1, US-4.2, US-4.3, US-4.6 |
| JTBD-03.1 | Standard documents reusable without re-upload | JRN-03.1 Stage 2: Upload Document Library | Given Priya uploads a document to the org library, when Jordan attaches it to an application section, then no re-upload is required and version history is maintained | US-4.3, US-7.5, US-7.6 |
| JTBD-03.2 | Zero missed submission deadlines due to expired credentials | JRN-03.1 Stage 2: Upload Document Library | Given a credential expiration date is within 60 days, when Priya views the org profile or workspace, then an in-app warning appears before the credential becomes a submission blocker | US-4.4, US-6.5 |
| JTBD-03.3 | Authorized rep assigned ≥ 48 hrs before deadline | JRN-03.1 Stage 3: Assign Team Roles | Given the org admin designates a user as Authorized Representative, when the designation is saved, then the role is reflected in the readiness dashboard and the submit button is only enabled for that user | US-4.5, US-6.3, US-9.3, US-9.4 |
| JTBD-04.1 | Workspace rated ≥ 4.2 / 5.0; team coordination in-system | JRN-04.1 Stage 1: Open Workspace / Assign Sections | Given Jordan assigns a section to a contributor, when the contributor logs in, then they see only their assigned sections with internal due dates and tasks — without accessing other sections | US-6.1, US-6.2, US-6.3, US-6.4, US-6.6, US-11.2 |
| JTBD-04.2 | ≥ 40% reduction in final-submit blocking errors | JRN-04.1 Stage 2: Monitor Readiness Dashboard | Given a required field is empty during drafting, when Jordan views the readiness dashboard, then the blocking error is listed with a direct link to the source field — before any submission attempt is made | US-6.5, US-7.1, US-7.2, US-7.3, US-7.4, US-9.1, US-9.2, US-9.3 |
| JTBD-04.2 | Submission package preview confirms correctness | JRN-04.1 Stage 5: Generate Preview / Final Review | Given Jordan generates the submission preview, when Sandra reviews it, then all sections, budget, and attachments are visible in human-readable format — grantee-private comments excluded | US-7.7, US-9.4 |
| JTBD-04.3 | Zero missed addenda requiring emergency revision | JRN-04.1 Stage 4: Respond to Addendum | Given a grantor publishes an addendum, when it is saved, then all applicants with in-progress applications receive an in-app notification within 15 minutes, with a link to the addendum and affected sections | US-3.4, US-8.4, US-11.2 |
| JTBD-05.1 | Certification completed in < 10 min; zero permission errors | JRN-05.1 Stage 3: Certify and Submit | Given the Authorized Representative opens the submission package preview, when she completes the certification step, then the system logs the certification as an audit event with timestamp and user attribution, and the submit button becomes active | US-6.5, US-9.3, US-9.4, US-7.7 |
| JTBD-05.2 | 100% receipt generation with UTC timestamp | JRN-05.1 Stage 4: Receive and Download Receipt | Given an application is successfully submitted, when submission is confirmed, then the system immediately generates a downloadable receipt with a unique confirmation number and UTC timestamp, accessible at any future point | US-9.5, US-11.2 |

---

## Release Planning

### R1: MVP — Complete Intake Boundary
**Theme:** End-to-end structured intake — from opportunity creation through application submission and administrative handoff to review  
**Release:** All 60 P0 user stories  
**Stories:** US-1.0 through US-11.3 (all P0 stories)  
**Journey Completeness:** Delivers all 6 persona journeys (JRN-01.1, JRN-01.2, JRN-02.1, JRN-03.1, JRN-04.1, JRN-05.1) in their entirety

| Epic | Stage | Stories | Count |
|---|---|---|---|
| Epic 1 | Program & Opportunity Setup | US-1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6 | 7 |
| Epic 2 | Eligibility & Intake Rules | US-2.1, 2.2, 2.3, 2.4, 2.5, 2.6 | 6 |
| Epic 3 | Opportunity Publication & Discovery | US-3.1, 3.2, 3.3, 3.4 | 4 |
| Epic 4 | Organization Profile & Credential Readiness | US-4.1, 4.2, 4.3, 4.4, 4.5, 4.6 | 6 |
| Epic 5 | Eligibility Pre-Screening | US-5.1, 5.2, 5.3, 5.4 | 4 |
| Epic 6 | Application Workspace | US-6.1, 6.2, 6.3, 6.4, 6.5, 6.6 | 6 |
| Epic 7 | Form, Budget, and Attachment Intake | US-7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7 | 7 |
| Epic 8 | Q&A, Clarifications, and Addenda | US-8.1, 8.2, 8.3, 8.4 | 4 |
| Epic 9 | Validation and Submission | US-9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7 | 7 |
| Epic 10 | Intake Queue & Administrative Screening | US-10.1, 10.2, 10.3, 10.4, 10.5, 10.6 | 6 |
| Epic 11 | Intake Analytics & Reporting | US-11.1, 11.2, 11.3 | 3 |
| **Total** | | | **60** |

**Persona Coverage (R1):**

| Persona | Journey(s) Completed | JTBD Addressed |
|---|---|---|
| PER-01 Marcus Webb (Program Officer) | JRN-01.1, JRN-01.2 | JTBD-01.1, JTBD-01.2, JTBD-01.3 |
| PER-02 Diana Reyes (Intake Administrator) | JRN-02.1 | JTBD-02.1, JTBD-02.2, JTBD-02.3 |
| PER-03 Priya Nair (Organization Administrator) | JRN-03.1 | JTBD-03.1, JTBD-03.2, JTBD-03.3 |
| PER-04 Jordan Kim (Proposal Lead) | JRN-04.1 | JTBD-04.1, JTBD-04.2, JTBD-04.3 |
| PER-05 Sandra Okafor (Authorized Representative) | JRN-05.1 | JTBD-05.1, JTBD-05.2 |

**JTBD Coverage (R1):** All 14 JTBD outcomes (JTBD-01.1 through JTBD-05.2) are addressed in R1. No JTBD is deferred.

---

### R2: Phase 2 — Enhanced Experience Within Intake Boundary
**Theme:** Reduce friction for power users; add opportunity type flexibility, private Q&A, internal review workflows, and improved analytics depth  
**Stories:** 7 deferred features (P2)

| Story Ref | Feature | Description | Personas Served |
|---|---|---|---|
| F3 | Opportunity Type Configuration | Competitive, formula, rolling, invitation-only, continuation, renewal, pass-through subaward types | PER-01 |
| F15 | Saved Opportunities, Notifications, and Comparison | Save opportunities, subscribe to alerts, compare eligibility requirements | PER-03, PER-04 |
| F27 | Ineligible Applicant Exception Submission | Allow ineligible applicants to submit an exception explanation and proceed | PER-01, PER-04 |
| F33 | Applicant-Side Internal Review and Approval | Configure an internal multi-step review and approval workflow before submission | PER-04, PER-05 |
| F45 | Private Applicant-Specific Clarification | Private Q&A channels when permitted by funder policy | PER-01, PER-04 |
| F64 | Validation Failure Analytics | Analytics on common validation failure patterns to improve platform design | PER-01, PER-02 |
| F65 | Portfolio-Level Intake Analytics | Cross-program, cross-funder analytics across cycles | PER-01, PER-02 |

**Persona Coverage (R2):**

| Persona | R2 Benefits |
|---|---|
| PER-01 Marcus Webb | Opportunity type configuration (F3), private Q&A (F45), validation analytics (F64), portfolio analytics (F65) |
| PER-02 Diana Reyes | Validation analytics (F64), portfolio analytics (F65) |
| PER-03 Priya Nair | Saved opportunities and comparison (F15) |
| PER-04 Jordan Kim | Saved opportunities (F15), exception submission (F27), internal approval (F33), private Q&A (F45) |
| PER-05 Sandra Okafor | Internal approval workflow (F33) |

---

### R3: Phase 3 — Advanced Network and Interoperability
**Theme:** Connect GrantsIntake to the broader grants ecosystem — SAM.gov, Grants.gov, common data standards, cross-funder applicant networks  
**Scope:** Not yet fully defined; driven by ecosystem readiness and regulatory requirements

| Capability | Description | Personas Served |
|---|---|---|
| SAM.gov API Integration | Automated UEI/SAM status validation vs. manual entry in R1 | PER-03, PER-01 |
| Grants.gov System-to-System (S2S) Connector | Bidirectional submission interoperability with Grants.gov | PER-01, PER-04, PER-05 |
| Common Data Standard Exports | Export in NIH, NSF, or XBRL common grant data formats | PER-02 |
| Cross-Funder Universal Applicant Profile Network | Share org profile data across funders without per-portal re-entry | PER-03, PER-04 |
| Advanced Portfolio Optimization | AI-assisted opportunity matching and portfolio analysis | PER-01, PER-02 |

**Persona Coverage (R3):**

| Persona | R3 Benefits |
|---|---|
| PER-01 Marcus Webb | Grants.gov S2S, portfolio optimization |
| PER-02 Diana Reyes | Common data standard exports, automated SAM validation |
| PER-03 Priya Nair | SAM API integration, cross-funder profile network |
| PER-04 Jordan Kim | Grants.gov S2S submission, cross-funder profile reuse |
| PER-05 Sandra Okafor | Simplified certification across interconnected portals |

---

## Coverage Analysis

### Persona Coverage Summary

| Persona | R1 | R2 | R3 | All JTBD Addressed? |
|---|---|---|---|---|
| PER-01 Marcus Webb | ✅ Full journey coverage | ✅ Type config, analytics | ✅ S2S, portfolio | Yes (JTBD-01.1, 01.2, 01.3 all in R1) |
| PER-02 Diana Reyes | ✅ Full journey coverage | ✅ Analytics depth | ✅ Export standards | Yes (JTBD-02.1, 02.2, 02.3 all in R1) |
| PER-03 Priya Nair | ✅ Full journey coverage | ✅ Saved opps, comparison | ✅ SAM API, network | Yes (JTBD-03.1, 03.2, 03.3 all in R1) |
| PER-04 Jordan Kim | ✅ Full journey coverage | ✅ Internal approval, private Q&A | ✅ S2S, profile network | Yes (JTBD-04.1, 04.2, 04.3 all in R1) |
| PER-05 Sandra Okafor | ✅ Full journey coverage | ✅ Internal approval | ✅ Cross-portal cert | Yes (JTBD-05.1, 05.2 all in R1) |

### JTBD Coverage Summary

| JTBD-ID | Addressed In | Primary Stories | Status |
|---|---|---|---|
| JTBD-01.1 | R1 | US-1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 3.1 | ✅ Fully addressed |
| JTBD-01.2 | R1 | US-2.1, 2.2, 2.3, 2.5, 5.1, 5.2, 5.3, 7.5 | ✅ Fully addressed |
| JTBD-01.3 | R1 | US-3.4, 8.1, 8.2, 8.3, 8.4 | ✅ Fully addressed |
| JTBD-02.1 | R1 | US-2.6, 5.4, 10.1, 10.2, 10.3, 10.4, 11.1 | ✅ Fully addressed |
| JTBD-02.2 | R1 | US-9.5, 9.6, 9.7, 10.5, 11.3 | ✅ Fully addressed |
| JTBD-02.3 | R1 | US-10.6, 11.3 | ✅ Fully addressed |
| JTBD-03.1 | R1 | US-4.1, 4.2, 4.3, 4.6, 7.5, 7.6 | ✅ Fully addressed |
| JTBD-03.2 | R1 | US-4.4, 6.5 | ✅ Fully addressed |
| JTBD-03.3 | R1 | US-4.5, 6.3, 9.3, 9.4 | ✅ Fully addressed |
| JTBD-04.1 | R1 | US-3.2, 3.3, 6.1, 6.2, 6.3, 6.4, 6.6, 11.2 | ✅ Fully addressed |
| JTBD-04.2 | R1 | US-6.5, 7.1, 7.2, 7.3, 7.4, 7.7, 9.1, 9.2, 9.3 | ✅ Fully addressed |
| JTBD-04.3 | R1 (partial) + R2 enhanced | US-3.4, 8.4, 11.2 (R1); F45 private Q&A (R2) | ✅ Core addressed; R2 adds depth |
| JTBD-05.1 | R1 | US-4.5, 6.5, 7.7, 9.3, 9.4 | ✅ Fully addressed |
| JTBD-05.2 | R1 | US-9.5, 11.2 | ✅ Fully addressed |

### Gap Analysis

**Journey Stages Without Coverage Gaps:**  
All 11 stages have at least one story in R1. No stage is left without coverage.

**JTBD Outcomes Without Coverage Gaps:**  
All 14 JTBD outcomes are addressed by R1 stories. JTBD-04.3 receives additional depth in R2 (F45 private Q&A).

**Orphan Stories (not mapped to any journey stage):**  
None. All 59 MVP user stories are mapped to a journey stage and placed in the story map matrix.

**R2 Gaps to Watch:**  
- F3 (Opportunity Type Configuration) adds flexibility for recurring/rolling programs — grantors using formula or rolling intake patterns may feel constrained in R1.
- F15 (Saved Opportunities) is missing from R1 — applicants must actively search each session; there is no passive monitoring.
- F33 (Internal Review/Approval) means applicants who need multi-person internal sign-off must coordinate informally in R1.
- F64/F65 (Analytics) limits grantor ability to identify systemic validation problems across programs until R2.

**Cross-Persona Convergence Points Covered:**  
All five convergence points from JOURNEYS-GrantsIntake.md are addressed in R1:
- Q&A response publication → applicant notification (US-8.2 → US-8.4)
- Sandra submits → Diana's intake queue (US-9.4 → US-10.1)
- Priya assigns roles → Jordan's workspace readiness (US-4.5 → US-6.5)
- Jordan generates preview → Sandra reviews same preview (US-7.7)
- Diana issues correction request → Jordan coordinates response (US-10.4 → US-6.3)

---

## NaC-to-Acceptance Criteria Mapping

Verification that NaC statements align with formal UserStory acceptance criteria.

| SM-ID | Story | NaC Core Assertion | Verified AC |
|---|---|---|---|
| SM-1.1 | US-1.1 | Template instantiates pre-populated draft; setup under 2 hours | ✅ AC: "Selecting a template instantiates a new draft opportunity pre-populated with template defaults" |
| SM-1.5 | US-1.5 | ≥ 90% pass completeness validation on first publish | ✅ AC: "Clicking 'Publish' triggers a final completeness validation; all blockers must be cleared before publication proceeds" |
| SM-2.1 | US-2.1 | Hard blocker prevents workspace creation | ✅ AC: "At least one eligibility rule must be configured before an opportunity can be published" |
| SM-2.2 | US-2.2 | Hard_blocker disables workspace creation button | ✅ AC: "Hard blockers with enforcement_point = pre_workspace disable the workspace creation button" |
| SM-2.3 | US-2.3 | Responses stored in intake record, visible in screening panel | ✅ AC: "All applicant responses are stored in the intake record and visible in the administrative screening panel" |
| SM-4.1 | US-4.1 | Profile data pre-populates application form fields | ✅ AC: "Profile data pre-populates applicable fields in every new application workspace" |
| SM-4.4 | US-4.4 | 60-day warning in org profile and workspace | ✅ AC: "In-app warnings are displayed when a tracked credential is expired or within a configurable expiration warning window; warnings appear in both the organization profile view and the application workspace readiness checklist" |
| SM-4.5 | US-4.5 | Only Authorized Rep can certify and submit | ✅ AC: "Only users with the Authorized Representative role can certify and submit a final application" |
| SM-6.5 | US-6.5 | Blocking error linked to source field in readiness dashboard | ✅ AC: "All blocking errors are listed with links to the source field or section" |
| SM-7.7 | US-7.7 | Preview excludes grantee-private internal comments | ✅ AC: "The preview shows only content that will appear in the grantor's intake view (grantee-private internal comments are excluded)" |
| SM-8.2 | US-8.2 | All applicants notified within 15 min of Q&A publication | ✅ AC: "Applicants are notified when new answers are published" (15-min SLA from JTBD-01.3 NaC Preview) |
| SM-9.4 | US-9.4 | Certification logged as audit event with timestamp | ✅ AC: "The certification action is logged as an audit event with timestamp and user attribution" |
| SM-9.5 | US-9.5 | Downloadable receipt with UTC timestamp and confirmation number | ✅ AC: "A downloadable receipt is generated and accessible to the applicant team; 100% of submissions generate a receipt with a confirmation number, UTC timestamp, and full audit trail" |
| SM-10.5 | US-10.5 | Original snapshot preserved; both versions visible | ✅ AC: "When a correction is requested and the applicant resubmits, a new versioned snapshot is created — the original is not overwritten; both the original and corrected snapshots are accessible in the intake queue" |
| SM-10.6 | US-10.6 | Accepted apps auto-routed with audit event | ✅ AC: "Applications with an 'Accepted for Review' disposition are automatically routed to the configured review workflow; a INTAKE_HANDOFF audit event is logged" |
| SM-11.2 | US-11.2 | Credential warnings and deadlines surfaced on applicant dashboard | ✅ AC: "Upcoming deadlines are displayed with countdown indicators; missing required items are listed with links to the relevant workspace section" |

**NaC Alignment Summary:**  
All 16 sampled NaC statements are directly verifiable against formal acceptance criteria in UserStories-GrantsIntake.md. NaC statements derived from JTBD outcome measures (15-minute notification SLA, < 10-minute certification, ≥ 60% profile pre-population) complement formal ACs without contradicting them.

---

## Phase 8 Story Map — Grants.gov Opportunity Ingestion

*Added: 2026-09-02 — PRD-INTAKE-019A through 019E*

### Persona: Jordan Kim — Proposal Manager (External Discovery Journey)

| Activity | Step | Story | NaC Statement |
|---|---|---|---|
| Discover Funding | Browse Grants.gov | US-P8.1 | Jordan can browse Grants.gov opportunities without leaving GrantsIntake; page loads within 2 seconds and results are ≤ 6 hours stale |
| Discover Funding | Save opportunity | US-P8.2 | Saving takes one click; saved opportunities persist across sessions and appear on the dashboard |
| Track Opportunities | Receive change alert | US-P8.3 | Jordan receives an in-app alert within the next scheduled refresh cycle (≤ 6 hours) when a saved opportunity's due date changes |
| Research Opportunity | View full details | US-P8.4 | Detail page shows all normalized metadata and every version change with a `changed_fields` diff; source attribution is always visible |
| Start Application | Import to workspace | US-P8.5 | Import creates a pre-populated internal opportunity in ≤ 3 seconds; all 6 normalized metadata fields are carried over without manual re-entry |

### Epic: External Opportunity Discovery

```
Epic: External Opportunity Discovery
├── Feature: Automated Grants.gov Ingestion (PRD-INTAKE-019A)
│   └── US-P8.1 (Browse page, powered by scheduler)
├── Feature: Metadata Normalization (PRD-INTAKE-019B)
│   └── US-P8.1 (Normalized fields displayed in cards/detail)
│   └── US-P8.5 (Normalized fields pre-populate import)
├── Feature: Save, Track, Compare, Import (PRD-INTAKE-019C)
│   └── US-P8.2 (Save/unsave toggle)
│   └── US-P8.5 (Import to internal workspace)
├── Feature: Scheduled Refresh & Change Alerts (PRD-INTAKE-019D)
│   └── US-P8.3 (Alert bell, per-field alerts)
└── Feature: Source Attribution & Version History (PRD-INTAKE-019E)
    └── US-P8.4 (Detail page: attribution footer, version history accordion)
```

### Phase 8 NaC Statements

| SM-ID | Story | NaC Core Assertion | Verified AC |
|---|---|---|---|
| SM-P8.1 | US-P8.1 | Results ≤ 6 hours stale; "Powered by Grants.gov API" badge visible | ✅ AC: "A 'Powered by Grants.gov API' attribution badge is visible on the page" |
| SM-P8.2 | US-P8.2 | Save persists across sessions; appears on dashboard | ✅ AC: "Saved opportunities appear in a 'Saved from Grants.gov' section on my dashboard" |
| SM-P8.3 | US-P8.3 | Alert created within next refresh cycle (≤ 6h) after due_date change | ✅ AC: "Alerts are created automatically on the next scheduled refresh after a change is detected" |
| SM-P8.4 | US-P8.4 | import_timestamp never changes on re-fetch; version history is ordered and immutable | ✅ AC: "`import_timestamp` reflects the first time this opportunity was ingested (not the most recent fetch)" |
| SM-P8.5 | US-P8.5 | Import creates pre-populated internal opportunity; "Imported from Grants.gov" badge shown | ✅ AC: "The imported opportunity shows an 'Imported from Grants.gov' badge in the internal UI" |

---

*Document generated: July 24, 2026 | Last updated: 2026-09-02 — Phase 8 story map added (Grants.gov ingestion)*  
*Source: PERSONAS-GrantsIntake.md, JTBD-GrantsIntake.md, JOURNEYS-GrantsIntake.md, UserStories-GrantsIntake.md, PRD-GrantsIntake.md*
