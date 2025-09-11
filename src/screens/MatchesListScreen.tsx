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
import { getWalletByUser } from '../api/wallets';
import { useWalletStore } from '../state/walletStore';
import { getUserProfile } from '../api/profile';
import { useProfileStore } from '../state/profileStore';
import { useAuthStore } from '../state/authStore';
import axios from 'axios';
import MatchCard from '../components/MatchCard';

type Props = NativeStackScreenProps<HomeStackParamList, 'MatchesList'>;
type ErrorState = { matches?: string; wallet?: string; profile?: string };

const LOG = (...a: any[]) => console.log('[MatchesList]', ...a);
const LOGG = (title: string, obj: any) => {
  try { console.log('[MatchesList]', title, JSON.stringify(obj)); } catch { console.log('[MatchesList]', title, obj); }
};

const mask = (t?: string | null) => (t ? `${t.slice(0, 6)}…${t.slice(-6)}` : '(none)');

const getErrMsg = (e: unknown) =>
  (axios.isAxiosError(e) && (e.response?.data?.message || e.message)) ||
  (typeof e === 'object' && e && 'message' in e && String((e as any).message)) ||
  (typeof e === 'string' ? e : 'Beklenmeyen bir hata oluştu.');

export default function MatchesListScreen({ navigation }: Props) {
  const [items, setItems] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState<ErrorState>({});

  // auth durumu
  const accessToken   = useAuthStore((s) => s.accessToken);
  const refreshToken  = useAuthStore((s) => s.refreshToken);
  const tokenType     = useAuthStore((s) => s.tokenType);
  const clearAuth     = useAuthStore((s) => s.clearAuth);

  // global store setter’ları
  const setGlobalBalance = useWalletStore.getState().setBalance;
  const setProfileStore  = useProfileStore.getState().setProfile;

  const reqIdRef = useRef(0);
  const mountedRef = useRef(true);
  useEffect(() => {
    LOG('mount');
    return () => { mountedRef.current = false; LOG('unmount'); };
  }, []);

  // token’ı her değiştiğinde maskeli logla
  useEffect(() => {
    LOG('tokens', { access: mask(accessToken), refresh: mask(refreshToken), tokenType });
  }, [accessToken, refreshToken, tokenType]);

  // 401/403 yakalanırsa sadece auth’u temizle (AppNavigator seni Login/Register’a düşürür)
  const handleAuthFail = useCallback((e: unknown) => {
    if (axios.isAxiosError(e)) {
      const code = e.response?.status;
      const url  = e.config?.url || '';

      // 401 -> refresh sonrasında da 401 ise buraya düşer
      if (code === 401) {
        clearAuth();
        return true;
      }

      // 403 -> korumalı me endpointleri için auth fail say
      const needsAuth =
        url.includes('/wallets') ||
        url.includes('/transactions') ||
        url.includes('/user-profiles');

      if (code === 403 && needsAuth) {
        clearAuth();
        return true;
      }
    }
    return false;
  }, [clearAuth]);

  const load = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    LOG('load start', { reqId });
    setLoading(true);
    setErrors({});

    // Access token yoksa ekranda sadece auth’u temizle, navigasyonu AppNavigator yönetsin
    if (!useAuthStore.getState().accessToken) {
      setLoading(false);
      clearAuth();
      return;
    }

    try {
      LOG('fetching: matches, wallet/me, profile/me');

      const [mRes, wRes, pRes] = await Promise.allSettled([
        listMatches(),
        getWalletByUser(),
        getUserProfile(),
      ]);

      if (!mountedRef.current || reqId !== reqIdRef.current) return;

      // ---- matches ----
      if (mRes.status === 'fulfilled') {
        LOG('matches OK', { count: mRes.value?.length });
        setItems(mRes.value);
      } else {
        LOG('matches ERROR', mRes.reason);
        if (!handleAuthFail(mRes.reason)) {
          setErrors((s) => ({ ...s, matches: getErrMsg(mRes.reason) }));
        }
      }

      // ---- wallet ----
      if (wRes.status === 'fulfilled') {
        LOGG('wallet OK', wRes.value);
        setGlobalBalance(wRes.value?.balance ?? 0);
      } else {
        LOG('wallet ERROR', wRes.reason);
        if (!handleAuthFail(wRes.reason)) {
          setGlobalBalance(null);
          setErrors((s) => ({ ...s, wallet: getErrMsg(wRes.reason) }));
        }
      }

      // ---- profile ----
      if (pRes.status === 'fulfilled') {
        LOGG('profile OK', pRes.value);
        setProfileStore({
          fullName:  pRes.value.fullName  ?? null,
          position:  pRes.value.position  ?? null,
          avatarUrl: pRes.value.avatarUrl ?? null,
        });
      } else {
        LOG('profile ERROR', pRes.reason);
        if (!handleAuthFail(pRes.reason)) {
          setErrors((s) => ({ ...s, profile: getErrMsg(pRes.reason) }));
        }
      }
    } finally {
      if (mountedRef.current && reqId === reqIdRef.current) {
        LOG('load end', { reqId });
        setLoading(false);
      }
    }
  }, [setGlobalBalance, setProfileStore, handleAuthFail, clearAuth]);

  // focus olduğunda yükle
  useFocusEffect(
    useCallback(() => {
      LOG('focus -> load()');
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    LOG('pull-to-refresh');
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  const handleJoin = (id: string) => {
    Alert.alert('Joined!', `You have joined match ${id} (mock).`);
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
          <MatchCard
            match={item}
            onJoin={handleJoin}
            onPress={(id) => navigation.navigate('MatchDetail', { id })}
          />
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
