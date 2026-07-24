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
