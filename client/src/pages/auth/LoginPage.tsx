import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Login page — GrantFlow Design System v1.0.
 * Clean centered form with primary dark branding.
 * WCAG 2.1 AA: aria-live error, autocomplete, focus management.
 */
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login({ email, password });
      const isGrantorAdmin = result.user?.roles?.includes('grantor_admin');
      navigate(isGrantorAdmin ? '/grantor/dashboard' : '/applicant/applications', { replace: true });
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      id="main-content"
      style={{
        minHeight: '100vh',
        background: 'var(--gf-page-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: 'var(--gf-primary-dark)',
              letterSpacing: '-0.5px',
            }}
          >
            GrantFlow
          </span>
          <p
            style={{
              fontSize: 'var(--gf-font-compact)',
              color: 'var(--gf-muted)',
              margin: '6px 0 0',
            }}
          >
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div
          className="gf-card"
          style={{ padding: '32px' }}
        >
          {error && (
            <div
              className="gf-alert gf-alert--error"
              role="alert"
              aria-live="assertive"
              style={{ marginBottom: '20px' }}
            >
              <p className="gf-alert__text">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="gf-form-group">
              <label className="gf-label" htmlFor="email">
                Email address
              </label>
              <input
                className="gf-input"
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.gov"
              />
            </div>

            <div className="gf-form-group">
              <label className="gf-label" htmlFor="password">
                Password
              </label>
              <input
                className="gf-input"
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button
              className="gf-btn gf-btn--primary"
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '10px 16px' }}
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
