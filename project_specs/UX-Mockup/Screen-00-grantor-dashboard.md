# Screen-00: Grantor Dashboard

**Route:** `/grantor/dashboard`
**Purpose:** Central hub for grantors to monitor opportunities, intake queue activity, and navigate to all grantor functions.
**User Stories:** US-11.1
**Features:** F61
**Personas:** Marcus Webb (Program Officer), Diana Reyes (Intake Administrator)

---

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-banner] Official website of the United States government       │
├─────────────────────────────────────────────────────────────────────┤
│ [GrantsIntake Logo]  Dashboard  Opportunities  Intake Queue  ▾User │
├─────────────────────────────────────────────────────────────────────┤
│ [usa-breadcrumb] Home                                               │
│                                                                     │
│  Welcome back, Marcus Webb                                          │
│  Program Officer · Community Resilience Program                     │
│                                                                     │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ FILTERS  [Opportunity ▾] [Program ▾] [Date Range ▾] [Apply] │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────┐  │
│ │  PUBLISHED   │ │    ACTIVE    │ │  SUBMITTED   │ │ PENDING   │  │
│ │ Opportunities│ │ Applications │ │ Applications │ │ SCREENING │  │
│ │      12      │ │     247      │ │     178      │ │    43     │  │
│ └──────────────┘ └──────────────┘ └──────────────┘ └───────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  MY OPPORTUNITIES                              [+ New Opp.]  │  │
│  │──────────────────────────────────────────────────────────────│  │
│  │  Title                  Status    Started  Submitted  Close  │  │
│  │  Community Resilience   OPEN      47       31         Aug 15 │  │
│  │  Rural Health Equity    OPEN      28       14         Sep 1  │  │
│  │  Digital Access 2027    DRAFT     —        —          —      │  │
│  │  [usa-tag: DRAFT]                                            │  │
│  │  [usa-pagination]                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  INTAKE QUEUE SUMMARY                   [Go to Intake Queue]  │  │
│  │──────────────────────────────────────────────────────────────│  │
│  │  Accepted for Review    ████████████  112  (63%)             │  │
│  │  Returned for Correction ███           22   (12%)            │  │
│  │  Pending Screening       ████          43   (24%)            │  │
│  │  Other                   █              1    (1%)            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  RECENT ACTIVITY                                              │  │
│  │  · Community Resilience: 3 new submissions (2 hours ago)     │  │
│  │  · Rural Health Equity: Addendum published (yesterday)       │  │
│  │  · Digital Access 2027: Draft updated (today 10:22 AM)       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Summary KPI tiles (published, active, submitted, pending) | Top of main content, full width |
| Primary | My Opportunities table with status, counts, deadlines | Main content area |
| Secondary | Intake Queue summary by disposition | Below opportunities table |
| Tertiary | Recent activity feed | Bottom of main content |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Full dashboard with real-time data | All KPI tiles populated |
| No opportunities | Empty state below KPI tiles | "You haven't created any opportunities yet. [Create New Opportunity]" |
| Filters applied | Filter chips shown below filter bar; tables update | Results filtered |
| Loading | Skeleton loaders in KPI tiles and table rows | USWDS loading indicator |
| New submissions (unread) | Badge count on "Intake Queue" nav item | Numeric count badge (e.g., "3") |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| "Create New Opportunity" | usa-button (primary) | Opens Template Library Modal |
| Opportunity row | Clickable table row | Navigates to Opportunity Builder for that opportunity |
| "Go to Intake Queue" | usa-button (outline) | Navigates to Intake Queue Dashboard |
| Filter dropdowns | usa-select | Updates table data in real time |
| KPI tiles | Informational cards | Clicking "Pending Screening" navigates to Intake Queue filtered |
| Top nav: Opportunities | Link | Dropdown: My Opportunities / All Opportunities / Templates |
| Top nav: Intake Queue | Link | Navigates to Intake Queue Dashboard |

---
