// src/state/walletStore.ts
import { create } from 'zustand';

type WalletState = {
  balance: number | null;
  setBalance: (b: number | null) => void;
  clear: () => void;
};

export const useWalletStore = create<WalletState>((set) => ({
  balance: null,
  setBalance: (balance) => set({ balance }),
  clear: () => set({ balance: null }),
}));
