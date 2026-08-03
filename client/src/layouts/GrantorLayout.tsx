import { Outlet, Navigate, Link } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useAuthStore } from '../store/authStore';
import { GrantorSidebar } from '../components/nav/GrantorSidebar';

/**
 * Layout for the grantor portal — GrantFlow Design System v1.0.
 * Dark navy sidebar + white header + light page background.
 * WCAG 2.1 AA: skip-to-main, role="banner", aria labels.
 */
export function GrantorLayout() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { user, grantor_memberships, isLoading } = useCurrentUser();

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
        <Link to="/grantor/dashboard" className="gf-header__logo">
          GrantFlow
        </Link>
        <span className="gf-header__spacer" />
        <span className="gf-header__role">Program officer</span>
        {user && (
          <span className="gf-header__user" aria-label={`Logged in as ${user.full_name}`}>
            {user.full_name}
          </span>
        )}
      </header>

      {/* ── App body ───────────────────────────────────────────────── */}
      <div className="gf-app">
        <GrantorSidebar grantor_memberships={grantor_memberships} />

        <main id="main-content" className="gf-main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
