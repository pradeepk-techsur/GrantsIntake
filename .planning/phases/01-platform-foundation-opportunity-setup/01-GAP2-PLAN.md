---
phase: 01-platform-foundation-opportunity-setup
plan: GAP2
type: execute
wave: 1
depends_on: []
files_modified:
  - src/routes/opportunities.ts
  - client/src/pages/grantor/opportunities/TemplateLibrary.tsx
autonomous: true
gap_closure: true

features:
  implements: ["PRD-INTAKE-003"]
  depends_on: []
  enables: []

must_haves:
  truths:
    - "Selecting a template and clicking 'Create Opportunity' navigates to the Opportunity Builder"
    - "A validation error during creation is surfaced to the user, not silently swallowed"
  artifacts:
    - path: "src/routes/opportunities.ts"
      provides: "createOpportunitySchema with funding_amount_max optional"
      contains: "funding_amount_max: z.number().positive().optional()"
    - path: "client/src/pages/grantor/opportunities/TemplateLibrary.tsx"
      provides: "handleCreate without funding_amount_max in payload; catch block surfaces errors"
  key_links:
    - from: "client/src/pages/grantor/opportunities/TemplateLibrary.tsx"
      to: "POST /api/v1/programs/:id/opportunities"
      via: "createOpportunity.mutateAsync(payload)"
      pattern: "mutateAsync"
    - from: "src/routes/opportunities.ts"
      to: "createOpportunitySchema"
      via: "schema.parse(req.body)"
      pattern: "createOpportunitySchema\\.parse"

integration_contracts:
  requires: []
  provides:
    - artifact: "src/routes/opportunities.ts"
      exports: ["createOpportunitySchema"]
      shape: "funding_amount_max: z.number().positive().optional()"
      verify: "grep -n 'funding_amount_max.*optional' src/routes/opportunities.ts && echo CONTRACT_OK"
    - artifact: "client/src/pages/grantor/opportunities/TemplateLibrary.tsx"
      exports: ["TemplateLibrary"]
      shape: "no funding_amount_max in CreateOpportunityPayload; catch block sets error state"
      verify: "grep -n 'funding_amount_max' client/src/pages/grantor/opportunities/TemplateLibrary.tsx | grep -v 'funding_amount_max: 0' && echo CONTRACT_OK || (! grep -qn 'funding_amount_max' client/src/pages/grantor/opportunities/TemplateLibrary.tsx && echo CONTRACT_OK)"
---

<objective>
Fix the silent "Create Opportunity" failure in the TemplateLibrary modal that blocks the entire Opportunity Builder flow.

Purpose: The TemplateLibrary sends `funding_amount_max: 0` in the POST payload, but the API schema requires `z.number().positive()` (>0). The resulting VALIDATION_ERROR is caught by a bare `catch {}` block that swallows it silently — so the user clicks "Create Opportunity" and nothing happens. This closes UAT Test 3 gap and unblocks Tests 4–7 (all skipped due to this failure).

Output:
- `src/routes/opportunities.ts` — `funding_amount_max` made `.optional()` in `createOpportunitySchema` (consistent with `updateOpportunitySchema`; users fill it in the builder)
- `client/src/pages/grantor/opportunities/TemplateLibrary.tsx` — `funding_amount_max` removed from the create payload; `catch` block surfaces the error via a visible alert
</objective>

<feature_dependencies>
Implements: PRD-INTAKE-003: Grantor can create a new funding opportunity from a template library and proceed to the Opportunity Builder
Depends on: None
Enables: None (unblocks UAT Tests 4–7 which test the Opportunity Builder itself — already built in plan 01-03)
</feature_dependencies>

<execution_context>
@/root/.config/opencode/pivota_spec-framework/workflows/execute-plan.md
@/root/.config/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-platform-foundation-opportunity-setup/01-05-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Make funding_amount_max optional in createOpportunitySchema</name>
  <files>src/routes/opportunities.ts</files>
  <action>
In `src/routes/opportunities.ts`, find `createOpportunitySchema` (around line 17–40). Change the `funding_amount_max` field from required-positive to optional-positive, matching the pattern already used in `updateOpportunitySchema`:

**Before (line ~29):**
```typescript
funding_amount_max: z.number().positive({ message: 'funding_amount_max must be positive' }),
```

**After:**
```typescript
funding_amount_max: z.number().positive({ message: 'funding_amount_max must be positive' }).optional(),
```

This is the only change needed in this file. Do NOT change `updateOpportunitySchema` — it already has `.optional()`. Do NOT change any other field in `createOpportunitySchema`.

Rationale: `funding_amount_max` is a builder field filled after creation. Requiring it at create time blocks the template-selection→builder flow. The `updateOpportunitySchema` already correctly marks it optional.
  </action>
  <verify>
```bash
grep -n 'funding_amount_max' src/routes/opportunities.ts
# Expected: both occurrences (create + update schemas) show .optional()
```
Then run the API integration test to confirm POST accepts a payload without funding_amount_max:
```bash
cd /home/daytona/project && npm test -- --testPathPattern="opportunities" 2>&1 | tail -20
```
  </verify>
  <done>
`grep 'funding_amount_max' src/routes/opportunities.ts` shows `.optional()` on the `createOpportunitySchema` line. The opportunities test suite passes (or shows no new failures introduced by this change).
  </done>
</task>

<task type="auto">
  <name>Task 2: Remove funding_amount_max from TemplateLibrary payload and surface errors in catch</name>
  <files>client/src/pages/grantor/opportunities/TemplateLibrary.tsx</files>
  <action>
In `client/src/pages/grantor/opportunities/TemplateLibrary.tsx`, make two targeted changes to `handleCreate`:

**Change 1 — Remove `funding_amount_max` from the payload.**

Find the `payload` object in `handleCreate` (around line 68–80). Remove the `funding_amount_max: 0` line entirely:

**Before:**
```typescript
const payload: CreateOpportunityPayload = {
  template_id: selectedTemplateId,
  title: `New ${selected.template_name}`,
  funding_source: 'To be determined',
  announcement_type: 'Initial',
  opportunity_number: `DRAFT-${Date.now()}`,
  funding_amount_max: 0,
  eligibility_summary: 'To be completed.',
  executive_summary: 'To be completed.',
  contact_name: 'To be determined',
  contact_email: 'contact@example.gov',
  program_area: 'To be determined',
};
```

**After:**
```typescript
const payload: CreateOpportunityPayload = {
  template_id: selectedTemplateId,
  title: `New ${selected.template_name}`,
  funding_source: 'To be determined',
  announcement_type: 'Initial',
  opportunity_number: `DRAFT-${Date.now()}`,
  eligibility_summary: 'To be completed.',
  executive_summary: 'To be completed.',
  contact_name: 'To be determined',
  contact_email: 'contact@example.gov',
  program_area: 'To be determined',
};
```

**Change 2 — Surface errors in the catch block.**

Add an `createError` state variable at the top of the component (alongside the existing `showSelectionError` state):

```typescript
const [createError, setCreateError] = useState<string | null>(null);
```

Replace the bare `catch {}` block:

**Before:**
```typescript
    try {
      const opportunity = await createOpportunity.mutateAsync(payload);
      navigate(`/grantor/opportunities/${opportunity.opportunity_id}`);
    } catch {
      // Error handled by mutation
    }
```

**After:**
```typescript
    try {
      setCreateError(null);
      const opportunity = await createOpportunity.mutateAsync(payload);
      navigate(`/grantor/opportunities/${opportunity.opportunity_id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setCreateError(message);
    }
```

**Change 3 — Display the error alert in JSX.**

Inside `<div className="usa-modal__content">`, directly after the existing `{showSelectionError && ...}` block, add:

```tsx
          {createError && (
            <div
              className="usa-alert usa-alert--error usa-alert--slim"
              role="alert"
              data-testid="create-opportunity-error"
            >
              <div className="usa-alert__body">
                <p className="usa-alert__text">Could not create opportunity: {createError}</p>
              </div>
            </div>
          )}
```

**TypeScript note:** If `CreateOpportunityPayload` type definition in `useOpportunity` has `funding_amount_max` as required (non-optional), update the type to make it optional: `funding_amount_max?: number`. Check `client/src/hooks/useOpportunity.ts` and change the field type if needed. This keeps the type consistent with the now-optional API schema.
  </action>
  <verify>
```bash
# 1. Confirm funding_amount_max: 0 is gone from the payload
grep -n 'funding_amount_max' client/src/pages/grantor/opportunities/TemplateLibrary.tsx
# Expected: no output (field removed entirely from this file)

# 2. Confirm error state and alert are present
grep -n 'createError' client/src/pages/grantor/opportunities/TemplateLibrary.tsx
# Expected: useState declaration, setCreateError calls, JSX conditional

# 3. TypeScript compilation passes
cd /home/daytona/project/client && npx tsc --noEmit 2>&1 | head -20

# 4. Build completes without error
cd /home/daytona/project/client && npm run build 2>&1 | tail -10
```
  </verify>
  <done>
- `grep 'funding_amount_max' client/src/pages/grantor/opportunities/TemplateLibrary.tsx` returns no output
- `grep 'createError' client/src/pages/grantor/opportunities/TemplateLibrary.tsx` shows the state declaration and at least two usages (setter + JSX)
- `npx tsc --noEmit` exits 0
- `npm run build` exits 0
- Clicking "Create Opportunity" after selecting a template navigates to `/grantor/opportunities/:id` (the API now accepts the payload; navigation fires)
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→API | React client POSTs CreateOpportunityPayload into POST /api/v1/programs/:id/opportunities handler |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-GAP2-01 | Tampering | `createOpportunitySchema` in `src/routes/opportunities.ts` | mitigate | Making `funding_amount_max` optional does not weaken the positive-number constraint — it is still `z.number().positive()` when present. The guard is the Zod `.positive()` call on line ~29 of `opportunities.ts`; partial payloads without the field simply skip the constraint, which is the intended behaviour. |
| T-GAP2-02 | Information disclosure | `catch (err)` in `TemplateLibrary.tsx` → `createError` state → user-visible alert | accept | The error message shown to the user originates from the API's structured `{"error":"VALIDATION_ERROR","message":"..."}` response or a generic fallback. No stack traces, internal paths, or DB details are surfaced. Residual risk: the API error message itself could hint at internal field names (e.g. "funding_amount_max must be positive") — accepted because (a) this is a grantor-authenticated route, not public-facing, and (b) schema field names are not sensitive for authenticated grantors. |
| T-GAP2-03 | Elevation of privilege | POST /api/v1/programs/:id/opportunities | mitigate | No change to IDOR guards. The existing `getGrantorOrgIdForUser()` pattern (T-02-01 decision) remains in force: `grantor_org_id` is derived server-side from authenticated user's `grantor_roles`, never from the request body. Making `funding_amount_max` optional does not affect the org-ownership check path. |
</threat_model>

<verification>
After both tasks complete, verify end-to-end:

```bash
# 1. API accepts payload without funding_amount_max
PROGRAM_ID=$(psql "$DATABASE_URL" -t -c "SELECT program_id FROM programs LIMIT 1;" | tr -d ' ')
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.gov","password":"TestPassword123!"}' | jq -r .access_token)

curl -s -X POST "http://localhost:3000/api/v1/programs/$PROGRAM_ID/opportunities" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Test Opportunity",
    "funding_source": "Federal",
    "announcement_type": "Initial",
    "opportunity_number": "TEST-001",
    "eligibility_summary": "To be completed.",
    "executive_summary": "To be completed.",
    "contact_name": "Test User",
    "contact_email": "test@example.gov",
    "program_area": "Health"
  }' | jq '{status: .status, id: .opportunity_id}'
# Expected: {"status": "draft", "id": "<uuid>"}  — no VALIDATION_ERROR

# 2. TypeScript and build clean
cd /home/daytona/project/client && npx tsc --noEmit && npm run build 2>&1 | tail -5
# Expected: exits 0

# 3. No funding_amount_max: 0 in payload
grep -rn 'funding_amount_max: 0' client/src/
# Expected: no output
```
</verification>

<success_criteria>
- `POST /api/v1/programs/:id/opportunities` with a payload that omits `funding_amount_max` returns HTTP 201 with a draft opportunity object (not 400/422 VALIDATION_ERROR)
- `funding_amount_max: z.number().positive().optional()` appears in `createOpportunitySchema` in `src/routes/opportunities.ts`
- `funding_amount_max` does not appear in `TemplateLibrary.tsx`'s create payload
- A `createError` state drives a visible USWDS error alert in `TemplateLibrary.tsx` when `mutateAsync` throws
- TypeScript compilation exits 0 (`npx tsc --noEmit`)
- Client build exits 0 (`npm run build`)
- UAT Test 3 ("Selecting a template and clicking Create Opportunity navigates to the Opportunity Builder") can now pass
</success_criteria>

<output>
After completion, create `.planning/phases/01-platform-foundation-opportunity-setup/01-GAP2-SUMMARY.md` following the summary template.
</output>
