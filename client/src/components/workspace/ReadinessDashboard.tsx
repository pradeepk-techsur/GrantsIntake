import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { workspaceApi } from '../../api/workspaceApi';

interface ReadinessDashboardProps {
  workspaceId: string;
}

/**
 * ReadinessDashboard — GrantFlow Design System v1.0.
 * Sticky right panel matching Figma "Application readiness" component.
 * Shows: completion %, readiness badge, checklist of complete/attention items,
 * required attachments, and submit CTA.
 * Polls every 30 seconds (PRD-INTAKE-035).
 */
export function ReadinessDashboard({ workspaceId }: ReadinessDashboardProps) {
  const navigate = useNavigate();
  const {
    data: readiness,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['readiness', workspaceId],
    queryFn: () => workspaceApi.getReadiness(workspaceId),
    refetchInterval: 30_000,
    staleTime: 20_000,
    enabled: !!workspaceId,
  });

  if (isLoading) {
    return (
      <div className="gf-loading">Loading readiness…</div>
    );
  }

  if (isError || !readiness) {
    return (
      <div className="gf-alert gf-alert--warning" role="alert">
        <p className="gf-alert__text">Readiness data unavailable</p>
      </div>
    );
  }

  const pct = readiness.overall_completion_pct;
  const isComplete = pct === 100;
  const hasBlocking = readiness.blocking_errors.length > 0;

  return (
    <aside
      aria-label="Application Readiness"
      data-testid="readiness-dashboard"
      className="gf-card"
      style={{ position: 'sticky', top: '72px' }}
    >
      <div className="gf-card__header" style={{ justifyContent: 'space-between' }}>
        <h2 className="gf-card__title">Application readiness</h2>
        <span style={{ fontWeight: 700, color: 'var(--gf-ink)', fontSize: '16px' }}>
          {pct}%
        </span>
      </div>

      <div className="gf-card__body" style={{ padding: '16px 20px' }}>
        {/* Progress bar */}
        <div
          className="gf-progress"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${pct}% complete`}
          data-testid="completion-pct"
          style={{ marginBottom: '16px' }}
        >
          <div
            className={`gf-progress__bar${isComplete ? ' gf-progress__bar--complete' : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Readiness status */}
        <div style={{ marginBottom: '16px' }} data-testid="ready-to-submit-banner">
          {readiness.is_ready_to_submit ? (
            <div className="gf-alert gf-alert--success" style={{ marginBottom: 0 }}>
              <p className="gf-alert__text">Ready to submit</p>
            </div>
          ) : (
            <div className="gf-alert gf-alert--info" style={{ marginBottom: 0 }}>
              <p className="gf-alert__text">Not ready to submit</p>
            </div>
          )}
        </div>

        {/* Authorized rep */}
        <div style={{ marginBottom: '12px' }} data-testid="authorized-rep-status">
          {readiness.authorized_rep_assigned ? (
            <span className="gf-badge gf-badge--success">Authorized rep assigned</span>
          ) : (
            <span className="gf-badge gf-badge--warning">No authorized rep</span>
          )}
        </div>

        {/* Blocking errors */}
        {hasBlocking && (
          <div data-testid="blocking-errors" style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gf-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
              Needs attention
            </p>
            <ul className="gf-checklist">
              {readiness.blocking_errors.map((err, i) => (
                <li key={`${err.section_id}-${err.error_code}-${i}`} className="gf-checklist__item">
                  <span className="gf-checklist__icon gf-checklist__icon--block" aria-hidden="true">✗</span>
                  <a href={err.link} style={{ color: 'var(--gf-error)', fontSize: '13px', textDecoration: 'underline' }}>
                    {err.section_name && `${err.section_name}: `}{err.message}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Complete sections */}
        {readiness.blocking_errors.length === 0 && pct > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gf-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
              Complete
            </p>
            <ul className="gf-checklist">
              <li className="gf-checklist__item">
                <span className="gf-checklist__icon gf-checklist__icon--ok" aria-hidden="true">✓</span>
                <span style={{ fontSize: '13px' }}>Application information</span>
              </li>
              {readiness.authorized_rep_assigned && (
                <li className="gf-checklist__item">
                  <span className="gf-checklist__icon gf-checklist__icon--ok" aria-hidden="true">✓</span>
                  <span style={{ fontSize: '13px' }}>Authorized representative</span>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {readiness.warnings.length > 0 && (
          <div data-testid="warnings-list" style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gf-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
              Warnings ({readiness.warnings.length})
            </p>
            <ul className="gf-checklist">
              {readiness.warnings.map((w, i) => (
                <li key={`${w.section_id}-${i}`} className="gf-checklist__item">
                  <span className="gf-checklist__icon gf-checklist__icon--warn" aria-hidden="true">!</span>
                  <span style={{ fontSize: '13px' }}>{w.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Attachment status */}
        {readiness.attachment_status.length > 0 && (
          <div data-testid="attachment-status" style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gf-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
              Required attachments
            </p>
            <ul className="gf-checklist">
              {readiness.attachment_status.map((att) => (
                <li key={att.requirement_id} className="gf-checklist__item">
                  <span
                    className={`gf-checklist__icon ${att.is_fulfilled ? 'gf-checklist__icon--ok' : 'gf-checklist__icon--block'}`}
                    aria-hidden="true"
                  >
                    {att.is_fulfilled ? '✓' : '✗'}
                  </span>
                  <span style={{ fontSize: '13px' }}>
                    {att.document_type}
                    {att.document_name && (
                      <span style={{ color: 'var(--gf-muted)' }}> ({att.document_name})</span>
                    )}
                    {att.is_required && !att.is_fulfilled && (
                      <span className="gf-badge gf-badge--error" style={{ marginLeft: '6px' }}>Required</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* CTA footer */}
      <div className="gf-card__footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
        <Link
          to={`/applicant/workspaces/${workspaceId}/preview`}
          className="gf-btn gf-btn--outline gf-btn--sm"
          style={{ justifyContent: 'center' }}
          data-testid="readiness-preview-link"
        >
          Preview application
        </Link>

        <button
          type="button"
          className="gf-btn gf-btn--primary"
          style={{ justifyContent: 'center' }}
          disabled={hasBlocking || !readiness.is_ready_to_submit}
          aria-disabled={hasBlocking || !readiness.is_ready_to_submit}
          onClick={() => {
            if (readiness.is_ready_to_submit && !hasBlocking) {
              navigate(`/applicant/workspaces/${workspaceId}/certify-submit`);
            }
          }}
          data-testid="submit-application-btn"
        >
          Submit application
        </button>
        {(hasBlocking || !readiness.is_ready_to_submit) && (
          <p style={{ fontSize: '12px', color: 'var(--gf-muted)', textAlign: 'center', margin: '2px 0 0' }}>
            Resolve all blocking errors before submitting.
          </p>
        )}
      </div>
    </aside>
  );
}
