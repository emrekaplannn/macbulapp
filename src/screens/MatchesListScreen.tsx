// src/screens/MatchesListScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  RefreshControl, Alert, Pressable
} from 'react-native';
import { colors } from '../theme/colors';
import { listMatches, Match } from '../api/matches';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../navigation/AppNavigator';
import { useFocusEffect } from '@react-navigation/native';
import { getWalletByUser, MOCK_USER_ID } from '../api/wallets';
import { useWalletStore } from '../state/walletStore';
import { getUserProfile } from '../api/profile';              // ✅ NEW
import { useProfileStore } from '../state/profileStore';       // ✅ NEW
import MatchCard from '../components/MatchCard';

type Props = NativeStackScreenProps<HomeStackParamList, 'MatchesList'>;

type ErrorState = { matches?: string; wallet?: string; profile?: string }; // ✅

const getErrMsg = (e: unknown) =>
  (typeof e === 'object' && e && 'message' in e && String((e as any).message)) ||
  (typeof e === 'string' ? e : 'Beklenmeyen bir hata oluştu.');

export default function MatchesListScreen({ navigation }: Props) {
  const [items, setItems] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState<ErrorState>({});

  // use setters without causing hook deps churn
  const setGlobalBalance = useWalletStore.getState().setBalance;     // wallet header
  const setProfileStore  = useProfileStore.getState().setProfile;    // drawer header

  const reqIdRef = useRef(0);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const load = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setErrors({});

    try {
      const [mRes, wRes, pRes] = await Promise.allSettled([
        listMatches(),
        getWalletByUser(MOCK_USER_ID),
        getUserProfile(MOCK_USER_ID),           // ✅ fetch profile on Home
      ]);

      if (!mountedRef.current || reqId !== reqIdRef.current) return;

      // matches
      if (mRes.status === 'fulfilled') setItems(mRes.value);
      else setErrors((s) => ({ ...s, matches: `Maç listesi alınamadı: ${getErrMsg(mRes.reason)}` }));

      // wallet
      if (wRes.status === 'fulfilled') {
        const b = Number.isFinite(wRes.value?.balance) ? wRes.value.balance : 0;
        setGlobalBalance(b);
      } else {
        setGlobalBalance(null);
        setErrors((s) => ({ ...s, wallet: `Cüzdan bilgisi alınamadı: ${getErrMsg(wRes.reason)}` }));
      }

      // profile → hydrate drawer header (name/position/avatar)
      if (pRes.status === 'fulfilled') {
        const { fullName, position, avatarUrl } = pRes.value || {};
        useProfileStore.getState().setProfile({ fullName: fullName ?? null, position: position ?? null, avatarUrl: avatarUrl ?? null });
        
      } else {
        setErrors((s) => ({ ...s, profile: `Profil bilgileri alınamadı: ${getErrMsg(pRes.reason)}` }));
      }
    } catch (e) {
      if (!mountedRef.current || reqId !== reqIdRef.current) return;
      setErrors({
        matches: `Yükleme başarısız: ${getErrMsg(e)}`,
        wallet:  `Yükleme başarısız: ${getErrMsg(e)}`,
        profile: `Yükleme başarısız: ${getErrMsg(e)}`,
      });
      setGlobalBalance(null);
    } finally {
      if (mountedRef.current && reqId === reqIdRef.current) setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  const handleJoin = (id: string) => {
    Alert.alert('Joined!', `You have joined match ${id} (mock).`);
    // If joining affects balance later, call setGlobalBalance(newValue) here.
  };

  const anyError = errors.matches || errors.wallet || errors.profile;

  return (
    <View style={styles.container}>
      {anyError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Bazı veriler yüklenemedi</Text>
          {errors.matches ? <Text style={styles.errorText}>• {errors.matches}</Text> : null}
          {errors.wallet ?  <Text style={styles.errorText}>• {errors.wallet}</Text>  : null}
          {errors.profile ? <Text style={styles.errorText}>• {errors.profile}</Text> : null}
          <Pressable style={styles.retryBtn} onPress={load} disabled={loading}>
            <Text style={styles.retryText}>{loading ? 'Yükleniyor…' : 'Tekrar Dene'}</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.subtle}>Loading…</Text>
          ) : anyError ? (
            <Text style={[styles.subtle, { color: 'red' }]}>Hata oluştu.</Text>
          ) : (
            <Text style={styles.subtle}>No matches yet.</Text>
          )
        }
        renderItem={({ item }) => (
          <MatchCard match={item} onJoin={handleJoin} onPress={(id) => navigation.navigate('MatchDetail', { id })} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },
  listContent: { padding: 16 },
  subtle: { textAlign: 'center', color: colors.gray600, marginTop: 24 },

  errorBox: {
    backgroundColor: '#fdecea',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
  },
  errorTitle: { color: '#b71c1c', fontWeight: '800', marginBottom: 6 },
  errorText: { color: '#b71c1c', marginTop: 2 },
  retryBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#b71c1c',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '700' },
});
