import { NavLink, Link } from 'react-router-dom';
import type { GrantorMembership } from '../../hooks/useCurrentUser';

interface GrantorSidebarProps {
  grantor_memberships: GrantorMembership[];
}

type GrantorRole = string;

function hasRole(memberships: GrantorMembership[], ...roles: GrantorRole[]): boolean {
  return memberships.some((m) => m.roles.some((r) => roles.includes(r)));
}

/**
 * Sidebar for the grantor portal — GrantFlow Design System v1.0.
 * Role-restricted nav per US-1.0 acceptance criteria.
 * T-02-06: UI hiding is defense-in-depth; backend enforces roles independently.
 */
export function GrantorSidebar({ grantor_memberships }: GrantorSidebarProps) {
  const isGrantorAdminOrOfficer = hasRole(grantor_memberships, 'grantor_admin', 'program_officer');
  const isGrantorAdmin = hasRole(grantor_memberships, 'grantor_admin');
  const isQaInboxVisible = hasRole(
    grantor_memberships,
    'grantor_admin',
    'program_officer',
    'intake_administrator',
  );

  return (
    <nav aria-label="Grantor portal navigation" className="gf-sidebar">
      <ul className="gf-sidebar__list" role="list">
        <li className="gf-sidebar__item">
          <NavLink
            to="/grantor/dashboard"
            className={({ isActive }) =>
              isActive ? 'gf-sidebar__link active' : 'gf-sidebar__link'
            }
          >
            Home
          </NavLink>
        </li>

        {isGrantorAdminOrOfficer && (
          <li className="gf-sidebar__item">
            <NavLink
              to="/grantor/opportunities"
              className={({ isActive }) =>
                isActive ? 'gf-sidebar__link active' : 'gf-sidebar__link'
              }
            >
              Opportunities
            </NavLink>
          </li>
        )}

        <li className="gf-sidebar__item">
          <NavLink
            to="/grantor/intake-queue"
            className={({ isActive }) =>
              isActive ? 'gf-sidebar__link active' : 'gf-sidebar__link'
            }
          >
            Applications
          </NavLink>
        </li>

        {isGrantorAdminOrOfficer && (
          <li className="gf-sidebar__item">
            <NavLink
              to="/grantor/dashboard"
              end={false}
              className={({ isActive }) =>
                isActive ? 'gf-sidebar__link active' : 'gf-sidebar__link'
              }
            >
              Reviews
            </NavLink>
          </li>
        )}

        {isGrantorAdminOrOfficer && (
          <li className="gf-sidebar__item">
            <NavLink
              to="/grantor/awards"
              className={({ isActive }) =>
                isActive ? 'gf-sidebar__link active' : 'gf-sidebar__link'
              }
            >
              Awards
            </NavLink>
          </li>
        )}

        {isGrantorAdminOrOfficer && (
          <li className="gf-sidebar__item">
            <NavLink
              to="/grantor/monitoring"
              className={({ isActive }) =>
                isActive ? 'gf-sidebar__link active' : 'gf-sidebar__link'
              }
            >
              Monitoring
            </NavLink>
          </li>
        )}

        {isQaInboxVisible && (
          <li className="gf-sidebar__item">
            <NavLink
              to="/grantor/qa-inbox"
              className={({ isActive }) =>
                isActive ? 'gf-sidebar__link active' : 'gf-sidebar__link'
              }
              data-testid="nav-qa-management"
            >
              Q&amp;A Management
            </NavLink>
          </li>
        )}

        {isGrantorAdmin && (
          <li className="gf-sidebar__item">
            <NavLink
              to="/grantor/settings"
              className={({ isActive }) =>
                isActive ? 'gf-sidebar__link active' : 'gf-sidebar__link'
              }
            >
              Settings
            </NavLink>
          </li>
        )}

        {isGrantorAdminOrOfficer && (
          <li className="gf-sidebar__item">
            <NavLink
              to="/grantor/reports"
              className={({ isActive }) =>
                isActive ? 'gf-sidebar__link active' : 'gf-sidebar__link'
              }
            >
              Reports
            </NavLink>
          </li>
        )}
      </ul>

      {isGrantorAdminOrOfficer && (
        <div className="gf-sidebar__cta">
          <Link
            to="/grantor/opportunities/new"
            className="gf-btn gf-btn--outline"
            style={{
              display: 'block',
              textAlign: 'center',
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.5)',
              fontSize: '13px',
            }}
            aria-label="Create New Opportunity"
          >
            + New Opportunity
          </Link>
        </div>
      )}
    </nav>
  );
}
