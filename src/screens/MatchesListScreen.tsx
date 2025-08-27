import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { listMatches, Match } from '../api/matches';
import MatchCard from '../components/MatchCard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { formatTL } from '../utils/format';
import { useFocusEffect } from '@react-navigation/native';
import { getWalletByUser, MOCK_USER_ID } from '../api/wallets';

type Props = NativeStackScreenProps<RootStackParamList, 'MatchesList'>;

export default function MatchesListScreen({ navigation }: Props) {
  const [items, setItems] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const results = await Promise.allSettled([
        listMatches(),
        getWalletByUser(MOCK_USER_ID),
      ]);

      // matches
      const matchesRes = results[0];
      if (matchesRes.status === 'fulfilled') {
        setItems(matchesRes.value);
      } else {
        // if matches fail, surface an error
        setItems([]);
        setError(matchesRes.reason?.message || 'Failed to load matches.');
      }

      // wallet
      const walletRes = results[1];
      if (walletRes.status === 'fulfilled') {
        setBalance(walletRes.value.balance ?? 0);
      } else {
        // if wallet fails, just show "..."
        setBalance(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // load on mount + when screen regains focus
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); }
    catch (e: any) { Alert.alert('Error', e?.message || 'Failed to refresh.'); }
    finally { setRefreshing(false); }
  }, [load]);

  const handleJoin = useCallback((id: string) => {
    Alert.alert('Joined!', `You have joined match ${id} (mock).`);
  }, []);

  const openDetail = useCallback((id: string) => {
    navigation.navigate('MatchDetail', { id });
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: Match }) => (
      <MatchCard match={item} onJoin={handleJoin} onPress={openDetail} />
    ),
    [handleJoin, openDetail]
  );

  const keyExtractor = useCallback((m: Match) => m.id, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>MaçBul</Text>
        <Text style={styles.balance} onPress={() => navigation.navigate('Wallet')}>
          {balance === null ? '...' : formatTL(balance)}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.subtle}>Loading…</Text>
          ) : error ? (
            <Text style={[styles.subtle, { color: 'red' }]}>{error}</Text>
          ) : (
            <Text style={styles.subtle}>No matches yet.</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },
  header: {
    height: 64,
    backgroundColor: colors.teal,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brand: { color: colors.white, fontSize: 28, fontWeight: '900' },
  balance: { color: colors.white, fontSize: 21, fontWeight: '800' },
  listContent: { padding: 16 },
  subtle: { textAlign: 'center', color: colors.gray600, marginTop: 24 },
});
