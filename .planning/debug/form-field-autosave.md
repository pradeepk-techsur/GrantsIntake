# Debug: Form Field Auto-Save No Visual Feedback + Layout Messy

**Gap:** Test 6 — Form Fields Narrative Section  
**Status:** Root Cause Found

## Root Cause 1 — No Auto-Save Visual Feedback

`SectionFormPanel.tsx`: `saveMutation.isPending` and `saveMutation.isSuccess` are never referenced in JSX. The save fires silently on blur with no spinner, "Saving...", or "Saved ✓" indicator. User perceives blur as doing nothing.

## Root Cause 2 — Layout Messy

`ApplicantLayout.tsx` line 85: `<main className="usa-layout-docs__main desktop:grid-col-9 usa-prose">` — has `usa-prose` class.

`WorkspaceSectionPanel.tsx` line 63: wraps all section content in another `<div className="usa-prose">`.

Double-nested `usa-prose` cascades USWDS max-width and typography overrides into the grid container, causing layout collision.

## Evidence

- `SectionFormPanel.tsx` — `saveMutation.isPending` and `.isSuccess` not used in JSX (grep confirms 0 occurrences)
- `ApplicantLayout.tsx:85` — `usa-prose` on `<main>` element
- `WorkspaceSectionPanel.tsx:63` — second `usa-prose` wrapper

## Fix

1. SectionFormPanel.tsx: add `{saveMutation.isPending && <span className="usa-hint">Saving…</span>}` and `{saveMutation.isSuccess && <span className="usa-hint">Saved ✓</span>}`
2. ApplicantLayout.tsx:85: remove `usa-prose` from `<main>` className
3. WorkspaceSectionPanel.tsx:63: remove `usa-prose` from the root div
