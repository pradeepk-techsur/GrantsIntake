---
status: diagnosed
trigger: "Grantor Q&A management is hard to discover + Publication readiness page shows misaligned content (Test 2, severity: major)"
created: 2026-07-31T00:00:00Z
updated: 2026-07-31T00:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED — Two independent root causes identified
test: Full file reads of OpportunityBuilder.tsx, QAManagementPage.tsx, CompletenessChecklist.tsx, GrantorSidebar.tsx, App.tsx
expecting: Find missing Q&A tab and "coming in future phases" items
next_action: DIAGNOSIS COMPLETE — return results

## Symptoms

expected: Grantor can easily find and navigate to Q&A management; Publication readiness shows accurate, relevant content
actual: No link from OpportunityBuilder to QAManagementPage; Q&A Inbox in sidebar redirects away; Publication readiness shows items labeled "Phase 2 — coming soon"
errors: None (navigation fails silently — there's just no entry point)
reproduction: Navigate to /grantor/opportunities/1b972a5c-40d9-4009-9e2a-d820f588a180 — no Q&A tab in the nav, sidebar Q&A Inbox redirects to /grantor/opportunities
started: Test 2 UAT gap, severity major

## Eliminated

(none — both hypotheses confirmed on first read)

## Evidence

- timestamp: 2026-07-31T00:01:00Z
  checked: OpportunityBuilder.tsx lines 14-22 (BuilderSection type) and lines 244-339 (tab nav)
  found: BuilderSection type has 8 values — 'metadata' | 'deadlines' | 'versions' | 'eligibility-rules' | 'prescreening' | 'conditional-sections' | 'attachments' | 'screening'. NO 'qa' entry. Tab nav renders exactly these 8 tabs with no Q&A tab.
  implication: Grantor has ZERO clickable path from /grantor/opportunities/:id to the Q&A management page

- timestamp: 2026-07-31T00:02:00Z
  checked: GrantorSidebar.tsx lines 78-89 (Q&A Inbox nav item)
  found: Sidebar shows "Q&A Inbox" link pointing to /grantor/qa-inbox
  implication: This APPEARS to be the Q&A entry point — but...

- timestamp: 2026-07-31T00:03:00Z
  checked: App.tsx line 77
  found: Route path="qa-inbox" element={<Navigate to="/grantor/opportunities" replace />}
  implication: The Q&A Inbox sidebar link immediately redirects back to /grantor/opportunities — it's a dead-end. The only valid Q&A management URL (/grantor/opportunities/:id/qa) has NO link pointing to it from anywhere in the UI.

- timestamp: 2026-07-31T00:04:00Z
  checked: QAManagementPage.tsx lines 77-82 (Back link)
  found: Page has a "← Back to Opportunity" link — meaning the QAManagementPage itself is functional but UNREACHABLE via UI navigation. Only accessible by typing the URL directly.
  implication: The page is fully implemented but stranded

- timestamp: 2026-07-31T00:05:00Z
  checked: CompletenessChecklist.tsx lines 84-102 (Phase 2 items in deriveChecklistItems)
  found: Two items hardcoded as incomplete with phaseNote 'Phase 2 — coming soon': id='eligibility_rules' label='Eligibility Rules' and id='form_sections' label='Form Sections'. Both always complete=false and shown greyed out with ○ symbol.
  implication: These items appear in the Publication Readiness sidebar for ALL opportunities, forever incomplete, creating confusion about why the opportunity can't be published

- timestamp: 2026-07-31T00:06:00Z
  checked: CompletenessChecklist.tsx lines 180-225 (render logic)
  found: Phase 2 items render with grey color (#919191) and ○ circle icon alongside the phaseNote text. They appear in the same checklist as real required items, making it look like there are unresolvable blockers.
  implication: User confusion: "many features are coming in future phases" — the sidebar explicitly tells them features are not ready

## Resolution

root_cause: |
  TWO root causes:

  1. Q&A DISCOVERABILITY: The QAManagementPage (/grantor/opportunities/:id/qa) has no navigation entry point.
     - OpportunityBuilder.tsx has 8 tabs (Metadata, Deadlines, Version History, Eligibility Rules, Pre-Screening, Conditional Sections, Attachments, Screening Criteria) — no Q&A tab
     - GrantorSidebar.tsx shows "Q&A Inbox" link → /grantor/qa-inbox, but App.tsx line 77 makes this a redirect to /grantor/opportunities (dead-end)
     - QAManagementPage is a fully-functional orphaned page reachable only by direct URL

  2. PUBLICATION READINESS MISALIGNMENT: CompletenessChecklist.tsx hardcodes two items as perpetually incomplete with "Phase 2 — coming soon" notes:
     - 'eligibility_rules' → "Eligibility Rules — Phase 2 — coming soon"
     - 'form_sections' → "Form Sections — Phase 2 — coming soon"
     These render alongside real required items in the Publication Readiness sidebar, making it appear the opportunity has permanent unfixable blockers.

fix: |
  1. Add a "Q&A" tab to OpportunityBuilder.tsx:
     - Add 'qa' to BuilderSection type
     - Add Q&A tab button in the nav
     - Navigate to /grantor/opportunities/:id/qa (Link component) OR render QAManagementPage inline

  2. Fix the "Q&A Inbox" sidebar redirect (App.tsx line 77) to point to something meaningful, or remove it

  3. Remove or hide the Phase 2 placeholder items from CompletenessChecklist.tsx:
     - Option A: Remove them entirely (they add no value if always incomplete)
     - Option B: Move them to a separate "Future Features" section below the main checklist to visually separate from actual readiness blockers

verification: N/A — diagnose-only mode
files_changed: []
