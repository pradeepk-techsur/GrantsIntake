import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { intakeQueueApi } from '../../api/intakeQueueApi';
import type { QueueEntryDetail, DispositionRecord, DispositionStatus } from '../../types/intakeQueue';

const DISPOSITION_OPTIONS: { value: DispositionStatus; label: string }[] = [
  { value: 'accepted_for_review', label: 'Accepted for Review' },
  { value: 'returned_for_correction', label: 'Returned for Correction' },
  { value: 'ineligible', label: 'Ineligible' },
  { value: 'late', label: 'Late' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'administratively_rejected', label: 'Administratively Rejected' },
];

const STATUS_TAG_STYLES: Record<DispositionStatus, React.CSSProperties> = {
  pending_screening: { backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', padding: '2px 8px', fontSize: '0.85rem', fontWeight: 600 },
  accepted_for_review: { backgroundColor: '#e3f2fd', color: '#1565c0', borderRadius: '4px', padding: '2px 8px', fontSize: '0.85rem', fontWeight: 600 },
  returned_for_correction: { backgroundColor: '#fff8e1', color: '#f57f17', borderRadius: '4px', padding: '2px 8px', fontSize: '0.85rem', fontWeight: 600 },
  ineligible: { backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', padding: '2px 8px', fontSize: '0.85rem', fontWeight: 600 },
  late: { backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', padding: '2px 8px', fontSize: '0.85rem', fontWeight: 600 },
  duplicate: { backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', padding: '2px 8px', fontSize: '0.85rem', fontWeight: 600 },
  withdrawn: { backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', padding: '2px 8px', fontSize: '0.85rem', fontWeight: 600 },
  administratively_rejected: { backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', padding: '2px 8px', fontSize: '0.85rem', fontWeight: 600 },
};

function formatCurrency(amount: number | null): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function dispositionLabel(status: DispositionStatus): string {
  return DISPOSITION_OPTIONS.find((d) => d.value === status)?.label ?? status;
}

/**
 * IntakeQueueDetailPage — Full detail view for a single queue entry.
 *
 * Route: /grantor/intake-queue/:entryId
 * Shows snapshot summary, validation info, org profile, disposition form, and history.
 */
export function IntakeQueueDetailPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const queryClient = useQueryClient();

  const [dispositionValue, setDispositionValue] = useState<DispositionStatus | ''>('');
  const [rationale, setRationale] = useState('');
  const [dispositionSuccess, setDispositionSuccess] = useState(false);
  const [dispositionError, setDispositionError] = useState<string | null>(null);

  const entryQuery = useQuery<QueueEntryDetail>({
    queryKey: ['intake-queue-entry', entryId],
    queryFn: () => intakeQueueApi.getEntryDetail(entryId!).then((res) => res.data),
    enabled: !!entryId,
  });

  const snapshotsQuery = useQuery({
    queryKey: ['intake-queue-snapshots', entryId],
    queryFn: () => intakeQueueApi.listSnapshots(entryId!).then((res) => res.data),
    enabled: !!entryId,
  });

  const dispositionMutation = useMutation({
    mutationFn: (body: { disposition: string; rationale?: string }) =>
      intakeQueueApi.applyDisposition(entryId!, body),
    onSuccess: () => {
      setDispositionSuccess(true);
      setDispositionError(null);
      setDispositionValue('');
      setRationale('');
      queryClient.invalidateQueries({ queryKey: ['intake-queue-entry', entryId] });
      queryClient.invalidateQueries({ queryKey: ['intake-queue'] });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string; error?: string } } };
      setDispositionError(
        axiosErr.response?.data?.message ??
        axiosErr.response?.data?.error ??
        'Failed to apply disposition. Please try again.',
      );
    },
  });

  function handleDispositionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dispositionValue) return;

    const requiresRationale = dispositionValue !== 'accepted_for_review';
    if (requiresRationale && !rationale.trim()) {
      setDispositionError('Rationale is required for non-acceptance dispositions.');
      return;
    }

    setDispositionError(null);
    setDispositionSuccess(false);
    dispositionMutation.mutate({
      disposition: dispositionValue,
      rationale: rationale.trim() || undefined,
    });
  }

  if (entryQuery.isLoading) {
    return <div aria-busy="true">Loading entry details...</div>;
  }

  if (entryQuery.isError) {
    return (
      <div className="usa-alert usa-alert--error" role="alert">
        <div className="usa-alert__body">
          <p className="usa-alert__text">Failed to load entry details.</p>
        </div>
      </div>
    );
  }

  const entry = entryQuery.data;
  if (!entry) return null;

  const isPendingScreening = entry.status === 'pending_screening';
  const orgProfile = (entry.org_profile_snapshot ?? {}) as Record<string, string | null | undefined>;
  const validationSummary = entry.validation_summary;
  const snapshots = (snapshotsQuery.data as { snapshots?: unknown[] })?.snapshots ?? [];

  return (
    <div className="usa-prose">
      {/* Back link */}
      <Link to="/grantor/intake-queue" className="usa-link" style={{ display: 'inline-block', marginBottom: '1rem' }}>
        ← Back to Intake Queue
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <h1 style={{ marginBottom: 0 }}>{entry.org_name}</h1>
        <code style={{ fontSize: '0.9rem', color: '#555' }}>#{entry.confirmation_number}</code>
        <span style={STATUS_TAG_STYLES[entry.status]}>
          {dispositionLabel(entry.status)}
        </span>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

        {/* Application Summary Card */}
        <div className="usa-card">
          <div className="usa-card__header">
            <h2 className="usa-card__heading">Application Summary</h2>
          </div>
          <div className="usa-card__body">
            <dl style={{ margin: 0 }}>
              <dt><strong>Opportunity</strong></dt>
              <dd>{entry.opportunity_title}</dd>
              <dt style={{ marginTop: '0.75rem' }}><strong>Submitted At</strong></dt>
              <dd>{formatDate(entry.submission_timestamp)}</dd>
              <dt style={{ marginTop: '0.75rem' }}><strong>Requested Amount</strong></dt>
              <dd>{formatCurrency(entry.requested_amount)}</dd>
              <dt style={{ marginTop: '0.75rem' }}><strong>Attachments</strong></dt>
              <dd>{entry.attachment_count}</dd>
              <dt style={{ marginTop: '0.75rem' }}><strong>Eligibility Result</strong></dt>
              <dd>{entry.eligibility_result ?? '—'}</dd>
              {entry.routed_to && (
                <>
                  <dt style={{ marginTop: '0.75rem' }}><strong>Routing</strong></dt>
                  <dd>{entry.routed_to}</dd>
                </>
              )}
            </dl>
          </div>
        </div>

        {/* Validation Summary Card */}
        <div className="usa-card">
          <div className="usa-card__header">
            <h2 className="usa-card__heading">Validation Summary</h2>
          </div>
          <div className="usa-card__body">
            {!validationSummary ||
            (typeof validationSummary === 'object' &&
              (validationSummary as Record<string, unknown>).warnings === 0 &&
              (validationSummary as Record<string, unknown>).info === 0) ? (
              <p>No validation errors at time of submission.</p>
            ) : (
              <table className="usa-table usa-table--borderless" style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(validationSummary as Record<string, unknown>).map(([key, val]) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{String(val)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Applicant Org Profile Card */}
        <div className="usa-card">
          <div className="usa-card__header">
            <h2 className="usa-card__heading">Applicant Organization</h2>
          </div>
          <div className="usa-card__body">
            <dl style={{ margin: 0 }}>
              {orgProfile.legal_name && (
                <>
                  <dt><strong>Legal Name</strong></dt>
                  <dd>{orgProfile.legal_name}</dd>
                </>
              )}
              {orgProfile.entity_type && (
                <>
                  <dt style={{ marginTop: '0.75rem' }}><strong>Entity Type</strong></dt>
                  <dd>{orgProfile.entity_type}</dd>
                </>
              )}
              {orgProfile.uei && (
                <>
                  <dt style={{ marginTop: '0.75rem' }}><strong>UEI</strong></dt>
                  <dd>{orgProfile.uei}</dd>
                </>
              )}
              {orgProfile.sam_status && (
                <>
                  <dt style={{ marginTop: '0.75rem' }}><strong>SAM Status</strong></dt>
                  <dd>{orgProfile.sam_status}</dd>
                </>
              )}
              {orgProfile.primary_contact_name && (
                <>
                  <dt style={{ marginTop: '0.75rem' }}><strong>Primary Contact</strong></dt>
                  <dd>
                    {orgProfile.primary_contact_name}
                    {orgProfile.primary_contact_email && (
                      <> — {orgProfile.primary_contact_email}</>
                    )}
                  </dd>
                </>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Screening Disposition Form — shown only for pending_screening */}
      {isPendingScreening && (
        <section aria-label="Apply Screening Disposition" style={{ marginBottom: '2rem' }}>
          <h2>Apply Screening Disposition</h2>

          {dispositionSuccess && (
            <div className="usa-alert usa-alert--success" role="status">
              <div className="usa-alert__body">
                <p className="usa-alert__text">Disposition applied. Applicant has been notified.</p>
              </div>
            </div>
          )}

          {dispositionError && (
            <div className="usa-alert usa-alert--error" role="alert">
              <div className="usa-alert__body">
                <p className="usa-alert__text">{dispositionError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleDispositionSubmit}>
            <fieldset className="usa-fieldset">
              <legend className="usa-legend">Apply Screening Disposition</legend>

              <div className="usa-form-group">
                <label className="usa-label" htmlFor="disposition-select">
                  Disposition <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  id="disposition-select"
                  className="usa-select"
                  value={dispositionValue}
                  onChange={(e) => {
                    setDispositionValue(e.target.value as DispositionStatus | '');
                    setDispositionError(null);
                  }}
                  required
                >
                  <option value="">— Select a disposition —</option>
                  {DISPOSITION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rationale — shown and required for non-acceptance */}
              {dispositionValue && dispositionValue !== 'accepted_for_review' && (
                <div className="usa-form-group">
                  <label className="usa-label" htmlFor="rationale-textarea">
                    Rationale (required) <span style={{ color: 'red' }}>*</span>
                  </label>
                  <textarea
                    id="rationale-textarea"
                    className="usa-textarea"
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    rows={4}
                    aria-required="true"
                    placeholder="Provide the rationale for this screening decision..."
                    data-testid="rationale-textarea"
                  />
                </div>
              )}

              <button
                type="submit"
                className="usa-button"
                disabled={dispositionMutation.isPending || !dispositionValue}
              >
                {dispositionMutation.isPending ? 'Applying...' : 'Apply Disposition'}
              </button>
            </fieldset>
          </form>
        </section>
      )}

      {/* Disposition History */}
      <section aria-label="Disposition History" style={{ marginBottom: '2rem' }}>
        <h2>Disposition History</h2>
        {entry.disposition_history.length === 0 ? (
          <p>No disposition history yet.</p>
        ) : (
          <table className="usa-table usa-table--borderless" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th scope="col">Disposition</th>
                <th scope="col">Applied By</th>
                <th scope="col">Applied At</th>
                <th scope="col">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {entry.disposition_history.map((d: DispositionRecord) => (
                <tr key={d.disposition_id}>
                  <td>
                    <span style={STATUS_TAG_STYLES[d.disposition]}>
                      {dispositionLabel(d.disposition)}
                    </span>
                  </td>
                  <td>{d.applied_by}</td>
                  <td>{formatDate(d.applied_at)}</td>
                  <td>{d.rationale ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Submission Snapshots */}
      <section aria-label="Submission Snapshots" style={{ marginBottom: '2rem' }}>
        <h2>Submission Snapshots</h2>
        {snapshots.length === 0 ? (
          <p>No snapshot information available.</p>
        ) : (
          <table className="usa-table usa-table--borderless" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th scope="col">Confirmation Number</th>
                <th scope="col">Submitted At</th>
                <th scope="col">Version</th>
              </tr>
            </thead>
            <tbody>
              {(snapshots as Array<{
                snapshot_id: string;
                confirmation_number: string;
                submitted_at: string;
                is_original: boolean;
                is_current: boolean;
              }>).map((snap) => (
                <tr key={snap.snapshot_id}>
                  <td><code>{snap.confirmation_number}</code></td>
                  <td>{formatDate(snap.submitted_at)}</td>
                  <td>
                    {snap.is_original && (
                      <span style={{ backgroundColor: '#e3f2fd', color: '#1565c0', borderRadius: '4px', padding: '1px 6px', fontSize: '0.75rem', marginRight: '4px' }}>
                        Original
                      </span>
                    )}
                    {snap.is_current && (
                      <span style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', padding: '1px 6px', fontSize: '0.75rem' }}>
                        Current
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
