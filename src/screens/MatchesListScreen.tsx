// src/screens/MatchesListScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  RefreshControl, Alert, Pressable
} from 'react-native';
import { colors } from '../theme/colors';
import { listMatches, Match } from '../api/matches';
import MatchCard from '../components/MatchCard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../navigation/AppNavigator';
import { formatTL } from '../utils/format';
import { useFocusEffect, DrawerActions } from '@react-navigation/native';
import { getWalletByUser, MOCK_USER_ID } from '../api/wallets';
import Icon from 'react-native-vector-icons/Feather';

type Props = NativeStackScreenProps<HomeStackParamList, 'MatchesList'>;

export default function MatchesListScreen({ navigation }: Props) {
  const [items, setItems] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // fetched balance of mock user
  const [balance, setBalance] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const [matches, wallet] = await Promise.all([
        listMatches(),
        getWalletByUser(MOCK_USER_ID),
      ]);

      setItems(matches);
      setBalance(wallet.balance ?? 0);

    } catch (e: any) {
      setError(e?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try { await load(); }
    catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to refresh.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleJoin = (id: string) => {
    Alert.alert('Joined!', `You have joined match ${id} (mock).`);
  };

  const openDetail = (id: string) => navigation.navigate('MatchDetail', { id });

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(m) => m.id}
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
        renderItem={({ item }) => (
          <MatchCard match={item} onJoin={handleJoin} onPress={openDetail} />
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { color: colors.white, fontSize: 23, fontWeight: '800' },
  balance: { color: colors.white, fontSize: 18, fontWeight: '800' },
  listContent: { padding: 16 },
  subtle: { textAlign: 'center', color: colors.gray600, marginTop: 24 },
});
