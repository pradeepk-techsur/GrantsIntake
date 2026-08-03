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

function badgeClass(status: StatusBadge): string {
  switch (status) {
    case 'open':         return 'gf-badge gf-badge--open';
    case 'closing_soon': return 'gf-badge gf-badge--closing';
    case 'closed':       return 'gf-badge gf-badge--closed';
    case 'not_yet_open': return 'gf-badge gf-badge--pending';
    default:             return 'gf-badge gf-badge--neutral';
  }
}

function badgeLabel(status: StatusBadge): string {
  switch (status) {
    case 'open':         return 'Open';
    case 'closing_soon': return 'Closing soon';
    case 'closed':       return 'Closed';
    case 'not_yet_open': return 'Not yet open';
    default:             return status;
  }
}

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
    month: 'short',
    day: 'numeric',
  });
}

interface OpportunityCardProps {
  opportunity: OpportunityListItem;
}

/**
 * Opportunity card — GrantFlow Design System v1.0.
 * Clean horizontal card with status badge, funder, amount, deadline, CTA.
 * WCAG 2.1 AA: aria-label on detail link, semantic heading hierarchy.
 */
export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const detailPath = opportunity.public_slug
    ? `/opportunities/${opportunity.public_slug}`
    : `/opportunities/${opportunity.opportunity_id}`;

  return (
    <li style={{ listStyle: 'none' }} data-testid="opportunity-card">
      <div className="gf-opp-card">
        <div className="gf-opp-card__header">
          <h3 style={{ margin: 0, flex: 1 }}>
            <Link to={detailPath} className="gf-opp-card__title">
              {opportunity.title}
            </Link>
          </h3>
          <span className={badgeClass(opportunity.status_badge)}>
            {badgeLabel(opportunity.status_badge)}
          </span>
        </div>

        <div className="gf-opp-card__meta">
          {opportunity.funder_name && (
            <span>{opportunity.funder_name}</span>
          )}
          <span>{opportunity.program_area}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <span className="gf-opp-card__amount">
              {formatCurrency(opportunity.max_award_amount)}
            </span>
            {opportunity.application_close_date && (
              <span className="gf-opp-card__deadline" style={{ marginLeft: '12px' }}>
                Closes {formatDate(opportunity.application_close_date)}
              </span>
            )}
          </div>
          <Link
            to={detailPath}
            className="gf-btn gf-btn--outline gf-btn--sm"
            aria-label={`View details for ${opportunity.title}`}
          >
            View details
          </Link>
        </div>
      </div>
    </li>
  );
}
