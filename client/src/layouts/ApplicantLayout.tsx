import { Outlet, Navigate, Link } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useAuthStore } from '../store/authStore';
import { ApplicantSidebar } from '../components/nav/ApplicantSidebar';
import { ChangeAlertsBell } from '../components/ChangeAlertsBell';

/**
 * Layout for the applicant portal — GrantFlow Design System v1.0.
 * Dark navy sidebar + white header + light page background.
 * WCAG 2.1 AA compliant: skip-to-main, aria-label, role="banner".
 */
export function ApplicantLayout() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { user, isLoading } = useCurrentUser();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="gf-loading" aria-busy="true" aria-label="Loading portal">
        <span className="gf-sr-only">Loading…</span>
        Loading…
      </div>
    );
  }

  return (
    <div className="gf-shell">
      {/* WCAG: Skip navigation */}
      <a className="gf-skipnav" href="#main-content">
        Skip to main content
      </a>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="gf-header" role="banner">
        <Link to="/applicant/applications" className="gf-header__logo">
          GrantFlow
        </Link>
        <span className="gf-header__spacer" />
        <ChangeAlertsBell />
        <span className="gf-header__role">Applicant</span>
        {user && (
          <span className="gf-header__user" aria-label={`Logged in as ${user.full_name}`}>
            {user.full_name}
          </span>
        )}
      </header>

      {/* ── App body ───────────────────────────────────────────────── */}
      <div className="gf-app">
        <ApplicantSidebar />

        <main id="main-content" className="gf-main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
