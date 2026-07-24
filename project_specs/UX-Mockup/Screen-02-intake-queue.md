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
