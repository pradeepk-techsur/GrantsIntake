import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { qaApi } from '../../api/qaApi';
import type { QAItem } from '../../types/qa';

/**
 * QASubmitPage — Applicant-facing Q&A submission page.
 *
 * Route: /applicant/opportunities/:opportunityId/qa
 *
 * - Displays published (answered) Q&A items chronologically
 * - Provides a textarea to submit a new question (2000 char limit)
 * - Handles Q&A window and enablement errors gracefully
 */
export function QASubmitPage() {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [questionText, setQuestionText] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const MAX_CHARS = 2000;

  // Load published Q&A
  const publishedQuery = useQuery<QAItem[]>({
    queryKey: ['qa-published', opportunityId],
    queryFn: () => qaApi.listPublished(opportunityId!),
    enabled: !!opportunityId,
    staleTime: 60_000,
  });

  // Submit question mutation
  const submitMutation = useMutation({
    mutationFn: () => qaApi.submitQuestion(opportunityId!, questionText),
    onSuccess: () => {
      setQuestionText('');
      setErrorMessage('');
      setSuccessMessage(
        'Your question has been submitted. The grantor will post a public answer when available.',
      );
      queryClient.invalidateQueries({ queryKey: ['qa-published', opportunityId] });
    },
    onError: (err: Error & { code?: string; status?: number }) => {
      setSuccessMessage('');
      if (err.code === 'QA_DISABLED') {
        setErrorMessage('Q&A is not enabled for this opportunity.');
      } else if (err.code === 'QA_WINDOW_CLOSED') {
        setErrorMessage('The Q&A question window is closed. Questions can no longer be submitted.');
      } else if (err.code === 'QA_WINDOW_NOT_OPEN') {
        setErrorMessage('The Q&A question window has not opened yet. Please check back later.');
      } else if (err.status === 401) {
        setErrorMessage('Please sign in to submit a question.');
      } else {
        setErrorMessage(err.message || 'Failed to submit question.');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    setSuccessMessage('');
    setErrorMessage('');
    submitMutation.mutate();
  };

  return (
    <div className="grid-container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="usa-breadcrumb">
        <ol className="usa-breadcrumb__list">
          <li className="usa-breadcrumb__list-item">
            <Link to="/opportunities" className="usa-breadcrumb__link">
              Opportunities
            </Link>
          </li>
          <li className="usa-breadcrumb__list-item">
            <Link to={`/opportunities/${opportunityId}`} className="usa-breadcrumb__link">
              Opportunity
            </Link>
          </li>
          <li className="usa-breadcrumb__list-item usa-current" aria-current="page">
            Submit a Question
          </li>
        </ol>
      </nav>

      <div className="usa-prose">
        <h1>Submit a Question</h1>
      </div>

      {/* Back link */}
      <p style={{ marginBottom: '1.5rem' }}>
        <Link to={`/opportunities/${opportunityId}`} className="usa-link">
          ← Back to Opportunity Details
        </Link>
      </p>

      {/* Success alert */}
      {successMessage && (
        <div className="usa-alert usa-alert--success" role="alert" data-testid="qa-success-alert">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div
          className={`usa-alert ${
            errorMessage.includes('window') ? 'usa-alert--warning' : 'usa-alert--error'
          }`}
          role="alert"
          data-testid="qa-error-alert"
        >
          <div className="usa-alert__body">
            <p className="usa-alert__text">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Question form */}
      {accessToken ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
          <label className="usa-label" htmlFor="question-text">
            Your Question
          </label>
          <textarea
            id="question-text"
            className="usa-textarea"
            name="question_text"
            rows={5}
            maxLength={MAX_CHARS}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Type your question here..."
            data-testid="qa-question-textarea"
          />
          <p style={{ fontSize: '0.875rem', color: '#565c65', marginTop: '0.25rem' }}>
            {questionText.length}/{MAX_CHARS} characters
          </p>
          <button
            type="submit"
            className="usa-button"
            disabled={submitMutation.isPending || !questionText.trim()}
            data-testid="qa-submit-btn"
          >
            {submitMutation.isPending ? 'Submitting…' : 'Submit Question'}
          </button>
        </form>
      ) : (
        <div className="usa-alert usa-alert--info" role="alert">
          <div className="usa-alert__body">
            <p className="usa-alert__text">
              <a href="/login" className="usa-link">
                Sign in
              </a>{' '}
              to submit a question.
            </p>
          </div>
        </div>
      )}

      {/* Published Q&A */}
      <section aria-labelledby="public-qa-heading" style={{ marginTop: '2rem' }}>
        <h2 id="public-qa-heading">Public Q&amp;A</h2>
        {publishedQuery.isLoading && <p>Loading Q&amp;A…</p>}
        {publishedQuery.data && publishedQuery.data.length === 0 && (
          <p style={{ color: '#565c65' }}>No public questions have been answered yet.</p>
        )}
        {publishedQuery.data &&
          publishedQuery.data.map((item) => (
            <div
              key={item.qa_id}
              className="usa-card"
              style={{ marginBottom: '1rem' }}
              data-testid="qa-published-item"
            >
              <div className="usa-card__container">
                <div className="usa-card__body">
                  <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Q: {item.question_text}
                  </p>
                  <p style={{ color: '#1b1b1b' }}>A: {item.answer_text}</p>
                  {item.published_at && (
                    <p style={{ fontSize: '0.8rem', color: '#71767a' }}>
                      Answered on {new Date(item.published_at).toLocaleDateString('en-US')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
      </section>
    </div>
  );
}
