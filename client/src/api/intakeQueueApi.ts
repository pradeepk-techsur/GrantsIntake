import apiClient from './client';
import type { QueueListResponse, QueueEntryDetail } from '../types/intakeQueue';

export const intakeQueueApi = {
  listEntries: (params?: {
    opportunity_id?: string;
    status?: string;
    sort_by?: string;
    page?: number;
    page_size?: number;
  }) =>
    apiClient.get<QueueListResponse>('/intake-queue', { params }),

  getEntryDetail: (entryId: string) =>
    apiClient.get<QueueEntryDetail>(`/intake-queue/${entryId}`),

  applyDisposition: (
    entryId: string,
    body: {
      disposition: string;
      rationale?: string;
      screening_criteria_results?: object[];
    },
  ) => apiClient.post(`/intake-queue/${entryId}/disposition`, body),

  listSnapshots: (entryId: string) =>
    apiClient.get(`/intake-queue/${entryId}/snapshots`),

  getNotifications: (params?: { is_read?: boolean; page?: number }) =>
    apiClient.get('/notifications', { params }),

  markRead: (notificationId: string) =>
    apiClient.put(`/notifications/${notificationId}/read`),
};
