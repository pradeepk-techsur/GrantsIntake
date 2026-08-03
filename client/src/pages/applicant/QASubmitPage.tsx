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

  // Load the current user's own submitted questions (pending + answered)
  const myQuestionsQuery = useQuery<QAItem[]>({
    queryKey: ['qa-my-questions', opportunityId],
    queryFn: () => qaApi.listMyQuestions(opportunityId!),
    enabled: !!opportunityId && !!accessToken,
    staleTime: 30_000,
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
      queryClient.invalidateQueries({ queryKey: ['qa-my-questions', opportunityId] });
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
    <div  style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" >
        <ol >
          <li className="-item">
            <Link to="/opportunities" >
              Opportunities
            </Link>
          </li>
          <li className="-item">
            <Link to={`/opportunities/${opportunityId}`} >
              Opportunity
            </Link>
          </li>
          <li className="-item active" aria-current="page">
            Submit a Question
          </li>
        </ol>
      </nav>

      <div >
        <h1>Submit a Question</h1>
      </div>

      {/* Back link */}
      <p style={{ marginBottom: '1.5rem' }}>
        <Link to={`/opportunities/${opportunityId}`} >
          ← Back to Opportunity Details
        </Link>
      </p>

      {/* Success alert */}
      {successMessage && (
        <div className="gf-alert gf-alert gf-alert--success" role="alert" data-testid="qa-success-alert">
          <div >
            <p className="gf-alert__text">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div
          className={`gf-alert ${
 errorMessage.includes('window') ? 'gf-alert gf-alert--warning' : 'gf-alert gf-alert--error'
 }`}
          role="alert"
          data-testid="qa-error-alert"
        >
          <div >
            <p className="gf-alert__text">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Question form */}
      {accessToken ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
          <label className="gf-label" htmlFor="question-text">
            Your Question
          </label>
          <textarea
            id="question-text"
            className="gf-textarea"
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
            className="gf-btn gf-btn--primary"
            disabled={submitMutation.isPending || !questionText.trim()}
            data-testid="qa-submit-btn"
          >
            {submitMutation.isPending ? 'Submitting…' : 'Submit Question'}
          </button>
        </form>
      ) : (
        <div className="gf-alert gf-alert gf-alert--info" role="alert">
          <div >
            <p className="gf-alert__text">
              <a href="/login" >
                Sign in
              </a>{' '}
              to submit a question.
            </p>
          </div>
        </div>
      )}

      {/* Your Submitted Questions — shows pending/answered questions for the current user */}
      {accessToken && (
        <section aria-labelledby="my-questions-heading" style={{ marginBottom: '2rem' }}>
          <h2 id="my-questions-heading">Your Submitted Questions</h2>
          {myQuestionsQuery.isLoading && <p>Loading your questions…</p>}
          {myQuestionsQuery.data && myQuestionsQuery.data.length === 0 && !submitMutation.isSuccess && (
            <p style={{ color: '#565c65' }}>You have not submitted any questions for this opportunity.</p>
          )}
          {myQuestionsQuery.data &&
            myQuestionsQuery.data.map((item) => (
              <div
                key={item.qa_id}
                className="gf-card"
                style={{ marginBottom: '0.75rem' }}
                data-testid="qa-my-question-item"
              >
                <div >
                  <div className="gf-card__body">
                    <p style={{ marginBottom: '0.25rem' }}>
                      <strong>Q:</strong> {item.question_text}
                    </p>
                    {item.status === 'answered' && item.answer_text ? (
                      <p style={{ color: '#1b1b1b', marginBottom: '0.25rem' }}>
                        <strong>A:</strong> {item.answer_text}
                      </p>
                    ) : (
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '2px',
                          backgroundColor: '#fef0c7',
                          color: '#936f00',
                        }}
                        data-testid="qa-pending-badge"
                      >
                        Awaiting Answer
                      </span>
                    )}
                    <p style={{ fontSize: '0.8rem', color: '#71767a', marginTop: '0.25rem' }}>
                      Submitted {new Date(item.submitted_at).toLocaleDateString('en-US')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </section>
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
              className="gf-card"
              style={{ marginBottom: '1rem' }}
              data-testid="qa-published-item"
            >
              <div >
                <div className="gf-card__body">
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
