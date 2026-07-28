import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Login page using USWDS form components.
 * On success: redirects to /grantor/dashboard.
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
      // Route based on role: grantor admins → grantor dashboard, applicants → applicant portal
      const isGrantorAdmin = result.user?.roles?.includes('grantor_admin');
      navigate(isGrantorAdmin ? '/grantor/dashboard' : '/applicant/applications', { replace: true });
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="usa-section">
      <div className="grid-container">
        <div className="grid-row grid-gap">
          <div className="tablet:grid-col-8 desktop:grid-col-6">
            <h1 className="usa-prose">Sign in to GrantsIntake</h1>
            <p className="usa-prose">Grantor Portal — Use your agency credentials to sign in.</p>

            {error && (
              <div
                className="usa-alert usa-alert--error usa-alert--slim"
                role="alert"
                aria-live="assertive"
              >
                <div className="usa-alert__body">
                  <p className="usa-alert__text">{error}</p>
                </div>
              </div>
            )}

            <form className="usa-form usa-form--large" onSubmit={handleSubmit} noValidate>
              <fieldset className="usa-fieldset">
                <div className="usa-form-group">
                  <label className="usa-label" htmlFor="email">
                    Email address
                  </label>
                  <input
                    className="usa-input"
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                </div>

                <div className="usa-form-group">
                  <label className="usa-label" htmlFor="password">
                    Password
                  </label>
                  <input
                    className="usa-input"
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button
                  className="usa-button"
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </button>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
