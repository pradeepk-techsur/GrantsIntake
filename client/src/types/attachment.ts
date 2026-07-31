/**
 * Client-side attachment types mirroring server-side src/types/attachment.ts
 * Corresponds to the attachments table (migration 013_budget_attachments_schema).
 */

export interface WorkspaceAttachment {
  attachment_id: string;
  workspace_id: string;
  section_id?: string;
  requirement_id?: string;
  source_type: 'upload' | 'library';
  org_document_id?: string;
  file_name?: string;
  file_path?: string;
  mime_type?: string;
  file_size_bytes?: number;
  version_number: number;
  is_active: boolean;
  uploaded_by?: string;
  uploaded_at: string;
}

export interface UploadAttachmentInput {
  source_type: 'upload';
  requirement_id?: string;
  section_id?: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  content_base64: string;
}

export interface LinkLibraryAttachmentInput {
  source_type: 'library';
  requirement_id?: string;
  section_id?: string;
  org_document_id: string;
}
