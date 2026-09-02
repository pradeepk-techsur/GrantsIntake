import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { workspaceApi } from '../../api/workspaceApi';
import { externalOpportunitiesApi } from '../../api/externalOpportunitiesApi';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { SavedOpportunities } from '../../components/SavedOpportunities';
import type { Workspace } from '../../types/workspace';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

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
 * Applicant home / workspace list — GrantFlow Design System v1.0.
 * Matches Figma "Good afternoon, Priya" layout with action required, deadline,
 * active awards stat cards and an applications table below.
 */
export function WorkspaceListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useCurrentUser();

  const justImported = Boolean(
    (location.state as { importedFromGrantsGov?: boolean } | null)
      ?.importedFromGrantsGov,
  );
  const [bannerOpen, setBannerOpen] = useState(justImported);

  const workspacesQuery = useQuery({
    queryKey: ['my-workspaces'],
    queryFn: workspaceApi.listWorkspaces,
  });

  const importedQuery = useQuery({
    queryKey: ['imported-opportunities'],
    queryFn: () => externalOpportunitiesApi.listImported().then((r) => r.data),
  });

  const greeting = getGreeting();
  const firstName = user?.full_name?.split(' ')[0] ?? '';
  const workspaces = workspacesQuery.data ?? [];
  const submitted = workspaces.filter((w: Workspace) => w.status === 'submitted').length;

  const importedItems = importedQuery.data?.items ?? [];

  return (
    <div>
      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="gf-page-header">
        <h1 className="gf-page-title">
          {greeting}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="gf-page-subtitle">Here is what needs your attention.</p>
      </div>

      {/* ── Import success banner (PRD-INTAKE-019C / uat/5) ───────── */}
      {bannerOpen && (
        <div
          className="gf-alert gf-alert--success"
          role="status"
          data-testid="import-success-banner"
          style={{ marginBottom: 16 }}
        >
          <div>
            <p className="gf-alert__title">Opportunity imported successfully</p>
            <p className="gf-alert__text">
              It now appears in your imported opportunities below. You can start an application from it.
            </p>
          </div>
          <button
            type="button"
            className="gf-btn gf-btn--ghost gf-btn--sm"
            data-testid="import-banner-dismiss"
            onClick={() => setBannerOpen(false)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Stat cards ───────────────────────────────────────────── */}
      <div className="gf-stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="gf-stat-card">
          <p className="gf-stat-card__label">Action required</p>
          <p className="gf-stat-card__value">—</p>
          <p className="gf-stat-card__sub">Review outstanding tasks in your applications.</p>
        </div>
        <div className="gf-stat-card">
          <p className="gf-stat-card__label">Upcoming deadline</p>
          <p className="gf-stat-card__value">—</p>
          <p className="gf-stat-card__sub">Check your open applications for due dates.</p>
        </div>
        <div className="gf-stat-card">
          <p className="gf-stat-card__label">Active awards</p>
          <p className="gf-stat-card__value">{submitted}</p>
          <p className="gf-stat-card__sub">
            {submitted > 0
              ? `${submitted} submitted application${submitted !== 1 ? 's' : ''}.`
              : 'No submitted applications yet.'}
          </p>
        </div>
      </div>

      {/* ── Applications table ────────────────────────────────────── */}
      <div className="gf-card">
        <div className="gf-card__header" style={{ justifyContent: 'space-between' }}>
          <h2 className="gf-card__title">My applications</h2>
          <Link to="/opportunities" className="gf-btn gf-btn--outline gf-btn--sm">
            Find funding
          </Link>
        </div>

        {workspacesQuery.isLoading && (
          <div className="gf-loading">Loading applications…</div>
        )}

        {workspacesQuery.isError && (
          <div className="gf-alert gf-alert--error" role="alert" style={{ margin: '16px 20px' }}>
            <p className="gf-alert__text">Failed to load your applications. Please try again.</p>
          </div>
        )}

        {!workspacesQuery.isLoading && !workspacesQuery.isError && workspaces.length === 0 && (
          <div style={{ padding: '32px 20px', color: 'var(--gf-muted)', textAlign: 'center' }} data-testid="workspace-list">
            <p style={{ margin: '0 0 12px' }}>You have no applications yet.</p>
            <Link to="/opportunities" className="gf-btn gf-btn--primary gf-btn--sm">
              Browse opportunities
            </Link>
          </div>
        )}

        {!workspacesQuery.isLoading && workspaces.length > 0 && (
          <div className="gf-table-wrap" data-testid="workspace-list">
            <table className="gf-table">
              <thead>
                <tr>
                  <th scope="col">Application</th>
                  <th scope="col">Program</th>
                  <th scope="col">Status</th>
                  <th scope="col">Due date</th>
                  <th scope="col">Next action</th>
                  <th scope="col">Owner</th>
                </tr>
              </thead>
              <tbody>
                {workspaces.map((workspace: Workspace) => (
                  <tr
                    key={workspace.workspace_id}
                    data-testid="workspace-card"
                    onClick={() => navigate(`/applicant/workspaces/${workspace.workspace_id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--gf-primary)' }}>
                      {workspace.workspace_id.slice(0, 12).toUpperCase()}
                    </td>
                    <td style={{ color: 'var(--gf-muted)' }}>
                      {workspace.opportunity_id.slice(0, 8)}…
                    </td>
                    <td>
                      <span className={statusBadgeClass(workspace.status)}>
                        {workspace.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--gf-muted)' }}>—</td>
                    <td>
                      <button
                        type="button"
                        className="gf-btn gf-btn--ghost gf-btn--sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/applicant/workspaces/${workspace.workspace_id}`);
                        }}
                      >
                        Open →
                      </button>
                    </td>
                    <td style={{ color: 'var(--gf-muted)' }}>
                      {user?.full_name ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Imported from Grants.gov ──────────────────────────────── */}
      <div className="gf-card" data-testid="imported-opportunities-section">
        <div className="gf-card__header">
          <h2 className="gf-card__title">Imported from Grants.gov</h2>
        </div>

        {importedQuery.isLoading && (
          <div className="gf-loading">Loading imported opportunities…</div>
        )}

        {!importedQuery.isLoading && importedItems.length === 0 && (
          <div
            style={{ padding: '24px 20px', color: 'var(--gf-muted)' }}
            data-testid="imported-empty"
          >
            <p style={{ margin: 0 }}>
              You have no imported opportunities yet. Browse{' '}
              <Link to="/applicant/grants-gov">Grants.gov opportunities</Link> and
              import one to start an application from it.
            </p>
          </div>
        )}

        {importedItems.length > 0 && (
          <div style={{ padding: '8px 20px 20px' }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {importedItems.map((item) => (
                <li
                  key={item.opportunity_id}
                  data-testid="imported-opportunity-card"
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid var(--gf-border, #e2e8f0)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 4,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{item.title}</span>
                    <span
                      className="gf-badge gf-badge--info"
                      data-testid="imported-badge"
                      style={{ marginLeft: 8 }}
                    >
                      Imported from Grants.gov
                    </span>
                  </div>
                  <div
                    className="gf-opp-card__meta"
                    style={{ color: 'var(--gf-muted)', marginTop: 4 }}
                  >
                    {item.funder_name && <span>{item.funder_name}</span>}
                    {item.funder_name && item.program_area && (
                      <span style={{ margin: '0 6px' }}>·</span>
                    )}
                    <span>{item.program_area}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Saved from Grants.gov ─────────────────────────────────── */}
      <SavedOpportunities />
    </div>
  );
}
