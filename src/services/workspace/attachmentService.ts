import { pool } from '../../db/client';
import * as fs from 'fs';
import * as path from 'path';
import { WorkspaceAttachment, UploadAttachmentInput, LinkLibraryAttachmentInput } from '../../types/attachment';

const UPLOAD_BASE = path.join(process.cwd(), 'uploads', 'workspaces');

class AttachmentService {
  async listAttachments(workspaceId: string): Promise<WorkspaceAttachment[]> {
    const result = await pool.query<WorkspaceAttachment>(
      `SELECT * FROM attachments WHERE workspace_id = $1 AND is_active = true ORDER BY uploaded_at DESC`,
      [workspaceId],
    );
    return result.rows;
  }

  /**
   * Upload attachment as base64 JSON.
   * Version history: deactivate prior active version for same requirement_id before inserting new.
   * New attachment always gets version_number = prior_max + 1 (or 1 if first).
   */
  async uploadAttachment(workspaceId: string, input: UploadAttachmentInput, uploadedBy: string): Promise<WorkspaceAttachment> {
    // Determine next version number for this requirement
    let versionNumber = 1;
    if (input.requirement_id) {
      const versionResult = await pool.query<{ max_version: string }>(
        `SELECT COALESCE(MAX(version_number), 0) AS max_version
         FROM attachments WHERE workspace_id = $1 AND requirement_id = $2`,
        [workspaceId, input.requirement_id],
      );
      versionNumber = parseInt(versionResult.rows[0]?.max_version ?? '0', 10) + 1;

      // Deactivate prior active versions for same requirement
      await pool.query(
        `UPDATE attachments SET is_active = false
         WHERE workspace_id = $1 AND requirement_id = $2 AND is_active = true`,
        [workspaceId, input.requirement_id],
      );
    }

    // Save file to disk
    const uploadDir = path.join(UPLOAD_BASE, workspaceId);
    fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, `v${versionNumber}_${Date.now()}_${input.file_name}`);
    fs.writeFileSync(filePath, Buffer.from(input.content_base64, 'base64'));

    const result = await pool.query<WorkspaceAttachment>(
      `INSERT INTO attachments
         (workspace_id, section_id, requirement_id, source_type, file_name, file_path, mime_type,
          file_size_bytes, version_number, is_active, uploaded_by)
       VALUES ($1, $2, $3, 'upload', $4, $5, $6, $7, $8, true, $9)
       RETURNING *`,
      [
        workspaceId,
        input.section_id ?? null,
        input.requirement_id ?? null,
        input.file_name,
        filePath,
        input.mime_type,
        input.file_size_bytes,
        versionNumber,
        uploadedBy,
      ],
    );
    return result.rows[0];
  }

  /**
   * Link an org document library item to this workspace/requirement.
   * Version history same as upload: deactivate prior, increment version.
   */
  async linkLibraryDoc(workspaceId: string, input: LinkLibraryAttachmentInput, uploadedBy: string): Promise<WorkspaceAttachment> {
    // Look up org_attachment details
    const orgDocResult = await pool.query(
      `SELECT file_name, mime_type, file_size_bytes FROM org_attachments WHERE attachment_id = $1`,
      [input.org_document_id],
    );
    if (orgDocResult.rows.length === 0) throw Object.assign(new Error('ORG_DOCUMENT_NOT_FOUND'), { statusCode: 404 });
    const orgDoc = orgDocResult.rows[0];

    let versionNumber = 1;
    if (input.requirement_id) {
      const versionResult = await pool.query<{ max_version: string }>(
        `SELECT COALESCE(MAX(version_number), 0) AS max_version
         FROM attachments WHERE workspace_id = $1 AND requirement_id = $2`,
        [workspaceId, input.requirement_id],
      );
      versionNumber = parseInt(versionResult.rows[0]?.max_version ?? '0', 10) + 1;
      await pool.query(
        `UPDATE attachments SET is_active = false
         WHERE workspace_id = $1 AND requirement_id = $2 AND is_active = true`,
        [workspaceId, input.requirement_id],
      );
    }

    const result = await pool.query<WorkspaceAttachment>(
      `INSERT INTO attachments
         (workspace_id, section_id, requirement_id, source_type, org_document_id, file_name,
          mime_type, file_size_bytes, version_number, is_active, uploaded_by)
       VALUES ($1, $2, $3, 'library', $4, $5, $6, $7, $8, true, $9)
       RETURNING *`,
      [
        workspaceId,
        input.section_id ?? null,
        input.requirement_id ?? null,
        input.org_document_id,
        orgDoc.file_name,
        orgDoc.mime_type,
        orgDoc.file_size_bytes,
        versionNumber,
        uploadedBy,
      ],
    );
    return result.rows[0];
  }

  /**
   * List all versions (active + inactive) for a specific attachment_id's requirement.
   */
  async listVersions(attachmentId: string): Promise<WorkspaceAttachment[]> {
    // Get the requirement_id for this attachment, then list all versions
    const attachResult = await pool.query<{ workspace_id: string; requirement_id: string | null }>(
      `SELECT workspace_id, requirement_id FROM attachments WHERE attachment_id = $1`,
      [attachmentId],
    );
    if (attachResult.rows.length === 0) return [];
    const { workspace_id, requirement_id } = attachResult.rows[0];

    if (!requirement_id) {
      // No versioning for attachments without requirement linkage
      return (await pool.query<WorkspaceAttachment>(
        `SELECT * FROM attachments WHERE attachment_id = $1`,
        [attachmentId],
      )).rows;
    }

    const result = await pool.query<WorkspaceAttachment>(
      `SELECT * FROM attachments
       WHERE workspace_id = $1 AND requirement_id = $2
       ORDER BY version_number DESC`,
      [workspace_id, requirement_id],
    );
    return result.rows;
  }

  /**
   * Soft-delete: set is_active = false.
   */
  async deactivate(attachmentId: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE attachments SET is_active = false WHERE attachment_id = $1 RETURNING attachment_id`,
      [attachmentId],
    );
    return result.rows.length > 0;
  }
}

export const attachmentService = new AttachmentService();
