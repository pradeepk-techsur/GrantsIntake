import apiClient from './client';
import type {
  Workspace,
  WorkspaceSection,
  WorkspaceTask,
  WorkspaceComment,
  CreateWorkspaceInput,
  AssignSectionInput,
  CreateTaskInput,
  CreateCommentInput,
  ReadinessSummary,
} from '../types/workspace';
import type { FormFieldDefinition, FieldResponse, ValidationResult } from '../types/formField';
import type { Budget, BudgetLineItem, CreateLineItemInput, BudgetValidationError } from '../types/budget';
import type { WorkspaceAttachment, UploadAttachmentInput, LinkLibraryAttachmentInput } from '../types/attachment';
import type { PreviewData } from '../types/preview';

// Re-export form field types for consumers
export type { FormFieldDefinition, FieldResponse, ValidationResult };
// Re-export budget/attachment/preview types for consumers
export type { Budget, BudgetLineItem, CreateLineItemInput, BudgetValidationError };
export type { WorkspaceAttachment, UploadAttachmentInput, LinkLibraryAttachmentInput };
export type { PreviewData };

export const workspaceApi = {
  createWorkspace: (input: CreateWorkspaceInput) =>
    apiClient.post<{ workspace: Workspace; sections: WorkspaceSection[] }>('/workspaces', input).then(r => r.data),
  listWorkspaces: () =>
    apiClient.get<Workspace[]>('/workspaces').then(r => r.data),
  getWorkspace: (workspaceId: string) =>
    apiClient.get<Workspace>(`/workspaces/${workspaceId}`).then(r => r.data),
  getSections: (workspaceId: string) =>
    apiClient.get<WorkspaceSection[]>(`/workspaces/${workspaceId}/sections`).then(r => r.data),
  getSection: (workspaceId: string, sectionId: string) =>
    apiClient.get<WorkspaceSection>(`/workspaces/${workspaceId}/sections/${sectionId}`).then(r => r.data),
  assignSection: (workspaceId: string, sectionId: string, input: AssignSectionInput) =>
    apiClient.put(`/workspaces/${workspaceId}/sections/${sectionId}/assignment`, input).then(r => r.data),
  getTasks: (workspaceId: string) =>
    apiClient.get<WorkspaceTask[]>(`/workspaces/${workspaceId}/tasks`).then(r => r.data),
  createTask: (workspaceId: string, input: CreateTaskInput) =>
    apiClient.post<WorkspaceTask>(`/workspaces/${workspaceId}/tasks`, input).then(r => r.data),
  updateTask: (workspaceId: string, taskId: string, updates: Partial<WorkspaceTask>) =>
    apiClient.put(`/workspaces/${workspaceId}/tasks/${taskId}`, updates).then(r => r.data),
  deleteTask: (workspaceId: string, taskId: string) =>
    apiClient.delete(`/workspaces/${workspaceId}/tasks/${taskId}`),
  getComments: (workspaceId: string) =>
    apiClient.get<WorkspaceComment[]>(`/workspaces/${workspaceId}/comments`).then(r => r.data),
  postComment: (workspaceId: string, input: CreateCommentInput) =>
    apiClient.post<WorkspaceComment>(`/workspaces/${workspaceId}/comments`, input).then(r => r.data),
  getReadiness: (workspaceId: string) =>
    apiClient.get<ReadinessSummary>(`/workspaces/${workspaceId}/readiness`).then(r => r.data),

  // ─── Form Field API (PRD-INTAKE-037/038) ──────────────────────────────────────
  getFields: (workspaceId: string, sectionId: string) =>
    apiClient.get<FormFieldDefinition[]>(`/workspaces/${workspaceId}/sections/${sectionId}/fields`).then(r => r.data),

  saveField: (workspaceId: string, sectionId: string, fieldId: string, input: { response_value?: string; response_json?: unknown }) =>
    apiClient.put<FieldResponse>(`/workspaces/${workspaceId}/sections/${sectionId}/fields/${fieldId}`, input).then(r => r.data),

  validateSection: (workspaceId: string, sectionId: string) =>
    apiClient.post<ValidationResult>(`/workspaces/${workspaceId}/sections/${sectionId}/validate`).then(r => r.data),

  // ─── Budget API (PRD-INTAKE-039/040) ──────────────────────────────────────────
  getBudget: (workspaceId: string) =>
    apiClient.get<Budget>(`/workspaces/${workspaceId}/budget`).then(r => r.data),
  addLineItem: (workspaceId: string, input: CreateLineItemInput) =>
    apiClient.post<BudgetLineItem>(`/workspaces/${workspaceId}/budget/line-items`, input).then(r => r.data),
  updateLineItem: (workspaceId: string, lineId: string, updates: Partial<CreateLineItemInput>) =>
    apiClient.put<BudgetLineItem>(`/workspaces/${workspaceId}/budget/line-items/${lineId}`, updates).then(r => r.data),
  deleteLineItem: (workspaceId: string, lineId: string) =>
    apiClient.delete(`/workspaces/${workspaceId}/budget/line-items/${lineId}`),
  validateBudget: (workspaceId: string) =>
    apiClient.post<{ valid: boolean; errors: BudgetValidationError[] }>(`/workspaces/${workspaceId}/budget/validate`).then(r => r.data),

  // ─── Attachment API (PRD-INTAKE-041/042) ─────────────────────────────────────
  listAttachments: (workspaceId: string) =>
    apiClient.get<WorkspaceAttachment[]>(`/workspaces/${workspaceId}/attachments`).then(r => r.data),
  uploadAttachment: (workspaceId: string, input: UploadAttachmentInput | LinkLibraryAttachmentInput) =>
    apiClient.post<WorkspaceAttachment>(`/workspaces/${workspaceId}/attachments`, input).then(r => r.data),
  getAttachmentVersions: (workspaceId: string, attachmentId: string) =>
    apiClient.get<WorkspaceAttachment[]>(`/workspaces/${workspaceId}/attachments/${attachmentId}/versions`).then(r => r.data),
  deleteAttachment: (workspaceId: string, attachmentId: string) =>
    apiClient.delete(`/workspaces/${workspaceId}/attachments/${attachmentId}`),

  // ─── Preview API (PRD-INTAKE-043) ─────────────────────────────────────────────
  getPreview: (workspaceId: string) =>
    apiClient.get<PreviewData>(`/workspaces/${workspaceId}/preview`).then(r => r.data),
};
