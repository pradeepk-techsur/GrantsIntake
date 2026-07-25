---
pivota_spec_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 01-platform-foundation-opportunity-setup-01-04-PLAN.md
last_updated: "2026-07-25T02:51:51.710Z"
last_activity: "2026-07-25 — Plan 01-03 complete: Opportunities schema, OpportunityService, API endpoints, Opportunity Builder React UI"
progress:
  total_phases: 6
  completed_phases: 1
  total_plans: 4
  completed_plans: 4
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-24)

**Core value:** Grantors receive better applications and applicants submit with less burden — by replacing fragmented, document-heavy intake with a structured, guided, data-driven workflow that enforces completeness, preserves auditability, and accelerates handoff from submission to review.
**Current focus:** Phase 1 — Platform Foundation & Opportunity Setup (COMPLETE)

## Current Position

Phase: 1 of 6 (Platform Foundation & Opportunity Setup) — COMPLETE
Plan: 4 of 4 in current phase — All plans complete
Status: Phase 1 Complete
Last activity: 2026-07-25 — Plan 01-04 complete: Deadlines, Completeness Validation, and Opportunity Versioning

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 4
- Average duration: 8.5 min
- Total execution time: 34 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 1: Platform Foundation | 4 of 4 | 34 min | 8.5 min |

**Recent Trend:**

- Last 5 plans: 7 min, 8 min, 10 min, 9 min
- Trend: stable

*Updated after each plan completion*

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 (Auth foundation) | 7 min | 2 | 22 |
| Phase 01-platform-foundation-opportunity-setup P02 | 8min | 2 tasks | 27 files |
| Phase 01-platform-foundation-opportunity-setup P03 | 10 min | 2 tasks | 20 files |
| Phase 01-platform-foundation-opportunity-setup P04 | 9min | 2 tasks | 14 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Layered monolith architecture — Auth Service → Opportunity Service → Organization Service → Application Service → Submission Service → Analytics & Notification Service
- [Roadmap]: Phase 1 includes US-1.0 (grantor portal shell + RBAC) as foundation prerequisite before any domain features
- [Roadmap]: Grantor-side configuration (Phases 1–2) precedes applicant-side features (Phases 3–4) because eligibility rules and form configs must exist before applicants can pre-screen or apply
- [Phase 01-platform-foundation-opportunity-setup]: jose 5 over jsonwebtoken for JWT (ESM-native, Edge-compatible)
- [Phase 01-platform-foundation-opportunity-setup]: Redis refresh token storage: refresh:{userId}:{jti} keys with TTL for fast invalidation
- [Phase 01-platform-foundation-opportunity-setup]: audit_events immutability enforced via PostgreSQL trigger (not application layer)
- [Phase 01-platform-foundation-opportunity-setup]: USWDS CSS imported via vite alias — Vite 8 rolldown exports map does not expose CSS under browser/import conditions
- [Phase 01-platform-foundation-opportunity-setup]: Access token in Zustand memory only (not localStorage) — XSS mitigation per T-02-04; refresh token in httpOnly cookie from server
- [Phase 01-platform-foundation-opportunity-setup]: getGrantorOrgIdForUser() pattern: grantor_org_id derived at runtime from grantor_roles WHERE user_id (never from request body) — T-02-01 IDOR mitigation
- [Phase 01-platform-foundation-opportunity-setup]: audit_events entity_type/entity_id column names (not resource_type/resource_id)
- [Phase 01-platform-foundation-opportunity-setup]: Two-step IDOR guard: EXISTS check (404) then org check (403) to prevent org enumeration
- [Phase 01-platform-foundation-opportunity-setup]: Test cleanup for immutable tables: ALTER TABLE DISABLE/ENABLE TRIGGER in afterAll — immutability trigger fires even during test cleanup
- [Phase 01-platform-foundation-opportunity-setup]: Dry run pattern: POST /publish?dry_run=true returns completeness result without state change (used by Check Readiness button)
- [Phase 01-platform-foundation-opportunity-setup]: Client-side completeness derived from opportunity prop for real-time checklist feedback; server is authoritative at actual publish

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-07-25T02:51:51.709Z
Stopped at: Completed 01-platform-foundation-opportunity-setup-01-04-PLAN.md
Resume file: None
