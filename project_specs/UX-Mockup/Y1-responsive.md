# Responsive Considerations

**Project:** GrantsIntake
**Design Standard:** USWDS (inherits responsive grid system)

USWDS's grid system uses a 12-column responsive layout with standard breakpoints:
- **Mobile:** < 480px
- **Mobile-lg:** 480px–640px
- **Tablet:** 640px–1024px
- **Desktop:** > 1024px

---

## General Principles

1. **Mobile-first** — All layouts designed for mobile first, then enhanced for tablet and desktop
2. **USWDS grid** — Use `usa-grid`, `usa-width-one-half`, `usa-width-full` classes for responsive column behavior
3. **Navigation collapse** — Top navigation collapses to hamburger menu on mobile
4. **Touch targets** — Minimum 44×44px touch targets for all interactive elements (WCAG 2.5.5)
5. **Sidebars collapse** — Left sidenav panels (Opportunity Builder, Application Workspace) collapse to top-of-page accordion on mobile

---

## Screen-by-Screen Breakpoints

### Grantor Dashboard

**Desktop (>1024px)**
- 4-column KPI tile row
- Full-width opportunities table with all columns visible
- Intake queue summary as horizontal stacked bar chart

**Tablet (640–1024px)**
- 2-column KPI tile row (2×2 grid)
- Opportunities table: hide "Started" column; show essential columns
- Intake queue summary: simplified

**Mobile (<640px)**
- KPI tiles: single column, stacked
- Opportunities table: card view — one card per opportunity with key info
- "Create New Opportunity" button: full width

---

### Opportunity Builder

**Desktop (>1024px)**
- Two-pane layout: left sidenav (fixed, 280px) + right content area
- Publication Readiness sidebar: visible within left sidenav
- Guidance panel: adjacent to text fields (right side of field)

**Tablet (640–1024px)**
- Left sidenav: collapsible (toggle button above content)
- Readiness checklist: moves to collapsible panel above content area
- Guidance panel: below field (stacked, not side-by-side)

**Mobile (<640px)**
- Sidenav: collapses to top accordion ("Setup Sections" with chevron)
- One section visible at a time
- Readiness checklist: accessible via "Check Readiness" button (modal on mobile)
- Eligibility rule list: card view per rule
- All form fields: full width

---

### Intake Queue Dashboard

**Desktop (>1024px)**
- Full table with all columns: org name, submitted, eligibility, amount, status, action
- Filters panel: horizontal filter bar above table
- Split-pane screening panel: applicant details left, screening checklist right

**Tablet (640–1024px)**
- Table: hide funding amount column; show essential columns
- Screening panel: stacked layout (applicant info top, checklist below)

**Mobile (<640px)**
- Queue: card view per application (key info only)
- Filters: collapsible filter panel
- Screening panel: full-screen view (single panel), scroll through sections
- Download/Export: simplified to primary format only

---

### Opportunity Discovery

**Desktop (>1024px)**
- Left filter panel (fixed, 280px) + right results grid (card grid, 2–3 columns)
- Results cards: standard card layout

**Tablet (640–1024px)**
- Filter panel: collapsible toggle above results
- Results: 2-column card grid

**Mobile (<640px)**
- Search bar: full width, prominent
- Filters: "Filter" button opens full-screen filter modal
- Active filter chips: horizontally scrollable row
- Results: single column card list
- Card: compact layout (title, funder, deadline, status badge, funding range)

---

### Published Opportunity Page

**Desktop (>1024px)**
- Two-column layout: main content (left, 70%) + key information sidebar (right, 30%)
- Q&A and addenda: full width below main content

**Tablet (640–1024px)**
- Key information sidebar: moves below main content (stacked layout)

**Mobile (<640px)**
- All content: single column, stacked
- Key dates and award amount: card format at top (above executive summary)
- "Start Application" / "Sign in to Apply" CTA: sticky bottom bar or near-top placement
- Q&A: accordion per question/answer pair

---

### Application Workspace

**Desktop (>1024px)**
- Three-panel layout: left sidenav (section navigator), center content, right readiness dashboard panel
- Internal notes: tab within center content area

**Tablet (640–1024px)**
- Left sidenav: collapsible
- Readiness Dashboard: accessible via "Check Readiness" button (slides in as overlay)
- Two-column: sidenav + content

**Mobile (<640px)**
- Sidenav: collapses to top accordion
- Readiness Dashboard: separate screen (button opens it)
- Budget table: horizontally scrollable or simplified to key columns
- One section at a time, full width
- Internal tasks: separate collapsible panel
- Internal notes: separate tab below section content

---

### Submission Certification and Receipt

**Desktop (>1024px)**
- Centered card layout (max-width 700px centered)
- Confirmation number: large display text

**Tablet / Mobile**
- Same layout, full width
- Sandra tested on mobile — certification and receipt MUST be fully usable on mobile
- "Download Receipt" button: prominent, large touch target
- Certification checkbox: large enough touch target (min 44px)
- Certification text: scrollable within the card if needed on small screens

---

## USWDS Grid Classes in Use

```
Desktop:     .grid-col-3   .grid-col-9
Tablet:      .tablet:grid-col-12 (full width for sidebar items)
Mobile:      .mobile:grid-col-12 (all elements full width)
```

---
