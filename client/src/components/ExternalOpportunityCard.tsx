import { Link } from 'react-router-dom';
import type { ExternalOpportunity } from '../types/externalOpportunity';

/** Map a Grants.gov opportunity status to a GrantFlow badge variant + label. */
export function statusBadgeClass(status: string | null): string {
  switch ((status ?? '').toLowerCase()) {
    case 'posted':
      return 'gf-badge gf-badge--success';
    case 'forecasted':
      return 'gf-badge gf-badge--info';
    case 'closed':
      return 'gf-badge gf-badge--neutral';
    case 'archived':
      return 'gf-badge gf-badge--muted';
    default:
      return 'gf-badge gf-badge--neutral';
  }
}

export function statusBadgeLabel(status: string | null): string {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatCurrency(amount: number | null): string | null {
  if (amount === null || amount === undefined) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatAwardRange(
  ceiling: number | null,
  floor: number | null,
): string {
  const c = formatCurrency(ceiling);
  const f = formatCurrency(floor);
  if (c && f) return `${f} – ${c}`;
  if (c) return `Up to ${c}`;
  if (f) return `From ${f}`;
  return 'Award amount not specified';
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'TBD';
  return new Date(`${dateStr.slice(0, 10)}T00:00:00Z`).toLocaleDateString(
    'en-US',
    { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' },
  );
}

/** True when a due date falls within the next 14 days (inclusive). */
export function isDueSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const due = new Date(`${dateStr.slice(0, 10)}T00:00:00Z`).getTime();
  const now = Date.now();
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;
  return due >= now && due - now <= fourteenDays;
}

function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

interface ExternalOpportunityCardProps {
  opportunity: ExternalOpportunity;
  isSaved: boolean;
  onToggleSave: (opportunity: ExternalOpportunity) => void;
  saveDisabled?: boolean;
}

/**
 * ExternalOpportunityCard — GrantFlow Design System v1.0.
 * Displays a single Grants.gov opportunity with status badge, agency, award
 * range, due date (highlighted within 14 days), eligibility summary, a
 * save/unsave heart toggle, and a link to the detail page (PRD-INTAKE-019C).
 */
export function ExternalOpportunityCard({
  opportunity,
  isSaved,
  onToggleSave,
  saveDisabled = false,
}: ExternalOpportunityCardProps) {
  const detailPath = `/applicant/grants-gov/${opportunity.id}`;
  const dueSoon = isDueSoon(opportunity.due_date);

  return (
    <li style={{ listStyle: 'none' }} data-testid="external-opportunity-card">
      <div className="gf-opp-card">
        <div className="gf-opp-card__header">
          <h3 style={{ margin: 0, flex: 1 }}>
            <Link to={detailPath} className="gf-opp-card__title">
              {opportunity.title}
            </Link>
          </h3>
          <span className={statusBadgeClass(opportunity.opportunity_status)}>
            {statusBadgeLabel(opportunity.opportunity_status)}
          </span>
        </div>

        <div className="gf-opp-card__meta">
          {opportunity.agency && <span>{opportunity.agency}</span>}
          <span>FON: {opportunity.source_opportunity_number}</span>
          {opportunity.source_assistance_listing && (
            <span>ALN: {opportunity.source_assistance_listing}</span>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            margin: '8px 0',
          }}
        >
          <span className="gf-opp-card__amount">
            {formatAwardRange(
              opportunity.award_ceiling,
              opportunity.award_floor,
            )}
          </span>
          <span
            className="gf-opp-card__deadline"
            data-testid="external-opportunity-due"
            style={
              dueSoon
                ? { color: 'var(--gf-warning, #b45309)', fontWeight: 600 }
                : undefined
            }
          >
            Due {formatDate(opportunity.due_date)}
            {dueSoon ? ' (soon)' : ''}
          </span>
        </div>

        {opportunity.eligibility_summary && (
          <p
            style={{
              margin: '4px 0 12px',
              color: 'var(--gf-text-muted, #555)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {truncate(opportunity.eligibility_summary)}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <button
            type="button"
            className="gf-btn gf-btn--ghost gf-btn--sm"
            data-testid="external-opportunity-save"
            aria-pressed={isSaved}
            aria-label={
              isSaved
                ? `Remove ${opportunity.title} from saved`
                : `Save ${opportunity.title}`
            }
            disabled={saveDisabled}
            onClick={() => onToggleSave(opportunity)}
          >
            <span aria-hidden="true">{isSaved ? '♥' : '♡'}</span>{' '}
            {isSaved ? 'Saved' : 'Save'}
          </button>
          <Link
            to={detailPath}
            className="gf-btn gf-btn--outline gf-btn--sm"
            aria-label={`View details for ${opportunity.title}`}
          >
            View Details
          </Link>
        </div>
      </div>
    </li>
  );
}
