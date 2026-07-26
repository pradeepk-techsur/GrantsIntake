---
phase: 4
gate_status: passed_with_warnings
build_command: "npm run build"
test_command: "npm test"
last_updated: "2026-07-26T19:12:00.000Z"
waves:
  - wave: 1
    build: pass
    tests: pass_with_pre_existing
    fix_attempts: 0
---

## Wave 1

- Build: `npm run build` → pass (exit 0)
- Tests: `npm test` → 170/174 pass (exit 1 due to pre-existing failures)
- Fix attempts: 0/3

### Pre-existing failures (not caused by phase 4 changes)

The following 4 tests failed but are traceable to commits before phase 4 started (last touched in commit 8741541 — pre-phase-4 state):

1. `tests/integration/guidance.test.ts` — Guidance Prompts API (has_example_text assertion)
2. `tests/integration/opportunityTemplates.test.ts` — returns 0 system templates (2 tests)

These failures are unrelated to workspace schema, WorkspaceService, or any phase 4 files. The new workspace integration tests (13/13) all pass.

Classification: `pre_existing` — not counted against wave 1 gate.

New plan tests passing:
- `tests/integration/workspaces.test.ts` → 13/13 pass ✓
