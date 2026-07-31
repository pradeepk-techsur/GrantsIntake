import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { workspaceApi } from '../../api/workspaceApi';
import type { Workspace } from '../../types/workspace';

export function WorkspaceListPage() {
  const navigate = useNavigate();

  const workspacesQuery = useQuery({
    queryKey: ['my-workspaces'],
    queryFn: workspaceApi.listWorkspaces,
  });

  if (workspacesQuery.isLoading) {
    return (
      <div className="usa-prose">
        <p>Loading your applications…</p>
      </div>
    );
  }

  if (workspacesQuery.isError) {
    return (
      <div className="usa-alert usa-alert--error" role="alert">
        <div className="usa-alert__body">
          <h4 className="usa-alert__heading">Error</h4>
          <p className="usa-alert__text">Failed to load your applications. Please try again.</p>
        </div>
      </div>
    );
  }

  const workspaces = workspacesQuery.data ?? [];

  return (
    <div className="usa-prose">
      <h1>My Applications</h1>

      {workspaces.length === 0 ? (
        <div data-testid="workspace-list">
          <p>
            You have no applications yet.{' '}
            <a href="/opportunities">Find an opportunity to get started.</a>
          </p>
        </div>
      ) : (
        <div className="usa-card-group" data-testid="workspace-list">
          {workspaces.map((workspace: Workspace) => (
            <div
              key={workspace.workspace_id}
              className="usa-card tablet:grid-col-6"
              data-testid="workspace-card"
            >
              <div className="usa-card__container">
                <div className="usa-card__header">
                  <h2 className="usa-card__heading">
                    Opportunity {workspace.opportunity_id.slice(0, 8)}…
                  </h2>
                </div>
                <div className="usa-card__body">
                  <p>
                    <span className="usa-tag">{workspace.status.replace(/_/g, ' ')}</span>
                  </p>
                  <p className="usa-hint">
                    Created: {new Date(workspace.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="usa-card__footer">
                  <button
                    type="button"
                    className="usa-button"
                    onClick={() => navigate(`/applicant/workspaces/${workspace.workspace_id}`)}
                  >
                    Open Application
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
