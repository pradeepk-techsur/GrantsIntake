import { useAuthStore } from '../store/authStore';
import type { QAItem } from '../types/qa';

const BASE = '/api/v1';

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

export const qaApi = {
  async listPublished(opportunityId: string): Promise<QAItem[]> {
    const res = await fetch(`${BASE}/opportunities/${opportunityId}/qa`);
    if (!res.ok) throw new Error('Failed to fetch Q&A');
    return res.json();
  },

  async listAll(opportunityId: string): Promise<QAItem[]> {
    const res = await fetch(`${BASE}/opportunities/${opportunityId}/questions`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch questions');
    return res.json();
  },

  async submitQuestion(opportunityId: string, questionText: string): Promise<QAItem> {
    const res = await fetch(`${BASE}/opportunities/${opportunityId}/questions`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ question_text: questionText }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw Object.assign(new Error(err.message || 'Failed to submit question'), {
        code: err.code,
        status: res.status,
      });
    }
    return res.json();
  },

  async publishAnswer(questionId: string, answerText: string): Promise<QAItem> {
    const res = await fetch(`${BASE}/questions/${questionId}/answer`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ answer_text: answerText }),
    });
    if (!res.ok) throw new Error('Failed to publish answer');
    return res.json();
  },
};
