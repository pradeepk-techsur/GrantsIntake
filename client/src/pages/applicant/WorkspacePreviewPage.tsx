import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { workspaceApi } from '../../api/workspaceApi';

export function WorkspacePreviewPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  const { data: preview, isLoading, error } = useQuery({
    queryKey: ['preview', workspaceId],
    queryFn: () => workspaceApi.getPreview(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 0, // Always fresh — preview should reflect latest data
  });

  if (isLoading) {
    return (
      <div  style={{ padding: '2rem' }}>
        <p className="gf-hint">Generating preview…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div  style={{ padding: '2rem' }}>
        <div className="gf-alert gf-alert gf-alert--error">
          <div >
            <h4 className="gf-alert__title">Preview Failed</h4>
            <p className="gf-alert__text">
              Failed to load preview. Please go back and try again.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="gf-btn gf-btn--primary gf-btn gf-btn--ghost"
          onClick={() => navigate(-1)}
          style={{ marginTop: '1rem' }}
        >
          ← Back to Application
        </button>
      </div>
    );
  }

  return (
    <div data-testid="preview-page" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* PROMINENT DRAFT LABEL — required by PRD-INTAKE-043 */}
      <div className="gf-alert gf-alert gf-alert--warning" data-testid="draft-preview-banner">
        <div >
          <h1 className="gf-alert__title">DRAFT PREVIEW — NOT SUBMITTED</h1>
          <p className="gf-alert__text">
            This is a preview of your application as it will appear to the grantor.{' '}
            <strong>This preview does not initiate submission.</strong>
          </p>
        </div>
      </div>

      <div  style={{ margin: '1rem 0' }}>
        <button
          type="button"
          className="gf-btn gf-btn--primary gf-btn gf-btn--ghost"
          onClick={() => navigate(-1)}
        >
          ← Back to Application
        </button>
      </div>

      {preview && (
        <>
          {/* Metadata */}
          <div className="gf-hint" style={{ marginBottom: '1.5rem' }}>
            Generated: {new Date(preview.generated_at).toLocaleString()}
          </div>

          {/* Sections */}
          {preview.sections.map(sec => (
            <section
              key={sec.section_id}
              data-testid={`preview-section-${sec.section_type}`}
              style={{ marginBottom: '2rem', borderBottom: '1px solid #dcdee0', paddingBottom: '1rem' }}
            >
              <h2>{sec.section_name}</h2>
              <div className="gf-hint" style={{ marginBottom: '0.75rem' }}>
                Status: {sec.status.replace('_', ' ')}
              </div>
              {sec.fields.length === 0 ? (
                <p className="gf-hint">No fields defined for this section.</p>
              ) : (
                <dl>
                  {sec.fields.map(f => (
                    <div key={f.field_id} style={{ marginBottom: '0.75rem' }}>
                      <dt><strong>{f.label}</strong></dt>
                      <dd style={{ marginLeft: '1rem' }}>
                        {f.response_value ? (
                          <span>{f.response_value}</span>
                        ) : f.response_json ? (
                          <span>{JSON.stringify(f.response_json)}</span>
                        ) : (
                          <em className="gf-hint">Not provided</em>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          ))}

          {/* Budget summary */}
          {preview.budget.budget_id && (
            <section data-testid="preview-budget" style={{ marginBottom: '2rem' }}>
              <h2>Budget Summary</h2>
              <table className="gf-table gf-table">
                <tbody>
                  <tr>
                    <th>Total Federal Request</th>
                    <td>${preview.budget.total_federal_request?.toFixed(2) ?? '0.00'}</td>
                  </tr>
                  <tr>
                    <th>Total Match</th>
                    <td>${preview.budget.total_match?.toFixed(2) ?? '0.00'}</td>
                  </tr>
                  <tr>
                    <th>Total Indirect</th>
                    <td>${preview.budget.total_indirect?.toFixed(2) ?? '0.00'}</td>
                  </tr>
                  <tr>
                    <th><strong>Total Project Cost</strong></th>
                    <td><strong>${preview.budget.total_project_cost?.toFixed(2) ?? '0.00'}</strong></td>
                  </tr>
                </tbody>
              </table>

              {preview.budget.line_items.length > 0 && (
                <>
                  <h3>Budget Line Items</h3>
                  <table className="gf-table gf-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.budget.line_items.map((li, idx) => (
                        <tr key={idx}>
                          <td>{li.category}</td>
                          <td>{li.description}</td>
                          <td>${li.total_cost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </section>
          )}

          {/* Attachments */}
          {preview.attachments.length > 0 && (
            <section data-testid="preview-attachments" style={{ marginBottom: '2rem' }}>
              <h2>Attachments</h2>
              <ul >
                {preview.attachments.map(att => (
                  <li key={att.attachment_id}>
                    {att.file_name ?? '(unnamed)'} (v{att.version_number})
                    <span className="gf-hint" style={{ marginLeft: '0.5rem' }}>
                      {att.source_type === 'upload' ? 'Uploaded' : 'Library'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* CRITICAL: workspace_comments are NOT rendered here — T-04-03, PRD-INTAKE-033 */}
        </>
      )}
    </div>
  );
}
