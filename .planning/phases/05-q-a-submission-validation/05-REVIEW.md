---
phase: 5
status: issues_found
blockers: 0
warnings: 2
files_reviewed: 5
files_reviewed_list:
  - client/src/pages/applicant/OpportunityDetailPage.tsx
  - client/src/pages/grantor/opportunities/OpportunityBuilder.tsx
  - client/src/pages/grantor/opportunities/CompletenessChecklist.tsx
  - client/src/pages/applicant/WorkspacePage.tsx
  - src/db/seed.ts
reviewed_at: 2026-07-31T05:09:03Z
iteration: 1
---

# Phase 5 Code Review (Gap-Closure Plans 05-04 and 05-05)

## BLOCKERs

_None._

---

## WARNINGs

### W1: Seed `validation_config` uses `max_length` but both server and client validate/render against `max_chars` — character limits are silently ignored for all 5 new sections

- **File:** `src/db/seed.ts` lines 574, 583, 594, 605, 614, 625, 645 (all new SECTION_FIELDS entries)
- **Category:** bug
- **Evidence:**

  `FormFieldRenderer.tsx` reads `vc.max_chars` for the `maxLength` HTML attribute and the character counter:
  ```tsx
  // FormFieldRenderer.tsx:126, 142, 149
  maxLength={vc.max_chars}
  {vc.max_chars && ( <span>…/{vc.max_chars} characters</span> )}
  ```

  `formFieldService.ts` validates against `vc.max_chars`:
  ```ts
  // formFieldService.ts:120
  if (vc.max_chars && value.length > vc.max_chars) { /* blocking error */ }
  ```

  `ValidationConfig` type (`src/types/formField.ts:7-8`) declares **both** `max_length?: number` and `max_chars?: number` as optional — so TypeScript accepts either key without error, but only `max_chars` is checked at runtime.

  Every new field in the SECTION_FIELDS block stores `{ max_length: N }`:
  ```ts
  // seed.ts:574
  validation_config: { max_length: 200 },   // org_profile — Legal Org Name
  // seed.ts:583
  validation_config: { max_length: 20 },    // org_profile — EIN
  // seed.ts:594
  validation_config: { max_length: 2000 },  // eligibility
  // seed.ts:605, 614
  validation_config: { max_length: 3000 },  // workplan (Timeline)
  validation_config: { max_length: 1000 },  // workplan (Key Personnel)
  // seed.ts:625
  validation_config: { max_length: 2000 },  // performance_measures (Outcome Measures)
  // seed.ts:645
  validation_config: { max_length: 500 },   // review_submit (Cert Statement)
  ```

  At runtime `vc.max_chars` is `undefined` for all these fields, so:
  1. The `maxLength` HTML attribute is omitted — browser does not enforce length limits
  2. The character counter below textareas is never rendered
  3. Server-side blocking validation for over-length text is skipped

  **Note:** This same bug is present in the pre-existing narrative fields (lines 505, 514) added before the gap-closure plans. Those are out of scope for this review. The new SECTION_FIELDS block replicates the same incorrect key for 7 additional fields — these are in scope.

- **Fix direction:** Replace `max_length` with `max_chars` in every `validation_config` object within the SECTION_FIELDS block (lines 574–645). The `max_length` key in `ValidationConfig` is dead code; remove it from the type definition as a follow-up.

---

### W2: `useIsAuthorizedRep` has a stale-read window on first `WorkspacePage` mount — CertificationPanel may not appear immediately

- **File:** `client/src/pages/applicant/WorkspacePage.tsx` lines 55–59
- **Category:** bug
- **Evidence:**

  The render order on a cold-cache page load:
  1. Component renders → `useIsAuthorizedRep()` is called → reads `localStorage.getItem('applicant_org_id')` → returns `null` (not set yet) → `enabled: false` for the org-roles query → `isAuthorizedRep = false`
  2. `workspaceQuery` resolves → React re-renders → useEffect fires → `localStorage.setItem('applicant_org_id', orgId)` is called
  3. **Same re-render** (or the one triggered by the effect): `useIsAuthorizedRep()` reads the now-set `orgId` → org-roles query becomes enabled with `queryKey: ['org-roles', '<uuid>']` → fires
  4. Org-roles query resolves → another re-render → `isAuthorizedRep` becomes `true` → `CertificationPanel` renders

  This sequence is **functionally correct** — it will eventually show `CertificationPanel` — because React's effect flush + re-render cycle will pick up the new `orgId`. However, the user experiences a visible delay where the certifications section appears without the panel, then the panel pops in after the org-roles network call completes.

  **Severity assessment:** This is "degraded rather than broken" — the panel does appear but only after a second network round-trip. The UAT gap described in the plan ("AR user sees CertificationPanel without ever visiting OrgProfilePage") is resolved, but with a flash of absent panel. On the happy path (warm cache / user has visited before), the value is already in localStorage and there's no flash.

  There is no race condition that could cause a persistent failure (e.g., `workspaceQuery.data` is not undefined when the effect runs, so the guard `if (workspaceQuery.data?.org_id)` is always satisfied when the effect fires).

- **Fix direction:** This is acceptable given the UAT constraints (pre-seeded org scenario). If the flash is unacceptable, the fix is to also set `localStorage.applicant_org_id` from the `Workspace.org_id` returned by the API client before the query result reaches the component — or to add the query key `['org-roles', orgId]` to `useIsAuthorizedRep`'s enabled guard in a way that reacts to localStorage changes (e.g., via a custom event or `useState` wrapper). No code change is strictly required to unblock UAT.

---

## Cross-file seams checked

| Seam | Status |
|------|--------|
| `OpportunityBuilder.tsx` `Link to={/grantor/opportunities/${id}/qa}` → `App.tsx` route `path="opportunities/:id/qa"` under `/grantor` | **OK** — Route is defined at line 76; `GrantorLayout` auth guard at line 17 protects it |
| `OpportunityDetailPage.tsx` `href="#qa-section"` → `section id="qa-section"` on same page | **OK** — Both are in scope (lines 608, 491); in-page anchor scroll works |
| `publishedQAQuery.isError` guard does not suppress `publishedQAQuery.data` rendering simultaneously | **OK** — TanStack Query: when `isError=true`, `data` is `undefined` for a failed query with no cached data; the `data &&` guards on lines 501 and 504 prevent double-render |
| `WorkspacePage.tsx` useEffect → `useIsAuthorizedRep` reads same localStorage key | **OK** (with caveat noted in W2) — same key `'applicant_org_id'`; correct UUID written from `Workspace.org_id` which is typed `string` in `workspace.ts:9` |
| `seed.ts` SECTION_FIELDS loop references `uatWorkspaceId`, `uatOpportunityId`, `applicantUserId` — variable scope | **OK** — All three are declared in outer `seed()` scope (lines 292, 340, 449); the `continue` guard on line 651 is correct |
| `seed.ts` new block is outside the `if (uatWorkspaceId)` guard used by the narrative block | **OK** — The SECTION_FIELDS loop has its own `if (!uatWorkspaceId || …) continue` guard per iteration; semantically equivalent |
| `CompletenessChecklist.tsx` `phaseNote?: string` removal — no remaining callers of removed field | **OK** — diff confirms `phaseNote` is removed from both the interface and all render logic; grep finds no remaining references to `phaseNote` or `isPhase2` in the file |
| `OpportunityBuilder.tsx` `'qa'` in `BuilderSection` union + `setActiveSection('qa')` + `activeSection === 'qa'` guard | **OK** — All three sites are consistent; TypeScript validates the union |
| `seed.ts` `validation_config: { max_length }` → `FormFieldRenderer.tsx` reads `vc.max_chars` | **FINDING → W1** |
| `seed.ts` idempotency: WHERE NOT EXISTS on `(section_id, label)` — narrative has same pattern | **OK** — Consistent with pre-existing pattern; no UNIQUE constraint conflict risk on re-run |
