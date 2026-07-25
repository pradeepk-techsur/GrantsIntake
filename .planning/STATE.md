---
pivota_spec_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 01-platform-foundation-opportunity-setup-01-02-PLAN.md
last_updated: "2026-07-25T02:23:50.826Z"
last_activity: "2026-07-25 — Plan 01-01 complete: Auth foundation (JWT + RBAC + PostgreSQL + Redis)"
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 4
  completed_plans: 2
  percent: 50
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-24)

**Core value:** Grantors receive better applications and applicants submit with less burden — by replacing fragmented, document-heavy intake with a structured, guided, data-driven workflow that enforces completeness, preserves auditability, and accelerates handoff from submission to review.
**Current focus:** Phase 1 — Platform Foundation & Opportunity Setup

## Current Position

Phase: 1 of 6 (Platform Foundation & Opportunity Setup)
Plan: 2 of 4 in current phase
Status: In Progress
Last activity: 2026-07-25 — Plan 01-02 complete: Opportunity schema + APIs + USWDS grantor portal shell

Progress: [█████░░░░░] 50%

## Performance Metrics

**Velocity:**

- Total plans completed: 2
- Average duration: 7.5 min
- Total execution time: 15 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 1: Platform Foundation | 2 of 4 | 15 min | 7.5 min |

**Recent Trend:**

- Last 5 plans: 7 min, 8 min
- Trend: stable

*Updated after each plan completion*

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 (Auth foundation) | 7 min | 2 | 22 |
| Phase 01-platform-foundation-opportunity-setup P02 | 8min | 2 tasks | 27 files |

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

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-07-25T02:23:50.824Z
Stopped at: Completed 01-platform-foundation-opportunity-setup-01-02-PLAN.md
Resume file: None
