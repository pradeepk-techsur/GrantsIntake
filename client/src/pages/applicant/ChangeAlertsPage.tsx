import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { externalOpportunitiesApi } from '../../api/externalOpportunitiesApi';
import { describeAlert } from '../../components/ChangeAlertsBell';

/**
 * ChangeAlertsPage — full list of unread Grants.gov change alerts.
 * Renders at /applicant/grants-gov/alerts (PRD-INTAKE-019D).
 */
export function ChangeAlertsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['external-opportunities', 'alerts'],
    queryFn: () => externalOpportunitiesApi.listAlerts().then((r) => r.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (alertId: string) =>
      externalOpportunitiesApi.markAlertRead(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['external-opportunities', 'alerts'],
      });
    },
  });

  const alerts = data?.alerts ?? [];

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <div className="gf-page-header">
        <h1 className="gf-page-title">Grants.gov Change Alerts</h1>
      </div>

      {isLoading && <p>Loading alerts…</p>}

      {isError && (
        <div className="gf-alert gf-alert--error" role="alert">
          <div>
            <p className="gf-alert__text">Failed to load alerts.</p>
          </div>
        </div>
      )}

      {!isLoading && !isError && alerts.length === 0 && (
        <div
          className="gf-alert gf-alert--info"
          role="status"
          data-testid="alerts-page-empty"
        >
          <div>
            <p className="gf-alert__title">No alerts</p>
            <p className="gf-alert__text">
              You have no unread change alerts.{' '}
              <Link to="/applicant/grants-gov">Browse opportunities</Link>
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && alerts.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {alerts.map((alert) => (
            <li
              key={alert.id}
              data-testid="alerts-page-item"
              style={{
                borderLeft: '3px solid var(--gf-primary, #005EA6)',
                paddingLeft: 12,
                marginBottom: 16,
              }}
            >
              <Link
                to={`/applicant/grants-gov/${alert.external_opportunity_id}`}
                style={{ fontWeight: 600 }}
              >
                {describeAlert(alert)}
              </Link>
              <p className="gf-text-muted" style={{ margin: '4px 0' }}>
                {new Date(alert.created_at).toLocaleString()}
              </p>
              <button
                type="button"
                className="gf-btn gf-btn--outline gf-btn--sm"
                data-testid="alerts-page-mark-read"
                onClick={() => markReadMutation.mutate(alert.id)}
              >
                Mark as read
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
