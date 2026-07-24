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
