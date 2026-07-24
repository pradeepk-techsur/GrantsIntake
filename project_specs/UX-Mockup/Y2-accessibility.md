# Accessibility Notes

**Project:** GrantsIntake
**Standard:** Section 508 / WCAG 2.1 AA
**Design System:** USWDS (inherits built-in accessibility patterns)

All applicant-facing interfaces must comply with WCAG 2.1 Level AA. USWDS components provide a strong accessibility baseline; this section documents platform-specific requirements and implementation notes.

---

## 1. Color and Contrast

| Requirement | Specification |
|-------------|---------------|
| Normal text | Minimum 4.5:1 contrast ratio (WCAG 1.4.3) |
| Large text (≥18pt or 14pt bold) | Minimum 3:1 contrast ratio |
| UI components and graphical objects | Minimum 3:1 contrast against adjacent colors (WCAG 1.4.11) |
| Status badges | Must not convey state by color alone (see icon/text requirements below) |
| Error states | Red border + error icon + text message (not red border alone) |
| Success states | Green color + ✓ icon + text (not color alone) |
| Warning states | Yellow color + ⚠ icon + text (not color alone) |

**USWDS color tokens ensure AA compliance by default.** Do not override USWDS color tokens with custom colors unless verified with a contrast checker.

**Eligibility result states (F25):**
- Eligible: `usa-alert--success` (green background, dark text, ✓ icon)
- Needs Attention: `usa-alert--warning` (yellow background, dark text, ⚠ icon)
- Ineligible: `usa-alert--error` (red background, dark text, ✗ icon)
- Must not communicate eligibility state by color alone — icon and text are required

---

## 2. Keyboard Navigation

| Requirement | Implementation |
|-------------|----------------|
| All interactive elements focusable | USWDS components use native HTML elements (button, input, select, a) — inherently focusable |
| Logical tab order | DOM order must match visual order; avoid CSS-only reordering that disrupts tab sequence |
| Focus indicator | USWDS provides visible focus rings on all interactive elements; do not suppress with `outline: none` |
| Modal dialogs | When modal opens: trap focus within modal; on close, return focus to trigger element |
| Sidebars / drawers | When sidenav closes on mobile, return focus to toggle button |
| Skip navigation | `usa-skipnav` component required on all pages — "Skip to main content" link |
| Keyboard-only form completion | All form fields, dropdowns, checkboxes, and file inputs must be fully operable by keyboard |
| Submission flow | Entire eligibility pre-screen, certification, and submission flow must be completable without a mouse |

**Critical flows to keyboard-test:**
1. Eligibility questionnaire: multi-step form with Next/Back navigation
2. Certification screen: checkbox + submit button sequence
3. Intake queue: table navigation and disposition dropdown
4. Modal dialogs: publish confirmation, submit confirmation, correction request

---

## 3. Screen Reader Considerations

| Requirement | Implementation |
|-------------|----------------|
| `<html lang="en">` | Required on all pages |
| Page titles | Descriptive, unique per page; format: "[Screen Name] — GrantsIntake" |
| Heading hierarchy | H1: page title; H2: major sections; H3: subsections; no skipped levels |
| Form labels | Every input must have an associated `<label>` with matching `for`/`id`; no label-less inputs |
| Required fields | `aria-required="true"` on required inputs; "Required" text in label |
| Error messages | `aria-describedby` linking input to its error message; `aria-invalid="true"` on invalid inputs |
| Alert regions | `usa-alert` components use `role="alert"` for errors/warnings; announced immediately by screen readers |
| Status messages | `role="status"` on auto-save indicator, upload progress messages |
| Live regions | Readiness Dashboard updates announced with `aria-live="polite"` (non-disruptive updates) |
| Tables | All `<table>` elements have `<caption>` and proper `<th scope="col/row">` headers |
| Icons | Decorative icons: `aria-hidden="true"`; informative icons: accompanied by visible text or `aria-label` |
| Progress indicators | `aria-valuenow`, `aria-valuemin`, `aria-valuemax` on all progress bars |
| Modal dialogs | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to modal heading |
| Status badges | `usa-tag` text must be readable in isolation — not "OPEN" as background image |

**Screen-reader testing required for:**
- Eligibility pre-screen: step indicator announces current step; question text read on focus
- Readiness Dashboard: blocking error count announced as live region update
- Budget table: row/column headers for all data cells
- File upload: upload progress and success/failure announced
- Submission receipt: confirmation number is plain text (not image)

---

## 4. ARIA Labels and Roles

| Component | ARIA Requirement |
|-----------|------------------|
| Main navigation | `role="navigation"` with `aria-label="Main navigation"` |
| Breadcrumb | `role="navigation"` with `aria-label="Breadcrumb"` |
| Search form | `role="search"` |
| Filter panel | `aria-label="Filter opportunities"` |
| Readiness checklist | List items with descriptive text; error items include `aria-label` with full context |
| Step indicator | `aria-current="step"` on current step; each step announced as "Step X of Y: [name]" |
| Section navigator | `role="navigation"` with `aria-label="Application sections"` |
| Status tags (dynamic) | `aria-label` if tag color is meaningful (e.g., `aria-label="Status: Open"`) |
| Collapsible guidance | `aria-expanded="true/false"` on trigger; `aria-controls` pointing to panel |
| Internal notes tab | `role="tab"` / `role="tabpanel"` / `role="tablist"` for tab interface |
| Character counter | `aria-live="polite"` region announcing "X characters remaining" on blur |
| Disposition dropdown | `aria-label="Select disposition for [applicant name]"` |

---

## 5. Forms and Inputs

- **Required field pattern:** Visible asterisk (*) + `aria-required="true"` + legend: "All fields marked with an asterisk (*) are required"
- **Error summary:** When form submission fails, display `usa-alert--error` at top of form with links to each error field; focus moved to the alert on appearance
- **Inline error:** `usa-form-error-message` appears immediately below the relevant field with `id` linked via `aria-describedby`
- **Date inputs:** Use USWDS `usa-date-picker` or separate MM/DD/YYYY fields with clear labels; avoid date pickers requiring mouse-only interaction
- **File upload:** `usa-file-input` includes drag-and-drop zone with keyboard alternative (standard file input button)
- **Budget repeating rows:** When a new row is added, announce to screen reader: "New budget line item added"
- **Picklist / dropdown:** Native `<select>` preferred over custom dropdown components for maximum screen-reader compatibility

---

## 6. Plain Language (Accessibility for Cognitive Access)

Following USWDS plain language standards and the Simpler.Grants.gov direction:

- Use active voice throughout: "You must complete this field" not "This field must be completed"
- Error messages: state what happened + what to do: "Contact email is invalid. Enter a valid email address (example: name@agency.gov)"
- Labels: describe the field, not the format (e.g., "Application close date" not "Date_close_field")
- Help text: placed below the label and before the input field (USWDS pattern)
- Guidance prompts: written at 8th grade reading level or lower
- Eligibility result explanations: plain language, never rule codes or technical identifiers
- Certification language: plain language, specific, legally unambiguous

---

## 7. Government Requirements

| Requirement | Implementation |
|-------------|----------------|
| `usa-banner` | Required on all pages (Official US government website banner) |
| Skip navigation | `usa-skipnav` required on all pages |
| Print-friendly | Opportunity detail pages and submission preview printable without navigation elements |
| PDF receipts | Generated PDFs must be tagged (accessible PDFs); confirm with PDF generation library |
| Government accessibility statement | Link in footer to platform accessibility statement page |
| Feedback mechanism | Link or contact for users to report accessibility barriers |

---

## 8. Testing Protocol

| Test Type | Tool / Method |
|-----------|---------------|
| Automated | axe-core or WAVE scan on all page templates (CI integration) |
| Keyboard-only | Manual keyboard navigation of all critical flows |
| Screen reader | NVDA + Chrome (Windows), VoiceOver + Safari (macOS/iOS) |
| Color contrast | Colour Contrast Analyser tool on all color pairs |
| Zoom | 200% zoom; 400% zoom for mobile-equivalent reflow |
| High contrast mode | Windows High Contrast Mode compatibility check |
| Mobile accessibility | iOS VoiceOver + Safari on mobile (certification flow priority) |

---
