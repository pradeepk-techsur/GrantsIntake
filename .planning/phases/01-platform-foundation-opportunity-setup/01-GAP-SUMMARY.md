---
phase: 01-platform-foundation-opportunity-setup
plan: "GAP"
subsystem: database, ui
tags: [seed, programs, grantor, uswds, idempotent, gap-closure]

# Dependency graph
requires:
  - phase: 01-platform-foundation-opportunity-setup
    provides: grantor_organizations table, grantor_roles table, programs table schema, OpportunitiesIndex.tsx component
provides:
  - Idempotent program seed row in programs table (SELECT-then-INSERT pattern)
  - "No programs configured" warning alert with usa-alert__heading and data-testid
affects: [UAT Test 3–7, TemplateLibrary modal, useFirstProgramId hook]

key-files:
  created: []
  modified:
    - src/db/seed.ts
    - client/src/pages/grantor/OpportunitiesIndex.tsx

# Metrics
duration: 4min
completed: 2026-07-25
---

# Phase 1 GAP Plan: Programs Seed and No-Programs Warning — Summary

**Note: This plan's work was completed as part of plan 01-05 execution. The programs seed (SELECT-then-INSERT for 'General Grant Programs') and the no-programs warning alert upgrade were both implemented during plan 01-05. This summary closes the plan record.**

## What Was Done (via 01-05)

- Added SELECT-then-INSERT program seed for 'General Grant Programs' linked to seeded grantor org and admin user — `GET /api/v1/programs` returns ≥1 program after seed, enabling TemplateLibrary modal
- Upgraded the `!programId` warning alert in OpportunitiesIndex.tsx with `usa-alert__heading "No programs configured"`, actionable text, and `data-testid="no-programs-warning"`

## Verification

- `GET /api/v1/programs` returns 1 program (confirmed in 01-GATE.md wave-gap section)
- `seed.ts` contains SELECT-then-INSERT for 'General Grant Programs' (lines 59–76)
- `OpportunitiesIndex.tsx` contains 'No programs configured' heading and data-testid (confirmed in 01-05-SUMMARY.md)

## Self-Check: PASSED

All objectives of this gap plan were completed by plan 01-05.
