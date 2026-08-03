import { Link } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/useCurrentUser';

function hasRole(roles: string[], ...check: string[]): boolean {
  return roles.some((r) => check.includes(r));
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Grantor dashboard — GrantFlow Design System v1.0.
 * Matches Figma "Program operations" layout:
 * - Stat summary row (awaiting review, overdue actions, active portfolio)
 * - Work queue table (work item, program, status, due date, priority, owner)
 */
export function Dashboard() {
  const { user, grantor_memberships, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="gf-loading" aria-busy="true">
        Loading dashboard…
      </div>
    );
  }

  const allRoles = grantor_memberships.flatMap((m) => m.roles);
  const isProgramOfficerOrAdmin = hasRole(allRoles, 'grantor_admin', 'program_officer');
  const isIntakeAdmin = hasRole(allRoles, 'intake_administrator');
  const greeting = getGreeting();

  if (isProgramOfficerOrAdmin) {
    return (
      <div>
        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="gf-page-header">
          <h1 className="gf-page-title">Program operations</h1>
          <p className="gf-page-subtitle">Work requiring attention across your portfolio.</p>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────── */}
        <div className="gf-stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="gf-stat-card">
            <p className="gf-stat-card__label">Awaiting review</p>
            <p className="gf-stat-card__value">12</p>
            <p className="gf-stat-card__sub">Applications ready for reviewer assignment.</p>
          </div>
          <div className="gf-stat-card">
            <p className="gf-stat-card__label">Overdue actions</p>
            <p className="gf-stat-card__value" style={{ color: 'var(--gf-error)' }}>5</p>
            <p className="gf-stat-card__sub">Monitoring activities require escalation.</p>
          </div>
          <div className="gf-stat-card">
            <p className="gf-stat-card__label">Active portfolio</p>
            <p className="gf-stat-card__value">$8.4M</p>
            <p className="gf-stat-card__sub">24 active awards across 6 programs.</p>
          </div>
        </div>

        {/* ── Work queue ──────────────────────────────────────────── */}
        <div className="gf-card">
          <div className="gf-card__header" style={{ justifyContent: 'space-between' }}>
            <h2 className="gf-card__title">Work queue</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/grantor/opportunities/new" className="gf-btn gf-btn--primary gf-btn--sm">
                + New Opportunity
              </Link>
              <Link to="/grantor/opportunities" className="gf-btn gf-btn--outline gf-btn--sm">
                View all
              </Link>
            </div>
          </div>
          <div className="gf-table-wrap">
            <table className="gf-table">
              <thead>
                <tr>
                  <th scope="col">Work item</th>
                  <th scope="col">Program</th>
                  <th scope="col">Status</th>
                  <th scope="col">Due date</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Owner</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Assign reviewers</td>
                  <td>Community Health</td>
                  <td><span className="gf-badge gf-badge--success">Ready</span></td>
                  <td>Today</td>
                  <td><span className="gf-badge gf-badge--error">High</span></td>
                  <td>Jordan Lee</td>
                </tr>
                <tr>
                  <td>Approve amendment</td>
                  <td>Housing Stability</td>
                  <td><span className="gf-badge gf-badge--warning">Awaiting approval</span></td>
                  <td>Aug 2</td>
                  <td><span className="gf-badge gf-badge--error">High</span></td>
                  <td>Maya Chen</td>
                </tr>
                <tr>
                  <td>Review report</td>
                  <td>Youth Pathways</td>
                  <td><span className="gf-badge gf-badge--pending">Submitted</span></td>
                  <td>Aug 4</td>
                  <td><span className="gf-badge gf-badge--neutral">Medium</span></td>
                  <td>Carlos Ruiz</td>
                </tr>
                <tr>
                  <td>Close award</td>
                  <td>Nutrition Access</td>
                  <td><span className="gf-badge gf-badge--neutral">Closeout</span></td>
                  <td>Aug 9</td>
                  <td><span className="gf-badge gf-badge--neutral">Medium</span></td>
                  <td>Priya Shah</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (isIntakeAdmin) {
    return (
      <div>
        <div className="gf-page-header">
          <h1 className="gf-page-title">{greeting}{user ? `, ${user.full_name.split(' ')[0]}` : ''}</h1>
          <p className="gf-page-subtitle">Here is what needs your attention.</p>
        </div>

        <div className="gf-stat-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)', maxWidth: '320px' }}>
          <div className="gf-stat-card">
            <p className="gf-stat-card__label">Pending screening</p>
            <p className="gf-stat-card__value">—</p>
            <p className="gf-stat-card__sub">Applications awaiting intake disposition.</p>
          </div>
        </div>

        <Link to="/grantor/intake-queue" className="gf-btn gf-btn--primary">
          Go to Intake Queue
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="gf-page-header">
        <h1 className="gf-page-title">Grantor Portal</h1>
        <p className="gf-page-subtitle">Welcome to GrantFlow.</p>
      </div>
    </div>
  );
}
