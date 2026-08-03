import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { TemplateLibrary } from './opportunities/TemplateLibrary';
import apiClient from '../../api/client';

function hasRole(roles: string[], ...check: string[]): boolean {
  return roles.some((r) => check.includes(r));
}

interface OpportunityListItem {
  opportunity_id: string;
  title: string;
  status: string;
  announcement_type: string;
  updated_at: string;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'published': return 'gf-badge gf-badge--success';
    case 'draft':     return 'gf-badge gf-badge--neutral';
    case 'closed':    return 'gf-badge gf-badge--closed';
    default:          return 'gf-badge gf-badge--pending';
  }
}

/**
 * Opportunities index — GrantFlow Design System v1.0.
 * Lists all opportunities as a clean table with status badges.
 * Route: /grantor/opportunities
 */
export function OpportunitiesIndex() {
  const { grantor_memberships } = useCurrentUser();
  const allRoles = grantor_memberships.flatMap((m) => m.roles);
  const canCreate = hasRole(allRoles, 'grantor_admin', 'program_officer');

  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [programId, setProgramId] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<OpportunityListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    apiClient
      .get<{ program_id: string }[]>('/programs', { signal: controller.signal })
      .then(async (res) => {
        const programs = res.data;
        if (programs.length === 0) { setOpportunities([]); return; }
        if (programs[0]) setProgramId(programs[0].program_id);
        const oppArrays = await Promise.all(
          programs.map((p) =>
            apiClient
              .get<OpportunityListItem[]>(`/programs/${p.program_id}/opportunities`, { signal: controller.signal })
              .then((r) => r.data)
              .catch(() => [] as OpportunityListItem[]),
          ),
        );
        if (!controller.signal.aborted) setOpportunities(oppArrays.flat());
      })
      .catch(() => { if (!controller.signal.aborted) setOpportunities([]); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  return (
    <div>
      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="gf-action-bar">
        <div className="gf-page-header" style={{ marginBottom: 0 }}>
          <h1 className="gf-page-title">Opportunities</h1>
          <p className="gf-page-subtitle">Manage your funding opportunities.</p>
        </div>
        {canCreate && (
          <button
            type="button"
            className="gf-btn gf-btn--primary"
            aria-label="Create New Opportunity"
            data-testid="create-opportunity-btn"
            onClick={() => setShowTemplateLibrary(true)}
          >
            + New Opportunity
          </button>
        )}
      </div>

      {loading && (
        <div className="gf-loading" aria-live="polite">Loading…</div>
      )}

      {!loading && opportunities.length === 0 && (
        <div className="gf-alert gf-alert--info" role="status" aria-label="No opportunities available">
          <div>
            <p className="gf-alert__title">No opportunities yet</p>
            <p className="gf-alert__text">
              No funding opportunities have been created for your organization.
            </p>
          </div>
        </div>
      )}

      {!loading && opportunities.length > 0 && (
        <div className="gf-card">
          <div className="gf-table-wrap">
            <table className="gf-table">
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Status</th>
                  <th scope="col">Type</th>
                  <th scope="col">Updated</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp) => (
                  <tr key={opp.opportunity_id}>
                    <td>
                      <Link
                        to={`/grantor/opportunities/${opp.opportunity_id}`}
                        style={{ color: 'var(--gf-primary)', fontWeight: 500, textDecoration: 'none' }}
                      >
                        {opp.title}
                      </Link>
                    </td>
                    <td>
                      <span className={statusBadgeClass(opp.status)}>{opp.status}</span>
                    </td>
                    <td style={{ color: 'var(--gf-muted)' }}>{opp.announcement_type}</td>
                    <td style={{ color: 'var(--gf-muted)' }}>
                      {new Date(opp.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>
                      <Link
                        to={`/grantor/opportunities/${opp.opportunity_id}/qa`}
                        className="gf-btn gf-btn--ghost gf-btn--sm"
                        data-testid={`qa-link-${opp.opportunity_id}`}
                        aria-label={`Manage Q&A for ${opp.title}`}
                      >
                        Manage Q&amp;A
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Template Library Modal */}
      {showTemplateLibrary && programId && (
        <TemplateLibrary
          programId={programId}
          onClose={() => setShowTemplateLibrary(false)}
        />
      )}

      {showTemplateLibrary && !programId && (
        <div className="gf-alert gf-alert--warning" role="alert" data-testid="no-programs-warning">
          <div>
            <p className="gf-alert__title">No programs configured</p>
            <p className="gf-alert__text">
              Your organization has no programs set up yet. Contact your system administrator
              to configure a program before creating a funding opportunity.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
