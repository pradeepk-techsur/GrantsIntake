---
phase: 01-platform-foundation-opportunity-setup
plan: "GAP2"
subsystem: api, ui
tags: [template-library, zod-schema, gap-closure, opportunity-creation]

# Dependency graph
requires:
  - phase: 01-platform-foundation-opportunity-setup
    provides: createOpportunitySchema, TemplateLibrary.tsx, programs seed
provides:
  - funding_amount_max optional in createOpportunitySchema
  - TemplateLibrary payload without funding_amount_max: 0
  - USWDS error alert in TemplateLibrary on create failure
affects: [UAT Test 3, UAT Tests 4–7 (transitively), Opportunity Builder navigation]

key-files:
  created: []
  modified:
    - src/routes/opportunities.ts
    - client/src/pages/grantor/opportunities/TemplateLibrary.tsx

# Metrics
duration: 2min
completed: 2026-07-25
---

# Phase 1 GAP2 Plan: TemplateLibrary Silent Create Fix — Summary

**Note: This plan's work was completed by plan 01-06 execution. The funding_amount_max schema fix and TemplateLibrary payload cleanup were implemented by 01-06. This summary closes the plan record.**

## What Was Done (via 01-06)

- Made `funding_amount_max` optional (`.optional()`) in `createOpportunitySchema` in `src/routes/opportunities.ts` — consistent with `updateOpportunitySchema`
- Removed `funding_amount_max: 0` from the TemplateLibrary create payload
- Added `createError` state and USWDS error alert to surface API errors instead of swallowing them in bare `catch {}`
- Updated `CreateOpportunityPayload` client type to `funding_amount_max?: number`

## Verification

- `grep 'funding_amount_max' src/routes/opportunities.ts` shows `.optional()` on both schema lines (confirmed)
- `grep 'funding_amount_max' client/src/pages/grantor/opportunities/TemplateLibrary.tsx` returns no output (confirmed)
- `grep 'createError' client/src/pages/grantor/opportunities/TemplateLibrary.tsx` shows useState + 3 usages (confirmed)

## Self-Check: PASSED

All objectives of this gap plan were completed by plan 01-06 (commits: 32dbffa, 6ffd4e9).
