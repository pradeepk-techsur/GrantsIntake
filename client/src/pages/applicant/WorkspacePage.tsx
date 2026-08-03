import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { workspaceApi } from '../../api/workspaceApi';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useValidation } from '../../hooks/useValidation';
import { useIsAuthorizedRep } from '../../hooks/useIsAuthorizedRep';
import { WorkspaceSidebar } from '../../components/workspace/WorkspaceSidebar';
import { WorkspaceSectionPanel } from '../../components/workspace/WorkspaceSectionPanel';
import { ReadinessDashboard } from '../../components/workspace/ReadinessDashboard';
import { CertificationPanel } from '../../components/workspace/CertificationPanel';

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'submitted': return 'gf-badge gf-badge--success';
    case 'in_progress': return 'gf-badge gf-badge--pending';
    case 'returned': return 'gf-badge gf-badge--warning';
    case 'locked': return 'gf-badge gf-badge--neutral';
    default: return 'gf-badge gf-badge--neutral';
  }
}

/**
 * WorkspacePage — GrantFlow Design System v1.0.
 * 3-column layout: section nav (left) | form panel (center) | readiness (right).
 * Matches Figma grant application workspace with lifecycle tracker and readiness sidebar.
 */
export function WorkspacePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const workspaceQuery = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspaceApi.getWorkspace(workspaceId!),
    enabled: !!workspaceId,
  });

  const sectionsQuery = useQuery({
    queryKey: ['sections', workspaceId],
    queryFn: () => workspaceApi.getSections(workspaceId!),
    enabled: !!workspaceId,
  });

  const opportunityQuery = useQuery({
    queryKey: ['opportunity-title', workspaceQuery.data?.opportunity_id],
    queryFn: async () => {
      const oppId = workspaceQuery.data!.opportunity_id;
      const res = await fetch(`/api/v1/opportunities/${oppId}`);
      if (!res.ok) return null;
      const data = await res.json() as { title?: string };
      return data.title ?? null;
    },
    enabled: !!workspaceQuery.data?.opportunity_id,
    staleTime: 5 * 60_000,
  });

  const { triggerValidation } = useValidation(workspaceId ?? '');
  const isAuthorizedRep = useIsAuthorizedRep(workspaceQuery.data?.org_id ?? null);
  const { activeSectionType, setActiveSectionType } = useWorkspaceStore();

  useEffect(() => {
    if (workspaceQuery.data?.org_id) {
      localStorage.setItem('applicant_org_id', workspaceQuery.data.org_id);
    }
  }, [workspaceQuery.data?.org_id]);

  useEffect(() => {
    if (sectionsQuery.data && !activeSectionType) {
      const first = sectionsQuery.data.find((s) => s.is_visible);
      if (first) setActiveSectionType(first.section_type);
    }
  }, [sectionsQuery.data, activeSectionType, setActiveSectionType]);

  const activeSection = sectionsQuery.data?.find((s) => s.section_type === activeSectionType);

  if (workspaceQuery.isLoading || sectionsQuery.isLoading) {
    return <div className="gf-loading" aria-busy="true">Loading application workspace…</div>;
  }

  if (workspaceQuery.error) {
    const status = (workspaceQuery.error as { response?: { status?: number } }).response?.status;
    const isNotFound = status === 404;
    const isForbidden = status === 403;
    return (
      <div className={`gf-alert ${isForbidden || isNotFound ? 'gf-alert--error' : 'gf-alert--error'}`} role="alert">
        <div>
          <p className="gf-alert__title">
            {isNotFound ? 'Workspace not found' : isForbidden ? 'Access denied' : 'Error'}
          </p>
          <p className="gf-alert__text">
            {isNotFound
              ? 'This application workspace does not exist.'
              : isForbidden
              ? 'You do not have permission to view this workspace.'
              : 'Failed to load workspace. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  const workspace = workspaceQuery.data;
  const sections = sectionsQuery.data ?? [];
  const visibleSections = sections.filter((s) => s.is_visible);

  return (
    <div data-testid="workspace-page">
      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="gf-page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 className="gf-page-title" style={{ margin: 0 }}>
              {opportunityQuery.data ?? 'Application Workspace'}
            </h1>
            {workspace && (
              <span className={statusBadgeClass(workspace.status)}>
                {workspace.status.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          {workspace && (
            <p className="gf-page-subtitle">
              Opportunity: {workspace.opportunity_id}
            </p>
          )}
        </div>
        {workspaceId && (
          <Link
            to={`/applicant/workspaces/${workspaceId}/preview`}
            className="gf-btn gf-btn--outline gf-btn--sm"
            data-testid="preview-application-link"
          >
            Preview
          </Link>
        )}
      </div>

      {/* ── Locked banner ────────────────────────────────────────── */}
      {workspace?.is_locked && (
        <div className="gf-alert gf-alert--info" role="status" data-testid="locked-banner" style={{ marginBottom: '20px' }}>
          <div>
            <p className="gf-alert__title">Application submitted and locked</p>
            <p className="gf-alert__text">
              This application has been submitted. All fields are read-only.{' '}
              <Link
                to={`/applicant/workspaces/${workspaceId}/receipt`}
                style={{ color: 'inherit', fontWeight: 600 }}
              >
                View submission receipt
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* ── 3-column layout ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 280px', gap: '20px', alignItems: 'start' }}>
        {/* Section nav */}
        <div data-testid="workspace-section-sidebar">
          <WorkspaceSidebar
            sections={visibleSections}
            activeSectionType={activeSectionType}
            onSectionSelect={setActiveSectionType}
          />
        </div>

        {/* Section content */}
        <div data-testid="workspace-section-content">
          {activeSection ? (
            <>
              <WorkspaceSectionPanel
                section={activeSection}
                workspaceId={workspaceId!}
                onFieldBlur={triggerValidation}
                isLocked={workspace?.is_locked ?? false}
              />
              {activeSection.section_type === 'certifications' && (
                <CertificationPanel
                  workspaceId={workspaceId!}
                  isAuthorizedRep={isAuthorizedRep}
                />
              )}
            </>
          ) : (
            <div
              style={{
                padding: '32px',
                textAlign: 'center',
                color: 'var(--gf-muted)',
                fontSize: 'var(--gf-font-compact)',
                background: 'var(--gf-white)',
                border: '1px solid var(--gf-border)',
                borderRadius: 'var(--gf-radius)',
              }}
            >
              Select a section from the left to begin.
            </div>
          )}
        </div>

        {/* Readiness panel */}
        <div data-testid="workspace-readiness-panel">
          <ReadinessDashboard workspaceId={workspaceId!} />
        </div>
      </div>
    </div>
  );
}
