import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { validationApi } from '../../api/validationApi';

interface CertificationPanelProps {
  workspaceId: string;
  isAuthorizedRep: boolean;
}

const DEFAULT_CERT_TEXT =
  'I certify that the information contained in this application is accurate and complete, and that I am authorized to submit this application on behalf of the applicant organization.';

/**
 * CertificationPanel — AR-only certification UI.
 *
 * Shows legal certification text, agreement checkbox, concern flag textarea, and submit button.
 * Only renders if user has authorized_representative org role.
 * After certification: shows success alert with timestamp.
 */
export function CertificationPanel({ workspaceId, isAuthorizedRep }: CertificationPanelProps) {
  const queryClient = useQueryClient();
  const [agreed, setAgreed] = useState(false);
  const [concernOpen, setConcernOpen] = useState(false);
  const [concernText, setConcernText] = useState('');
  const [certError, setCertError] = useState<string | null>(null);
  const [certSuccess, setCertSuccess] = useState(false);
  const [concernSuccess, setConcernSuccess] = useState(false);

  // Fetch current certification status
  const certQuery = useQuery({
    queryKey: ['certification', workspaceId],
    queryFn: () => validationApi.getCertification(workspaceId),
    enabled: !!workspaceId && isAuthorizedRep,
  });

  // Certify mutation
  const certifyMutation = useMutation({
    mutationFn: () => validationApi.certify(workspaceId, DEFAULT_CERT_TEXT),
    onSuccess: () => {
      setCertSuccess(true);
      setCertError(null);
      queryClient.invalidateQueries({ queryKey: ['certification', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['readiness', workspaceId] });
    },
    onError: (err: Error & { code?: string; status?: number }) => {
      if (err.status === 403) {
        setCertError('Only authorized representatives can certify this application.');
      } else if (err.status === 409 || err.code === 'ALREADY_CERTIFIED') {
        setCertError('This application has already been certified.');
      } else {
        setCertError(err.message || 'Certification failed. Please try again.');
      }
    },
  });

  // Concern flag mutation
  const concernMutation = useMutation({
    mutationFn: (text: string) => validationApi.submitConcern(workspaceId, text),
    onSuccess: () => {
      setConcernSuccess(true);
      setConcernText('');
    },
  });

  // Don't render if not AR
  if (!isAuthorizedRep) return null;

  const isCertified = certQuery.data?.certified === true;
  const certification = certQuery.data?.certification;

  // Already certified state
  if (isCertified && certification) {
    return (
      <div data-testid="certification-panel" >
        <h3>Authorized Representative Certification</h3>
        <div className="gf-alert gf-alert gf-alert--success" role="alert" data-testid="certification-success">
          <div >
            <p className="gf-alert__text">
              Application certified on{' '}
              {new Date(certification.certification_timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="certification-panel" >
      <h3>Authorized Representative Certification</h3>

      {/* Legal certification text */}
      <div
        
        style={{
          background: '#f0f0f0',
          padding: '1rem',
          borderLeft: '4px solid #005ea2',
          marginBottom: '1rem',
        }}
        data-testid="certification-legal-text"
      >
        <p>{DEFAULT_CERT_TEXT}</p>
      </div>

      {/* Error/success messages */}
      {certError && (
        <div className="gf-alert gf-alert gf-alert--error" role="alert">
          <div >
            <p className="gf-alert__text">{certError}</p>
          </div>
        </div>
      )}
      {certSuccess && (
        <div className="gf-alert gf-alert gf-alert--success" role="alert" data-testid="certification-success">
          <div >
            <p className="gf-alert__text">Application successfully certified.</p>
          </div>
        </div>
      )}

      {/* Agreement checkbox */}
      <div className="gf-form-group" style={{ marginBottom: '1rem' }}>
        <input
          
          id="cert-agree"
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          data-testid="certification-checkbox"
        />
        <label className="gf-label" htmlFor="cert-agree">
          I agree to the above certification statement
        </label>
      </div>

      {/* Submit Certification button */}
      <button
        type="button"
        className="gf-btn gf-btn--primary"
        disabled={!agreed || certifyMutation.isPending}
        onClick={() => certifyMutation.mutate()}
        data-testid="submit-certification-btn"
      >
        {certifyMutation.isPending ? 'Submitting…' : 'Submit Certification'}
      </button>

      {/* Concern Flag (collapsible) */}
      <div style={{ marginTop: '2rem' }}>
        <button
          type="button"
          className="gf-btn gf-btn--primary gf-btn gf-btn--ghost"
          onClick={() => setConcernOpen(!concernOpen)}
          aria-expanded={concernOpen}
          data-testid="concern-flag-toggle"
        >
          {concernOpen ? '▾' : '▸'} Submit a Concern Flag (Optional)
        </button>

        {concernOpen && (
          <div style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
            <p className="gf-hint" style={{ fontSize: '0.85rem' }}>
              This note is private to your team and will notify your Proposal Lead. It does not block submission.
            </p>
            <textarea
              className="gf-textarea"
              value={concernText}
              onChange={(e) => setConcernText(e.target.value)}
              placeholder="Describe your concern…"
              rows={3}
              data-testid="concern-textarea"
            />
            <button
              type="button"
              className="gf-btn gf-btn--primary gf-btn gf-btn--outline"
              disabled={!concernText.trim() || concernMutation.isPending}
              onClick={() => concernMutation.mutate(concernText.trim())}
              style={{ marginTop: '0.5rem' }}
              data-testid="submit-concern-btn"
            >
              Submit Concern
            </button>
            {concernSuccess && (
              <div className="gf-alert gf-alert gf-alert--success" role="alert" style={{ marginTop: '0.5rem' }}>
                <div >
                  <p className="gf-alert__text">Concern flag recorded.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
