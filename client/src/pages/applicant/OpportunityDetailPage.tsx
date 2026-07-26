import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { AddendaTimeline } from './components/AddendaTimeline';

type StatusBadge = 'open' | 'closing_soon' | 'closed' | 'not_yet_open';
type WorkspaceStatus = 'start' | 'continue' | 'closed' | 'sign_in';

interface EligibilityRule {
  rule_id: string;
  rule_type: string;
  severity: 'hard_blocker' | 'advisory';
  explanation_text: string;
  enforcement_point?: string;
}

interface AttachmentRequirement {
  requirement_id: string;
  document_type: string;
  custom_document_name?: string;
  stage_scope: string;
  is_required: boolean;
  instructions?: string;
  max_file_size_mb: number;
}

interface OpportunityDetail {
  opportunity_id: string;
  title: string;
  funder_name: string | null;
  program_area: string;
  executive_summary: string;
  eligibility_summary: string;
  funding_amount_max: number | null;
  funding_amount_min: number | null;
  application_open_date: string | null;
  application_close_date: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  public_slug: string | null;
  status: string;
  status_badge: StatusBadge;
  eligibility_rules: EligibilityRule[];
  attachment_requirements: AttachmentRequirement[];
  addenda_count: number;
}

const STATUS_BADGE_LABELS: Record<StatusBadge, string> = {
  open: 'Open',
  closing_soon: 'Closing Soon',
  closed: 'Closed',
  not_yet_open: 'Not Yet Open',
};

const STATUS_BADGE_COLORS: Record<StatusBadge, string> = {
  open: '#00a91c',
  closing_soon: '#e5a000',
  closed: '#71767a',
  not_yet_open: '#005ea2',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'TBD';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return 'TBD';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((groups, item) => {
    const groupKey = String(item[key]);
    return { ...groups, [groupKey]: [...(groups[groupKey] ?? []), item] };
  }, {} as Record<string, T[]>);
}

/**
 * Public opportunity detail page.
 *
 * Implements PRD-INTAKE-017 (F16) and PRD-INTAKE-018 (F17):
 * - Breadcrumbs for navigation (WCAG 2.1 AA)
 * - Status badge prominently displayed
 * - Two-column layout: main content + sticky sidebar
 * - Eligibility rules grouped by severity (hard_blocker first)
 * - Attachment requirements table grouped by stage_scope
 * - AddendaTimeline component for Updates & Addenda section
 * - Context-aware CTA button:
 *   - Unauthenticated → "Sign In to Apply"
 *   - Authenticated, no workspace → "Start Application"
 *   - Authenticated, has workspace → "Continue Application"
 *   - Past deadline → "Application Period Closed"
 *
 * Security: No dangerouslySetInnerHTML used — XSS safe (T-02-17)
 */
export function OpportunityDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [opportunity, setOpportunity] = useState<OpportunityDetail | null>(null);
  const [workspaceStatus, setWorkspaceStatus] = useState<WorkspaceStatus>('sign_in');
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    fetch(`/api/v1/opportunities/${slug}`)
      .then((res) => {
        if (res.status === 404) throw new Error('Opportunity not found');
        if (!res.ok) throw new Error('Failed to load opportunity');
        return res.json() as Promise<OpportunityDetail>;
      })
      .then((data) => {
        setOpportunity(data);
        setLoading(false);

        // Fetch workspace status if authenticated
        if (accessToken) {
          fetch(`/api/v1/opportunities/${data.opportunity_id}/workspace-status`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
            .then((res) => {
              if (!res.ok) return null;
              return res.json() as Promise<{ status: WorkspaceStatus; workspace_id?: string }>;
            })
            .then((wsData) => {
              if (wsData) {
                setWorkspaceStatus(wsData.status);
                if (wsData.workspace_id) {
                  setWorkspaceId(wsData.workspace_id);
                }
              }
            })
            .catch(() => {/* ignore workspace status error */});
        }
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug, accessToken]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#565c65' }}>
        <span className="usa-sr-only">Loading opportunity details…</span>
        <div aria-busy="true" aria-label="Loading">Loading opportunity details…</div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="grid-container" style={{ paddingTop: '2rem' }}>
        <div className="usa-alert usa-alert--error" role="alert">
          <div className="usa-alert__body">
            <h4 className="usa-alert__heading">Opportunity Not Found</h4>
            <p className="usa-alert__text">{error ?? 'This opportunity could not be loaded.'}</p>
            <Link to="/opportunities" className="usa-link">
              ← Back to Funding Opportunities
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Group eligibility rules: hard_blocker first, then advisory
  const hardBlockers = opportunity.eligibility_rules.filter(
    (r) => r.severity === 'hard_blocker',
  );
  const advisory = opportunity.eligibility_rules.filter(
    (r) => r.severity === 'advisory',
  );

  // Group attachments by stage_scope
  const attachmentsByStage = groupBy(opportunity.attachment_requirements, 'stage_scope');
  const stageOrder = ['pre_application', 'loi', 'full_application'];
  const stageScopeLabels: Record<string, string> = {
    pre_application: 'Pre-Application',
    loi: 'Letter of Intent (LOI)',
    full_application: 'Full Application',
  };

  // CTA button configuration
  const renderCTA = () => {
    if (!accessToken) {
      // Unauthenticated → "Sign In to Apply"
      const redirectPath = opportunity.public_slug
        ? `/opportunities/${opportunity.public_slug}`
        : `/opportunities/${opportunity.opportunity_id}`;
      return (
        <a
          href={`/login?redirect=${encodeURIComponent(redirectPath)}`}
          className="usa-button usa-button--big"
          style={{ width: '100%', textAlign: 'center' }}
        >
          Sign In to Apply
        </a>
      );
    }

    if (workspaceStatus === 'closed') {
      return (
        <button
          type="button"
          className="usa-button usa-button--big"
          disabled
          style={{ width: '100%', backgroundColor: '#71767a', cursor: 'not-allowed' }}
          aria-disabled="true"
        >
          Application Period Closed
        </button>
      );
    }

    if (workspaceStatus === 'continue' && workspaceId) {
      return (
        <a
          href={`/workspaces/${workspaceId}`}
          className="usa-button usa-button--big"
          style={{ width: '100%', textAlign: 'center' }}
        >
          Continue Application
        </a>
      );
    }

    // 'start' or default
    return (
      <a
        href={`/apply/${opportunity.opportunity_id}`}
        className="usa-button usa-button--big"
        style={{ width: '100%', textAlign: 'center' }}
      >
        Start Application
      </a>
    );
  };

  return (
    <>
      {/* App header */}
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
                <Link to="/opportunities" className="usa-nav__link">
                  <span>Find Opportunities</span>
                </Link>
              </li>
              <li className="usa-nav__primary-item">
                {accessToken ? (
                  <Link to="/grantor/dashboard" className="usa-nav__link">
                    <span>Dashboard</span>
                  </Link>
                ) : (
                  <a href="/login" className="usa-nav__link">
                    <span>Sign In</span>
                  </a>
                )}
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <div className="usa-section">
          <div className="grid-container">
            {/* Breadcrumbs — WCAG 2.1 AA */}
            <nav aria-label="Breadcrumb" className="usa-breadcrumb">
              <ol className="usa-breadcrumb__list">
                <li className="usa-breadcrumb__list-item">
                  <a href="/" className="usa-breadcrumb__link">
                    Home
                  </a>
                </li>
                <li className="usa-breadcrumb__list-item">
                  <Link to="/opportunities" className="usa-breadcrumb__link">
                    Funding Opportunities
                  </Link>
                </li>
                <li
                  className="usa-breadcrumb__list-item usa-current"
                  aria-current="page"
                >
                  {opportunity.title}
                </li>
              </ol>
            </nav>

            {/* Page title + status badge */}
            <div
              className="usa-prose"
              style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}
            >
              <div>
                <h1 style={{ marginBottom: '0.5rem' }}>{opportunity.title}</h1>
                <span
                  style={{
                    display: 'inline-block',
                    backgroundColor: STATUS_BADGE_COLORS[opportunity.status_badge],
                    color: 'white',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '2px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                  }}
                >
                  {STATUS_BADGE_LABELS[opportunity.status_badge]}
                </span>
              </div>
            </div>

            {/* Two-column layout */}
            <div className="grid-row grid-gap">
              {/* Main content — 2/3 width */}
              <div className="desktop:grid-col-8">
                {/* Overview */}
                <section aria-labelledby="overview-heading" style={{ marginBottom: '2rem' }}>
                  <h2 id="overview-heading">Overview</h2>
                  <div className="usa-prose">
                    <p>{opportunity.executive_summary}</p>
                    {opportunity.funder_name && (
                      <p>
                        <strong>Funder:</strong> {opportunity.funder_name}
                      </p>
                    )}
                    <p>
                      <strong>Program Area:</strong> {opportunity.program_area}
                    </p>
                  </div>
                </section>

                {/* Eligibility */}
                <section aria-labelledby="eligibility-heading" style={{ marginBottom: '2rem' }}>
                  <h2 id="eligibility-heading">Eligibility</h2>

                  {opportunity.eligibility_rules.length === 0 ? (
                    <div className="usa-prose">
                      <p>{opportunity.eligibility_summary}</p>
                    </div>
                  ) : (
                    <>
                      {/* Hard blockers first */}
                      {hardBlockers.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h3 style={{ fontSize: '1rem', color: '#b50909' }}>
                            ⚠ Hard Requirements
                          </h3>
                          <ul className="usa-list">
                            {hardBlockers.map((rule) => (
                              <li key={rule.rule_id}>
                                <span aria-label="Hard requirement" style={{ marginRight: '0.5rem' }}>🚫</span>
                                {rule.explanation_text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Advisory requirements */}
                      {advisory.length > 0 && (
                        <div>
                          <h3 style={{ fontSize: '1rem', color: '#e5a000' }}>
                            Advisory Requirements
                          </h3>
                          <ul className="usa-list">
                            {advisory.map((rule) => (
                              <li key={rule.rule_id}>
                                <span aria-label="Advisory requirement" style={{ marginRight: '0.5rem' }}>⚠</span>
                                {rule.explanation_text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </section>

                {/* Required Documents */}
                {opportunity.attachment_requirements.length > 0 && (
                  <section aria-labelledby="documents-heading" style={{ marginBottom: '2rem' }}>
                    <h2 id="documents-heading">Required Documents</h2>
                    {stageOrder
                      .filter((stage) => attachmentsByStage[stage])
                      .map((stage) => (
                        <div key={stage} style={{ marginBottom: '1.5rem' }}>
                          <h3 style={{ fontSize: '1rem' }}>
                            {stageScopeLabels[stage] ?? stage}
                          </h3>
                          <table className="usa-table usa-table--borderless" style={{ width: '100%' }}>
                            <thead>
                              <tr>
                                <th scope="col">Document</th>
                                <th scope="col">Max Size</th>
                                <th scope="col">Required</th>
                              </tr>
                            </thead>
                            <tbody>
                              {attachmentsByStage[stage].map((req) => (
                                <tr key={req.requirement_id}>
                                  <td>
                                    {req.custom_document_name ?? req.document_type}
                                    {req.instructions && (
                                      <p
                                        style={{
                                          margin: '0.25rem 0 0',
                                          fontSize: '0.875rem',
                                          color: '#565c65',
                                        }}
                                      >
                                        {req.instructions}
                                      </p>
                                    )}
                                  </td>
                                  <td>{req.max_file_size_mb} MB</td>
                                  <td>{req.is_required ? 'Required' : 'Recommended'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                  </section>
                )}

                {/* Updates & Addenda */}
                <section aria-labelledby="addenda-heading" style={{ marginBottom: '2rem' }}>
                  <h2 id="addenda-heading">Updates &amp; Addenda</h2>
                  <AddendaTimeline opportunityId={opportunity.opportunity_id} />
                </section>
              </div>

              {/* Sidebar — 1/3 width, sticky */}
              <aside
                className="desktop:grid-col-4"
                style={{
                  position: 'sticky',
                  top: '1rem',
                  alignSelf: 'flex-start',
                }}
              >
                <div
                  style={{
                    border: '1px solid #dfe1e2',
                    borderRadius: '4px',
                    padding: '1.5rem',
                    backgroundColor: '#f0f0f0',
                  }}
                >
                  {/* Funding */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    {opportunity.funding_amount_max && (
                      <div>
                        <p
                          style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', color: '#565c65' }}
                        >
                          Maximum Award
                        </p>
                        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                          {formatCurrency(opportunity.funding_amount_max)}
                        </p>
                      </div>
                    )}
                    {opportunity.funding_amount_min && (
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#565c65' }}>
                        Minimum: {formatCurrency(opportunity.funding_amount_min)}
                      </p>
                    )}
                  </div>

                  {/* Dates */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    {opportunity.application_open_date && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <p
                          style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', color: '#565c65' }}
                        >
                          Applications Open
                        </p>
                        <p style={{ margin: 0 }}>{formatDate(opportunity.application_open_date)}</p>
                      </div>
                    )}
                    {opportunity.application_close_date && (
                      <div>
                        <p
                          style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', color: '#565c65' }}
                        >
                          Applications Close
                        </p>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>
                          {formatDate(opportunity.application_close_date)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <div style={{ marginBottom: '1rem' }}>{renderCTA()}</div>

                  {/* Check Eligibility link — shown when authenticated and opportunity is published */}
                  {accessToken && opportunity?.opportunity_id && opportunity.status === 'published' && (
                    <div style={{ marginBottom: '1rem' }}>
                      <Link
                        to={`/applicant/opportunities/${opportunity.opportunity_id}/prescreen`}
                        className="usa-button usa-button--outline"
                        style={{ width: '100%', textAlign: 'center', display: 'block' }}
                        data-testid="check-eligibility-link"
                      >
                        Check Eligibility
                      </Link>
                    </div>
                  )}

                  {/* Contact */}
                  <div
                    style={{
                      borderTop: '1px solid #dfe1e2',
                      paddingTop: '1rem',
                      fontSize: '0.875rem',
                    }}
                  >
                    <p style={{ margin: '0 0 0.25rem', fontWeight: 'bold' }}>Contact</p>
                    <p style={{ margin: '0 0 0.25rem' }}>{opportunity.contact_name}</p>
                    <a href={`mailto:${opportunity.contact_email}`} className="usa-link">
                      {opportunity.contact_email}
                    </a>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
