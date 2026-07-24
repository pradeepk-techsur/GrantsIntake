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
