import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { workspaceApi } from '../../api/workspaceApi';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { WorkspaceSidebar } from '../../components/workspace/WorkspaceSidebar';
import { WorkspaceSectionPanel } from '../../components/workspace/WorkspaceSectionPanel';

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

  // Zustand: local UI state for active section
  const { activeSectionType, setActiveSectionType } = useWorkspaceStore();

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
          <p className="usa-hint">Opportunity: {workspace.opportunity_id}</p>
        )}
      </div>

      {/* Two-column layout: sidebar + section panel */}
      <div className="grid-row grid-gap">
        <div className="grid-col-3" data-testid="workspace-section-sidebar">
          <WorkspaceSidebar
            sections={visibleSections}
            activeSectionType={activeSectionType}
            onSectionSelect={setActiveSectionType}
          />
        </div>
        <div className="grid-col-9" data-testid="workspace-section-content">
          {activeSection ? (
            <WorkspaceSectionPanel section={activeSection} workspaceId={workspaceId!} />
          ) : (
            <div className="usa-prose">
              <p className="usa-hint">Select a section from the left sidebar to begin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
