import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { intakeQueueApi } from '../../api/intakeQueueApi';
import type { QueueEntrySummary, DispositionStatus } from '../../types/intakeQueue';

const DISPOSITION_LABELS: Record<DispositionStatus, string> = {
  pending_screening: 'Pending Screening',
  accepted_for_review: 'Accepted for Review',
  returned_for_correction: 'Returned for Correction',
  ineligible: 'Ineligible',
  late: 'Late',
  duplicate: 'Duplicate',
  withdrawn: 'Withdrawn',
  administratively_rejected: 'Administratively Rejected',
};

function statusBadgeClass(status: DispositionStatus): string {
  switch (status) {
    case 'accepted_for_review': return 'gf-badge gf-badge--success';
    case 'pending_screening':   return 'gf-badge gf-badge--pending';
    case 'returned_for_correction': return 'gf-badge gf-badge--warning';
    case 'ineligible':
    case 'late':
    case 'duplicate':
    case 'withdrawn':
    case 'administratively_rejected': return 'gf-badge gf-badge--error';
    default: return 'gf-badge gf-badge--neutral';
  }
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * IntakeQueuePage — GrantFlow Design System v1.0.
 * Matches Figma "Operational components" table layout.
 * Route: /grantor/intake-queue
 */
export function IntakeQueuePage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('submission_date');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const queueQuery = useQuery({
    queryKey: ['intake-queue', statusFilter, sortBy, page],
    queryFn: () =>
      intakeQueueApi.listEntries({
        status: statusFilter || undefined,
        sort_by: sortBy,
        page,
        page_size: PAGE_SIZE,
      }).then((res) => res.data),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const entries = queueQuery.data?.entries ?? [];
  const total = queueQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    void queueQuery.refetch();
  }

  function handleViewEntry(entryId: string) {
    navigate(`/grantor/intake-queue/${entryId}`);
  }

  return (
    <div>
      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="gf-page-header">
        <h1 className="gf-page-title">Intake Queue</h1>
        <p className="gf-page-subtitle">
          Review and screen submitted applications.
        </p>
      </div>

      {/* ── Filter bar ───────────────────────────────────────────── */}
      <form className="gf-filter-bar" onSubmit={handleFilterSubmit}>
        <div className="gf-form-group">
          <label className="gf-label" htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            className="gf-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ minWidth: '180px', fontSize: '13px', padding: '7px 32px 7px 10px' }}
          >
            <option value="">All statuses</option>
            {(Object.keys(DISPOSITION_LABELS) as DispositionStatus[]).map((status) => (
              <option key={status} value={status}>
                {DISPOSITION_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="gf-form-group">
          <label className="gf-label" htmlFor="sort-filter">Sort by</label>
          <select
            id="sort-filter"
            className="gf-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ minWidth: '180px', fontSize: '13px', padding: '7px 32px 7px 10px' }}
          >
            <option value="submission_date">Submission date</option>
            <option value="org_name">Organization name</option>
            <option value="funding_amount">Funding amount</option>
            <option value="eligibility_result">Eligibility result</option>
          </select>
        </div>

        <button type="submit" className="gf-btn gf-btn--outline gf-btn--sm" style={{ alignSelf: 'flex-end' }}>
          Apply filters
        </button>
      </form>

      {/* ── Loading ───────────────────────────────────────────────── */}
      {queueQuery.isLoading && (
        <div className="gf-loading" aria-busy="true" aria-label="Loading queue entries">
          Loading…
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────── */}
      {queueQuery.isError && (
        <div className="gf-alert gf-alert--error" role="alert">
          <p className="gf-alert__text">Failed to load the intake queue. Please try again.</p>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────── */}
      {!queueQuery.isLoading && !queueQuery.isError && entries.length === 0 && (
        <div className="gf-alert gf-alert--info" role="status">
          <div>
            <p className="gf-alert__title">No applications</p>
            <p className="gf-alert__text">No applications in the intake queue yet.</p>
          </div>
        </div>
      )}

      {/* ── Queue table ──────────────────────────────────────────── */}
      {entries.length > 0 && (
        <>
          <p style={{ fontSize: '13px', color: 'var(--gf-muted)', marginBottom: '8px' }}>
            Showing {entries.length} of {total} entries
          </p>

          <div className="gf-card">
            <div className="gf-table-wrap">
              <table className="gf-table">
                <thead>
                  <tr>
                    <th scope="col">Application</th>
                    <th scope="col">Applicant</th>
                    <th scope="col">Opportunity</th>
                    <th scope="col">Status</th>
                    <th scope="col">Due date</th>
                    <th scope="col">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry: QueueEntrySummary) => (
                    <tr
                      key={entry.entry_id}
                      onClick={() => handleViewEntry(entry.entry_id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 600, color: 'var(--gf-primary)' }}>
                        {entry.entry_id.slice(0, 12).toUpperCase()}
                      </td>
                      <td>{entry.org_name}</td>
                      <td style={{ color: 'var(--gf-muted)' }}>{entry.opportunity_title}</td>
                      <td>
                        <span className={statusBadgeClass(entry.status)}>
                          {DISPOSITION_LABELS[entry.status]}
                        </span>
                      </td>
                      <td style={{ color: 'var(--gf-muted)' }}>
                        {formatDate(entry.submission_timestamp)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="gf-btn gf-btn--ghost gf-btn--sm"
                          onClick={(e) => { e.stopPropagation(); handleViewEntry(entry.entry_id); }}
                          aria-label={`View entry for ${entry.org_name}`}
                          data-testid="view-entry-button"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Pagination ─────────────────────────────────────── */}
          {totalPages > 1 && (
            <nav aria-label="Pagination">
              <ul className="gf-pagination">
                <li>
                  <button
                    type="button"
                    className="gf-pagination__btn"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-disabled={page === 1}
                    aria-label="Previous page"
                  >
                    ← Previous
                  </button>
                </li>
                <li>
                  <span
                    style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--gf-muted)' }}
                    aria-current="page"
                  >
                    Page {page} of {totalPages}
                  </span>
                </li>
                <li>
                  <button
                    type="button"
                    className="gf-pagination__btn"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-disabled={page === totalPages}
                    aria-label="Next page"
                  >
                    Next →
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
