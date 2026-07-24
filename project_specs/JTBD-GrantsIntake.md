# Jobs-to-be-Done: GrantsIntake

| Field | Value |
|---|---|
| **Product** | GrantsIntake — Dual-Sided Grants Lifecycle Management Platform |
| **Module** | Grants Intake |
| **Document Type** | Jobs-to-be-Done (JTBD) |
| **Version** | 1.0 Draft |
| **Date** | July 24, 2026 |
| **Related Personas** | `project_specs/PERSONAS-GrantsIntake.md` |
| **Related PRD** | `project_specs/PRD-GrantsIntake.md` |

---

## JTBD Summary Table

| JTBD-ID | Persona | Job Statement (abbreviated) | Priority |
|---|---|---|---|
| JTBD-01.1 | PER-01 Program Officer | Publish a structured, complete funding opportunity without rework or email corrections | P0 |
| JTBD-01.2 | PER-01 Program Officer | Enforce eligibility as system logic so unqualified applicants are filtered before wasting effort | P0 |
| JTBD-01.3 | PER-01 Program Officer | Manage applicant Q&A and addenda in-system so all applicants receive the same answers | P0 |
| JTBD-02.1 | PER-02 Grant Intake Administrator | Clear the intake queue with clean, traceable dispositions without chasing applicants by email | P0 |
| JTBD-02.2 | PER-02 Grant Intake Administrator | Preserve the full submission and correction history so the intake record survives any audit | P0 |
| JTBD-02.3 | PER-02 Grant Intake Administrator | Route accepted applications to review with a clean, structured handoff and no manual steps | P0 |
| JTBD-03.1 | PER-03 Organization Administrator | Maintain one org profile that pre-populates every application so the team never re-enters the same data | P0 |
| JTBD-03.2 | PER-03 Organization Administrator | Get advance warning of expiring credentials before they become a submission blocker | P0 |
| JTBD-03.3 | PER-03 Organization Administrator | Assign and enforce team roles formally so submit authority is never ambiguous at deadline | P0 |
| JTBD-04.1 | PER-04 Proposal Lead | Coordinate the application team in a single workspace so section ownership, deadlines, and progress are visible without email | P0 |
| JTBD-04.2 | PER-04 Proposal Lead | Resolve blocking errors during drafting so no fatal validation issue surfaces at the moment of submission | P0 |
| JTBD-04.3 | PER-04 Proposal Lead | Monitor and respond to grantor Q&A and addenda so no deadline change or requirement update is missed | P1 |
| JTBD-05.1 | PER-05 Authorized Representative | Certify and submit the final application with full confidence it is complete and legally compliant | P0 |
| JTBD-05.2 | PER-05 Authorized Representative | Receive a portable, timestamped submission receipt as proof of timely, compliant submission | P0 |

---

## PER-01: Marcus Webb — Program Officer

### JTBD-01.1: Publish a Structured, Complete Funding Opportunity

**Job Statement:**
When I begin a new funding cycle and need to open an opportunity for applications, I want to create a complete, structured funding opportunity from a configurable template with all required metadata and eligibility logic in place, so I can publish with confidence that applicants will have clear, unambiguous requirements and no avoidable questions will return to me.

**Current Alternatives:**
- Builds opportunity content in a Word document and emails it to a coordinator who manually enters it into a legacy portal
- Copies prior-cycle documents and manually updates fields — inconsistent results across programs
- Relies on applicant Q&A to catch gaps in his instructions after publication

**Hiring Criteria:**
- Template pre-populates required metadata fields (title, opportunity number, funding range, key dates, eligibility summary) — reduces setup time to under 2 hours
- System validates opportunity completeness before allowing publication — zero blocked publishes due to missing required fields
- Opportunity preview is available before publishing so Marcus can review the applicant-facing page
- All required metadata satisfies 2 CFR 200.204 (NOFO) structure automatically

**Success Measure:** ≥ 90% of published opportunities pass required metadata validation on the first publish attempt without revision.

**Related Features:** F0, F1, F2, F5, F6
**Priority:** P0

---

### JTBD-01.2: Enforce Eligibility as System Logic

**Job Statement:**
When I define who is eligible for a funding opportunity, I want to configure eligibility requirements as enforced system rules — not buried document text — so I can ensure unqualified applicants are screened before they invest time in an application, and I stop receiving submissions I have to manually reject.

**Current Alternatives:**
- Writes eligibility requirements as narrative paragraphs in the announcement document — not enforced by any system
- Manually reviews submitted applications for eligibility compliance after the fact
- Issues clarification emails to applicants who misread eligibility requirements in the document

**Hiring Criteria:**
- Supports eligibility rules by applicant type, geography, UEI/SAM status, nonprofit status, prior award status, and match requirements
- Distinguishes hard blockers (prevent workspace creation) from advisory warnings (alert but allow progress)
- Pre-screening questionnaire drives eligibility determination before workspace access is granted
- Eligibility responses stored in intake record so Diana can review them without asking applicants to repeat

**Success Measure:** Zero applicant questions about eligibility requirements that are already configured as system-enforced rules in the published opportunity.

**Related Features:** F7, F8, F9, F10, F11, F12, F24, F25, F26, F28
**Priority:** P0

---

### JTBD-01.3: Manage Q&A and Addenda In-System

**Job Statement:**
When applicants submit questions or I need to issue a clarification or deadline change during an open intake window, I want to publish responses and addenda directly in the system so every applicant sees the same answer at the same time, and I have an immutable audit record of every official communication.

**Current Alternatives:**
- Responds to applicant questions by individual email — some applicants receive answers others never see
- Tracks addenda in a shared document folder with no version control or notification workflow
- Has no provable record of what applicants were officially told

**Hiring Criteria:**
- Grantor can publish Q&A responses visible to all applicants on the opportunity page
- Deadline changes and addenda surface prominently to all applicants, including those with in-progress applications
- Applicants with started applications receive automatic in-app and email notifications on addendum publication
- Complete, immutable Q&A and addenda history is timestamped and attributable

**Success Measure:** Q&A responses published in-system — not distributed via email — for 100% of opportunities managed, with automatic applicant notification confirmed for each published response.

**Related Features:** F43, F44, F46, F47, F17
**Priority:** P0

---

## PER-02: Diana Reyes — Grant Intake Administrator

### JTBD-02.1: Clear the Intake Queue with Clean, Traceable Dispositions

**Job Statement:**
When applications arrive in my queue after an intake window closes, I want to review each submission, apply an administrative screening disposition from a configured checklist, and send correction requests through the system, so I can process 40–120 applications per cycle without maintaining a shadow spreadsheet or sending individualized correction emails.

**Current Alternatives:**
- Tracks all intake dispositions in a shared spreadsheet that is frequently out of sync with actual status
- Sends correction requests via individual email — no tracking of who responded, when, or what changed
- Administrative screening criteria live in a program officer's memory or email threads, not a system checklist

**Hiring Criteria:**
- Intake queue displays submission status, applicant profile, eligibility results, validation summary, attachment completeness, and requested amount — without requiring Diana to open individual files
- Disposition states include Accepted, Returned for Correction, Ineligible, Duplicate, Late, and Administratively Rejected — applied directly from the screening panel
- Correction requests are sent through the system, tied to specific sections, and tracked in one place
- Disposition actions are logged with timestamp and user attribution, triggering applicant notifications automatically

**Success Measure:** Median intake cycle time from submission to administrative disposition reduced by ≥ 30% compared to the prior email-and-spreadsheet process.

**Related Features:** F12, F55, F56, F57, F58, F61
**Priority:** P0

---

### JTBD-02.2: Preserve the Full Submission and Correction History for Audit

**Job Statement:**
When an applicant corrects or resubmits after I have returned their application, I want the original submission snapshot to be preserved alongside the corrected version — neither overwritten — so I can prove to auditors exactly what was submitted, when, and what changed, without relying on email archives.

**Current Alternatives:**
- No immutable submission record exists — corrections silently overwrite earlier versions in current portals
- Diana tracks version differences manually using email timestamps and file naming conventions
- Audit responses require reconstructing history from scattered email threads and spreadsheet notes

**Hiring Criteria:**
- Original submission snapshot is preserved when a correction request is issued — not overwritten
- Corrected resubmission creates a new versioned snapshot alongside the original
- Both versions are accessible in the intake queue with linked version history
- Every submission generates an immutable record with UTC timestamp, confirmation number, and full audit trail

**Success Measure:** 100% of final submissions have immutable snapshots, confirmation receipts, and full audit trails — with no version lost on correction.

**Related Features:** F52, F53, F54, F58, F59, F63
**Priority:** P0

---

### JTBD-02.3: Route Accepted Applications to Review Without Manual Steps

**Job Statement:**
When I complete administrative screening and accept an application, I want the system to automatically route it to the appropriate review workflow, so I can close out my intake queue cleanly without manual handoff emails or reviewer access provisioning.

**Current Alternatives:**
- Manually emails the review team with a list of accepted applications and attached PDF copies
- Reviewer access to applications is provisioned on an ad-hoc basis by the system administrator
- No structured handoff confirmation exists — Diana relies on email replies to confirm receipt

**Hiring Criteria:**
- Accepted applications are automatically routed to review, scoring, or risk assessment workflows on disposition
- Routing is configurable by opportunity or program — no one-size-fits-all workflow required
- Handoff event is logged in the audit trail with timestamp and attribution
- Review workflow access provisioned automatically for assigned reviewers

**Success Measure:** Incomplete submission rate (applications returned for missing required data or attachments) falls below 10%, with zero accepted applications lost in handoff.

**Related Features:** F55, F57, F60, F63
**Priority:** P0

---

## PER-03: Priya Nair — Organization Administrator

### JTBD-03.1: Maintain One Org Profile That Pre-Populates Every Application

**Job Statement:**
When my organization applies to a new funding opportunity, I want organization data — legal name, EIN, UEI, SAM status, tax status, authorized contacts — to pre-populate from a single maintained profile, so my team never re-enters the same information into another portal and I recover the 3–4 hours per cycle currently lost to manual re-entry.

**Current Alternatives:**
- Manually re-enters EIN, UEI, legal name, address, and tax status into every funder portal, every cycle
- Stores org data in a master spreadsheet that must be consulted and manually copied into each application
- Standard documents (IRS determination letter, W-9, audit reports) are re-uploaded to each new portal

**Hiring Criteria:**
- Organization profile captures legal name, DBA, address, entity type, UEI, SAM status, tax status, contacts, authorized representatives, and banking readiness
- Profile data pre-populates application form fields across all opportunities — no manual re-entry required
- Standard documents stored in a reusable library at the org level, attachable to any application without re-upload
- ≥ 60% of application fields populated from the org profile across repeat applications within 12 months

**Success Measure:** ≥ 60% of application fields pre-populated from the reusable organization profile across all applications submitted within 12 months of profile setup.

**Related Features:** F18, F19, F20, F23, F40
**Priority:** P0

---

### JTBD-03.2: Get Advance Warning of Expiring Credentials

**Job Statement:**
When credentials like SAM registration, IRS determination letters, audit reports, or insurance certificates approach expiration, I want the system to warn me before the deadline — not after a submission is blocked — so I can renew documents proactively and never miss a submission because of an expired credential.

**Current Alternatives:**
- Tracks credential expiration dates in a manual spreadsheet — checked only when a deadline approaches
- Discovers expired SAM registration or IRS letter only when an application submission is blocked
- No advance warning mechanism exists in any current portal

**Hiring Criteria:**
- Configurable expiration tracking for SAM registration, IRS determination letters, audit reports, and insurance certificates
- In-app warnings when credentials are expired or within a configurable expiration window
- Warnings surfaced in both the organization profile and the application workspace checklist
- Warnings appear early enough to allow renewal before the nearest upcoming submission deadline

**Success Measure:** Zero missed submission deadlines due to expired credential documents that were not flagged by the system in advance.

**Related Features:** F21, F34, F62
**Priority:** P0

---

### JTBD-03.3: Assign and Enforce Team Roles Formally

**Job Statement:**
When I set up our organization's team for a new application cycle, I want to formally assign each team member a specific role — proposal lead, finance contributor, authorized representative — with system-enforced access rights, so submit authority is never ambiguous at the final deadline and we never have a last-minute permission problem that delays submission.

**Current Alternatives:**
- Role assignments are communicated informally via email — no system-enforced access boundaries
- Authorized representative designation is not tracked anywhere — surfaces as confusion at submission time
- Proposal leads and finance contributors have identical access, leading to unintended edits in restricted sections

**Hiring Criteria:**
- Roles defined: org admin, proposal lead, finance contributor, authorized representative, external contributor
- Role-based access enforced at section, budget, and submission levels
- Authorized representative role explicitly required for final certification and submission
- Role assignments visible to all team members with clear confirmation workflow

**Success Measure:** Authorized representative role assigned and confirmed in the system ≥ 48 hours before submission deadline for 100% of applications submitted by the organization.

**Related Features:** F22, F29, F31, F51
**Priority:** P0

---

## PER-04: Jordan Kim — Proposal Lead

### JTBD-04.1: Coordinate the Application Team in a Single Workspace

**Job Statement:**
When I open a new application and need to mobilize my team across narrative, budget, and attachment sections, I want a structured workspace where I can assign section ownership, set internal deadlines, create tasks, and track overall progress — so I replace the email threads and shared drive chaos with one source of truth the whole team can trust.

**Current Alternatives:**
- Coordinates application work through Google Drive folders, email threads, and Zoom check-ins
- Tracks section completion manually in a spreadsheet updated inconsistently by different team members
- Role confusion between contributors and the authorized representative surfaces only at submission time

**Hiring Criteria:**
- One application workspace per organization per opportunity — prevents duplicate confusion
- Sections clearly structured (Org Profile, Eligibility, Narrative, Budget, Workplan, Attachments, Certifications, Review/Submit)
- Section owner assignable to specific team members with internal due dates
- Internal tasks and private comments visible only to applicant team — not exposed to grantor
- Overall completion status, blocking errors, and missing attachments visible in a readiness dashboard

**Success Measure:** Application workspace usability rating ≥ 4.2 / 5.0 on post-submission applicant satisfaction survey.

**Related Features:** F29, F30, F31, F32, F34, F35, F62
**Priority:** P0

---

### JTBD-04.2: Resolve Blocking Errors During Drafting, Not at Submission

**Job Statement:**
When I am preparing an application over several weeks with multiple contributors, I want the system to validate my application continuously during drafting — surfacing blocking errors in real time — so I never discover a fatal validation issue at the submission deadline when there is no time to fix it.

**Current Alternatives:**
- Discovers blocking validation errors only at the moment of final submission — sometimes after the deadline has passed
- Manually opens every section to check completeness before submission — no single validation view
- Budget validation is done manually by the finance contributor in a separate spreadsheet, not integrated with the application

**Hiring Criteria:**
- Real-time field-level validation during data entry with clear inline error messages
- Readiness dashboard shows all blocking errors, warnings, missing attachments, and authorized submitter readiness at all times
- Validation messages classified as Blocking, Warning, or Informational with distinct visual treatment
- Submission package preview shows exactly what the grantor will receive before certification
- ≥ 40% reduction in final-submit blocking errors after continuous validation is active

**Success Measure:** ≥ 40% reduction in blocking errors discovered at final submission attempt compared to baseline (without continuous validation).

**Related Features:** F34, F37, F39, F40, F42, F48, F49, F50
**Priority:** P0

---

### JTBD-04.3: Monitor Grantor Q&A and Addenda Without Missing Updates

**Job Statement:**
When a grantor publishes Q&A responses, addenda, or deadline changes during the application window, I want to be automatically notified and shown exactly what changed and what sections of my application are impacted, so I never miss an update that invalidates work already done or changes the submission deadline.

**Current Alternatives:**
- Checks the funder's email and website manually for Q&A updates — often discovers changes late
- Addenda updates arrive by email with no indication of which sections of the application are affected
- Has missed eligibility clarifications that invalidated drafted sections after significant effort

**Hiring Criteria:**
- Automatic in-app and email notification when addenda, Q&A responses, or deadline changes are published
- Deadline changes prominently surfaced in the workspace with a clear countdown update
- Opportunity changes page shows timestamped, attributed history of all modifications
- Application workspace links directly to addenda that affect in-progress sections

**Success Measure:** Zero missed addenda or deadline changes that required emergency application revisions after the team was otherwise ready to submit.

**Related Features:** F17, F44, F46, F47, F62
**Priority:** P1

---

## PER-05: Sandra Okafor — Authorized Representative

### JTBD-05.1: Certify and Submit the Final Application with Confidence

**Job Statement:**
When the proposal team completes the application and passes it to me for final certification, I want to receive a clear notification, review a human-readable submission package that shows exactly what is being submitted, and complete the certification with legally appropriate language — all in a simple, mobile-accessible workflow — so I can fulfill my legal obligation without last-minute surprises, permission errors, or ambiguous certification steps.

**Current Alternatives:**
- Receives a panicked email the day of the deadline asking her to log into a portal she has never used
- Has been blocked from submitting because her account lacked the correct permission, discovered only at the submission deadline
- Cannot always determine what she is legally certifying — certification language is buried or unclear
- Has submitted from her phone before but the portal was not mobile-accessible

**Hiring Criteria:**
- Authorized representative role explicitly designated in the system before the final submission stage — assigned by the org admin, not discovered at deadline
- Clear in-app and email notification when the application is ready for certification — with adequate lead time
- Human-readable submission package preview shows all sections, form data, budget, and attachments — without navigating the full workspace
- Certification step includes legally appropriate language, clearly labeled, with audit-event logging
- Workflow is mobile-accessible and completes in under 10 minutes when package is ready and role is assigned

**Success Measure:** Submission certification completed in under 10 minutes when the package is ready and the authorized representative role is assigned — for 100% of submissions.

**Related Features:** F22, F34, F42, F50, F51, F52, F53
**Priority:** P0

---

### JTBD-05.2: Receive a Portable, Timestamped Submission Receipt

**Job Statement:**
When I complete submission of a grant application, I want to immediately receive a downloadable receipt with a unique confirmation number and UTC timestamp, so I have portable, portable proof of timely submission for my organization's records and any future audit or funder inquiry.

**Current Alternatives:**
- Screenshots a confirmation page that sometimes disappears or is inaccessible after the session ends
- Receives no persistent receipt — relies on her email inbox for indirect evidence of submission
- Has been unable to prove the submission timestamp in a past audit dispute

**Hiring Criteria:**
- Immutable submission snapshot generated on submission with unique confirmation number
- Downloadable receipt includes UTC timestamp, confirmation number, and application identifiers
- Receipt accessible from her account at any future point — not limited to the submission session
- Receipt format suitable for organizational records and audit submission

**Success Measure:** 100% of submissions generate a downloadable receipt with UTC timestamp and unique confirmation number — accessible from the applicant's account at any time post-submission.

**Related Features:** F52, F53, F62
**Priority:** P0

---

## Outcome-to-Feature Traceability

| JTBD-ID | Related Features | Expected Outcome |
|---|---|---|
| JTBD-01.1 | F0, F1, F2, F5, F6 | ≥ 90% of opportunities pass completeness validation on first publish; grantors reduce setup time to < 2 hours |
| JTBD-01.2 | F7, F8, F9, F10, F11, F12, F24, F25, F26, F28 | Zero eligibility questions from applicants about system-enforced rules; unqualified applicants blocked before workspace access |
| JTBD-01.3 | F17, F43, F44, F46, F47 | 100% of Q&A responses published in-system; all applicants receive equal, timely access to clarifications |
| JTBD-02.1 | F12, F55, F56, F57, F58, F61 | Intake cycle time reduced ≥ 30%; disposition tracking migrated from spreadsheet to system |
| JTBD-02.2 | F52, F53, F54, F58, F59, F63 | 100% of submissions have immutable snapshots; zero version loss on correction; full audit trail on every record |
| JTBD-02.3 | F55, F57, F60, F63 | Accepted applications route to review automatically; handoff events logged; < 10% incomplete submission rate |
| JTBD-03.1 | F18, F19, F20, F23, F40 | ≥ 60% of application fields pre-populated from org profile; standard documents reused without re-upload |
| JTBD-03.2 | F21, F34, F62 | Zero missed submission deadlines due to expired credentials; all expiration warnings surfaced before deadline |
| JTBD-03.3 | F22, F29, F31, F51 | Authorized representative role confirmed ≥ 48 hours before deadline for 100% of applications |
| JTBD-04.1 | F29, F30, F31, F32, F34, F35, F62 | Application workspace rated ≥ 4.2 / 5.0; team coordination migrated from email to structured workspace |
| JTBD-04.2 | F34, F37, F39, F40, F42, F48, F49, F50 | ≥ 40% reduction in final-submit blocking errors; all blocking issues surfaced before submission deadline |
| JTBD-04.3 | F17, F44, F46, F47, F62 | Zero missed addenda or deadline changes requiring emergency revision |
| JTBD-05.1 | F22, F34, F42, F50, F51, F52, F53 | Certification completed in < 10 minutes; zero submission failures due to missing permissions or unclear certification |
| JTBD-05.2 | F52, F53, F62 | 100% of submissions generate a downloadable, timestamped receipt accessible post-session |

---

## NaC Preview

The following table captures candidate Natural Acceptance Criteria derived from each job's success measure. These will be refined into full NaC statements during story mapping.

| JTBD-ID | Outcome | Candidate Natural Acceptance Criteria |
|---|---|---|
| JTBD-01.1 | ≥ 90% first-publish completeness rate | Given a grantor completes all required metadata fields, when they attempt to publish, then the system validates completeness and allows publication without requiring a second save attempt, for ≥ 90% of opportunities in the first 6 months. |
| JTBD-01.2 | Zero eligibility questions about system-enforced rules | Given an eligibility rule is configured as a hard blocker, when an ineligible applicant completes the pre-screen, then the system surfaces a plain-language explanation and prevents workspace creation — without any grantor intervention required. |
| JTBD-01.3 | 100% Q&A published in-system with equal access | Given a grantor publishes a Q&A response, when the response is saved, then all applicants with started applications receive an in-app and email notification within 15 minutes, and the response appears on the public opportunity page. |
| JTBD-02.1 | Intake cycle time reduced ≥ 30% | Given an application is submitted, when Diana opens the intake queue, then all submission details — eligibility result, validation summary, attachment status, requested amount — are visible without opening any individual file. |
| JTBD-02.2 | 100% immutable snapshot coverage | Given Diana issues a correction request and the applicant resubmits, when the corrected version is saved, then the original submission snapshot is preserved unmodified and both versions are visible in the intake record with linked version history. |
| JTBD-02.3 | Accepted apps routed automatically, < 10% incomplete rate | Given Diana marks an application "Accepted for Review," when the disposition is saved, then the application automatically appears in the review workflow queue and a handoff event is logged with timestamp and user attribution. |
| JTBD-03.1 | ≥ 60% field pre-population rate | Given an org profile is complete, when a Proposal Lead opens a new application workspace, then all applicable profile fields (legal name, EIN, UEI, address, contacts) are pre-populated without manual entry required. |
| JTBD-03.2 | Zero missed deadlines from expired credentials | Given a credential has an expiration date stored in the org profile, when the expiration date is within 60 days, then the system surfaces an in-app warning in the org profile and in the application workspace checklist. |
| JTBD-03.3 | Authorized rep assigned ≥ 48 hrs before deadline | Given the org admin designates a user as Authorized Representative, when the designation is saved, then the user's role is reflected in the workspace readiness dashboard and the submission button is only enabled for that user. |
| JTBD-04.1 | Workspace rated ≥ 4.2 / 5.0 | Given a Proposal Lead assigns a section to a contributor, when the contributor logs in, then they see only their assigned sections with internal due dates and any tasks assigned to them — without accessing other sections. |
| JTBD-04.2 | ≥ 40% reduction in final-submit blocking errors | Given a required field is left empty during drafting, when the Proposal Lead views the readiness dashboard, then the blocking error is listed with a direct link to the source field — before any submission attempt is made. |
| JTBD-04.3 | Zero missed addenda requiring emergency revision | Given a grantor publishes an addendum, when the addendum is saved, then all applicants with in-progress applications receive an in-app notification within 15 minutes, with a link to the addendum and affected sections indicated. |
| JTBD-05.1 | Certification completed in < 10 min | Given the Authorized Representative opens the submission package preview, when they complete the certification step, then the system logs the certification as an audit event with timestamp and user attribution, and the submit button becomes active. |
| JTBD-05.2 | 100% receipt generation with UTC timestamp | Given an application is successfully submitted, when the submission is confirmed, then the system immediately generates a downloadable receipt with a unique confirmation number and UTC timestamp, accessible from the applicant's account at any future point. |

---

*Document generated: July 24, 2026 | Derived from: PERSONAS-GrantsIntake.md, PRD-GrantsIntake.md, .planning/PROJECT.md*
