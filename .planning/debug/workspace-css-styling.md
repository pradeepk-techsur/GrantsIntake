# Debug: Workspace CSS/Styling Messy (Budget + Attachments)

**Gap:** Tests 7 and 9 — Budget Builder and Attachments CSS  
**Status:** Root Cause Found

## Root Cause

THREE compounding issues:

**PRIMARY — Width starvation:** WorkspacePage `grid-col-5` gives Budget/Attachments content only (5/12) × (9/12) = 31% of page width. Multi-column tables (Budget: 6 cols, Attachments: 5 cols) are crammed into 31% — severely compressed.

**SECONDARY — Double usa-prose nesting:** ApplicantLayout `<main>` has `usa-prose`. WorkspaceSectionPanel wraps all content in another `usa-prose`. Double-nesting cascades USWDS max-width and typography constraints through tables and accordions.

**TERTIARY — Missing `desktop:` prefix:** Inner grid columns in WorkspacePage lack the `desktop:` prefix, applying narrow fixed-fraction widths at ALL viewport sizes.

## Evidence

- USWDS CSS correctly loaded (main.tsx:3 confirmed)
- ApplicantLayout.tsx:83-87 — `<main className="...usa-prose">` — `usa-prose` class #1
- WorkspacePage.tsx:115-135 — `grid-col-2 + grid-col-5 + grid-col-2` without `desktop:` prefix
- WorkspaceSectionPanel.tsx:63 — `<div className="usa-prose">` — `usa-prose` class #2
- BudgetBuilder has 6-column tables in 31% width
- AttachmentManager has 5-column tables in 31% width

## Fix

1. WorkspacePage.tsx: widen content column (e.g. `desktop:grid-col-7` or `desktop:grid-col-8`) and add `desktop:` prefix to all inner cols
2. WorkspaceSectionPanel.tsx:63: remove `usa-prose` to eliminate double-nesting
3. ApplicantLayout.tsx: consider removing `usa-prose` from `<main>` (coordinate with form-field-autosave fix)
