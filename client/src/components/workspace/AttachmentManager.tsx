import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceApi } from '../../api/workspaceApi';
import type { WorkspaceAttachment } from '../../types/attachment';

interface AttachmentManagerProps {
  workspaceId: string;
  requirementId?: string;
}

export function AttachmentManager({ workspaceId, requirementId }: AttachmentManagerProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showVersions, setShowVersions] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: attachments = [], isLoading, error } = useQuery({
    queryKey: ['attachments', workspaceId],
    queryFn: () => workspaceApi.listAttachments(workspaceId),
  });

  const { data: versions = [] } = useQuery({
    queryKey: ['attachment-versions', workspaceId, showVersions],
    queryFn: () => workspaceApi.getAttachmentVersions(workspaceId, showVersions!),
    enabled: !!showVersions,
  });

  const uploadMutation = useMutation({
    mutationFn: (input: Parameters<typeof workspaceApi.uploadAttachment>[1]) =>
      workspaceApi.uploadAttachment(workspaceId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', workspaceId] });
      setUploadError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setUploadError(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (attachmentId: string) => workspaceApi.deleteAttachment(workspaceId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', workspaceId] });
      setConfirmDelete(null);
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      uploadMutation.mutate({
        source_type: 'upload',
        file_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        file_size_bytes: file.size,
        content_base64: base64,
        requirement_id: requirementId,
      });
    };
    reader.readAsDataURL(file);
  };

  // Filter attachments by requirementId if provided
  const displayAttachments = requirementId
    ? attachments.filter((a: WorkspaceAttachment) => a.requirement_id === requirementId)
    : attachments;

  if (isLoading) {
    return <div className="usa-prose"><p className="usa-hint">Loading attachments…</p></div>;
  }

  if (error) {
    return (
      <div className="usa-alert usa-alert--error">
        <div className="usa-alert__body">
          <p className="usa-alert__text">Failed to load attachments. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="attachment-manager">
      <h3>Attachments</h3>

      {/* Upload error alert */}
      {uploadError && (
        <div className="usa-alert usa-alert--error" style={{ marginBottom: '1rem' }}>
          <div className="usa-alert__body">
            <p className="usa-alert__text">{uploadError}</p>
          </div>
        </div>
      )}

      {/* Upload pending indicator */}
      {uploadMutation.isPending && (
        <div className="usa-alert usa-alert--info" style={{ marginBottom: '1rem' }}>
          <div className="usa-alert__body">
            <p className="usa-alert__text">Uploading file…</p>
          </div>
        </div>
      )}

      {/* Action buttons — USWDS usa-button-group */}
      <ul className="usa-button-group" style={{ marginBottom: '1rem' }}>
        <li className="usa-button-group__item">
          <button
            type="button"
            className="usa-button"
            data-testid="upload-attachment-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            Upload New File
          </button>
        </li>
        <li className="usa-button-group__item">
          <button
            type="button"
            className="usa-button usa-button--outline"
            data-testid="link-library-btn"
            onClick={() => {
              // Library link feature — opens a note for future implementation
              alert('Org document library linking: Select a document from your organization library to attach.');
            }}
          >
            Link from Library
          </button>
        </li>
      </ul>

      {/* USWDS file input — visually hidden via positioning, accessible via Upload button trigger */}
      <input
        ref={fileInputRef}
        type="file"
        className="usa-file-input"
        style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
        onChange={handleFileUpload}
        aria-label="Upload attachment file"
        tabIndex={-1}
      />

      {/* Attachments table */}
      {displayAttachments.length === 0 ? (
        <p className="usa-hint">No attachments yet. Upload a file or link from your document library.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="usa-table usa-table--borderless" style={{ width: '100%' }} data-testid="attachment-list">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Source</th>
                <th>Version</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayAttachments.map((att: WorkspaceAttachment) => (
                <tr key={att.attachment_id}>
                  <td>
                    {att.file_name ?? '(unnamed)'}
                    {att.mime_type && (
                      <div className="usa-hint" style={{ fontSize: '0.8rem' }}>{att.mime_type}</div>
                    )}
                  </td>
                  <td>
                    <span className="usa-tag">
                      {att.source_type === 'upload' ? 'Upload' : 'Library'}
                    </span>
                  </td>
                  <td>v{att.version_number}</td>
                  <td>{new Date(att.uploaded_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="usa-button usa-button--unstyled"
                        onClick={() => setShowVersions(
                          showVersions === att.attachment_id ? null : att.attachment_id
                        )}
                        style={{ fontSize: '0.875rem' }}
                      >
                        {showVersions === att.attachment_id ? 'Hide Versions' : 'View Versions'}
                      </button>
                      <button
                        type="button"
                        className="usa-button usa-button--unstyled usa-button--secondary"
                        onClick={() => setConfirmDelete(att.attachment_id)}
                        style={{ fontSize: '0.875rem' }}
                        data-testid={`delete-attachment-btn-${att.attachment_id}`}
                      >
                        Delete
                      </button>
                    </div>

                    {/* Version history inline */}
                    {showVersions === att.attachment_id && versions.length > 0 && (
                      <div style={{ marginTop: '0.5rem', background: '#f0f0f0', padding: '0.5rem', borderRadius: '4px' }}>
                        <strong style={{ fontSize: '0.85rem' }}>Version History:</strong>
                        <ul className="usa-list usa-list--unstyled" style={{ marginTop: '0.25rem' }}>
                          {versions.map((v: WorkspaceAttachment) => (
                            <li key={v.attachment_id} style={{ fontSize: '0.85rem' }}>
                              v{v.version_number} — {v.file_name ?? '(unnamed)'}{' '}
                              <span className="usa-hint">
                                ({v.is_active ? 'active' : 'superseded'})
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Delete confirmation */}
                    {confirmDelete === att.attachment_id && (
                      <div style={{ marginTop: '0.5rem', background: '#fff1f1', padding: '0.5rem', borderRadius: '4px', border: '1px solid #b50909' }}>
                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem' }}>
                          Are you sure? This will mark the attachment as inactive.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="usa-button usa-button--secondary usa-button--small"
                            onClick={() => deleteMutation.mutate(att.attachment_id)}
                            disabled={deleteMutation.isPending}
                          >
                            Yes, delete
                          </button>
                          <button
                            type="button"
                            className="usa-button usa-button--unstyled usa-button--small"
                            onClick={() => setConfirmDelete(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
