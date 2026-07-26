import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { TemplateLibrary } from './opportunities/TemplateLibrary';
import apiClient from '../../api/client';

function hasRole(roles: string[], ...check: string[]): boolean {
  return roles.some((r) => check.includes(r));
}

// For the template library, we need a program ID.
// In Phase 1 we use the first available program from the user's org.
// If no program exists, the user must create one first.
function useFirstProgramId(): string | null {
  const [programId, setProgramId] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<{ program_id: string }[]>('/programs').then((res) => {
      if (res.data.length > 0) {
        setProgramId(res.data[0].program_id);
      }
    }).catch(() => {/* ignore */});
  }, []);

  return programId;
}

interface OpportunityListItem {
  opportunity_id: string;
  title: string;
  status: string;
  announcement_type: string;
  updated_at: string;
}

/**
 * Opportunities index page.
 * Fetches and renders existing opportunities, with a "Create New Opportunity" CTA.
 */
export function OpportunitiesIndex() {
  const { grantor_memberships } = useCurrentUser();
  const allRoles = grantor_memberships.flatMap((m) => m.roles);
  const canCreate = hasRole(allRoles, 'grantor_admin', 'program_officer');
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const programId = useFirstProgramId();

  const [opportunities, setOpportunities] = useState<OpportunityListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!programId) return;
    setLoading(true);
    apiClient
      .get<OpportunityListItem[]>(`/programs/${programId}/opportunities`)
      .then((res) => setOpportunities(res.data))
      .catch(() => {/* ignore — show empty state */})
      .finally(() => setLoading(false));
  }, [programId]);

  return (
    <div>
      <div className="usa-prose">
        <h1>Opportunities</h1>
      </div>

      {loading && (
        <p aria-live="polite">Loading...</p>
      )}

      {!loading && opportunities.length === 0 && (
        <div
          className="usa-alert usa-alert--info"
          role="status"
          aria-label="No opportunities available"
        >
          <div className="usa-alert__body">
            <h4 className="usa-alert__heading">No opportunities yet</h4>
            <p className="usa-alert__text">
              No funding opportunities have been created for your organization.
            </p>
          </div>
        </div>
      )}

      {!loading && opportunities.length > 0 && (
        <ul className="usa-card-group" style={{ listStyle: 'none', padding: 0 }}>
          {opportunities.map((opp) => (
            <li key={opp.opportunity_id} className="usa-card">
              <div className="usa-card__container">
                <div className="usa-card__header">
                  <h2 className="usa-card__heading">
                    <Link to={`/grantor/opportunities/${opp.opportunity_id}`}>
                      {opp.title}
                    </Link>
                  </h2>
                </div>
                <div className="usa-card__body">
                  <p>
                    <span className="usa-tag">{opp.status}</span>
                    {' '}
                    <span>{opp.announcement_type}</span>
                  </p>
                  <p>
                    <small>Updated: {new Date(opp.updated_at).toLocaleDateString()}</small>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canCreate && (
        <div style={{ marginTop: '1.5rem' }}>
          <button
            type="button"
            className="usa-button"
            aria-label="Create New Opportunity"
            data-testid="create-opportunity-btn"
            onClick={() => setShowTemplateLibrary(true)}
          >
            Create New Opportunity
          </button>
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
    </div>
  );
}
