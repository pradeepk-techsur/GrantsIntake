import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { qaApi } from '../../api/qaApi';
import type { QAItem } from '../../types/qa';

type FilterTab = 'all' | 'unanswered' | 'answered';

/**
 * QAManagementPage — Grantor-facing Q&A management.
 *
 * Route: /grantor/opportunities/:id/qa
 *
 * - Lists ALL questions (including unanswered) for the opportunity
 * - Filter tabs: All | Unanswered | Answered
 * - Per question: expandable answer textarea + Publish Answer button
 * - Q&A config note (config is managed in OpportunityBuilder)
 */
export function QAManagementPage() {
  const { id: opportunityId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const accessToken = useAuthStore((s) => s.accessToken);

  const questionsQuery = useQuery<QAItem[]>({
    queryKey: ['qa-all', opportunityId],
    queryFn: () => qaApi.listAll(opportunityId!),
    enabled: !!opportunityId,
  });

  // Fetch opportunity title for display (public endpoint — grantor is authenticated)
  const titleQuery = useQuery<string | null>({
    queryKey: ['opportunity-title', opportunityId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/opportunities/${opportunityId}`);
      if (!res.ok) return null;
      const data = await res.json() as { title?: string };
      return data.title ?? null;
    },
    enabled: !!opportunityId,
    staleTime: 5 * 60_000,
  });

  const publishMutation = useMutation({
    mutationFn: ({ questionId, answerText }: { questionId: string; answerText: string }) =>
      qaApi.publishAnswer(questionId, answerText),
    onSuccess: (_data, variables) => {
      setSuccessId(variables.questionId);
      setExpandedId(null);
      setAnswerDrafts((prev) => {
        const next = { ...prev };
        delete next[variables.questionId];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['qa-all', opportunityId] });
      setTimeout(() => setSuccessId(null), 5000);
    },
  });

  const handlePublish = (questionId: string) => {
    const answerText = answerDrafts[questionId]?.trim();
    if (!answerText) return;
    publishMutation.mutate({ questionId, answerText });
  };

  // Apply filter
  const filteredQuestions = (questionsQuery.data ?? []).filter((q) => {
    if (activeFilter === 'unanswered') return q.status !== 'answered';
    if (activeFilter === 'answered') return q.status === 'answered';
    return true;
  });

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unanswered', label: 'Unanswered' },
    { key: 'answered', label: 'Answered' },
  ];

  return (
    <div style={{ padding: '1.5rem' }}>
      <div className="usa-prose">
        <h1>Q&amp;A Management</h1>
        <p style={{ color: '#565c65', fontSize: '0.9rem' }} data-testid="qa-opportunity-title">
          Opportunity: {titleQuery.data ?? opportunityId}
        </p>
      </div>

      {/* Back link */}
      <p style={{ marginBottom: '1rem' }}>
        <Link to={`/grantor/opportunities/${opportunityId}`} className="usa-link">
          ← Back to Opportunity
        </Link>
      </p>

      {/* Q&A config note */}
      <div
        className="usa-alert usa-alert--info usa-alert--slim"
        role="status"
        style={{ marginBottom: '1.5rem' }}
      >
        <div className="usa-alert__body">
          <p className="usa-alert__text">
            Q&amp;A window configuration is managed in the Opportunity Builder.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <nav aria-label="Q&A filter" style={{ marginBottom: '1rem' }}>
        <ul className="usa-nav__primary" style={{ display: 'flex', gap: '1rem', listStyle: 'none', padding: 0 }}>
          {filterTabs.map((tab) => (
            <li key={tab.key}>
              <button
                type="button"
                className={`usa-button ${activeFilter === tab.key ? '' : 'usa-button--outline'}`}
                onClick={() => setActiveFilter(tab.key)}
                style={{ fontSize: '0.875rem' }}
                data-testid={`qa-filter-${tab.key}`}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Questions table */}
      {questionsQuery.isLoading && <p>Loading questions…</p>}

      {questionsQuery.isError && (
        <div className="usa-alert usa-alert--error" role="alert" data-testid="qa-list-error">
          <div className="usa-alert__body">
            <h4 className="usa-alert__heading">Unable to Load Questions</h4>
            <p className="usa-alert__text">
              {(questionsQuery.error as { status?: number })?.status === 401 ||
              (questionsQuery.error as { status?: number })?.status === 403
                ? 'You do not have permission to view questions for this opportunity. Please ensure you are logged in with a grantor account.'
                : 'Failed to load questions. Please try again.'}
            </p>
          </div>
        </div>
      )}

      {questionsQuery.data && filteredQuestions.length === 0 && (
        <p style={{ color: '#565c65' }}>No questions match the current filter.</p>
      )}

      {filteredQuestions.length > 0 && (
        <table className="usa-table usa-table--borderless" style={{ width: '100%' }} data-testid="qa-questions-table">
          <thead>
            <tr>
              <th scope="col">Question</th>
              <th scope="col">Submitted</th>
              <th scope="col">Status</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuestions.map((q) => (
              <>
                <tr key={q.qa_id}>
                  <td style={{ maxWidth: '400px', wordBreak: 'break-word' }}>{q.question_text}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(q.submitted_at).toLocaleDateString('en-US')}
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '2px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        backgroundColor: q.status === 'answered' ? '#ecf3ec' : '#fef0c7',
                        color: q.status === 'answered' ? '#00a91c' : '#936f00',
                      }}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td>
                    {q.status !== 'answered' ? (
                      <button
                        type="button"
                        className="usa-button usa-button--unstyled"
                        onClick={() => setExpandedId(expandedId === q.qa_id ? null : q.qa_id)}
                        data-testid={`qa-expand-${q.qa_id}`}
                      >
                        {expandedId === q.qa_id ? 'Cancel' : 'Answer'}
                      </button>
                    ) : (
                      <span style={{ color: '#565c65', fontSize: '0.875rem' }}>Published</span>
                    )}
                  </td>
                </tr>
                {/* Expandable answer area */}
                {expandedId === q.qa_id && q.status !== 'answered' && (
                  <tr key={`${q.qa_id}-answer`}>
                    <td colSpan={4} style={{ backgroundColor: '#f0f0f0', padding: '1rem' }}>
                      {successId === q.qa_id && (
                        <div className="usa-alert usa-alert--success usa-alert--slim" style={{ marginBottom: '0.5rem' }}>
                          <div className="usa-alert__body">
                            <p className="usa-alert__text">Answer published successfully.</p>
                          </div>
                        </div>
                      )}
                      <label className="usa-label" htmlFor={`answer-${q.qa_id}`}>
                        Your Answer
                      </label>
                      <textarea
                        id={`answer-${q.qa_id}`}
                        className="usa-textarea"
                        rows={4}
                        maxLength={5000}
                        value={answerDrafts[q.qa_id] ?? ''}
                        onChange={(e) =>
                          setAnswerDrafts((prev) => ({ ...prev, [q.qa_id]: e.target.value }))
                        }
                        placeholder="Type your answer here..."
                        data-testid={`qa-answer-textarea-${q.qa_id}`}
                      />
                      <p style={{ fontSize: '0.8rem', color: '#565c65' }}>
                        {(answerDrafts[q.qa_id] ?? '').length}/5000 characters
                      </p>
                      <button
                        type="button"
                        className="usa-button"
                        onClick={() => handlePublish(q.qa_id)}
                        disabled={
                          publishMutation.isPending || !(answerDrafts[q.qa_id]?.trim())
                        }
                        data-testid={`qa-publish-${q.qa_id}`}
                      >
                        {publishMutation.isPending ? 'Publishing…' : 'Publish Answer'}
                      </button>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
