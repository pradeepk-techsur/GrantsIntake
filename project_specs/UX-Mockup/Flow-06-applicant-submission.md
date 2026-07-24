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
