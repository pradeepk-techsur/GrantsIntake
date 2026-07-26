import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '../../api/organizationsApi';
import type { OrgDocument } from '../../api/organizationsApi';
import type { OrgDocumentType } from '../../types/organization';

const LOCAL_STORAGE_KEY = 'applicant_org_id';

function getStoredOrgId(): string | null {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEY);
  } catch {
    return null;
  }
}

const DOCUMENT_TYPES: { value: OrgDocumentType; label: string }[] = [
  { value: 'irs_determination_letter', label: 'IRS Determination Letter' },
  { value: 'w9', label: 'W-9 Form' },
  { value: 'audit_report', label: 'Audit Report' },
  { value: 'indirect_cost_agreement', label: 'Indirect Cost Rate Agreement' },
  { value: 'board_roster', label: 'Board Roster' },
  { value: 'insurance_certificate', label: 'Insurance Certificate' },
  { value: 'letters_of_support', label: 'Letters of Support' },
  { value: 'other', label: 'Other' },
];

const ACCEPTED_MIME_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg';
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

function expirationBadge(status: OrgDocument['expiration_status']) {
  if (status === 'expired') {
    return <span className="usa-tag usa-tag--error">Expired</span>;
  }
  if (status === 'expiring_soon') {
    return <span className="usa-tag usa-tag--warning">Expiring Soon</span>;
  }
  return <span className="usa-tag usa-tag--success">Valid</span>;
}

/**
 * OrgDocumentsPage — Standard document library upload/list page.
 *
 * Fetches GET /organizations/:org_id/documents on mount.
 * Groups documents by type using usa-card-group.
 * Upload form handles file selection, type, and expiration date.
 * Version History modal shows all versions per document.
 *
 * NOTE: Server uses base64 JSON for document uploads (per Plan 01 decision).
 * This page converts file → base64 before POST.
 *
 * T-03-11: Client validates file size < 25 MB before submit.
 * T-03-12: Upload button disabled on click, re-enabled on response.
 *
 * org_id sourced from localStorage `applicant_org_id`.
 * If no org, redirects to /applicant/profile.
 */
export function OrgDocumentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const orgId = getStoredOrgId();

  if (!orgId) {
    void navigate('/applicant/profile', { replace: true });
    return null;
  }

  const { data: documents = [], isLoading } = useQuery<OrgDocument[]>({
    queryKey: ['orgDocuments', orgId],
    queryFn: () => organizationsApi.listDocuments(orgId),
    retry: false,
  });

  // Upload form state
  const [docType, setDocType] = useState<OrgDocumentType>('irs_determination_letter');
  const [customName, setCustomName] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Version history modal
  const [versionDocId, setVersionDocId] = useState<string | null>(null);
  const { data: versions = [] } = useQuery<OrgDocument[]>({
    queryKey: ['orgDocVersions', orgId, versionDocId],
    queryFn: () => organizationsApi.listDocumentVersions(orgId, versionDocId!),
    enabled: !!versionDocId,
    retry: false,
  });

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(null);

    if (!file) {
      setUploadError('Please select a file.');
      return;
    }

    // T-03-11: Client-side file size validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError('File must be 25 MB or smaller.');
      return;
    }

    setIsUploading(true);

    try {
      // NOTE: Server uses base64 JSON body (not multipart) per Plan 01 decision.
      // Convert file to base64 and send as JSON.
      const base64 = await fileToBase64(file);
      const payload = {
        document_type: docType,
        custom_document_name: docType === 'other' ? customName : undefined,
        expiration_date: expirationDate || undefined,
        file_name: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
        file_content_base64: base64,
      };

      // Use direct apiClient POST with JSON (not FormData) per server contract
      const { default: apiClient } = await import('../../api/client');
      await apiClient.post(`/organizations/${orgId}/documents`, payload);

      setUploadSuccess('Document uploaded successfully.');
      setFile(null);
      setExpirationDate('');
      setCustomName('');
      void queryClient.invalidateQueries({ queryKey: ['orgDocuments', orgId] });
    } catch (err) {
      setUploadError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
          'Upload failed. Please try again.',
      );
    } finally {
      setIsUploading(false);
    }
  }

  function fileToBase64(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data URI prefix
        resolve(result.split(',')[1] ?? result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  }

  // Group documents by type
  const grouped = DOCUMENT_TYPES.reduce<Record<OrgDocumentType, OrgDocument[]>>(
    (acc, dt) => {
      acc[dt.value] = documents.filter(
        (d) => d.document_type === dt.value && d.is_active,
      );
      return acc;
    },
    {} as Record<OrgDocumentType, OrgDocument[]>,
  );

  if (isLoading) {
    return (
      <div className="usa-prose">
        <p>Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="usa-prose">
      <h1>Documents</h1>
      <p>Upload and manage your organization&rsquo;s standard documents.</p>

      {/* Upload form */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>Upload Document</h2>
        <form className="usa-form" onSubmit={handleUpload} style={{ maxWidth: '36rem' }}>
          {uploadError && (
            <div className="usa-alert usa-alert--error" role="alert">
              <div className="usa-alert__body">
                <p className="usa-alert__text">{uploadError}</p>
              </div>
            </div>
          )}
          {uploadSuccess && (
            <div className="usa-alert usa-alert--success" role="status">
              <div className="usa-alert__body">
                <p className="usa-alert__text">{uploadSuccess}</p>
              </div>
            </div>
          )}

          {/* Document Type */}
          <div className="usa-form-group">
            <label className="usa-label" htmlFor="doc_type">
              Document Type
            </label>
            <select
              className="usa-select"
              id="doc_type"
              name="doc_type"
              value={docType}
              onChange={(e) => setDocType(e.target.value as OrgDocumentType)}
            >
              {DOCUMENT_TYPES.map((dt) => (
                <option key={dt.value} value={dt.value}>
                  {dt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom name (only for "other") */}
          {docType === 'other' && (
            <div className="usa-form-group">
              <label className="usa-label" htmlFor="custom_name">
                Document Name
              </label>
              <input
                className="usa-input"
                id="custom_name"
                name="custom_name"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required={docType === 'other'}
              />
            </div>
          )}

          {/* Expiration Date */}
          <div className="usa-form-group">
            <label className="usa-label" htmlFor="expiration_date">
              Expiration Date (if applicable)
            </label>
            <input
              className="usa-input"
              id="expiration_date"
              name="expiration_date"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
          </div>

          {/* File input */}
          <div className="usa-form-group">
            <label className="usa-label" htmlFor="document_file">
              File
            </label>
            <input
              className="usa-file-input"
              id="document_file"
              name="document_file"
              type="file"
              accept={ACCEPTED_MIME_TYPES}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="usa-hint">Accepted formats: PDF, Word, Excel, PNG, JPG. Max 25 MB.</p>
          </div>

          <button
            className="usa-button"
            type="submit"
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
      </section>

      {/* Document cards grouped by type */}
      <section>
        <h2>Uploaded Documents</h2>
        {documents.length === 0 ? (
          <div className="usa-alert usa-alert--info">
            <div className="usa-alert__body">
              <p className="usa-alert__text">No documents uploaded yet.</p>
            </div>
          </div>
        ) : (
          <div className="usa-card-group">
            {DOCUMENT_TYPES.filter((dt) => (grouped[dt.value]?.length ?? 0) > 0).map((dt) => (
              <div key={dt.value} style={{ marginBottom: '1.5rem', width: '100%' }}>
                <h3>{dt.label}</h3>
                <div className="usa-card-group">
                  {grouped[dt.value].map((doc) => (
                    <div key={doc.attachment_id} className="usa-card usa-card--header-first" style={{ flex: '1 1 300px', maxWidth: '400px' }}>
                      <div className="usa-card__header">
                        <h4 className="usa-card__heading">
                          {doc.custom_document_name ?? dt.label}
                        </h4>
                      </div>
                      <div className="usa-card__body">
                        <p>
                          <strong>Version:</strong> {doc.version_number}
                        </p>
                        <p>
                          <strong>File:</strong> {doc.file_name}
                        </p>
                        <p>
                          <strong>Uploaded:</strong>{' '}
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                        {doc.expiration_date && (
                          <p>
                            <strong>Expires:</strong>{' '}
                            {new Date(doc.expiration_date).toLocaleDateString()}
                          </p>
                        )}
                        <p>
                          <strong>Status:</strong> {expirationBadge(doc.expiration_status)}
                        </p>
                      </div>
                      <div className="usa-card__footer">
                        <button
                          className="usa-button usa-button--unstyled"
                          type="button"
                          onClick={() => setVersionDocId(doc.attachment_id)}
                        >
                          Version History
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Version History Modal */}
      {versionDocId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Version History"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '4px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <h2>Version History</h2>
            {versions.length === 0 ? (
              <p>No version history available.</p>
            ) : (
              <table className="usa-table usa-table--borderless" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th scope="col">Version</th>
                    <th scope="col">File Name</th>
                    <th scope="col">Uploaded</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((v) => (
                    <tr key={v.attachment_id}>
                      <td>{v.version_number}</td>
                      <td>{v.file_name}</td>
                      <td>{new Date(v.uploaded_at).toLocaleDateString()}</td>
                      <td>{expirationBadge(v.expiration_status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button
              className="usa-button"
              type="button"
              onClick={() => setVersionDocId(null)}
              style={{ marginTop: '1rem' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
