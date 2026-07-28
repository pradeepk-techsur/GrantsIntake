# Debug: Workspace Page Layout Broken

**Gap:** Test 3 — Workspace Page Section Sidebar Navigation  
**Status:** Root Cause Found

## Root Cause

`WorkspacePage.tsx` uses `grid-col-2 + grid-col-5 + grid-col-2 = 9` in its inner `grid-row`. In USWDS's flexbox grid system, column widths are **always fractions of 12** (percentages of parent's full width) — not fractions of the parent's column count. A total of 9 columns only fills **75% of parent width**, leaving 3 columns (25%) blank/empty on the right side.

Plan 04-08 introduced this regression by changing the correct `3+6+3=12` layout to `2+5+2=9` based on the false premise that inner columns should sum to match the parent's column count.

## Evidence

- `uswds.css`: `grid-col-2 = 16.67%`, `grid-col-5 = 41.67%` — percentages relative to parent's 100% width
- `04-08-PLAN.md` states: "USWDS grid: inner columns must sum to parent column width (2+5+2=9 inside desktop:grid-col-9)" — this premise is incorrect
- WorkspacePage.tsx lines 116/123/132 contain `grid-col-2`, `grid-col-5`, `grid-col-2`

## Files

- `client/src/pages/applicant/WorkspacePage.tsx` lines 116, 123, 132

## Fix

Restore `grid-col-3 + grid-col-6 + grid-col-3 = 12`.
