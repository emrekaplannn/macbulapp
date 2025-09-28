// src/components/MatchCard.tsx
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
  const total  = match.totalSlots ?? 0;
  const isFull = total > 0 && filled >= total;

  return (
    <Pressable onPress={() => onPress?.(match.id)} style={styles.card}>
      <View style={styles.rowTop}>
        <Text style={styles.date}>{formatDate(match.matchTimestamp)}</Text>
        <Text style={styles.time}>{formatTime(match.matchTimestamp)}</Text>
      </View>

      <View style={styles.rowBetween}>
        <Text style={styles.field}>{match.fieldName}</Text>
        <View style={styles.slotsWrap}>
          {isFull && <Text style={styles.fullBadge}>DOLU</Text>}
          <Icon name="user" size={14} color={colors.gray600} style={styles.slotsIcon} />
          <Text style={styles.slotsText}>
            {total > 0 ? `${filled}/${total}` : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.rowMid}>
        <Icon name="map-pin" size={16} color={colors.teal} />
        <Text style={styles.city}>{match.city}</Text>
      </View>

      <View style={styles.rowBottom}>
        <Text style={styles.price}>{formatTL(match.pricePerUser)}</Text>
        <Pressable
          onPress={isFull ? undefined : () => onJoin(match.id)}
          disabled={isFull}
          style={[styles.joinBtn, isFull && styles.joinBtnDisabled]}
          accessibilityState={{ disabled: isFull }}
        >
          <Text style={styles.joinText}>{isFull ? 'Kontenjan dolu' : 'Katıl'}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 21, // Android
    shadowColor: '#000', // iOS gölge
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { fontSize: 16, fontWeight: '700' },
  time: { fontSize: 16, fontWeight: '700' },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 4,
    marginBottom: 6,
  },
  field: { fontSize: 20, fontWeight: '800', marginBottom: 6 },

  slotsWrap: { flexDirection: 'row', alignItems: 'center' },
  fullBadge: {
    backgroundColor: '#ffd9d9',
    color: '#b71c1c',
    fontWeight: '800',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  slotsIcon: { marginRight: 4 },
  slotsText: { fontSize: 14, color: colors.gray600, fontWeight: '600' },

  rowMid: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  city: { color: colors.gray600 },

  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontWeight: '700' },

  joinBtn: {
    backgroundColor: colors.teal,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  joinBtnDisabled: { opacity: 0.5 },
  joinText: { color: colors.white, fontWeight: '700' },
});
