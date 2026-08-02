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

export function WorkspacePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  // React Query: load workspace + sections
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

  // Secondary fetch for opportunity title (public endpoint — no auth needed for published opps)
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
    staleTime: 5 * 60_000, // opportunity title rarely changes
  });

  // Workspace-level validation trigger on field blur
  const { triggerValidation } = useValidation(workspaceId ?? '');

  // Check if current user is authorized representative
  // Pass org_id from workspace data (React Query reactive) — avoids stale localStorage read
  const isAuthorizedRep = useIsAuthorizedRep(workspaceQuery.data?.org_id ?? null);

  // Zustand: local UI state for active section
  const { activeSectionType, setActiveSectionType } = useWorkspaceStore();

  // Seed localStorage.applicant_org_id from workspace data so useIsAuthorizedRep
  // works even when the user never visited OrgProfilePage (pre-seeded org scenario).
  // Phase 3 decision: org_id stored in localStorage key 'applicant_org_id' — non-sensitive UUID.
  useEffect(() => {
    if (workspaceQuery.data?.org_id) {
      localStorage.setItem('applicant_org_id', workspaceQuery.data.org_id);
    }
  }, [workspaceQuery.data?.org_id]);

  // Initialize active section to first visible section on load
  useEffect(() => {
    if (sectionsQuery.data && !activeSectionType) {
      const first = sectionsQuery.data.find((s) => s.is_visible);
      if (first) setActiveSectionType(first.section_type);
    }
  }, [sectionsQuery.data, activeSectionType, setActiveSectionType]);

  const activeSection = sectionsQuery.data?.find((s) => s.section_type === activeSectionType);

  // Loading state
  if (workspaceQuery.isLoading || sectionsQuery.isLoading) {
    return (
      <div className="usa-prose">
        <p>Loading application workspace…</p>
      </div>
    );
  }

  // Error states
  if (workspaceQuery.error) {
    const status = (workspaceQuery.error as { response?: { status?: number } }).response?.status;
    if (status === 404) {
      return (
        <div className="usa-alert usa-alert--error" role="alert">
          <div className="usa-alert__body">
            <h4 className="usa-alert__heading">Workspace Not Found</h4>
            <p className="usa-alert__text">This application workspace does not exist.</p>
          </div>
        </div>
      );
    }
    if (status === 403) {
      return (
        <div className="usa-alert usa-alert--error" role="alert">
          <div className="usa-alert__body">
            <h4 className="usa-alert__heading">Access Denied</h4>
            <p className="usa-alert__text">You do not have permission to view this workspace.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="usa-alert usa-alert--error" role="alert">
        <div className="usa-alert__body">
          <h4 className="usa-alert__heading">Error</h4>
          <p className="usa-alert__text">Failed to load workspace. Please try again.</p>
        </div>
      </div>
    );
  }

  const workspace = workspaceQuery.data;
  const sections = sectionsQuery.data ?? [];
  const visibleSections = sections.filter((s) => s.is_visible);

  return (
    <div data-testid="workspace-page">
      {/* Page header */}
      <div className="usa-prose" style={{ marginBottom: '1rem' }}>
        <h1>
          Application Workspace
          {workspace && (
            <span className="usa-tag" style={{ marginLeft: '0.75rem', fontSize: '0.8rem' }}>
              {workspace.status.replace(/_/g, ' ')}
            </span>
          )}
        </h1>
        {workspace && (
          <p className="usa-hint">
            Opportunity: {opportunityQuery.data ?? workspace.opportunity_id}
          </p>
        )}
        {/* Preview Application link */}
        {workspaceId && (
          <div style={{ marginBottom: '0.5rem' }}>
            <Link
              to={`/applicant/workspaces/${workspaceId}/preview`}
              className="usa-button usa-button--outline usa-button--small"
              data-testid="preview-application-link"
            >
              Preview Application
            </Link>
          </div>
        )}
      </div>

      {/* Locked state banner — shown after successful submission */}
      {workspace?.is_locked && (
        <div className="usa-alert usa-alert--info" role="status" data-testid="locked-banner">
          <div className="usa-alert__body">
            <h4 className="usa-alert__heading">Application Submitted and Locked</h4>
            <p className="usa-alert__text">
              This application has been submitted. All fields are read-only.{' '}
              <Link to={`/applicant/workspaces/${workspaceId}/receipt`} className="usa-link">
                View submission receipt
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Three-column layout: section sidebar (3) + section content (6) + readiness panel (3) = 12 */}
      <div className="grid-row grid-gap">
        <div className="grid-col-3" data-testid="workspace-section-sidebar">
          <WorkspaceSidebar
            sections={visibleSections}
            activeSectionType={activeSectionType}
            onSectionSelect={setActiveSectionType}
          />
        </div>
        <div className="grid-col-6" data-testid="workspace-section-content" style={{ overflow: 'hidden' }}>
          {activeSection ? (
            <>
              <WorkspaceSectionPanel
                section={activeSection}
                workspaceId={workspaceId!}
                onFieldBlur={triggerValidation}
                isLocked={workspace?.is_locked ?? false}
              />
              {/* Certification panel renders inline for certifications section */}
              {activeSection.section_type === 'certifications' && (
                <CertificationPanel
                  workspaceId={workspaceId!}
                  isAuthorizedRep={isAuthorizedRep}
                />
              )}
            </>
          ) : (
            <div className="usa-prose">
              <p className="usa-hint">Select a section from the left sidebar to begin.</p>
            </div>
          )}
        </div>
        <div className="grid-col-3" data-testid="workspace-readiness-panel">
          <ReadinessDashboard workspaceId={workspaceId!} />
        </div>
      </div>
    </div>
  );
}
