# Debug: Login Redirects to Profile + Layout Broken

**Gap:** Test 5 — Readiness Dashboard 3-Column Layout; Login redirect  
**Status:** Root Cause Found

## Root Cause 1 — Login redirects to Profile

`LoginPage.tsx` line 26: `navigate(isGrantorAdmin ? '/grantor/dashboard' : '/applicant/profile', { replace: true })`
The non-grantor branch hardcodes `/applicant/profile` instead of `/applicant/applications`.

`App.tsx` line 52: `<Route index element={<Navigate to="/applicant/profile" replace />} />` — the `/applicant` index route also redirects to profile.

## Root Cause 2 — Workspace 3-column layout broken

WorkspacePage.tsx lines 116/123/132: `grid-col-2 + grid-col-5 + grid-col-2 = 9`. USWDS columns are always out of 12. These columns only fill 75% of the main area.

## Evidence

- `LoginPage.tsx:26` — '/applicant/profile' hardcoded for all applicants
- `App.tsx:52` — Index route sends to profile
- `WorkspacePage.tsx:116/123/132` — grid-col-2+5+2=9, not 12

## Fix

1. LoginPage.tsx line 26: change `'/applicant/profile'` → `'/applicant/applications'`
2. App.tsx line 52: change `<Navigate to="/applicant/profile"` → `<Navigate to="/applicant/applications"`
3. WorkspacePage.tsx: change grid columns to sum to 12 (e.g. grid-col-2 + grid-col-8 + grid-col-2)
