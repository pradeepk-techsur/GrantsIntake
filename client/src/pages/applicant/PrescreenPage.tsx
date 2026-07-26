import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { prescreeningApi, PrescreeningQuestionnaire, PrescreeningQuestion, SubmitResponseInput, EligibilityResult } from '../../api/prescreeningApi';

/**
 * Determines whether a question should be visible based on the current responses.
 * A question is visible if it has no conditional constraint, or if the parent
 * question has been answered with the required trigger value.
 */
function isQuestionVisible(
  question: PrescreeningQuestion,
  responses: Map<string, SubmitResponseInput>,
): boolean {
  if (!question.show_if) return true;
  const parentResponse = responses.get(question.show_if.depends_on_question_id);
  if (!parentResponse) return false;
  return parentResponse.response_text === question.show_if.trigger_response_value;
}

/**
 * PrescreenPage — Multi-step eligibility pre-screen questionnaire for applicants.
 *
 * Implements PRD-INTAKE-025 (F24): Eligibility pre-screen workflow.
 * - Renders questions from the opportunity's prescreening questionnaire
 * - Handles conditional question display based on prior responses
 * - Submits responses and navigates to result page
 *
 * Route: /applicant/opportunities/:opportunityId/prescreen
 */
export function PrescreenPage() {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const navigate = useNavigate();

  const [questionnaire, setQuestionnaire] = useState<PrescreeningQuestionnaire | null>(null);
  const [responses, setResponses] = useState<Map<string, SubmitResponseInput>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!opportunityId) return;

    setLoading(true);
    setError(null);

    prescreeningApi
      .getQuestionnaire(opportunityId)
      .then((data) => {
        setQuestionnaire(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message || 'Failed to load questionnaire');
        setLoading(false);
      });
  }, [opportunityId]);

  function handleOptionChange(questionId: string, optionId: string) {
    setResponses((prev) => {
      const next = new Map(prev);
      next.set(questionId, { question_id: questionId, selected_option_id: optionId });
      return next;
    });
  }

  function handleTextChange(questionId: string, text: string) {
    setResponses((prev) => {
      const next = new Map(prev);
      next.set(questionId, { question_id: questionId, response_text: text });
      return next;
    });
  }

  function handleYesNoChange(questionId: string, value: string) {
    setResponses((prev) => {
      const next = new Map(prev);
      // For yes_no we store response_text ('yes'/'no') for conditional matching
      // AND if there's an option matching the text, store selected_option_id too
      const question = questionnaire?.questions.find((q) => q.question_id === questionId);
      const matchingOption = question?.options.find((o) => o.option_text.toLowerCase() === value.toLowerCase());
      next.set(questionId, {
        question_id: questionId,
        response_text: value,
        selected_option_id: matchingOption?.option_id,
      });
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!opportunityId || !questionnaire) return;

    setError(null);
    setIsSubmitting(true);

    // Collect only visible question responses
    const visibleQuestions = questionnaire.questions.filter((q) =>
      isQuestionVisible(q, responses),
    );

    const responsesArray: SubmitResponseInput[] = visibleQuestions
      .map((q) => responses.get(q.question_id))
      .filter((r): r is SubmitResponseInput => r !== undefined);

    if (responsesArray.length === 0) {
      setError('Please answer at least one question before submitting.');
      setIsSubmitting(false);
      return;
    }

    try {
      const result: EligibilityResult = await prescreeningApi.submitResponses(
        opportunityId,
        responsesArray,
      );
      navigate(`/applicant/opportunities/${opportunityId}/prescreen/result`, { state: result });
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      if (error.response?.status === 409) {
        setError(
          'You have already completed the eligibility pre-screen for this opportunity.',
        );
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to submit responses. Please try again.');
      }
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div aria-busy="true" aria-label="Loading questionnaire">
          Loading questionnaire…
        </div>
      </div>
    );
  }

  return (
    <main id="main-content" tabIndex={-1}>
      <div className="usa-section">
        <div className="grid-container">
          {/* Back navigation */}
          <nav aria-label="Breadcrumb" className="usa-breadcrumb">
            <ol className="usa-breadcrumb__list">
              <li className="usa-breadcrumb__list-item">
                <Link to="/opportunities" className="usa-breadcrumb__link">
                  Opportunities
                </Link>
              </li>
              <li className="usa-breadcrumb__list-item usa-current" aria-current="page">
                Eligibility Pre-Screen
              </li>
            </ol>
          </nav>

          <h1 className="usa-prose">Eligibility Pre-Screen</h1>

          {error && (
            <div className="usa-alert usa-alert--error" role="alert">
              <div className="usa-alert__body">
                <h4 className="usa-alert__heading">Error</h4>
                <p className="usa-alert__text">{error}</p>
              </div>
            </div>
          )}

          {questionnaire && questionnaire.questions.length === 0 && (
            <div className="usa-alert usa-alert--info" role="status">
              <div className="usa-alert__body">
                <p className="usa-alert__text">
                  No eligibility questionnaire has been configured for this opportunity.
                </p>
              </div>
            </div>
          )}

          {questionnaire && questionnaire.questions.length > 0 && (
            <form onSubmit={handleSubmit}>
              <p className="usa-prose">
                Please answer the following questions to determine your eligibility for this
                opportunity. Your responses will be saved and cannot be changed after submission.
              </p>

              {questionnaire.questions.map((question, index) => {
                const visible = isQuestionVisible(question, responses);
                if (!visible) return null;

                const currentResponse = responses.get(question.question_id);

                return (
                  <div
                    key={question.question_id}
                    style={{ marginBottom: '2rem', borderBottom: '1px solid #dfe1e2', paddingBottom: '1.5rem' }}
                  >
                    <fieldset className="usa-fieldset">
                      <legend className="usa-legend">
                        <strong>
                          {index + 1}. {question.question_text}
                          {question.is_required && (
                            <span style={{ color: '#b50909', marginLeft: '0.25rem' }}>*</span>
                          )}
                        </strong>
                      </legend>

                      {/* yes_no question type */}
                      {question.question_type === 'yes_no' && (
                        <div>
                          {['Yes', 'No'].map((label) => (
                            <div key={label} className="usa-radio">
                              <input
                                className="usa-radio__input"
                                type="radio"
                                id={`${question.question_id}-${label.toLowerCase()}`}
                                name={question.question_id}
                                value={label.toLowerCase()}
                                checked={currentResponse?.response_text === label.toLowerCase()}
                                onChange={() => handleYesNoChange(question.question_id, label.toLowerCase())}
                              />
                              <label
                                className="usa-radio__label"
                                htmlFor={`${question.question_id}-${label.toLowerCase()}`}
                              >
                                {label}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* multiple_choice question type */}
                      {question.question_type === 'multiple_choice' && (
                        <div>
                          {question.options.map((option) => (
                            <div key={option.option_id} className="usa-radio">
                              <input
                                className="usa-radio__input"
                                type="radio"
                                id={`${question.question_id}-${option.option_id}`}
                                name={question.question_id}
                                value={option.option_id}
                                checked={currentResponse?.selected_option_id === option.option_id}
                                onChange={() => handleOptionChange(question.question_id, option.option_id)}
                              />
                              <label
                                className="usa-radio__label"
                                htmlFor={`${question.question_id}-${option.option_id}`}
                              >
                                {option.option_text}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* text question type */}
                      {question.question_type === 'text' && (
                        <div className="usa-form-group">
                          <textarea
                            className="usa-textarea"
                            id={`text-${question.question_id}`}
                            name={question.question_id}
                            value={currentResponse?.response_text ?? ''}
                            onChange={(e) => handleTextChange(question.question_id, e.target.value)}
                            rows={4}
                            style={{ maxWidth: '100%' }}
                          />
                        </div>
                      )}
                    </fieldset>
                  </div>
                );
              })}

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button
                  type="submit"
                  className="usa-button"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? 'Submitting…' : 'Submit Responses'}
                </button>
                <Link to="/opportunities" className="usa-link">
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
