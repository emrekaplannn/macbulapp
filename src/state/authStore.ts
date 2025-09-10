import { create } from 'zustand';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: 'Bearer' | null;
  expiresInMs: number | null;
  setAuth: (p: {
    accessToken: string; refreshToken: string; tokenType?: 'Bearer'; expiresInMs?: number;
  }) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  tokenType: 'Bearer',
  expiresInMs: null,
  setAuth: ({ accessToken, refreshToken, tokenType = 'Bearer', expiresInMs = 900000 }) =>
    set({ accessToken, refreshToken, tokenType, expiresInMs }),
  clearAuth: () => set({ accessToken: null, refreshToken: null, tokenType: 'Bearer', expiresInMs: null }),
}));
