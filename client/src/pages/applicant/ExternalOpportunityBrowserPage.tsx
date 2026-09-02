import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { externalOpportunitiesApi } from '../../api/externalOpportunitiesApi';
import { ExternalOpportunityCard } from '../../components/ExternalOpportunityCard';
import type {
  ExternalOpportunity,
  ExternalOpportunityFilterParams,
} from '../../types/externalOpportunity';
import { useAuthStore } from '../../store/authStore';

const PAGE_SIZE = 25;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'posted', label: 'Posted' },
  { value: 'forecasted', label: 'Forecasted' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
];

interface FilterState {
  status: string; // single status (checkbox group, one active at a time server-side)
  agency: string;
  keyword: string;
  due_after: string;
  due_before: string;
  award_min: string;
  award_max: string;
}

const EMPTY_FILTERS: FilterState = {
  status: '',
  agency: '',
  keyword: '',
  due_after: '',
  due_before: '',
  award_min: '',
  award_max: '',
};

/**
 * ExternalOpportunityBrowserPage — Browse Grants.gov opportunities.
 * Two-column layout: filter sidebar (left) + paginated results (right).
 * Renders inside ApplicantLayout at /applicant/grants-gov (PRD-INTAKE-019C).
 */
export function ExternalOpportunityBrowserPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  // Applied filters drive the query; draft filters hold in-progress edits.
  const [applied, setApplied] = useState<FilterState>(EMPTY_FILTERS);
  const [draft, setDraft] = useState<FilterState>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const queryParams = useMemo<ExternalOpportunityFilterParams>(() => {
    const params: ExternalOpportunityFilterParams = {
      page,
      limit: PAGE_SIZE,
    };
    if (applied.status) params.status = applied.status;
    if (applied.agency) params.agency = applied.agency;
    if (applied.keyword) params.keyword = applied.keyword;
    if (applied.due_after) params.due_after = applied.due_after;
    if (applied.due_before) params.due_before = applied.due_before;
    if (applied.award_min) params.award_min = Number(applied.award_min);
    if (applied.award_max) params.award_max = Number(applied.award_max);
    return params;
  }, [applied, page]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['external-opportunities', queryParams],
    queryFn: () =>
      externalOpportunitiesApi
        .listExternalOpportunities(queryParams)
        .then((r) => r.data),
  });

  // Saved set (only when authenticated) so cards can render the correct toggle.
  const { data: savedData } = useQuery({
    queryKey: ['external-opportunities', 'saved'],
    queryFn: () => externalOpportunitiesApi.listSaved().then((r) => r.data),
    enabled: !!accessToken,
  });

  const savedIds = useMemo(
    () => new Set((savedData?.items ?? []).map((o) => o.id)),
    [savedData],
  );

  const saveMutation = useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
      saved
        ? externalOpportunitiesApi.unsaveOpportunity(id)
        : externalOpportunitiesApi.saveOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['external-opportunities', 'saved'],
      });
    },
  });

  const handleToggleSave = (opp: ExternalOpportunity) => {
    if (!accessToken) return;
    saveMutation.mutate({ id: opp.id, saved: savedIds.has(opp.id) });
  };

  const applyFilters = () => {
    setPage(1);
    setApplied(draft);
  };

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
  };

  const toggleStatus = (value: string) => {
    setDraft((d) => ({ ...d, status: d.status === value ? '' : value }));
  };

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const items = data?.items ?? [];

  return (
    <div>
      <div style={{ display: 'flex', gap: 0 }}>
        {/* ── Filter sidebar ─────────────────────────────────── */}
        <aside
          className="gf-filter-panel"
          aria-label="Opportunity filters"
          style={{
            width: '280px',
            flexShrink: 0,
            borderRight: '1px solid var(--gf-border, #e2e8f0)',
            padding: '24px',
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Filters</h2>

          <fieldset
            className="gf-form-group"
            style={{ border: 'none', padding: 0, margin: '0 0 16px' }}
          >
            <legend style={{ fontWeight: 600, marginBottom: '8px' }}>
              Status
            </legend>
            {STATUS_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                style={{ display: 'block', marginBottom: '4px' }}
              >
                <input
                  type="checkbox"
                  className="gf-checkbox"
                  data-testid={`filter-status-${opt.value}`}
                  checked={draft.status === opt.value}
                  onChange={() => toggleStatus(opt.value)}
                />{' '}
                {opt.label}
              </label>
            ))}
          </fieldset>

          <div className="gf-form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="filter-agency" style={{ fontWeight: 600 }}>
              Agency
            </label>
            <input
              id="filter-agency"
              type="text"
              className="gf-input"
              data-testid="filter-agency"
              placeholder="e.g. HHS"
              value={draft.agency}
              onChange={(e) =>
                setDraft((d) => ({ ...d, agency: e.target.value }))
              }
            />
          </div>

          <div className="gf-form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="filter-keyword" style={{ fontWeight: 600 }}>
              Keyword
            </label>
            <input
              id="filter-keyword"
              type="text"
              className="gf-input"
              data-testid="filter-keyword"
              placeholder="Search title or eligibility"
              value={draft.keyword}
              onChange={(e) =>
                setDraft((d) => ({ ...d, keyword: e.target.value }))
              }
            />
          </div>

          <div className="gf-form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="filter-due-after" style={{ fontWeight: 600 }}>
              Due date from
            </label>
            <input
              id="filter-due-after"
              type="date"
              className="gf-input"
              data-testid="filter-due-after"
              value={draft.due_after}
              onChange={(e) =>
                setDraft((d) => ({ ...d, due_after: e.target.value }))
              }
            />
            <label
              htmlFor="filter-due-before"
              style={{ fontWeight: 600, marginTop: '8px', display: 'block' }}
            >
              Due date to
            </label>
            <input
              id="filter-due-before"
              type="date"
              className="gf-input"
              data-testid="filter-due-before"
              value={draft.due_before}
              onChange={(e) =>
                setDraft((d) => ({ ...d, due_before: e.target.value }))
              }
            />
          </div>

          <div className="gf-form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="filter-award-min" style={{ fontWeight: 600 }}>
              Award ceiling min
            </label>
            <input
              id="filter-award-min"
              type="number"
              className="gf-input"
              data-testid="filter-award-min"
              value={draft.award_min}
              onChange={(e) =>
                setDraft((d) => ({ ...d, award_min: e.target.value }))
              }
            />
            <label
              htmlFor="filter-award-max"
              style={{ fontWeight: 600, marginTop: '8px', display: 'block' }}
            >
              Award floor max
            </label>
            <input
              id="filter-award-max"
              type="number"
              className="gf-input"
              data-testid="filter-award-max"
              value={draft.award_max}
              onChange={(e) =>
                setDraft((d) => ({ ...d, award_max: e.target.value }))
              }
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="gf-btn gf-btn--primary gf-btn--sm"
              data-testid="apply-filters"
              onClick={applyFilters}
            >
              Apply
            </button>
            <button
              type="button"
              className="gf-btn gf-btn--outline gf-btn--sm"
              data-testid="clear-filters"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        </aside>

        {/* ── Results panel ──────────────────────────────────── */}
        <div style={{ flex: 1, padding: '24px', minWidth: 0 }}>
          <div className="gf-page-header">
            <h1 className="gf-page-title">Browse Grants.gov Opportunities</h1>
            <span
              className="gf-badge gf-badge--info"
              data-testid="source-attribution-badge"
            >
              Powered by Grants.gov API
            </span>
          </div>

          {!isLoading && !isError && (
            <p
              className="gf-page-subtitle"
              role="status"
              aria-live="polite"
              style={{ marginTop: '8px' }}
            >
              {total} opportunit{total === 1 ? 'y' : 'ies'} found
            </p>
          )}

          {isLoading && (
            <div
              className="gf-loading"
              aria-busy="true"
              aria-label="Loading opportunities"
              data-testid="opportunities-loading"
            >
              <div className="gf-skeleton" style={{ height: 120 }} />
              <span className="gf-sr-only">Loading opportunities…</span>
              Loading opportunities…
            </div>
          )}

          {isError && (
            <div className="gf-alert gf-alert--error" role="alert">
              <div>
                <p className="gf-alert__title">Error loading opportunities</p>
                <p className="gf-alert__text">
                  Could not load Grants.gov opportunities. Please try again.
                </p>
              </div>
            </div>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <div
              className="gf-alert gf-alert--info"
              role="status"
              data-testid="opportunities-empty"
            >
              <div>
                <p className="gf-alert__title">No opportunities found</p>
                <p className="gf-alert__text">
                  No opportunities found. Try adjusting your filters.
                </p>
              </div>
            </div>
          )}

          {!isLoading && !isError && items.length > 0 && (
            <ul
              className="gf-opp-cards-grid"
              style={{ padding: 0, margin: 0 }}
            >
              {items.map((opp) => (
                <ExternalOpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  isSaved={savedIds.has(opp.id)}
                  onToggleSave={handleToggleSave}
                  saveDisabled={!accessToken || saveMutation.isPending}
                />
              ))}
            </ul>
          )}

          {!isLoading && totalPages > 1 && (
            <nav aria-label="Pagination" style={{ marginTop: '16px' }}>
              <ul className="gf-pagination">
                <li>
                  <button
                    type="button"
                    className="gf-pagination__btn"
                    aria-label="Previous page"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ← Previous
                  </button>
                </li>
                <li>
                  <span
                    className="gf-pagination__btn current"
                    data-testid="pagination-current"
                  >
                    Page {page} of {totalPages}
                  </span>
                </li>
                <li>
                  <button
                    type="button"
                    className="gf-pagination__btn"
                    aria-label="Next page"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next →
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
