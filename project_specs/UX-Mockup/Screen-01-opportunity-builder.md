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
