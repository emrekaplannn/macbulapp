import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../theme/colors';
import { Match } from '../api/matches';
import { formatDate, formatTime, formatTL } from '../utils/format';

type Props = {
  match: Match;
  onJoin: (id: string) => void;
  onPress?: (id: string) => void;
};

export default function MatchCard({ match, onJoin, onPress }: Props) {
  const filled = match.filledSlots ?? 0;
  const total = match.totalSlots ?? 0;

  return (
    <Pressable onPress={() => onPress?.(match.id)} style={styles.card}>
      <View style={styles.rowTop}>
        <Text style={styles.date}>{formatDate(match.matchTimestamp)}</Text>
        <Text style={styles.time}>{formatTime(match.matchTimestamp)}</Text>
      </View>

      <View style={styles.rowBetween}>
        <Text style={styles.field}>{match.fieldName}</Text>
        <View style={styles.slotsWrap}>
            <Icon name="user" size={14} color={colors.gray600} style={styles.slotsIcon} />
            <Text style={styles.slotsText}>{filled}/{total}</Text>
        </View>
      </View>

      <View style={styles.rowMid}>
        <Icon name="map-pin" size={16} color={colors.teal} />
        <Text style={styles.city}>{match.city}</Text>
      </View>

      <View style={styles.rowBottom}>
        <Text style={styles.price}>{formatTL(match.pricePerUser)}</Text>
        <Pressable onPress={() => onJoin(match.id)} style={styles.joinBtn}>
          <Text style={styles.joinText}>Katıl</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 12, elevation:21 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { fontSize: 16, fontWeight: '700' },
  time: { fontSize: 16, fontWeight: '700' },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline', // keeps big title + small slots aligned nicely
    marginTop: 4,
    marginBottom: 6,
  },
  slotsWrap: { flexDirection: 'row', alignItems: 'center' },
  slotsIcon: { marginRight: 4 },
  slotsText: { fontSize: 14, color: colors.gray600, fontWeight: '600' },

  field: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  rowMid: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  city: { color: colors.gray600 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontWeight: '700' },
  joinBtn: { backgroundColor: colors.teal, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  joinText: { color: colors.white, fontWeight: '700' },
});
