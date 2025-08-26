import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { listMatches, Match } from '../api/matches';
import MatchCard from '../components/MatchCard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { formatTL } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'MatchesList'>;

// mock until wallet/auth are ready
const MOCK_BALANCE = 120.5;

export default function MatchesListScreen({ navigation }: Props) {
  const [items, setItems] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await listMatches();
      setItems(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load matches.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await listMatches();
      setItems(data);
    } catch (e: any) {
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
      <View style={styles.header}>
        <Text style={styles.brand}>MaçBul</Text>
        <Text style={styles.balance}>{formatTL(MOCK_BALANCE)}</Text>
      </View>

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
    height: 64, backgroundColor: colors.teal, paddingHorizontal: 16,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between'
  },
  brand: { color: colors.white, fontSize: 28, fontWeight: '900' },
  balance: { color: colors.white, fontSize: 18, fontWeight: '700' },
  listContent: { padding: 16 },
  subtle: { textAlign: 'center', color: colors.gray600, marginTop: 24 },
});
