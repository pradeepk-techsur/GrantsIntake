---
status: diagnosed
trigger: "Diagnose UAT gaps: GAP 1 CertificationPanel not visible, GAP 2 Submit greyed out"
created: 2026-07-31T00:00:00Z
updated: 2026-07-31T00:00:00Z
---

## Current Focus

hypothesis: Confirmed — two independent root causes
test: Full code trace completed
expecting: N/A — diagnosis complete
next_action: Return structured diagnosis to caller

## Symptoms

expected:
  GAP1: Certification section shows legal text + checkbox for AR user
  GAP2: Submit Application button is clickable when workspace is ready

actual:
  GAP1: Certification section shows only Tasks + Internal Comments (no checkbox, no legal text)
  GAP2: Submit Application button is permanently greyed out / aria-disabled

errors:
  - "No form fields have been configured for this section yet."
  - "Submit application button is greyed"
  - Eligibility, workplan, performance measures, certifications all show same layout

reproduction:
  - Login as applicant@example.com
  - Open UAT workspace for UAT-OPP-001
  - Click Certifications section → no checkbox visible
  - Readiness Dashboard → Submit button disabled

started: UAT Tests 4, 5, 7

## Eliminated

- hypothesis: applicant_org_id IS set because user navigated to OrgProfilePage
  evidence: WorkspacePage and WorkspaceListPage NEVER set localStorage.applicant_org_id — only OrgProfilePage.createMutation.onSuccess does (line 172). If user goes directly to workspace without visiting OrgProfilePage first, localStorage key is null.
  timestamp: 2026-07-31

- hypothesis: CertificationPanel renders for all users regardless of isAuthorizedRep
  evidence: Line 66 of CertificationPanel.tsx: `if (!isAuthorizedRep) return null;` — renders nothing when false
  timestamp: 2026-07-31

- hypothesis: Submit button disabled only by blocking validation errors on sections
  evidence: ReadinessDashboard line 206: disabled when `blocking_errors.length > 0 || !readiness.is_ready_to_submit`. is_ready_to_submit requires 100% completion + no blocking + AR assigned. Seed sections are all status='not_started' (no form fields → no completions → 0% → never 100%).
  timestamp: 2026-07-31

## Evidence

- timestamp: 2026-07-31
  checked: useIsAuthorizedRep.ts line 24
  found: `const orgId = localStorage.getItem('applicant_org_id')` — null if key not set
  implication: If orgId is null, query is disabled (enabled: !!accessToken && !!orgId && !!user) → roles stays undefined → hook returns false

- timestamp: 2026-07-31
  checked: useIsAuthorizedRep.ts line 36
  found: `if (!user || !roles) return false;` — roles will be undefined if query disabled
  implication: isAuthorizedRep === false whenever localStorage is missing, regardless of DB role

- timestamp: 2026-07-31
  checked: CertificationPanel.tsx line 66
  found: `if (!isAuthorizedRep) return null;`
  implication: Panel returns null → user sees ONLY WorkspaceSectionPanel output (Tasks + Internal Comments)

- timestamp: 2026-07-31
  checked: WorkspacePage.tsx — all 191 lines
  found: WorkspacePage never calls localStorage.setItem('applicant_org_id'). It only reads isAuthorizedRep from the hook.
  implication: If user arrives at workspace directly (from seed URL or WorkspaceList), localStorage key is never set

- timestamp: 2026-07-31
  checked: WorkspaceListPage.tsx — full file
  found: No localStorage.setItem call at all — just navigates to workspace by ID
  implication: Confirmed: no page in the workspace flow sets applicant_org_id

- timestamp: 2026-07-31
  checked: OrgProfilePage.tsx line 172
  found: `storeOrgId(newOrg.org_id)` called ONLY in createMutation.onSuccess
  implication: localStorage is set ONLY when user submits OrgProfilePage for the first time (POST). updateMutation.onSuccess does NOT re-set it. First visit to OrgProfilePage reads from localStorage (getStoredOrgId) — if null, shows create form. The org already EXISTS in DB from seed, but OrgProfilePage only sets localStorage on create — not on load.

- timestamp: 2026-07-31
  checked: seed.ts lines 404-441
  found: Seed creates org 'UAT Test Nonprofit' and assigns applicant@example.com as authorized_representative + proposal_lead in org_roles table. But NO localStorage is set (seed is server-side).
  implication: DB has correct AR role. localStorage.applicant_org_id is NEVER set by any server-side operation — it must be set by the client visiting OrgProfilePage and triggering a create.

- timestamp: 2026-07-31
  checked: OrgProfilePage.tsx line 78
  found: `const [orgId, setOrgId] = useState<string | null>(getStoredOrgId);` — reads from localStorage on mount. If null → shows create form. storeOrgId NOT called on load/update path.
  implication: Even if user visits OrgProfilePage, they see "Create Organization Profile" (since localStorage is empty), but the DB already has UAT Test Nonprofit. The page won't auto-discover the existing org.

- timestamp: 2026-07-31
  checked: ReadinessDashboard.tsx line 206-207
  found: `disabled={readiness.blocking_errors.length > 0 || !readiness.is_ready_to_submit}`
  implication: Button disabled when ANY blocking error OR not ready to submit

- timestamp: 2026-07-31
  checked: readinessService.ts line 224-227
  found: `is_ready_to_submit = blocking_errors.length === 0 && overall_completion_pct === 100 && authorized_rep_assigned`
  implication: All three conditions must be true simultaneously

- timestamp: 2026-07-31
  checked: readinessService.ts line 67-72
  found: overall_completion_pct = completeSections.length / visibleSections.length * 100; completeSections = sections where status='complete'
  implication: Seed creates sections with default status (not_started). No fields filled → no validation triggered → status never becomes 'complete' → completion_pct = 0% → is_ready_to_submit = false always

- timestamp: 2026-07-31
  checked: SectionFormPanel.tsx line 135-138
  found: `<p className="usa-hint">No form fields have been configured for this section yet.</p>` shown when fields.length === 0
  implication: Most sections (eligibility, workplan, performance_measures, certifications) have NO form_field_definitions seeded. Seed only adds fields for 'narrative' section (3 fields). All other sections show the empty message.

- timestamp: 2026-07-31
  checked: seed.ts lines 488-553
  found: Only narrative section gets form_field_definitions. org_profile, eligibility, workplan, performance_measures, certifications, review_submit get ZERO field definitions.
  implication: User sees "No form fields have been configured for this section yet" on 7 of 9 sections — matches user report exactly.

## Resolution

root_cause:
  GAP1 (CertificationPanel not visible):
    PRIMARY: localStorage.getItem('applicant_org_id') returns null in all UAT test flows.
    The key is ONLY set in OrgProfilePage.createMutation.onSuccess (line 172) — i.e., only
    when user submits the "Create Organization Profile" form for the first time.
    Because the seed pre-creates the org in the DB, OrgProfilePage shows "Create..." form
    when localStorage is empty, but submitting would create a DUPLICATE org (not link to seeded one).
    WorkspacePage, WorkspaceListPage, login flow — NONE set localStorage.applicant_org_id.
    Therefore: useIsAuthorizedRep → orgId=null → query disabled → roles=undefined → returns false
    → CertificationPanel line 66: `if (!isAuthorizedRep) return null` → renders nothing.
    SECONDARY: Even if localStorage were fixed, CertificationPanel only appears when
    activeSection.section_type === 'certifications' (WorkspacePage line 172) — this part IS correct.

  GAP2 (Submit button greyed):
    THREE compounding reasons, ALL must be true for is_ready_to_submit:
    1. overall_completion_pct must be 100% — impossible because 7 of 9 sections have no
       form_field_definitions, so status never advances to 'complete' → completion stays 0%
    2. blocking_errors must be empty — any section with status='error' generates a blocking error;
       sections also stay 'not_started' forever since there's nothing to fill in
    3. authorized_rep_assigned must be true — this IS true in the DB (seed assigns AR role),
       BUT the readiness check (readinessService line 134) queries org_roles directly from DB
       using workspace.org_id — this part actually WORKS. authorized_rep_assigned = true from DB.
    Net effect: completion_pct=0%, is_ready_to_submit=false → button disabled regardless of AR status.

fix:
  GAP1 — Three-part fix required:
    FIX A (immediate, unblocks UAT): Add localStorage.setItem('applicant_org_id', workspace.org_id)
    in WorkspacePage.tsx when workspace data loads. The workspace record contains org_id; this
    should be set in a useEffect when workspaceQuery.data is available.
    Location: WorkspacePage.tsx, add after line 47 (after isAuthorizedRep declaration):
      useEffect(() => {
        if (workspaceQuery.data?.org_id) {
          localStorage.setItem('applicant_org_id', workspaceQuery.data.org_id);
        }
      }, [workspaceQuery.data?.org_id]);

    FIX B (structural): OrgProfilePage should also call storeOrgId() in updateMutation.onSuccess,
    and should auto-discover existing org from API by user membership rather than relying solely
    on localStorage presence. (Longer-term fix.)

    FIX C (seed): Add localStorage bootstrap instruction to UAT test setup guide, OR add a
    dedicated /api/v1/me/org endpoint that returns the user's org_id so WorkspacePage
    can populate localStorage without depending on OrgProfilePage being visited first.

  GAP2 — Two-part fix required:
    FIX A (immediate, unblocks UAT): Add form_field_definitions seeds for ALL workspace sections
    that need fields (eligibility, workplan, performance_measures, certifications, org_profile).
    Certifications section needs at least a "review" or acknowledgement field so it can reach
    status='complete'. All other sections need enough fields to be completable.
    Location: seed.ts, extend the UAT Scenario Seed block (after line 553) to add fields for
    each section type.

    FIX B (structural): The CertificationPanel itself handles certification (checkbox + submit).
    Once certified, the certification section's status needs to be updated to 'complete' by
    the backend certify endpoint — verify this is wired up in the POST /certify handler.

verification: Not yet applied — diagnosis only
files_changed: []
