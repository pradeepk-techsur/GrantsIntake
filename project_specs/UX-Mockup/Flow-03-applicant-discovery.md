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
