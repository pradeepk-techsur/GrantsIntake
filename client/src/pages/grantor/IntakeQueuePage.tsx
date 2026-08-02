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

const STATUS_TAG_STYLES: Record<DispositionStatus, React.CSSProperties> = {
  pending_screening: { backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', padding: '2px 8px', fontSize: '0.8rem', fontWeight: 600 },
  accepted_for_review: { backgroundColor: '#e3f2fd', color: '#1565c0', borderRadius: '4px', padding: '2px 8px', fontSize: '0.8rem', fontWeight: 600 },
  returned_for_correction: { backgroundColor: '#fff8e1', color: '#f57f17', borderRadius: '4px', padding: '2px 8px', fontSize: '0.8rem', fontWeight: 600 },
  ineligible: { backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', padding: '2px 8px', fontSize: '0.8rem', fontWeight: 600 },
  late: { backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', padding: '2px 8px', fontSize: '0.8rem', fontWeight: 600 },
  duplicate: { backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', padding: '2px 8px', fontSize: '0.8rem', fontWeight: 600 },
  withdrawn: { backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', padding: '2px 8px', fontSize: '0.8rem', fontWeight: 600 },
  administratively_rejected: { backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', padding: '2px 8px', fontSize: '0.8rem', fontWeight: 600 },
};

function formatCurrency(amount: number | null): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * IntakeQueuePage — Grantor intake queue listing.
 *
 * Route: /grantor/intake-queue
 * Shows sortable/filterable table of submitted applications for screening.
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
    queueQuery.refetch();
  }

  function handleViewEntry(entryId: string) {
    navigate(`/grantor/intake-queue/${entryId}`);
  }

  return (
    <div className="usa-prose">
      <h1>Intake Queue</h1>

      {/* Filter bar */}
      <form className="usa-form" onSubmit={handleFilterSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="usa-form-group" style={{ marginBottom: 0 }}>
          <label className="usa-label" htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            className="usa-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '180px' }}
          >
            <option value="">All Statuses</option>
            {(Object.keys(DISPOSITION_LABELS) as DispositionStatus[]).map((status) => (
              <option key={status} value={status}>
                {DISPOSITION_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="usa-form-group" style={{ marginBottom: 0 }}>
          <label className="usa-label" htmlFor="sort-filter">Sort By</label>
          <select
            id="sort-filter"
            className="usa-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ width: 'auto', minWidth: '180px' }}
          >
            <option value="submission_date">Submission Date</option>
            <option value="org_name">Organization Name</option>
            <option value="funding_amount">Funding Amount</option>
            <option value="eligibility_result">Eligibility Result</option>
          </select>
        </div>

        <button type="submit" className="usa-button usa-button--outline" style={{ marginTop: '0.5rem' }}>
          Apply Filters
        </button>
      </form>

      {/* Loading state */}
      {queueQuery.isLoading && (
        <div aria-busy="true" aria-label="Loading queue entries">
          Loading...
        </div>
      )}

      {/* Error state */}
      {queueQuery.isError && (
        <div className="usa-alert usa-alert--error" role="alert">
          <div className="usa-alert__body">
            <p className="usa-alert__text">Failed to load the intake queue. Please try again.</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!queueQuery.isLoading && !queueQuery.isError && entries.length === 0 && (
        <div className="usa-alert usa-alert--info" role="status">
          <div className="usa-alert__body">
            <p className="usa-alert__text">No applications in the intake queue yet.</p>
          </div>
        </div>
      )}

      {/* Queue table */}
      {entries.length > 0 && (
        <>
          <p style={{ color: '#666', marginBottom: '0.5rem' }}>
            Showing {entries.length} of {total} entries
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="usa-table usa-table--borderless usa-table--striped" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th scope="col">Organization</th>
                  <th scope="col">Opportunity</th>
                  <th scope="col">Submission Date</th>
                  <th scope="col">Eligibility Result</th>
                  <th scope="col">Requested Amount</th>
                  <th scope="col">Attachments</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry: QueueEntrySummary) => (
                  <tr key={entry.entry_id} style={{ cursor: 'pointer' }} onClick={() => handleViewEntry(entry.entry_id)}>
                    <td>{entry.org_name}</td>
                    <td>{entry.opportunity_title}</td>
                    <td>{formatDate(entry.submission_timestamp)}</td>
                    <td>{entry.eligibility_result ?? '—'}</td>
                    <td>{formatCurrency(entry.requested_amount)}</td>
                    <td>{entry.attachment_count}</td>
                    <td>
                      <span style={STATUS_TAG_STYLES[entry.status]}>
                        {DISPOSITION_LABELS[entry.status]}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="usa-button usa-button--unstyled"
                        onClick={(e) => { e.stopPropagation(); handleViewEntry(entry.entry_id); }}
                        aria-label={`View entry for ${entry.org_name}`}
                        data-testid="view-entry-button"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="usa-pagination" aria-label="Pagination">
              <ul className="usa-pagination__list">
                <li className="usa-pagination__item">
                  <button
                    type="button"
                    className="usa-pagination__link usa-pagination__previous-page"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-disabled={page === 1}
                  >
                    &laquo; Previous
                  </button>
                </li>
                <li className="usa-pagination__item">
                  <span aria-current="page">Page {page} of {totalPages}</span>
                </li>
                <li className="usa-pagination__item">
                  <button
                    type="button"
                    className="usa-pagination__link usa-pagination__next-page"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-disabled={page === totalPages}
                  >
                    Next &raquo;
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
