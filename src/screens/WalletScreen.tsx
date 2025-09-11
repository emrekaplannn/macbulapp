// src/screens/WalletScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Pressable,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  getTransactionsByUser,
  getWalletByUser,
  topUp, // <-- JWT ile /me çalışıyorsa userId göndermiyoruz
  type TransactionDto,
} from '../api/wallets';
import { colors } from '../theme/colors';
import { formatTL, formatDate, formatTime } from '../utils/format';
import { useWalletStore } from '../state/walletStore';
import { useAuthStore } from '../state/authStore';
import axios from 'axios';

export default function WalletScreen() {
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState<number>(0);

  // history state
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);

  // stores
  const setGlobalBalance = useWalletStore((s) => s.setBalance);
  const clearAuth       = useAuthStore((s) => s.clearAuth);
  const accessToken     = useAuthStore((s) => s.accessToken);

  // --- AUTH FAIL (401/403) ortak yakalama ---
  const handleAuthFail = useCallback((e: unknown, from: string) => {
    const code =
      (axios.isAxiosError(e) && e.response?.status) ||
      (typeof (e as any)?.response?.status === 'number' ? (e as any).response.status : undefined);

    if (code === 401) {
      console.log('[Wallet] 401 after refresh -> clearAuth', { from });
      clearAuth?.();
      return true;
    }

    // 403 -> sadece korumalı me uçları için auth fail say
    if (
      code === 403 &&
      (from.includes('/wallets') || from.includes('/transactions'))
    ) {
      console.log('[Wallet] 403 on protected -> clearAuth', { from });
      clearAuth?.();
      return true;
    }

    return false;
  }, [clearAuth]);

  // ---- data loaders ----
  const loadWallet = useCallback(async () => {
    try {
      const wallet = await getWalletByUser();         // GET /wallets/user (JWT -> me)
      const b = typeof wallet?.balance === 'number' ? wallet.balance : 0;
      setBalance(b);
      setGlobalBalance(b);                            // global header vs. için sync
    } catch (e: any) {
      if (!handleAuthFail(e, '/wallets/user')) {
        Alert.alert('Hata', e?.message || 'Cüzdan bilgisi alınamadı');
      }
      throw e;
    }
  }, [handleAuthFail, setGlobalBalance]);

  const loadHistory = useCallback(async () => {
    try {
      const tx = await getTransactionsByUser();       // GET /transactions/user (JWT -> me)
      setTransactions(tx);
    } catch (e: any) {
      if (!handleAuthFail(e, '/transactions/user')) {
        Alert.alert('Hata', e?.message || 'İşlem geçmişi alınamadı');
      }
      throw e;
    }
  }, [handleAuthFail]);

  const initialLoad = useCallback(async () => {
    // access token yoksa istek atma; AppNavigator akışı üstlenir
    if (!accessToken) {
      console.log('[Wallet] no accessToken -> clearAuth');
      setLoading(false);
      clearAuth?.();
      return;
    }

    try {
      setLoading(true);
      await loadWallet();
    } finally {
      setLoading(false);
    }
  }, [accessToken, loadWallet, clearAuth]);

  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  // ---- pull-to-refresh ----
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadWallet();
      if (showHistory) {
        await loadHistory();
      }
    } finally {
      setRefreshing(false);
    }
  }, [loadWallet, loadHistory, showHistory]);

  // ---- actions ----
  const handleTopUp = useCallback(() => {
    // iOS'ta mevcut; Android için kendi modalını yapabilirsin.
    Alert.prompt?.(
      'Bakiye Yükle',
      'Tutarı girin (TL)',
      async (text) => {
        const amount = Number(text);
        if (!Number.isFinite(amount) || amount <= 0) {
          Alert.alert('Geçersiz tutar', 'Pozitif sayı giriniz.');
          return;
        }
        try {
          setReloading(true);
          await topUp(amount, 'Kart ile yükleme (mock)'); // POST /transactions (JWT -> me)
          await loadWallet();
          if (showHistory) await loadHistory();
        } catch (e: any) {
          if (!handleAuthFail(e, '/transactions')) {
            Alert.alert('Hata', e?.message || 'Yükleme başarısız');
          }
        } finally {
          setReloading(false);
        }
      },
      'plain-text',
      '50'
    );
  }, [handleAuthFail, loadHistory, loadWallet, showHistory]);

  const toggleHistory = useCallback(async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    setShowHistory(true);
    if (transactions.length > 0) return; // zaten yüklendiyse tekrar çekme
    try {
      setHistoryLoading(true);
      await loadHistory();
    } finally {
      setHistoryLoading(false);
    }
  }, [showHistory, transactions.length, loadHistory]);

  const typeLabel = (t: TransactionDto['type']) =>
    t === 'LOAD' ? 'Yükleme' : t === 'PAY' ? 'Ödeme' : 'İade';
  const amountSign = (t: TransactionDto['type']) => (t === 'PAY' ? '-' : '+');
  const amountColor = (t: TransactionDto['type']) =>
    t === 'PAY' ? styles.amountPay : t === 'REFUND' ? styles.amountRefund : styles.amountLoad;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />
      }
    >
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator color={colors.teal} />
        ) : (
          <>
            <Text style={styles.subtitle}>Mevcut Bakiye</Text>
            <Text style={styles.balance}>{formatTL(balance)}</Text>

            <Pressable style={styles.primaryBtn} onPress={handleTopUp} disabled={reloading}>
              <Text style={styles.primaryBtnText}>
                {reloading ? 'Yükleniyor…' : 'Kart ile Yükle'}
              </Text>
            </Pressable>

            <Pressable style={styles.secondaryBtn} onPress={toggleHistory}>
              <Text style={styles.secondaryBtnText}>
                {showHistory ? 'İşlem Geçmişini Gizle' : 'İşlem Geçmişi'}
              </Text>
            </Pressable>
          </>
        )}
      </View>

      {showHistory && (
        <View style={styles.history}>
          {historyLoading ? (
            <ActivityIndicator color={colors.teal} />
          ) : transactions.length === 0 ? (
            <Text style={styles.historyEmpty}>Henüz işlem yok.</Text>
          ) : (
            <View>
              {transactions.map((tx) => (
                <View key={tx.id} style={styles.txRow}>
                  <View style={styles.txLeft}>
                    <Text style={styles.txTitle}>{typeLabel(tx.type)}</Text>
                    <Text style={styles.txSubtitle}>
                      {formatDate(tx.createdAt)} • {formatTime(tx.createdAt)}
                    </Text>
                    {tx.description ? (
                      <Text style={styles.txDesc}>{tx.description}</Text>
                    ) : null}
                  </View>
                  <Text style={[styles.txAmount, amountColor(tx.type)]}>
                    {amountSign(tx.type)}
                    {formatTL(Math.abs(tx.amount))}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },
  content: { paddingBottom: 24 },

  card: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  subtitle: { textAlign: 'center', color: colors.gray600, marginBottom: 4, fontSize: 16 },
  balance: { textAlign: 'center', fontSize: 40, fontWeight: '900', marginBottom: 16 },

  primaryBtn: {
    backgroundColor: colors.teal,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },

  secondaryBtn: {
    backgroundColor: '#EDEFF1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: colors.black, fontWeight: '700', fontSize: 16 },

  history: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  historyEmpty: { textAlign: 'center', color: colors.gray600, paddingVertical: 16 },

  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  txLeft: { flexShrink: 1, paddingRight: 12 },
  txTitle: { fontWeight: '700' },
  txSubtitle: { color: colors.gray600, marginTop: 2 },
  txDesc: { color: colors.gray600, marginTop: 4, fontStyle: 'italic' },
  txAmount: { fontWeight: '800' },
  amountPay: { color: '#D32F2F' },
  amountRefund: { color: '#1976D2' },
  amountLoad: { color: '#2E7D32' },
});
