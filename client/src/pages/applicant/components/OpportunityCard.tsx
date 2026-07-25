import { Link } from 'react-router-dom';

export type StatusBadge = 'open' | 'closing_soon' | 'closed' | 'not_yet_open';

export interface OpportunityListItem {
  opportunity_id: string;
  title: string;
  funder_name: string | null;
  program_area: string;
  max_award_amount: number | null;
  application_close_date: string | null;
  status_badge: StatusBadge;
  public_slug: string | null;
}

interface StatusBadgeConfig {
  label: string;
  className: string;
}

const STATUS_BADGE_CONFIG: Record<StatusBadge, StatusBadgeConfig> = {
  open: { label: 'Open', className: 'usa-tag usa-tag--green' },
  closing_soon: { label: 'Closing Soon', className: 'usa-tag usa-tag--yellow' },
  closed: { label: 'Closed', className: 'usa-tag usa-tag--gray' },
  not_yet_open: { label: 'Not Yet Open', className: 'usa-tag usa-tag--blue' },
};

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return 'Amount TBD';
  return `Up to ${new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'TBD';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface OpportunityCardProps {
  opportunity: OpportunityListItem;
}

/**
 * USWDS usa-card component for a single opportunity in the list view.
 * Displays status badge, title, funder, program area, funding amount, and deadline.
 * WCAG 2.1 AA: "View Details" link includes aria-label with opportunity title.
 */
export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const badge = STATUS_BADGE_CONFIG[opportunity.status_badge] ?? STATUS_BADGE_CONFIG.open;
  const detailPath = opportunity.public_slug
    ? `/opportunities/${opportunity.public_slug}`
    : `/opportunities/${opportunity.opportunity_id}`;

  return (
    <li className="usa-card tablet:grid-col-6">
      <div className="usa-card__container">
        <div className="usa-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 className="usa-card__heading" style={{ flex: 1, marginRight: '0.5rem' }}>
              <Link to={detailPath} className="usa-link">
                {opportunity.title}
              </Link>
            </h3>
            <span
              className={badge.className}
              style={{
                backgroundColor:
                  opportunity.status_badge === 'open'
                    ? '#00a91c'
                    : opportunity.status_badge === 'closing_soon'
                    ? '#e5a000'
                    : opportunity.status_badge === 'closed'
                    ? '#71767a'
                    : '#005ea2',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '2px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
              }}
            >
              {badge.label}
            </span>
          </div>
        </div>

        <div className="usa-card__body">
          {opportunity.funder_name && (
            <p className="usa-prose" style={{ marginBottom: '0.25rem', color: '#565c65' }}>
              <strong>Funder:</strong> {opportunity.funder_name}
            </p>
          )}
          <p className="usa-prose" style={{ marginBottom: '0.25rem', color: '#565c65' }}>
            <strong>Program Area:</strong> {opportunity.program_area}
          </p>
          <p className="usa-prose" style={{ marginBottom: '0.25rem' }}>
            <strong>{formatCurrency(opportunity.max_award_amount)}</strong>
          </p>
          <p className="usa-prose" style={{ marginBottom: 0, color: '#565c65' }}>
            <strong>Deadline:</strong> {formatDate(opportunity.application_close_date)}
          </p>
        </div>

        <div className="usa-card__footer">
          <Link
            to={detailPath}
            className="usa-button usa-button--outline"
            aria-label={`View details for ${opportunity.title}`}
          >
            View Details
          </Link>
        </div>
      </div>
    </li>
  );
}
