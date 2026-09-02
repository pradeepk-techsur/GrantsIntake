import { NavLink } from 'react-router-dom';

/**
 * Sidebar navigation for the applicant portal — GrantFlow Design System v1.0.
 * Dark navy sidebar with active state highlight.
 * WCAG 2.1 AA: aria-label, aria-current via NavLink.
 */
export function ApplicantSidebar() {
  return (
    <nav aria-label="Applicant portal navigation" className="gf-sidebar">
      <ul className="gf-sidebar__list" role="list">
        <li className="gf-sidebar__item">
          <NavLink
            to="/applicant/profile"
            className={({ isActive }) =>
              isActive ? 'gf-sidebar__link active' : 'gf-sidebar__link'
            }
          >
            Home
          </NavLink>
        </li>
        <li className="gf-sidebar__item">
          <NavLink
            to="/opportunities"
            className={({ isActive }) =>
              isActive ? 'gf-sidebar__link active' : 'gf-sidebar__link'
            }
          >
            Find funding
          </NavLink>
        </li>
        <li className="gf-sidebar__item">
          <NavLink
            to="/applicant/grants-gov"
            className={({ isActive }) =>
              isActive ? 'gf-sidebar__link active' : 'gf-sidebar__link'
            }
            data-testid="nav-browse-grants-gov"
          >
            Browse Grants.gov
          </NavLink>
        </li>
        <li className="gf-sidebar__item">
          <NavLink
            to="/applicant/applications"
            className={({ isActive }) =>
              isActive ? 'gf-sidebar__link active' : 'gf-sidebar__link'
            }
            data-testid="nav-my-applications"
          >
            Applications
          </NavLink>
        </li>
        <li className="gf-sidebar__item">
          <NavLink
            to="/applicant/notifications"
            className={({ isActive }) =>
              isActive ? 'gf-sidebar__link active' : 'gf-sidebar__link'
            }
            data-testid="nav-notifications"
          >
            Messages
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
