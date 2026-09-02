import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { externalOpportunitiesApi } from '../api/externalOpportunitiesApi';
import {
  statusBadgeClass,
  statusBadgeLabel,
  formatDate,
} from './ExternalOpportunityCard';

/**
 * SavedOpportunities — "Saved from Grants.gov" section for the applicant
 * dashboard. Lists the user's saved external opportunities with an unsave
 * action (PRD-INTAKE-019C).
 */
export function SavedOpportunities() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['external-opportunities', 'saved'],
    queryFn: () => externalOpportunitiesApi.listSaved().then((r) => r.data),
  });

  const unsaveMutation = useMutation({
    mutationFn: (id: string) => externalOpportunitiesApi.unsaveOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['external-opportunities', 'saved'],
      });
    },
  });

  const saved = data?.items ?? [];

  return (
    <div className="gf-card" style={{ marginTop: 24 }} data-testid="saved-opportunities">
      <div
        className="gf-card__header"
        style={{ justifyContent: 'space-between' }}
      >
        <h2 className="gf-card__title">Saved from Grants.gov</h2>
        <Link
          to="/applicant/grants-gov"
          className="gf-btn gf-btn--outline gf-btn--sm"
        >
          Browse Grants.gov
        </Link>
      </div>

      {isLoading && <div className="gf-loading">Loading saved opportunities…</div>}

      {isError && (
        <div
          className="gf-alert gf-alert--error"
          role="alert"
          style={{ margin: '16px 20px' }}
        >
          <p className="gf-alert__text">Failed to load saved opportunities.</p>
        </div>
      )}

      {!isLoading && !isError && saved.length === 0 && (
        <div
          style={{
            padding: '24px 20px',
            color: 'var(--gf-muted)',
            textAlign: 'center',
          }}
          data-testid="saved-opportunities-empty"
        >
          <p style={{ margin: 0 }}>
            You have not saved any Grants.gov opportunities yet.
          </p>
        </div>
      )}

      {!isLoading && saved.length > 0 && (
        <div className="gf-table-wrap">
          <table className="gf-table">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Agency</th>
                <th scope="col">Status</th>
                <th scope="col">Due date</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {saved.map((opp) => (
                <tr key={opp.id} data-testid="saved-opportunity-row">
                  <td style={{ fontWeight: 600 }}>
                    <Link to={`/applicant/grants-gov/${opp.id}`}>
                      {opp.title}
                    </Link>
                  </td>
                  <td style={{ color: 'var(--gf-muted)' }}>
                    {opp.agency ?? '—'}
                  </td>
                  <td>
                    <span className={statusBadgeClass(opp.opportunity_status)}>
                      {statusBadgeLabel(opp.opportunity_status)}
                    </span>
                  </td>
                  <td style={{ color: 'var(--gf-muted)' }}>
                    {formatDate(opp.due_date)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="gf-btn gf-btn--ghost gf-btn--sm"
                      data-testid="saved-opportunity-unsave"
                      disabled={unsaveMutation.isPending}
                      onClick={() => unsaveMutation.mutate(opp.id)}
                    >
                      Unsave
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
