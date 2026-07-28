import { Outlet, Navigate, Link } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useAuthStore } from '../store/authStore';
import { ApplicantSidebar } from '../components/nav/ApplicantSidebar';

/**
 * Layout for the applicant portal.
 * Uses USWDS usa-header, usa-sidenav, and usa-layout-docs__main.
 * Includes skip-to-main-content link for WCAG 2.1 AA compliance.
 * Auth guard: redirects to /login if not authenticated (T-03-09 mitigation).
 */
export function ApplicantLayout() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { user, isLoading } = useCurrentUser();

  // Auth guard: redirect unauthenticated users to login
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="usa-layout-docs" style={{ padding: '2rem' }}>
        <span className="usa-sr-only">Loading...</span>
        <div aria-busy="true" aria-label="Loading portal">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <>
      {/* WCAG 2.1 AA: Skip-to-main-content link */}
      <a className="usa-skipnav" href="#main-content">
        Skip to main content
      </a>

      {/* USWDS Header */}
      <header className="usa-header usa-header--basic" role="banner">
        <div className="usa-nav-container">
          <div className="usa-navbar">
            <div className="usa-logo">
              <em className="usa-logo__text">GrantsIntake — Applicant Portal</em>
            </div>
          </div>
          <nav aria-label="Primary navigation" className="usa-nav">
            <ul className="usa-nav__primary usa-accordion">
              <li className="usa-nav__primary-item">
                <Link to="/opportunities" className="usa-nav__link">
                  <span>Find Opportunities</span>
                </Link>
              </li>
            </ul>
            {user && (
              <div
                className="usa-nav__secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
              >
                <span
                  className="usa-nav__secondary-links"
                  aria-label="Logged in as"
                  style={{ fontSize: '0.875rem', color: '#1b1b1b', padding: '0.5rem 1rem' }}
                >
                  {user.full_name}
                </span>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main layout: sidebar + content */}
      <div className="usa-layout-docs usa-section">
        <div className="grid-container">
          <div className="grid-row grid-gap">
            {/* Sidebar */}
            <div className="usa-layout-docs__sidenav desktop:grid-col-3">
              <ApplicantSidebar />
            </div>

            {/* Main content */}
            <main
              id="main-content"
              className="usa-layout-docs__main desktop:grid-col-9"
              tabIndex={-1}
            >
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
