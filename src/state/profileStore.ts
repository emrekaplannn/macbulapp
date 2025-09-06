// src/state/profileStore.ts
import { create } from 'zustand';

type ProfileState = {
  fullName: string | null;
  position: string | null;
  avatarUrl: string | null;
  setProfile: (p: Partial<ProfileState>) => void;
  clear: () => void;
};

export const useProfileStore = create<ProfileState>((set) => ({
  fullName: null,
  position: null,
  avatarUrl: null,
  setProfile: (p) => set((s) => ({ ...s, ...p })),
  clear: () => set({ fullName: null, position: null, avatarUrl: null }),
}));
