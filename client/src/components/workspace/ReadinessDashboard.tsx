import { useQuery } from '@tanstack/react-query';
import { workspaceApi } from '../../api/workspaceApi';

interface ReadinessDashboardProps {
  workspaceId: string;
}

/**
 * ReadinessDashboard — sticky right-panel readiness summary (PRD-INTAKE-035 / F34).
 *
 * Displays:
 * - Completion percentage with USWDS progress bar
 * - Ready-to-submit status badge
 * - Authorized representative assignment status
 * - Blocking errors with section links
 * - Warnings list
 * - Required attachment status
 *
 * Polls every 30 seconds via React Query refetchInterval (no WebSocket).
 * WorkspacePage positions this in the right column of the 3-column grid.
 */
export function ReadinessDashboard({ workspaceId }: ReadinessDashboardProps) {
  const {
    data: readiness,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['readiness', workspaceId],
    queryFn: () => workspaceApi.getReadiness(workspaceId),
    refetchInterval: 30_000, // poll every 30 seconds for live updates (PRD-INTAKE-035)
    staleTime: 20_000,
    enabled: !!workspaceId,
  });

  if (isLoading) {
    return (
      <div className="usa-prose">
        <p>Loading readiness…</p>
      </div>
    );
  }

  if (isError || !readiness) {
    return (
      <div className="usa-alert usa-alert--warning usa-alert--slim" role="alert">
        <div className="usa-alert__body">
          <p className="usa-alert__text">Readiness data unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <aside
      aria-label="Application Readiness"
      data-testid="readiness-dashboard"
      className="usa-card"
    >
      <div className="usa-card__header">
        <h2 className="usa-card__heading">Application Readiness</h2>
      </div>
      <div className="usa-card__body">

        {/* ── Completion percentage ─────────────────────────────────────── */}
        <div data-testid="completion-pct" style={{ marginBottom: '1rem' }}>
          <strong>{readiness.overall_completion_pct}%</strong> complete
          <div
            className="usa-progress"
            role="progressbar"
            aria-valuenow={readiness.overall_completion_pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${readiness.overall_completion_pct}% complete`}
            style={{ marginTop: '0.5rem', background: '#dfe1e2', height: '8px', borderRadius: '4px' }}
          >
            <div
              className="usa-progress__bar"
              style={{
                width: `${readiness.overall_completion_pct}%`,
                background: readiness.overall_completion_pct === 100 ? '#2e8540' : '#005ea2',
                height: '100%',
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* ── Ready to submit badge ──────────────────────────────────────── */}
        {readiness.is_ready_to_submit ? (
          <div
            className="usa-alert usa-alert--success usa-alert--slim"
            data-testid="ready-to-submit-banner"
            style={{ marginBottom: '0.75rem' }}
          >
            <div className="usa-alert__body">
              <p className="usa-alert__text">Ready to submit</p>
            </div>
          </div>
        ) : (
          <div
            className="usa-alert usa-alert--info usa-alert--slim"
            style={{ marginBottom: '0.75rem' }}
          >
            <div className="usa-alert__body">
              <p className="usa-alert__text">Not ready to submit</p>
            </div>
          </div>
        )}

        {/* ── Authorized representative status ──────────────────────────── */}
        <div data-testid="authorized-rep-status" style={{ marginBottom: '0.75rem' }}>
          {readiness.authorized_rep_assigned ? (
            <span className="usa-tag usa-tag--success">Authorized Rep Assigned</span>
          ) : (
            <span className="usa-tag usa-tag--warning">No Authorized Rep</span>
          )}
        </div>

        {/* ── Blocking errors ───────────────────────────────────────────── */}
        {readiness.blocking_errors.length > 0 && (
          <div data-testid="blocking-errors" style={{ marginBottom: '0.75rem' }}>
            <h3 className="font-sans-sm" style={{ margin: '0 0 0.5rem' }}>
              Blocking Issues ({readiness.blocking_errors.length})
            </h3>
            <ul className="usa-list" style={{ marginTop: 0 }}>
              {readiness.blocking_errors.map((err, i) => (
                <li key={`${err.section_id}-${err.error_code}-${i}`}>
                  <a href={err.link} className="usa-link">
                    {err.section_name && `${err.section_name}: `}{err.message}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Warnings ──────────────────────────────────────────────────── */}
        {readiness.warnings.length > 0 && (
          <div data-testid="warnings-list" style={{ marginBottom: '0.75rem' }}>
            <h3 className="font-sans-sm" style={{ margin: '0 0 0.5rem' }}>
              Warnings ({readiness.warnings.length})
            </h3>
            <ul className="usa-list" style={{ marginTop: 0 }}>
              {readiness.warnings.map((w, i) => (
                <li key={`${w.section_id}-${i}`}>{w.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Attachment status ─────────────────────────────────────────── */}
        {readiness.attachment_status.length > 0 && (
          <div data-testid="attachment-status" style={{ marginBottom: '0.75rem' }}>
            <h3 className="font-sans-sm" style={{ margin: '0 0 0.5rem' }}>
              Required Attachments
            </h3>
            <ul className="usa-list usa-list--unstyled" style={{ marginTop: 0 }}>
              {readiness.attachment_status.map((att) => (
                <li key={att.requirement_id} style={{ padding: '0.25rem 0' }}>
                  <span aria-hidden="true">{att.is_fulfilled ? '✓' : '✗'} </span>
                  <span>{att.document_type}</span>
                  {att.document_name && (
                    <span className="usa-hint"> ({att.document_name})</span>
                  )}
                  {att.is_required && !att.is_fulfilled && (
                    <span className="usa-tag usa-tag--error" style={{ marginLeft: '0.5rem' }}>
                      Required
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </aside>
  );
}
