import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { OpportunityCard } from './components/OpportunityCard';
import type { OpportunityListItem } from './components/OpportunityCard';
import { SearchFilters } from './components/SearchFilters';

interface OpportunitySearchParams {
  keyword?: string;
  funder?: string;
  program_area?: string;
  geography?: string;
  eligibility_type?: string;
  funding_min?: number;
  funding_max?: number;
  due_date_from?: string;
  due_date_to?: string;
  application_stage?: string;
  sort_by?: 'relevance' | 'deadline' | 'amount';
  page?: number;
  page_size?: number;
}

interface SearchResult {
  opportunities: OpportunityListItem[];
  total: number;
  page: number;
  page_size: number;
}

function buildSearchUrl(params: OpportunitySearchParams): string {
  const query = new URLSearchParams();
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.funder) query.set('funder', params.funder);
  if (params.program_area) query.set('program_area', params.program_area);
  if (params.geography) query.set('geography', params.geography);
  if (params.eligibility_type) query.set('eligibility_type', params.eligibility_type);
  if (params.funding_min !== undefined) query.set('funding_min', String(params.funding_min));
  if (params.funding_max !== undefined) query.set('funding_max', String(params.funding_max));
  if (params.due_date_from) query.set('due_date_from', params.due_date_from);
  if (params.due_date_to) query.set('due_date_to', params.due_date_to);
  if (params.application_stage) query.set('application_stage', params.application_stage);
  if (params.sort_by) query.set('sort_by', params.sort_by);
  if (params.page && params.page > 1) query.set('page', String(params.page));
  if (params.page_size) query.set('page_size', String(params.page_size));
  return `/api/v1/opportunities?${query.toString()}`;
}

/**
 * Opportunity search/listing — GrantFlow Design System v1.0.
 * Standalone page (no auth required).
 * Two-column: filter panel left + results right.
 * WCAG 2.1 AA: skip nav, aria labels, role="status" on results count.
 */
export function OpportunityListPage() {
  const [params, setParams] = useState<OpportunitySearchParams>({ page: 1, page_size: 20 });
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpportunities = useCallback((searchParams: OpportunitySearchParams) => {
    setLoading(true);
    setError(null);

    fetch(buildSearchUrl(searchParams))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load opportunities');
        return res.json() as Promise<SearchResult>;
      })
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchOpportunities(params);
  }, [fetchOpportunities, params]);

  const handleFilterChange = (newParams: OpportunitySearchParams) => {
    setParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = result ? Math.ceil(result.total / (params.page_size ?? 20)) : 0;
  const currentPage = params.page ?? 1;
  const pageSize = params.page_size ?? 20;

  return (
    <div className="gf-shell">
      <a className="gf-skipnav" href="#main-content">Skip to main content</a>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="gf-header" role="banner">
        <span className="gf-header__logo">GrantFlow</span>
        <span className="gf-header__spacer" />
        <nav aria-label="Primary navigation" style={{ display: 'flex', gap: '8px' }}>
          <a
            href="/opportunities"
            className="gf-btn gf-btn--ghost gf-btn--sm"
            aria-current="page"
            style={{ color: 'var(--gf-primary-dark)', fontWeight: 600 }}
          >
            Find Opportunities
          </a>
          <Link to="/login" className="gf-btn gf-btn--outline gf-btn--sm">
            Sign in
          </Link>
        </nav>
      </header>

      {/* ── Main content ────────────────────────────────────────── */}
      <main id="main-content" tabIndex={-1} style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 0, height: '100%' }}>

          {/* ── Filters sidebar ───────────────────────────────── */}
          <aside
            aria-label="Search filters"
            style={{
              width: '280px',
              flexShrink: 0,
              borderRight: '1px solid var(--gf-border)',
              padding: '24px',
              background: 'var(--gf-white)',
            }}
          >
            <SearchFilters params={params} onChange={handleFilterChange} />
          </aside>

          {/* ── Results area ──────────────────────────────────── */}
          <div style={{ flex: 1, padding: '24px', minWidth: 0 }}>
            {/* Page header */}
            <div className="gf-page-header">
              <h1 className="gf-page-title">Funding Opportunities</h1>
              {result && !loading && (
                <p className="gf-page-subtitle" role="status" aria-live="polite">
                  Showing {((currentPage - 1) * pageSize) + 1}–
                  {Math.min(currentPage * pageSize, result.total)} of {result.total} result
                  {result.total !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Loading */}
            {loading && (
              <div className="gf-loading" aria-busy="true" aria-label="Loading opportunities">
                <span className="gf-sr-only">Loading opportunities…</span>
                Loading opportunities…
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="gf-alert gf-alert--error" role="alert">
                <div>
                  <p className="gf-alert__title">Error loading opportunities</p>
                  <p className="gf-alert__text">{error}</p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && result && result.opportunities.length === 0 && (
              <div className="gf-alert gf-alert--info" role="status">
                <div>
                  <p className="gf-alert__title">No opportunities found</p>
                  <p className="gf-alert__text">
                    No opportunities match your current filters. Try broadening your search.
                  </p>
                </div>
              </div>
            )}

            {/* Opportunity cards */}
            {!loading && !error && result && result.opportunities.length > 0 && (
              <ul className="gf-opp-cards-grid" style={{ padding: 0, margin: 0 }}>
                {result.opportunities.map((opp) => (
                  <OpportunityCard key={opp.opportunity_id} opportunity={opp} />
                ))}
              </ul>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <nav aria-label="Pagination">
                <ul className="gf-pagination">
                  <li>
                    <button
                      type="button"
                      className="gf-pagination__btn"
                      aria-label="Previous page"
                      disabled={currentPage === 1}
                      onClick={() => handleFilterChange({ ...params, page: currentPage - 1 })}
                    >
                      ← Previous
                    </button>
                  </li>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <li key={pageNum}>
                        <button
                          type="button"
                          className={`gf-pagination__btn${currentPage === pageNum ? ' current' : ''}`}
                          aria-label={`Page ${pageNum}`}
                          aria-current={currentPage === pageNum ? 'page' : undefined}
                          onClick={() => handleFilterChange({ ...params, page: pageNum })}
                        >
                          {pageNum}
                        </button>
                      </li>
                    );
                  })}
                  <li>
                    <button
                      type="button"
                      className="gf-pagination__btn"
                      aria-label="Next page"
                      disabled={currentPage >= totalPages}
                      onClick={() => handleFilterChange({ ...params, page: currentPage + 1 })}
                    >
                      Next →
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
