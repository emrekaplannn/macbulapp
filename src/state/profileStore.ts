// src/state/profileStore.ts
import { create } from 'zustand';

type ProfileState = {
  fullName: string | null;
  position: string | null;

  /** Kalıcı: DB'de tutulan dosya yolu (ör. avatars/<userId>/avatar.jpg) */
  avatarPath: string | null;

  /** Geçici (UI): Supabase signed URL. Süresi dolabilir. */
  avatarUrl: string | null;

  setProfile: (p: Partial<ProfileState>) => void;
  setAvatar: (data: { path?: string | null; url?: string | null }) => void;
  clear: () => void;
};

export const useProfileStore = create<ProfileState>((set) => ({
  fullName: null,
  position: null,
  avatarPath: null,
  avatarUrl: null,

  setProfile: (p) => set((s) => ({ ...s, ...p })),

  // avatarPath (kalıcı) ve/veya avatarUrl (signed, geçici) tek noktadan güncellenebilir
  setAvatar: ({ path, url }) =>
    set((s) => ({
      ...s,
      avatarPath: path !== undefined ? path : s.avatarPath,
      avatarUrl: url !== undefined ? url : s.avatarUrl,
    })),

  clear: () =>
    set({
      fullName: null,
      position: null,
      avatarPath: null,
      avatarUrl: null,
    }),
}));
