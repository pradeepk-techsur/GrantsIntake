import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '../../../store/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScreeningCriterion {
  criterion_id: string;
  opportunity_id: string;
  criterion_text: string;
  criterion_type: 'auto' | 'manual';
  auto_criterion_key?: string;
  is_required: boolean;
  suggested_disposition_on_failure?: string;
  display_order: number;
  created_by: string;
  created_at: string;
}

interface CriterionFormData {
  criterion_text: string;
  is_required: boolean;
  suggested_disposition_on_failure: string;
  display_order: string;
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ScreeningCriteriaConfigProps {
  opportunityId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AUTO_CRITERION_LABELS: Record<string, string> = {
  deadline_check: 'Deadline Check',
  completeness_check: 'Completeness Check',
  eligibility_check: 'Eligibility Check',
  attachment_check: 'Attachment Check',
  duplicate_check: 'Duplicate Check',
};

const EMPTY_FORM: CriterionFormData = {
  criterion_text: '',
  is_required: true,
  suggested_disposition_on_failure: '',
  display_order: '0',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ScreeningCriteriaConfig({ opportunityId }: ScreeningCriteriaConfigProps) {
  const { accessToken } = useAuthStore();
  const [criteria, setCriteria] = useState<ScreeningCriterion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CriterionFormData>({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Drag-and-drop state
  const dragItemRef = useRef<number | null>(null);
  const dragOverItemRef = useRef<number | null>(null);

  // ─── Fetch criteria on mount ────────────────────────────────────────────────

  const fetchCriteria = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/opportunities/${opportunityId}/screening-criteria`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch screening criteria: ${res.status}`);
      }
      const data = await res.json() as ScreeningCriterion[];
      setCriteria(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load screening criteria');
    } finally {
      setIsLoading(false);
    }
  }, [opportunityId, accessToken]);

  useEffect(() => {
    void fetchCriteria();
  }, [fetchCriteria]);

  // ─── Split auto and manual criteria ─────────────────────────────────────

  const autoCriteria = criteria.filter((c) => c.criterion_type === 'auto');
  const manualCriteria = criteria.filter((c) => c.criterion_type === 'manual');

  // ─── Save criterion ────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!formData.criterion_text.trim()) {
      setSaveError('Criterion text is required');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const payload = {
      criterion_text: formData.criterion_text.trim(),
      is_required: formData.is_required,
      suggested_disposition_on_failure: formData.suggested_disposition_on_failure || undefined,
      display_order: parseInt(formData.display_order, 10) || 0,
    };

    try {
      let res: Response;
      if (editingId) {
        res = await fetch(`/api/v1/screening-criteria/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/v1/opportunities/${opportunityId}/screening-criteria`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...payload,
            criterion_type: 'manual',
          }),
        });
      }

      if (!res.ok) {
        const errorBody = await res.json() as { message?: string };
        throw new Error(errorBody.message ?? 'Failed to save criterion');
      }

      setFormData({ ...EMPTY_FORM });
      setShowForm(false);
      setEditingId(null);
      await fetchCriteria();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save screening criterion');
    } finally {
      setIsSaving(false);
    }
  }, [opportunityId, accessToken, formData, editingId, fetchCriteria]);

  // ─── Delete criterion ──────────────────────────────────────────────────────

  const handleDelete = useCallback(async (criterionId: string) => {
    try {
      const res = await fetch(`/api/v1/screening-criteria/${criterionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.status === 403) {
        setError('System criteria cannot be deleted');
        return;
      }
      if (!res.ok && res.status !== 204) {
        throw new Error('Failed to delete criterion');
      }
      await fetchCriteria();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete criterion');
    }
  }, [accessToken, fetchCriteria]);

  // ─── Drag-and-drop reorder for manual criteria ───────────────────────────

  const handleDragStart = (index: number) => {
    dragItemRef.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItemRef.current = index;
  };

  const handleDragEnd = useCallback(async () => {
    if (dragItemRef.current === null || dragOverItemRef.current === null) return;
    if (dragItemRef.current === dragOverItemRef.current) return;

    const reordered = [...manualCriteria];
    const [dragged] = reordered.splice(dragItemRef.current, 1);
    reordered.splice(dragOverItemRef.current, 0, dragged);

    dragItemRef.current = null;
    dragOverItemRef.current = null;

    // Update display_order for all affected items
    try {
      await Promise.all(
        reordered.map((criterion, index) =>
          fetch(`/api/v1/screening-criteria/${criterion.criterion_id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ display_order: index }),
          }),
        ),
      );
      await fetchCriteria();
    } catch {
      setError('Failed to reorder criteria');
    }
  }, [manualCriteria, accessToken, fetchCriteria]);

  const handleEdit = (criterion: ScreeningCriterion) => {
    setFormData({
      criterion_text: criterion.criterion_text,
      is_required: criterion.is_required,
      suggested_disposition_on_failure: criterion.suggested_disposition_on_failure ?? '',
      display_order: String(criterion.display_order),
    });
    setEditingId(criterion.criterion_id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({ ...EMPTY_FORM });
    setShowForm(false);
    setEditingId(null);
    setSaveError(null);
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <section aria-labelledby="screening-heading">
      <h2 id="screening-heading" className="usa-prose" style={{ marginTop: 0 }}>
        Administrative Screening Criteria
      </h2>
      <p className="usa-prose">
        Define what intake staff must verify before accepting or routing an application.
      </p>

      {/* Auto criteria (read-only, locked) */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 className="usa-prose">System Criteria</h3>
        <p className="usa-prose" style={{ fontSize: '0.875rem', color: '#565c65' }}>
          The following criteria are automatically applied to all applications and cannot be modified or deleted.
        </p>
        {isLoading ? (
          <p>Loading criteria...</p>
        ) : (
          <div data-testid="auto-criteria-list">
            {autoCriteria.length === 0 ? (
              <p style={{ color: '#565c65', fontSize: '0.875rem' }}>No system criteria configured yet.</p>
            ) : (
              autoCriteria.map((criterion) => (
                <div
                  key={criterion.criterion_id}
                  className="usa-card"
                  style={{
                    padding: '0.75rem 1rem',
                    marginBottom: '0.5rem',
                    border: '1px solid #dfe1e2',
                    background: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                  data-testid={`auto-criterion-${criterion.auto_criterion_key ?? criterion.criterion_id}`}
                >
                  {/* Lock icon (T-02-12: rendered via JSX, not dangerouslySetInnerHTML) */}
                  <span
                    aria-label="System criterion — cannot be deleted"
                    role="img"
                    style={{ fontSize: '1rem', color: '#565c65' }}
                    data-testid={`lock-icon-${criterion.auto_criterion_key ?? criterion.criterion_id}`}
                  >
                    🔒
                  </span>
                  <span>
                    <strong>
                      {criterion.auto_criterion_key
                        ? AUTO_CRITERION_LABELS[criterion.auto_criterion_key] ?? criterion.criterion_text
                        : criterion.criterion_text}
                    </strong>
                  </span>
                  <span
                    className="usa-tag"
                    style={{ marginLeft: 'auto', background: '#565c65', color: 'white', fontSize: '0.75rem' }}
                  >
                    System
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Manual criteria section */}
      <div>
        <h3 className="usa-prose">Custom Criteria</h3>

        {!showForm && (
          <button
            type="button"
            className="usa-button"
            onClick={() => { setShowForm(true); setEditingId(null); setSaveError(null); }}
            data-testid="add-criterion-btn"
            style={{ marginBottom: '1rem' }}
          >
            + Add Criterion
          </button>
        )}

        {/* Criterion form */}
        {showForm && (
          <div
            className="usa-card"
            style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid #dfe1e2' }}
            data-testid="criterion-form"
          >
            <h4 className="usa-prose" style={{ marginTop: 0 }}>
              {editingId ? 'Edit Criterion' : 'Add Criterion'}
            </h4>

            <div className="usa-form-group">
              <label className="usa-label" htmlFor="criterion-text">
                Criterion Text{' '}
                <abbr title="required" className="usa-hint usa-hint--required">*</abbr>
              </label>
              <span className="usa-hint">Maximum 500 characters</span>
              <textarea
                id="criterion-text"
                className="usa-textarea"
                maxLength={500}
                rows={3}
                value={formData.criterion_text}
                onChange={(e) => setFormData((p) => ({ ...p, criterion_text: e.target.value }))}
                data-testid="criterion-text-input"
              />
            </div>

            <div className="usa-form-group">
              <div className="usa-checkbox">
                <input
                  className="usa-checkbox__input"
                  id="criterion-required"
                  type="checkbox"
                  checked={formData.is_required}
                  onChange={(e) => setFormData((p) => ({ ...p, is_required: e.target.checked }))}
                  data-testid="criterion-required-checkbox"
                />
                <label className="usa-checkbox__label" htmlFor="criterion-required">
                  Required
                </label>
              </div>
            </div>

            <div className="usa-form-group">
              <label className="usa-label" htmlFor="disposition-on-failure">
                Disposition on Failure (optional)
              </label>
              <input
                id="disposition-on-failure"
                className="usa-input"
                type="text"
                value={formData.suggested_disposition_on_failure}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    suggested_disposition_on_failure: e.target.value,
                  }))
                }
                placeholder="e.g., Return, Reject, Escalate"
                data-testid="disposition-input"
              />
            </div>

            <div className="usa-form-group">
              <label className="usa-label" htmlFor="display-order">Display Order</label>
              <input
                id="display-order"
                className="usa-input"
                type="number"
                min={0}
                value={formData.display_order}
                onChange={(e) => setFormData((p) => ({ ...p, display_order: e.target.value }))}
                data-testid="display-order-input"
                style={{ width: '120px' }}
              />
            </div>

            {saveError && (
              <div className="usa-alert usa-alert--error usa-alert--slim" role="alert">
                <div className="usa-alert__body">
                  <p className="usa-alert__text">{saveError}</p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                className="usa-button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                data-testid="save-criterion-btn"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="usa-button usa-button--unstyled"
                onClick={handleCancel}
                data-testid="cancel-criterion-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Manual criteria list with drag-to-reorder */}
        {error && (
          <div className="usa-alert usa-alert--error" role="alert">
            <div className="usa-alert__body">
              <p className="usa-alert__text">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && manualCriteria.length === 0 && (
          <p className="usa-prose" style={{ color: '#565c65' }}>
            No custom criteria configured yet. Click &quot;Add Criterion&quot; to add one.
          </p>
        )}

        <div data-testid="manual-criteria-list">
          {manualCriteria.map((criterion, index) => (
            <div
              key={criterion.criterion_id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={() => void handleDragEnd()}
              onDragOver={(e) => e.preventDefault()}
              style={{
                padding: '0.75rem 1rem',
                marginBottom: '0.5rem',
                border: '1px solid #dfe1e2',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'grab',
              }}
              data-testid={`manual-criterion-${criterion.criterion_id}`}
            >
              {/* Drag handle */}
              <span aria-hidden="true" style={{ color: '#a9aeb1', fontSize: '1.2rem' }}>
                ⋮⋮
              </span>

              <div style={{ flex: 1 }}>
                {/* T-02-12: Rendered via JSX interpolation, not dangerouslySetInnerHTML */}
                <strong>{criterion.criterion_text}</strong>
                <div style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#565c65' }}>
                  {criterion.is_required ? 'Required' : 'Optional'}
                  {criterion.suggested_disposition_on_failure && (
                    <span style={{ marginLeft: '0.5rem' }}>
                      • On failure: {criterion.suggested_disposition_on_failure}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="usa-button usa-button--unstyled"
                  onClick={() => handleEdit(criterion)}
                  data-testid={`edit-criterion-${criterion.criterion_id}`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="usa-button usa-button--unstyled"
                  onClick={() => void handleDelete(criterion.criterion_id)}
                  data-testid={`delete-criterion-${criterion.criterion_id}`}
                  style={{ color: '#e41d3d' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
