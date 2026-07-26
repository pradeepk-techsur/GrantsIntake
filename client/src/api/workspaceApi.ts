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

// Re-export form field types for consumers
export type { FormFieldDefinition, FieldResponse, ValidationResult };

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
};
