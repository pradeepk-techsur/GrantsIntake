# Persona Profiles: GrantsIntake

| Field | Value |
|---|---|
| **Product** | GrantsIntake — Dual-Sided Grants Lifecycle Management Platform |
| **Module** | Grants Intake |
| **Document Type** | Persona Profiles |
| **Version** | 1.0 Draft |
| **Date** | July 24, 2026 |
| **Related PRD** | `project_specs/PRD-GrantsIntake.md` |
| **Source PRD** | `project_specs/ref_docs/grants_intake.pdf` (v1.0 Draft) |
| **Derived From** | PRD Section 2.2 Target Users / PDF Section 7 Personas |

---

## Persona Summary Table

| PER-ID | Name | Role | Side | Primary Goal |
|---|---|---|---|---|
| PER-01 | Marcus Webb | Program Officer | Grantor | Publish complete, structured funding opportunities without manual rework |
| PER-02 | Diana Reyes | Grant Intake Administrator | Grantor | Clear the intake queue with clean dispositions and no email-chase corrections |
| PER-03 | Priya Nair | Organization Administrator | Grantee | Maintain a reusable org profile so the team stops re-entering the same data every cycle |
| PER-04 | Jordan Kim | Proposal Lead | Grantee | Coordinate the application team, hit deadlines, and submit without last-minute surprises |
| PER-05 | Sandra Okafor | Authorized Representative | Grantee | Certify and submit the final application with confidence that it is complete and compliant |

---

## PER-01: Marcus Webb

**Role Title:** Program Officer  
**Organization Type:** Federal agency, state/local government, philanthropic foundation, or corporate funder  
**Persona Archetype:** Grantor — Opportunity Builder

**Role & Context:**

Marcus is a Program Officer at a mid-size federal grants agency managing two active funding programs. He owns the funding opportunity from concept through publication — defining program goals, eligibility requirements, review criteria, and funding priorities. Marcus collaborates with compliance analysts and a system administrator, but the opportunity content is his responsibility. He currently builds opportunities in Word documents and emails them to a coordinator who manually uploads content into a legacy portal. The process is inconsistent across programs, and each cycle he receives a wave of applicant questions that reveal ambiguities in his published instructions. Marcus is moderately technical — comfortable with productivity software and web forms — but not a developer.

**Goals:**
- Create structured, complete funding opportunities using configurable templates rather than starting from scratch each cycle (F0, F1)
- Surface plain-language guidance while writing opportunity descriptions so applicant instructions are clear before publication (F2)
- Configure eligibility rules as enforceable system logic, not buried document text, so unqualified applicants are filtered early (F7, F8, F9)
- Publish opportunities with confidence that all required metadata is present and the setup is complete (F5)
- Manage Q&A and addenda in the system rather than via email, ensuring all applicants see the same answers (F43, F44, F46)
- Monitor intake dashboards to track application volume, validation issues, and deadline status across the program (F61)

**Pain Points:**
- Opportunity setup is currently document-heavy, inconsistent across programs, and error-prone (PRD Problem Statement — Grantor pain)
- Eligibility requirements written in narrative documents are not enforced by any system, leading to unqualified submissions
- Applicant Q&A is managed in email with no visibility guarantee — some applicants get answers others never see
- Grantor receives incomplete applications requiring manual rework and clarification cycles before review can begin
- No audit trail exists for opportunity modifications — Marcus has no way to prove what applicants saw at any given time

**Technical Expertise:** Intermediate — proficient with web applications, online forms, and email; not a developer; expects guided workflows with clear validation and error messages

**Top Tasks:**
1. Create a new funding opportunity from a template and configure eligibility rules (every funding cycle, critical)
2. Review and publish the opportunity after completeness validation passes (every cycle, critical)
3. Draft and publish Q&A responses to applicant questions during the open period (ongoing during opportunity window, high)
4. Issue addenda or deadline changes and confirm notifications go to affected applicants (as-needed, high)
5. Monitor intake dashboard for application counts, validation errors, and late submissions (weekly during intake period, medium)

**Success Criteria:**
- ≥ 90% of published opportunities pass required metadata validation on the first publish attempt (PRD Success Metric)
- Zero applicant questions about eligibility requirements that are already captured as system-enforced rules
- Q&A responses published in-system, not distributed via email, for 100% of opportunities managed
- Intake dashboard usability rating ≥ 4.2 / 5.0 (Grantor satisfaction metric)

---

## PER-02: Diana Reyes

**Role Title:** Grant Intake Administrator  
**Organization Type:** Federal agency, state/local government, philanthropic foundation  
**Persona Archetype:** Grantor — Intake Queue Manager and Administrative Screener

**Role & Context:**

Diana is a Grant Intake Administrator responsible for managing the intake queue after applications are submitted. She receives all submitted applications for one or more funding opportunities, conducts administrative screening, applies formal dispositions, and routes accepted applications to the review team. She is the operational hub between applicants and reviewers — managing correction requests, communicating disposition decisions, and ensuring the intake record is clean and complete before handoff. Diana currently works from an email inbox and a shared spreadsheet. She spends significant time chasing missing documents, re-opening PDF attachments to check for signatures, and sending individualized correction emails. She processes 40-120 applications per cycle depending on the program.

**Goals:**
- Access a structured intake queue displaying all submission details — eligibility results, validation summary, attachment status, and requested amounts — without opening individual files (F56)
- Apply formal administrative screening dispositions from a configured checklist rather than tracking outcomes in a spreadsheet (F57, F12)
- Send correction or clarification requests through the system and track applicant responses in one place (F58)
- Ensure original submission snapshots are preserved when corrections are requested, for a complete audit record (F59)
- Route accepted applications to the review workflow with a clean, structured handoff (F60)
- Export intake data for program reporting and compliance audits (F63)

**Pain Points:**
- Currently manages all intake disposition tracking in a shared spreadsheet that is often out of sync with actual application status (PRD Problem Statement — Grantor pain)
- Receives incomplete applications that require email-based clarification cycles — 3-5 back-and-forth messages per application is common
- Administrative screening criteria live in program officer memory or email threads, not in an enforced system checklist
- No immutable record exists of what was submitted versus what corrections were made — version history is not preserved
- Routing accepted applications to reviewers is a manual handoff process with no automated workflow

**Technical Expertise:** Intermediate — fluent with web portals and administrative software; expects clear queue views, filter/sort controls, and action-driven workflows; not a developer

**Top Tasks:**
1. Review intake queue for newly submitted applications and confirm submission completeness (daily during intake period, critical)
2. Apply administrative screening dispositions — accept, return, reject, flag as duplicate or late (daily, critical)
3. Send formal correction or clarification requests to applicants with specific guidance linked to sections (as-needed, high)
4. Route accepted applications to review workflow and confirm handoff is complete (end of screening period, high)
5. Export intake disposition report for program records and audit (end of cycle, medium)

**Success Criteria:**
- Median intake cycle time from submission to administrative disposition reduced by 30% vs. current process (PRD Success Metric)
- Incomplete submission rate (applications returned for missing required data or attachments) below 10% (PRD Success Metric)
- 100% of final submissions have immutable snapshots, confirmation receipts, and full audit trails (Audit completeness metric)
- Intake queue usability rating ≥ 4.2 / 5.0

---

## PER-03: Priya Nair

**Role Title:** Organization Administrator  
**Organization Type:** Nonprofit organization, tribal government, community health center, research institution, or local government  
**Persona Archetype:** Grantee — Profile Owner and Credential Manager

**Role & Context:**

Priya is the Director of Grants and Compliance at a mid-size nonprofit that applies to 15-25 funding opportunities per year across federal, state, and philanthropic funders. She is the administrative anchor of the organization's grants program — responsible for maintaining the organization's legal identity, credentials, registrations, and standard documents. Today, Priya manually re-enters the same organizational data — legal name, EIN, UEI, SAM status, board roster, IRS determination letter — into every portal, every cycle. She also manages team access across multiple portals and frequently scrambles to locate expired documents before submission deadlines. Priya does not write proposals herself; she sets up the infrastructure that allows the Proposal Lead and Finance Contributor to work.

**Goals:**
- Maintain a single reusable organization profile so the team enters org data once and it pre-populates across all applications (F18, F19, F23)
- Store standard documents — IRS determination letter, W-9, audit reports, indirect cost agreement, board roster — in a centralized library that can be attached to any application without re-uploading (F20)
- Receive advance warnings when credentials like SAM registration or audit reports are approaching expiration, before they become submission blockers (F21)
- Assign and manage team roles — proposal lead, finance contributor, authorized representative — with role-based access enforced by the system (F22)
- Ensure the org profile snapshot at submission is preserved as the authoritative record even if profile data is updated afterward (F23)

**Pain Points:**
- Re-enters the same organizational data (EIN, UEI, legal name, address, tax status) into every funder portal — a task she estimates costs 3-4 hours per application cycle (PRD Problem Statement — Applicant pain)
- Credential expiration (SAM registration, IRS letter, insurance certificate) is tracked manually in a spreadsheet and often discovered only when it blocks a submission
- Role assignment and access management across portals is fragmented — there is no single authoritative team roster
- Standard documents are scattered across a shared drive with no version control or expiration tracking
- Authorized representative designation is not formally tracked — it surfaces as confusion at submission time

**Technical Expertise:** Intermediate-to-high — comfortable with web portals, cloud document storage, and online compliance systems; expects a managed, structured admin interface; not a developer

**Top Tasks:**
1. Create and maintain the organization profile with all required legal, registration, and contact data (one-time setup, then ongoing updates, critical)
2. Upload and manage the standard document library — keep versions current and track expiration dates (quarterly or as documents change, high)
3. Assign application roles (proposal lead, finance contributor, authorized representative) for each new application cycle (each cycle, high)
4. Respond to credential expiration warnings and update expired documents before application deadlines (as-needed, high)
5. Confirm profile completeness before a new application is opened (start of each application cycle, medium)

**Success Criteria:**
- ≥ 60% of application fields populated from the reusable organization profile across repeat applications within 12 months (PRD Success Metric)
- Zero missed submission deadlines due to expired credential documents that were not flagged in advance
- Standard documents attached to applications from the library without re-upload for ≥ 80% of applications
- Authorized representative role assigned and confirmed before submission for 100% of applications

---

## PER-04: Jordan Kim

**Role Title:** Proposal Lead  
**Organization Type:** Nonprofit organization, research institution, tribal government, local government  
**Persona Archetype:** Grantee — Application Coordinator and Primary Drafter

**Role & Context:**

Jordan is a Grants Manager and lead proposal writer at a community development organization that applies to 8-12 federal and foundation grants per year. Jordan is the operational owner of each individual application — responsible for coordinating the application team, assigning sections to contributors, managing internal deadlines, writing or reviewing narrative content, and ensuring the application is complete and submission-ready before the deadline. Jordan currently coordinates applications across a shared Google Drive, email threads, and Zoom calls. Tracking who owns which section, which attachments are missing, and whether the budget is finalized is a constant challenge. Jordan also handles Q&A with funders and monitors for addenda that require application changes. Jordan is the person most likely to encounter last-minute blocking errors at submission time.

**Goals:**
- Access a structured application workspace where sections are clearly organized, owned, and tracked — replacing email and shared drive coordination (F29, F30, F31)
- Assign section ownership to team members, set internal deadlines, and create tasks within the workspace (F31)
- Use a readiness dashboard to see overall completion status, blocking errors, missing attachments, and authorized submitter readiness without opening each section manually (F34)
- Validate the application continuously during drafting so blocking errors are resolved early, not discovered at submission (F48, F49)
- Generate a submission package preview to review exactly what the grantor will receive before final certification (F42)
- Track Q&A and addenda in the system so no eligibility clarification or deadline change is missed (F44, F47)
- Manage applicant-side collaboration with private internal comments that stay out of the grantor view (F32)

**Pain Points:**
- Application collaboration happens across email, shared drives, and disconnected forms — there is no single workspace (PRD Problem Statement — Applicant pain)
- Fatal validation errors surface at the moment of submission, not during drafting — Jordan has had to miss deadlines to fix last-minute blockers
- No single readiness view exists — Jordan must manually open every section to confirm completeness before submission
- Q&A and addenda updates from grantors arrive by email, are easily missed, and sometimes invalidate sections already drafted
- Role confusion — the authorized representative is often not assigned or aware of their submit obligation until the final hours

**Technical Expertise:** Intermediate — highly proficient with web-based collaboration tools, document management, and grant portals; expects a structured but accessible interface without requiring technical expertise

**Top Tasks:**
1. Open the application workspace, assign section owners, and set internal deadlines at the start of each application cycle (per application, critical)
2. Review the readiness dashboard daily during active drafting to identify and clear blocking errors (daily during active period, critical)
3. Draft and revise narrative sections, review contributor sections, and coordinate budget with finance contributor (ongoing, high)
4. Monitor the opportunity page for Q&A updates and addenda; update impacted application sections as needed (ongoing during window, high)
5. Generate the submission package preview and conduct a final review before passing to the authorized representative (pre-submission, critical)

**Success Criteria:**
- ≥ 40% reduction in final-submit blocking errors after continuous validation is active (PRD Success Metric)
- Readiness dashboard shows all missing required items before the authorized representative attempts to submit
- Zero missed addenda or deadline changes that required emergency application changes
- Application workspace rating ≥ 4.2 / 5.0 on applicant satisfaction survey (PRD Success Metric)

---

## PER-05: Sandra Okafor

**Role Title:** Authorized Representative / Executive Director  
**Organization Type:** Nonprofit organization, tribal government, local government unit, research institution  
**Persona Archetype:** Grantee — Legal Certifier and Final Submitter

**Role & Context:**

Sandra is the Executive Director of a community health nonprofit. She holds legal signing authority for all grant applications and is designated as the Authorized Representative. Sandra does not write proposals or manage application details — that is Jordan's domain. Sandra's intake role is narrow but legally critical: she reviews the final submission package, certifies compliance with applicable regulations, and submits the application. Sandra currently discovers her submit obligation at the last moment, often receiving a panicked email asking her to log into a portal she has never used, complete a certification she has not reviewed, and submit by end of day. She has occasionally been unable to submit because her account did not have the required permission, or because she was traveling and did not have portal access on her phone.

**Goals:**
- Have her Authorized Representative role explicitly designated in the system before the final submission stage — not assigned at the last minute (F22)
- Receive clear notification when the application is ready for her review and final certification — before it becomes urgent (F34, notification model)
- Review the submission package in a human-readable format that shows exactly what is being submitted, without requiring her to navigate every section (F42, F53)
- Complete the certification action with legally appropriate language that is clear and traceable (F51)
- Receive a downloadable submission receipt with confirmation number and timestamp as proof of timely submission (F52)

**Pain Points:**
- Submit authority is unclear or established too late — Sandra is frequently unaware she is the designated submitter until the day of the deadline (PRD Problem Statement — Applicant pain; Source PRD Section 7.2)
- Has been blocked from submitting in other portals because her account lacked the correct permission or her session expired
- The certification step is often buried or unclear — Sandra cannot always tell what she is legally certifying
- No portable submission receipt exists for her records — she currently screenshots a confirmation page that sometimes disappears
- Application corrections requested by grantors sometimes arrive without clear explanation of what changed — creating uncertainty about whether re-certification is required

**Technical Expertise:** Low-to-intermediate — comfortable with email, mobile web, and signing workflows; expects a simple, clear, mobile-accessible submission experience; does not expect to navigate a complex workspace

**Top Tasks:**
1. Receive notification that the application is ready for certification and review (end of application cycle, critical)
2. Review the human-readable submission package preview and confirm contents are accurate (pre-submission, critical)
3. Complete the final certification and submit the application (submission deadline, critical)
4. Download or save the submission receipt with confirmation number and timestamp (post-submission, high)
5. Review and act on any correction or clarification requests returned from the grantor after screening (post-submission, as-needed)

**Success Criteria:**
- Authorized representative role assigned and confirmed in the system ≥ 48 hours before submission deadline for 100% of applications
- Submission certification completed in under 10 minutes when package is ready and role is assigned
- 100% of submissions generate a downloadable receipt with UTC timestamp and confirmation number (PRD Audit completeness metric)
- Zero submission failures attributable to missing role permissions or unclear certification workflow

---

## Persona Relationships

| Interaction | Personas | Description |
|---|---|---|
| Opportunity Setup ↔ Configuration | PER-01 ↔ Grantor System Admin (out of scope as primary persona) | Marcus configures eligibility logic and form rules with system admin support |
| Intake Queue ↔ Published Opportunity | PER-01 → PER-02 | Marcus publishes opportunities; Diana manages the intake queue that receives resulting submissions |
| Intake Disposition ↔ Correction Request | PER-02 → PER-04 | Diana sends correction requests to the applicant team; Jordan coordinates the correction response |
| Profile Setup ↔ Application Coordination | PER-03 → PER-04 | Priya sets up the org profile and role assignments; Jordan uses them in the application workspace |
| Role Assignment ↔ Certification | PER-03 → PER-05 | Priya designates Sandra as Authorized Representative; Sandra certifies and submits |
| Drafting ↔ Final Review | PER-04 → PER-05 | Jordan completes the application and hands off to Sandra for certification and submission |
| Submission ↔ Intake Queue | PER-05 → PER-02 | Sandra's submission enters Diana's intake queue for administrative screening |
| Q&A ↔ Application Update | PER-01 → PER-04 | Marcus publishes Q&A and addenda; Jordan monitors and updates the application accordingly |

---

## Feature-Persona Matrix

**Key:** P = Primary user of this feature | S = Secondary / affected user | — = Not applicable

| Feature ID | Feature Name | PER-01 Program Officer | PER-02 Intake Admin | PER-03 Org Admin | PER-04 Proposal Lead | PER-05 Auth Rep |
|---|---|---|---|---|---|---|
| **Stage 1: Opportunity Setup** | | | | | | |
| F0 | Opportunity Creation from Configurable Templates | P | — | — | — | — |
| F1 | Structured Opportunity Metadata Capture | P | S | — | S | — |
| F2 | Plain-Language Guidance Prompts | P | — | — | S | — |
| F4 | Intake Windows and Deadline Configuration | P | S | — | S | S |
| F5 | Opportunity Setup Completeness Validation | P | — | — | — | — |
| F6 | Opportunity Versioning and Audit Trail | P | S | — | — | — |
| **Stage 2: Eligibility & Intake Rules** | | | | | | |
| F7 | Eligibility Rule Definition | P | S | — | S | — |
| F8 | Hard Eligibility Blockers vs. Advisory Fit Indicators | P | S | — | S | — |
| F9 | Configurable Pre-Screening Questionnaires | P | S | — | S | — |
| F10 | Conditional Forms and Sections | P | — | — | S | — |
| F11 | Required Attachments and Evidence Configuration | P | S | — | S | — |
| F12 | Administrative Screening Criteria Configuration | P | P | — | — | — |
| **Stage 3: Opportunity Publication & Discovery** | | | | | | |
| F13 | Applicant-Facing Opportunity Portal Publication | P | — | S | S | — |
| F14 | Search and Filtering | S | — | S | P | — |
| F16 | Public Opportunity Pages and Authenticated Workspaces | S | — | S | P | S |
| F17 | Opportunity Changes and Addenda Display | P | — | — | P | S |
| **Stage 4: Organization Profile & Credential Readiness** | | | | | | |
| F18 | Reusable Organization Profile | — | S | P | S | — |
| F19 | Organization Profile Data Capture | — | S | P | S | — |
| F20 | Reusable Standard Attachments Library | — | S | P | S | — |
| F21 | Credential Expiration Warnings | — | — | P | S | S |
| F22 | Organization Role Assignment | — | — | P | S | S |
| F23 | Profile Reuse with Submission Snapshots | — | S | P | S | S |
| **Stage 5: Eligibility Pre-Screening** | | | | | | |
| F24 | Eligibility Pre-Screen Workflow | S | S | S | P | — |
| F25 | Eligibility Result Display | — | S | S | P | — |
| F26 | Eligibility Blocker Explanation | — | S | S | P | — |
| F28 | Eligibility Response Storage | S | P | — | S | — |
| **Stage 6: Application Workspace** | | | | | | |
| F29 | One Workspace Per Organization Per Opportunity | — | S | S | P | — |
| F30 | Structured Workspace Sections | S | — | — | P | S |
| F31 | Section Ownership, Tasks, and Contributor Assignments | — | — | S | P | S |
| F32 | Private Internal Applicant Comments | — | — | — | P | S |
| F34 | Readiness Dashboard | — | — | S | P | P |
| F35 | Draft Privacy Until Submission | S | — | — | P | — |
| **Stage 7: Form, Budget, and Attachment Intake** | | | | | | |
| F36 | Configurable Form Field Types | P | — | — | S | — |
| F37 | Form Constraints and Formatting Guidance | S | — | — | P | — |
| F38 | Structured Budget Capture | S | — | — | S | — |
| F39 | Budget Validation | S | S | — | S | — |
| F40 | Attachment Requirements by Section and Applicant Type | S | S | S | P | — |
| F41 | Attachment Document Versioning | — | S | P | S | — |
| F42 | Submission Package Preview | — | — | — | P | P |
| **Stage 8: Q&A, Clarifications, and Addenda** | | | | | | |
| F43 | Grantor Q&A Configuration | P | S | — | — | — |
| F44 | Public Q&A Response Publishing | P | — | — | S | — |
| F46 | Auditable Q&A and Addenda History | P | P | — | S | — |
| F47 | Applicant Notifications for Addenda and Changes | S | — | — | P | S |
| **Stage 9: Validation and Submission** | | | | | | |
| F48 | Continuous Validation During Drafting | — | — | — | P | — |
| F49 | Validation Message Classification | — | — | — | P | S |
| F50 | Submission Blocking | S | S | — | P | S |
| F51 | Authorized Representative Certification | — | S | — | S | P |
| F52 | Immutable Submission Snapshot and Receipt | S | P | S | S | P |
| F53 | Human-Readable and Machine-Readable Submission Package | S | P | — | S | P |
| F54 | Post-Submission Edit Prevention | — | P | — | S | S |
| **Stage 10: Intake Queue & Administrative Screening** | | | | | | |
| F55 | Intake Queue Routing | S | P | — | — | — |
| F56 | Intake Queue Display | S | P | — | — | — |
| F57 | Administrative Screening Dispositions | S | P | — | — | — |
| F58 | Correction and Clarification Requests | S | P | — | S | S |
| F59 | Original Submission Snapshot Preservation on Correction | — | P | — | S | S |
| F60 | Accepted Application Routing to Review | S | P | — | — | — |
| **Stage 11: Intake Analytics & Reporting** | | | | | | |
| F61 | Grantor Intake Dashboards | P | P | — | — | — |
| F62 | Applicant Dashboards | — | — | S | P | S |
| F63 | Intake Data Export | S | P | — | — | — |

---

*Document generated: July 24, 2026 | Derived from: PRD-GrantsIntake.md and grants_intake.pdf (v1.0 Draft)*
