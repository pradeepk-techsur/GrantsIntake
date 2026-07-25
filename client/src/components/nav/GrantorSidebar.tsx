import { NavLink } from 'react-router-dom';
import type { GrantorMembership } from '../../hooks/useCurrentUser';

interface GrantorSidebarProps {
  grantor_memberships: GrantorMembership[];
}

type GrantorRole = string;

function hasRole(memberships: GrantorMembership[], ...roles: GrantorRole[]): boolean {
  return memberships.some((m) => m.roles.some((r) => roles.includes(r)));
}

/**
 * Role-restricted sidebar navigation per US-1.0 acceptance criteria.
 *
 * Role visibility rules:
 * - Opportunities: grantor_admin, program_officer
 * - Create New Opportunity: grantor_admin, program_officer (NOT intake_administrator)
 * - Intake Queue: all grantor roles
 * - Program Dashboard: all grantor roles
 * - Q&A Inbox: grantor_admin, program_officer, intake_administrator
 * - Settings: grantor_admin only
 *
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
    <nav aria-label="Grantor portal navigation" className="usa-sidenav">
      <ul className="usa-sidenav__list">
        {isGrantorAdminOrOfficer && (
          <li className="usa-sidenav__item">
            <NavLink
              to="/grantor/opportunities"
              className={({ isActive }) =>
                isActive ? 'usa-current' : ''
              }
              aria-current={undefined}
            >
              Opportunities
            </NavLink>
          </li>
        )}

        {isGrantorAdminOrOfficer && (
          <li className="usa-sidenav__item">
            <NavLink
              to="/grantor/dashboard"
              className={({ isActive }) =>
                isActive ? 'usa-current' : ''
              }
            >
              Program Dashboard
            </NavLink>
          </li>
        )}

        <li className="usa-sidenav__item">
          <NavLink
            to="/grantor/intake-queue"
            className={({ isActive }) =>
              isActive ? 'usa-current' : ''
            }
          >
            Intake Queue
          </NavLink>
        </li>

        {isQaInboxVisible && (
          <li className="usa-sidenav__item">
            <NavLink
              to="/grantor/qa-inbox"
              className={({ isActive }) =>
                isActive ? 'usa-current' : ''
              }
            >
              Q&amp;A Inbox
            </NavLink>
          </li>
        )}

        {isGrantorAdmin && (
          <li className="usa-sidenav__item">
            <NavLink
              to="/grantor/settings"
              className={({ isActive }) =>
                isActive ? 'usa-current' : ''
              }
            >
              Settings
            </NavLink>
          </li>
        )}

        {isGrantorAdminOrOfficer && (
          <li className="usa-sidenav__item usa-sidenav__item--cta">
            <NavLink
              to="/grantor/opportunities/new"
              className="usa-button usa-button--outline"
              aria-label="Create New Opportunity"
            >
              Create New Opportunity
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  );
}
