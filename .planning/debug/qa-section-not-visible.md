---
status: diagnosed
trigger: "Q&A section not visible on opportunity detail page (Test 1, severity: major)"
created: 2026-07-31T00:00:00Z
updated: 2026-07-31T00:01:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED — The opportunity detail page returns a 404 for unauthenticated users when the user navigates from the list page, because seeded opportunities have `public_slug=null` and the OpportunityCard builds the link using `opportunity_id` (UUID). The backend endpoint DOES accept UUIDs, but only serves the page for `status='published'` opportunities. The real UAT user scenario is: user navigates to /opportunities list, clicks "View Details" → goes to `/opportunities/<UUID>` → the page LOADS. BUT the Q&A section is below a large amount of content (Overview, Eligibility, Required Documents, Updates & Addenda), and the user likely didn't scroll far enough to see it.

HOWEVER: there is a second deeper issue — the `publishedQAQuery` is keyed on `opportunity?.opportunity_id` and its `enabled` condition is `!!opportunity?.opportunity_id`. If the Q&A API call (`GET /api/v1/opportunities/:opportunityId/qa`) throws or the data never resolves, the section only renders the "Loading Q&A…" message, not the "No public questions" message. The section HEADER ("Questions & Answers") ALWAYS renders unconditionally. So the section IS present in the DOM.

ACTUAL ROOT CAUSE: The Q&A section renders unconditionally, so the DOM element always exists. The most likely reason the user "does not see the Q&A section" is that it appears far below the fold after Overview + Eligibility + Required Documents + Updates & Addenda sections, and there is NO anchor link, jump-to, or table of contents to draw the user's eye. A real user doing UAT may not have scrolled all the way to the bottom of a long page to find the Q&A section.

SECONDARY CAUSE: If the Q&A API call fails (e.g., returns non-ok status), the section shows only the `<h2>Questions & Answers</h2>` header with nothing below it (no error state rendered), making it appear broken or empty even though it technically "rendered."

test: Read code fully — confirmed
expecting: Section always renders, but visibility depends on scrolling and Q&A API success
next_action: Return diagnosis

## Symptoms

expected: Q&A section visible on opportunity detail page
actual: User does not see the Q&A section on opportunity detail page
errors: None reported
reproduction: Navigate to opportunity detail page as anonymous or authenticated user
started: Test 1 UAT gap, severity major

## Eliminated

- hypothesis: Q&A section is gated on opportunity status=published
  evidence: Lines 490-532 of OpportunityDetailPage.tsx — the entire section renders unconditionally when `opportunity` is loaded. No status check guards the section wrapper.
  timestamp: 2026-07-31T00:00:30Z

- hypothesis: Navigation takes user to wrong URL (404)
  evidence: OpportunityCard.tsx lines 57-59: `detailPath = opportunity.public_slug ? /opportunities/${public_slug} : /opportunities/${opportunity_id}`. Since public_slug=null on seeded opps, it uses the UUID. The backend (publicOpportunities.ts lines 75-93) explicitly handles UUIDs with a regex test and queries by opportunity_id. So the page loads successfully.
  timestamp: 2026-07-31T00:00:40Z

- hypothesis: Error boundary hiding content
  evidence: No ErrorBoundary component wraps OpportunityDetailPage in App.tsx (lines 52-53). The page has its own inline error/loading states (lines 188-211) but no wrapper that would hide the Q&A section specifically.
  timestamp: 2026-07-31T00:00:50Z

- hypothesis: Q&A section gated on accessToken
  evidence: The `<section data-testid="qa-section">` at line 491 renders unconditionally. Only the "Submit a Question" Link (line 522) is gated on `accessToken`. The heading and item list are always shown.
  timestamp: 2026-07-31T00:01:00Z

## Evidence

- timestamp: 2026-07-31T00:00:20Z
  checked: OpportunityDetailPage.tsx lines 490-532
  found: Q&A section renders unconditionally inside the main content column. publishedQAQuery is enabled when opportunity.opportunity_id exists. Section always shows <h2>Questions & Answers</h2>.
  implication: The section header is always in the DOM when the opportunity loads.

- timestamp: 2026-07-31T00:00:25Z
  checked: OpportunityDetailPage.tsx lines 493-496
  found: "No public questions have been answered yet." message renders when `publishedQAQuery.data && publishedQAQuery.data.length === 0`. If the API call errors (throws), `publishedQAQuery.data` is undefined and neither the loading nor the empty message is shown — only the heading renders with no body.
  implication: If Q&A API fails, section appears as just a heading with nothing below — easy to miss.

- timestamp: 2026-07-31T00:00:30Z
  checked: qaApi.ts line 15-17
  found: `listPublished` calls `GET /api/v1/opportunities/${opportunityId}/qa` with NO auth header. If this returns non-2xx, it throws and the query enters error state. No error UI is rendered in OpportunityDetailPage for the Q&A query error state.
  implication: Any Q&A API error silently leaves section with only the heading, no content.

- timestamp: 2026-07-31T00:00:40Z
  checked: OpportunityDetailPage.tsx page structure
  found: Q&A section is the LAST section in the main content column (desktop:grid-col-8), appearing AFTER: Overview (line 375), Eligibility (line 391), Required Documents (line 438, conditional), Updates & Addenda (line 485). The page has no table-of-contents or anchor navigation.
  implication: User must scroll past all prior content to reach Q&A. A real UAT user may not scroll that far.

- timestamp: 2026-07-31T00:00:50Z
  checked: src/routes/qa.ts line 25-36
  found: `GET /opportunities/:opportunityId/qa` is a public endpoint (no authenticate middleware). Returns `qaService.listPublished()`. No issues with auth.
  implication: API is correctly public. If seeded opportunities have no Q&A rows, response is `[]`, and the "No public questions" message should show.

- timestamp: 2026-07-31T00:00:55Z
  checked: e2e/qa.spec.ts Test 1 (line 38-62)
  found: Test navigates to /opportunities, clicks first link (which is in the card header or footer), waits 2s, then checks `[data-testid="qa-section"]` is visible. Test PASSED — but Playwright's `toBeVisible()` only checks that the element is in the DOM and not hidden by CSS display:none/visibility:hidden. It does NOT verify the element is in the viewport. The section is present but below the fold.
  implication: The e2e test passing does NOT prove the user can see the Q&A section without scrolling. This is a test coverage gap — the test doesn't verify the section is actually scrolled into view or that there's a visible navigation anchor.

- timestamp: 2026-07-31T00:01:00Z
  checked: OpportunityDetailPage.tsx line 491 data-testid attribute
  found: `data-testid="qa-section"` exists on the section element. Playwright `.toBeVisible()` will pass as long as the section is rendered and not CSS-hidden, regardless of scroll position.
  implication: Confirms the e2e test is a false positive for real user discoverability.

## Resolution

root_cause: |
  The Q&A section IS rendered in the DOM on the opportunity detail page (unconditionally when opportunity loads), 
  but it is the LAST section on a long page and there is no visible anchor, table-of-contents, or jump link 
  to guide users to it. A UAT user scrolling casually through the page will likely miss it.
  
  Secondary: if the publishedQAQuery errors (any non-2xx from /api/v1/opportunities/:id/qa), no error state 
  is rendered — only the bare <h2> heading shows, making the section appear broken/empty.
  
  The e2e test passes because Playwright's toBeVisible() only checks DOM presence/CSS visibility, not 
  viewport position — so the test does NOT validate that a real user can find the section.

fix: |
  1. Add an anchor/jump link ("Jump to Q&A") in the page header or sidebar so users can navigate directly 
     to the Q&A section without manual scrolling.
  2. OR move the Q&A section higher on the page (e.g., before "Updates & Addenda").
  3. Add an error state for publishedQAQuery.isError so users see "Unable to load Q&A" instead of a bare heading.
  4. Strengthen the e2e test to use scrollIntoView or verify the section is in the viewport.

verification:
files_changed: []
