// lib/session.ts
import api from '../lib/api';
import { useAuthStore } from '../state/authStore';
import { useWalletStore } from '../state/walletStore';
import { useProfileStore } from '../state/profileStore';
// import * as SecureStore from 'expo-secure-store'; // kullanıyorsan

export async function logoutSafely() {

  try {
    useWalletStore.getState().clear?.(); 
    useProfileStore.getState().clear?.(); 
    useAuthStore.getState().clearAuth();

    // 4) (Opsiyonel) açık bağlantıları kapat
    // sockets?.close?.();
    // notifications?.unregister?.();
  } finally {
    // ekstra iş yok; RootStack !isAuthed olduğu için Login otomatik açılacak
  }
}
