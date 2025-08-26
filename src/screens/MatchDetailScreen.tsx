import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, Alert, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { formatDate, formatTime, formatTL } from '../utils/format';
import { getMatchById, Match } from '../api/matches';
import LargeButton from '../components/LargeButton';
import Icon from 'react-native-vector-icons/Feather';

type Props = NativeStackScreenProps<RootStackParamList, 'MatchDetail'>;

// mock pitch image (can be any public image URL for now)
const PITCH_PLACEHOLDER =
  'https://fs.ihu.edu.tr/siteler/spormerkezi.ihu.edu.tr/contents/6272e4951b4b3/0x0-dsc-5184-jpg.jpg';

export default function MatchDetailScreen({ route }: Props) {
  const { id } = route.params;
  const [match, setMatch] = useState<Match | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getMatchById(id);
      setMatch(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load match.');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const joinSolo = () => Alert.alert('Joined (mock)', 'You joined as a single player.');
  const joinGroup = () => Alert.alert('Joined (mock)', 'You joined as a group.');
  const payWithCard = () => Alert.alert('Payment (mock)', 'Card payment flow will open here.');

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.center}>
        <Text>Loading…</Text>
      </View>
    );
  }

  const filled = match.filledSlots ?? 0;
  const total = match.totalSlots ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: PITCH_PLACEHOLDER }} style={styles.image} resizeMode="cover" />
      </View>

      <View style={styles.content}>
        <View style={styles.rowTop}>
          <Text style={styles.date}>{formatDate(match.matchTimestamp)}</Text>
          <Text style={styles.time}>{formatTime(match.matchTimestamp)}</Text>
        </View>

        {/* slots directly under time */}
        <View style={styles.rowBetween}>
            <Text style={styles.field}>{match.fieldName}</Text>
            <View style={styles.slotsWrap}>
                <Icon name="user" size={16} color={colors.gray600} style={styles.slotsIcon} />
                <Text style={styles.slotsText}>{filled}/{total}</Text>
            </View>
        </View>
        <Text style={styles.city}>{match.city}</Text>

        <View style={styles.divider} />

        <Text style={styles.price}>{formatTL(match.pricePerUser)}</Text>

        <LargeButton title="Bireysel Katıl" onPress={joinSolo} style={{ marginTop: 18 }} />
        <LargeButton title="Grup Katıl" onPress={joinGroup} style={{ marginTop: 12 }} />
        <LargeButton title="Kart ile Öde" onPress={payWithCard} style={{ marginTop: 12 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.teal },
  imageWrap: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    overflow: 'hidden', // so image corners are rounded
  },
  image: { width: '100%', height: 220 },
  content: {
    backgroundColor: colors.white,
    marginTop: 5,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
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
});
