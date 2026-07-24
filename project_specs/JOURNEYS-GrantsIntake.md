# User Journey Maps: GrantsIntake

| Field | Value |
|---|---|
| **Product** | GrantsIntake — Dual-Sided Grants Lifecycle Management Platform |
| **Module** | Grants Intake |
| **Document Type** | User Journey Maps |
| **Version** | 1.0 Draft |
| **Date** | July 24, 2026 |
| **Related Personas** | `project_specs/PERSONAS-GrantsIntake.md` |
| **Related JTBD** | `project_specs/JTBD-GrantsIntake.md` |
| **Related PRD** | `project_specs/PRD-GrantsIntake.md` |
| **Project Context** | `.planning/PROJECT.md` |

---

## Journey Index

| JRN-ID | Persona | Scenario | Key JTBD | Stages |
|---|---|---|---|---|
| JRN-01.1 | PER-01 Marcus Webb (Program Officer) | Creating and publishing a new funding opportunity from a template | JTBD-01.1, JTBD-01.2 | 6 |
| JRN-01.2 | PER-01 Marcus Webb (Program Officer) | Managing applicant Q&A and issuing an addendum mid-window | JTBD-01.3 | 5 |
| JRN-02.1 | PER-02 Diana Reyes (Intake Administrator) | Processing the intake queue and applying administrative screening | JTBD-02.1, JTBD-02.2, JTBD-02.3 | 6 |
| JRN-03.1 | PER-03 Priya Nair (Organization Administrator) | Setting up the org profile and preparing credential readiness for a new application cycle | JTBD-03.1, JTBD-03.2, JTBD-03.3 | 5 |
| JRN-04.1 | PER-04 Jordan Kim (Proposal Lead) | Coordinating the application team and resolving blocking errors before the deadline | JTBD-04.1, JTBD-04.2, JTBD-04.3 | 6 |
| JRN-05.1 | PER-05 Sandra Okafor (Authorized Representative) | Certifying and submitting the final application and securing the submission receipt | JTBD-05.1, JTBD-05.2 | 5 |

---

## PER-01: Marcus Webb — Program Officer

---

### JRN-01.1: Creating and Publishing a New Funding Opportunity

**Persona:** PER-01 — Marcus Webb, Program Officer  
**Scenario:** Marcus is opening a new funding cycle for his agency's community resilience grant program. He must create a structured funding opportunity, configure eligibility rules, set deadlines, and publish the opportunity to the applicant portal — all without the Word-document-and-email handoff that currently creates errors and inconsistency.  
**Related Jobs:** JTBD-01.1, JTBD-01.2  

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point (Before System) | Opportunity (With System) |
|---|---|---|---|---|---|---|
| **1. Initiate** | Logs into the grantor portal and selects "Create New Opportunity" | Grantor dashboard, Opportunity creation entry point (F0) | "I need to open this cycle by Friday — let me get the template loaded before I start writing." | Focused, slightly rushed | Previously had to open last cycle's Word doc and manually strip old information — inconsistent across programs | Template library organized by program type; prior-cycle templates pre-populate repeating fields, reducing setup to under 2 hours |
| **2. Configure Metadata** | Selects the Community Resilience template, fills in structured metadata fields: title, opportunity number, funding range, key dates, eligibility summary, contact info | Opportunity metadata form (F1), Plain-language guidance prompts (F2) | "Do I need an Assistance Listing number here? The prompt is asking — good, I always forget that." | Confident, occasionally pausing | Metadata was free-form in Word; inconsistency across programs led to missing required fields discovered only by applicants | Required metadata fields clearly labeled with plain-language guidance prompts; 2 CFR 200.204 fields pre-structured; in-line help text explains each field |
| **3. Configure Eligibility** | Opens eligibility rule builder; adds rules for nonprofit status (required), geography (state-specific), SAM registration (hard blocker), and prior-award exclusion (advisory warning) | Eligibility rule builder (F7, F8), Pre-screening questionnaire builder (F9) | "I want SAM to be a hard block — I'm tired of getting applications from unregistered entities. Prior award exclusion is more of a flag." | Determined | Eligibility rules were buried in narrative paragraphs; unqualified applicants submitted full applications Marcus then manually rejected | Hard blockers vs. advisory warnings configured at rule level; pre-screening questionnaire drives eligibility determination before workspace access; system enforces — no narrative interpretation required |
| **4. Configure Deadlines and Attachments** | Sets open date, close date, LOI deadline; configures required attachments by applicant type (IRS letter, W-9, indirect cost agreement) | Intake window configuration (F4), Required attachments configuration (F11) | "If I don't configure the attachments here, I'll get a wave of incomplete submissions with missing IRS letters again." | Cautious, methodical | Attachment requirements were listed in document text; not enforced by any system — applicants missed them regularly | Attachment requirements configured per opportunity and applicant type; system enforces required attachment completion before submission is permitted |
| **5. Validate and Preview** | Runs setup completeness validation; reviews the publication readiness checklist; previews the applicant-facing opportunity page | Completeness validation (F5), Opportunity preview (F13) | "Let me make sure I haven't missed anything before I publish. The checklist shows three items — I need to add administrative screening criteria." | Relieved to see the checklist, slightly anxious about gaps | No completeness check existed — Marcus discovered missing required fields only when applicants asked about them | Publication readiness checklist blocks publish until all required fields are complete; opportunity preview lets Marcus see exactly what applicants will see before he publishes |
| **6. Publish** | Clears remaining checklist items; clicks "Publish Opportunity"; confirms the opportunity is live and applicant-visible | Opportunity publication (F13), Opportunity versioning (F6) | "Published. The audit trail shows the timestamp. That's new — I actually have proof of what I published and when." | Satisfied, relieved | No audit trail for opportunity modifications; Marcus had no way to prove what applicants saw at any point | Immutable audit trail captures publication timestamp and content; every future modification versioned; opportunity is now live on applicant portal |

#### Key Moments
- **Decision Point (Stage 3):** Marcus chooses whether SAM registration is a hard blocker or an advisory warning. Wrong choice = unqualified applicants waste effort or valid applicants are blocked. System enforces the distinction explicitly.
- **Risk of Abandonment (Stage 4):** If attachment configuration is complex or confusing, Marcus may skip it and fall back to listing requirements in a text field — defeating system enforcement. The attachment configurator must be low-friction.
- **Delight Opportunity (Stage 5):** Seeing the publication readiness checklist surface missing administrative screening criteria before publication is a "the system caught something I would have missed" moment that builds trust.

#### Success Outcome
Marcus publishes the opportunity in under 2 hours with all required metadata present and eligibility rules enforced as system logic. No applicant questions about eligibility requirements configured as hard rules. ≥ 90% of opportunities pass completeness validation on first publish attempt (JTBD-01.1 success measure).

#### Feature Touchpoints

| Stage | Features |
|---|---|
| Initiate | F0 (Opportunity Creation from Templates) |
| Configure Metadata | F1 (Structured Metadata Capture), F2 (Plain-Language Guidance Prompts) |
| Configure Eligibility | F7 (Eligibility Rule Definition), F8 (Hard Blockers vs. Advisory), F9 (Configurable Pre-Screening Questionnaires) |
| Configure Deadlines / Attachments | F4 (Intake Windows and Deadline Configuration), F11 (Required Attachments Configuration) |
| Validate and Preview | F5 (Opportunity Setup Completeness Validation), F13 (Opportunity Portal Publication) |
| Publish | F6 (Opportunity Versioning and Audit Trail), F13 (Applicant-Facing Portal) |

---

### JRN-01.2: Managing Applicant Q&A and Issuing a Mid-Window Addendum

**Persona:** PER-01 — Marcus Webb, Program Officer  
**Scenario:** During the active application window, Marcus receives an applicant question that reveals an ambiguity in the eligibility section. He also needs to extend the submission deadline by one week due to an agency review delay. Both communications must reach all applicants simultaneously — not just the one who asked.  
**Related Jobs:** JTBD-01.3  

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point (Before System) | Opportunity (With System) |
|---|---|---|---|---|---|---|
| **1. Receive Question** | Opens the Q&A inbox in the grantor portal; sees a new applicant question about whether community land trusts qualify as nonprofit entities | Q&A management (F43), Q&A and addenda history (F46) | "This question is valid — if one applicant is asking, others probably have the same confusion. I need to answer this publicly, not just reply to this one person." | Thoughtful, slightly frustrated at the ambiguity | Marcus previously replied by individual email; other applicants never saw the answer; created fairness and legal exposure concerns | All applicant questions routed to the Q&A inbox; Marcus drafts a public response that publishes simultaneously to all applicants |
| **2. Draft and Publish Q&A Response** | Drafts a plain-language clarification that community land trusts with 501(c)(3) status qualify; previews the response; publishes it | Public Q&A response publishing (F44), Applicant notifications (F47) | "I want to be specific here — 'nonprofit status' means 501(c)(3) for this program. Let me make sure the answer is clear before I publish." | Deliberate, careful | No in-system Q&A publishing existed; Marcus used email — some applicants received answers, others did not; unfair and unverifiable | Published Q&A response is visible on the opportunity page to all applicants; in-app and email notifications sent automatically within 15 minutes of publication; response timestamped in Q&A history |
| **3. Issue Deadline Extension Addendum** | Creates an addendum to extend the submission deadline by 7 days; documents the reason (agency review delay); publishes the addendum | Opportunity changes and addenda display (F17), Auditable addenda history (F46), Applicant notifications (F47) | "I need all applicants with started applications to see this deadline change. And I need a record that I changed it, when, and why." | Responsible, focused on equity | Deadline changes were emailed to known contacts only; applicants who had not yet asked questions were missed; no audit record existed | Addendum published in-system with timestamp and attribution; all applicants with started or saved applications receive in-app and email notifications; deadline change prominently displayed in applicant workspace countdown |
| **4. Monitor Response** | Reviews the Q&A history to confirm the response is live; checks notification delivery log; scans intake dashboard for any new questions following the clarification | Intake dashboard (F61), Q&A and addenda history (F46) | "The clarification is live. I can see the timestamp and who published it. Now I'll monitor for follow-up questions over the next 48 hours." | Settled, monitoring | No visibility into whether applicants received or acknowledged notifications; Marcus operated blind after sending emails | Notification delivery confirmed in system log; Q&A history shows timestamped, attributable record; Marcus can see whether new questions arrive in the next window |
| **5. Complete and Audit** | At the close of the opportunity, reviews the full Q&A and addenda history as a record of official applicant communications | Auditable Q&A and addenda history (F46), Opportunity versioning (F6) | "If anyone disputes what they were told, I have the complete record here. Every response, every addendum, with timestamps." | Confident, legally protected | No immutable record of official communications existed — Marcus relied on email archives that were searchable but not authoritative | Complete, immutable Q&A and addenda history timestamped and attributable; legally defensible record of all official communications available for any future dispute or audit |

#### Key Moments
- **Decision Point (Stage 2):** Marcus must decide whether to publish a response that may invite follow-up questions or flag the ambiguity as a potential eligibility rule amendment. System supports both paths without friction.
- **Risk of Abandonment (Stage 3):** If publishing addenda is complex or requires multiple approval steps, Marcus may send an email instead — defeating the purpose. The addendum workflow must be as fast as composing an email.
- **Delight Opportunity (Stage 4):** Seeing a notification delivery log confirming all applicants were notified is a new experience — the system removes a long-standing source of anxiety about whether communications reached everyone.

#### Success Outcome
Q&A responses and the deadline addendum are published in-system and all applicants with started applications receive notifications within 15 minutes. The full Q&A and addenda history is timestamped and attributable, providing a legally defensible record of official applicant communications (JTBD-01.3 success measure).

#### Feature Touchpoints

| Stage | Features |
|---|---|
| Receive Question | F43 (Grantor Q&A Configuration), F46 (Auditable Q&A and Addenda History) |
| Draft and Publish Response | F44 (Public Q&A Response Publishing), F47 (Applicant Notifications for Addenda) |
| Issue Addendum | F17 (Opportunity Changes and Addenda Display), F46, F47 |
| Monitor Response | F61 (Grantor Intake Dashboards), F46 |
| Complete and Audit | F46, F6 (Opportunity Versioning and Audit Trail) |

---

## PER-02: Diana Reyes — Grant Intake Administrator

---

### JRN-02.1: Processing the Intake Queue and Applying Administrative Screening

**Persona:** PER-02 — Diana Reyes, Grant Intake Administrator  
**Scenario:** The intake window for a community health grant has closed. Diana has 78 submitted applications to process. She must review each submission for administrative completeness, apply formal dispositions, send correction requests where needed, preserve the submission record, and route accepted applications to the review team — all without email back-and-forth or spreadsheet tracking.  
**Related Jobs:** JTBD-02.1, JTBD-02.2, JTBD-02.3  

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point (Before System) | Opportunity (With System) |
|---|---|---|---|---|---|---|
| **1. Open Intake Queue** | Logs into the grantor portal; navigates to the intake queue for the Community Health Grant opportunity; sees all 78 submitted applications with status indicators | Intake queue display (F56), Intake queue routing (F55) | "78 submissions. Let me filter for the ones that failed eligibility pre-screening first — those are easy dispositions." | Focused, task-oriented | Previously opened a shared spreadsheet and manually matched it against email submissions and PDF attachments — frequently out of sync | Intake queue displays all submissions with submission timestamp, eligibility pre-screen result, validation summary, attachment status, and requested amount — without opening individual files |
| **2. Review Submission Details** | Selects a submission flagged for missing attachments; reviews the eligibility result, validation summary, and attachment checklist in the screening panel without downloading individual files | Intake queue display (F56), Eligibility response storage (F28) | "The validation summary shows a missing IRS determination letter. I don't need to open the whole application to know that — it's right here in the panel." | Efficient, satisfied with the view | Had to download and manually open PDF attachments one by one to identify missing documents — 3-5 minutes per application | Screening panel surfaces all required information: eligibility pre-screen responses, validation summary, attachment completeness, and requested amount — in a single structured view |
| **3. Apply Disposition and Send Correction Request** | Selects "Returned for Correction" disposition; specifies the missing IRS determination letter as the correction required; links the request to the Attachments section; sends the correction request through the system | Administrative screening dispositions (F57), Correction and clarification requests (F58) | "The correction request is tied to the specific section — the applicant won't have to guess what I need. And I'll see their response in the system, not my inbox." | Purposeful, relieved | Sent individualized correction emails from her personal inbox; tracked responses in a side spreadsheet; no single place to see what correction was outstanding vs. resolved | Correction request sent through system, tied to specific section, tracked in one place; applicant receives system notification with targeted instructions; Diana tracks status in the queue view |
| **4. Verify Snapshot Preservation** | After the correction request is sent, checks that the original submission snapshot is preserved; confirms the application is in "Awaiting Correction" state with version history linked | Original submission snapshot preservation (F59), Immutable submission snapshot (F52) | "The original is locked. Good. When they resubmit, I'll see both versions. No one can claim the original didn't have the problem." | Confident, legally protected | No immutable submission record existed; corrections silently overwrote earlier versions; Diana had no way to prove what was originally submitted | Original submission snapshot preserved on correction request — not overwritten; corrected resubmission creates a new versioned snapshot alongside the original; both accessible with linked version history |
| **5. Accept and Route to Review** | After reviewing 12 complete applications, selects all 12 and applies "Accepted for Review" disposition; confirms automatic routing to the review workflow; reviews the handoff log | Administrative screening dispositions (F57), Accepted application routing (F60), Intake data export (F63) | "Routing to review is one action. Last cycle I had to email the review team a list and attach PDF copies. This is so much cleaner." | Relieved, efficient | Manually emailed the review team with accepted applications list and attached PDF copies; reviewer access was provisioned ad-hoc; no structured handoff confirmation existed | Accepted applications automatically routed to review workflow on disposition; handoff event logged with timestamp and attribution; review access provisioned automatically; Diana receives handoff confirmation in the queue |
| **6. Export Disposition Report** | At the end of the screening cycle, exports the intake disposition report for program records and audit | Intake data export (F63), Grantor intake dashboards (F61) | "I need this export for the compliance folder. I can filter by disposition state and date range — this would have taken me an afternoon to compile from the spreadsheet." | Satisfied, thorough | Compiled intake reports manually from spreadsheet data and email archives — a 3-4 hour task at end of cycle | Export available directly from the intake queue by opportunity, date range, and disposition state; includes submission metadata, eligibility results, disposition history, and audit events in CSV or structured format |

#### Key Moments
- **Decision Point (Stage 3):** Diana decides whether to return an application for correction or apply a harder disposition (Ineligible, Administratively Rejected). The system surfaces the configured administrative screening checklist to support this decision.
- **Risk of Abandonment (Stage 2):** If the screening panel requires opening individual files to see attachment status, Diana will revert to her spreadsheet-and-PDF workflow. The single-panel view is critical to adoption.
- **Delight Opportunity (Stage 5):** One-click routing of accepted applications to review — replacing the manual email handoff — is the clearest operational win Diana will experience in the first cycle.

#### Success Outcome
Diana processes 78 applications with clean, traceable dispositions applied directly in the system. Intake cycle time from submission to administrative disposition is reduced by ≥ 30% vs. the prior email-and-spreadsheet process. 100% of final submissions have immutable snapshots and linked version histories. Accepted applications route to review automatically with no manual handoff email (JTBD-02.1, 02.2, 02.3 success measures).

#### Feature Touchpoints

| Stage | Features |
|---|---|
| Open Intake Queue | F55 (Intake Queue Routing), F56 (Intake Queue Display) |
| Review Submission Details | F56, F28 (Eligibility Response Storage) |
| Apply Disposition / Correction Request | F57 (Administrative Screening Dispositions), F58 (Correction and Clarification Requests) |
| Verify Snapshot Preservation | F59 (Original Submission Snapshot Preservation), F52 (Immutable Submission Snapshot) |
| Accept and Route | F57, F60 (Accepted Application Routing to Review), F63 (Intake Data Export) |
| Export Disposition Report | F63, F61 (Grantor Intake Dashboards) |

---

## PER-03: Priya Nair — Organization Administrator

---

### JRN-03.1: Setting Up the Org Profile and Preparing Credential Readiness

**Persona:** PER-03 — Priya Nair, Organization Administrator  
**Scenario:** Priya is onboarding her organization to GrantsIntake for the first time. She must create the organization profile, upload standard documents to the reusable library, configure credential expiration tracking, and assign team roles — so that when Jordan Kim opens the first application workspace, the profile pre-populates and the team is ready to work.  
**Related Jobs:** JTBD-03.1, JTBD-03.2, JTBD-03.3  

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point (Before System) | Opportunity (With System) |
|---|---|---|---|---|---|---|
| **1. Create Organization Profile** | Logs into the grantee portal; navigates to Organization Settings; creates a new org profile with legal name, EIN, UEI, entity type, SAM status, tax status, address, and primary contacts | Organization profile data capture (F19), Reusable organization profile (F18) | "If I fill this in correctly once, we should never have to re-enter EIN or UEI again. Let me be careful here — this is the master record." | Careful, hopeful | Previously re-entered the same org data into every funder portal — an estimated 3-4 hours per application cycle; no master record existed | Organization profile is the single source of truth; data entered once and pre-populated across all applications; required fields clearly labeled with validation; profile persists across all opportunities |
| **2. Upload Standard Document Library** | Navigates to the Document Library section; uploads IRS determination letter, W-9, most recent audit report, indirect cost agreement, and board roster; sets expiration dates for each time-sensitive document | Reusable standard attachments library (F20), Credential expiration warnings (F21) | "The IRS letter expires in 14 months. The audit report expires in 9 months. I'll set those now so I get a warning before they become blockers." | Organized, methodical | Standard documents were scattered across a shared drive with no version control, no expiration tracking; discovered expired documents only when a submission was blocked | Documents stored at org level, attachable to any application without re-upload; expiration dates tracked per document; system issues in-app warnings when credentials enter the configurable expiration window |
| **3. Assign Team Roles** | Opens Team Management; assigns Jordan Kim as Proposal Lead, Maria Santos as Finance Contributor, and designates Sandra Okafor as Authorized Representative; confirms role assignments with each team member | Organization role assignment (F22) | "Sandra needs to know she's the Authorized Representative before a deadline arrives — I'm assigning her now, not at 4pm on the day we submit." | Responsible, proactive | Role assignments were communicated informally via email; Authorized Representative was not formally tracked; role confusion surfaced at submission time | System-enforced role assignment with explicit Authorized Representative designation; role assignments visible to all team members; submission button enabled only for designated Authorized Representative |
| **4. Confirm Profile Completeness** | Reviews the profile completeness indicator; confirms all required fields are complete; checks the document library expiration status summary | Reusable organization profile (F18), Credential expiration warnings (F21), Readiness dashboard (F34) | "The profile looks complete. The W-9 has no expiration date — that's fine. The audit report has 9 months — I've set a 60-day warning. Good." | Confident, satisfied | No completeness check existed for org profiles; Priya discovered gaps only when a funder required something that was missing | Profile completeness indicator shows required vs. completed fields; expiration warning calendar shows upcoming credential risks; summary view gives Priya a single-pane readiness check before any application is opened |
| **5. Notify Team and Open First Application** | Sends team notification that the profile is set and roles are assigned; confirms Jordan Kim can open the first application workspace; verifies the profile pre-populates correctly in the new workspace | Profile reuse with submission snapshots (F23), Readiness dashboard (F34), Applicant dashboards (F62) | "Jordan's workspace should already have our legal name, EIN, address, and contacts filled in. Let me confirm before she starts adding content." | Pleased, ready | Jordan previously had to manually ask Priya for org data at the start of every application — a recurring interruption | Profile data pre-populates application form fields when Jordan opens the workspace; ≥ 60% of fields populate automatically; Priya's setup investment pays off immediately on the first application |

#### Key Moments
- **Decision Point (Stage 2):** Priya sets expiration dates on credential documents. Skipping this step leaves the system unable to warn her. The upload flow should prompt for expiration dates with guidance on why they matter.
- **Risk of Abandonment (Stage 1):** If profile setup is long and tedious without clear progress indicators, Priya may do a minimal setup and fall back to manual entry per application. A guided setup wizard with completion percentage is critical.
- **Delight Opportunity (Stage 5):** The moment Jordan confirms the application workspace is pre-populated is when the value of Priya's upfront investment becomes tangible — and the platform earns Priya's long-term trust.

#### Success Outcome
The organization profile is complete and ≥ 60% of application fields pre-populate from the profile across all applications. Credential expiration warnings are configured and will surface before any upcoming deadline. Authorized Representative role assigned and confirmed ≥ 48 hours before any application's submission deadline (JTBD-03.1, 03.2, 03.3 success measures).

#### Feature Touchpoints

| Stage | Features |
|---|---|
| Create Organization Profile | F18 (Reusable Organization Profile), F19 (Organization Profile Data Capture) |
| Upload Document Library | F20 (Reusable Standard Attachments Library), F21 (Credential Expiration Warnings) |
| Assign Team Roles | F22 (Organization Role Assignment) |
| Confirm Profile Completeness | F18, F21, F34 (Readiness Dashboard) |
| Notify Team / Open Application | F23 (Profile Reuse with Submission Snapshots), F34, F62 (Applicant Dashboards) |

---

## PER-04: Jordan Kim — Proposal Lead

---

### JRN-04.1: Coordinating the Application Team and Resolving Blocking Errors

**Persona:** PER-04 — Jordan Kim, Proposal Lead  
**Scenario:** Jordan has opened the Community Health Grant application workspace 6 weeks before the deadline. She must assign section ownership to her team, set internal deadlines, track completion and blocking errors daily, respond to a grantor addendum that changes the match requirement, and generate a submission package preview before passing to Sandra for certification.  
**Related Jobs:** JTBD-04.1, JTBD-04.2, JTBD-04.3  

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point (Before System) | Opportunity (With System) |
|---|---|---|---|---|---|---|
| **1. Open Workspace and Assign Sections** | Opens the application workspace (pre-populated with org profile data); reviews the structured section list; assigns narrative to herself, budget to Maria (Finance Contributor), and workplan to Marcus the Program Coordinator; sets internal due dates 2 weeks before the submission deadline | Application workspace (F29, F30), Section ownership and tasks (F31) | "With 6 weeks, I have enough runway if everyone meets their internal deadline. Let me assign budget to Maria first — that section always takes longest." | Organized, relieved to have a central space | Coordinated via Google Drive folders, email threads, and Zoom calls; tracked section completion in a spreadsheet that contributors updated inconsistently; no one had visibility into what was truly done | One workspace per org per opportunity prevents confusion; structured section list with owner, due date, and status visible to all; internal tasks and private comments replace coordination email |
| **2. Monitor Readiness Dashboard (Daily Check)** | Opens the workspace each morning; reviews the readiness dashboard for blocking errors, warning items, missing attachments, and overall completion percentage | Readiness dashboard (F34), Continuous validation (F48), Validation message classification (F49) | "Three blocking errors today. Budget total doesn't add up — that's Maria's section. Missing IRS letter — but that should be in the document library. Let me check." | Focused, alert | No single readiness view existed; Jordan manually opened every section to assess completeness; fatal errors discovered only at final submission — sometimes after the deadline | Readiness dashboard shows blocking errors, warnings, missing attachments, and authorized submitter readiness in one view; each blocking error links directly to the source field; IRS letter pulled from org document library automatically |
| **3. Coordinate on Blocking Error** | Creates an internal task in the budget section assigned to Maria: "Budget total is blocking — please reconcile personnel line items by Thursday." Adds a private comment with context. | Section ownership and tasks (F31), Private internal comments (F32) | "I don't want to call Maria — she's in back-to-back meetings. A task in her section is more actionable than an email she'll miss." | Efficient, pragmatic | Coordination happened via email threads that were easy to miss; no linkage between the email and the application section requiring action | Internal tasks created directly in the section with assignee, due date, and comment; Maria sees the task when she logs in to her section; comment never visible to grantor |
| **4. Respond to Grantor Addendum** | Receives an in-app notification that the grantor has published an addendum increasing the match requirement from 10% to 20%; opens the addendum; identifies the Budget section as impacted; assigns Maria an urgent task to revise | Applicant notifications for addenda (F47), Opportunity changes and addenda display (F17), Application workspace (F29) | "This changes the budget completely. The match increase is significant — Maria needs to know today, not when she checks email." | Concerned, action-oriented | Addenda arrived by email; Jordan sometimes discovered them late, after sections were already drafted; no indication of which sections were affected | In-app notification triggers within 15 minutes of addendum publication; addendum page links to affected sections; deadline countdown in workspace updates automatically; urgent task assigned directly in budget section |
| **5. Review Final Readiness and Generate Preview** | 3 days before the deadline, confirms zero blocking errors on the readiness dashboard; generates the submission package preview; reviews every section and the budget in human-readable format | Readiness dashboard (F34), Submission package preview (F42), Submission blocking (F50) | "No blocking errors. Preview looks right. Sandra will be able to read this and know exactly what she's certifying." | Confident, relieved | No submission package preview existed; Jordan submitted and hoped the application would look correct on the grantor's end; fatal errors often surfaced at submission attempt | Submission package preview renders full application in human-readable format before submission; readiness dashboard shows authorized submitter (Sandra) role is confirmed; submit button will only activate for Sandra |
| **6. Hand Off to Authorized Representative** | Notifies Sandra via in-app message that the application is ready for certification; confirms Sandra's role is designated in the system; confirms the submission deadline countdown | Section ownership and tasks (F31), Readiness dashboard (F34), Role assignment (F22) | "Sandra's role is confirmed. She has 72 hours. The system will send her a notification — I've done my part. Now I just need her to certify." | Relieved, slightly anxious about waiting | Jordan typically texted or called Sandra; Sandra was often unaware of her obligation until the day of the deadline; last-minute permission errors had previously blocked submission | Authorized Representative role confirmed in system ≥ 48 hours before deadline; Sandra receives in-app and email notification; readiness dashboard shows her status; submission blocking prevents submit if role is missing |

#### Key Moments
- **Decision Point (Stage 4):** Jordan must decide whether the addendum requires a budget section revision significant enough to push for a deadline extension. The addendum history and workspace context give her the information to make this call without hunting through email.
- **Risk of Abandonment (Stage 2):** If the readiness dashboard is slow to load or doesn't surface errors clearly, Jordan will revert to manually checking each section — the exact behavior the system is designed to replace.
- **Delight Opportunity (Stage 5):** Generating the submission package preview and seeing zero blocking errors is Jordan's highest-value moment — the first time she can hand off with full confidence instead of anxious hope.

#### Success Outcome
Jordan coordinates the application team in a single workspace, resolves all blocking errors during drafting (≥ 40% reduction vs. baseline), responds to the addendum without emergency rework, and generates a complete submission package preview before handoff. Zero missed addenda or deadline changes requiring emergency revision (JTBD-04.1, 04.2, 04.3 success measures).

#### Feature Touchpoints

| Stage | Features |
|---|---|
| Open Workspace / Assign Sections | F29 (One Workspace Per Org Per Opportunity), F30 (Structured Workspace Sections), F31 (Section Ownership, Tasks, Assignments) |
| Monitor Readiness Dashboard | F34 (Readiness Dashboard), F48 (Continuous Validation), F49 (Validation Message Classification) |
| Coordinate on Blocking Error | F31, F32 (Private Internal Applicant Comments) |
| Respond to Addendum | F47 (Applicant Notifications for Addenda), F17 (Opportunity Changes and Addenda Display), F29 |
| Generate Preview / Final Review | F34, F42 (Submission Package Preview), F50 (Submission Blocking) |
| Hand Off to Authorized Representative | F31, F34, F22 (Organization Role Assignment) |

---

## PER-05: Sandra Okafor — Authorized Representative

---

### JRN-05.1: Certifying and Submitting the Final Application

**Persona:** PER-05 — Sandra Okafor, Authorized Representative / Executive Director  
**Scenario:** Sandra has received advance notice that the Community Health Grant application is ready for her review. She has 72 hours before the deadline. She needs to review the full submission package, certify the application, submit it, and download the submission receipt — all in a workflow simple enough to complete on her phone if needed.  
**Related Jobs:** JTBD-05.1, JTBD-05.2  

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point (Before System) | Opportunity (With System) |
|---|---|---|---|---|---|---|
| **1. Receive Notification and Log In** | Receives a clear in-app and email notification: "The Community Health Grant application is ready for your certification. Deadline: [date/time]. You are designated as the Authorized Representative." Logs in via mobile browser. | Applicant dashboards (F62), Organization role assignment (F22), Readiness dashboard (F34) | "72 hours notice. That's actually enough time. And my role is already set up — I'm not going to hit a permission error this time." | Calm, prepared — a new experience | Previously received a panicked email with 2-3 hours notice; had been blocked from submitting because her account lacked the correct permission; often logging into a portal for the first time at deadline | Role explicitly designated before the final submission stage; in-app and email notification sent with adequate lead time; mobile-accessible login with pre-confirmed role — no permission errors possible |
| **2. Review Submission Package Preview** | Opens the submission package preview from her dashboard; reviews the application in human-readable format: org profile, eligibility, narrative sections, budget, and attachments | Submission package preview (F42, F53), Readiness dashboard (F34) | "I can see everything in one view. Narrative looks right. Budget total is $487,500 — that matches what Jordan told me. Attachments all show as complete." | Confident, focused | Could not previously review the full application in a single readable view; had to navigate through every section of the portal; unclear what was being legally certified | Submission package preview renders the full application in human-readable format — all sections, form data, budget, and attachments — without requiring navigation through the workspace; clear and complete in a single scroll |
| **3. Certify and Submit** | Reads the certification language clearly labeled on the submission screen; understands exactly what she is legally certifying; completes the certification action; clicks "Submit Application" | Authorized representative certification (F51), Submission blocking (F50), Immutable submission snapshot (F52) | "The certification language is clear — I'm confirming the accuracy and compliance of this application. That's exactly what I'm doing. No guessing." | Confident, legally certain | Certification step was buried or unclear in previous portals; Sandra could not always determine what she was legally certifying; certification language was inconsistent or confusing | Certification step is the prominent, clearly labeled final action before submission; legally appropriate certification language confirmed by grantor; certification logged as audit event with timestamp and Sandra's user attribution; submit button activates only after certification is complete |
| **4. Receive and Download Receipt** | Submission confirmed; system immediately generates a downloadable receipt with unique confirmation number and UTC timestamp; Sandra downloads the receipt to her phone and emails it to herself and the grants team | Immutable submission snapshot (F52), Human-readable submission package (F53), Applicant dashboards (F62) | "I have the receipt. Confirmation number CH-2026-0147. UTC timestamp. This is going in the grants management folder and I'm emailing it to the board." | Relieved, professionally satisfied | Screenshotted a confirmation page that sometimes disappeared after the session; received no persistent receipt; had been unable to prove the submission timestamp in a past audit dispute | Receipt generated immediately on submission with unique confirmation number and UTC timestamp; downloadable from her account at any future point — not limited to the submission session; receipt format suitable for org records and audit |
| **5. Post-Submission Confirmation** | Reviews the application status in her dashboard, which now shows "Submitted — Awaiting Administrative Screening"; notes the submission timestamp and enters the status in her internal tracking sheet | Applicant dashboards (F62), Post-submission edit prevention (F54) | "Status shows Submitted. The application is locked — no one can change it now. My job here is done unless they come back with a correction request." | Settled, done | No reliable post-submission status visible; Sandra received no confirmation that the submission was locked and protected | Application status updates to Submitted — Awaiting Screening immediately; application is locked and edit-prevented; Sandra's dashboard shows full submission history with status and receipt access |

#### Key Moments
- **Decision Point (Stage 2):** Sandra notices a section that looks different from what Jordan described. She has the option to flag a concern before certifying or proceed. The preview must be clear enough that she can make this decision without calling Jordan. A private comment or flag mechanism is valuable here.
- **Risk of Abandonment (Stage 3):** Unclear certification language is the most common reason Authorized Representatives hesitate or delay at this stage. The certification text must be plain-language, specific, and legally unambiguous.
- **Delight Opportunity (Stage 4):** Receiving a downloadable, timestamped receipt immediately — without screenshotting a confirmation screen — directly addresses Sandra's most acute pain from past experiences. This is the moment the platform earns her confidence.

#### Success Outcome
Sandra completes the submission certification in under 10 minutes from notification to submitted status. 100% of submissions generate a downloadable receipt with UTC timestamp and confirmation number, accessible from her account at any future point. Zero submission failures attributable to missing role permissions or unclear certification workflow (JTBD-05.1, 05.2 success measures).

#### Feature Touchpoints

| Stage | Features |
|---|---|
| Receive Notification / Log In | F62 (Applicant Dashboards), F22 (Organization Role Assignment), F34 (Readiness Dashboard) |
| Review Submission Package | F42 (Submission Package Preview), F53 (Human-Readable Submission Package), F34 |
| Certify and Submit | F51 (Authorized Representative Certification), F50 (Submission Blocking), F52 (Immutable Submission Snapshot) |
| Receive and Download Receipt | F52, F53, F62 |
| Post-Submission Confirmation | F62, F54 (Post-Submission Edit Prevention) |

---

## Cross-Journey Patterns

### Common Pain Points Resolved Across Multiple Journeys

| Pain Point Theme | Affected Journeys | System Resolution |
|---|---|---|
| **Manual tracking in spreadsheets** | JRN-02.1 (intake queue), JRN-04.1 (section completion) | Structured queue and readiness dashboard replace shadow spreadsheets with live system state |
| **Email-based coordination with no single source of truth** | JRN-01.2 (Q&A), JRN-02.1 (correction requests), JRN-04.1 (section assignments) | All coordination moves in-system: Q&A inbox, correction request tracking, workspace task assignments |
| **Role confusion at submission time** | JRN-03.1 (role assignment), JRN-04.1 (handoff to Sandra), JRN-05.1 (certification) | Authorized Representative role formally designated in system ≥ 48 hours before deadline; submission blocking enforces this |
| **Fatal errors discovered at submission deadline** | JRN-04.1 (blocking errors during drafting), JRN-05.1 (certification clarity) | Continuous validation + readiness dashboard surface blocking errors during drafting; submission package preview confirms correctness before certification |
| **No immutable record of what was submitted or communicated** | JRN-01.2 (Q&A audit trail), JRN-02.1 (submission snapshot), JRN-05.1 (submission receipt) | Immutable snapshots, timestamped Q&A history, and downloadable receipts create a legally defensible record at every layer |
| **Repeated re-entry of the same organizational data** | JRN-03.1 (profile setup), JRN-04.1 (workspace pre-population) | Reusable org profile pre-populates ≥ 60% of application fields; standard documents attachable from the library without re-upload |

### Shared Opportunities Across Journeys

- **Notification quality is high-stakes:** JRN-01.2, JRN-04.1, and JRN-05.1 all depend on timely, specific in-app and email notifications. Vague or delayed notifications in any of these journeys create the exact panic these personas currently experience.
- **Preview before commitment:** Marcus previews before publishing (JRN-01.1), Jordan previews before handing off (JRN-04.1), and Sandra reviews before certifying (JRN-05.1). The submission package preview feature (F42) is the shared trust mechanism across the full lifecycle.
- **Audit trail as confidence builder:** Marcus (JRN-01.2), Diana (JRN-02.1), and Sandra (JRN-05.1) all gain legally defensible confidence from immutable records. The audit trail is not a compliance checkbox — it is a primary user value across both sides of the platform.

### Persona Convergence Points

| Convergence | Personas | Stage |
|---|---|---|
| Q&A response publication → applicant notification | PER-01 publishes → PER-04 receives | JRN-01.2 Stage 3 → JRN-04.1 Stage 4 |
| Sandra certified and submitted → Diana's intake queue | PER-05 submits → PER-02 receives | JRN-05.1 Stage 3 → JRN-02.1 Stage 1 |
| Priya assigns roles → Jordan's workspace readiness | PER-03 assigns → PER-04 sees in dashboard | JRN-03.1 Stage 3 → JRN-04.1 Stage 6 |
| Jordan generates preview → Sandra reviews same preview | PER-04 creates preview → PER-05 reviews it | JRN-04.1 Stage 5 → JRN-05.1 Stage 2 |
| Diana issues correction request → Jordan coordinates response | PER-02 sends → PER-04 responds | JRN-02.1 Stage 3 → JRN-04.1 (correction cycle) |

---

## Journey-to-JTBD Traceability

| JRN-ID | Stage | JTBD-ID | Expected Outcome |
|---|---|---|---|
| JRN-01.1 | 1 — Initiate | JTBD-01.1 | Opportunity created from template; setup time under 2 hours |
| JRN-01.1 | 2 — Configure Metadata | JTBD-01.1 | All required metadata fields captured; 2 CFR 200.204 structure satisfied |
| JRN-01.1 | 3 — Configure Eligibility | JTBD-01.2 | Eligibility rules configured as system-enforced logic; hard blockers vs. advisory warnings distinguished |
| JRN-01.1 | 4 — Configure Deadlines / Attachments | JTBD-01.2 | Required attachments enforced by system before submission |
| JRN-01.1 | 5 — Validate and Preview | JTBD-01.1 | ≥ 90% of opportunities pass completeness validation on first publish attempt |
| JRN-01.1 | 6 — Publish | JTBD-01.1 | Immutable audit trail captures publication; opportunity live on portal |
| JRN-01.2 | 1 — Receive Question | JTBD-01.3 | All applicant questions routed to Q&A inbox; no private replies |
| JRN-01.2 | 2 — Publish Q&A Response | JTBD-01.3 | All applicants notified within 15 minutes; response timestamped and visible to all |
| JRN-01.2 | 3 — Issue Addendum | JTBD-01.3 | Addendum published in-system; all applicants with started applications notified |
| JRN-01.2 | 4–5 — Monitor / Audit | JTBD-01.3 | Complete, immutable Q&A and addenda history available for dispute or audit |
| JRN-02.1 | 1 — Open Intake Queue | JTBD-02.1 | Intake queue displays all submission details without opening individual files |
| JRN-02.1 | 2 — Review Submission Details | JTBD-02.1 | Screening panel surfaces eligibility, validation, and attachment status in one view |
| JRN-02.1 | 3 — Apply Disposition / Correction | JTBD-02.1 | Dispositions applied directly in system; correction requests tracked in one place |
| JRN-02.1 | 4 — Verify Snapshot Preservation | JTBD-02.2 | Original submission snapshot preserved; versioned history linked; no version lost |
| JRN-02.1 | 5 — Accept and Route | JTBD-02.3 | Accepted applications auto-routed to review; handoff event logged; < 10% incomplete rate |
| JRN-02.1 | 6 — Export Disposition Report | JTBD-02.2, JTBD-02.3 | Intake data exportable for audit; 100% of records have immutable snapshots |
| JRN-03.1 | 1 — Create Organization Profile | JTBD-03.1 | Profile is single source of truth; ≥ 60% of application fields pre-populate |
| JRN-03.1 | 2 — Upload Document Library | JTBD-03.1, JTBD-03.2 | Standard documents reusable without re-upload; expiration tracking configured |
| JRN-03.1 | 3 — Assign Team Roles | JTBD-03.3 | Authorized Representative designated in system ≥ 48 hours before deadline; role-based access enforced |
| JRN-03.1 | 4 — Confirm Profile Completeness | JTBD-03.2 | Credential expiration warnings configured and will surface before any upcoming deadline |
| JRN-03.1 | 5 — Notify Team / Open Application | JTBD-03.1 | Profile data pre-populates first application workspace; ≥ 60% field reuse confirmed |
| JRN-04.1 | 1 — Open Workspace / Assign Sections | JTBD-04.1 | One workspace per org per opportunity; section owners and due dates assigned; team coordination in-system |
| JRN-04.1 | 2 — Monitor Readiness Dashboard | JTBD-04.2 | Blocking errors surfaced with direct links during drafting; ≥ 40% reduction vs. baseline |
| JRN-04.1 | 3 — Coordinate on Blocking Error | JTBD-04.1 | Internal tasks and private comments replace coordination email; grantor-private boundary maintained |
| JRN-04.1 | 4 — Respond to Addendum | JTBD-04.3 | In-app notification within 15 minutes; zero missed addenda requiring emergency revision |
| JRN-04.1 | 5 — Generate Preview / Final Review | JTBD-04.2 | Zero blocking errors at preview; submission package preview confirms correctness before handoff |
| JRN-04.1 | 6 — Hand Off to Authorized Representative | JTBD-04.1, JTBD-04.3 | Sandra's role confirmed ≥ 48 hours before deadline; submission blocking prevents premature submit |
| JRN-05.1 | 1 — Receive Notification / Log In | JTBD-05.1 | Role pre-designated; mobile-accessible login; no permission errors |
| JRN-05.1 | 2 — Review Submission Package | JTBD-05.1 | Full application visible in human-readable format without workspace navigation |
| JRN-05.1 | 3 — Certify and Submit | JTBD-05.1 | Certification completed in < 10 minutes; legally appropriate language clearly labeled; audit event logged |
| JRN-05.1 | 4 — Receive and Download Receipt | JTBD-05.2 | Downloadable receipt with UTC timestamp and confirmation number generated immediately |
| JRN-05.1 | 5 — Post-Submission Confirmation | JTBD-05.2 | Application locked; submission status visible; receipt accessible from account at any future point |

---

*Document generated: July 24, 2026 | Derived from: PERSONAS-GrantsIntake.md, JTBD-GrantsIntake.md, PRD-GrantsIntake.md, .planning/PROJECT.md*
