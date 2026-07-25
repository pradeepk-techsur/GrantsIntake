import { create } from 'zustand';

interface AuthStore {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  clearAuth: () => void;
}

/**
 * Zustand store for auth state.
 * Access token stored in memory ONLY (not localStorage/sessionStorage).
 * Refresh token stored in httpOnly cookie set by server (T-02-04 mitigation).
 */
export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),
  clearAuth: () => set({ accessToken: null }),
}));
