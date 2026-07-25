---
phase: 01-platform-foundation-opportunity-setup
plan: GAP
type: execute
wave: 1
depends_on: []
files_modified:
  - src/db/seed.ts
  - client/src/pages/grantor/OpportunitiesIndex.tsx
autonomous: true
gap_closure: true

features:
  implements: ["PRD-INTAKE-002"]
  depends_on: []
  enables: []

must_haves:
  truths:
    - "Clicking 'Create New Opportunity' opens the template library modal"
    - "The 5 templates are visible and selectable in the modal"
    - "Selecting a template and clicking Create navigates to the Opportunity Builder"
    - "When no programs exist, the user sees a clear, visible warning explaining what to do"
  artifacts:
    - path: "src/db/seed.ts"
      provides: "Idempotent program seed linked to seeded grantor org and admin user"
      contains: "INSERT INTO programs"
    - path: "client/src/pages/grantor/OpportunitiesIndex.tsx"
      provides: "Visible 'no programs' warning alert with actionable guidance"
  key_links:
    - from: "src/db/seed.ts"
      to: "programs table"
      via: "INSERT INTO programs ... ON CONFLICT DO NOTHING"
      pattern: "INSERT INTO programs"
    - from: "client/src/pages/grantor/OpportunitiesIndex.tsx"
      to: "TemplateLibrary modal"
      via: "programId truthy → modal mounts"
      pattern: "showTemplateLibrary && programId"

integration_contracts:
  requires: []
  provides:
    - artifact: "src/db/seed.ts"
      exports: ["programs seed row"]
      shape: |
        programs row: { program_id: uuid, grantor_org_id: <seeded org>, program_name: 'General Grant Programs', program_area: 'General', is_federal: true, created_by: <admin user> }
      verify: "grep -n 'INSERT INTO programs' src/db/seed.ts && echo CONTRACT_OK"
    - artifact: "client/src/pages/grantor/OpportunitiesIndex.tsx"
      exports: ["OpportunitiesIndex"]
      shape: |
        Renders visible usa-alert--warning with heading 'No programs configured' when showTemplateLibrary && !programId
      verify: "grep -n 'No programs configured' client/src/pages/grantor/OpportunitiesIndex.tsx && echo CONTRACT_OK"
---

<objective>
Fix the "Create Opportunity button does nothing" gap from UAT Test 3.

Root cause: `seed.ts` inserts no rows into the `programs` table → `GET /api/v1/programs` returns `[]` → `useFirstProgramId()` returns `null` → `TemplateLibrary` modal is gated on `programId` being truthy and never mounts.

Fix 1 (required): Add an idempotent program seed to `src/db/seed.ts` so a program row exists after every boot, making `programId` non-null and the modal reachable.

Fix 2 (recommended): Make the `!programId` warning alert in `OpportunitiesIndex.tsx` visible and actionable — it currently renders but has no heading and blends with the generic "No opportunities yet" alert above it, so users cannot understand why the button does nothing.

Purpose: Unblock UAT Tests 3–7 (all downstream tests are skipped because the Opportunity Builder is unreachable).
Output: A working "Create Opportunity" flow from template selection to Opportunity Builder navigation.
</objective>

<feature_dependencies>
Implements: PRD-INTAKE-002: Grantor creates a new funding opportunity from a template library
Depends on: None (seed and UI fix are self-contained within Phase 1 artifacts)
Enables: None (gap closure — feature already specified in original plans)
</feature_dependencies>

<execution_context>
@/root/.config/opencode/pivota_spec-framework/workflows/execute-plan.md
@/root/.config/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-platform-foundation-opportunity-setup/01-02-SUMMARY.md
@.planning/phases/01-platform-foundation-opportunity-setup/01-03-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Seed a default program in src/db/seed.ts</name>
  <files>src/db/seed.ts</files>
  <action>
After the grantor_roles insert block (around line 56) and before the opportunity templates block, add an idempotent program seed.

The `programs` table DDL is:
```sql
CREATE TABLE programs (
    program_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grantor_org_id      UUID NOT NULL REFERENCES grantor_organizations(org_id),
    program_name        VARCHAR(250) NOT NULL,
    program_area        VARCHAR(100),
    is_federal          BOOLEAN NOT NULL DEFAULT FALSE,
    program_description TEXT,
    created_by          UUID NOT NULL REFERENCES users(user_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived_at         TIMESTAMPTZ
);
```

Insert the following (use `orgId` and `adminUserId` already resolved earlier in the seed function):

```sql
INSERT INTO programs
  (grantor_org_id, program_name, program_area, is_federal, program_description, created_by)
VALUES
  ($1, $2, $3, TRUE, $4, $5)
ON CONFLICT DO NOTHING
```

Parameters:
- $1 = orgId
- $2 = 'General Grant Programs'
- $3 = 'General'
- $4 = 'Default program for Example Federal Agency. Used for creating and managing funding opportunities.'
- $5 = adminUserId

Add a console.log after: `console.log('Seeded default program: General Grant Programs (idempotent)');`

**Why `ON CONFLICT DO NOTHING`:** The programs table has no unique constraint on program_name, so the natural idempotency approach is to check first. Use a SELECT-then-INSERT pattern identical to the grantor_organizations block already in the file: query `SELECT 1 FROM programs WHERE grantor_org_id = $1 AND program_name = $2` first; if no rows, run the INSERT.

Exact pattern to add after the `console.log('Grantor role assigned...')` line:

```typescript
// Seed default program (idempotent — check before insert)
const existingProgram = await pool.query(
  `SELECT 1 FROM programs WHERE grantor_org_id = $1 AND program_name = $2`,
  [orgId, 'General Grant Programs'],
);
if (existingProgram.rows.length === 0) {
  await pool.query(
    `INSERT INTO programs
       (grantor_org_id, program_name, program_area, is_federal, program_description, created_by)
     VALUES ($1, $2, $3, TRUE, $4, $5)`,
    [
      orgId,
      'General Grant Programs',
      'General',
      'Default program for Example Federal Agency. Used for creating and managing funding opportunities.',
      adminUserId,
    ],
  );
}
console.log('Seeded default program: General Grant Programs (idempotent)');
```
  </action>
  <verify>
Run the seed against the live database to confirm it inserts a program row:

```bash
docker compose exec app npx tsx src/db/seed.ts 2>&1 | grep -E "program|Seed complete"
```

Then confirm the row exists:
```bash
docker compose exec db psql -U postgres -d grantsintake -c "SELECT program_id, program_name, is_federal FROM programs LIMIT 5;"
```

Expected: at least one row with program_name = 'General Grant Programs' and is_federal = true.

Re-run seed a second time to confirm idempotency (no duplicate rows, no errors):
```bash
docker compose exec app npx tsx src/db/seed.ts 2>&1 | tail -5
docker compose exec db psql -U postgres -d grantsintake -c "SELECT COUNT(*) FROM programs WHERE program_name = 'General Grant Programs';"
```

Expected count: exactly 1 after both runs.
  </verify>
  <done>
- `src/db/seed.ts` contains `INSERT INTO programs` with the check-then-insert pattern
- Running `npx tsx src/db/seed.ts` twice produces exactly 1 row in the programs table with program_name = 'General Grant Programs'
- `GET /api/v1/programs` returns an array with at least one program (not `[]`)
- `useFirstProgramId()` in the browser returns a non-null UUID, enabling the TemplateLibrary modal to mount
  </done>
</task>

<task type="auto">
  <name>Task 2: Make the "no programs" warning visible and actionable in OpportunitiesIndex.tsx</name>
  <files>client/src/pages/grantor/OpportunitiesIndex.tsx</files>
  <action>
Update the `showTemplateLibrary && !programId` warning alert (lines 80–88) to:
1. Add a `usa-alert__heading` element so the alert is visually distinct and scannable
2. Provide actionable guidance — tell the user WHAT to do, not just what's wrong
3. Add a `data-testid` for Playwright testability

Replace the existing warning block:
```tsx
{showTemplateLibrary && !programId && (
  <div className="usa-alert usa-alert--warning" role="alert">
    <div className="usa-alert__body">
      <p className="usa-alert__text">
        You must create a program before creating an opportunity.
      </p>
    </div>
  </div>
)}
```

With:
```tsx
{showTemplateLibrary && !programId && (
  <div
    className="usa-alert usa-alert--warning"
    role="alert"
    data-testid="no-programs-warning"
  >
    <div className="usa-alert__body">
      <h4 className="usa-alert__heading">No programs configured</h4>
      <p className="usa-alert__text">
        Your organization has no programs set up yet. A program is required before
        you can create a funding opportunity. Please contact your system administrator
        to configure a program for your organization.
      </p>
    </div>
  </div>
)}
```

**Why:** The current alert has no heading — it visually blends with the generic "No opportunities yet" info alert above it. Users cannot understand why clicking Create Opportunity silently shows a second unlabeled alert. The heading and actionable text make the state legible.

No other logic changes — the modal gating on `programId` being truthy remains correct. After Task 1 seeds a program, this warning will never appear for a properly seeded instance. It remains as a defensive UI for edge cases where the database is empty (e.g. a fresh dev environment that skipped seed).
  </action>
  <verify>
TypeScript compilation check:
```bash
cd client && npx tsc --noEmit 2>&1 | grep -i "OpportunitiesIndex" || echo "No TS errors in OpportunitiesIndex"
```

Confirm the warning content exists in the file:
```bash
grep -n "No programs configured" client/src/pages/grantor/OpportunitiesIndex.tsx && echo "HEADING OK"
grep -n "no-programs-warning" client/src/pages/grantor/OpportunitiesIndex.tsx && echo "TESTID OK"
```
  </verify>
  <done>
- `client/src/pages/grantor/OpportunitiesIndex.tsx` contains `data-testid="no-programs-warning"` and heading `"No programs configured"`
- TypeScript compilation produces no errors in OpportunitiesIndex.tsx
- The actionable text explains what the user must do (contact admin to configure a program)
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| db→seed | Seed script runs with full DB credentials; inserts data that becomes trusted application state |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-GAP-01 | Tampering | `src/db/seed.ts` program insert | accept | Seed runs only in server-side Node.js context with DB credentials already available. No user-controlled input flows into the INSERT — all values are hardcoded string literals. Residual risk: a compromised container could modify seed.ts before boot; owned by deployment environment security, not application code. |
| T-GAP-02 | Information disclosure | `OpportunitiesIndex.tsx` no-programs warning | mitigate | Warning text reveals that "a program" must be configured — discloses internal model name but no credentials, user data, or enumerable IDs. Guard: warning only renders when `showTemplateLibrary && !programId` (authenticated grantor with canCreate role); unauthenticated users never reach this component. Mitigation in `client/src/pages/grantor/OpportunitiesIndex.tsx` canCreate role-gate (line 35, 58). |
</threat_model>

<verification>
Full end-to-end verification after both tasks complete:

```bash
# 1. Re-seed the database
docker compose exec app npx tsx src/db/seed.ts

# 2. Confirm programs row exists
docker compose exec db psql -U postgres -d grantsintake -c \
  "SELECT program_id, program_name, is_federal FROM programs WHERE program_name = 'General Grant Programs';"

# 3. Confirm API returns programs
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.gov","password":"TestPassword123!"}' \
  -c /tmp/cookies.txt | jq .access_token | head -c 20

ACCESS_TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.gov","password":"TestPassword123!"}' \
  -c /tmp/cookies.txt | jq -r .access_token)

curl -s http://localhost:3000/api/v1/programs \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq 'length'
# Expected: >= 1

# 4. Run Playwright e2e to confirm modal opens
npx playwright test e2e/ --reporter=list 2>&1 | tail -20
```
</verification>

<success_criteria>
- `GET /api/v1/programs` returns at least one program after `seed.ts` runs
- Clicking "Create New Opportunity" button in the browser opens the TemplateLibrary modal (not a silent no-op)
- The 5 templates are visible in the modal and selecting one + confirming navigates to the Opportunity Builder
- If no programs exist (edge case), the warning alert displays with heading "No programs configured" and actionable guidance
- Running `seed.ts` twice produces exactly 1 program row (idempotent)
- TypeScript compilation passes with no errors in modified files
</success_criteria>

<output>
After completion, create `.planning/phases/01-platform-foundation-opportunity-setup/01-GAP-SUMMARY.md`
</output>
