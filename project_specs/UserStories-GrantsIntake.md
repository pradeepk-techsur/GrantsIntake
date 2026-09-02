# User Stories: GrantsIntake

**Product:** GrantsIntake — Dual-Sided Grants Lifecycle Management Platform  
**Module:** Grants Intake  
**Document Type:** User Stories  
**Version:** 1.0 Draft  
**Date:** July 24, 2026  
**Scope:** MVP features F0–F63 + grantor portal shell (60 P0 user stories across 11 intake stages)  
**Related PRD:** `project_specs/PRD-GrantsIntake.md`  
**Related FRD:** `project_specs/FRD-GrantsIntake.md`

---

## Priority Definitions

| Priority | Definition |
|---|---|
| **P0** | MVP — must ship in initial release; core intake functionality |
| **P1** | High priority follow-on — important but not blocking launch |
| **P2** | Phase 2 — explicitly deferred; out of MVP scope |
| **P3** | Phase 3 — long-range roadmap |

---

## Persona Reference

| ID | Name | Role | Side |
|---|---|---|---|
| PER-01 | Marcus Webb | Program Officer | Grantor |
| PER-02 | Diana Reyes | Grant Intake Administrator | Grantor |
| PER-03 | Priya Nair | Organization Administrator | Grantee |
| PER-04 | Jordan Kim | Proposal Lead | Grantee |
| PER-05 | Sandra Okafor | Authorized Representative | Grantee |

---

## Epic 1: Program and Opportunity Setup (Stage 1)

*Enable grantors to create structured, accessible, and configurable grant opportunities.*

---

### US-1.0: Access the Grantor Portal and Navigate to Core Workflows
**As a** Marcus Webb (Program Officer) or Diana Reyes (Grant Intake Administrator), **I want to** land in a clear, role-appropriate grantor portal after logging in and navigate to the Opportunity Builder or Intake Queue without hunting, **so that** I can start my core workflow immediately without orientation overhead.

**Acceptance Criteria:**
- [ ] After login, grantor users are routed to a role-appropriate landing page: Program Officers see the Opportunity Builder entry point and active opportunity summary; Intake Administrators see the Intake Queue entry point and pending screening summary
- [ ] The primary navigation includes at minimum: Opportunities (for Program Officers), Intake Queue (for Intake Administrators), Program Dashboard, Q&A Inbox, and Settings
- [ ] Navigation items are role-restricted: Intake Administrators do not see the Opportunity Builder create action; Program Officers see intake queue in read-only summary only
- [ ] A "Create New Opportunity" action is accessible from the grantor landing page and the Opportunities section for users with create permission
- [ ] The grantor portal is WCAG 2.1 AA compliant and uses GrantFlow Design System v1.0 components throughout
- [ ] A `GRANTOR_LOGIN` audit event is logged with timestamp and user attribution on each authenticated session

**Priority:** P0 | **Feature Ref:** Supports F0–F63 (grantor-side entry shell)

---

### US-1.1: Create Opportunity from Template
**As a** Marcus Webb (Program Officer), **I want to** create a new funding opportunity by selecting from a template library, **so that** I can start with the correct structure and reduce manual setup time.

**Acceptance Criteria:**
- [ ] A template library is displayed when "Create New Opportunity" is clicked, organized by program type (Federal NOFO, State/Local Grant, Philanthropic RFP, Corporate Grant, Pass-Through Subaward)
- [ ] Selecting a template instantiates a new draft opportunity pre-populated with template defaults
- [ ] A system-generated opportunity ID (UUID) is assigned to the new draft
- [ ] A completed or published opportunity can be saved as a custom template for future reuse
- [ ] Custom templates appear in the template library alongside system templates
- [ ] An `OPPORTUNITY_CREATED` audit event is logged with timestamp, user, and template reference
- [ ] Attempting to create an opportunity without selecting a template is blocked with a clear error message

**Priority:** P0 | **Feature Ref:** F0 (PRD-INTAKE-001)

---

### US-1.2: Capture Structured Opportunity Metadata
**As a** Marcus Webb (Program Officer), **I want to** fill in all required metadata fields for a funding opportunity, **so that** applicants have complete information and the opportunity meets federal NOFO requirements.

**Acceptance Criteria:**
- [ ] All required fields are present: title, funding source, announcement type, opportunity number, funding amount max, eligibility summary, executive summary, contact name, contact email, and program area
- [ ] Assistance Listing Number field is required (and validated to format `XX.XXX`) when the funding source is a federal agency
- [ ] Opportunity number is validated as unique within the parent program; a duplicate triggers an error
- [ ] Funding amount min is validated as ≤ funding amount max when both are provided
- [ ] Contact email is validated against RFC 5322 email format
- [ ] Field-level validation messages are displayed in real time during data entry
- [ ] An `OPPORTUNITY_METADATA_UPDATED` audit event is logged on every save with a field-change diff

**Priority:** P0 | **Feature Ref:** F1 (PRD-INTAKE-002)

---

### US-1.3: Write Opportunity Descriptions with Plain-Language Guidance
**As a** Marcus Webb (Program Officer), **I want to** see contextual plain-language prompts while writing opportunity descriptions, **so that** applicant instructions are clear and accessible before I publish.

**Acceptance Criteria:**
- [ ] A collapsible guidance panel is displayed adjacent to narrative text fields (executive summary, eligibility summary, applicant instructions, program description)
- [ ] Each guidance panel shows a plain-language prompt, an example of good content, and plain language tips
- [ ] A readability grade-level indicator is displayed below narrative fields as the grantor types
- [ ] The readability indicator is clearly labeled as advisory and does not block save or publication
- [ ] Grantors can toggle guidance prompts on or off; the preference is persisted per session
- [ ] Guidance prompts are restored to visible state by default on next session

**Priority:** P0 | **Feature Ref:** F2 (PRD-INTAKE-003)

---

### US-1.4: Configure Intake Windows and Deadlines
**As a** Marcus Webb (Program Officer), **I want to** configure the full timeline for an opportunity including open/close dates, pre-application deadlines, and LOI deadlines, **so that** applicants know exactly when to act and the system enforces those dates automatically.

**Acceptance Criteria:**
- [ ] Application open date and close date are required; open date must be before close date
- [ ] Pre-application deadline, when provided, must be before the application open date
- [ ] LOI deadline, when provided, must be before the application close date
- [ ] When `LOI required = true`, an LOI deadline must be set — omitting it blocks saving
- [ ] Rolling review mode can be enabled with a required review cadence in days (> 0)
- [ ] All configured dates are displayed on the public opportunity detail page
- [ ] Applicants cannot create a workspace before the open date; submission is blocked after the close date
- [ ] Changing dates on a published opportunity automatically creates an Addendum record and triggers applicant notifications

**Priority:** P0 | **Feature Ref:** F4 (PRD-INTAKE-005)

---

### US-1.5: Validate Opportunity Completeness Before Publishing
**As a** Marcus Webb (Program Officer), **I want to** see a publication readiness checklist and run a completeness check before I publish, **so that** I can confirm every required item is in place and avoid publishing incomplete opportunities.

**Acceptance Criteria:**
- [ ] A publication readiness checklist is displayed in the Opportunity Builder sidebar and updates in real time as sections are completed
- [ ] A "Check Readiness" action triggers a full dry-run validation at any time, without publishing
- [ ] Clicking "Publish" triggers a final completeness validation; all blockers must be cleared before publication proceeds
- [ ] Blockers are displayed with specific section names and links to the incomplete field or section
- [ ] Required publication blockers include: metadata fields (F1), open/close dates (F4), at least one eligibility rule (F7), at least one form section, and Assistance Listing Number for federal opportunities
- [ ] Successful publication transitions the opportunity from `Draft` (or `Approved`) to `Published` status
- [ ] A `OPPORTUNITY_PUBLISHED` audit event is logged on successful publication

**Priority:** P0 | **Feature Ref:** F5 (PRD-INTAKE-006)

---

### US-1.6: Track Opportunity Versions and Modification History
**As a** Marcus Webb (Program Officer), **I want to** have every change to a published opportunity versioned and attributed to me, **so that** there is an immutable record of what applicants saw at any point in time.

**Acceptance Criteria:**
- [ ] Every post-publication modification creates a new version record with an incremented sequential version number
- [ ] A modification reason is required for all post-publication changes; blank submissions are rejected
- [ ] Each version record stores the full field snapshot, a field-level change delta, the modification reason, timestamp, and user attribution
- [ ] Version history is accessible to grantors in the Opportunity Builder
- [ ] Prior versions are immutable — they cannot be edited after creation
- [ ] Date changes to a published opportunity automatically create an Addendum record and trigger applicant notifications
- [ ] Removing a required NOFO field from a published opportunity is blocked with an error message

**Priority:** P0 | **Feature Ref:** F6 (PRD-INTAKE-007)

---

## Epic 2: Eligibility and Intake Rules Configuration (Stage 2)

*Allow grantors to convert eligibility and submission requirements into enforceable system rules.*

---

### US-2.1: Define Eligibility Rules
**As a** Marcus Webb (Program Officer), **I want to** define structured eligibility rules for each opportunity, **so that** unqualified applicants are screened out by the system rather than discovered after wasted effort on both sides.

**Acceptance Criteria:**
- [ ] Eligibility rules can be created by rule type: applicant type, geography, entity status, UEI/SAM, nonprofit status, tribal status, state/local status, prior award status, match requirement, or custom
- [ ] Each rule requires a criterion field, operator, criterion value, severity (hard blocker or advisory), and a plain-language explanation text (max 500 chars)
- [ ] Rules can be grouped with AND/OR logic for compound eligibility conditions
- [ ] At least one eligibility rule must be configured before an opportunity can be published (enforced by F5)
- [ ] Eligibility rules from a prior opportunity within the same program can be duplicated
- [ ] Grantors can preview the eligibility questionnaire as applicants will see it
- [ ] An `ELIGIBILITY_RULE_CREATED` audit event is logged with rule details, timestamp, and user

**Priority:** P0 | **Feature Ref:** F7 (PRD-INTAKE-008)

---

### US-2.2: Distinguish Hard Blockers from Advisory Warnings
**As a** Marcus Webb (Program Officer), **I want to** configure each eligibility rule as either a hard blocker or an advisory warning, **so that** truly ineligible applicants are prevented from submitting while borderline applicants receive guidance but can proceed.

**Acceptance Criteria:**
- [ ] Each eligibility rule must have severity set to either `hard_blocker` or `advisory`
- [ ] Hard Blocker rules require an enforcement point: `pre_workspace` (blocks workspace creation) or `pre_submission` (blocks submission)
- [ ] Advisory rules display a USWDS Warning (yellow) alert but do not block workspace creation or submission
- [ ] Hard Blocker rules display a error alert (`gf-alert--error`, red border) alert prominently when triggered
- [ ] When multiple hard blockers are triggered, all are displayed — not just the first
- [ ] Hard blockers with `enforcement_point = pre_workspace` disable the workspace creation button
- [ ] Hard blockers with `enforcement_point = pre_submission` appear as blocking errors in the readiness dashboard

**Priority:** P0 | **Feature Ref:** F8 (PRD-INTAKE-009)

---

### US-2.3: Configure Pre-Screening Questionnaires
**As a** Marcus Webb (Program Officer), **I want to** build a pre-screening questionnaire where each question maps to a configured eligibility rule, **so that** applicants self-select eligibility and responses are stored in the intake record.

**Acceptance Criteria:**
- [ ] Questions can be of type: yes/no, multiple choice, or text
- [ ] Each multiple-choice or yes/no response option can be mapped to a specific eligibility rule and rule outcome (met, violated, or advisory)
- [ ] Hard Blocker rules must have at least one question mapped to them
- [ ] Questionnaire placement must be set to either `pre_workspace` or `pre_submission`
- [ ] Conditional display logic can be configured per question (e.g., show question 3 only if question 2 = "Yes")
- [ ] Grantors can preview the questionnaire as applicants will see it before publication
- [ ] All applicant responses are stored in the intake record and visible in the administrative screening panel

**Priority:** P0 | **Feature Ref:** F9 (PRD-INTAKE-010)

---

### US-2.4: Show and Hide Sections Conditionally
**As a** Jordan Kim (Proposal Lead), **I want to** see only the application sections that apply to my organization type and geography, **so that** I don't waste time on sections that are not relevant to my application.

**Acceptance Criteria:**
- [ ] Application form sections can have conditional display rules configured by the grantor
- [ ] Conditions can be based on: applicant type, program area, geographic scope, funding request amount, or eligibility questionnaire response
- [ ] Sections update in real time as the applicant enters data that triggers condition changes
- [ ] Hidden sections are excluded from completeness validation — no blocking errors for hidden sections
- [ ] Hidden section data (if previously entered) is preserved in the database but excluded from the submission package
- [ ] Grantors can simulate different applicant profiles in preview to verify conditional logic before publishing

**Priority:** P0 | **Feature Ref:** F10 (PRD-INTAKE-011)

---

### US-2.5: Configure Required Attachments
**As a** Marcus Webb (Program Officer), **I want to** specify which documents applicants must upload by applicant type and stage, **so that** applications arrive complete and the system enforces requirements rather than relying on manual checklists.

**Acceptance Criteria:**
- [ ] Attachment requirements can be scoped by applicant type (e.g., only nonprofits must provide IRS Determination Letter)
- [ ] Attachment requirements can be scoped by application stage (pre-application, LOI, or full application)
- [ ] Each requirement can be marked as required (submission blocker) or recommended (warning only)
- [ ] Applicants can fulfill requirements by uploading a new file or selecting from their organization's reusable attachment library
- [ ] Unfulfilled required attachments appear as blocking errors in the readiness dashboard and block submission
- [ ] File size and format restrictions can be configured per attachment type; violations surface a clear error message

**Priority:** P0 | **Feature Ref:** F11 (PRD-INTAKE-012)

---

### US-2.6: Configure Administrative Screening Criteria
**As a** Marcus Webb (Program Officer) and Diana Reyes (Grant Intake Administrator), **I want to** codify the administrative screening checklist in the system per opportunity, **so that** intake administrators follow a consistent, documented process instead of relying on memory or email threads.

**Acceptance Criteria:**
- [ ] Standard auto-populated criteria (deadline check, completeness check, eligibility check) are always present and cannot be removed
- [ ] Custom manual criteria can be added per opportunity with criterion text (max 500 chars) and a suggested disposition on failure
- [ ] Each criterion can be marked as required (must be evaluated before a disposition is applied) or optional
- [ ] Required criteria must be checked or marked failed before a disposition can be applied
- [ ] Auto-populated criteria are pre-filled from system data (e.g., submission timestamp vs. deadline) when an administrator opens a submission
- [ ] At least three criteria are recommended per opportunity for meaningful screening (warning if fewer)

**Priority:** P0 | **Feature Ref:** F12 (PRD-INTAKE-013)

---

## Epic 3: Opportunity Publication and Discovery (Stage 3)

*Provide applicants with a clear, searchable, accessible view of available opportunities.*

---

### US-3.1: Publish Opportunities to Applicant Portal
**As a** Marcus Webb (Program Officer), **I want to** publish an approved opportunity to the applicant-facing portal with one action, **so that** eligible applicants can discover and access the opportunity immediately.

**Acceptance Criteria:**
- [ ] Publishing is available only after all F5 publication blockers are cleared
- [ ] Opportunity visibility must be set to `public` or `restricted_authenticated` before publishing
- [ ] A public URL slug is generated from the opportunity title and FON (unique; system auto-appends suffix on collision)
- [ ] A grantor can preview the applicant-facing page before clicking Publish
- [ ] Opportunity appears in the portal listing with status badge (Open, Closing Soon, Closed, Not Yet Open) and key metadata
- [ ] For restricted opportunities, unauthenticated visitors see only the title and a "Sign in to view" prompt
- [ ] An `OPPORTUNITY_PUBLISHED` audit event is logged on successful publication

**Priority:** P0 | **Feature Ref:** F13 (PRD-INTAKE-014)

---

### US-3.2: Search and Filter Opportunities
**As a** Jordan Kim (Proposal Lead), **I want to** search and filter the opportunity portal by keyword, funder, program area, geography, eligibility type, funding amount, and deadline, **so that** I can quickly identify opportunities that match my organization's profile.

**Acceptance Criteria:**
- [ ] Full-text keyword search operates across opportunity title, executive summary, eligibility summary, program area, and funder name
- [ ] Faceted filters are available for: funder, program area, geography, eligibility type, funding amount range, due date range, and application stage
- [ ] Results can be sorted by relevance (when keyword is active), deadline (ascending), or newest posted
- [ ] Results display as GrantFlow card components (`gf-opp-card`) showing title, funder, program area, deadline, funding range, and status badge
- [ ] Active filters are displayed as removable chips; results update in real time
- [ ] Restricted-visibility opportunities do not appear in unauthenticated search results
- [ ] Results default to open opportunities sorted by deadline; closed opportunities are shown only when explicitly filtered

**Priority:** P0 | **Feature Ref:** F14 (PRD-INTAKE-015)

---

### US-3.3: Access Public Opportunity Pages and Authenticated Workspace View
**As a** Jordan Kim (Proposal Lead), **I want to** view a full opportunity detail page without logging in and then access my personalized application status after logging in, **so that** I can research opportunities before committing to apply and track my progress once started.

**Acceptance Criteria:**
- [ ] The public opportunity detail page renders without authentication for public opportunities, including all metadata, deadlines, eligibility summary, Q&A, and addenda
- [ ] An unauthenticated visitor sees a "Sign in to Apply" call to action
- [ ] An authenticated user without a workspace sees "Start Application" (if intake window is open) or a "Deadline Passed" message
- [ ] An authenticated user with an existing workspace sees "Continue Application" with section completion percentage and blocking error count
- [ ] The page includes breadcrumb navigation, print-friendly layout, and a shareable direct URL
- [ ] The page is WCAG 2.1 AA compliant

**Priority:** P0 | **Feature Ref:** F16 (PRD-INTAKE-017)

---

### US-3.4: See Opportunity Changes and Addenda
**As a** Jordan Kim (Proposal Lead), **I want to** see addenda, deadline changes, and Q&A updates prominently on the opportunity page and receive in-app notifications, **so that** I never miss a change that affects my in-progress application.

**Acceptance Criteria:**
- [ ] All addenda are displayed in the "Updates & Addenda" section of the opportunity detail page in reverse-chronological order with timestamps
- [ ] Deadline changes display old and new values side by side with clear before/after labeling
- [ ] Required application change addenda display a warning banner inside affected applicant workspaces
- [ ] Applicants with saved or started applications receive in-app and email notifications when a new addendum is published
- [ ] The opportunity listing card shows an "Updated" badge for 14 days after the most recent addendum
- [ ] Addenda are immutable once published — corrections require a new addendum

**Priority:** P0 | **Feature Ref:** F17 (PRD-INTAKE-018)

---

## Epic 4: Organization Profile and Credential Readiness (Stage 4)

*Reduce repeated application burden by maintaining reusable applicant data.*

---

### US-4.1: Create and Maintain a Reusable Organization Profile
**As a** Priya Nair (Organization Administrator), **I want to** create one organization profile that persists across all applications, **so that** my team never has to re-enter the same legal and contact information for each opportunity.

**Acceptance Criteria:**
- [ ] An organization profile is created on first platform registration and linked to the organization
- [ ] Exactly one profile record exists per organization; attempting to create a duplicate is blocked with an error
- [ ] Profile data pre-populates applicable fields in every new application workspace
- [ ] Profile can be edited at any time by the organization administrator
- [ ] Profile edits after a submission do not modify the submission snapshot — the submitted record is preserved as-is
- [ ] A profile completeness percentage is displayed to the organization administrator
- [ ] An `ORGANIZATION_PROFILE_CREATED` or `ORGANIZATION_PROFILE_UPDATED` audit event is logged on create and update

**Priority:** P0 | **Feature Ref:** F18 (PRD-INTAKE-019)

---

### US-4.2: Enter All Required Organization Data Fields
**As a** Priya Nair (Organization Administrator), **I want to** enter all standard organizational data fields — legal identity, registration status, tax status, and contacts — in one place, **so that** the system has everything needed to pre-populate federal and non-federal grant applications.

**Acceptance Criteria:**
- [ ] Required profile fields include: legal name, address, city, state (validated 2-letter USPS code), ZIP, entity type, primary contact name and email, and banking readiness (self-attested)
- [ ] UEI (12 alphanumeric characters exactly) and SAM registration status fields are present; SAM expiration date is required when SAM registered = true
- [ ] EIN is validated to 9-digit format (XX-XXXXXXX); SAM expiration date must be a future date when SAM registered = true
- [ ] Entity type options include: nonprofit 501(c)(3), nonprofit other, for-profit, government (federal/state/local), tribal, university, individual, other
- [ ] Tax-exempt status, indirect cost rate, congressional district, and DBA name are optional supplemental fields
- [ ] SAM expiration date is stored and monitored for upcoming expiration (see F21)

**Priority:** P0 | **Feature Ref:** F19 (PRD-INTAKE-020)

---

### US-4.3: Store and Reuse Standard Documents
**As a** Priya Nair (Organization Administrator), **I want to** upload standard documents once to an organization-level library, **so that** my team can attach them to any application without re-uploading each time.

**Acceptance Criteria:**
- [ ] The organization-level document library supports standard document types including: IRS determination letter, W-9, audit reports, indirect cost agreement, board roster, insurance certificate, and letters of support
- [ ] Each document type maintains a version history with timestamps and uploader attribution
- [ ] Documents stored in the library can be selected and attached to any application section without uploading again
- [ ] Prior document versions remain accessible for audit purposes
- [ ] A new upload for an existing document type creates a new version record; it does not overwrite the prior version

**Priority:** P0 | **Feature Ref:** F20 (PRD-INTAKE-021)

---

### US-4.4: Receive Credential Expiration Warnings
**As a** Priya Nair (Organization Administrator), **I want to** be warned before credentials and registrations expire, **so that** I can renew them before they become submission blockers.

**Acceptance Criteria:**
- [ ] The system tracks expiration dates for SAM registration, IRS determination letters, audit reports, and insurance certificates
- [ ] The organization administrator can configure a warning window per credential type (e.g., 90 days for SAM, 30 days for insurance); the system default is 60 days if not customized
- [ ] In-app warnings are displayed when a tracked credential is expired or within the configured expiration warning window
- [ ] Expiration warnings appear in both the organization profile view and the application workspace readiness checklist
- [ ] An expired credential that is required for a specific opportunity is surfaced as a blocking error in the readiness dashboard
- [ ] Warnings are shown to both the organization administrator and the proposal lead

**Priority:** P0 | **Feature Ref:** F21 (PRD-INTAKE-022)

---

### US-4.5: Assign Roles to Team Members
**As a** Priya Nair (Organization Administrator), **I want to** assign roles to team members with enforced permission levels, **so that** each person can access exactly what they need — and the authorized representative's submit authority is formally established in the system.

**Acceptance Criteria:**
- [ ] Available roles include: organization admin, proposal lead, finance contributor, external contributor/subapplicant, and authorized representative
- [ ] Only users with the Authorized Representative role can certify and submit a final application
- [ ] Role assignment is managed by the organization administrator
- [ ] Role-based access is enforced at the section, budget, and submission levels
- [ ] An authorized representative role assignment is visible in the readiness dashboard
- [ ] External contributors have scoped access limited to assigned sections only

**Priority:** P0 | **Feature Ref:** F22 (PRD-INTAKE-023)

---

### US-4.6: Reuse Profile Data While Preserving Submission Snapshots
**As a** Priya Nair (Organization Administrator), **I want to** reuse profile fields across applications while knowing the submitted record preserves the profile data as it was at submission time, **so that** future profile updates don't retroactively change what was submitted.

**Acceptance Criteria:**
- [ ] Organization profile fields pre-populate into application forms for every new workspace
- [ ] At the moment of submission, the system captures a snapshot of the profile state and stores it with the submission record
- [ ] Profile updates made after submission do not alter the submission snapshot in any way
- [ ] The submission snapshot's profile data is accessible in the grantor intake queue alongside the application

**Priority:** P0 | **Feature Ref:** F23 (PRD-INTAKE-024)

---

## Epic 5: Eligibility Pre-Screening (Stage 5)

*Help applicants determine whether to proceed and help grantors reduce unqualified submissions.*

---

### US-5.1: Complete the Eligibility Pre-Screen Workflow
**As a** Jordan Kim (Proposal Lead), **I want to** complete an eligibility questionnaire before I invest significant effort in an application, **so that** I know early whether my organization qualifies and avoid wasted work.

**Acceptance Criteria:**
- [ ] The pre-screen questionnaire is presented at the configured placement point (before workspace creation or before submission)
- [ ] Applicants must answer all required questions before results are shown
- [ ] Conditional questions appear or hide based on prior responses
- [ ] Completing the pre-screen determines whether workspace access is granted (for `pre_workspace` placement) or whether submission is allowed (for `pre_submission` placement)
- [ ] Applicants cannot bypass the questionnaire to access the workspace when placement = `pre_workspace`

**Priority:** P0 | **Feature Ref:** F24 (PRD-INTAKE-025)

---

### US-5.2: See a Clear Eligibility Result
**As a** Jordan Kim (Proposal Lead), **I want to** receive a clear, four-state eligibility result after completing the pre-screen, **so that** I understand immediately whether I should proceed with the application.

**Acceptance Criteria:**
- [ ] Eligibility results are displayed in one of four states: Eligible, Likely Eligible, Needs Attention, or Ineligible
- [ ] Each state has a visually distinct treatment using GrantFlow alert components (`gf-alert`): Eligible = green (success), Likely Eligible = blue/teal (info — positive advisory), Needs Attention = yellow (warning — requires awareness), Ineligible = red (error — blocked)
- [ ] Each result state includes guidance text on the recommended next steps
- [ ] The result screen is presented immediately after the final questionnaire question is answered
- [ ] Hard Blocker violations result in an Ineligible state; Advisory violations with no hard blockers result in Needs Attention; no violations result in Eligible; minor advisory-only concerns with no triggered warnings result in Likely Eligible

**Priority:** P0 | **Feature Ref:** F25 (PRD-INTAKE-026)

---

### US-5.3: Understand Why I Was Blocked
**As a** Jordan Kim (Proposal Lead), **I want to** see a plain-language explanation for each eligibility determination that blocked or warned me, **so that** I understand exactly which answer triggered the result and what it means for my eligibility.

**Acceptance Criteria:**
- [ ] Each triggered rule displays its configured plain-language explanation text (not a rule code or technical identifier)
- [ ] The explanation identifies which questionnaire response triggered the rule
- [ ] A link to the relevant eligibility section of the opportunity is included for reference
- [ ] All triggered blockers are shown — not just the first one
- [ ] Advisory warnings are displayed separately from hard blockers with distinct visual treatment

**Priority:** P0 | **Feature Ref:** F26 (PRD-INTAKE-027)

---

### US-5.4: Store Eligibility Responses in the Intake Record
**As a** Diana Reyes (Grant Intake Administrator), **I want to** see every applicant's pre-screen responses in the intake queue alongside their submission, **so that** I don't have to ask applicants to repeat eligibility information during administrative screening.

**Acceptance Criteria:**
- [ ] All eligibility pre-screen responses are stored in the application record at the time the questionnaire is completed
- [ ] Eligibility responses are visible in the administrative screening panel for each submitted application
- [ ] Eligibility responses are included in the submission snapshot
- [ ] The stored responses cannot be edited by the applicant after completion
- [ ] The eligibility result state (Eligible, Likely Eligible, Needs Attention, Ineligible) is displayed alongside the detailed responses in the intake queue

**Priority:** P0 | **Feature Ref:** F28 (PRD-INTAKE-029)

---

## Epic 6: Application Workspace (Stage 6)

*Provide a collaborative, structured, and controlled application preparation environment.*

---

### US-6.1: Enforce One Workspace Per Organization Per Opportunity
**As a** Jordan Kim (Proposal Lead), **I want to** have one dedicated application workspace per opportunity for my organization, **so that** there is no confusion about which application is the real one and duplicate submissions are prevented.

**Acceptance Criteria:**
- [ ] Exactly one application workspace is created per applicant organization per opportunity by default
- [ ] An attempt to create a second workspace for the same org and opportunity is blocked with a clear error message
- [ ] A configurable exception allows multiple workspaces for multi-track programs when enabled by the grantor
- [ ] The workspace is accessible to all team members with appropriate roles

**Priority:** P0 | **Feature Ref:** F29 (PRD-INTAKE-030)

---

### US-6.2: Navigate Structured Workspace Sections
**As a** Jordan Kim (Proposal Lead), **I want to** see all application sections clearly organized in my workspace, **so that** I always know what the application requires and how much remains to complete.

**Acceptance Criteria:**
- [ ] Standard sections are available: Organization Profile, Eligibility, Narrative, Budget, Workplan, Performance Measures, Attachments, Certifications, Review/Submit
- [ ] Section visibility is configurable by the grantor per opportunity; sections not applicable to an opportunity are hidden
- [ ] Each section displays a completion status indicator (complete, incomplete, has errors)
- [ ] Section-level completion percentage is tracked and reflected in the readiness dashboard

**Priority:** P0 | **Feature Ref:** F30 (PRD-INTAKE-031)

---

### US-6.3: Assign Section Owners, Tasks, and Internal Deadlines
**As a** Jordan Kim (Proposal Lead), **I want to** assign each section to a specific team member and set internal due dates and tasks, **so that** application coordination happens inside the workspace instead of across email threads and shared drives.

**Acceptance Criteria:**
- [ ] A section owner can be assigned to any team member with the appropriate role
- [ ] Internal section due dates can be set independently of the submission deadline
- [ ] Tasks can be created within a section and assigned to team members
- [ ] Section-level comments are visible to assigned team members
- [ ] Section ownership and internal deadlines are grantee-private — not visible to the grantor

**Priority:** P0 | **Feature Ref:** F31 (PRD-INTAKE-032)

---

### US-6.4: Leave Private Internal Comments
**As a** Jordan Kim (Proposal Lead), **I want to** leave internal comments on sections that are visible only to my team, **so that** I can coordinate with contributors without those notes appearing in what the grantor receives.

**Acceptance Criteria:**
- [ ] Internal comments are visible only to the applicant organization's team members
- [ ] Comments are clearly labeled as grantee-private
- [ ] Internal comments are not included in the submission snapshot or grantor-facing intake queue
- [ ] Comments are stored in the grantee-private data zone; the system enforces this boundary

**Priority:** P0 | **Feature Ref:** F32 (PRD-INTAKE-033)

---

### US-6.5: Use the Readiness Dashboard to Track Submission Readiness
**As a** Jordan Kim (Proposal Lead) and Sandra Okafor (Authorized Representative), **I want to** see a single readiness dashboard that shows overall completion, blocking errors, missing attachments, and authorized submitter status, **so that** I know exactly what must be resolved before submission.

**Acceptance Criteria:**
- [ ] The readiness dashboard displays overall completion percentage broken down by section
- [ ] All blocking errors are listed with links to the source field or section
- [ ] Warnings and informational items are displayed separately from blocking errors
- [ ] Required attachments status is shown with missing item indicators
- [ ] The authorized representative role assignment status is displayed — specifically whether the role is assigned and the user is ready to certify
- [ ] The readiness dashboard updates in real time as team members make changes

**Priority:** P0 | **Feature Ref:** F34 (PRD-INTAKE-035)

---

### US-6.6: Keep Draft Content Private Until Submission
**As a** Jordan Kim (Proposal Lead), **I want to** know that my application draft is completely private from the grantor until I submit, **so that** I can work freely on the application without premature disclosure.

**Acceptance Criteria:**
- [ ] Draft application content is in the grantee-private data zone; grantors cannot access it while in draft status
- [ ] The system enforces the privacy boundary at both the data and UI layers
- [ ] No grantor-facing interface surfaces draft content before submission
- [ ] Exceptions (configured pre-application or Q&A workflows explicitly shared by the applicant) are clearly labeled as shared
- [ ] The data visibility boundary is enforced regardless of user role or session

**Priority:** P0 | **Feature Ref:** F35 (PRD-INTAKE-036)

---

## Epic 7: Form, Budget, and Attachment Intake (Stage 7)

*Capture intake data as structured data wherever possible, not only as uploaded PDFs.*

---

### US-7.1: Complete Forms with Configurable Field Types
**As a** Jordan Kim (Proposal Lead), **I want to** fill out forms that support all the field types needed for a grant application, **so that** I can enter structured data rather than uploading a document for every response.

**Acceptance Criteria:**
- [ ] Supported field types include: text, number, date, currency, picklist, checkbox, file upload, calculated fields, and repeating tables
- [ ] Grantors configure the form builder with field validation settings before publication
- [ ] Grantors can preview the form before publishing
- [ ] Calculated fields update automatically based on related field inputs
- [ ] Repeating table rows can be added or removed dynamically by the applicant

**Priority:** P0 | **Feature Ref:** F36 (PRD-INTAKE-037)

---

### US-7.2: See Field Limits and Formatting Guidance While Filling Out Forms
**As a** Jordan Kim (Proposal Lead), **I want to** see character/page limits and inline formatting guidance for every field, **so that** I know exactly what is expected and can stay within requirements without discovering violations at submission.

**Acceptance Criteria:**
- [ ] Character limits are enforced with a real-time counter displayed below text fields
- [ ] Required fields are clearly marked with a required field indicator
- [ ] Exceeding a character limit prevents additional input or surfaces an immediate inline error
- [ ] Conditional fields display or hide in real time based on prior responses
- [ ] In-line help text and formatting guidance is shown per field as configured by the grantor

**Priority:** P0 | **Feature Ref:** F37 (PRD-INTAKE-038)

---

### US-7.3: Enter a Structured Budget
**As a** Jordan Kim (Proposal Lead), **I want to** build the budget in a structured form with categories, cost-share tracking, and budget period management, **so that** the budget is captured as data rather than as an uploaded document.

**Acceptance Criteria:**
- [ ] Budget categories are configurable and include at minimum: personnel, fringe, travel, equipment, supplies, indirect, and other
- [ ] Cost-share / match fields and indirect cost fields are available per budget line
- [ ] Single-year and multi-year budget periods are supported
- [ ] Budget justification narrative fields are available per category
- [ ] Budget totals and subtotals are calculated automatically and displayed in real time
- [ ] The budget builder adapts to opportunity-specific category configuration

**Priority:** P0 | **Feature Ref:** F38 (PRD-INTAKE-039)

---

### US-7.4: Validate the Budget Automatically
**As a** Jordan Kim (Proposal Lead), **I want to** see budget validation errors surfaced immediately as I build the budget, **so that** I resolve issues during drafting rather than at submission time.

**Acceptance Criteria:**
- [ ] Totals and subtotals are auto-calculated; manual overrides are not accepted
- [ ] The funding request amount is validated against the opportunity's maximum award ceiling; exceeding it is a blocking error
- [ ] Cost-share / match requirements configured by the grantor are validated against entered amounts; failures are blocking errors
- [ ] Required budget justification narratives must be completed for categories where the grantor requires them; omissions are blocking errors
- [ ] All budget blocking errors are surfaced in the readiness dashboard with links to the specific budget line or category

**Priority:** P0 | **Feature Ref:** F39 (PRD-INTAKE-040)

---

### US-7.5: Fulfill Attachment Requirements by Section and Applicant Type
**As a** Jordan Kim (Proposal Lead), **I want to** see exactly which attachments my organization type must provide per section, **so that** I can fulfill every requirement without guessing or missing something at the last moment.

**Acceptance Criteria:**
- [ ] Attachment requirements are displayed per section, filtered to the applicant's type
- [ ] Applicant-type-specific requirements are shown only to organizations of that type
- [ ] Attachments can be uploaded directly or selected from the organization's reusable document library
- [ ] Missing required attachments are shown as blocking errors in the readiness dashboard
- [ ] The system distinguishes between required attachments (submission blocker) and recommended attachments (warning only)

**Priority:** P0 | **Feature Ref:** F40 (PRD-INTAKE-041)

---

### US-7.6: Replace Attachments with Full Version History
**As a** Priya Nair (Organization Administrator), **I want to** replace uploaded attachments while keeping a full history of prior versions, **so that** the audit record shows every document version and I can confirm what was submitted.

**Acceptance Criteria:**
- [ ] Replacing an uploaded attachment creates a new version record with a timestamp and uploader attribution
- [ ] Prior versions are preserved in version history and accessible to the applicant team
- [ ] The final submission snapshot captures the current version at the time of submission — prior versions are not included in the submission package
- [ ] Version history is accessible to the organization administrator and proposal lead but not to the grantor before submission

**Priority:** P0 | **Feature Ref:** F41 (PRD-INTAKE-042)

---

### US-7.7: Preview the Complete Submission Package Before Submitting
**As a** Jordan Kim (Proposal Lead) and Sandra Okafor (Authorized Representative), **I want to** generate a preview of exactly what the grantor will receive before the authorized representative submits, **so that** I can confirm the package is complete and correct with no surprises.

**Acceptance Criteria:**
- [ ] A "Preview Submission Package" action generates a human-readable view of the complete package: all sections, form data, budget, and attachments
- [ ] The preview is rendered in GrantFlow-styled format and is printable
- [ ] The preview does not initiate submission — it is a read-only view
- [ ] Generating a preview does not lock the application or change its status
- [ ] The preview shows only content that will appear in the grantor's intake view (grantee-private internal comments are excluded)

**Priority:** P0 | **Feature Ref:** F42 (PRD-INTAKE-043)

---

## Epic 8: Q&A, Clarifications, and Addenda (Stage 8)

*Manage applicant questions and opportunity clarifications in a transparent, auditable way.*

---

### US-8.1: Configure Q&A for an Opportunity
**As a** Marcus Webb (Program Officer), **I want to** enable or disable applicant question submission and configure the question window per opportunity, **so that** I control when and how applicants can submit questions.

**Acceptance Criteria:**
- [ ] Q&A can be enabled or disabled per opportunity
- [ ] A question submission window (open/close dates) can be configured when Q&A is enabled
- [ ] Submitted questions are routed to designated grantor staff for response
- [ ] Applicants cannot submit questions outside the configured window
- [ ] The Q&A status (open/closed) is visible on the opportunity detail page

**Priority:** P0 | **Feature Ref:** F43 (PRD-INTAKE-044)

---

### US-8.2: Publish Q&A Responses Visible to All Applicants
**As a** Marcus Webb (Program Officer), **I want to** draft and publish Q&A responses that all applicants can see, **so that** every applicant has equal access to clarifications and no one has an information advantage.

**Acceptance Criteria:**
- [ ] Grantors draft a Q&A response in the system and publish it to the opportunity page
- [ ] Published responses are visible to all applicants on the opportunity detail page
- [ ] Applicants with a saved or started application receive in-app and email notifications within 15 minutes of a Q&A response being published
- [ ] Q&A responses are displayed chronologically with timestamps
- [ ] Published Q&A creates an Addendum record and appears in the opportunity's Updates & Addenda section

**Priority:** P0 | **Feature Ref:** F44 (PRD-INTAKE-045)

---

### US-8.3: View the Complete Auditable Q&A and Addenda History
**As a** Marcus Webb (Program Officer) and Diana Reyes (Grant Intake Administrator), **I want to** access a complete, immutable history of all questions, responses, addenda, and date changes, **so that** there is an authoritative record of every communication for audit and fairness verification.

**Acceptance Criteria:**
- [ ] A complete history of all questions submitted, responses published, addenda issued, and date changes is maintained by the system
- [ ] Every record includes a timestamp and user attribution (who submitted/published)
- [ ] History is immutable — no record can be deleted or edited after creation
- [ ] The history is accessible to grantor users and visible on the opportunity page for applicants (for published items)
- [ ] The history is included in intake data exports (F63)

**Priority:** P0 | **Feature Ref:** F46 (PRD-INTAKE-047)

---

### US-8.4: Receive Notifications When Addenda or Deadlines Change
**As a** Jordan Kim (Proposal Lead), **I want to** be notified automatically when the grantor publishes an addendum or changes a deadline, **so that** I can update my application promptly and never miss a change.

**Acceptance Criteria:**
- [ ] In-app and email notifications are sent to all applicants with a saved or started application within 15 minutes of an addendum being published
- [ ] Deadline change notifications include both the old and new deadline values
- [ ] Required application change notifications include a link to the impacted section in the workspace
- [ ] Notifications are triggered immediately on addendum publication — not batched or delayed
- [ ] Applicants who have not yet started a workspace (no saved application) do not receive these notifications

**Priority:** P0 | **Feature Ref:** F47 (PRD-INTAKE-048)

---

## Epic 9: Validation and Submission (Stage 9)

*Ensure only authorized, complete, and review-ready submissions enter the grantor intake queue.*

---

### US-9.1: See Validation Errors as I Draft
**As a** Jordan Kim (Proposal Lead), **I want to** see field-level validation errors as I fill out the application — not only when I attempt to submit — **so that** I can fix issues early and avoid a last-minute blocking crisis.

**Acceptance Criteria:**
- [ ] Field-level validation is triggered in real time as the applicant enters and leaves each field
- [ ] A section-level validation summary is visible in the readiness dashboard as errors accumulate
- [ ] A final validation run is triggered when the applicant initiates a submission attempt
- [ ] All validation results are actionable — each error links to the specific field or section in error
- [ ] The total count of blocking errors is always visible in the readiness dashboard header

**Priority:** P0 | **Feature Ref:** F48 (PRD-INTAKE-049)

---

### US-9.2: Understand Which Validation Issues Block Submission
**As a** Jordan Kim (Proposal Lead), **I want to** see validation messages classified by severity (blocking, warning, informational), **so that** I know which issues I must fix before I can submit and which are optional to address.

**Acceptance Criteria:**
- [ ] Validation messages are classified into three tiers: Blocking (red), Warning (yellow), Informational (blue)
- [ ] Blocking messages prevent submission; warnings and informational messages do not
- [ ] Each tier has a distinct visual treatment using GrantFlow alert components (`gf-alert`)
- [ ] All three tiers are displayed in the readiness dashboard
- [ ] Blocking messages include a direct link to the field or section with the error

**Priority:** P0 | **Feature Ref:** F49 (PRD-INTAKE-050)

---

### US-9.3: Be Prevented from Submitting an Incomplete Application
**As a** Diana Reyes (Grant Intake Administrator), **I want to** know that the system prevents submission of any application with unresolved blocking issues, **so that** incomplete applications never enter my intake queue.

**Acceptance Criteria:**
- [ ] The Submit button is disabled when any blocking item remains unresolved
- [ ] Blocking items include: mandatory fields missing, required certifications incomplete, required attachments missing, eligibility hard blockers unresolved, budget validation failures, and authorized representative role not assigned
- [ ] Clicking the Submit button when blockers exist displays the full list of blocking items with remediation links
- [ ] All blocking items must be cleared before the Submit button is enabled
- [ ] Authorized submitter role must be confirmed at the time of submission

**Priority:** P0 | **Feature Ref:** F50 (PRD-INTAKE-051)

---

### US-9.4: Certify the Application as Authorized Representative
**As a** Sandra Okafor (Authorized Representative), **I want to** complete a clear, formal certification step before the application is submitted, **so that** I know exactly what I am legally certifying and the system records my action.

**Acceptance Criteria:**
- [ ] A certification step is required as the final action before submission
- [ ] Only users with the Authorized Representative role can complete the certification
- [ ] The certification presents legally appropriate language configurable by the grantor
- [ ] The certification action is logged as an audit event with timestamp and user attribution
- [ ] The application cannot be submitted unless the certification is completed in the same session by an authorized representative
- [ ] Before certifying, the Authorized Representative can leave a private flag or comment on any section of the submission package preview; flagging a concern notifies the Proposal Lead without blocking or reverting the application
- [ ] A pre-certification concern flag does not change the application status; it is stored as a grantee-private note visible to the applicant team only

**Priority:** P0 | **Feature Ref:** F51 (PRD-INTAKE-052)

---

### US-9.5: Receive an Immutable Submission Snapshot and Receipt
**As a** Sandra Okafor (Authorized Representative), **I want to** receive a confirmation number, UTC timestamp, and downloadable receipt immediately after submission, **so that** I have portable proof of timely submission.

**Acceptance Criteria:**
- [ ] On successful submission, a unique confirmation number is assigned and displayed immediately
- [ ] A UTC timestamp is recorded and displayed on the receipt
- [ ] A downloadable receipt is generated and accessible to the applicant team
- [ ] The receipt is accessible in the grantor intake queue as well
- [ ] The submission snapshot is immutable — no field, section, or attachment can be altered after this point except through a formal workflow
- [ ] 100% of submissions generate a receipt with a confirmation number, UTC timestamp, and full audit trail

**Priority:** P0 | **Feature Ref:** F52 (PRD-INTAKE-053)

---

### US-9.6: Confirm the Submission Package Exists in Both Human and Machine-Readable Formats
**As a** Diana Reyes (Grant Intake Administrator), **I want to** access submitted applications in both a human-readable format and a structured data format, **so that** I can review applications directly and downstream systems can process the data.

**Acceptance Criteria:**
- [ ] A human-readable package (PDF or GrantFlow-styled HTML) is generated and stored at the time of submission
- [ ] A machine-readable structured data package (JSON or XML) is generated and stored at the time of submission
- [ ] Both formats are accessible in the grantor intake queue for each submitted application
- [ ] Both formats are generated simultaneously at submission — there is no delay between them
- [ ] Neither format can be modified after generation

**Priority:** P0 | **Feature Ref:** F53 (PRD-INTAKE-054)

---

### US-9.7: Have the Application Locked After Submission
**As a** Diana Reyes (Grant Intake Administrator), **I want to** know that submitted applications cannot be edited by the applicant after submission, **so that** the submission record is authoritative and the intake queue reflects what was actually submitted.

**Acceptance Criteria:**
- [ ] The application is locked at the field, section, and attachment levels immediately upon successful submission
- [ ] Edit prevention is enforced for all team members regardless of role
- [ ] Unlocking is only possible through: applicant-initiated withdrawal, grantor-initiated formal reopening, or grantor-initiated return-for-correction workflow
- [ ] All lock and unlock events are logged in the audit trail with timestamp and user attribution

**Priority:** P0 | **Feature Ref:** F54 (PRD-INTAKE-055)

---

## Epic 10: Intake Queue and Administrative Screening (Stage 10)

*Give grantors a structured queue for receiving, validating, triaging, and routing applications.*

---

### US-10.1: Route Submitted Applications to the Intake Queue Automatically
**As a** Diana Reyes (Grant Intake Administrator), **I want to** have submitted applications automatically routed into the correct intake queue based on configured rules, **so that** no submission is lost or misrouted.

**Acceptance Criteria:**
- [ ] Submitted applications are automatically placed in the intake queue immediately upon successful submission
- [ ] Routing rules are configurable per opportunity or program based on: applicant type, geographic region, funding track, or custom workflow configuration
- [ ] Queue assignment is visible in the grantor administrative panel
- [ ] Applications in the queue display their routing assignment (which queue/administrator they are assigned to)
- [ ] A `SUBMISSION_RECEIVED` audit event is logged on intake queue entry

**Priority:** P0 | **Feature Ref:** F55 (PRD-INTAKE-056)

---

### US-10.2: View Complete Application Details in the Intake Queue
**As a** Diana Reyes (Grant Intake Administrator), **I want to** see all the information I need to screen an application directly in the intake queue without opening individual files, **so that** I can process applications efficiently.

**Acceptance Criteria:**
- [ ] The intake queue displays for each application: submission status and timestamp, applicant organization profile summary, eligibility pre-screen results, validation summary (all blocking errors resolved at submission), attachment list with completeness status, and requested funding amount
- [ ] Applications can be sorted and filtered by submission date, organization name, funding amount, eligibility result, and disposition status
- [ ] Clicking an application opens its full detail view with all intake data
- [ ] The queue view is updated in real time as new applications are submitted

**Priority:** P0 | **Feature Ref:** F56 (PRD-INTAKE-057)

---

### US-10.3: Apply an Administrative Screening Disposition
**As a** Diana Reyes (Grant Intake Administrator), **I want to** apply a formal disposition to each application from a configured checklist, **so that** the intake outcome is recorded in the system rather than tracked in a spreadsheet.

**Acceptance Criteria:**
- [ ] Available dispositions include: Accepted for Review, Returned for Correction, Withdrawn, Ineligible, Duplicate, Late, and Administratively Rejected
- [ ] Applying a disposition requires completing all required administrative screening criteria (F12)
- [ ] Each disposition action is logged with a timestamp and the administrator's user attribution
- [ ] Applying a disposition triggers an applicant notification with the outcome
- [ ] Disposition history is preserved in the audit trail and cannot be deleted or altered

**Priority:** P0 | **Feature Ref:** F57 (PRD-INTAKE-058)

---

### US-10.4: Send a Correction or Clarification Request to an Applicant
**As a** Diana Reyes (Grant Intake Administrator), **I want to** send a formal correction or clarification request tied to specific sections or attachments, **so that** applicants know exactly what to fix and the request is tracked in the system.

**Acceptance Criteria:**
- [ ] Correction/clarification requests are generated within the intake queue and tied to the specific application
- [ ] Requests can reference specific sections or attachments that require correction
- [ ] The request triggers an applicant notification with instructions on what to correct and a link to the application workspace
- [ ] A correction window duration is configurable per opportunity
- [ ] The request and its status (open, resolved, timed out) are visible in the intake queue
- [ ] When the correction window expires without the applicant resubmitting, the system automatically transitions the application to **Administratively Rejected** disposition, notifies the applicant team and Diana, and logs a `CORRECTION_WINDOW_EXPIRED` audit event with timestamp and attribution
- [ ] Diana can manually override the auto-rejection and apply a different disposition after the window expires, with an override reason required

**Priority:** P0 | **Feature Ref:** F58 (PRD-INTAKE-059)

---

### US-10.5: Preserve the Original Submission When a Correction Is Requested
**As a** Diana Reyes (Grant Intake Administrator), **I want to** have the original submission snapshot preserved alongside any corrected resubmission, **so that** the audit record shows both what was first submitted and what was ultimately corrected.

**Acceptance Criteria:**
- [ ] When a correction is requested and the applicant resubmits, a new versioned snapshot is created — the original is not overwritten
- [ ] Both the original and corrected snapshots are accessible in the intake queue
- [ ] Version history links both snapshots to the same intake record
- [ ] Neither the original nor the corrected snapshot can be edited after creation
- [ ] The version sequence (original → corrected → resubmitted) is clearly labeled in the intake queue view

**Priority:** P0 | **Feature Ref:** F59 (PRD-INTAKE-060)

---

### US-10.6: Route Accepted Applications to the Review Workflow
**As a** Diana Reyes (Grant Intake Administrator), **I want to** route accepted applications to the review workflow with one action, **so that** the handoff from intake to review is clean, tracked, and does not require manual intervention.

**Acceptance Criteria:**
- [ ] Applications with an "Accepted for Review" disposition are automatically routed to the configured review, scoring, or risk assessment workflow
- [ ] Routing destination is configurable by opportunity or program
- [ ] A `INTAKE_HANDOFF` audit event is logged when an application is routed to review
- [ ] Review workflow access is provisioned for assigned reviewers upon handoff
- [ ] The intake queue shows the handoff status for each accepted application

**Priority:** P0 | **Feature Ref:** F60 (PRD-INTAKE-061)

---

## Epic 11: Intake Analytics and Reporting (Stage 11)

*Provide grantors and applicants visibility into intake status, bottlenecks, and quality.*

---

### US-11.1: Monitor Intake Status on a Grantor Dashboard
**As a** Marcus Webb (Program Officer) and Diana Reyes (Grant Intake Administrator), **I want to** view a real-time dashboard of opportunity and application intake status, **so that** I can track progress, identify bottlenecks, and manage deadlines across my program portfolio.

**Acceptance Criteria:**
- [ ] The dashboard displays opportunity views: published, active, and closed
- [ ] Application counts are shown: started, submitted, incomplete, and late per opportunity
- [ ] A validation error summary is displayed by opportunity (count of common errors)
- [ ] Intake disposition summary shows counts by disposition state (Accepted, Returned, Rejected, etc.)
- [ ] The dashboard can be filtered by opportunity, program, and date range
- [ ] Dashboard data reflects the current state and updates without requiring a manual page refresh

**Priority:** P0 | **Feature Ref:** F61 (PRD-INTAKE-062)

---

### US-11.2: Track My Applications on a Personal Applicant Dashboard
**As a** Jordan Kim (Proposal Lead), **I want to** see all my organization's application activity in one dashboard, **so that** I can track progress, spot missing items, and monitor deadlines across every active opportunity.

**Acceptance Criteria:**
- [ ] The dashboard shows all opportunities where the organization has a saved or started application
- [ ] Per-opportunity application progress is shown by section and overall percentage
- [ ] Upcoming deadlines are displayed with countdown indicators (days remaining)
- [ ] Missing required items are listed with links to the relevant workspace section
- [ ] Full submission history is accessible with status labels and receipt access for completed submissions
- [ ] The dashboard is personalized to the logged-in user's organization — no cross-organization data is visible

**Priority:** P0 | **Feature Ref:** F62 (PRD-INTAKE-063)

---

### US-11.3: Export Intake Data for Reporting and Audit
**As a** Diana Reyes (Grant Intake Administrator), **I want to** export intake data including submissions, eligibility results, disposition history, and audit events, **so that** I can produce program reports and support compliance audits.

**Acceptance Criteria:**
- [ ] Intake data can be exported by opportunity, date range, or disposition state
- [ ] Export formats include CSV, Excel, and structured JSON
- [ ] Export content includes: submission metadata, eligibility pre-screen results, disposition history, and audit events
- [ ] Export access is controlled by role — only authorized grantor roles can export
- [ ] The export does not include grantee-private content (internal comments, pre-submission draft data)
- [ ] Exports are generated within a reasonable time and available for download

**Priority:** P0 | **Feature Ref:** F63 (PRD-INTAKE-064)

---

## Story Index

| Story ID | Title | Priority | Feature Ref | Persona |
|---|---|---|---|---|
| US-1.0 | Access the Grantor Portal and Navigate to Core Workflows | P0 | Shell / F0–F63 | Marcus Webb / Diana Reyes |
| US-1.1 | Create Opportunity from Template | P0 | F0 | Marcus Webb |
| US-1.2 | Capture Structured Opportunity Metadata | P0 | F1 | Marcus Webb |
| US-1.3 | Write Descriptions with Plain-Language Guidance | P0 | F2 | Marcus Webb |
| US-1.4 | Configure Intake Windows and Deadlines | P0 | F4 | Marcus Webb |
| US-1.5 | Validate Opportunity Completeness Before Publishing | P0 | F5 | Marcus Webb |
| US-1.6 | Track Opportunity Versions and Modification History | P0 | F6 | Marcus Webb |
| US-2.1 | Define Eligibility Rules | P0 | F7 | Marcus Webb |
| US-2.2 | Distinguish Hard Blockers from Advisory Warnings | P0 | F8 | Marcus Webb |
| US-2.3 | Configure Pre-Screening Questionnaires | P0 | F9 | Marcus Webb |
| US-2.4 | Show and Hide Sections Conditionally | P0 | F10 | Jordan Kim |
| US-2.5 | Configure Required Attachments | P0 | F11 | Marcus Webb |
| US-2.6 | Configure Administrative Screening Criteria | P0 | F12 | Marcus Webb / Diana Reyes |
| US-3.1 | Publish Opportunities to Applicant Portal | P0 | F13 | Marcus Webb |
| US-3.2 | Search and Filter Opportunities | P0 | F14 | Jordan Kim |
| US-3.3 | Access Public Pages and Authenticated Workspace View | P0 | F16 | Jordan Kim |
| US-3.4 | See Opportunity Changes and Addenda | P0 | F17 | Jordan Kim |
| US-4.1 | Create and Maintain a Reusable Organization Profile | P0 | F18 | Priya Nair |
| US-4.2 | Enter All Required Organization Data Fields | P0 | F19 | Priya Nair |
| US-4.3 | Store and Reuse Standard Documents | P0 | F20 | Priya Nair |
| US-4.4 | Receive Credential Expiration Warnings | P0 | F21 | Priya Nair |
| US-4.5 | Assign Roles to Team Members | P0 | F22 | Priya Nair |
| US-4.6 | Reuse Profile Data While Preserving Submission Snapshots | P0 | F23 | Priya Nair |
| US-5.1 | Complete the Eligibility Pre-Screen Workflow | P0 | F24 | Jordan Kim |
| US-5.2 | See a Clear Eligibility Result | P0 | F25 | Jordan Kim |
| US-5.3 | Understand Why I Was Blocked | P0 | F26 | Jordan Kim |
| US-5.4 | Store Eligibility Responses in the Intake Record | P0 | F28 | Diana Reyes |
| US-6.1 | Enforce One Workspace Per Organization Per Opportunity | P0 | F29 | Jordan Kim |
| US-6.2 | Navigate Structured Workspace Sections | P0 | F30 | Jordan Kim |
| US-6.3 | Assign Section Owners, Tasks, and Internal Deadlines | P0 | F31 | Jordan Kim |
| US-6.4 | Leave Private Internal Comments | P0 | F32 | Jordan Kim |
| US-6.5 | Use the Readiness Dashboard | P0 | F34 | Jordan Kim / Sandra Okafor |
| US-6.6 | Keep Draft Content Private Until Submission | P0 | F35 | Jordan Kim |
| US-7.1 | Complete Forms with Configurable Field Types | P0 | F36 | Jordan Kim |
| US-7.2 | See Field Limits and Formatting Guidance | P0 | F37 | Jordan Kim |
| US-7.3 | Enter a Structured Budget | P0 | F38 | Jordan Kim |
| US-7.4 | Validate the Budget Automatically | P0 | F39 | Jordan Kim |
| US-7.5 | Fulfill Attachment Requirements by Section and Type | P0 | F40 | Jordan Kim |
| US-7.6 | Replace Attachments with Full Version History | P0 | F41 | Priya Nair |
| US-7.7 | Preview the Complete Submission Package | P0 | F42 | Jordan Kim / Sandra Okafor |
| US-8.1 | Configure Q&A for an Opportunity | P0 | F43 | Marcus Webb |
| US-8.2 | Publish Q&A Responses Visible to All Applicants | P0 | F44 | Marcus Webb |
| US-8.3 | View the Complete Auditable Q&A and Addenda History | P0 | F46 | Marcus Webb / Diana Reyes |
| US-8.4 | Receive Notifications When Addenda or Deadlines Change | P0 | F47 | Jordan Kim |
| US-9.1 | See Validation Errors as I Draft | P0 | F48 | Jordan Kim |
| US-9.2 | Understand Which Validation Issues Block Submission | P0 | F49 | Jordan Kim |
| US-9.3 | Be Prevented from Submitting an Incomplete Application | P0 | F50 | Diana Reyes |
| US-9.4 | Certify the Application as Authorized Representative | P0 | F51 | Sandra Okafor |
| US-9.5 | Receive an Immutable Submission Snapshot and Receipt | P0 | F52 | Sandra Okafor |
| US-9.6 | Confirm Both Human and Machine-Readable Submission Formats | P0 | F53 | Diana Reyes |
| US-9.7 | Have the Application Locked After Submission | P0 | F54 | Diana Reyes |
| US-10.1 | Route Submitted Applications to the Intake Queue Automatically | P0 | F55 | Diana Reyes |
| US-10.2 | View Complete Application Details in the Intake Queue | P0 | F56 | Diana Reyes |
| US-10.3 | Apply an Administrative Screening Disposition | P0 | F57 | Diana Reyes |
| US-10.4 | Send a Correction or Clarification Request | P0 | F58 | Diana Reyes |
| US-10.5 | Preserve the Original Submission on Correction | P0 | F59 | Diana Reyes |
| US-10.6 | Route Accepted Applications to the Review Workflow | P0 | F60 | Diana Reyes |
| US-11.1 | Monitor Intake Status on a Grantor Dashboard | P0 | F61 | Marcus Webb / Diana Reyes |
| US-11.2 | Track My Applications on a Personal Dashboard | P0 | F62 | Jordan Kim |
| US-11.3 | Export Intake Data for Reporting and Audit | P0 | F63 | Diana Reyes |

---

## Phase 8 Stories — Grants.gov Opportunity Ingestion

*Added: 2026-09-02 — PRD-INTAKE-019A through 019E*

### Stage: External Opportunity Discovery (Grants.gov)

#### US-P8.1: Browse Opportunities from Grants.gov
**As** Jordan Kim (Proposal Manager),  
**I want** to browse active funding opportunities pulled directly from Grants.gov,  
**so that** I can discover external funding sources without leaving GrantsIntake.

**Acceptance Criteria:**
- A "Browse Grants.gov" page is accessible from the applicant sidebar
- Results are paginated (25 per page) and show title, agency, status, due date, and award range
- I can filter by status, keyword, agency, due date range, and award ceiling/floor
- Results are sourced from the live Grants.gov API and refreshed every 6 hours
- A "Powered by Grants.gov API" attribution badge is visible on the page

**PRD:** PRD-INTAKE-019A, PRD-INTAKE-019B | **Feature:** F66, F67 | **Priority:** P0 | **Persona:** Jordan Kim

---

#### US-P8.2: Save and Track an External Opportunity
**As** Jordan Kim (Proposal Manager),  
**I want** to save external Grants.gov opportunities I'm interested in,  
**so that** I can track them and receive alerts when they change.

**Acceptance Criteria:**
- Each opportunity card has a Save/Unsave toggle button
- Saved opportunities appear in a "Saved from Grants.gov" section on my dashboard
- I can unsave an opportunity at any time
- Saving requires authentication; browsing does not

**PRD:** PRD-INTAKE-019C | **Feature:** F68 | **Priority:** P0 | **Persona:** Jordan Kim

---

#### US-P8.3: Receive Alerts When a Tracked Opportunity Changes
**As** Jordan Kim (Proposal Manager),  
**I want** to receive in-app alerts when a saved opportunity's due date, status, package, or instructions change,  
**so that** I can respond quickly without manually monitoring Grants.gov.

**Acceptance Criteria:**
- An alert bell icon in the applicant header shows unread alert count
- Alert types include: due date change, status change, package change, addenda change, instructions change
- Each alert shows the opportunity title, change type, old value → new value
- I can mark alerts as read individually; unread count updates immediately
- Alerts are created automatically on the next scheduled refresh after a change is detected

**PRD:** PRD-INTAKE-019D | **Feature:** F69 | **Priority:** P0 | **Persona:** Jordan Kim

---

#### US-P8.4: View Full External Opportunity Details and Version History
**As** Jordan Kim (Proposal Manager),  
**I want** to see the complete normalized details of a Grants.gov opportunity and its change history,  
**so that** I understand exactly what has changed since it was first imported.

**Acceptance Criteria:**
- Detail page shows: title, agency, FON, assistance listing, status, due date, award ceiling/floor, eligibility summary, package URL, source URL
- Source attribution footer shows: "Source: Grants.gov API · Imported {date} · Reference: {FON}"
- Version history accordion lists all versions with changed fields and fetch date
- "View snapshot" on any version shows the full record state at that point in time
- `import_timestamp` reflects the first time this opportunity was ingested (not the most recent fetch)

**PRD:** PRD-INTAKE-019E | **Feature:** F70 | **Priority:** P0 | **Persona:** Jordan Kim

---

#### US-P8.5: Import an External Opportunity into GrantsIntake
**As** Jordan Kim (Proposal Manager),  
**I want** to import a Grants.gov opportunity into my GrantsIntake workspace,  
**so that** I can start an application with the metadata already filled in.

**Acceptance Criteria:**
- "Import to Workspace" button is available on the external opportunity detail page
- Confirmation modal explains what will happen before I confirm
- On import, an internal opportunity record is created pre-populated with title, agency, FON, award range, eligibility summary, and deadline from the external source
- The imported opportunity shows an "Imported from Grants.gov" badge in the internal UI
- After import I am navigated to the new internal opportunity with a success message

**PRD:** PRD-INTAKE-019C | **Feature:** F68 | **Priority:** P0 | **Persona:** Jordan Kim

---

### Phase 8 User Story Summary

| Story ID | Title | Priority | Feature Ref | Persona |
|---|---|---|---|---|
| US-P8.1 | Browse Opportunities from Grants.gov | P0 | F66, F67 | Jordan Kim |
| US-P8.2 | Save and Track an External Opportunity | P0 | F68 | Jordan Kim |
| US-P8.3 | Receive Alerts When a Tracked Opportunity Changes | P0 | F69 | Jordan Kim |
| US-P8.4 | View Full Details and Version History | P0 | F70 | Jordan Kim |
| US-P8.5 | Import an External Opportunity into GrantsIntake | P0 | F68 | Jordan Kim |

---

## Deferred Stories (Phase 2 — Out of MVP Scope)

| Feature Ref | Feature Name | Reason Deferred |
|---|---|---|
| F3 (PRD-INTAKE-004) | Opportunity Type Configuration | Phase 2 |
| F15 (PRD-INTAKE-016) | Saved Opportunities, Notifications, and Comparison | Phase 2 |
| F27 (PRD-INTAKE-028) | Ineligible Applicant Exception Submission | Phase 2 |
| F33 (PRD-INTAKE-034) | Applicant-Side Internal Review and Approval | Phase 2 |
| F45 (PRD-INTAKE-046) | Private Applicant-Specific Clarification | Phase 2 |
| F64 (PRD-INTAKE-065) | Validation Failure Analytics | Phase 2 |
| F65 (PRD-INTAKE-066) | Portfolio-Level Intake Analytics | Phase 2 |

---

*Document generated: July 24, 2026 | Source: PRD-GrantsIntake.md, FRD-GrantsIntake.md, PERSONAS-GrantsIntake.md*
