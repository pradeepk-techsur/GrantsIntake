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
