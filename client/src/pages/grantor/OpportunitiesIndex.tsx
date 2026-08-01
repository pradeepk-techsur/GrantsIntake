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

/**
 * Opportunities index page.
 * Fetches and renders existing opportunities, with a "Create New Opportunity" CTA.
 */
export function OpportunitiesIndex() {
  const { grantor_memberships } = useCurrentUser();
  const allRoles = grantor_memberships.flatMap((m) => m.roles);
  const canCreate = hasRole(allRoles, 'grantor_admin', 'program_officer');
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  // programId is kept for the TemplateLibrary modal (create new opportunity flow uses first program)
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
        if (programs.length === 0) {
          setOpportunities([]);
          return;
        }
        // Set programId for create modal (first program)
        if (programs[0]) setProgramId(programs[0].program_id);
        // Fetch all opportunities across all programs
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
                <div className="usa-card__footer">
                  <Link
                    to={`/grantor/opportunities/${opp.opportunity_id}/qa`}
                    className="usa-link"
                    data-testid={`qa-link-${opp.opportunity_id}`}
                    aria-label={`Manage Q&A for ${opp.title}`}
                  >
                    Manage Q&amp;A
                  </Link>
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
