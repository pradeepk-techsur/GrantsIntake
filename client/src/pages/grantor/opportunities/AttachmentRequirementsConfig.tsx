import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttachmentRequirement {
  requirement_id: string;
  opportunity_id: string;
  document_type: string;
  custom_document_name?: string;
  applicant_type_scope: string[];
  stage_scope: 'pre_application' | 'loi' | 'full_application';
  is_required: boolean;
  instructions?: string;
  file_format_restrictions?: string[];
  max_file_size_mb: number;
  created_by: string;
  created_at: string;
}

interface AttachmentFormData {
  document_type: string;
  custom_document_name: string;
  stage_scope: 'pre_application' | 'loi' | 'full_application';
  applicant_type_scope: string[];
  is_required: boolean;
  instructions: string;
  file_format_restrictions: string;
  max_file_size_mb: string;
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface AttachmentRequirementsConfigProps {
  opportunityId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'financial_statements', label: 'Financial Statements' },
  { value: 'proof_of_nonprofit_status', label: 'Proof of Nonprofit Status' },
  { value: 'board_resolution', label: 'Board Resolution' },
  { value: 'logic_model', label: 'Logic Model' },
  { value: 'work_plan', label: 'Work Plan' },
  { value: 'letters_of_support', label: 'Letters of Support' },
  { value: 'budget_narrative', label: 'Budget Narrative' },
  { value: 'audit_report', label: 'Audit Report' },
  { value: 'articles_of_incorporation', label: 'Articles of Incorporation' },
  { value: 'custom', label: 'Custom' },
];

const STAGE_OPTIONS = [
  { value: 'pre_application', label: 'Pre-Application' },
  { value: 'loi', label: 'Letter of Intent' },
  { value: 'full_application', label: 'Full Application' },
] as const;

const APPLICANT_TYPE_OPTIONS = [
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'for_profit', label: 'For-Profit' },
  { value: 'government', label: 'Government' },
  { value: 'tribal', label: 'Tribal' },
  { value: 'individual', label: 'Individual' },
];

const EMPTY_FORM: AttachmentFormData = {
  document_type: 'financial_statements',
  custom_document_name: '',
  stage_scope: 'full_application',
  applicant_type_scope: [],
  is_required: true,
  instructions: '',
  file_format_restrictions: '',
  max_file_size_mb: '50',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AttachmentRequirementsConfig({ opportunityId }: AttachmentRequirementsConfigProps) {
  const { accessToken } = useAuthStore();
  const [requirements, setRequirements] = useState<AttachmentRequirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<AttachmentFormData>({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ─── Fetch requirements on mount ────────────────────────────────────────────

  const fetchRequirements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/opportunities/${opportunityId}/attachment-requirements`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch attachment requirements: ${res.status}`);
      }
      const data = await res.json() as AttachmentRequirement[];
      setRequirements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attachment requirements');
    } finally {
      setIsLoading(false);
    }
  }, [opportunityId, accessToken]);

  useEffect(() => {
    void fetchRequirements();
  }, [fetchRequirements]);

  // ─── Form handlers ───────────────────────────────────────────────────────

  const handleApplicantTypeToggle = (type: string) => {
    setFormData((prev) => {
      const scope = prev.applicant_type_scope.includes(type)
        ? prev.applicant_type_scope.filter((t) => t !== type)
        : [...prev.applicant_type_scope, type];
      return { ...prev, applicant_type_scope: scope };
    });
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);

    const fileFormats = formData.file_format_restrictions
      ? formData.file_format_restrictions.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const maxSize = parseInt(formData.max_file_size_mb, 10);
    if (isNaN(maxSize) || maxSize < 1 || maxSize > 500) {
      setSaveError('Max file size must be between 1 and 500 MB');
      setIsSaving(false);
      return;
    }

    const payload = {
      document_type: formData.document_type,
      custom_document_name: formData.document_type === 'custom' ? formData.custom_document_name : undefined,
      stage_scope: formData.stage_scope,
      applicant_type_scope: formData.applicant_type_scope,
      is_required: formData.is_required,
      instructions: formData.instructions || undefined,
      file_format_restrictions: fileFormats.length > 0 ? fileFormats : undefined,
      max_file_size_mb: maxSize,
    };

    try {
      let res: Response;
      if (editingId) {
        res = await fetch(`/api/v1/attachment-requirements/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/v1/opportunities/${opportunityId}/attachment-requirements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errorBody = await res.json() as { message?: string };
        throw new Error(errorBody.message ?? 'Failed to save requirement');
      }

      setFormData({ ...EMPTY_FORM });
      setShowForm(false);
      setEditingId(null);
      await fetchRequirements();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save attachment requirement');
    } finally {
      setIsSaving(false);
    }
  }, [opportunityId, accessToken, formData, editingId, fetchRequirements]);

  const handleEdit = (req: AttachmentRequirement) => {
    setFormData({
      document_type: req.document_type,
      custom_document_name: req.custom_document_name ?? '',
      stage_scope: req.stage_scope,
      applicant_type_scope: req.applicant_type_scope ?? [],
      is_required: req.is_required,
      instructions: req.instructions ?? '',
      file_format_restrictions: req.file_format_restrictions?.join(', ') ?? '',
      max_file_size_mb: String(req.max_file_size_mb),
    });
    setEditingId(req.requirement_id);
    setShowForm(true);
  };

  const handleDelete = useCallback(async (requirementId: string) => {
    try {
      const res = await fetch(`/api/v1/attachment-requirements/${requirementId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok && res.status !== 204) {
        throw new Error('Failed to delete requirement');
      }
      await fetchRequirements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete requirement');
    }
  }, [accessToken, fetchRequirements]);

  const handleCancel = () => {
    setFormData({ ...EMPTY_FORM });
    setShowForm(false);
    setEditingId(null);
    setSaveError(null);
  };

  // ─── Group requirements by stage ─────────────────────────────────────────

  const grouped = STAGE_OPTIONS.map((stage) => ({
    stage: stage.value,
    label: stage.label,
    items: requirements.filter((r) => r.stage_scope === stage.value),
  }));

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <section aria-labelledby="attachments-heading">
      <h2 id="attachments-heading" className="usa-prose" style={{ marginTop: 0 }}>
        Required Documents
      </h2>
      <p className="usa-prose">
        Specify what applicants must attach based on entity type and application stage.
      </p>

      {!showForm && (
        <button
          type="button"
          className="usa-button"
          onClick={() => { setShowForm(true); setEditingId(null); setSaveError(null); }}
          data-testid="add-requirement-btn"
          style={{ marginBottom: '1.5rem' }}
        >
          + Add Document Requirement
        </button>
      )}

      {/* Inline form */}
      {showForm && (
        <div
          className="usa-card"
          style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid #dfe1e2' }}
          data-testid="attachment-form"
        >
          <h3 className="usa-prose" style={{ marginTop: 0 }}>
            {editingId ? 'Edit Document Requirement' : 'Add Document Requirement'}
          </h3>

          {/* Document Type */}
          <div className="usa-form-group">
            <label className="usa-label" htmlFor="document-type">Document Type</label>
            <select
              id="document-type"
              className="usa-select"
              value={formData.document_type}
              onChange={(e) => setFormData((p) => ({ ...p, document_type: e.target.value }))}
              data-testid="document-type-select"
            >
              {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {formData.document_type === 'custom' && (
            <div className="usa-form-group">
              <label className="usa-label" htmlFor="custom-document-name">Custom Document Name</label>
              <input
                id="custom-document-name"
                className="usa-input"
                type="text"
                maxLength={250}
                value={formData.custom_document_name}
                onChange={(e) => setFormData((p) => ({ ...p, custom_document_name: e.target.value }))}
                data-testid="custom-document-name-input"
              />
            </div>
          )}

          {/* Stage */}
          <div className="usa-form-group">
            <label className="usa-label" htmlFor="stage-scope">Stage</label>
            <select
              id="stage-scope"
              className="usa-select"
              value={formData.stage_scope}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  stage_scope: e.target.value as 'pre_application' | 'loi' | 'full_application',
                }))
              }
              data-testid="stage-scope-select"
            >
              {STAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Applicant Type Scope */}
          <fieldset className="usa-fieldset">
            <legend className="usa-legend">Applicant Type Scope</legend>
            <span className="usa-hint">Leave unchecked to apply to all applicant types</span>
            {APPLICANT_TYPE_OPTIONS.map((opt) => (
              <div key={opt.value} className="usa-checkbox">
                <input
                  className="usa-checkbox__input"
                  id={`applicant-type-${opt.value}`}
                  type="checkbox"
                  checked={formData.applicant_type_scope.includes(opt.value)}
                  onChange={() => handleApplicantTypeToggle(opt.value)}
                  data-testid={`applicant-type-${opt.value}`}
                />
                <label className="usa-checkbox__label" htmlFor={`applicant-type-${opt.value}`}>
                  {opt.label}
                </label>
              </div>
            ))}
          </fieldset>

          {/* Required vs Recommended */}
          <fieldset className="usa-fieldset">
            <legend className="usa-legend">Requirement Level</legend>
            <div className="usa-radio" style={{ display: 'flex', gap: '1.5rem' }}>
              <div>
                <input
                  className="usa-radio__input"
                  id="is-required-yes"
                  type="radio"
                  name="is-required"
                  checked={formData.is_required}
                  onChange={() => setFormData((p) => ({ ...p, is_required: true }))}
                  data-testid="is-required-yes"
                />
                <label className="usa-radio__label" htmlFor="is-required-yes">Required</label>
              </div>
              <div>
                <input
                  className="usa-radio__input"
                  id="is-required-no"
                  type="radio"
                  name="is-required"
                  checked={!formData.is_required}
                  onChange={() => setFormData((p) => ({ ...p, is_required: false }))}
                  data-testid="is-required-no"
                />
                <label className="usa-radio__label" htmlFor="is-required-no">Recommended</label>
              </div>
            </div>
          </fieldset>

          {/* Instructions */}
          <div className="usa-form-group">
            <label className="usa-label" htmlFor="instructions">Instructions (optional)</label>
            <textarea
              id="instructions"
              className="usa-textarea"
              rows={3}
              value={formData.instructions}
              onChange={(e) => setFormData((p) => ({ ...p, instructions: e.target.value }))}
              data-testid="instructions-input"
            />
          </div>

          {/* File Formats */}
          <div className="usa-form-group">
            <label className="usa-label" htmlFor="file-formats">File Formats (comma-separated)</label>
            <span className="usa-hint">e.g., .pdf, .docx, .xlsx</span>
            <input
              id="file-formats"
              className="usa-input"
              type="text"
              value={formData.file_format_restrictions}
              onChange={(e) =>
                setFormData((p) => ({ ...p, file_format_restrictions: e.target.value }))
              }
              placeholder=".pdf, .docx"
              data-testid="file-formats-input"
            />
          </div>

          {/* Max File Size */}
          <div className="usa-form-group">
            <label className="usa-label" htmlFor="max-file-size">Max File Size (MB)</label>
            <input
              id="max-file-size"
              className="usa-input"
              type="number"
              min={1}
              max={500}
              value={formData.max_file_size_mb}
              onChange={(e) =>
                setFormData((p) => ({ ...p, max_file_size_mb: e.target.value }))
              }
              data-testid="max-file-size-input"
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
              data-testid="save-requirement-btn"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="usa-button usa-button--unstyled"
              onClick={handleCancel}
              data-testid="cancel-requirement-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Requirements table grouped by stage */}
      {isLoading ? (
        <p>Loading attachment requirements...</p>
      ) : error ? (
        <div className="usa-alert usa-alert--error" role="alert">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error}</p>
          </div>
        </div>
      ) : (
        grouped.map((group) =>
          group.items.length === 0 ? null : (
            <div key={group.stage} style={{ marginBottom: '2rem' }}>
              <h3 className="usa-prose" data-testid={`stage-group-${group.stage}`}>
                {group.label}
              </h3>
              <table className="usa-table usa-table--borderless" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th scope="col">Document Type</th>
                    <th scope="col">Applicant Types</th>
                    <th scope="col">Required?</th>
                    <th scope="col">Formats</th>
                    <th scope="col">Max Size</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((req) => (
                    <tr key={req.requirement_id} data-testid={`requirement-row-${req.requirement_id}`}>
                      <td>
                        {req.document_type === 'custom' && req.custom_document_name
                          ? req.custom_document_name
                          : DOCUMENT_TYPE_OPTIONS.find((o) => o.value === req.document_type)?.label ??
                            req.document_type}
                      </td>
                      <td>
                        {req.applicant_type_scope.length === 0
                          ? 'All'
                          : req.applicant_type_scope
                              .map(
                                (t) =>
                                  APPLICANT_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t,
                              )
                              .join(', ')}
                      </td>
                      <td>{req.is_required ? 'Required' : 'Recommended'}</td>
                      <td>
                        {req.file_format_restrictions && req.file_format_restrictions.length > 0
                          ? req.file_format_restrictions.join(', ')
                          : 'Any'}
                      </td>
                      <td>{req.max_file_size_mb} MB</td>
                      <td>
                        <button
                          type="button"
                          className="usa-button usa-button--unstyled"
                          onClick={() => handleEdit(req)}
                          data-testid={`edit-requirement-${req.requirement_id}`}
                          style={{ marginRight: '0.75rem' }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="usa-button usa-button--unstyled"
                          onClick={() => void handleDelete(req.requirement_id)}
                          data-testid={`delete-requirement-${req.requirement_id}`}
                          style={{ color: '#e41d3d' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ),
        )
      )}

      {!isLoading && !error && requirements.length === 0 && !showForm && (
        <p className="usa-prose">No attachment requirements configured yet.</p>
      )}
    </section>
  );
}
