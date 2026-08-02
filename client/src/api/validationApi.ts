import { useAuthStore } from '../store/authStore';
import type { ValidationResult } from '../types/validation';

export const validationApi = {
  async runValidation(workspaceId: string): Promise<ValidationResult> {
    const token = useAuthStore.getState().accessToken;
    const res = await fetch(`/api/v1/workspaces/${workspaceId}/validate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Validation failed');
    return res.json();
  },

  async certify(
    workspaceId: string,
    certificationText: string,
  ): Promise<{ cert_id: string; certification_timestamp: string; certification_text_hash: string }> {
    const token = useAuthStore.getState().accessToken;
    const res = await fetch(`/api/v1/workspaces/${workspaceId}/certify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ certification_text: certificationText }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw Object.assign(new Error(err.message || 'Certification failed'), {
        code: err.code || err.error,
        status: res.status,
      });
    }
    return res.json();
  },

  async getCertification(
    workspaceId: string,
  ): Promise<{ certified: boolean; certification: { cert_id: string; certification_timestamp: string; certification_text_hash: string; certifying_user_id: string } | null }> {
    const token = useAuthStore.getState().accessToken;
    const res = await fetch(`/api/v1/workspaces/${workspaceId}/certification`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { certified: false, certification: null };
    return res.json();
  },

  async submitConcern(workspaceId: string, concernText: string): Promise<void> {
    const token = useAuthStore.getState().accessToken;
    await fetch(`/api/v1/workspaces/${workspaceId}/concern`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ concern_text: concernText }),
    });
  },
};
