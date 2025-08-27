import React, { useEffect, useState } from 'react';
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
  MOCK_USER_ID,
  getTransactionsByUser,
  getWalletByUser,
  topUp,
  type TransactionDto,
} from '../api/wallets';
import { colors } from '../theme/colors';
import { formatTL, formatDate, formatTime } from '../utils/format';

export default function WalletScreen() {
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // ⬅️ pull-to-refresh state
  const [balance, setBalance] = useState<number>(0);

  // history state
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);

  // ---- data loaders ----
  const loadWallet = async () => {
    const wallet = await getWalletByUser(MOCK_USER_ID);
    setBalance(wallet.balance ?? 0);
  };

  const loadHistory = async () => {
    const tx = await getTransactionsByUser(MOCK_USER_ID);
    setTransactions(tx);
  };

  const initialLoad = async () => {
    try {
      setLoading(true);
      await loadWallet();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initialLoad();
  }, []);

  // ---- pull-to-refresh ----
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadWallet();
      if (showHistory) {
        await loadHistory();
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  // ---- actions ----
  const handleTopUp = async () => {
    Alert.prompt?.(
      'Top up',
      'Enter amount (TRY)',
      async (text) => {
        const amount = Number(text);
        if (!Number.isFinite(amount) || amount <= 0) {
          Alert.alert('Invalid amount', 'Please enter a positive number.');
          return;
        }
        try {
          setReloading(true);
          await topUp(MOCK_USER_ID, amount, 'Card top-up (mock)');
          await loadWallet();
          if (showHistory) await loadHistory();
        } catch (e: any) {
          Alert.alert('Error', e?.message || 'Top up failed');
        } finally {
          setReloading(false);
        }
      },
      'plain-text',
      '50'
    );
  };

  const toggleHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    setShowHistory(true);
    if (transactions.length > 0) return; // already loaded once
    try {
      setHistoryLoading(true);
      await loadHistory();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

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
