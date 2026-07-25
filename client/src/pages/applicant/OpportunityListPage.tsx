import { useState, useEffect, useCallback } from 'react';
import { OpportunityCard, OpportunityListItem } from './components/OpportunityCard';
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
 * Applicant-facing opportunity search and listing page.
 *
 * Implements PRD-INTAKE-014 (F14) search and filter:
 * - Two-column layout: SearchFilters (1/3) + card results (2/3)
 * - USWDS usa-card-group with OpportunityCard components
 * - Pagination with USWDS usa-pagination
 * - Empty state with usa-alert
 * - No auth required — publicly accessible
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
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = result ? Math.ceil(result.total / (params.page_size ?? 20)) : 0;
  const currentPage = params.page ?? 1;

  return (
    <div className="usa-layout-docs">
      {/* Skip to main content */}
      <a className="usa-skipnav" href="#main-content">
        Skip to main content
      </a>

      {/* App header with nav */}
      <header className="usa-header usa-header--basic" role="banner">
        <div className="usa-nav-container">
          <div className="usa-navbar">
            <div className="usa-logo">
              <em className="usa-logo__text">GrantsIntake</em>
            </div>
          </div>
          <nav aria-label="Primary navigation" className="usa-nav">
            <ul className="usa-nav__primary usa-accordion">
              <li className="usa-nav__primary-item">
                <a href="/opportunities" className="usa-nav__link usa-current" aria-current="page">
                  <span>Find Opportunities</span>
                </a>
              </li>
              <li className="usa-nav__primary-item">
                <a href="/login" className="usa-nav__link">
                  <span>Sign In</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <div className="usa-section">
          <div className="grid-container">
            {/* Page heading */}
            <div className="usa-prose" style={{ marginBottom: '1.5rem' }}>
              <h1>Funding Opportunities</h1>
            </div>

            <div className="grid-row grid-gap">
              {/* Filters sidebar — 1/3 width */}
              <div
                className="desktop:grid-col-4"
                style={{
                  borderRight: '1px solid #dfe1e2',
                  paddingRight: '1.5rem',
                }}
              >
                <SearchFilters params={params} onChange={handleFilterChange} />
              </div>

              {/* Results area — 2/3 width */}
              <div className="desktop:grid-col-8">
                {/* Results count + sort info */}
                {result && !loading && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    <p className="usa-prose" style={{ margin: 0 }}>
                      Showing {((currentPage - 1) * (params.page_size ?? 20)) + 1}–
                      {Math.min(currentPage * (params.page_size ?? 20), result.total)} of{' '}
                      {result.total} result{result.total !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                {/* Loading state */}
                {loading && (
                  <div
                    aria-busy="true"
                    aria-label="Loading opportunities"
                    style={{ textAlign: 'center', padding: '3rem', color: '#565c65' }}
                  >
                    <span className="usa-sr-only">Loading opportunities…</span>
                    <div>Loading opportunities…</div>
                  </div>
                )}

                {/* Error state */}
                {error && !loading && (
                  <div className="usa-alert usa-alert--error" role="alert">
                    <div className="usa-alert__body">
                      <h4 className="usa-alert__heading">Error loading opportunities</h4>
                      <p className="usa-alert__text">{error}</p>
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {!loading && !error && result && result.opportunities.length === 0 && (
                  <div className="usa-alert usa-alert--info" role="status">
                    <div className="usa-alert__body">
                      <h4 className="usa-alert__heading">No opportunities found</h4>
                      <p className="usa-alert__text">
                        No opportunities match your current filters. Try broadening your search.
                      </p>
                    </div>
                  </div>
                )}

                {/* Card grid */}
                {!loading && !error && result && result.opportunities.length > 0 && (
                  <ul className="usa-card-group">
                    {result.opportunities.map((opp) => (
                      <OpportunityCard key={opp.opportunity_id} opportunity={opp} />
                    ))}
                  </ul>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                  <nav aria-label="Pagination" className="usa-pagination" style={{ marginTop: '2rem' }}>
                    <ul className="usa-pagination__list">
                      {currentPage > 1 && (
                        <li className="usa-pagination__item usa-pagination__arrow">
                          <button
                            type="button"
                            className="usa-pagination__link usa-pagination__previous-page"
                            aria-label="Previous page"
                            onClick={() =>
                              handleFilterChange({ ...params, page: currentPage - 1 })
                            }
                          >
                            ‹ Previous
                          </button>
                        </li>
                      )}
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <li key={pageNum} className="usa-pagination__item">
                            <button
                              type="button"
                              className={`usa-pagination__button${currentPage === pageNum ? ' usa-current' : ''}`}
                              aria-label={`Page ${pageNum}`}
                              aria-current={currentPage === pageNum ? 'page' : undefined}
                              onClick={() =>
                                handleFilterChange({ ...params, page: pageNum })
                              }
                            >
                              {pageNum}
                            </button>
                          </li>
                        );
                      })}
                      {currentPage < totalPages && (
                        <li className="usa-pagination__item usa-pagination__arrow">
                          <button
                            type="button"
                            className="usa-pagination__link usa-pagination__next-page"
                            aria-label="Next page"
                            onClick={() =>
                              handleFilterChange({ ...params, page: currentPage + 1 })
                            }
                          >
                            Next ›
                          </button>
                        </li>
                      )}
                    </ul>
                  </nav>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
