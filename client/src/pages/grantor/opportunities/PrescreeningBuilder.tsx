import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '../../../store/authStore';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PrescreeningOption {
  option_id?: string;
  option_text: string;
  mapped_rule_id?: string;
  rule_outcome?: 'met' | 'violated' | 'advisory';
}

interface PrescreeningQuestion {
  question_id?: string;
  question_text: string;
  question_type: 'yes_no' | 'multiple_choice' | 'text';
  is_required: boolean;
  display_order: number;
  conditional_display?: { depends_on_question_id: string; trigger_response_value: string } | null;
  options: PrescreeningOption[];
}

interface PrescreeningQuestionnaire {
  questionnaire_id: string;
  opportunity_id: string;
  placement: 'pre_workspace' | 'pre_submission';
  questions: PrescreeningQuestion[];
}

interface EligibilityRule {
  rule_id: string;
  criterion_field: string;
  explanation_text: string;
  severity: string;
}

interface PreviewQuestion {
  question_id: string;
  question_text: string;
  question_type: string;
  is_required: boolean;
  show_if?: { depends_on_question_id: string; trigger_response_value: string };
  options: Array<{ option_id: string; option_text: string }>;
}

interface PreviewData {
  opportunity_id: string;
  placement: string;
  questions: PreviewQuestion[];
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface PrescreeningBuilderProps {
  opportunityId: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PrescreeningBuilder({ opportunityId }: PrescreeningBuilderProps) {
  const accessToken = useAuthStore((s) => s.accessToken);

  const [questionnaire, setQuestionnaire] = useState<PrescreeningQuestionnaire | null>(null);
  const [eligibilityRules, setEligibilityRules] = useState<EligibilityRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const [placement, setPlacement] = useState<'pre_workspace' | 'pre_submission'>('pre_workspace');
  const [questions, setQuestions] = useState<PrescreeningQuestion[]>([]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formQuestion, setFormQuestion] = useState<PrescreeningQuestion>({
    question_text: '',
    question_type: 'yes_no',
    is_required: true,
    display_order: 0,
    options: [],
  });
  const [showConditional, setShowConditional] = useState(false);

  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Drag-and-drop state
  const dragIndexRef = useRef<number | null>(null);

  // ─── Fetch data ───────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [psRes, rulesRes] = await Promise.all([
        fetch(`/api/v1/opportunities/${opportunityId}/prescreening`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`/api/v1/opportunities/${opportunityId}/eligibility-rules`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (psRes.ok) {
        const data: PrescreeningQuestionnaire | null = await psRes.json();
        if (data) {
          setQuestionnaire(data);
          setPlacement(data.placement);
          setQuestions(data.questions);
        }
      }

      if (rulesRes.ok) {
        const rulesData: EligibilityRule[] = await rulesRes.json();
        setEligibilityRules(rulesData);
      }
    } catch {
      setLoadError('Failed to load prescreening data');
    } finally {
      setIsLoading(false);
    }
  }, [opportunityId, accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Save all ─────────────────────────────────────────────────────────────

  const handleSaveAll = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const payload = {
        placement,
        questions: questions.map((q, idx) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          is_required: q.is_required,
          display_order: idx,
          conditional_display: q.conditional_display ?? null,
          options: q.options.map((opt) => ({
            option_text: opt.option_text,
            mapped_rule_id: opt.mapped_rule_id ?? null,
            rule_outcome: opt.rule_outcome ?? null,
          })),
        })),
      };

      const res = await fetch(`/api/v1/opportunities/${opportunityId}/prescreening`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved: PrescreeningQuestionnaire = await res.json();
        setQuestionnaire(saved);
        setQuestions(saved.questions);
        setSaveStatus('saved');
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [placement, questions, opportunityId, accessToken]);

  // ─── Preview ──────────────────────────────────────────────────────────────

  const handlePreview = useCallback(async () => {
    // Save first, then preview
    await handleSaveAll();

    try {
      const res = await fetch(`/api/v1/opportunities/${opportunityId}/prescreening/preview`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data: PreviewData = await res.json();
        setPreviewData(data);
        setShowPreviewModal(true);
      }
    } catch {
      // noop
    }
  }, [opportunityId, accessToken, handleSaveAll]);

  // ─── Question form helpers ────────────────────────────────────────────────

  const openAddForm = useCallback(() => {
    setFormQuestion({
      question_text: '',
      question_type: 'yes_no',
      is_required: true,
      display_order: questions.length,
      options: [],
    });
    setShowConditional(false);
    setEditingIndex(null);
    setShowAddForm(true);
  }, [questions.length]);

  const handleSaveQuestion = useCallback(() => {
    if (!formQuestion.question_text.trim()) return;

    const updatedQ: PrescreeningQuestion = {
      ...formQuestion,
      conditional_display: showConditional ? formQuestion.conditional_display : null,
    };

    if (editingIndex !== null) {
      setQuestions((qs) => {
        const next = [...qs];
        next[editingIndex] = updatedQ;
        return next;
      });
    } else {
      setQuestions((qs) => [...qs, { ...updatedQ, display_order: qs.length }]);
    }
    setShowAddForm(false);
    setEditingIndex(null);
  }, [formQuestion, editingIndex, showConditional]);

  const handleEditQuestion = useCallback((idx: number) => {
    const q = questions[idx];
    setFormQuestion({ ...q });
    setShowConditional(!!q.conditional_display);
    setEditingIndex(idx);
    setShowAddForm(true);
  }, [questions]);

  const handleDeleteQuestion = useCallback((idx: number) => {
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
  }, []);

  // ─── Option helpers ───────────────────────────────────────────────────────

  const addOption = useCallback(() => {
    setFormQuestion((q) => ({
      ...q,
      options: [...q.options, { option_text: '', mapped_rule_id: undefined, rule_outcome: undefined }],
    }));
  }, []);

  const updateOption = useCallback(
    (optIdx: number, field: keyof PrescreeningOption, value: string) => {
      setFormQuestion((q) => {
        const newOptions = [...q.options];
        newOptions[optIdx] = { ...newOptions[optIdx], [field]: value || undefined };
        return { ...q, options: newOptions };
      });
    },
    [],
  );

  const removeOption = useCallback((optIdx: number) => {
    setFormQuestion((q) => ({
      ...q,
      options: q.options.filter((_, i) => i !== optIdx),
    }));
  }, []);

  // ─── HTML5 Drag-and-drop ──────────────────────────────────────────────────

  const handleDragStart = (idx: number) => {
    dragIndexRef.current = idx;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndexRef.current === null || dragIndexRef.current === idx) return;
  };

  const handleDrop = (idx: number) => {
    if (dragIndexRef.current === null || dragIndexRef.current === idx) return;
    setQuestions((qs) => {
      const next = [...qs];
      const [moved] = next.splice(dragIndexRef.current!, 1);
      next.splice(idx, 0, moved);
      return next.map((q, i) => ({ ...q, display_order: i }));
    });
    dragIndexRef.current = null;
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return <div aria-busy="true"><p>Loading prescreening builder...</p></div>;
  }

  if (loadError) {
    return (
      <div className="usa-alert usa-alert--error" role="alert">
        <div className="usa-alert__body">
          <p className="usa-alert__text">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <section aria-labelledby="prescreening-heading" data-testid="prescreening-builder">
      <h2 id="prescreening-heading" className="usa-prose" style={{ marginTop: 0 }}>
        Pre-Screening Questionnaire
      </h2>

      {/* Placement selector */}
      <div className="usa-form-group">
        <fieldset className="usa-fieldset">
          <legend className="usa-legend">Questionnaire Placement</legend>
          <div className="usa-radio">
            <input
              id="placement-pre-workspace"
              className="usa-radio__input"
              type="radio"
              name="placement"
              value="pre_workspace"
              checked={placement === 'pre_workspace'}
              onChange={() => setPlacement('pre_workspace')}
              data-testid="placement-pre-workspace"
            />
            <label className="usa-radio__label" htmlFor="placement-pre-workspace">
              Before Workspace Access
            </label>
          </div>
          <div className="usa-radio">
            <input
              id="placement-pre-submission"
              className="usa-radio__input"
              type="radio"
              name="placement"
              value="pre_submission"
              checked={placement === 'pre_submission'}
              onChange={() => setPlacement('pre_submission')}
              data-testid="placement-pre-submission"
            />
            <label className="usa-radio__label" htmlFor="placement-pre-submission">
              Before Submission
            </label>
          </div>
        </fieldset>
      </div>

      {/* Add Question button */}
      {!showAddForm && (
        <button
          type="button"
          className="usa-button"
          onClick={openAddForm}
          data-testid="add-question-button"
        >
          Add Question
        </button>
      )}

      {/* ─── Question form ─── */}
      {showAddForm && (
        <div
          className="usa-card"
          style={{ padding: '1.5rem', marginBottom: '1.5rem', background: '#f0f0f0' }}
          data-testid="question-form"
        >
          <h3 style={{ marginTop: 0 }}>{editingIndex !== null ? 'Edit Question' : 'Add Question'}</h3>

          {/* Question Text */}
          <div className="usa-form-group">
            <label className="usa-label" htmlFor="question-text">
              Question Text <abbr title="required" className="usa-hint usa-hint--required">*</abbr>
            </label>
            <span className="usa-hint">Max 500 characters</span>
            <textarea
              id="question-text"
              className="usa-textarea"
              rows={3}
              maxLength={500}
              value={formQuestion.question_text}
              onChange={(e) => setFormQuestion((q) => ({ ...q, question_text: e.target.value }))}
              data-testid="field-question-text"
            />
          </div>

          {/* Question Type */}
          <div className="usa-form-group">
            <fieldset className="usa-fieldset">
              <legend className="usa-legend">Question Type</legend>
              {(['yes_no', 'multiple_choice', 'text'] as const).map((type) => (
                <div key={type} className="usa-radio">
                  <input
                    id={`q-type-${type}`}
                    className="usa-radio__input"
                    type="radio"
                    name="question_type"
                    value={type}
                    checked={formQuestion.question_type === type}
                    onChange={() =>
                      setFormQuestion((q) => ({ ...q, question_type: type, options: [] }))
                    }
                    data-testid={`q-type-${type}`}
                  />
                  <label className="usa-radio__label" htmlFor={`q-type-${type}`}>
                    {type === 'yes_no' ? 'Yes/No' : type === 'multiple_choice' ? 'Multiple Choice' : 'Text'}
                  </label>
                </div>
              ))}
            </fieldset>
          </div>

          {/* Is Required */}
          <div className="usa-form-group">
            <div className="usa-checkbox">
              <input
                id="is-required"
                className="usa-checkbox__input"
                type="checkbox"
                checked={formQuestion.is_required}
                onChange={(e) => setFormQuestion((q) => ({ ...q, is_required: e.target.checked }))}
                data-testid="field-is-required"
              />
              <label className="usa-checkbox__label" htmlFor="is-required">Required</label>
            </div>
          </div>

          {/* Conditional Display */}
          <div className="usa-form-group">
            <div className="usa-checkbox">
              <input
                id="show-conditional"
                className="usa-checkbox__input"
                type="checkbox"
                checked={showConditional}
                onChange={(e) => {
                  setShowConditional(e.target.checked);
                  if (!e.target.checked) {
                    setFormQuestion((q) => ({ ...q, conditional_display: null }));
                  }
                }}
                data-testid="toggle-conditional"
              />
              <label className="usa-checkbox__label" htmlFor="show-conditional">
                Show only if...
              </label>
            </div>

            {showConditional && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f9f9f9', border: '1px solid #ddd' }}>
                <div className="usa-form-group">
                  <label className="usa-label" htmlFor="depends-on-question">
                    Depends on Question
                  </label>
                  <select
                    id="depends-on-question"
                    className="usa-select"
                    value={formQuestion.conditional_display?.depends_on_question_id ?? ''}
                    onChange={(e) =>
                      setFormQuestion((q) => ({
                        ...q,
                        conditional_display: {
                          depends_on_question_id: e.target.value,
                          trigger_response_value:
                            q.conditional_display?.trigger_response_value ?? '',
                        },
                      }))
                    }
                    data-testid="field-depends-on-question"
                  >
                    <option value="">-- Select a question --</option>
                    {questions
                      .filter((_, i) => i !== editingIndex)
                      .map((q, i) => (
                        <option key={q.question_id ?? i} value={q.question_id ?? ''}>
                          {q.question_text.slice(0, 60)}
                          {q.question_text.length > 60 ? '...' : ''}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="usa-form-group">
                  <label className="usa-label" htmlFor="trigger-response">
                    When answer is
                  </label>
                  <input
                    id="trigger-response"
                    className="usa-input"
                    type="text"
                    placeholder="e.g. yes"
                    value={formQuestion.conditional_display?.trigger_response_value ?? ''}
                    onChange={(e) =>
                      setFormQuestion((q) => ({
                        ...q,
                        conditional_display: {
                          depends_on_question_id:
                            q.conditional_display?.depends_on_question_id ?? '',
                          trigger_response_value: e.target.value,
                        },
                      }))
                    }
                    data-testid="field-trigger-response"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Options (for multiple_choice) */}
          {formQuestion.question_type === 'multiple_choice' && (
            <div className="usa-form-group">
              <h4>Options</h4>
              {formQuestion.options.map((opt, optIdx) => (
                <div
                  key={optIdx}
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <input
                    className="usa-input"
                    type="text"
                    placeholder="Option text"
                    value={opt.option_text}
                    onChange={(e) => updateOption(optIdx, 'option_text', e.target.value)}
                    style={{ maxWidth: '200px' }}
                    data-testid={`option-text-${optIdx}`}
                  />
                  <select
                    className="usa-select"
                    value={opt.mapped_rule_id ?? ''}
                    onChange={(e) => updateOption(optIdx, 'mapped_rule_id', e.target.value)}
                    style={{ maxWidth: '200px' }}
                    data-testid={`option-rule-${optIdx}`}
                  >
                    <option value="">No mapped rule</option>
                    {eligibilityRules.map((r) => (
                      <option key={r.rule_id} value={r.rule_id}>
                        {r.criterion_field} ({r.severity})
                      </option>
                    ))}
                  </select>
                  <select
                    className="usa-select"
                    value={opt.rule_outcome ?? ''}
                    onChange={(e) => updateOption(optIdx, 'rule_outcome', e.target.value)}
                    style={{ maxWidth: '120px' }}
                    data-testid={`option-outcome-${optIdx}`}
                  >
                    <option value="">Outcome</option>
                    <option value="met">Met</option>
                    <option value="violated">Violated</option>
                    <option value="advisory">Advisory</option>
                  </select>
                  <button
                    type="button"
                    className="usa-button usa-button--unstyled"
                    style={{ color: '#b50909', fontSize: '0.875rem' }}
                    onClick={() => removeOption(optIdx)}
                    data-testid={`remove-option-${optIdx}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="usa-button usa-button--outline"
                style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}
                onClick={addOption}
                data-testid="add-option-button"
              >
                + Add Option
              </button>
            </div>
          )}

          {/* Form actions */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="button"
              className="usa-button"
              onClick={handleSaveQuestion}
              disabled={!formQuestion.question_text.trim()}
              data-testid="save-question-button"
            >
              Save Question
            </button>
            <button
              type="button"
              className="usa-button usa-button--outline"
              onClick={() => {
                setShowAddForm(false);
                setEditingIndex(null);
              }}
              data-testid="cancel-question-button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ─── Questions list (draggable) ─── */}
      {questions.length === 0 && !showAddForm && (
        <div className="usa-alert usa-alert--info">
          <div className="usa-alert__body">
            <p className="usa-alert__text">No questions yet. Click "Add Question" to start.</p>
          </div>
        </div>
      )}

      <div data-testid="questions-list">
        {questions.map((q, idx) => (
          <div
            key={q.question_id ?? idx}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '0.75rem',
              marginBottom: '0.5rem',
              border: '1px solid #ddd',
              background: 'white',
              cursor: 'grab',
              borderRadius: '4px',
            }}
            data-testid={`question-row-${idx}`}
          >
            <div>
              <p style={{ margin: 0 }}>
                <strong>{idx + 1}. {q.question_text}</strong>
              </p>
              <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#565c65' }}>
                Type:{' '}
                {q.question_type === 'yes_no'
                  ? 'Yes/No'
                  : q.question_type === 'multiple_choice'
                  ? 'Multiple Choice'
                  : 'Text'}{' '}
                {q.is_required ? '(Required)' : '(Optional)'}
              </p>
              {q.conditional_display && (
                <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#71767a' }}>
                  ↳ Shown if answer = &quot;{q.conditional_display.trigger_response_value}&quot;
                </p>
              )}
              {q.options.length > 0 && (
                <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#565c65' }}>
                  {q.options.length} option(s)
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <button
                type="button"
                className="usa-button usa-button--unstyled"
                onClick={() => handleEditQuestion(idx)}
                data-testid={`edit-question-${idx}`}
              >
                Edit
              </button>
              <button
                type="button"
                className="usa-button usa-button--unstyled"
                style={{ color: '#b50909' }}
                onClick={() => handleDeleteQuestion(idx)}
                data-testid={`delete-question-${idx}`}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Actions bar ─── */}
      {(questions.length > 0 || questionnaire) && (
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            className="usa-button"
            onClick={handleSaveAll}
            disabled={isSaving}
            data-testid="save-all-button"
          >
            {isSaving ? 'Saving...' : 'Save All'}
          </button>
          <button
            type="button"
            className="usa-button usa-button--outline"
            onClick={handlePreview}
            data-testid="preview-button"
          >
            Preview
          </button>
          {saveStatus === 'saved' && (
            <span style={{ color: '#2e7d32', alignSelf: 'center' }} role="status">
              Saved!
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ color: '#b50909', alignSelf: 'center' }} role="alert">
              Save failed. Please try again.
            </span>
          )}
        </div>
      )}

      {/* ─── Preview modal ─── */}
      {showPreviewModal && previewData && (
        <div
          className="usa-modal-wrapper is-visible"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-modal-heading"
          data-testid="preview-modal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            overflow: 'auto',
          }}
        >
          <div
            className="usa-modal"
            style={{
              background: 'white',
              padding: '2rem',
              maxWidth: '640px',
              width: '100%',
              borderRadius: '4px',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
          >
            <h2 id="preview-modal-heading" className="usa-modal__heading">
              Questionnaire Preview
            </h2>
            <p>
              Placement:{' '}
              {previewData.placement === 'pre_workspace'
                ? 'Before Workspace Access'
                : 'Before Submission'}
            </p>

            {previewData.questions.map((q, idx) => (
              <div key={q.question_id} style={{ marginBottom: '1.5rem' }}>
                <p>
                  <strong>
                    {idx + 1}. {q.question_text}
                    {q.is_required && <abbr title="required" className="usa-hint usa-hint--required"> *</abbr>}
                  </strong>
                </p>
                {q.show_if && (
                  <p style={{ fontSize: '0.875rem', color: '#71767a' }}>
                    (Shown if question {q.show_if.depends_on_question_id.slice(0, 8)}... = &quot;{q.show_if.trigger_response_value}&quot;)
                  </p>
                )}
                {q.question_type === 'yes_no' && (
                  <div className="usa-fieldset">
                    <div className="usa-radio">
                      <input className="usa-radio__input" type="radio" name={`preview-${q.question_id}`} id={`prev-yes-${q.question_id}`} disabled />
                      <label className="usa-radio__label" htmlFor={`prev-yes-${q.question_id}`}>Yes</label>
                    </div>
                    <div className="usa-radio">
                      <input className="usa-radio__input" type="radio" name={`preview-${q.question_id}`} id={`prev-no-${q.question_id}`} disabled />
                      <label className="usa-radio__label" htmlFor={`prev-no-${q.question_id}`}>No</label>
                    </div>
                  </div>
                )}
                {q.question_type === 'multiple_choice' && q.options.length > 0 && (
                  <div className="usa-fieldset">
                    {q.options.map((opt) => (
                      <div key={opt.option_id} className="usa-radio">
                        <input
                          className="usa-radio__input"
                          type="radio"
                          name={`preview-${q.question_id}`}
                          id={`prev-opt-${opt.option_id}`}
                          disabled
                        />
                        <label className="usa-radio__label" htmlFor={`prev-opt-${opt.option_id}`}>
                          {opt.option_text}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                {q.question_type === 'text' && (
                  <textarea className="usa-textarea" rows={3} disabled placeholder="Applicant response..." />
                )}
              </div>
            ))}

            <button
              type="button"
              className="usa-button"
              onClick={() => setShowPreviewModal(false)}
              data-testid="close-preview-button"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
