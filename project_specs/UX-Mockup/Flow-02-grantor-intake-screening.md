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
