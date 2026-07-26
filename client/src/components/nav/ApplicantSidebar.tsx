import { NavLink } from 'react-router-dom';

/**
 * Sidebar navigation for the applicant portal.
 * USWDS usa-sidenav component with three nav items:
 * - My Profile → /applicant/profile
 * - Find Opportunities → /opportunities
 * - My Applications → /applicant/applications
 */
export function ApplicantSidebar() {
  return (
    <nav aria-label="Applicant portal navigation" className="usa-sidenav">
      <ul className="usa-sidenav__list">
        <li className="usa-sidenav__item">
          <NavLink
            to="/applicant/profile"
            className={({ isActive }) => (isActive ? 'usa-current' : undefined)}
          >
            My Profile
          </NavLink>
        </li>
        <li className="usa-sidenav__item">
          <NavLink to="/opportunities">Find Opportunities</NavLink>
        </li>
        <li className="usa-sidenav__item">
          <NavLink
            to="/applicant/applications"
            className={({ isActive }) => (isActive ? 'usa-current' : undefined)}
          >
            My Applications
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
