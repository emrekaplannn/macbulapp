import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, Image, Alert, ScrollView,
  RefreshControl, ActivityIndicator, Pressable
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../navigation/AppNavigator'; // <-- UPDATED TYPE
import { colors } from '../theme/colors';
import { formatDate, formatTime, formatTL } from '../utils/format';
import { getMatchById, Match } from '../api/matches';
import LargeButton from '../components/LargeButton';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { getWalletByUser, MOCK_USER_ID } from '../api/wallets';

type Props = NativeStackScreenProps<HomeStackParamList, 'MatchDetail'>; // <-- UPDATED

const PITCH_PLACEHOLDER =
  'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1200';

export default function MatchDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;

  const [match, setMatch] = useState<Match | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // header balance
  const [balance, setBalance] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const [mRes, wRes] = await Promise.allSettled([
        getMatchById(id),
        getWalletByUser(MOCK_USER_ID),
      ]);

      if (mRes.status === 'fulfilled') setMatch(mRes.value);
      else throw mRes.reason ?? new Error('Failed to load match.');

      if (wRes.status === 'fulfilled') setBalance(wRes.value.balance ?? 0);
      else setBalance(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load match.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load on focus (covers initial mount + when coming back)
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  // Put balance into the same native header (right side)
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Maç Detayı',
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('Wallet' as never)}>
          <Text style={styles.headerBalance}>
            {balance === null ? '...' : formatTL(balance)}
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, balance]);

  const joinSolo = () => Alert.alert('Joined (mock)', 'You joined as a single player.');
  const joinGroup = () => Alert.alert('Joined (mock)', 'You joined as a group.');
  const payWithCard = () => Alert.alert('Payment (mock)', 'Card payment flow will open here.');

  if (error && !match) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red', marginBottom: 12 }}>{error}</Text>
        <Pressable onPress={load} style={styles.retry}>
          <Text style={{ color: colors.white, fontWeight: '700' }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (loading && !match) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.teal} />
        <Text style={{ marginTop: 8 }}>Loading…</Text>
      </View>
    );
  }

  // Guards so we don't use non-null assertions
  const ts = match?.matchTimestamp ?? Date.now();
  const filled = match?.filledSlots ?? 0;
  const total  = match?.totalSlots ?? 0;
  const field  = match?.fieldName ?? '';
  const city   = match?.city ?? '';
  const price  = match?.pricePerUser ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />
      }
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: PITCH_PLACEHOLDER }} style={styles.image} resizeMode="cover" />
      </View>

      <View style={styles.content}>
        <View style={styles.rowTop}>
          <Text style={styles.date}>{formatDate(ts)}</Text>
          <Text style={styles.time}>{formatTime(ts)}</Text>
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.field}>{field}</Text>
          <View style={styles.slotsWrap}>
            <Icon name="user" size={16} color={colors.gray600} style={styles.slotsIcon} />
            <Text style={styles.slotsText}>{filled}/{total}</Text>
          </View>
        </View>

        <Text style={styles.city}>{city}</Text>

        <View style={styles.divider} />

        <Text style={styles.price}>{formatTL(price)}</Text>

        <LargeButton title="Bireysel Katıl" onPress={joinSolo} style={{ marginTop: 18 }} />
        <LargeButton title="Grup Katıl" onPress={joinGroup} style={{ marginTop: 12 }} />
        <LargeButton title="Kart ile Öde" onPress={payWithCard} style={{ marginTop: 12 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerBalance: { color: '#fff', fontSize: 20, fontWeight: '800', paddingHorizontal: 4 },

  container: { flex: 1, backgroundColor: colors.teal },
  imageWrap: {
    marginHorizontal: 16,
    marginTop: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
  },
  image: { width: '100%', height: 220 },
  content: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    padding: 16,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  date: { fontSize: 18, fontWeight: '700' },
  time: { fontSize: 18, fontWeight: '700' },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  slotsWrap: { flexDirection: 'row', alignItems: 'center' },
  slotsIcon: { marginRight: 6 },
  slotsText: { fontSize: 15, color: colors.gray600, fontWeight: '600' },
  field: { fontSize: 26, fontWeight: '900', marginTop: 6 },
  city: { color: '#555', marginTop: 6, marginBottom: 8, fontSize: 16 },
  divider: { height: 1, backgroundColor: '#E9E9E9', marginVertical: 10 },
  price: { fontSize: 20, fontWeight: '800', marginBottom: 8 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  retry: {
    backgroundColor: colors.teal,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
