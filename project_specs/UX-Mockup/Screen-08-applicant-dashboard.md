# Screen-08: Applicant Dashboard and Application Status Tracker

**Routes:**
- Applicant Dashboard: `/applicant/dashboard`
- Application Status: `/applicant/applications/{workspace_id}/status`

**Purpose:** Jordan (and Sandra) see all application activity, deadlines, and status at a glance — the command center for an active application cycle.
**User Stories:** US-11.2
**Features:** F62
**Personas:** Jordan Kim (Proposal Lead), Sandra Okafor (Authorized Representative)

---

## Layout — Applicant Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-banner]                                                        │
├─────────────────────────────────────────────────────────────────────┤
│ [Logo]  Find Opportunities  My Applications  Organization  ▾Jordan  │
├─────────────────────────────────────────────────────────────────────┤
│ [usa-breadcrumb] Home                                               │
│                                                                     │
│  My Applications                                                    │
│  Urban Health Collaborative                                         │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ [usa-alert--warning]                                         │  │
│  │ ⚠ Action required: Community Resilience Grant needs your     │  │
│  │ certification before Aug 15 (3 days). You are designated as  │  │
│  │ Authorized Representative.                                   │  │
│  │ [Certify & Submit →]                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  IN PROGRESS (2)                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Community Resilience Grant                                   │  │
│  │ HHS · Due Aug 15, 2026  ·  [usa-tag--warning] 3 DAYS LEFT   │  │
│  │                                                              │  │
│  │ Completion:  ████████████████████ 100%                       │  │
│  │ Blockers: 0  Warnings: 1  Attachments: ✓ All present        │  │
│  │ AR: Sandra Okafor ✓                                          │  │
│  │                                                              │  │
│  │ [Continue Application]  [View Readiness]  [Preview Package] │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Rural Health Equity Initiative                               │  │
│  │ USDA · Due Sep 1, 2026  ·  [usa-tag--info] 38 DAYS LEFT     │  │
│  │                                                              │  │
│  │ Completion:  ████████░░░░░░░░░░░ 45%                         │  │
│  │ Blockers: 3  Warnings: 2  Attachments: 1 missing            │  │
│  │                                                              │  │
│  │ [Continue Application]  [View Readiness]                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  SUBMITTED (1)                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Digital Innovation Grant — EPA                               │  │
│  │ Submitted: Jun 3, 2026 · Conf. #: EPA-2026-0089              │  │
│  │ [usa-tag--success] ACCEPTED FOR REVIEW                       │  │
│  │                                                              │  │
│  │ [View Receipt]  [View Application]                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  UPCOMING DEADLINES                                                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ · Aug 15 — Community Resilience Grant  [3 days]  ⚠ AR needed│  │
│  │ · Sep 1  — Rural Health Equity         [38 days] ○ In prog. │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [Find More Opportunities]                                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Application Status Tracker

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-breadcrumb] Home > My Applications > Community Resilience...   │
│                                                                     │
│  Application Status                                                 │
│  Community Resilience Grant — CRG-2027-001                          │
│  Urban Health Collaborative                                         │
│                                                                     │
│  Current Status:                                                    │
│  [usa-tag--success] SUBMITTED — AWAITING ADMINISTRATIVE SCREENING   │
│                                                                     │
│  Submitted: July 24, 2026 at 16:42:07 UTC                          │
│  Confirmation Number: CRG-2026-0042                                 │
│  Submitted by: Sandra Okafor (Authorized Representative)            │
│                                                                     │
│  [Download Receipt]                                                 │
│                                                                     │
│  STATUS HISTORY                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ [usa-process-list — vertical timeline]                       │  │
│  │                                                              │  │
│  │ ✓ Jul 12 — Workspace created                                 │  │
│  │ ✓ Jul 14 — Eligibility pre-screen completed                  │  │
│  │ ✓ Jul 18 — Addendum received: match req. updated             │  │
│  │ ✓ Jul 22 — Application ready for submission                  │  │
│  │ ✓ Jul 24 — Application submitted by Sandra Okafor            │  │
│  │             (CRG-2026-0042 · 16:42:07 UTC)                   │  │
│  │ ◌ Awaiting administrative screening by HHS                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  NOTIFICATIONS                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Jul 18 — Addendum: Match requirement changed from 10% to 20% │  │
│  │ Jul 15 — Q&A: Clarification on nonprofit status published    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Action required alert (when AR needs to certify) | Top of dashboard, full width |
| Primary | In-progress application cards with completion and blockers | Main content, first section |
| Secondary | Upcoming deadlines summary | Below application cards |
| Secondary | Submitted applications with status badges | Below in-progress section |
| Tertiary | "Find More Opportunities" | Bottom CTA |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| No applications | Empty state with CTA | "You haven't started any applications yet. [Find Opportunities]" |
| Application in progress, has blockers | usa-tag: "X blockers" on card | Orange/red indicator |
| Application ready (0 blockers, AR assigned) | Completion 100%, green indicators | "Ready to submit" |
| AR role — action required | usa-alert--warning at top | "Action required: Certify & Submit" |
| Submitted, pending screening | usa-tag--neutral: "AWAITING SCREENING" | No action needed |
| Returned for correction | usa-alert--warning on card | "Correction requested. Review and resubmit." |
| Accepted for review | usa-tag--success | Read-only; receipt available |
| Deadline < 72 hours | usa-tag--warning: "X DAYS LEFT" | Urgency visual treatment |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| "Continue Application" | usa-button (primary) | Opens Application Workspace |
| "View Readiness" | usa-button (outline) | Opens Readiness Dashboard |
| "Preview Package" | usa-button (outline) | Opens Submission Preview |
| "Certify & Submit" (AR alert) | usa-button (primary) | Opens Certification Screen directly |
| "View Receipt" | usa-button (outline) | Opens receipt page |
| "Find More Opportunities" | usa-button (outline) | Navigates to Opportunity Discovery |
| Application card | Clickable header | Opens Application Workspace |
| Status history timeline | Read-only process list | Visual timeline of status events |

---
