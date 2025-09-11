// src/screens/MatchDetailScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Image, Alert, ScrollView,
  RefreshControl, ActivityIndicator, Pressable
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { formatDate, formatTime, formatTL } from '../utils/format';
import { getMatchById, Match } from '../api/matches';
import LargeButton from '../components/LargeButton';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { getWalletByUser } from '../api/wallets';
import { useWalletStore } from '../state/walletStore';
import { useAuthStore } from '../state/authStore';
import axios from 'axios';

type Props = NativeStackScreenProps<HomeStackParamList, 'MatchDetail'>;

const PITCH_PLACEHOLDER =
  'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1200';

const getErrMsg = (e: unknown) =>
  (axios.isAxiosError(e) && (e.response?.data?.message || e.message)) ||
  (typeof e === 'object' && e && 'message' in e && String((e as any).message)) ||
  (typeof e === 'string' ? e : 'Beklenmeyen bir hata oluştu.');

export default function MatchDetailScreen({ route }: Props) {
  const { id } = route.params;

  const [match, setMatch] = useState<Match | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // stores
  const setGlobalBalance = useWalletStore.getState().setBalance;
  const clearAuth       = useAuthStore((s) => s.clearAuth);
  const accessToken     = useAuthStore((s) => s.accessToken);

  // stale/unmount guards
  const reqIdRef = useRef(0);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // 401/403 (refresh sonrası) -> sadece auth’u temizle; AppNavigator login akışına düşürür
  const handleAuthFail = useCallback((e: unknown, fromUrl?: string) => {
    if (axios.isAxiosError(e)) {
      const code = e.response?.status;
      const url  = fromUrl || e.config?.url || '';

      if (code === 401) {
        clearAuth?.();
        return true;
      }

      // 403 ise yalnızca korumalı me uçları için auth fail say
      const needsAuth =
        url.includes('/wallets') ||
        url.includes('/transactions') ||
        url.includes('/user-profiles');

      if (code === 403 && needsAuth) {
        clearAuth?.();
        return true;
      }
    }
    return false;
  }, [clearAuth]);

  const load = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);

    try {
      // her zaman: maç public
      const matchPromise = getMatchById(id);

      // sadece access varsa: cüzdan
      const walletPromise = accessToken ? getWalletByUser() : Promise.resolve(null as any);

      const [mRes, wRes] = await Promise.allSettled([matchPromise, walletPromise]);

      if (!mountedRef.current || reqId !== reqIdRef.current) return;

      // match
      if (mRes.status === 'fulfilled') {
        setMatch(mRes.value);
      } else {
        setError(`Maç bilgisi alınamadı: ${getErrMsg(mRes.reason)}`);
      }

      // wallet
      if (wRes.status === 'fulfilled') {
        if (wRes.value) {
          const b = Number.isFinite(wRes.value?.balance) ? wRes.value.balance : 0;
          setGlobalBalance(b);
        } else {
          setGlobalBalance(null);
        }
      } else {
        if (!handleAuthFail(wRes.reason, '/wallets/user')) {
          setGlobalBalance(null); // sessiz düş
        }
      }
    } catch (e) {
      if (!mountedRef.current || reqId !== reqIdRef.current) return;
      if (!handleAuthFail(e)) {
        setError(getErrMsg(e));
        setGlobalBalance(null);
      }
    } finally {
      if (mountedRef.current && reqId === reqIdRef.current) setLoading(false);
    }
  }, [id, accessToken, handleAuthFail, setGlobalBalance]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  const requireAuthAction = (fn: () => void) => {
    if (!accessToken) {
      Alert.alert('Giriş gerekli', 'Bu işlem için giriş yapmalısınız.');
      // Kullanıcı bu noktada Login’e döndürülmek isterse sadece clearAuth yeterli
      clearAuth?.(); // AppNavigator otomatik Login/Register akışına alır
      return;
    }
    fn();
  };

  const joinSolo    = () => requireAuthAction(() => Alert.alert('Joined (mock)', 'Tek kişi katıldın.'));
  const joinGroup   = () => requireAuthAction(() => Alert.alert('Joined (mock)', 'Grup katılımı yapıldı.'));
  const payWithCard = () => requireAuthAction(() => Alert.alert('Payment (mock)', 'Kart ödeme akışı açılacak.'));

  if (error && !match) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red', marginBottom: 12 }}>{error}</Text>
        <Pressable onPress={load} style={styles.retry}>
          <Text style={{ color: colors.white, fontWeight: '700' }}>Tekrar Dene</Text>
        </Pressable>
      </View>
    );
  }

  if (loading && !match) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.teal} />
        <Text style={{ marginTop: 8 }}>Yükleniyor…</Text>
      </View>
    );
  }

  // Safe guards
  const ts    = match?.matchTimestamp ?? Date.now();
  const filled= match?.filledSlots ?? 0;
  const total = match?.totalSlots ?? 0;
  const field = match?.fieldName ?? '';
  const city  = match?.city ?? '';
  const price = match?.pricePerUser ?? 0;

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

        <LargeButton title="Bireysel Katıl" onPress={joinSolo}  style={{ marginTop: 18 }} />
        <LargeButton title="Grup Katıl"     onPress={joinGroup} style={{ marginTop: 12 }} />
        <LargeButton title="Kart ile Öde"   onPress={payWithCard} style={{ marginTop: 12 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
