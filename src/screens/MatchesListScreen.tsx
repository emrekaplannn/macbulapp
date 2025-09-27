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
import { getUserProfile, getMyAvatar } from '../api/profile'; // ⬅️ avatar URL’i de al
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

  // auth
  const accessToken   = useAuthStore((s) => s.accessToken);
  const refreshToken  = useAuthStore((s) => s.refreshToken);
  const tokenType     = useAuthStore((s) => s.tokenType);
  const clearAuth     = useAuthStore((s) => s.clearAuth);

  // global stores
  const setGlobalBalance = useWalletStore.getState().setBalance;
  const setProfileStore  = useProfileStore.getState().setProfile;
  const setAvatarStore   = useProfileStore.getState().setAvatar;

  const reqIdRef = useRef(0);
  const mountedRef = useRef(true);
  useEffect(() => {
    LOG('mount');
    return () => { mountedRef.current = false; LOG('unmount'); };
  }, []);

  useEffect(() => {
    LOG('tokens', { access: mask(accessToken), refresh: mask(refreshToken), tokenType });
  }, [accessToken, refreshToken, tokenType]);

  const handleAuthFail = useCallback((e: unknown) => {
    if (axios.isAxiosError(e)) {
      const code = e.response?.status;
      const url  = e.config?.url || '';
      if (code === 401) { clearAuth(); return true; }

      const needsAuth =
        url.includes('/wallets') ||
        url.includes('/transactions') ||
        url.includes('/user-profiles');

      if (code === 403 && needsAuth) { clearAuth(); return true; }
    }
    return false;
  }, [clearAuth]);

  const load = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    LOG('load start', { reqId });
    setLoading(true);
    setErrors({});

    if (!useAuthStore.getState().accessToken) {
      setLoading(false);
      clearAuth();
      return;
    }

    try {
      LOG('fetching: matches, wallet/me, profile/me, avatar');
      const [mRes, wRes, pRes, aRes] = await Promise.allSettled([
        listMatches(),
        getWalletByUser(),
        getUserProfile(),
        getMyAvatar(3600), // Drawer’da görünsün diye 1 saatlik signed URL
      ]);

      if (!mountedRef.current || reqId !== reqIdRef.current) return;

      // matches
      if (mRes.status === 'fulfilled') {
        LOG('matches OK', { count: mRes.value?.length });
        setItems(mRes.value);
      } else {
        LOG('matches ERROR', mRes.reason);
        if (!handleAuthFail(mRes.reason)) {
          setErrors((s) => ({ ...s, matches: getErrMsg(mRes.reason) }));
        }
      }

      // wallet
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

      // profile
      if (pRes.status === 'fulfilled') {
        LOGG('profile OK', pRes.value);
        setProfileStore({
          fullName:   pRes.value.fullName  ?? null,
          position:   pRes.value.position  ?? null,
          avatarPath: pRes.value.avatarPath ?? null, // ⬅️ avatarPath’i sakla
          // avatarUrl UI için ayrı tutuluyor; aRes ile gelecek
        });
      } else {
        LOG('profile ERROR', pRes.reason);
        if (!handleAuthFail(pRes.reason)) {
          setErrors((s) => ({ ...s, profile: getErrMsg(pRes.reason) }));
        }
      }

      // avatar signed URL (opsiyonel ama Drawer için faydalı)
      if (aRes.status === 'fulfilled') {
        const { path, url } = aRes.value || {};
        setAvatarStore({ path: path ?? undefined, url: url ?? null });
      } else {
        // avatar yoksa sessiz geç
        if (!handleAuthFail(aRes.reason)) {
          LOG('avatar WARN', getErrMsg(aRes.reason));
        }
      }
    } finally {
      if (mountedRef.current && reqId === reqIdRef.current) {
        LOG('load end', { reqId });
        setLoading(false);
      }
    }
  }, [setGlobalBalance, setProfileStore, setAvatarStore, handleAuthFail, clearAuth]);

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
