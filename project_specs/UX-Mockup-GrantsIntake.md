# UX Mockup: GrantsIntake

**Project:** GrantsIntake — Dual-Sided Grants Lifecycle Management Platform
**Module:** Grants Intake
**Generated:** July 24, 2026
**Design Standard:** USWDS (U.S. Web Design System) — https://designsystem.digital.gov/
**Accessibility:** Section 508 / WCAG 2.1 AA
**Based on:** UserStories-GrantsIntake.md, PRD-GrantsIntake.md, FRD-GrantsIntake.md, JOURNEYS-GrantsIntake.md

---

## Overview

GrantsIntake is a dual-sided platform connecting grantors and applicants across the complete grants intake lifecycle. The UX is designed around two distinct portals sharing a common USWDS design language, strict data visibility boundaries, and a workflow-driven information architecture that surfaces the right action at the right moment.

### Design Principles

1. **Structured over document-only** — Forms, fields, and tables capture data instead of uploaded PDFs wherever possible. USWDS form components enforce this.
2. **Early validation, not last-minute surprises** — Blocking errors appear as the applicant drafts, not at the submit button. The Readiness Dashboard is the persistent north star.
3. **Plain language throughout** — Every label, error, and guidance prompt follows USWDS plain-language standards. Grade-level indicators support grantors writing opportunity descriptions.
4. **Private work stays private** — A clear visual vocabulary distinguishes Grantee-private content (blue/gray badge), Shared transaction content (no special badge), and Grantor-private content (purple badge). No cross-zone leakage.
5. **Audit trail as primary user value** — Timestamps, version labels, confirmation numbers, and immutable receipts are prominently surfaced — not buried in settings. These are trust-building features, not compliance checkboxes.
6. **Progressive disclosure** — Complex configuration (eligibility rules, conditional logic, budget justification) is reached through a clear information hierarchy: essential fields first, advanced options behind collapsible panels or secondary steps.
7. **Role clarity at every gate** — Role-based UI locks (e.g., Submit button only active for Authorized Representative) are communicated proactively, not as failure states.

### Design System Components in Use

| Component | Use |
|-----------|-----|
| `usa-button` (primary, secondary, outline) | Primary CTAs, secondary actions, destructive actions |
| `usa-alert` (success, warning, error, info) | Eligibility results, validation messages, addendum notices |
| `usa-form`, `usa-form-group`, `usa-input` | All form fields, metadata capture, budget entry |
| `usa-table` | Intake queue, budget line items, version history, role management |
| `usa-card` | Opportunity discovery results, application workspace section cards |
| `usa-step-indicator` | Multi-step flows (eligibility pre-screen, submission certification) |
| `usa-breadcrumb` | All interior pages |
| `usa-accordion` | Guidance prompts, eligibility rule groups, FAQ/Q&A |
| `usa-sidenav` | Opportunity Builder left rail, Application Workspace section navigator |
| `usa-banner` | US government header banner (required on all pages) |
| `usa-tag` | Status badges (Open, Closing Soon, Draft, Submitted, etc.) |
| `usa-progress` | Section completion indicators, overall readiness percentage |
| `usa-modal` | Confirmation dialogs (Publish, Submit, Delete) |
| `usa-process-list` | Publication readiness checklist |
| `usa-file-input` | Attachment uploads |
| `usa-pagination` | Intake queue, search results |

### Portal Architecture

```
GrantsIntake Platform
│
├── Grantor Portal (authenticated)
│   ├── Grantor Dashboard (F61)
│   ├── Opportunity Builder (F0–F12)
│   │   ├── Metadata Editor
│   │   ├── Eligibility Rule Builder
│   │   ├── Pre-Screening Questionnaire Builder
│   │   ├── Timeline & Deadlines
│   │   ├── Attachment Requirements
│   │   ├── Admin Screening Criteria
│   │   └── Publication Readiness Checklist
│   ├── Q&A Manager (F43–F46)
│   └── Intake Queue / Screening Panel (F55–F60)
│
├── Applicant Portal (public + authenticated)
│   ├── Opportunity Discovery (F13–F14) — PUBLIC
│   ├── Published Opportunity Page (F16–F17) — PUBLIC + AUTHENTICATED
│   ├── Applicant Dashboard (F62) — AUTHENTICATED
│   ├── Organization Profile Manager (F18–F23) — AUTHENTICATED
│   ├── Eligibility Pre-Screen (F24–F28) — AUTHENTICATED
│   ├── Application Workspace (F29–F42) — AUTHENTICATED / GRANTEE-PRIVATE
│   │   ├── Section Navigator
│   │   ├── Form Section Editor
│   │   ├── Budget Builder
│   │   ├── Attachments Manager
│   │   ├── Readiness Dashboard (F34)
│   │   └── Submission Preview (F42)
│   └── Submission Certification & Receipt (F51–F52) — AUTHENTICATED
│
└── Shared / Public
    ├── Published Opportunity Page
    ├── Q&A View (F44, F46)
    └── Application Status Tracker (F62)
```

---

## Navigation Map

| Screen | Route | Reached from | Nav element |
|--------|-------|--------------|-------------|
| Grantor Dashboard | `/grantor/dashboard` | App shell (post-login) | Top nav: "Dashboard" |
| Opportunity Builder — New | `/grantor/opportunities/new` | Grantor Dashboard | Button: "Create New Opportunity" |
| Opportunity Builder — Edit | `/grantor/opportunities/{id}/edit` | Grantor Dashboard opportunity list | Table row: opportunity title link |
| Opportunity Builder — Metadata | `/grantor/opportunities/{id}/edit/metadata` | Opportunity Builder | Left sidenav: "Opportunity Details" |
| Opportunity Builder — Eligibility | `/grantor/opportunities/{id}/edit/eligibility` | Opportunity Builder | Left sidenav: "Eligibility Rules" |
| Eligibility Rule Builder | `/grantor/opportunities/{id}/edit/eligibility/rules` | Eligibility section | Button: "Add Rule" |
| Pre-Screening Questionnaire Builder | `/grantor/opportunities/{id}/edit/eligibility/questionnaire` | Eligibility section | Tab: "Pre-Screening Questionnaire" |
| Opportunity Builder — Deadlines | `/grantor/opportunities/{id}/edit/deadlines` | Opportunity Builder | Left sidenav: "Timeline & Deadlines" |
| Opportunity Builder — Attachments | `/grantor/opportunities/{id}/edit/attachments` | Opportunity Builder | Left sidenav: "Required Attachments" |
| Opportunity Builder — Admin Screening | `/grantor/opportunities/{id}/edit/screening` | Opportunity Builder | Left sidenav: "Screening Criteria" |
| Publication Readiness Check | `/grantor/opportunities/{id}/readiness` | Opportunity Builder | Sidebar checklist CTA / Button: "Check Readiness" |
| Opportunity Version History | `/grantor/opportunities/{id}/versions` | Opportunity Builder | Link: "Version History" |
| Q&A Manager | `/grantor/opportunities/{id}/qa` | Grantor Dashboard / Opportunity Builder | Left sidenav: "Q&A" / Dashboard link |
| Intake Queue Dashboard | `/grantor/intake` | Grantor Dashboard | Top nav: "Intake Queue" |
| Administrative Screening Panel | `/grantor/intake/{submission_id}` | Intake Queue Dashboard | Table row: applicant name link |
| Opportunity Discovery | `/opportunities` | Public nav / App shell | Top nav: "Find Opportunities" |
| Published Opportunity Page | `/opportunities/{slug}` | Opportunity Discovery results | Card: opportunity title link |
| Applicant Dashboard | `/applicant/dashboard` | App shell (post-login) | Top nav: "My Applications" |
| Organization Profile Manager | `/applicant/organization/profile` | Applicant Dashboard | Top nav: "Organization" → "Profile" |
| Document Library | `/applicant/organization/documents` | Organization Profile Manager | Sidenav: "Document Library" |
| Team & Roles Manager | `/applicant/organization/team` | Organization Profile Manager | Sidenav: "Team & Roles" |
| Eligibility Pre-Screen | `/applicant/opportunities/{id}/pre-screen` | Published Opportunity Page | Button: "Check My Eligibility" / "Start Application" |
| Eligibility Result Page | `/applicant/opportunities/{id}/pre-screen/result` | Eligibility Pre-Screen | Automatic on questionnaire completion |
| Application Workspace | `/applicant/applications/{workspace_id}` | Applicant Dashboard / Opportunity Page | Card: "Continue Application" / Button: "Start Application" |
| Workspace Section Editor | `/applicant/applications/{workspace_id}/sections/{section_id}` | Application Workspace | Section navigator: section name link |
| Budget Builder | `/applicant/applications/{workspace_id}/budget` | Application Workspace | Section navigator: "Budget" |
| Readiness Dashboard | `/applicant/applications/{workspace_id}/readiness` | Application Workspace | Persistent sidebar / Button: "Check Readiness" |
| Submission Preview | `/applicant/applications/{workspace_id}/preview` | Application Workspace / Readiness Dashboard | Button: "Preview Submission Package" |
| Submission Certification | `/applicant/applications/{workspace_id}/certify` | Readiness Dashboard | Button: "Certify & Submit" (AR only) |
| Submission Receipt | `/applicant/applications/{workspace_id}/receipt` | Submission Certification | Automatic on successful submission |
| Application Status Tracker | `/applicant/applications/{workspace_id}/status` | Applicant Dashboard | Card: "View Status" |

**Invariant — no orphan screens:** Every screen listed above is reachable from either the authenticated app shell (top nav / sidenav) or a clearly identified parent screen. All public screens are reachable from the public navigation.

---
# Flow-00: Grantor — Opportunity Setup and Publication

**Personas:** Marcus Webb (Program Officer)
**User Stories:** US-1.1, US-1.2, US-1.3, US-1.4, US-1.5, US-1.6, US-2.1, US-2.2, US-2.3, US-2.5, US-2.6
**Features:** F0–F12
**Journey:** JRN-01.1

---

## Flow Diagram

```
[Grantor Dashboard]
        │
        ▼ Click "Create New Opportunity"
[Template Library Modal]
        │
        ├── No template selected ──▶ Error: "Please select a template to continue"
        │
        ▼ Select template → Confirm
[Opportunity Builder — Draft Created]
        │
        ▼ (Left sidenav navigation — complete each section)
        │
        ├──▶ [Metadata Editor] ──── save ──── auto-save + audit event
        │         │
        │         └── Field errors → inline validation messages (real-time)
        │
        ├──▶ [Plain-Language Guidance Panel] (collapsible, adjacent to narrative fields)
        │
        ├──▶ [Timeline & Deadlines]
        │         │
        │         └── Date sequence errors → inline blocking message
        │
        ├──▶ [Eligibility Rule Builder]
        │         │
        │         ├── Add Rule → [Rule Configuration Form]
        │         │         ├── Set severity: Hard Blocker | Advisory
        │         │         ├── Set enforcement point (if Hard Blocker)
        │         │         └── Save rule → rule appears in rule list
        │         │
        │         └── [Pre-Screening Questionnaire Builder]
        │
        ├──▶ [Required Attachments Config]
        │
        └──▶ [Admin Screening Criteria Config]
                 │
                 ▼
        [Publication Readiness Checklist] (sidebar — live updating)
                 │
                 ├── Blockers exist ──▶ "Check Readiness" shows all blockers with links
                 │
                 └── All clear
                          │
                          ▼ Click "Publish"
                 [Publish Confirmation Modal]
                          │
                          ▼ Confirm
                 [Opportunity Published]
                          │
                          ├── Status badge: "Published"
                          ├── Audit event: OPPORTUNITY_PUBLISHED
                          └── Opportunity visible on Applicant Portal
```

---

## Steps

### Step 1: Select Template
- Grantor clicks "Create New Opportunity" on the Grantor Dashboard
- System presents the Template Library modal with program-type categories
- Grantor selects a template (e.g., "Federal NOFO")
- System creates a new Draft opportunity with template defaults applied
- System assigns a UUID and logs `OPPORTUNITY_CREATED` audit event
- Grantor is taken to the Opportunity Builder with the draft pre-populated

### Step 2: Complete Metadata
- Grantor fills in all required fields (title, FON, funding range, contacts, program area, etc.)
- For federal opportunities: Assistance Listing Number field appears and is required
- Real-time inline validation shows errors on blur/change
- Plain-language guidance panel is visible adjacent to narrative text fields
- Readability grade-level indicator appears below executive summary and eligibility summary
- Auto-save triggers on field changes; manual Save button also available

### Step 3: Configure Timeline
- Grantor navigates to "Timeline & Deadlines" in the left sidenav
- Sets open date, close date (required), pre-application deadline (optional), LOI deadline (optional)
- System validates date sequence in real time; error appears if close < open
- Rolling review toggle enables the review cadence field

### Step 4: Configure Eligibility Rules
- Grantor navigates to "Eligibility Rules"
- Clicks "Add Rule" → opens the Rule Configuration form
- For each rule: selects type, criterion, operator, value, severity (Hard Blocker / Advisory), plain-language explanation
- Rules appear in a list with severity badges; groups can be set with AND/OR logic
- Grantor previews the questionnaire by clicking "Preview as Applicant"

### Step 5: Configure Pre-Screening Questionnaire
- Grantor navigates to the "Pre-Screening Questionnaire" tab
- Adds questions mapped to configured eligibility rules
- Sets questionnaire placement: pre-workspace or pre-submission
- Sets conditional display logic for questions
- Previews the questionnaire as applicants will see it

### Step 6: Configure Required Attachments
- Grantor navigates to "Required Attachments"
- For each attachment type: sets required vs. recommended, scopes by applicant type and stage
- System will enforce these at submission

### Step 7: Configure Admin Screening Criteria
- Grantor navigates to "Screening Criteria"
- Standard auto-criteria (deadline check, completeness, eligibility) are pre-loaded and locked
- Grantor adds custom criteria with disposition guidance
- Warning shown if fewer than 3 criteria are configured

### Step 8: Publication Readiness Check
- The sidebar readiness checklist updates in real time as sections are completed
- Grantor can click "Check Readiness" at any time for a dry-run validation
- Blockers appear with section name and direct link to the incomplete field
- "Publish" button is disabled until all blockers are resolved

### Step 9: Publish
- Grantor clicks "Publish" → confirmation modal
- System runs final validation; if clear, opportunity transitions to Published
- System logs `OPPORTUNITY_PUBLISHED` audit event with UTC timestamp
- Opportunity immediately appears on the Applicant Portal

### Post-Publication: Modifications
- Grantor edits a published opportunity → must provide modification reason
- System creates a new version record (sequential version number)
- Date changes automatically generate an Addendum and trigger applicant notifications
- Prior versions are immutable and accessible in Version History

---

## Entry Points

- Grantor Dashboard → "Create New Opportunity" button
- Grantor Dashboard → existing opportunity row (to edit a draft)

## Exit Points

- Successful publication → Opportunity is live on Applicant Portal
- Save as draft → Returns to Grantor Dashboard with draft status
- Discard → Confirmation modal; returns to Grantor Dashboard

---
# Flow-01: Grantor — Q&A Management and Addenda

**Personas:** Marcus Webb (Program Officer), Diana Reyes (Intake Administrator)
**User Stories:** US-8.1, US-8.2, US-8.3, US-8.4
**Features:** F43, F44, F46, F47
**Journey:** JRN-01.2

---

## Flow Diagram

```
[Q&A Manager — Grantor View]
        │
        ├── Q&A enabled? No ──▶ Show "Q&A is disabled for this opportunity"
        │
        ▼ Q&A enabled; question window open
[Q&A Inbox — Pending Questions]
        │
        ▼ Select question
[Question Detail View]
        │
        ▼ Click "Draft Response"
[Response Draft Editor]
        │
        ├── Save Draft → response status: Draft
        │
        └── Click "Publish Response"
                 │
                 ▼
        [Publish Confirmation Modal]
                 │
                 ├── Confirm Publish
                 │         ▼
                 │   Response published to opportunity page (all applicants)
                 │   In-app + email notification sent to applicants (within 15 min)
                 │   Q&A becomes Addendum record
                 │   Q&A history updated
                 │
                 └── Cancel → returns to Draft editor

        --- PARALLEL FLOW: Deadline Extension Addendum ---

[Opportunity Builder — Timeline & Deadlines]
        │
        ▼ Edit a published date
[Modification Reason Modal]
        │
        └── Reason required (blank blocked)
                 │
                 ▼ Save modification
        [Addendum Record Created]
                 │
                 ├── Old and new dates stored in addendum
                 ├── Applicant notifications triggered
                 └── Addendum visible on opportunity page
```

---

## Steps

### Q&A Response Flow

1. **Receive Question:** Marcus opens Q&A Manager; sees new question in inbox with applicant question (anonymized for fairness), submission timestamp, opportunity context
2. **Review Question:** Opens question detail; sees full question text and any related eligibility section
3. **Draft Response:** Clicks "Draft Response"; plain text editor opens with USWDS formatting; response is saved as Draft
4. **Preview Response:** Clicks "Preview" to see how the response will look on the opportunity page
5. **Publish Response:** Clicks "Publish Response" → confirmation modal → confirms
   - Response appears on the Opportunity detail page under Q&A / Updates section
   - All applicants with started or saved applications receive in-app + email notification
   - Timestamp and grantor attribution recorded
   - Response creates an Addendum record automatically
6. **Monitor:** Q&A history shows all published questions and responses; Marcus can see notification delivery log

### Addendum / Deadline Change Flow

1. **Initiate Change:** Marcus navigates to Opportunity Builder → Timeline & Deadlines
2. **Edit Date:** Changes application close date; system detects this is a published opportunity
3. **Modification Reason:** Modal prompts for required modification reason text (required, blank rejected)
4. **Confirm:** Marcus saves; system creates Addendum record with before/after date values
5. **Notification:** All applicants with started/saved applications receive in-app + email notification with old and new deadline values; deadline countdown in applicant workspace updates automatically
6. **Audit:** Addendum appears in the opportunity's Updates & Addenda section; immutable once created

### Audit / History View

- Marcus or Diana can view the complete Q&A and Addenda history at any time
- History is sorted chronologically (newest first)
- Each record shows: type (Q&A response / addendum / date change), author, timestamp, content
- History is immutable — no record can be deleted or edited
- History is exportable as part of the intake data export (F63)

---

## Entry Points

- Grantor Dashboard → Q&A notification badge → Q&A Manager
- Opportunity Builder left sidenav → "Q&A"
- Intake Queue → Q&A History link

## Exit Points

- Response published → Q&A Manager inbox (shows as Answered)
- Addendum created → Opportunity Builder (confirms addendum in Updates section)
- History reviewed → back to Q&A Manager or Dashboard

---
# Flow-02: Grantor — Intake Queue and Administrative Screening

**Personas:** Diana Reyes (Grant Intake Administrator)
**User Stories:** US-10.1, US-10.2, US-10.3, US-10.4, US-10.5, US-10.6, US-11.1, US-11.3
**Features:** F55, F56, F57, F58, F59, F60, F61, F63
**Journey:** JRN-02.1

---

## Flow Diagram

```
[Grantor Dashboard]
        │
        ▼ Click "Intake Queue"
[Intake Queue Dashboard]
        │ (all submitted applications — real-time, filterable)
        │
        ├── Filter/Sort: deadline, org name, amount, eligibility result, status
        │
        ▼ Click application row
[Administrative Screening Panel — Application Detail]
        │
        ├── Review screening checklist items
        │         ├── Auto-populated criteria (deadline, completeness, eligibility) pre-filled
        │         └── Manual criteria — Diana checks/marks each
        │
        ├── All required criteria evaluated?
        │         │
        │         ├── No ──▶ Disposition dropdown disabled; message: "Complete all required criteria"
        │         │
        │         └── Yes ──▶ Disposition dropdown enabled
        │
        ▼ Select disposition
        │
        ├── "Accepted for Review" ──▶ Confirmation modal → Confirm
        │         ▼
        │   Auto-route to review workflow
        │   Applicant notification: "Accepted"
        │   Audit event: INTAKE_HANDOFF
        │
        ├── "Returned for Correction" ──▶ [Correction Request Form]
        │         ├── Specify section(s)/attachment(s) needing correction
        │         ├── Set correction window (days)
        │         └── Send → Applicant notified; original snapshot preserved
        │
        ├── "Ineligible" / "Administratively Rejected" / "Duplicate" / "Late"
        │         ▼
        │   Disposition applied; applicant notified; audit trail updated
        │
        └── "Withdrawn" ──▶ confirmation modal → recorded
                 │
                 ▼
        [Back to Intake Queue] (row shows updated disposition badge)

        --- PARALLEL: Export ---
[Intake Queue] → "Export" button
        │
        ▼
[Export Configuration Modal]
        ├── Filter: opportunity, date range, disposition state
        ├── Format: CSV / Excel / JSON
        └── Generate → Download available
```

---

## Steps

### Step 1: Open Intake Queue
- Diana navigates to Intake Queue from top nav
- Queue shows all submitted applications with summary columns (no need to open individual files)
- Queue updates in real time as new submissions arrive
- Default view: pending screening, sorted by submission timestamp

### Step 2: Triage Applications
- Diana filters by eligibility result to identify easy dispositions first
- Sorts by funding amount, date, or applicant type as needed
- Applications flagged with incomplete attachments or eligibility warnings have visual indicators

### Step 3: Open Screening Panel
- Diana clicks an application row → Administrative Screening Panel opens
- Panel shows (without opening any file):
  - Applicant org summary (legal name, entity type, UEI, SAM status)
  - Submission timestamp and confirmation number
  - Eligibility pre-screen result + per-question responses
  - Validation summary (all blockers cleared at submission)
  - Attachment checklist with completeness status per required item
  - Requested funding amount

### Step 4: Work Through Screening Criteria
- Standard auto-criteria are pre-populated from system data
- Manual criteria: Diana checks or marks failed for each required item
- Disposition dropdown is locked until all required criteria are evaluated

### Step 5: Apply Disposition
- Diana selects disposition from dropdown and adds a note (optional, required for some states)
- Confirmation modal for destructive dispositions (Rejected, Ineligible)
- Disposition logged with timestamp and user attribution
- Applicant receives notification immediately

### Step 6: Correction Request (when applicable)
- Diana selects "Returned for Correction"
- Correction Request form: select affected section(s)/attachment(s), enter instructions, set correction window
- System sends applicant notification with targeted instructions and workspace link
- Original submission snapshot is preserved; application status → "Awaiting Correction"
- When applicant resubmits: new versioned snapshot created alongside original

### Step 7: Route Accepted to Review
- "Accepted for Review" disposition triggers automatic routing
- Review workflow access provisioned for assigned reviewers
- Handoff event logged; intake queue shows "Routed to Review" status

### Step 8: Export
- Diana opens export from the intake queue toolbar
- Sets filters and format
- Export includes: submission metadata, eligibility results, disposition history, audit events
- Grantee-private content excluded from export

---

## Entry Points

- Grantor Dashboard → "Intake Queue" top nav item
- Grantor Dashboard → notification: "New submission received"

## Exit Points

- Disposition applied → return to Intake Queue
- Export downloaded → return to Intake Queue
- Dashboard → summary view of all disposition states

---
# Flow-03: Applicant — Opportunity Discovery and Pre-Screen

**Personas:** Jordan Kim (Proposal Lead), Priya Nair (Organization Administrator)
**User Stories:** US-3.1, US-3.2, US-3.3, US-3.4, US-5.1, US-5.2, US-5.3
**Features:** F13, F14, F16, F17, F24, F25, F26
**Journey:** JRN-04.1 (early stages)

---

## Flow Diagram

```
[Public: Opportunity Discovery Page]
        │
        ├── Search (keyword) + Filter (funder, area, geo, amount, deadline)
        │
        ▼ Results: USWDS card grid
[Opportunity Cards] — sorted by deadline (default)
        │
        ▼ Click card
[Published Opportunity Page] — PUBLIC (no login required)
        │
        ├── Unauthenticated visitor
        │         ├── Sees: all metadata, eligibility summary, Q&A, addenda, deadlines
        │         └── CTA: "Sign in to Apply" ──▶ Login → redirect back
        │
        ├── Authenticated, no workspace, window OPEN
        │         └── CTA: "Start Application" or "Check My Eligibility"
        │                   │
        │                   ▼
        │           [Eligibility Pre-Screen]
        │                   │
        │                   ▼ (questionnaire steps with usa-step-indicator)
        │           [Eligibility Result Page]
        │                   │
        │                   ├── Eligible (green) ──▶ "Start Application" → workspace created
        │                   │
        │                   ├── Likely Eligible (light green) ──▶ Advisory notes + "Start Application"
        │                   │
        │                   ├── Needs Attention (yellow) ──▶ Warning details + "Proceed with Awareness"
        │                   │
        │                   └── Ineligible (red) ──▶ Blocker explanation + "You cannot apply"
        │                                             Link to eligibility section of opportunity
        │
        ├── Authenticated, existing workspace
        │         └── CTA: "Continue Application" + section completion % + blocking error count
        │
        └── Authenticated, window CLOSED
                  └── CTA: "Deadline Passed" (disabled button, date shown)
```

---

## Steps

### Step 1: Discover Opportunities
- Jordan arrives at Opportunity Discovery (public, no login required)
- Full-text search bar prominent at top
- Filters panel on left (or collapsible on mobile): funder, program area, geography, eligibility type, funding amount range, due date range, application stage
- Active filters shown as removable chips below the search bar
- Results default to open opportunities sorted by deadline ascending
- Closed opportunities hidden by default; shown when user explicitly filters for them

### Step 2: Browse Results
- Results shown as USWDS card grid
- Each card: opportunity title (link), funder name, program area tag, deadline with countdown, funding range, status badge (Open / Closing Soon / Not Yet Open / Closed)
- "Updated" badge shown on cards with addenda published in last 14 days
- Restricted opportunities visible only to authenticated users

### Step 3: View Opportunity Detail (Public)
- Jordan clicks a card → Published Opportunity Page
- Full metadata displayed: title, funder, FON, funding range, expected awards, program area, geography, key dates, executive summary, eligibility summary, contact info
- Breadcrumb navigation: Home → Find Opportunities → [Opportunity Title]
- "Updates & Addenda" section: reverse-chronological list with timestamps
- Q&A section: all published questions and responses with timestamps
- Print-friendly layout; shareable URL
- WCAG 2.1 AA compliant throughout

### Step 4: Eligibility Pre-Screen (authenticated, before workspace creation)
- Jordan clicks "Check My Eligibility" (or "Start Application" which routes through pre-screen if configured as pre_workspace)
- If not logged in: redirected to login → returns to pre-screen after auth
- Step-indicator shows progress through questionnaire (e.g., Step 1 of 4)
- Each question displayed one at a time or in a scrollable form (configurable)
- Conditional questions appear/hide based on prior answers
- Required questions must be answered to proceed (Next button disabled if unanswered)
- All questions answered → system evaluates rules → shows Eligibility Result

### Step 5: Eligibility Result
- Four states displayed using USWDS alert components:
  - **Eligible** (usa-alert--success): "Your answers indicate you meet the eligibility requirements. You may start your application."
  - **Likely Eligible** (usa-alert--success with caveats): Advisory notes shown; "You can start your application. Review the noted items."
  - **Needs Attention** (usa-alert--warning): Warning text per triggered advisory rule; "You may proceed. Please review the items below before submitting."
  - **Ineligible** (usa-alert--error): "Based on your answers, you do not meet the eligibility requirements." All triggered blockers shown with plain-language explanation. Link to eligibility section.
- Responses stored in intake record; cannot be changed after completion
- If Eligible/Likely Eligible/Needs Attention: "Start Application" button → workspace created
- If Ineligible: no workspace creation button; link to review eligibility requirements

### Opportunity Updates (for applicants with started workspaces)
- Jordan receives in-app notification when addendum is published
- Notification includes: what changed, old and new values (for deadline changes), link to opportunity page
- Workspace shows addendum banner if the addendum requires application changes
- Q&A updates also trigger notifications

---

## Entry Points

- Public navigation: "Find Opportunities"
- Direct URL (shareable opportunity link)
- Notification email linking to opportunity page

## Exit Points

- Start Application → Application Workspace
- Sign in to Apply → Login → returns to Opportunity Page
- Ineligible result → Opportunity Page (no workspace)
- Deadline passed → Opportunity Page (read-only)

---
# Flow-04: Applicant — Organization Profile and Credential Readiness

**Personas:** Priya Nair (Organization Administrator)
**User Stories:** US-4.1, US-4.2, US-4.3, US-4.4, US-4.5, US-4.6
**Features:** F18, F19, F20, F21, F22, F23
**Journey:** JRN-03.1

---

## Flow Diagram

```
[Applicant Dashboard] — new user, first login
        │
        ▼ Prompt: "Set up your organization profile to apply"
[Organization Profile Manager — Setup Wizard]
        │
        ├── Step 1: Legal Identity (name, EIN, entity type, UEI, SAM status, address)
        ├── Step 2: Tax Status and Supplemental Fields
        ├── Step 3: Contacts (primary contact, authorized representatives)
        └── Step 4: Confirm + Profile Completeness Score
                 │
                 ▼
[Organization Profile Manager — Main View]
        │
        ├──▶ [Document Library]
        │         ├── Upload documents (IRS letter, W-9, audit, etc.)
        │         ├── Set expiration dates per document
        │         └── Document version history per type
        │
        ├──▶ [Team & Roles Manager]
        │         ├── Invite team members
        │         ├── Assign roles (Admin, Proposal Lead, Finance, Contributor, AR)
        │         └── Authorized Representative designated → visible to all
        │
        └──▶ [Credential Expiration Dashboard]
                  ├── Expired credentials: usa-alert--error
                  ├── Expiring soon: usa-alert--warning
                  └── All current: usa-alert--success (summary)

--- PROFILE REUSE ---
[Application Workspace — new workspace created]
        │
        ▼ Profile fields pre-populate relevant form fields
[Workspace pre-populated with org data]
        │
        └── Jordan confirms pre-populated data; edits only what differs
```

---

## Steps

### Step 1: Initial Profile Setup (First-Time User)
- Priya is prompted to set up her organization profile on first login
- Setup wizard guides through fields with progress indicator
- Required fields clearly marked with asterisk and usa-required indicator
- Real-time validation on each field:
  - EIN: 9-digit format XX-XXXXXXX
  - UEI: 12 alphanumeric characters
  - SAM status: if registered, expiration date becomes required (future date only)
  - State: 2-letter USPS code
  - Contact email: RFC 5322 validation
- System blocks duplicate profile creation if org already exists
- Profile completeness percentage displayed throughout setup

### Step 2: Document Library
- Priya uploads standard documents to the org-level library
- Each document type:
  - Upload new file → creates version record with timestamp and uploader
  - Expiration date field (prompted with guidance: "Why this matters: expired credentials may block submission")
  - Version history accessible (prior versions preserved, never overwritten)
- Document types supported: IRS determination letter, W-9, audit reports, indirect cost agreement, board roster, insurance certificate, letters of support
- Library shows: document type, current version date, expiration date, expiration status badge

### Step 3: Team and Role Assignment
- Priya invites team members by email address
- Assigns roles from dropdown: Organization Admin, Proposal Lead, Finance Contributor, External Contributor, Authorized Representative
- Authorized Representative role highlights prominently with a "Submit Authority" badge
- Multiple team members can have the same role (except AR, which is tracked explicitly)
- External Contributors get scoped access (section-level only)
- Role assignments visible to all team members in the Team view

### Step 4: Credential Expiration Monitoring
- After setup, the Credential Expiration Dashboard shows:
  - Expired: red usa-alert -- must renew before applying
  - Expiring soon (within configurable window): yellow usa-alert with days remaining
  - All current: brief green confirmation
- Warnings appear in both the Organization Profile view AND in every Application Workspace readiness checklist
- Organization Admin and Proposal Lead both see credential warnings

### Step 5: Profile Reuse Across Applications
- When Jordan creates a new Application Workspace, the system auto-populates:
  - Legal name, EIN, UEI, entity type, address, contact info from the profile
  - ≥ 60% of application fields pre-populated at workspace creation
- Priya can update the profile at any time without affecting previously submitted applications
- At submission, the system captures a snapshot of the profile state — future profile edits do not modify the submitted record

---

## Entry Points

- Applicant Dashboard → "Organization" top nav → "Profile"
- First-login prompt (new organizations)
- Readiness Dashboard warning: "Profile incomplete" link

## Exit Points

- Profile saved → returns to Organization Profile Manager (main view)
- Document uploaded → Document Library view
- Role assigned → Team & Roles view
- "Open Application Workspace" → Applicant Dashboard → select opportunity

---
# Flow-05: Applicant — Application Workspace and Team Coordination

**Personas:** Jordan Kim (Proposal Lead), Priya Nair (Organization Administrator)
**User Stories:** US-6.1–US-6.6, US-7.1–US-7.7, US-9.1, US-9.2
**Features:** F29–F42, F48, F49
**Journey:** JRN-04.1

---

## Flow Diagram

```
[Published Opportunity Page] — "Start Application" clicked
        │
        ├── Workspace already exists ──▶ usa-alert--warning: "Your organization already has
        │                                 an application for this opportunity." → "Continue"
        │
        └── No workspace → workspace created
                 │
                 ▼
[Application Workspace — Main View]
        │
        ├──▶ Left: Section Navigator (sidenav)
        │         ├── Organization Profile ✓ (auto-populated)
        │         ├── Eligibility ○ (incomplete)
        │         ├── Narrative ○ (incomplete)
        │         ├── Budget ○ (incomplete)
        │         ├── Workplan ○ (incomplete)
        │         ├── Performance Measures ○ (incomplete, hidden if not required)
        │         ├── Attachments ⚠ (missing required item)
        │         ├── Certifications ○
        │         └── Review/Submit
        │
        ├──▶ Right: Content Area
        │         ├── [Section Editor] — form fields per section
        │         ├── [Budget Builder] — structured line-item entry
        │         └── [Attachments Manager] — upload or select from doc library
        │
        └──▶ Persistent Readiness Dashboard (collapsible sidebar / dedicated view)
                  ├── Overall: 47% complete
                  ├── Blocking errors: 3 (with links)
                  ├── Warnings: 2
                  └── Authorized Rep: Sandra Okafor — Assigned ✓

--- SECTION ASSIGNMENT FLOW ---
[Section Navigator] → section header → "Assign Owner"
        │
        ├── Select team member from org roster
        ├── Set internal due date
        └── Add task → task appears in section; assignee notified

--- INTERNAL COMMENT FLOW ---
[Section Editor] → "Internal Notes" tab
        │
        └── Comment box with badge: 🔒 PRIVATE — not visible to grantor
                  │
                  └── Comment saved; visible to org team members only
```

---

## Steps

### Step 1: Access / Create Workspace
- Jordan clicks "Start Application" on the opportunity page after completing eligibility pre-screen
- System creates one workspace per org per opportunity (enforced; duplicate attempt shows error)
- Jordan lands on the Application Workspace main view with section navigator on the left

### Step 2: Review and Assign Sections
- Jordan reviews all sections displayed in the left sidenav
- Sections not applicable to this opportunity are hidden (based on grantor configuration and conditional logic)
- For each section, Jordan can:
  - Click the section name to open the editor
  - Click "..." menu to assign an owner, set internal due date, add tasks
- Section ownership is visible in the sidenav (owner initials / name shown next to section)

### Step 3: Fill Out Form Sections
- Jordan (or assigned contributor) opens a section and fills out the form
- Field types supported: text, number, date, currency, picklist, checkbox, file upload, calculated fields, repeating tables
- Character counters appear below text fields (e.g., "487 / 2000 characters")
- Required fields marked with asterisk (*) using USWDS required indicator
- Calculated fields update automatically (e.g., total = sum of line items)
- Conditional fields appear/hide in real time based on prior responses
- Real-time validation: field-level errors appear on blur; section-level summary in sidenav badge

### Step 4: Enter Budget
- Jordan navigates to the Budget section
- Budget Builder opens as a structured table with configurable categories
- For each category: personnel, fringe, travel, equipment, supplies, indirect, other
  - Line items can be added (repeating rows)
  - Cost-share / match fields available per line
  - Indirect cost field applies configured rate
- Subtotals and totals calculated automatically; no manual overrides
- Budget justification narrative field available per category (required if grantor configured it)
- Budget validation errors appear inline: e.g., "Total request ($520,000) exceeds the maximum award of $500,000" as usa-alert--error
- All budget errors appear in the Readiness Dashboard with links to specific lines

### Step 5: Manage Attachments
- Jordan navigates to the Attachments section
- Required attachments displayed, filtered to this applicant's entity type
- For each required attachment:
  - "Upload File" → file picker (USWDS usa-file-input)
  - "Select from Library" → opens org document library (pre-loaded documents available)
- Required attachments missing → shown as blocking errors in Readiness Dashboard
- Recommended attachments missing → shown as warnings only
- Replacing an attachment creates a new version record (prior version preserved)

### Step 6: Internal Tasks and Comments
- Jordan creates an internal task in the Budget section assigned to Maria (Finance Contributor): "Reconcile personnel line items by Thursday"
- Maria sees the task on next login; status: Open → she marks it Done
- Internal comments are typed in the "Internal Notes" tab, clearly labeled "🔒 PRIVATE — not visible to grantor"
- Comments are never included in the submission package
- Comments are stored in the grantee-private zone

### Step 7: Monitor Readiness Dashboard
- Jordan checks the Readiness Dashboard daily
- Dashboard shows:
  - Overall completion percentage (e.g., 73%)
  - By-section breakdown with completion bars
  - Blocking errors list: each with severity badge, description, and direct link to the field
  - Warnings: each with advisory text and link
  - Missing attachments: list with status indicators
  - Authorized Representative status: name and role confirmation
  - Deadline countdown: "12 days remaining"
- Dashboard updates in real time as team members make changes

### Step 8: Respond to Addendum
- Jordan receives in-app notification: "Grantor has published an update to this opportunity"
- Addendum banner appears in the workspace header
- Jordan reviews the change, creates an urgent task assigned to the affected section owner
- Deadline countdown updates if the addendum changed a date

---

## Entry Points

- Opportunity Page → "Start Application" / "Continue Application"
- Applicant Dashboard → active application card

## Exit Points

- All blocking errors resolved → Readiness Dashboard shows "Ready for Submission"
- Hand off to Authorized Representative → Sandra's dashboard shows notification
- Save and exit → workspace preserves all content; grantee-private

---
# Flow-06: Applicant — Submission Preview, Certification, and Receipt

**Personas:** Sandra Okafor (Authorized Representative), Jordan Kim (Proposal Lead)
**User Stories:** US-7.7, US-9.3, US-9.4, US-9.5, US-9.6, US-9.7
**Features:** F42, F50, F51, F52, F53, F54
**Journey:** JRN-05.1

---

## Flow Diagram

```
[Readiness Dashboard] — 0 blocking errors
        │
        ├── "Preview Submission Package" (available to all team members)
        │         │
        │         ▼
        │   [Submission Preview — Read-Only View]
        │         ├── All sections, form data, budget, attachments
        │         ├── Excludes grantee-private internal comments
        │         ├── "Print" button (print-friendly layout)
        │         └── "Back to Readiness Dashboard" (does NOT submit)
        │
        └── "Certify & Submit" button
                  │
                  ├── Role check: Only Authorized Representative can proceed
                  │         ├── If user is NOT AR: button disabled with tooltip
                  │         │   "Only the Authorized Representative can submit"
                  │         └── If user IS AR: button active
                  │
                  ▼ AR clicks "Certify & Submit"
        [Pre-Submission Validation Run]
                  │
                  ├── Blockers found ──▶ usa-alert--error: lists all blockers with remediation links
                  │                      Button remains disabled until resolved
                  │
                  └── All clear
                           │
                           ▼
        [Certification Screen]
                  ├── Certification language (grantor-configured, legally appropriate)
                  ├── "I certify that..." statement displayed prominently
                  ├── Authorized Representative name confirmed
                  └── Checkbox: "I agree to the above certification" (required)
                           │
                           ▼ Checkbox checked → "Submit Application" button enabled
        [Submit Confirmation Modal]
                  ├── "Are you sure? This action cannot be undone."
                  ├── Opportunity name, applicant org, deadline
                  └── Confirm "Submit"
                           │
                           ▼
        [Submission Processing]
                  ├── Immutable snapshot created
                  ├── Unique confirmation number assigned (e.g., CH-2026-0147)
                  ├── UTC timestamp recorded
                  ├── Human-readable package (PDF/HTML) generated
                  ├── Machine-readable package (JSON/XML) generated
                  └── Audit event: SUBMISSION_RECEIVED
                           │
                           ▼
        [Submission Receipt Page]
                  ├── Confirmation number: CH-2026-0147
                  ├── Submission date/time (UTC)
                  ├── "Download Receipt" button (PDF)
                  └── "Return to Dashboard"

        --- POST-SUBMISSION ---
[Application Workspace] — now locked
        ├── Status badge: "Submitted — Awaiting Administrative Screening"
        ├── All edit controls disabled
        ├── Read-only notice: "This application was submitted on [date]. Editing is not permitted."
        └── Receipt accessible from workspace and applicant dashboard
```

---

## Steps

### Step 1: Preview Submission Package
- Jordan (or any team member) clicks "Preview Submission Package" from the Readiness Dashboard
- System generates a read-only, human-readable view of the full application:
  - All sections and their form data
  - Budget with totals and justifications
  - Attachments list with file names and dates
  - Certifications section
  - Excludes: grantee-private internal comments, section assignments, internal tasks
- Preview is rendered in USWDS-styled format
- Print button opens print-friendly layout (suitable for PDF export)
- Preview does NOT initiate submission; no status change occurs
- Jordan shares preview with Sandra for review before certification

### Step 2: Sandra Receives Notification
- Applicant Dashboard shows notification: "Application ready for your certification — Community Health Grant. Deadline: [date/time]. You are designated as the Authorized Representative."
- In-app banner and email notification sent to Sandra (within configured lead time)
- Sandra's dashboard shows the application with "Action Required: Certify & Submit"

### Step 3: Sandra Reviews the Preview
- Sandra opens the submission package preview from her dashboard
- Reviews narrative sections, budget totals, attachment list
- If she notices an issue: she can flag it by creating a private comment in the workspace (she cannot submit without certifying)
- If all looks correct: she proceeds to certification

### Step 4: Pre-Submission Validation
- Sandra clicks "Certify & Submit"
- System runs final validation pass:
  - All required fields completed?
  - All required certifications in place?
  - All required attachments present?
  - Budget validation passes?
  - Eligibility hard blockers resolved?
  - Authorized Representative role confirmed for this session?
- Any new blocking items: usa-alert--error with full list and links; submit blocked
- All clear: Sandra proceeds to the Certification screen

### Step 5: Certification
- Certification screen displays:
  - Header: "Authorized Representative Certification"
  - Certification language (configured by grantor, legally appropriate, plain-language)
  - Sandra's name and role confirmed in the display
  - Checkbox: "I have read and agree to the above certification" — must be checked to enable submit
- Sandra reads the certification language; checks the checkbox
- "Submit Application" button becomes active

### Step 6: Submit
- Sandra clicks "Submit Application"
- Confirmation modal: opportunity name, applicant org, request amount, deadline; "Confirm Submit" button
- On confirm:
  - System creates immutable submission snapshot (all fields, budget, attachments)
  - Profile state snapshot captured at this moment
  - Unique confirmation number assigned (format: program-prefix-year-sequence)
  - UTC timestamp recorded
  - Human-readable package (PDF or USWDS HTML) generated
  - Machine-readable structured data package (JSON or XML) generated
  - Audit event created: SUBMISSION_RECEIVED with timestamp, user, confirmation number
  - Application status → "Submitted — Awaiting Administrative Screening"
  - Applicant team and grantor intake admin receive "Submission received" notifications

### Step 7: Submission Receipt
- Sandra lands on the Submission Receipt page immediately after successful submission
- Receipt shows:
  - Application name and opportunity title
  - Confirmation number (prominent, large text)
  - Submission date and time in UTC (e.g., "July 24, 2026, 16:42:07 UTC")
  - Applicant organization name
  - "Download Receipt (PDF)" button
  - "Return to My Dashboard" link
- Receipt is accessible at any future point from the Applicant Dashboard and the application workspace

### Step 8: Post-Submission Locked State
- Workspace transitions to read-only state
- All form fields, budget lines, and attachment upload controls are disabled
- Clear notice: "This application was submitted on [date/time]. Editing is not permitted."
- Only unlock paths: applicant-initiated withdrawal, grantor-initiated formal reopening, grantor-initiated return-for-correction

---

## Entry Points

- Applicant Dashboard → application card with status "Ready to Submit"
- Readiness Dashboard → "Certify & Submit" button
- Notification email → "Your application is ready for certification"

## Exit Points

- Successful submission → Submission Receipt page → Applicant Dashboard
- Blocking errors found → Readiness Dashboard (to resolve)
- Cancel certification → return to Readiness Dashboard (no status change)

---
# Screen-00: Grantor Dashboard

**Route:** `/grantor/dashboard`
**Purpose:** Central hub for grantors to monitor opportunities, intake queue activity, and navigate to all grantor functions.
**User Stories:** US-11.1
**Features:** F61
**Personas:** Marcus Webb (Program Officer), Diana Reyes (Intake Administrator)

---

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-banner] Official website of the United States government       │
├─────────────────────────────────────────────────────────────────────┤
│ [GrantsIntake Logo]  Dashboard  Opportunities  Intake Queue  ▾User │
├─────────────────────────────────────────────────────────────────────┤
│ [usa-breadcrumb] Home                                               │
│                                                                     │
│  Welcome back, Marcus Webb                                          │
│  Program Officer · Community Resilience Program                     │
│                                                                     │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ FILTERS  [Opportunity ▾] [Program ▾] [Date Range ▾] [Apply] │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────┐  │
│ │  PUBLISHED   │ │    ACTIVE    │ │  SUBMITTED   │ │ PENDING   │  │
│ │ Opportunities│ │ Applications │ │ Applications │ │ SCREENING │  │
│ │      12      │ │     247      │ │     178      │ │    43     │  │
│ └──────────────┘ └──────────────┘ └──────────────┘ └───────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  MY OPPORTUNITIES                              [+ New Opp.]  │  │
│  │──────────────────────────────────────────────────────────────│  │
│  │  Title                  Status    Started  Submitted  Close  │  │
│  │  Community Resilience   OPEN      47       31         Aug 15 │  │
│  │  Rural Health Equity    OPEN      28       14         Sep 1  │  │
│  │  Digital Access 2027    DRAFT     —        —          —      │  │
│  │  [usa-tag: DRAFT]                                            │  │
│  │  [usa-pagination]                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  INTAKE QUEUE SUMMARY                   [Go to Intake Queue]  │  │
│  │──────────────────────────────────────────────────────────────│  │
│  │  Accepted for Review    ████████████  112  (63%)             │  │
│  │  Returned for Correction ███           22   (12%)            │  │
│  │  Pending Screening       ████          43   (24%)            │  │
│  │  Other                   █              1    (1%)            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  RECENT ACTIVITY                                              │  │
│  │  · Community Resilience: 3 new submissions (2 hours ago)     │  │
│  │  · Rural Health Equity: Addendum published (yesterday)       │  │
│  │  · Digital Access 2027: Draft updated (today 10:22 AM)       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Summary KPI tiles (published, active, submitted, pending) | Top of main content, full width |
| Primary | My Opportunities table with status, counts, deadlines | Main content area |
| Secondary | Intake Queue summary by disposition | Below opportunities table |
| Tertiary | Recent activity feed | Bottom of main content |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Full dashboard with real-time data | All KPI tiles populated |
| No opportunities | Empty state below KPI tiles | "You haven't created any opportunities yet. [Create New Opportunity]" |
| Filters applied | Filter chips shown below filter bar; tables update | Results filtered |
| Loading | Skeleton loaders in KPI tiles and table rows | USWDS loading indicator |
| New submissions (unread) | Badge count on "Intake Queue" nav item | Numeric count badge (e.g., "3") |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| "Create New Opportunity" | usa-button (primary) | Opens Template Library Modal |
| Opportunity row | Clickable table row | Navigates to Opportunity Builder for that opportunity |
| "Go to Intake Queue" | usa-button (outline) | Navigates to Intake Queue Dashboard |
| Filter dropdowns | usa-select | Updates table data in real time |
| KPI tiles | Informational cards | Clicking "Pending Screening" navigates to Intake Queue filtered |
| Top nav: Opportunities | Link | Dropdown: My Opportunities / All Opportunities / Templates |
| Top nav: Intake Queue | Link | Navigates to Intake Queue Dashboard |

---
# Screen-01: Opportunity Builder

**Route:** `/grantor/opportunities/{id}/edit`
**Purpose:** Complete setup environment for grantors to configure all aspects of a funding opportunity before publication.
**User Stories:** US-1.1, US-1.2, US-1.3, US-1.4, US-1.5, US-1.6
**Features:** F0, F1, F2, F4, F5, F6
**Personas:** Marcus Webb (Program Officer)

---

## Layout — Opportunity Builder Main (Metadata Section Shown)

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-banner] Official website of the United States government       │
├─────────────────────────────────────────────────────────────────────┤
│ [Logo] Dashboard  Opportunities  Intake Queue  ▾Marcus Webb         │
├─────────────────────────────────────────────────────────────────────┤
│ [usa-breadcrumb] Home > Opportunities > Community Resilience Grant  │
│                                                                     │
│ Community Resilience Grant                [usa-tag: DRAFT]          │
│ FON: CRG-2027-001 · Federal NOFO template                           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────┐  ┌─────────────────────────────────────────────┐│
│  │ SETUP SECTIONS │  │ OPPORTUNITY DETAILS                      ⤢  ││
│  │                │  │                                             ││
│  │ ✓ Opp. Details │  │ Title *                                     ││
│  │ ✓ Deadlines    │  │ [Community Resilience Grant_____________]   ││
│  │ ○ Eligibility  │  │                                             ││
│  │ ○ Questionnaire│  │ Funding Source *   Announcement Type *      ││
│  │ ○ Attachments  │  │ [HHS___________]   [Initial___________]     ││
│  │ ○ Admin Screen │  │                                             ││
│  │ ○ Q&A Settings │  │ Opportunity Number *                        ││
│  │                │  │ [CRG-2027-001____________________]          ││
│  │─────────────── │  │ Must be unique within this program          ││
│  │ PUBLICATION    │  │                                             ││
│  │ READINESS      │  │ Assistance Listing Number *                 ││
│  │                │  │ [93.___]  Format: XX.XXX (e.g., 93.778)    ││
│  │ ✓ Title        │  │ Required for federal opportunities          ││
│  │ ✓ FON          │  │                                             ││
│  │ ✓ Dates set    │  │ Funding Amount Max *                        ││
│  │ ⚠ Eligibility  │  │ [$________500,000]                          ││
│  │   (0 rules)    │  │                                             ││
│  │ ○ Form section │  │ Funding Amount Min                          ││
│  │ ○ ALN          │  │ [$________250,000]                          ││
│  │                │  │                                             ││
│  │ [Check         │  │ Executive Summary *   [?] ◀ Guidance toggle ││
│  │  Readiness]    │  │ ┌─────────────────────────────────────────┐ ││
│  │                │  │ │                                         │ ││
│  │ [Publish       │  │ │ [text area — 5000 char max]             │ ││
│  │  (disabled)]   │  │ │                                         │ ││
│  │                │  │ └─────────────────────────────────────────┘ ││
│  └────────────────┘  │ Readability: Grade 9 ℹ advisory only       ││
│                       │                                             ││
│                       │ [▶ Plain-language guidance for this field]  ││
│                       │   (collapsible usa-accordion)              ││
│                       │                                             ││
│                       │ Contact Name *    Contact Email *           ││
│                       │ [______________]  [__________________]      ││
│                       │                                             ││
│                       │ Program Area *                              ││
│                       │ [Health___________▾]                        ││
│                       │                                             ││
│                       │ [Save Draft]    [Preview as Applicant]      ││
│                       └─────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Eligibility Rule Builder

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Left sidenav unchanged]                                            │
│                                                                     │
│  ELIGIBILITY RULES                      [Preview as Applicant]      │
│                                         [Duplicate from Prior Opp.] │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Rule #1                                    [Edit] [Delete] │     │
│  │ Type: SAM Registration                                     │     │
│  │ Criterion: sam_registered = true                           │     │
│  │ [usa-tag--error] HARD BLOCKER · pre-workspace              │     │
│  │ Explanation: "Your organization must be registered in      │     │
│  │ SAM.gov before you can apply for this opportunity."        │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Rule #2                                    [Edit] [Delete] │     │
│  │ Type: Nonprofit Status                                     │     │
│  │ Criterion: entity_type includes nonprofit_501c3            │     │
│  │ [usa-tag--warning] ADVISORY                                │     │
│  │ Explanation: "Nonprofit organizations with 501(c)(3)       │     │
│  │ status are preferred but not required..."                  │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                     │
│  [+ Add Rule]                                                       │
│                                                                     │
│  --- ADD RULE FORM (inline / modal) ---                             │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Rule Type *          [SAM Registration____________▾]       │     │
│  │ Criterion Field *    [sam_registered______________▾]       │     │
│  │ Operator *           [equals_____________________▾]        │     │
│  │ Value *              [○ True  ● False]                     │     │
│  │                                                            │     │
│  │ Severity *           [● Hard Blocker  ○ Advisory]          │     │
│  │                                                            │     │
│  │ Enforcement Point *  [● Pre-workspace  ○ Pre-submission]   │     │
│  │ (shown only when Hard Blocker selected)                    │     │
│  │                                                            │     │
│  │ Plain-Language Explanation * (500 char max)                │     │
│  │ [________________________________________] 0/500           │     │
│  │                                                            │     │
│  │ [Save Rule]   [Cancel]                                     │     │
│  └────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Publication Readiness Checklist (Dry-Run Result)

```
┌─────────────────────────────────────────────────────────────────────┐
│  PUBLICATION READINESS CHECK                                        │
│  Last checked: 10:47 AM today                      [Re-run Check]   │
│                                                                     │
│  [usa-alert--error]                                                 │
│  2 items require attention before you can publish.                  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ usa-process-list                                            │   │
│  │                                                             │   │
│  │ ✓  Opportunity Details (title, FON, contact, program area)  │   │
│  │ ✓  Funding Amount and Range                                 │   │
│  │ ✓  Application Dates (open and close date set)              │   │
│  │ ✗  Eligibility Rules — At least one rule required           │   │
│  │    [Go to Eligibility Rules →]                              │   │
│  │ ✗  Form Sections — At least one application section required│   │
│  │    [Go to Form Builder →]                                   │   │
│  │ ✓  Assistance Listing Number (for federal opportunities)    │   │
│  │ ⚠  Expected Awards — recommended but not required           │   │
│  │    [Add Expected Awards →]                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [Publish (disabled)]   [Save Draft]   [Preview as Applicant]      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Current section form fields | Main content area (right pane) |
| Primary | Publication Readiness Checklist | Left sidebar, persistent |
| Secondary | Plain-language guidance prompts | Collapsible panel adjacent to narrative fields |
| Secondary | Readability grade-level indicator | Below narrative text area |
| Tertiary | Version history link | Sub-header area |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Draft | usa-tag: "DRAFT" in header | Auto-save indicator: "Saved 2 minutes ago" |
| Saving | Subtle spinner in save indicator | "Saving..." |
| Saved | Checkmark in save indicator | "Saved at 10:42 AM" |
| Field error | Red border on input, usa-form-error-message below | Inline error message |
| Publish blocked | "Publish" button disabled; checklist items marked ✗ | "2 items require attention" |
| Publish ready | "Publish" button enabled (usa-button primary) | All checklist items ✓ |
| Published | Status badge changes to usa-tag: "PUBLISHED" | Confirmation notice |
| Guidance visible | Accordion open adjacent to field | Guidance text and example shown |
| Guidance hidden | Accordion collapsed | "[▶ Plain-language guidance for this field]" |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Left sidenav section items | Links | Navigate between setup sections |
| "Add Rule" | usa-button (outline) | Opens inline rule form |
| Rule severity toggle | Radio group | Toggles enforcement point field visibility |
| "Check Readiness" | usa-button (secondary) | Triggers dry-run validation |
| "Publish" | usa-button (primary) | Triggers final validation + publish modal |
| "Preview as Applicant" | usa-button (outline) | Opens opportunity page in preview mode |
| Guidance toggle [?] | Accordion trigger | Expands/collapses guidance panel |
| "Save Draft" | usa-button (outline) | Explicit save; auto-save also runs |
| "Duplicate from Prior Opp." | usa-button (outline) | Opens opportunity selector for rule duplication |

---
# Screen-02: Intake Queue Dashboard and Administrative Screening Panel

**Routes:**
- Intake Queue: `/grantor/intake`
- Screening Panel: `/grantor/intake/{submission_id}`

**Purpose:** Structured queue for Diana to receive, triage, screen, and disposition all submitted applications.
**User Stories:** US-10.1, US-10.2, US-10.3, US-10.4, US-10.5, US-10.6
**Features:** F55, F56, F57, F58, F59, F60
**Personas:** Diana Reyes (Intake Administrator)

---

## Layout — Intake Queue Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-banner]                                                        │
├─────────────────────────────────────────────────────────────────────┤
│ [Logo] Dashboard  Opportunities  Intake Queue  ▾Diana Reyes         │
├─────────────────────────────────────────────────────────────────────┤
│ [usa-breadcrumb] Home > Intake Queue                                │
│                                                                     │
│  Intake Queue                                         [Export ▾]    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ FILTERS                                                      │  │
│  │ Opportunity [Community Resilience ▾]  Status [All ▾]         │  │
│  │ Eligibility [All ▾]  Date Range [____] to [____] [Apply]     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐  │
│  │ TOTAL    │ │ PENDING  │ │ ACCEPTED │ │ RETURNED │ │REJECTED │  │
│  │    178   │ │   43     │ │   112    │ │    18    │ │    5    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ SUBMITTED APPLICATIONS                [Sort: Submitted ▾]    │  │
│  │──────────────────────────────────────────────────────────────│  │
│  │ Org Name          Submitted     Eligibility  Amount  Status   │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ Sunrise Community  Jul 18 2:14p  ✓ ELIGIBLE   $325K  PENDING │  │
│  │ Foundation                                          [Screen] │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ Urban Health Coll. Jul 18 3:07p  ⚠ NEEDS ATT. $487K  PENDING │  │
│  │                                                     [Screen] │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ Mountain Partners  Jul 17 9:51a  ✗ INELIGIBLE  $200K  PENDING │  │
│  │                                                     [Screen] │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ [usa-pagination]  Showing 1–25 of 43 pending                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Administrative Screening Panel

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-breadcrumb] Home > Intake Queue > Urban Health Collaborative   │
│                                                                     │
│  Urban Health Collaborative                                         │
│  Community Resilience Grant  ·  Submitted Jul 18, 2026, 3:07 PM UTC│
│  Confirmation #: CRG-2026-0042       [usa-tag: PENDING SCREENING]   │
│                                                                     │
├────────────────────────────┬────────────────────────────────────────┤
│ APPLICANT PROFILE          │ SCREENING CHECKLIST                    │
│                            │                                        │
│ Legal Name:                │ AUTO-POPULATED CRITERIA                │
│   Urban Health Collab.     │ ✓ Deadline Check: Submitted before     │
│ Entity Type: Nonprofit 501c│   close date (Jul 20, 2026 5:00 PM)    │
│ EIN: 83-4521766            │                                        │
│ UEI: UJKL8923MN01          │ ✓ System Completeness: All required    │
│ SAM: Registered (exp.      │   fields completed at submission       │
│      Dec 2026)             │                                        │
│ Address: 1200 Oak Ave      │ ⚠ Eligibility Check: Needs Attention   │
│   Chicago, IL 60601        │   (1 advisory warning)                 │
│                            │                                        │
│ REQUESTED AMOUNT           │ MANUAL CRITERIA                        │
│ $487,500                   │                                        │
│                            │ ○ IRS Determination Letter verified    │
│ ELIGIBILITY RESULT         │   [Required — must check before ruling]│
│ [usa-alert--warning]       │                                        │
│ NEEDS ATTENTION            │ ○ Narrative addresses program goals    │
│ Advisory: Nonprofit status │   [Required — must check before ruling]│
│ preferred (not required)   │                                        │
│                            │ ○ Budget categories properly labeled   │
│ ATTACHMENTS                │   [Optional]                           │
│ ✓ IRS Determination Letter │                                        │
│ ✓ W-9                      │ ─────────────────────────────────────  │
│ ✓ Most Recent Audit Report │                                        │
│ ✗ Indirect Cost Agreement  │ DISPOSITION                            │
│   (recommended only)       │                                        │
│                            │ [Required criteria not yet checked.    │
│ [View Full Application]    │  Complete all required criteria above  │
│ [Download Package]         │  to enable disposition.]               │
│                            │                                        │
│ PRE-SCREEN RESPONSES       │ [Select Disposition ▾] (disabled)      │
│ [View responses ▾]         │                                        │
│                            │ [Save Notes]                           │
│                            │                                        │
│ SUBMISSION HISTORY         │                                        │
│ v1 — Submitted Jul 18      │                                        │
│ (Only version)             │                                        │
└────────────────────────────┴────────────────────────────────────────┘
```

---

## Layout — Disposition Applied (Returned for Correction)

```
┌─────────────────────────────────────────────────────────────────────┐
│  CORRECTION REQUEST                                                 │
│                                                                     │
│  Specify what needs to be corrected:                                │
│                                                                     │
│  Section(s) requiring correction: *                                 │
│  ☑ Attachments — Indirect Cost Agreement                            │
│  ☐ Narrative                                                        │
│  ☐ Budget                                                           │
│  ☐ Other: [______________]                                          │
│                                                                     │
│  Instructions for applicant: *                                      │
│  [________________________________________]                         │
│  [________________________________________]                         │
│                                                                     │
│  Correction window: * [14] days from today                          │
│                                                                     │
│  [Send Correction Request]   [Cancel]                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Application identity (org name, submission timestamp, confirmation number) | Top header |
| Primary | Eligibility result and attachment completeness | Left panel |
| Primary | Screening checklist (required criteria must be completed first) | Right panel |
| Secondary | Requested amount, SAM status, entity type | Left panel |
| Secondary | Disposition selector (enabled only after required criteria evaluated) | Right panel bottom |
| Tertiary | Full application view / download | Left panel action links |
| Tertiary | Submission version history | Left panel bottom |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default (pending) | usa-tag: "PENDING SCREENING" | Required criteria unchecked, disposition disabled |
| Required criteria complete | Disposition dropdown enabled | "Select a disposition to proceed" |
| Disposition selected (Accepted) | Modal confirmation | "Accepted for Review. Applicant will be notified." |
| Disposition selected (Returned) | Correction Request form appears | Specify sections, instructions, window |
| Returned for Correction (sent) | usa-tag: "RETURNED FOR CORRECTION" | Correction request sent notification |
| Accepted (routed) | usa-tag: "ACCEPTED FOR REVIEW" | "Routed to review workflow" |
| Version history (after correction) | v1 and v2 entries in submission history | "Original" and "Corrected Resubmission" clearly labeled |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Queue row | Clickable row | Opens Screening Panel for that application |
| Filter dropdowns | usa-select | Filters queue table |
| "Export" | usa-button (outline) + dropdown | Opens export configuration modal |
| Screening criteria checkboxes | Checkboxes | Enable disposition when all required criteria evaluated |
| "View Full Application" | usa-button (outline) | Opens human-readable submission package |
| Disposition dropdown | usa-select | Enabled after required criteria; triggers action flow |
| "Send Correction Request" | usa-button (primary) | Sends request; triggers notification |
| "View responses" | usa-accordion | Expands pre-screen question/answer details |
| Pagination | usa-pagination | Navigates through queue pages |

---
# Screen-03: Opportunity Discovery and Published Opportunity Page

**Routes:**
- Discovery: `/opportunities`
- Opportunity Detail: `/opportunities/{slug}`

**Purpose:** Applicants find, evaluate, and access funding opportunities. Public-facing; no login required for public opportunities.
**User Stories:** US-3.1, US-3.2, US-3.3, US-3.4
**Features:** F13, F14, F16, F17
**Personas:** Jordan Kim (Proposal Lead) — public and authenticated states

---

## Layout — Opportunity Discovery Page

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-banner] Official website of the United States government       │
├─────────────────────────────────────────────────────────────────────┤
│ [GrantsIntake Logo]  Find Opportunities  My Applications  [Sign In] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Find Funding Opportunities                                         │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 🔍 [Search by keyword, funder, or program area...________]   │  │
│  │                                         [Search]             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Active filters: [Health ×] [Midwest ×] [Clear all]               │
│                                                                     │
├────────────────────────┬────────────────────────────────────────────┤
│ FILTER BY              │ 47 opportunities  Sort: [Deadline ▾]       │
│                        │                                            │
│ Funder                 │ ┌──────────────────────────────────────┐   │
│ ☑ HHS (12)             │ │ Community Resilience Grant           │   │
│ ☐ EPA (8)              │ │ Dept. of Health and Human Services   │   │
│ ☐ USDA (6)             │ │ Health · Midwest · Federal           │   │
│ ☐ NEA (3)              │ │ Deadline: Aug 15, 2026               │   │
│ [Show more...]         │ │ Award: $250K–$500K                   │   │
│                        │ │ [usa-tag--green] OPEN                │   │
│ Program Area           │ │ [usa-tag--info] UPDATED Jul 18       │   │
│ ☑ Health (19)          │ └──────────────────────────────────────┘   │
│ ☐ Education (14)       │                                            │
│ ☐ Environment (8)      │ ┌──────────────────────────────────────┐   │
│ ☐ Housing (6)          │ │ Rural Health Equity Initiative       │   │
│                        │ │ Dept. of Agriculture                 │   │
│ Geography              │ │ Health · Rural · Federal             │   │
│ ☑ Midwest              │ │ Deadline: Sep 1, 2026                │   │
│ ☐ Southeast            │ │ Award: $100K–$300K                   │   │
│ ☐ National             │ │ [usa-tag--green] OPEN                │   │
│                        │ └──────────────────────────────────────┘   │
│ Eligibility Type       │                                            │
│ ☐ Nonprofit only       │ ┌──────────────────────────────────────┐   │
│ ☐ Govt. entities       │ │ Digital Access 2027                  │   │
│ ☐ All org types        │ │ National Telecommunications Admin.   │   │
│                        │ │ Technology · National · Federal      │   │
│ Funding Range          │ │ Opens: Sep 15, 2026                  │   │
│ Min [$_____] Max [$___]│ │ Award: $500K–$2M                     │   │
│                        │ │ [usa-tag--info] NOT YET OPEN         │   │
│ Due Date Range         │ └──────────────────────────────────────┘   │
│ From [____] To [____]  │                                            │
│                        │ [usa-pagination]  1 2 3 ... 5             │
│ [Apply Filters]        │                                            │
└────────────────────────┴────────────────────────────────────────────┘
```

---

## Layout — Published Opportunity Page (Unauthenticated)

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-banner]                                                        │
├─────────────────────────────────────────────────────────────────────┤
│ [Logo]  Find Opportunities                              [Sign In]   │
├─────────────────────────────────────────────────────────────────────┤
│ [usa-breadcrumb] Home > Find Opportunities > Community Resilience.. │
│                                                                     │
│  Community Resilience Grant                                         │
│  [usa-tag--green] OPEN  ·  Closes August 15, 2026 at 5:00 PM ET   │
│                                                                     │
│  Department of Health and Human Services                            │
│  FON: CRG-2027-001  ·  Assistance Listing: 93.778                  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ [usa-alert--info]                                           │   │
│  │ Sign in to apply for this opportunity.                      │   │
│  │ [Sign In to Apply]  [Create Account]                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────┬────────────────────────┐   │
│  │ OVERVIEW                           │ KEY INFORMATION        │   │
│  │                                    │                        │   │
│  │ Executive Summary                  │ Award Amount           │   │
│  │ [full executive summary text]      │ $250,000–$500,000      │   │
│  │                                    │                        │   │
│  │ Eligibility Summary                │ Expected Awards        │   │
│  │ [eligibility summary text]         │ Up to 15              │   │
│  │                                    │                        │   │
│  │ Program Area: Health               │ Key Dates              │   │
│  │ Geography: Midwest Region          │ App. Opens: Jul 1      │   │
│  │                                    │ App. Closes: Aug 15    │   │
│  │ Contact Information                │ LOI Due: Jul 20        │   │
│  │ Marcus Webb, Program Officer       │                        │   │
│  │ marcus.webb@hhs.gov                │ Contact                │   │
│  │                                    │ marcus.webb@hhs.gov    │   │
│  └────────────────────────────────────┴────────────────────────┘   │
│                                                                     │
│  UPDATES & ADDENDA                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Jul 18, 2026 — Q&A Response                                 │   │
│  │ Q: Do community land trusts with 501(c)(3) status qualify?  │   │
│  │ A: Yes. Community land trusts with 501(c)(3) status meet    │   │
│  │ the nonprofit eligibility requirement for this opportunity.  │   │
│  │ Published by: HHS Program Office · 10:15 AM UTC             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Q&A                                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Q&A window: Open through Aug 1, 2026                        │   │
│  │ [Sign in to submit a question]                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [Print this page]  [Copy link]                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Published Opportunity Page (Authenticated, Workspace Exists)

```
│  [usa-alert--success]                                               │
│  You have an application in progress for this opportunity.          │
│  63% complete · 2 blocking errors                                   │
│  [Continue Application]  [View Readiness Dashboard]                 │
```

---

## Layout — Opportunity Page (Authenticated, Window Closed)

```
│  [usa-alert--base]                                                  │
│  The application window for this opportunity has closed.            │
│  Closed: August 15, 2026 at 5:00 PM ET                             │
│  [Button: Deadline Passed (disabled)]                               │
```

---

## Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Status badge, close date, sign in / start application CTA | Top of page, immediately visible |
| Primary | Executive summary, eligibility summary | Main content, above fold |
| Secondary | Key information panel (award amount, dates, contact) | Right column |
| Secondary | Updates & Addenda | Below overview |
| Tertiary | Q&A section | Below addenda |
| Tertiary | Print / share actions | Bottom of page |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Open (unauthenticated) | usa-alert--info with sign in CTA | "Sign in to apply" |
| Open (authenticated, no workspace) | usa-button primary: "Start Application" or "Check My Eligibility" | Active CTA |
| Open (authenticated, workspace exists) | usa-alert--success with progress summary | "Continue Application" |
| Not yet open | usa-tag--info: "NOT YET OPEN"; CTA disabled | "Opens [date]" |
| Closing soon (< 72 hrs) | usa-tag--warning: "CLOSING SOON"; countdown | "X days remaining" |
| Closed | CTA button disabled | "Deadline Passed — [date]" |
| Restricted (unauthenticated) | Title only + "Sign in to view" | Rest of content hidden |
| Has recent addendum | usa-tag--info: "UPDATED [date]" on card and top of detail | Addendum section highlighted |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Search bar | usa-search | Full-text search; updates results |
| Filter checkboxes | usa-checkbox | Adds/removes filter; results update in real time |
| "Apply Filters" | usa-button (outline) | Applies current filter state |
| Active filter chips | Removable chips | Click × to remove filter |
| Opportunity card | usa-card (clickable) | Navigates to Opportunity Detail page |
| Sort dropdown | usa-select | Sorts results by deadline / relevance / newest |
| "Sign In to Apply" | usa-button (primary) | Redirects to login; returns to opportunity |
| "Start Application" | usa-button (primary) | Initiates eligibility pre-screen then workspace |
| "Continue Application" | usa-button (primary) | Navigates to Application Workspace |
| "Print this page" | usa-button (unstyled) | Print-friendly layout |
| "Copy link" | usa-button (unstyled) | Copies shareable URL to clipboard |

---
# Screen-04: Organization Profile Manager

**Routes:**
- Profile: `/applicant/organization/profile`
- Documents: `/applicant/organization/documents`
- Team: `/applicant/organization/team`

**Purpose:** Priya maintains the organization's reusable profile, document library, credential tracking, and team role assignments — the foundation that makes all applications faster.
**User Stories:** US-4.1, US-4.2, US-4.3, US-4.4, US-4.5, US-4.6
**Features:** F18, F19, F20, F21, F22, F23
**Personas:** Priya Nair (Organization Administrator)

---

## Layout — Organization Profile Main View

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-banner]                                                        │
├─────────────────────────────────────────────────────────────────────┤
│ [Logo]  Find Opportunities  My Applications  Organization  ▾Priya   │
├─────────────────────────────────────────────────────────────────────┤
│ [usa-breadcrumb] Home > Organization > Profile                      │
│                                                                     │
│  Organization Profile                                               │
│  Urban Health Collaborative                    [Edit Profile]       │
│                                                                     │
│  Profile Completeness: ████████████████░░░░ 82%                    │
│  [usa-progress: 82%]                                                │
│  3 optional fields incomplete. [See what's missing →]              │
│                                                                     │
├────────────────────────┬────────────────────────────────────────────┤
│ ORGANIZATION SIDENAV   │  LEGAL IDENTITY                            │
│                        │                                            │
│ ▶ Profile              │  Legal Name *                              │
│   Document Library     │  Urban Health Collaborative                │
│   Team & Roles         │                                            │
│   Credential Status    │  DBA (if different)                        │
│                        │  Urban Health Collab                       │
│                        │                                            │
│                        │  Entity Type *                             │
│                        │  Nonprofit 501(c)(3)                       │
│                        │                                            │
│                        │  EIN *   83-4521766                        │
│                        │  UEI *   UJKL8923MN01                      │
│                        │                                            │
│                        │  SAM Registration *                        │
│                        │  Registered · Expires Dec 15, 2026         │
│                        │  [usa-tag--warning] Expires in 5 months    │
│                        │                                            │
│                        │  MAILING ADDRESS                           │
│                        │  1200 Oak Avenue                           │
│                        │  Chicago, IL 60601                         │
│                        │  Congressional District: IL-07             │
│                        │                                            │
│                        │  Tax Status                                │
│                        │  Tax-exempt (501(c)(3))                    │
│                        │  Indirect Cost Rate: 15%                   │
│                        │                                            │
│                        │  Banking Readiness                         │
│                        │  ✓ Self-attested ready                     │
│                        │                                            │
│                        │  PRIMARY CONTACT                           │
│                        │  Priya Nair · priya@urbanhealthcollab.org  │
│                        │                                            │
│                        │  [Edit Profile]  [Save Changes]            │
└────────────────────────┴────────────────────────────────────────────┘
```

---

## Layout — Document Library

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Sidenav: Document Library selected]                                │
│                                                                     │
│  Document Library                          [Upload New Document]    │
│                                                                     │
│  [usa-alert--warning]                                               │
│  1 credential requires attention: Audit Report expires in 45 days.  │
│  [Update Audit Report →]                                            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Document Type          Latest Version  Expires   Status      │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ IRS Determination      Jun 2021        Mar 2027  ✓ Current   │  │
│  │ Letter                 [History ▾]                 [Replace] │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ W-9                    Jan 2026        N/A       ✓ Current   │  │
│  │                        [History ▾]                 [Replace] │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ Audit Report (A-133)   Mar 2024        Sep 2026  ⚠ Expiring  │  │
│  │                        [History ▾]      45 days  [Replace]   │  │
│  │                        [usa-tag--warning] EXPIRING SOON      │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ Indirect Cost Agree.   Not uploaded    —         ○ Missing   │  │
│  │                                                   [Upload]   │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ Board Roster           Apr 2026        N/A       ✓ Current   │  │
│  │                        [History ▾]                 [Replace] │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  --- UPLOAD FORM (inline on [Upload] click) ---                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Document Type: [Audit Report (A-133)___________▾]            │  │
│  │                                                              │  │
│  │ [usa-file-input]                                             │  │
│  │ Drag file here or click to upload                            │  │
│  │ Accepted: PDF, DOCX, XLSX · Max: 25MB                        │  │
│  │                                                              │  │
│  │ Expiration Date  [____/____/________]                        │  │
│  │ ℹ Why this matters: Expired credentials may block submission │  │
│  │                                                              │  │
│  │ [Upload Document]  [Cancel]                                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Team and Roles

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Sidenav: Team & Roles selected]                                    │
│                                                                     │
│  Team & Roles                               [Invite Team Member]   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Name            Email                   Role        Actions   │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ Priya Nair      priya@urbanhc.org  Org Admin        [Manage] │  │
│  │ Jordan Kim      jordan@urbanhc.org Proposal Lead    [Manage] │  │
│  │ Maria Santos    maria@urbanhc.org  Finance Contrib. [Manage] │  │
│  │ Sandra Okafor   sandra@urbanhc.org                           │  │
│  │ [usa-tag: AUTHORIZED REPRESENTATIVE — Submit Authority]      │  │
│  │                                         AR             [Manage] │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ [Invite Member]                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [usa-alert--info]                                                  │
│  Sandra Okafor is designated as the Authorized Representative.      │
│  Only she can certify and submit final applications.                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Profile completeness percentage | Top of profile view |
| Primary | Credential expiration warnings (if any) | Alert banner at top of Document Library |
| Primary | Authorized Representative designation | Highlighted row in Team table + info alert |
| Secondary | Required profile fields (legal name, EIN, UEI, SAM) | Main content area |
| Secondary | Document library with status per document type | Document Library view |
| Tertiary | Optional supplemental fields | Below required fields |
| Tertiary | Document version history | Expandable per row |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Profile complete | usa-progress at 100%; no warnings | "Your profile is complete" |
| Profile incomplete | usa-progress < 100%; incomplete field list | "X fields incomplete. [See what's missing →]" |
| Credential expired | usa-tag--error on document row; usa-alert--error | "This credential has expired. Update before submitting." |
| Credential expiring soon | usa-tag--warning on document row; usa-alert--warning | "Expires in X days. Update soon." |
| No AR assigned | usa-alert--warning in Team view | "No Authorized Representative assigned. Applications cannot be submitted." |
| Document uploading | Progress bar within file input | "Uploading... 67%" |
| Upload success | New version row added | "Document uploaded successfully" |
| Upload error | usa-alert--error inline | "Upload failed. File type not supported / File exceeds 25MB." |
| Edit mode | Fields become editable; Save/Cancel buttons appear | Form fields unlocked |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Left sidenav links | Links | Navigate between profile, documents, team |
| "Edit Profile" | usa-button (outline) | Unlocks profile fields for editing |
| "Save Changes" | usa-button (primary) | Saves profile; logs audit event |
| Document "Replace" | usa-button (unstyled) | Opens upload form inline |
| Document "History ▾" | usa-accordion | Expands version history for that document type |
| "Upload New Document" | usa-button (outline) | Opens upload form; prompts for document type and expiration |
| "Invite Team Member" | usa-button (outline) | Opens invite form (email + role selection) |
| Role dropdown (manage) | usa-select | Changes team member role |
| Credential expiration alert | usa-alert | Links to the relevant document row |

---
# Screen-05: Eligibility Pre-Screen and Result

**Routes:**
- Pre-Screen: `/applicant/opportunities/{id}/pre-screen`
- Result: `/applicant/opportunities/{id}/pre-screen/result`

**Purpose:** Jordan completes a guided questionnaire to determine eligibility before investing time in the application.
**User Stories:** US-5.1, US-5.2, US-5.3
**Features:** F24, F25, F26
**Personas:** Jordan Kim (Proposal Lead)

---

## Layout — Eligibility Pre-Screen Questionnaire

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-banner]                                                        │
├─────────────────────────────────────────────────────────────────────┤
│ [Logo]  Find Opportunities  My Applications  ▾Jordan Kim            │
├─────────────────────────────────────────────────────────────────────┤
│ [usa-breadcrumb] Home > Community Resilience Grant > Eligibility    │
│                                                                     │
│  Check Your Eligibility                                             │
│  Community Resilience Grant — HHS                                   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  [usa-step-indicator]                                        │  │
│  │  Step 2 of 4: Organization Type                              │  │
│  │  ●─────────●─────────○─────────○                             │  │
│  │  Basics  Org Type  SAM/UEI   Geography                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │  What type of organization is applying?                      │  │
│  │                                                              │  │
│  │  Select the option that best describes your organization.    │  │
│  │                                                              │  │
│  │  ○ Nonprofit 501(c)(3)                                       │  │
│  │  ○ Nonprofit (other tax-exempt)                              │  │
│  │  ○ Government — State or Local                               │  │
│  │  ○ Government — Tribal                                       │  │
│  │  ○ University or College                                     │  │
│  │  ○ For-profit organization                                   │  │
│  │  ○ Individual                                                │  │
│  │  ○ Other                                                     │  │
│  │                                                              │  │
│  │  [← Back]                        [Next: SAM Registration →]  │  │
│  │  (disabled if no answer selected)                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Your answers are saved privately and not visible to the grantor    │
│  until you complete this questionnaire.                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Eligibility Result: Eligible

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-breadcrumb] Home > Community Resilience Grant > Eligibility    │
│                                                                     │
│  Eligibility Check Complete                                         │
│  Community Resilience Grant                                         │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ [usa-alert--success]                                         │  │
│  │                                                              │  │
│  │ ✓  You appear to meet the eligibility requirements.          │  │
│  │                                                              │  │
│  │ Based on your answers, your organization appears eligible    │  │
│  │ for this opportunity. You may proceed to start your          │  │
│  │ application.                                                 │  │
│  │                                                              │  │
│  │ [Start Application]                                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Summary of your responses:                                         │
│  · Organization type: Nonprofit 501(c)(3) ✓                        │
│  · SAM registered: Yes ✓                                            │
│  · Location: Illinois (Midwest region) ✓                            │
│  · Prior exclusion: No ✓                                            │
│                                                                     │
│  [Review the full eligibility requirements →]                       │
│  [Return to opportunity]                                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Eligibility Result: Needs Attention (Advisory Warning)

```
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ [usa-alert--warning]                                         │  │
│  │                                                              │  │
│  │ ⚠  You may be eligible, but please review the items below.   │  │
│  │                                                              │  │
│  │ Your answers indicate you may qualify, but one or more items │  │
│  │ require your attention. You may proceed, but reviewers will  │  │
│  │ see these items.                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Items to review:                                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ⚠ Nonprofit status — advisory                                │  │
│  │                                                              │  │
│  │ Your answer: Nonprofit (other tax-exempt)                    │  │
│  │                                                              │  │
│  │ "Nonprofit organizations with 501(c)(3) status are preferred │  │
│  │ for this program. Other nonprofit types may apply but should │  │
│  │ be prepared to document their tax-exempt status."            │  │
│  │                                                              │  │
│  │ [View eligibility section of the opportunity →]             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [Proceed with Awareness]   [Return to opportunity]                 │
```

---

## Layout — Eligibility Result: Ineligible (Hard Blocker)

```
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ [usa-alert--error]                                           │  │
│  │                                                              │  │
│  │ ✗  You do not meet the eligibility requirements.             │  │
│  │                                                              │  │
│  │ Based on your answers, your organization does not meet one   │  │
│  │ or more required eligibility criteria. You are not able to   │  │
│  │ start an application for this opportunity at this time.      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Why you are not eligible:                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ✗ SAM Registration — required                                │  │
│  │                                                              │  │
│  │ Your answer: Not registered in SAM.gov                       │  │
│  │                                                              │  │
│  │ "Your organization must be registered in SAM.gov before you  │  │
│  │ can apply for this federal opportunity. SAM registration is  │  │
│  │ required by 2 CFR 200.206. Registration can take up to 3-4   │  │
│  │ weeks."                                                      │  │
│  │                                                              │  │
│  │ [View eligibility requirements →]                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ✗ Geographic Restriction — required                          │  │
│  │                                                              │  │
│  │ Your answer: Florida (Southeast region)                      │  │
│  │                                                              │  │
│  │ "This opportunity is limited to organizations operating in   │  │
│  │ the Midwest region (IL, IN, OH, MI, WI, MN, IA, MO)."       │  │
│  │ [View eligibility requirements →]                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [Return to opportunity listing]   [Find other opportunities]      │
```

---

## Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Step indicator (progress through questionnaire) | Top of questionnaire |
| Primary | Current question + response options | Center of screen |
| Primary | Eligibility result (success / warning / error) | Top of result page |
| Secondary | Per-rule explanations (why each triggered) | Below result alert |
| Secondary | Summary of all responses | Result page |
| Tertiary | Link to eligibility section of opportunity | Per rule item + footer |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Question unanswered | "Next" button disabled | "Please select an answer to continue" |
| Conditional question visible | Question appears below parent answer | Smooth expansion (no page reload) |
| Conditional question hidden | Question not visible | No error for hidden questions |
| Loading results | Spinner after final question answered | "Calculating your eligibility..." |
| Eligible | usa-alert--success | "Start Application" button active |
| Likely Eligible | usa-alert--success (with advisory note) | "Start Application" button active |
| Needs Attention | usa-alert--warning | "Proceed with Awareness" button active |
| Ineligible | usa-alert--error | No workspace button; back to listing link |
| All blockers shown | All triggered rules listed individually | Multiple usa-alert--error items |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Radio buttons (single-select) | usa-radio | Selects answer; may show/hide conditional questions |
| Checkboxes (multi-select) | usa-checkbox | For multi-value questions (e.g., select all that apply) |
| "Back" button | usa-button (unstyled) | Returns to prior question (answers preserved) |
| "Next" button | usa-button (primary) | Advances to next question (disabled until answer selected) |
| "Start Application" | usa-button (primary) | Creates workspace; navigates to Application Workspace |
| "Proceed with Awareness" | usa-button (secondary) | Creates workspace despite advisory warnings |
| "View eligibility requirements" | Link | Opens opportunity detail page, scrolled to eligibility section |
| "Find other opportunities" | usa-button (outline) | Returns to Opportunity Discovery |

---
# Screen-06: Application Workspace

**Route:** `/applicant/applications/{workspace_id}`
**Section Editor:** `/applicant/applications/{workspace_id}/sections/{section_id}`
**Budget:** `/applicant/applications/{workspace_id}/budget`

**Purpose:** The collaborative application drafting environment — where Jordan's team builds, coordinates, validates, and prepares the application for submission.
**User Stories:** US-6.1–US-6.6, US-7.1–US-7.6, US-9.1, US-9.2
**Features:** F29–F41, F48, F49
**Personas:** Jordan Kim (Proposal Lead), Maria Santos (Finance Contributor)

---

## Layout — Application Workspace Main View

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-banner]                                                        │
├─────────────────────────────────────────────────────────────────────┤
│ [Logo]  Find Opportunities  My Applications  Organization  ▾Jordan  │
├─────────────────────────────────────────────────────────────────────┤
│ [usa-breadcrumb] Home > My Applications > Community Resilience Grant│
│                                                                     │
│  Community Resilience Grant                   Deadline: 12 days     │
│  [usa-tag] IN PROGRESS  ·  Urban Health Collaborative               │
│                                                                     │
│  [usa-alert--warning]                                               │
│  A grantor update was published on Jul 18. The match requirement    │
│  has changed from 10% to 20%. [View Update →]                       │
│                                                                     │
├───────────────────────────────┬─────────────────────────────────────┤
│ SECTION NAVIGATOR             │ READINESS DASHBOARD                 │
│                               │                                     │
│ ✓ Organization Profile        │ Overall: 63% complete               │
│   Auto-populated              │ [usa-progress: 63%]                 │
│                               │                                     │
│ ✓ Eligibility                 │ ✗ Blocking Errors (2)               │
│   Completed Jul 14            │   · Budget total exceeds ceiling    │
│                               │     [Fix: Budget →]                 │
│ ○ Narrative                   │   · W-9 missing (required)          │
│   Jordan Kim · Due Jul 28     │     [Fix: Attachments →]            │
│   [usa-progress: 40%]         │                                     │
│                               │ ⚠ Warnings (1)                      │
│ ⚠ Budget                      │   · SAM expires in 5 months         │
│   Maria Santos · Due Jul 25   │     [Update SAM registration]       │
│   1 blocking error            │                                     │
│                               │ Required Attachments:               │
│ ○ Workplan                    │   ✓ IRS Determination Letter        │
│   Unassigned                  │   ✓ Audit Report                    │
│                               │   ✗ W-9 (required)                  │
│ ○ Attachments                 │   ○ Indirect Cost Agreement         │
│   Missing: W-9                │     (recommended only)              │
│                               │                                     │
│ ○ Certifications              │ Authorized Representative:          │
│                               │ Sandra Okafor ✓ Assigned            │
│ ○ Review / Submit             │                                     │
│                               │ [Preview Package]                   │
│ ─────────────────────         │ [Check Readiness]                   │
│ INTERNAL TASKS                │                                     │
│ ⚠ Budget: Reconcile personnel │                                     │
│   [Maria Santos · Due Thu]    │                                     │
└───────────────────────────────┴─────────────────────────────────────┘
```

---

## Layout — Section Editor (Narrative Section)

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Workspace navigator unchanged on left]                             │
│                                                                     │
│  NARRATIVE SECTION                     Owner: Jordan Kim            │
│  Internal due date: Jul 28             [Assign Owner] [Set Due Date]│
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ CONTENT   INTERNAL NOTES                                     │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │                                                              │  │
│  │ Statement of Need *                                          │  │
│  │ 2000 character limit                                         │  │
│  │ ┌──────────────────────────────────────────────────────────┐│  │
│  │ │                                                          ││  │
│  │ │ [text area]                                              ││  │
│  │ │                                                          ││  │
│  │ └──────────────────────────────────────────────────────────┘│  │
│  │ 847 / 2000 characters                                        │  │
│  │                                                              │  │
│  │ Project Description *                                        │  │
│  │ 5000 character limit                                         │  │
│  │ ┌──────────────────────────────────────────────────────────┐│  │
│  │ │                                                          ││  │
│  │ │ [text area]                                              ││  │
│  │ └──────────────────────────────────────────────────────────┘│  │
│  │ 0 / 5000 characters                                          │  │
│  │ * This field is required                                     │  │
│  │                                                              │  │
│  │ Target Population                                            │  │
│  │ [usa-input]                                                  │  │
│  │                                                              │  │
│  │ [Save Section]                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ INTERNAL NOTES  [🔒 PRIVATE — not visible to grantor]        │  │
│  │                                                              │  │
│  │ Jordan Kim, Jul 16 10:30 AM:                                 │  │
│  │ "Draft is 40% done. Maria please finish the economic impact  │  │
│  │ data so I can reference it in project description."          │  │
│  │                                                              │  │
│  │ [Add comment...]                              [Post]         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ SECTION TASKS                                                │  │
│  │ ○ Complete statement of need draft  ·  Jordan Kim  ·  Jul 20 │  │
│  │ ○ Add partner org references         ·  Jordan Kim  ·  Jul 25 │  │
│  │                                                 [Add Task]   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Budget Builder

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Workspace navigator: Budget selected]                              │
│                                                                     │
│  BUDGET                                    Owner: Maria Santos      │
│                                                                     │
│  [usa-alert--error]                                                 │
│  Budget total ($520,000) exceeds the maximum award of $500,000.    │
│  Please reduce your budget to meet the award ceiling.              │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ PERSONNEL                                                    │  │
│  │ Position           FTE   Annual Salary  Period  Total         │  │
│  │ Program Director   0.5   $120,000       12 mo   $60,000      │  │
│  │ Community Coord.   1.0   $65,000        12 mo   $65,000      │  │
│  │ [+ Add Line Item]                    Subtotal: $125,000      │  │
│  │                                                              │  │
│  │ Justification *   [________________] [required for federal]  │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ FRINGE BENEFITS                                              │  │
│  │ Rate: 28% of Personnel                           $35,000     │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ TRAVEL                                                       │  │
│  │ [+ Add Line Item]                                $8,500      │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ EQUIPMENT                               $0                   │  │
│  │ SUPPLIES                                $12,000              │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ INDIRECT COSTS                                               │  │
│  │ Rate: 15% (from org profile)            $27,000              │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ OTHER                                   $320,000             │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ TOTAL PROJECT COST              $527,500                     │  │
│  │ COST SHARE / MATCH (20%)         $105,500  ← must meet 20%  │  │
│  │ FEDERAL REQUEST                 $422,000                     │  │
│  │                                          ✗ Exceeds $500K max │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [Save Budget]                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Addendum banner (when new update exists) | Top of workspace, full width |
| Primary | Readiness Dashboard (blocking errors, completion) | Right panel, always visible |
| Primary | Deadline countdown | Workspace header |
| Secondary | Section navigator with status and owner | Left panel |
| Secondary | Current section form content | Main content area |
| Secondary | Character counters, field validation messages | Adjacent to fields |
| Tertiary | Internal tasks | Left panel bottom |
| Tertiary | Internal notes / comments | Section "Internal Notes" tab |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Section incomplete | ○ in section navigator | No completion badge |
| Section complete | ✓ in section navigator | Section marked complete |
| Section has errors | ✗ in section navigator | Error count badge |
| Section has advisory | ⚠ in section navigator | Warning badge |
| Section hidden (conditional) | Not shown in navigator | No blocker for hidden sections |
| Field error | Red border on input; usa-form-error-message below | Inline error text on blur |
| Character limit reached | Counter turns red; additional input blocked | "Character limit reached" |
| Addendum notice | usa-alert--warning full width banner | "A grantor update was published..." |
| Auto-save | Subtle indicator in section header | "Saved 30 seconds ago" |
| Private comment | Blue badge "🔒 PRIVATE" on comment thread | Visual differentiation from submission content |
| Budget error | usa-alert--error above budget table | Specific error text with remediation |
| Draft privacy | No grantor access; grantee-private zone enforced | No visible indicator needed (system-enforced) |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Section navigator items | Links | Navigate to that section's editor |
| Section "..." menu | Dropdown | Assign owner, set due date, add task |
| Readiness Dashboard links | Inline links | Jump to blocking field or section |
| "Preview Package" | usa-button (outline) | Opens submission preview (read-only) |
| "Check Readiness" | usa-button (outline) | Reruns validation; updates dashboard |
| "Add Line Item" (budget) | usa-button (unstyled) | Adds a new row to the budget table |
| "Add Task" | usa-button (unstyled) | Opens task creation form in section |
| "Post" (comment) | usa-button (primary, small) | Saves internal comment |
| "Save Section" | usa-button (primary) | Explicit save; auto-save also runs |
| INTERNAL NOTES tab | Tab | Switches between content and private comments |
| Attachment upload | usa-file-input | Upload or select from document library |

---
# Screen-07: Readiness Dashboard, Submission Preview, Certification, and Receipt

**Routes:**
- Readiness Dashboard: `/applicant/applications/{workspace_id}/readiness`
- Submission Preview: `/applicant/applications/{workspace_id}/preview`
- Certification: `/applicant/applications/{workspace_id}/certify`
- Receipt: `/applicant/applications/{workspace_id}/receipt`

**Purpose:** Final submission readiness check, package review, certification by Authorized Representative, and immutable receipt.
**User Stories:** US-6.5, US-7.7, US-9.2, US-9.3, US-9.4, US-9.5, US-9.6, US-9.7
**Features:** F34, F42, F49, F50, F51, F52, F53, F54
**Personas:** Jordan Kim (Proposal Lead), Sandra Okafor (Authorized Representative)

---

## Layout — Readiness Dashboard (Full View)

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-banner]                                                        │
├─────────────────────────────────────────────────────────────────────┤
│ [Logo]  My Applications  Organization  ▾Sandra Okafor               │
├─────────────────────────────────────────────────────────────────────┤
│ [usa-breadcrumb] Home > My Applications > Community Resilience Grant│
│                                                                     │
│  Submission Readiness                                               │
│  Community Resilience Grant                   Deadline: 3 days      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ [usa-alert--success]                                         │  │
│  │ ✓ Your application is ready to submit. All blocking errors   │  │
│  │ have been resolved.                                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Overall Completion                                                 │
│  [usa-progress: 100%]  All sections complete                        │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ SECTION COMPLETION                                           │  │
│  │ Organization Profile  ████████████████ 100% ✓               │  │
│  │ Eligibility           ████████████████ 100% ✓               │  │
│  │ Narrative             ████████████████ 100% ✓               │  │
│  │ Budget                ████████████████ 100% ✓               │  │
│  │ Workplan              ████████████████ 100% ✓               │  │
│  │ Attachments           ████████████████ 100% ✓               │  │
│  │ Certifications        ████████████████ 100% ✓               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ BLOCKING ERRORS        ✓ None — all cleared                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ WARNINGS (1 — advisory only, do not block submission)        │  │
│  │ ⚠ SAM registration expires Dec 15, 2026 (5 months away)      │  │
│  │   [Update your SAM registration →]                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ REQUIRED ATTACHMENTS   ✓ All required attachments present    │  │
│  │ ✓ IRS Determination Letter                                   │  │
│  │ ✓ W-9                                                        │  │
│  │ ✓ Audit Report (A-133)                                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ AUTHORIZED REPRESENTATIVE                                    │  │
│  │ ✓ Sandra Okafor — Assigned and confirmed                     │  │
│  │   Executive Director · sandra@urbanhealthcollab.org           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [Preview Submission Package]                                       │
│                                                                     │
│  [Certify & Submit Application]  ← Active for Sandra (AR only)     │
│  [usa-tooltip for non-AR users: "Only the Authorized Representative │
│   can certify and submit this application."]                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Submission Preview (Read-Only)

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-banner]                                                        │
│                                                                     │
│  Submission Package Preview                     [Print]  [Close ×] │
│  Community Resilience Grant — Urban Health Collaborative            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ [usa-alert--info]                                            │  │
│  │ This is a read-only preview. Submitting requires returning   │  │
│  │ to the Readiness Dashboard and clicking "Certify & Submit."  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ORGANIZATION PROFILE                                               │
│  Legal Name: Urban Health Collaborative                             │
│  EIN: 83-4521766 · UEI: UJKL8923MN01                               │
│  Entity Type: Nonprofit 501(c)(3)                                   │
│  Address: 1200 Oak Avenue, Chicago, IL 60601                        │
│                                                                     │
│  ELIGIBILITY                                                        │
│  Pre-screen result: Eligible                                        │
│  (All responses documented)                                         │
│                                                                     │
│  NARRATIVE                                                          │
│  Statement of Need: [full text]                                     │
│  Project Description: [full text]                                   │
│                                                                     │
│  BUDGET SUMMARY                                                     │
│  Personnel:          $125,000                                       │
│  Fringe (28%):       $35,000                                        │
│  Travel:             $8,500                                         │
│  Supplies:           $12,000                                        │
│  Indirect (15%):     $22,125                                        │
│  Other:              $160,375                                       │
│  ────────────────────────────                                       │
│  TOTAL REQUEST:      $363,000                                       │
│  COST SHARE (20%):   $72,600                                        │
│                                                                     │
│  ATTACHMENTS                                                        │
│  ✓ IRS Determination Letter (Jun 2021 · 2.1 MB)                    │
│  ✓ W-9 (Jan 2026 · 180 KB)                                         │
│  ✓ Audit Report (Mar 2024 · 5.4 MB)                                │
│                                                                     │
│  [Return to Readiness Dashboard]                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Certification Screen

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-breadcrumb] Home > My Applications > Community Resilience...   │
│                                                                     │
│  Authorized Representative Certification                            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │ You are certifying this application as:                      │  │
│  │ Sandra Okafor, Executive Director                            │  │
│  │ Urban Health Collaborative                                   │  │
│  │                                                              │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │                                                              │  │
│  │ CERTIFICATION STATEMENT                                      │  │
│  │                                                              │  │
│  │ I certify that, to the best of my knowledge and belief,      │  │
│  │ the information in this application is true and correct.     │  │
│  │ I further certify that the organization is in compliance     │  │
│  │ with all applicable federal statutes and regulations,        │  │
│  │ including requirements related to debarment, suspension,     │  │
│  │ drug-free workplace, and non-discrimination. The filing of   │  │
│  │ this application authorizes the use of funds for the purposes│  │
│  │ set forth in the application, if awarded.                    │  │
│  │                                                              │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │                                                              │  │
│  │ ☐ I have read and agree to the above certification statement │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [Submit Application]  ← enabled only after checkbox checked        │
│  [Cancel — Return to Readiness Dashboard]                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Submission Receipt

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-banner]                                                        │
│                                                                     │
│  [usa-alert--success]                                               │
│  ✓ Your application has been submitted successfully.                │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │  SUBMISSION RECEIPT                                          │  │
│  │                                                              │  │
│  │  Confirmation Number:                                        │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  CRG-2026-0042                                         │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  Opportunity:   Community Resilience Grant                   │  │
│  │  Organization:  Urban Health Collaborative                   │  │
│  │  Submitted by:  Sandra Okafor (Authorized Representative)    │  │
│  │  Submitted:     July 24, 2026, 16:42:07 UTC                  │  │
│  │  Status:        Submitted — Awaiting Administrative Screening│  │
│  │                                                              │  │
│  │  [Download Receipt (PDF)]                                   │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  What happens next?                                                 │
│  Your application will be reviewed by the grantor's intake team.   │
│  You will receive a notification when a disposition is applied.    │
│                                                                     │
│  [Return to My Dashboard]                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Alert: ready/blocking (readiness), read-only notice (preview), confirmation number (receipt) | Top of each screen |
| Primary | Certify & Submit button — active for AR only | Bottom of Readiness Dashboard |
| Primary | Certification statement — must be read and acknowledged | Center of certification screen |
| Secondary | Section completion breakdown | Readiness Dashboard |
| Secondary | Attachment and AR status | Readiness Dashboard panels |
| Secondary | Full application content (preview) | Submission Preview (scrollable) |
| Tertiary | Warnings (advisory only) | Readiness Dashboard, below blockers |
| Tertiary | "What happens next" | Receipt page footer |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Blocking errors remain | usa-alert--error in Readiness Dashboard | Submit button disabled |
| Ready to submit | usa-alert--success in Readiness Dashboard | Submit button active (for AR) |
| Non-AR user | Submit button disabled with tooltip | "Only the Authorized Representative can submit" |
| Certification checkbox unchecked | Submit button disabled | Checkbox is required |
| Certification checkbox checked | Submit button enabled | Submit available |
| Submission processing | Loading spinner | "Submitting your application..." |
| Submission successful | usa-alert--success + receipt | Confirmation number shown prominently |
| Submission failed | usa-alert--error | "Submission failed. Please try again or contact support." |
| Post-submission (workspace) | All fields read-only | Lock notice: "Submitted on [date]" |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| "Preview Submission Package" | usa-button (outline) | Opens preview page (read-only) |
| "Certify & Submit Application" | usa-button (primary) — AR only | Navigates to certification screen |
| Certification checkbox | usa-checkbox | Must be checked to enable submit |
| "Submit Application" | usa-button (primary) | Opens confirmation modal |
| Confirmation modal "Confirm Submit" | usa-modal confirm | Executes final submission |
| "Download Receipt (PDF)" | usa-button (primary) | Downloads generated PDF receipt |
| "Return to My Dashboard" | usa-button (outline) | Returns to Applicant Dashboard |
| "Print" (preview) | usa-button (unstyled) | Print-friendly layout |

---
# Screen-08: Applicant Dashboard and Application Status Tracker

**Routes:**
- Applicant Dashboard: `/applicant/dashboard`
- Application Status: `/applicant/applications/{workspace_id}/status`

**Purpose:** Jordan (and Sandra) see all application activity, deadlines, and status at a glance — the command center for an active application cycle.
**User Stories:** US-11.2
**Features:** F62
**Personas:** Jordan Kim (Proposal Lead), Sandra Okafor (Authorized Representative)

---

## Layout — Applicant Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-banner]                                                        │
├─────────────────────────────────────────────────────────────────────┤
│ [Logo]  Find Opportunities  My Applications  Organization  ▾Jordan  │
├─────────────────────────────────────────────────────────────────────┤
│ [usa-breadcrumb] Home                                               │
│                                                                     │
│  My Applications                                                    │
│  Urban Health Collaborative                                         │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ [usa-alert--warning]                                         │  │
│  │ ⚠ Action required: Community Resilience Grant needs your     │  │
│  │ certification before Aug 15 (3 days). You are designated as  │  │
│  │ Authorized Representative.                                   │  │
│  │ [Certify & Submit →]                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  IN PROGRESS (2)                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Community Resilience Grant                                   │  │
│  │ HHS · Due Aug 15, 2026  ·  [usa-tag--warning] 3 DAYS LEFT   │  │
│  │                                                              │  │
│  │ Completion:  ████████████████████ 100%                       │  │
│  │ Blockers: 0  Warnings: 1  Attachments: ✓ All present        │  │
│  │ AR: Sandra Okafor ✓                                          │  │
│  │                                                              │  │
│  │ [Continue Application]  [View Readiness]  [Preview Package] │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Rural Health Equity Initiative                               │  │
│  │ USDA · Due Sep 1, 2026  ·  [usa-tag--info] 38 DAYS LEFT     │  │
│  │                                                              │  │
│  │ Completion:  ████████░░░░░░░░░░░ 45%                         │  │
│  │ Blockers: 3  Warnings: 2  Attachments: 1 missing            │  │
│  │                                                              │  │
│  │ [Continue Application]  [View Readiness]                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  SUBMITTED (1)                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Digital Innovation Grant — EPA                               │  │
│  │ Submitted: Jun 3, 2026 · Conf. #: EPA-2026-0089              │  │
│  │ [usa-tag--success] ACCEPTED FOR REVIEW                       │  │
│  │                                                              │  │
│  │ [View Receipt]  [View Application]                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  UPCOMING DEADLINES                                                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ · Aug 15 — Community Resilience Grant  [3 days]  ⚠ AR needed│  │
│  │ · Sep 1  — Rural Health Equity         [38 days] ○ In prog. │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [Find More Opportunities]                                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Application Status Tracker

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-breadcrumb] Home > My Applications > Community Resilience...   │
│                                                                     │
│  Application Status                                                 │
│  Community Resilience Grant — CRG-2027-001                          │
│  Urban Health Collaborative                                         │
│                                                                     │
│  Current Status:                                                    │
│  [usa-tag--success] SUBMITTED — AWAITING ADMINISTRATIVE SCREENING   │
│                                                                     │
│  Submitted: July 24, 2026 at 16:42:07 UTC                          │
│  Confirmation Number: CRG-2026-0042                                 │
│  Submitted by: Sandra Okafor (Authorized Representative)            │
│                                                                     │
│  [Download Receipt]                                                 │
│                                                                     │
│  STATUS HISTORY                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ [usa-process-list — vertical timeline]                       │  │
│  │                                                              │  │
│  │ ✓ Jul 12 — Workspace created                                 │  │
│  │ ✓ Jul 14 — Eligibility pre-screen completed                  │  │
│  │ ✓ Jul 18 — Addendum received: match req. updated             │  │
│  │ ✓ Jul 22 — Application ready for submission                  │  │
│  │ ✓ Jul 24 — Application submitted by Sandra Okafor            │  │
│  │             (CRG-2026-0042 · 16:42:07 UTC)                   │  │
│  │ ◌ Awaiting administrative screening by HHS                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  NOTIFICATIONS                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Jul 18 — Addendum: Match requirement changed from 10% to 20% │  │
│  │ Jul 15 — Q&A: Clarification on nonprofit status published    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Action required alert (when AR needs to certify) | Top of dashboard, full width |
| Primary | In-progress application cards with completion and blockers | Main content, first section |
| Secondary | Upcoming deadlines summary | Below application cards |
| Secondary | Submitted applications with status badges | Below in-progress section |
| Tertiary | "Find More Opportunities" | Bottom CTA |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| No applications | Empty state with CTA | "You haven't started any applications yet. [Find Opportunities]" |
| Application in progress, has blockers | usa-tag: "X blockers" on card | Orange/red indicator |
| Application ready (0 blockers, AR assigned) | Completion 100%, green indicators | "Ready to submit" |
| AR role — action required | usa-alert--warning at top | "Action required: Certify & Submit" |
| Submitted, pending screening | usa-tag--neutral: "AWAITING SCREENING" | No action needed |
| Returned for correction | usa-alert--warning on card | "Correction requested. Review and resubmit." |
| Accepted for review | usa-tag--success | Read-only; receipt available |
| Deadline < 72 hours | usa-tag--warning: "X DAYS LEFT" | Urgency visual treatment |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| "Continue Application" | usa-button (primary) | Opens Application Workspace |
| "View Readiness" | usa-button (outline) | Opens Readiness Dashboard |
| "Preview Package" | usa-button (outline) | Opens Submission Preview |
| "Certify & Submit" (AR alert) | usa-button (primary) | Opens Certification Screen directly |
| "View Receipt" | usa-button (outline) | Opens receipt page |
| "Find More Opportunities" | usa-button (outline) | Navigates to Opportunity Discovery |
| Application card | Clickable header | Opens Application Workspace |
| Status history timeline | Read-only process list | Visual timeline of status events |

---
# Interaction Patterns

**Project:** GrantsIntake
**Design Standard:** USWDS

---

## Pattern 1: Real-Time Field Validation

**When to use:** All form fields throughout the platform (metadata, eligibility rules, budget, profile fields)
**Behavior:**
- Validation triggers on `blur` (when user leaves a field), not on every keystroke (to avoid anxiety)
- Exception: character counters update on `keyup` so users can see remaining characters in real time
- On `blur`: if field fails validation, red border applied to `usa-input`; `usa-form-error-message` appears below the field
- On correction: when user re-enters valid data, error state clears immediately on `blur`
- On submit attempt: all fields re-validated; all errors surface simultaneously (not one at a time)
- Character counters: displayed below text areas as "X / 2000 characters"; turns red when limit reached; input blocked or error shown when exceeded

**USWDS components:** `usa-form-group`, `usa-label`, `usa-input`, `usa-form-error-message`, `usa-character-count`

**Examples:**
- Metadata Editor: FON uniqueness check, Assistance Listing Number format, email format
- Budget: total vs. ceiling comparison, cost-share percentage validation
- Profile: EIN 9-digit format, UEI 12-character format

---

## Pattern 2: Publication / Submission Readiness Checklist

**When to use:** Grantor Opportunity Builder (publication readiness) and Applicant Workspace (submission readiness)
**Behavior:**
- Persistent sidebar panel updates in real time as sections are completed
- Each item shows: ✓ (complete), ✗ (blocker), ⚠ (warning), ○ (not started)
- Blockers (✗) show a direct link to the incomplete field or section
- Primary action button (Publish / Submit) is disabled while any ✗ blocker exists
- Warnings (⚠) do not block; they appear below blockers with a distinct visual style
- "Check Readiness" triggers a full dry-run pass; refreshes all checklist items
- The readiness checklist updates without full page reload (live state)

**USWDS components:** `usa-process-list`, `usa-alert` (error, warning, success), `usa-button` (disabled state)

**Examples:**
- Opportunity Builder: eligibility rules required, ALN required for federal, dates required
- Application Workspace: Readiness Dashboard with section completion, missing attachments, AR status

---

## Pattern 3: Severity-Differentiated Alerts (Eligibility and Validation)

**When to use:** Eligibility pre-screen results, validation messages in readiness dashboard, budget errors
**Behavior:**
- **Blocking / Ineligible:** `usa-alert--error` (red) — must be resolved before proceeding; Submit/Next disabled
- **Advisory / Needs Attention:** `usa-alert--warning` (yellow) — informational; user can proceed
- **Eligible / Success:** `usa-alert--success` (green) — confirm positive state; enable next action
- **Informational:** `usa-alert--info` (blue) — context; no action required
- When multiple blockers triggered: all displayed in separate alert items — never collapsed into one
- Advisory warnings displayed in a separate section from blockers, clearly labeled

**USWDS components:** `usa-alert`, `usa-alert--error`, `usa-alert--warning`, `usa-alert--success`, `usa-alert--info`

**Examples:**
- Eligibility Result page: four-state result display
- Readiness Dashboard: blocking errors section, warnings section
- Budget: ceiling exceeded alert

---

## Pattern 4: Grantee-Private Content Badge

**When to use:** Any content that is private to the applicant team and not visible to the grantor
**Behavior:**
- All grantee-private content sections (internal comments, section assignments, internal tasks) display a persistent visual badge
- Badge: 🔒 icon + "PRIVATE — not visible to grantor" text label in muted styling
- Badge appears on the section header / content area label, not on each individual comment
- Submission Preview explicitly excludes all grantee-private content; no private badge appears in the preview (content simply absent)
- System enforces at data layer; visual badge is an additional trust signal for users

**USWDS components:** `usa-tag` (custom styling), inline label in `usa-prose` section header

**Examples:**
- Section Editor "Internal Notes" tab header
- Internal task panel in workspace
- Private comment threads

---

## Pattern 5: Addendum / Notification Banner in Workspace

**When to use:** When a grantor publishes an addendum affecting an opportunity for which the applicant has an active workspace
**Behavior:**
- Prominent `usa-alert--warning` banner appears at the top of the Application Workspace on next login
- Banner shows: what changed, old vs. new values (for deadline changes), link to the addendum on the opportunity page
- Dismissible once reviewed (dismissed state persisted per user per addendum)
- If the addendum requires application changes, banner includes a link to the affected section
- Notification also delivered via in-app notification and email (within 15 minutes of addendum publication)

**USWDS components:** `usa-alert--warning` (with dismiss), `usa-button` (unstyled) for dismiss action

**Examples:**
- Match requirement change notification in workspace
- Deadline extension banner with old/new dates
- Q&A response notification

---

## Pattern 6: Progressive Disclosure for Complex Configuration

**When to use:** Eligibility Rule Builder, Pre-Screening Questionnaire Builder, conditional section logic
**Behavior:**
- Primary fields shown by default: rule type, severity, basic criterion
- Advanced options (rule groups, AND/OR logic, conditional display) revealed only after primary fields are set
- Collapsible `usa-accordion` for guidance prompts, field help text, and examples
- Conditional fields appear/disappear without page reload (inline DOM update)
- Each level of complexity has its own save action; partial completion is preserved

**USWDS components:** `usa-accordion`, conditional field show/hide, `usa-select` for type selection

**Examples:**
- Rule severity selection → enforcement point field appears
- LOI required toggle → LOI deadline field appears
- Question type selection → response options builder appears

---

## Pattern 7: Confirmation Modals for Destructive / Irreversible Actions

**When to use:** Publish opportunity, submit application, apply destructive disposition (Rejected, Ineligible), delete eligibility rule
**Behavior:**
- `usa-modal` opens with:
  - Action being confirmed (specific: "Publish Community Resilience Grant")
  - Consequence statement ("This will make the opportunity visible to all applicants")
  - For irreversible actions: "This action cannot be undone"
  - Confirm button (primary) and Cancel button (outline)
- Cancel always available; no auto-close on background click for destructive modals
- After confirm: loading state on button while action processes; success toast on completion

**USWDS components:** `usa-modal`, `usa-button` (confirm/cancel pair)

**Examples:**
- Publish opportunity modal
- Submit application modal
- Apply "Administratively Rejected" disposition

---

## Pattern 8: Document Upload with Version Tracking

**When to use:** Attachment uploads in organization document library and application workspace
**Behavior:**
- `usa-file-input` component with drag-and-drop zone
- Accepted file types and max size displayed in the upload zone
- Upload progress indicator (bar)
- On success: new version record appears at top of version list with timestamp and uploader name
- Prior versions listed below current, clearly labeled "Prior version — [date]"
- Replace flow: same upload UI; new upload creates new version record (never overwrites)
- Expiration date field prompted during upload for time-sensitive document types

**USWDS components:** `usa-file-input`, `usa-progress` (upload progress), `usa-table` (version history)

**Examples:**
- Document Library: IRS letter replacement
- Application Workspace: attachment upload or select from library modal

---

## Pattern 9: Status Badge System

**When to use:** Opportunity listings, application cards, intake queue rows, version history

| Status | USWDS Tag | Color |
|--------|-----------|-------|
| Draft | `usa-tag` (neutral) | Gray |
| Open | `usa-tag--green` | Green |
| Closing Soon | `usa-tag--warning` | Yellow |
| Closed | `usa-tag` (neutral) | Gray |
| Not Yet Open | `usa-tag--info` | Blue |
| In Progress | `usa-tag` (neutral) | Gray |
| Ready to Submit | `usa-tag--success` | Green |
| Submitted | `usa-tag--info` | Blue |
| Awaiting Screening | `usa-tag--info` | Blue |
| Returned for Correction | `usa-tag--warning` | Yellow |
| Accepted for Review | `usa-tag--success` | Green |
| Administratively Rejected | `usa-tag--error` | Red |
| Ineligible | `usa-tag--error` | Red |
| Hard Blocker | `usa-tag--error` | Red |
| Advisory | `usa-tag--warning` | Yellow |
| PRIVATE | `usa-tag` custom | Muted blue/gray |

---
# Responsive Considerations

**Project:** GrantsIntake
**Design Standard:** USWDS (inherits responsive grid system)

USWDS's grid system uses a 12-column responsive layout with standard breakpoints:
- **Mobile:** < 480px
- **Mobile-lg:** 480px–640px
- **Tablet:** 640px–1024px
- **Desktop:** > 1024px

---

## General Principles

1. **Mobile-first** — All layouts designed for mobile first, then enhanced for tablet and desktop
2. **USWDS grid** — Use `usa-grid`, `usa-width-one-half`, `usa-width-full` classes for responsive column behavior
3. **Navigation collapse** — Top navigation collapses to hamburger menu on mobile
4. **Touch targets** — Minimum 44×44px touch targets for all interactive elements (WCAG 2.5.5)
5. **Sidebars collapse** — Left sidenav panels (Opportunity Builder, Application Workspace) collapse to top-of-page accordion on mobile

---

## Screen-by-Screen Breakpoints

### Grantor Dashboard

**Desktop (>1024px)**
- 4-column KPI tile row
- Full-width opportunities table with all columns visible
- Intake queue summary as horizontal stacked bar chart

**Tablet (640–1024px)**
- 2-column KPI tile row (2×2 grid)
- Opportunities table: hide "Started" column; show essential columns
- Intake queue summary: simplified

**Mobile (<640px)**
- KPI tiles: single column, stacked
- Opportunities table: card view — one card per opportunity with key info
- "Create New Opportunity" button: full width

---

### Opportunity Builder

**Desktop (>1024px)**
- Two-pane layout: left sidenav (fixed, 280px) + right content area
- Publication Readiness sidebar: visible within left sidenav
- Guidance panel: adjacent to text fields (right side of field)

**Tablet (640–1024px)**
- Left sidenav: collapsible (toggle button above content)
- Readiness checklist: moves to collapsible panel above content area
- Guidance panel: below field (stacked, not side-by-side)

**Mobile (<640px)**
- Sidenav: collapses to top accordion ("Setup Sections" with chevron)
- One section visible at a time
- Readiness checklist: accessible via "Check Readiness" button (modal on mobile)
- Eligibility rule list: card view per rule
- All form fields: full width

---

### Intake Queue Dashboard

**Desktop (>1024px)**
- Full table with all columns: org name, submitted, eligibility, amount, status, action
- Filters panel: horizontal filter bar above table
- Split-pane screening panel: applicant details left, screening checklist right

**Tablet (640–1024px)**
- Table: hide funding amount column; show essential columns
- Screening panel: stacked layout (applicant info top, checklist below)

**Mobile (<640px)**
- Queue: card view per application (key info only)
- Filters: collapsible filter panel
- Screening panel: full-screen view (single panel), scroll through sections
- Download/Export: simplified to primary format only

---

### Opportunity Discovery

**Desktop (>1024px)**
- Left filter panel (fixed, 280px) + right results grid (card grid, 2–3 columns)
- Results cards: standard card layout

**Tablet (640–1024px)**
- Filter panel: collapsible toggle above results
- Results: 2-column card grid

**Mobile (<640px)**
- Search bar: full width, prominent
- Filters: "Filter" button opens full-screen filter modal
- Active filter chips: horizontally scrollable row
- Results: single column card list
- Card: compact layout (title, funder, deadline, status badge, funding range)

---

### Published Opportunity Page

**Desktop (>1024px)**
- Two-column layout: main content (left, 70%) + key information sidebar (right, 30%)
- Q&A and addenda: full width below main content

**Tablet (640–1024px)**
- Key information sidebar: moves below main content (stacked layout)

**Mobile (<640px)**
- All content: single column, stacked
- Key dates and award amount: card format at top (above executive summary)
- "Start Application" / "Sign in to Apply" CTA: sticky bottom bar or near-top placement
- Q&A: accordion per question/answer pair

---

### Application Workspace

**Desktop (>1024px)**
- Three-panel layout: left sidenav (section navigator), center content, right readiness dashboard panel
- Internal notes: tab within center content area

**Tablet (640–1024px)**
- Left sidenav: collapsible
- Readiness Dashboard: accessible via "Check Readiness" button (slides in as overlay)
- Two-column: sidenav + content

**Mobile (<640px)**
- Sidenav: collapses to top accordion
- Readiness Dashboard: separate screen (button opens it)
- Budget table: horizontally scrollable or simplified to key columns
- One section at a time, full width
- Internal tasks: separate collapsible panel
- Internal notes: separate tab below section content

---

### Submission Certification and Receipt

**Desktop (>1024px)**
- Centered card layout (max-width 700px centered)
- Confirmation number: large display text

**Tablet / Mobile**
- Same layout, full width
- Sandra tested on mobile — certification and receipt MUST be fully usable on mobile
- "Download Receipt" button: prominent, large touch target
- Certification checkbox: large enough touch target (min 44px)
- Certification text: scrollable within the card if needed on small screens

---

## USWDS Grid Classes in Use

```
Desktop:     .grid-col-3   .grid-col-9
Tablet:      .tablet:grid-col-12 (full width for sidebar items)
Mobile:      .mobile:grid-col-12 (all elements full width)
```

---
# Accessibility Notes

**Project:** GrantsIntake
**Standard:** Section 508 / WCAG 2.1 AA
**Design System:** USWDS (inherits built-in accessibility patterns)

All applicant-facing interfaces must comply with WCAG 2.1 Level AA. USWDS components provide a strong accessibility baseline; this section documents platform-specific requirements and implementation notes.

---

## 1. Color and Contrast

| Requirement | Specification |
|-------------|---------------|
| Normal text | Minimum 4.5:1 contrast ratio (WCAG 1.4.3) |
| Large text (≥18pt or 14pt bold) | Minimum 3:1 contrast ratio |
| UI components and graphical objects | Minimum 3:1 contrast against adjacent colors (WCAG 1.4.11) |
| Status badges | Must not convey state by color alone (see icon/text requirements below) |
| Error states | Red border + error icon + text message (not red border alone) |
| Success states | Green color + ✓ icon + text (not color alone) |
| Warning states | Yellow color + ⚠ icon + text (not color alone) |

**USWDS color tokens ensure AA compliance by default.** Do not override USWDS color tokens with custom colors unless verified with a contrast checker.

**Eligibility result states (F25):**
- Eligible: `usa-alert--success` (green background, dark text, ✓ icon)
- Needs Attention: `usa-alert--warning` (yellow background, dark text, ⚠ icon)
- Ineligible: `usa-alert--error` (red background, dark text, ✗ icon)
- Must not communicate eligibility state by color alone — icon and text are required

---

## 2. Keyboard Navigation

| Requirement | Implementation |
|-------------|----------------|
| All interactive elements focusable | USWDS components use native HTML elements (button, input, select, a) — inherently focusable |
| Logical tab order | DOM order must match visual order; avoid CSS-only reordering that disrupts tab sequence |
| Focus indicator | USWDS provides visible focus rings on all interactive elements; do not suppress with `outline: none` |
| Modal dialogs | When modal opens: trap focus within modal; on close, return focus to trigger element |
| Sidebars / drawers | When sidenav closes on mobile, return focus to toggle button |
| Skip navigation | `usa-skipnav` component required on all pages — "Skip to main content" link |
| Keyboard-only form completion | All form fields, dropdowns, checkboxes, and file inputs must be fully operable by keyboard |
| Submission flow | Entire eligibility pre-screen, certification, and submission flow must be completable without a mouse |

**Critical flows to keyboard-test:**
1. Eligibility questionnaire: multi-step form with Next/Back navigation
2. Certification screen: checkbox + submit button sequence
3. Intake queue: table navigation and disposition dropdown
4. Modal dialogs: publish confirmation, submit confirmation, correction request

---

## 3. Screen Reader Considerations

| Requirement | Implementation |
|-------------|----------------|
| `<html lang="en">` | Required on all pages |
| Page titles | Descriptive, unique per page; format: "[Screen Name] — GrantsIntake" |
| Heading hierarchy | H1: page title; H2: major sections; H3: subsections; no skipped levels |
| Form labels | Every input must have an associated `<label>` with matching `for`/`id`; no label-less inputs |
| Required fields | `aria-required="true"` on required inputs; "Required" text in label |
| Error messages | `aria-describedby` linking input to its error message; `aria-invalid="true"` on invalid inputs |
| Alert regions | `usa-alert` components use `role="alert"` for errors/warnings; announced immediately by screen readers |
| Status messages | `role="status"` on auto-save indicator, upload progress messages |
| Live regions | Readiness Dashboard updates announced with `aria-live="polite"` (non-disruptive updates) |
| Tables | All `<table>` elements have `<caption>` and proper `<th scope="col/row">` headers |
| Icons | Decorative icons: `aria-hidden="true"`; informative icons: accompanied by visible text or `aria-label` |
| Progress indicators | `aria-valuenow`, `aria-valuemin`, `aria-valuemax` on all progress bars |
| Modal dialogs | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to modal heading |
| Status badges | `usa-tag` text must be readable in isolation — not "OPEN" as background image |

**Screen-reader testing required for:**
- Eligibility pre-screen: step indicator announces current step; question text read on focus
- Readiness Dashboard: blocking error count announced as live region update
- Budget table: row/column headers for all data cells
- File upload: upload progress and success/failure announced
- Submission receipt: confirmation number is plain text (not image)

---

## 4. ARIA Labels and Roles

| Component | ARIA Requirement |
|-----------|------------------|
| Main navigation | `role="navigation"` with `aria-label="Main navigation"` |
| Breadcrumb | `role="navigation"` with `aria-label="Breadcrumb"` |
| Search form | `role="search"` |
| Filter panel | `aria-label="Filter opportunities"` |
| Readiness checklist | List items with descriptive text; error items include `aria-label` with full context |
| Step indicator | `aria-current="step"` on current step; each step announced as "Step X of Y: [name]" |
| Section navigator | `role="navigation"` with `aria-label="Application sections"` |
| Status tags (dynamic) | `aria-label` if tag color is meaningful (e.g., `aria-label="Status: Open"`) |
| Collapsible guidance | `aria-expanded="true/false"` on trigger; `aria-controls` pointing to panel |
| Internal notes tab | `role="tab"` / `role="tabpanel"` / `role="tablist"` for tab interface |
| Character counter | `aria-live="polite"` region announcing "X characters remaining" on blur |
| Disposition dropdown | `aria-label="Select disposition for [applicant name]"` |

---

## 5. Forms and Inputs

- **Required field pattern:** Visible asterisk (*) + `aria-required="true"` + legend: "All fields marked with an asterisk (*) are required"
- **Error summary:** When form submission fails, display `usa-alert--error` at top of form with links to each error field; focus moved to the alert on appearance
- **Inline error:** `usa-form-error-message` appears immediately below the relevant field with `id` linked via `aria-describedby`
- **Date inputs:** Use USWDS `usa-date-picker` or separate MM/DD/YYYY fields with clear labels; avoid date pickers requiring mouse-only interaction
- **File upload:** `usa-file-input` includes drag-and-drop zone with keyboard alternative (standard file input button)
- **Budget repeating rows:** When a new row is added, announce to screen reader: "New budget line item added"
- **Picklist / dropdown:** Native `<select>` preferred over custom dropdown components for maximum screen-reader compatibility

---

## 6. Plain Language (Accessibility for Cognitive Access)

Following USWDS plain language standards and the Simpler.Grants.gov direction:

- Use active voice throughout: "You must complete this field" not "This field must be completed"
- Error messages: state what happened + what to do: "Contact email is invalid. Enter a valid email address (example: name@agency.gov)"
- Labels: describe the field, not the format (e.g., "Application close date" not "Date_close_field")
- Help text: placed below the label and before the input field (USWDS pattern)
- Guidance prompts: written at 8th grade reading level or lower
- Eligibility result explanations: plain language, never rule codes or technical identifiers
- Certification language: plain language, specific, legally unambiguous

---

## 7. Government Requirements

| Requirement | Implementation |
|-------------|----------------|
| `usa-banner` | Required on all pages (Official US government website banner) |
| Skip navigation | `usa-skipnav` required on all pages |
| Print-friendly | Opportunity detail pages and submission preview printable without navigation elements |
| PDF receipts | Generated PDFs must be tagged (accessible PDFs); confirm with PDF generation library |
| Government accessibility statement | Link in footer to platform accessibility statement page |
| Feedback mechanism | Link or contact for users to report accessibility barriers |

---

## 8. Testing Protocol

| Test Type | Tool / Method |
|-----------|---------------|
| Automated | axe-core or WAVE scan on all page templates (CI integration) |
| Keyboard-only | Manual keyboard navigation of all critical flows |
| Screen reader | NVDA + Chrome (Windows), VoiceOver + Safari (macOS/iOS) |
| Color contrast | Colour Contrast Analyser tool on all color pairs |
| Zoom | 200% zoom; 400% zoom for mobile-equivalent reflow |
| High contrast mode | Windows High Contrast Mode compatibility check |
| Mobile accessibility | iOS VoiceOver + Safari on mobile (certification flow priority) |

---
