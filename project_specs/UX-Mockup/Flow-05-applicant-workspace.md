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
