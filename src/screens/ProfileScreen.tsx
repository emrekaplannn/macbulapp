// src/screens/ProfileScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors } from '../theme/colors';
import {
  getReferralCode,
  getUserProfile,
  type ReferralCodeDto,
  type UserProfile,
} from '../api/profile';
import { getWalletByUser } from '../api/wallets';
import { ProfileStackParamList } from '../navigation/AppNavigator';
import { useWalletStore } from '../state/walletStore';
import { useProfileStore } from '../state/profileStore';
import { useAuthStore } from '../state/authStore';
import axios from 'axios';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

type ErrorState = {
  profile?: string;
  referral?: string;
  wallet?: string;
};

const LOG = (...a: any[]) => console.log('[Profile]', ...a);
const getErrMsg = (e: unknown) =>
  (axios.isAxiosError(e) && (e.response?.data?.message || e.message)) ||
  (typeof e === 'object' && e && 'message' in e && String((e as any).message)) ||
  (typeof e === 'string' ? e : 'Beklenmeyen bir hata oluştu.');

export default function ProfileScreen({ navigation }: Props) {
  const setGlobalBalance = useWalletStore((s) => s.setBalance);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [refCode, setRefCode] = useState<ReferralCodeDto | null>(null);
  const [twoFA, setTwoFA] = useState(false);
  const [errors, setErrors] = useState<ErrorState>({});

  const accessToken  = useAuthStore((s) => s.accessToken);
  const clearAuth    = useAuthStore((s) => s.clearAuth);

  const handleAuthFail = useCallback((e: unknown, from?: string) => {
    if (axios.isAxiosError(e)) {
      const code = e.response?.status;
      const url  = from || e.config?.url || '';
      console.log('[Profile][AUTH?]', { code, url });

      // 401: her zaman oturum düşür
      if (code === 401) {
        console.log('[Profile] 401 -> clearAuth + reset(Login)');
        clearAuth();
        const rootNav = navigation.getParent()?.getParent(); // ProfileStack -> Drawer -> Root
        (rootNav ?? navigation).dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: 'Login' as never }] })
        );
        return true;
      }

      // 403: me endpointlerinde auth hatası say
      const needsAuth =
        url.includes('/wallets') ||
        url.includes('/transactions') ||
        url.includes('/user-profiles');
      if (code === 403 && needsAuth) {
        console.log('[Profile] 403 protected -> clearAuth + reset(Login)');
        clearAuth();
        const rootNav = navigation.getParent()?.getParent();
        (rootNav ?? navigation).dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: 'Login' as never }] })
        );
        return true;
      }
    }
    return false;
  }, [clearAuth, navigation]);

  const load = useCallback(async () => {
    setLoading(true);
    setErrors({});
    let alive = true;

    // token yoksa direkt Login
    if (!accessToken) {
      LOG('no accessToken -> reset(Login)');
      const rootNav = navigation.getParent()?.getParent();
      (rootNav ?? navigation).dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Login' as never }] })
      );
      return;
    }

    try {
      LOG('fetching: profile/me, referral, wallet/me');
      const [pRes, rRes, wRes] = await Promise.allSettled([
        getUserProfile(),
        getReferralCode(),
        getWalletByUser(),
      ]);

      if (!alive) return;

      // Profile
      if (pRes.status === 'fulfilled') {
        setProfile(pRes.value);
        const { fullName, position, avatarUrl } = pRes.value || {};
        useProfileStore
          .getState()
          .setProfile({ fullName: fullName ?? null, position: position ?? null, avatarUrl: avatarUrl ?? null });
      } else {
        if (!handleAuthFail(pRes.reason, '/user-profiles/me')) {
          console.error('UserProfile failed:', pRes.reason);
          setErrors((s) => ({ ...s, profile: `Profil bilgileri alınamadı: ${getErrMsg(pRes.reason)}` }));
        } else {
          return; // auth fail durumda devam etmeye gerek yok
        }
      }

      // Referral
      if (rRes.status === 'fulfilled') {
        setRefCode(rRes.value ?? null);
      } else {
        if (!handleAuthFail(rRes.reason, '/referral-codes/user-actives')) {
          console.warn('Referral code failed:', rRes.reason);
          setErrors((s) => ({ ...s, referral: `Referans kodu alınamadı: ${getErrMsg(rRes.reason)}` }));
        } else {
          return;
        }
      }

      // Wallet
      if (wRes.status === 'fulfilled') {
        const raw = wRes.value?.balance;
        const b = typeof raw === 'number' && isFinite(raw) ? raw : 0;
        setGlobalBalance(b);
      } else {
        if (!handleAuthFail(wRes.reason, '/wallets/user')) {
          console.warn('Wallet failed:', wRes.reason);
          setGlobalBalance(null);
          setErrors((s) => ({ ...s, wallet: `Cüzdan bilgisi alınamadı: ${getErrMsg(wRes.reason)}` }));
        } else {
          return;
        }
      }
    } catch (e) {
      if (!handleAuthFail(e)) {
        console.error(e);
        setErrors({
          profile: `Yükleme başarısız: ${getErrMsg(e)}`,
          referral: `Yükleme başarısız: ${getErrMsg(e)}`,
          wallet: `Yükleme başarısız: ${getErrMsg(e)}`,
        });
        setGlobalBalance(null);
      }
    } finally {
      if (alive) setLoading(false);
    }

    return () => {
      alive = false;
    };
  }, [accessToken, handleAuthFail, navigation, setGlobalBalance]);

  useFocusEffect(
    useCallback(() => {
      let cleanup: void | (() => void);
      (async () => {
        cleanup = await load();
      })();
      return () => {
        if (typeof cleanup === 'function') cleanup();
      };
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  const copyCode = async () => {
    try {
      if (!refCode?.code) return;
      await Clipboard.setString(refCode.code);
      Alert.alert('Kopyalandı', 'Referans kodu panoya kopyalandı.');
    } catch (e) {
      Alert.alert('Hata', `Kod kopyalanamadı: ${getErrMsg(e)}`);
    }
  };

  const openNotificationPrefs = () =>
    Alert.alert('Yakında', 'Bildirim tercihleri ekranı daha sonra eklenecek.');
  const openKvkk = () => Alert.alert('KVKK', 'KVKK metni burada gösterilecek.');
  const changePassword = () => Alert.alert('Şifre Değiştir', 'Akış daha sonra eklenecek.');

  const logout = () => {
    Alert.alert('Çıkış', 'Hesabınızdan çıkış yapmak istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Evet',
        style: 'destructive',
        onPress: () => {
          // global store’ları temizle
          useWalletStore.getState().clear?.();
          useProfileStore.getState().clear?.();
          useAuthStore.getState().clearAuth(); // 🔑 auth temizle

          // Root stack'i Login'e sıfırla
          const rootNav = navigation.getParent()?.getParent();
          (rootNav ?? navigation).dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: 'Login' as never }] })
          );
        },
      },
    ]);
  };

  const avatar =
    profile?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName || 'Guest')}&background=0D8ABC&color=fff`;

  const anyError = errors.profile || errors.referral || errors.wallet;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 36 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.headerBg} />

      {anyError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Bazı veriler yüklenemedi</Text>
          {errors.profile ? <Text style={styles.errorText}>• {errors.profile}</Text> : null}
          {errors.referral ? <Text style={styles.errorText}>• {errors.referral}</Text> : null}
          {errors.wallet ? <Text style={styles.errorText}>• {errors.wallet}</Text> : null}
          <Pressable style={styles.retryBtn} onPress={load} disabled={loading}>
            <Text style={styles.retryText}>{loading ? 'Yükleniyor…' : 'Tekrar Dene'}</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.headerCard}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <Text style={styles.name}>{profile?.fullName || 'Guest User'}</Text>
        <Text style={styles.position}>{profile?.position || '—'}</Text>

        <View style={styles.refRow}>
          <Text style={styles.refCode}>{refCode?.code ?? (loading ? '...' : '—')}</Text>
          <Pressable onPress={copyCode} style={styles.copyBtn} disabled={!refCode || loading}>
            <Text style={styles.copyBtnText}>Kodu Kopyala</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.list}>
        <Pressable style={styles.row} onPress={changePassword}>
          <Text style={styles.rowTitle}>Şifreni Değiştir</Text>
          <Text style={styles.chev}>{'>'}</Text>
        </Pressable>

        <Pressable style={styles.row} onPress={openNotificationPrefs}>
          <Text style={styles.rowTitle}>Bildirim Tercihleri</Text>
          <Text style={styles.chev}>{'>'}</Text>
        </Pressable>

        <Pressable style={styles.row} onPress={openKvkk}>
          <Text style={styles.rowTitle}>KVKK</Text>
          <Text style={styles.chev}>{'>'}</Text>
        </Pressable>

        <Pressable style={styles.row} onPress={() => navigation.navigate('Support')}>
          <Text style={styles.rowTitle}>Destek & Geri Bildirim</Text>
          <Text style={styles.chev}>{'>'}</Text>
        </Pressable>

        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text style={styles.rowTitle}>2-Aşamalı Doğrulama</Text>
          <Switch value={twoFA} onValueChange={setTwoFA} />
        </View>
      </View>

      <Pressable onPress={logout} style={styles.logout}>
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },

  headerBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 96,
    backgroundColor: colors.teal,
    zIndex: -1,
  },

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

  headerCard: {
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: 'center',
    padding: 16,
  },
  avatar: { width: 128, height: 128, borderRadius: 64, marginBottom: 8 },
  name: { fontSize: 24, fontWeight: '900', marginTop: 6 },
  position: { color: colors.gray600, marginTop: 2, fontWeight: '700' },

  refRow: {
    flexDirection: 'row',
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refCode: { fontSize: 18, fontWeight: '700' },
  copyBtn: {
    backgroundColor: colors.teal,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  copyBtnText: { color: colors.white, fontWeight: '700' },

  list: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  rowTitle: { fontSize: 16, fontWeight: '700' },
  chev: { marginLeft: 'auto', color: colors.gray600, fontSize: 18 },

  logout: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 16,
  },
  logoutText: { color: '#D32F2F', fontWeight: '900', fontSize: 16 },
});
