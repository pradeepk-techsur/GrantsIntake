import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import type { EligibilityResult } from '../../api/prescreeningApi';
import { prescreeningApi } from '../../api/prescreeningApi';

/**
 * Alert configuration for each eligibility result state.
 * Maps overall_result to USWDS alert classes and headings.
 *
 * Implements PRD-INTAKE-026 (F25): Four-state result display with USWDS alert components.
 */
const alertConfig: Record<
  EligibilityResult['overall_result'],
  { className: string; heading: string }
> = {
  eligible: {
    className: 'gf-alert gf-alert--success',
    heading: 'Eligible',
  },
  likely_eligible: {
    className: 'gf-alert gf-alert--info',
    heading: 'Likely Eligible',
  },
  needs_attention: {
    className: 'gf-alert gf-alert--warning',
    heading: 'Needs Attention',
  },
  ineligible: {
    className: 'gf-alert gf-alert--error',
    heading: 'Ineligible',
  },
};

/**
 * PrescreenResultPage — Displays the four-state USWDS eligibility result.
 *
 * Implements:
 * - PRD-INTAKE-026 (F25): Four-state result display
 * - PRD-INTAKE-027 (F26): Blocker explanation — all triggered hard_blocker rules shown (not just first)
 * - Advisory warnings in a separate section from hard blockers
 *
 * Accepts EligibilityResult via React Router location.state (populated by PrescreenPage).
 * Falls back to API fetch (getMyResult) when location.state is null — handles ALREADY_SUBMITTED
 * (409) navigations and direct URL access.
 *
 * Route: /applicant/opportunities/:opportunityId/prescreen/result
 */
export function PrescreenResultPage() {
  const location = useLocation();
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const stateResult = location.state as EligibilityResult | null;

  const [result, setResult] = useState<EligibilityResult | null>(stateResult);
  const [fetching, setFetching] = useState(!stateResult);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (stateResult || !opportunityId) return;

    setFetching(true);
    prescreeningApi
      .getMyResult(opportunityId)
      .then((data) => {
        setResult(data);
        setFetching(false);
      })
      .catch(() => {
        setFetchError('Your eligibility result could not be loaded. Please return to the opportunity and try again.');
        setFetching(false);
      });
  }, [opportunityId, stateResult]);

  if (fetching) {
    return (
      <main id="main-content" tabIndex={-1}>
        <div >
          <div >
            <div aria-busy="true" aria-label="Loading result">Loading your eligibility result…</div>
          </div>
        </div>
      </main>
    );
  }

  if (fetchError || !result || !result.overall_result) {
    return (
      <main id="main-content" tabIndex={-1}>
        <div >
          <div >
            <div className="gf-alert gf-alert gf-alert--error" role="alert">
              <div >
                <h2 className="gf-alert__title">Result not available</h2>
                <p className="gf-alert__text">
                  {fetchError ?? 'Your eligibility result could not be loaded. Please return to the opportunities list and try again.'}
                </p>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <Link to="/opportunities" className="gf-btn gf-btn--primary gf-btn gf-btn--outline">
                ← Return to Opportunities
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const config = alertConfig[result.overall_result];
  const hardBlockers = result.triggered_rules.filter((r) => r.severity === 'hard_blocker');
  const advisories = result.triggered_rules.filter((r) => r.severity === 'advisory');

  return (
    <main id="main-content" tabIndex={-1}>
      <div >
        <div >
          <h1 >Eligibility Pre-Screen Result</h1>

          {/* Main status alert — PRD-INTAKE-026 */}
          <div
            className={`gf-alert ${config.className}`}
            role="alert"
            data-testid="prescreen-result-alert"
          >
            <div >
              <h2 className="gf-alert__title">{config.heading}</h2>
              <p className="gf-alert__text">{result.next_step}</p>
            </div>
          </div>

          {/* Hard blocker section — PRD-INTAKE-027: all blockers shown, not just first */}
          {hardBlockers.length > 0 && (
            <section
              aria-label="Eligibility blockers"
              data-testid="blocker-section"
              style={{ marginTop: '2rem' }}
            >
              <h3 >Issues Preventing Eligibility</h3>
              <ul >
                {hardBlockers.map((rule) => (
                  <li key={rule.rule_id}>
                    <strong>Blocker:</strong> {rule.explanation_text}
                    {rule.opportunity_section_link && (
                      <>
                        {' '}
                        <a href={rule.opportunity_section_link} >
                          See opportunity section
                        </a>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Advisory section — separate from hard blockers per PRD-INTAKE-027 */}
          {advisories.length > 0 && (
            <section
              aria-label="Advisory notes"
              data-testid="advisory-section"
              style={{ marginTop: '1.5rem' }}
            >
              <h3 >Advisory Notes</h3>
              <p  style={{ color: '#565c65', fontSize: '0.9rem' }}>
                These items are not hard requirements but may affect your application.
              </p>
              <ul >
                {advisories.map((rule) => (
                  <li key={rule.rule_id}>{rule.explanation_text}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Next step action area */}
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {result.workspace_access_granted ? (
              <>
                <Link
                  to="/applicant/applications"
                  className="gf-btn gf-btn--primary"
                  data-testid="start-application-link"
                >
                  Start Application →
                </Link>
                <Link to="/opportunities" className="gf-btn gf-btn--primary gf-btn gf-btn--outline">
                  Return to Opportunities
                </Link>
              </>
            ) : (
              <Link to="/opportunities" className="gf-btn gf-btn--primary gf-btn gf-btn--outline">
                Return to Opportunities
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
