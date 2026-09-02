import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { externalOpportunitiesApi } from '../api/externalOpportunitiesApi';
import { useAuthStore } from '../store/authStore';
import type { ChangeAlert } from '../types/externalOpportunity';

/** Human-readable label for a change alert (PRD-INTAKE-019D). */
export function describeAlert(alert: ChangeAlert): string {
  const prev = alert.previous_value || '—';
  const next = alert.new_value || '—';
  switch (alert.alert_type) {
    case 'due_date_change':
      return `Due date changed: ${prev} → ${next}`;
    case 'status_change':
      return `Status changed: ${prev} → ${next}`;
    case 'package_change':
      return 'Application package updated';
    case 'instructions_change':
      return 'Eligibility / instructions updated';
    default:
      return `${alert.alert_type}: ${prev} → ${next}`;
  }
}

/**
 * ChangeAlertsBell — header bell with unread change-alert count + dropdown.
 * Lists top 5 unread alerts with inline mark-as-read and a link to view all.
 * Rendered in the applicant header (PRD-INTAKE-019D).
 */
export function ChangeAlertsBell() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['external-opportunities', 'alerts'],
    queryFn: () => externalOpportunitiesApi.listAlerts().then((r) => r.data),
    enabled: !!accessToken,
    refetchInterval: 60000,
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
  const unreadCount = alerts.length;
  const topAlerts = alerts.slice(0, 5);

  if (!accessToken) return null;

  return (
    <div style={{ position: 'relative' }} data-testid="change-alerts-bell">
      <button
        type="button"
        className="gf-btn gf-btn--ghost gf-btn--sm"
        aria-label={`Grants.gov alerts, ${unreadCount} unread`}
        aria-expanded={open}
        data-testid="alerts-bell-button"
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span
            className="gf-badge gf-badge--error"
            data-testid="alerts-unread-count"
            style={{ marginLeft: 4 }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          data-testid="alerts-dropdown"
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            width: 320,
            background: 'var(--gf-white, #fff)',
            border: '1px solid var(--gf-border, #e2e8f0)',
            borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            zIndex: 50,
            padding: 8,
          }}
        >
          <p
            style={{
              fontWeight: 600,
              margin: '4px 8px',
              fontSize: '0.9rem',
            }}
          >
            Grants.gov alerts
          </p>

          {topAlerts.length === 0 ? (
            <p
              className="gf-text-muted"
              data-testid="alerts-empty"
              style={{ margin: '8px', fontSize: '0.9rem' }}
            >
              No new alerts.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {topAlerts.map((alert) => (
                <li
                  key={alert.id}
                  data-testid="alert-item"
                  style={{
                    padding: '8px',
                    borderBottom: '1px solid var(--gf-border, #eee)',
                    fontSize: '0.85rem',
                  }}
                >
                  <Link
                    to={`/applicant/grants-gov/${alert.external_opportunity_id}`}
                    onClick={() => setOpen(false)}
                    style={{ display: 'block', fontWeight: 500 }}
                  >
                    {describeAlert(alert)}
                  </Link>
                  <button
                    type="button"
                    className="gf-btn gf-btn--ghost gf-btn--sm"
                    data-testid="alert-mark-read"
                    onClick={() => markReadMutation.mutate(alert.id)}
                    style={{ marginTop: 4, padding: '2px 6px' }}
                  >
                    Mark as read
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Link
            to="/applicant/grants-gov/alerts"
            onClick={() => setOpen(false)}
            data-testid="alerts-view-all"
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '8px',
              fontSize: '0.9rem',
            }}
          >
            View all alerts
          </Link>
        </div>
      )}
    </div>
  );
}
