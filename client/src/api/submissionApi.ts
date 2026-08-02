import apiClient from './client';
import type { SubmissionConfirmation, ReceiptData } from '../types/submission';

export const submissionApi = {
  async submit(workspaceId: string): Promise<SubmissionConfirmation> {
    try {
      const res = await apiClient.post<SubmissionConfirmation>(
        `/workspaces/${workspaceId}/submit`,
      );
      return res.data;
    } catch (err: unknown) {
      // Axios wraps non-2xx as errors; extract the structured body
      const axiosErr = err as {
        response?: {
          status: number;
          data: {
            error_code?: string;
            error?: string;
            message?: string;
            blocking_errors?: unknown[];
          };
        };
      };
      if (axiosErr.response) {
        const { data, status } = axiosErr.response;
        throw Object.assign(new Error(data.message || 'Submission failed'), {
          code: data.error_code || data.error,
          status,
          blocking_errors: data.blocking_errors,
        });
      }
      throw err;
    }
  },

  async getReceipt(workspaceId: string): Promise<ReceiptData> {
    const res = await apiClient.get<ReceiptData>(
      `/workspaces/${workspaceId}/receipt`,
    );
    return res.data;
  },
};
