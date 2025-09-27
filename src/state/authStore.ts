import { create } from 'zustand';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: 'Bearer' | null;
  expiresInMs: number | null;
  email: string | null;

  setAuth: (p: {
    accessToken: string; refreshToken: string; tokenType?: 'Bearer'; expiresInMs?: number; email?: string;

  }) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  tokenType: 'Bearer',
  expiresInMs: null,
  email: null,
  setAuth: ({
    accessToken,
    refreshToken,
    tokenType = 'Bearer',
    expiresInMs = 900000,
    email = null,
  }) => set({ accessToken, refreshToken, tokenType, expiresInMs, email }),
  clearAuth: () =>
    set({
      accessToken: null,
      refreshToken: null,
      tokenType: 'Bearer',
      expiresInMs: null,
      email: null,
    }),
}));