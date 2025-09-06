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
import { useFocusEffect, CommonActions  } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors } from '../theme/colors';
import {
  getReferralCode,
  getUserProfile,
  type ReferralCodeDto,
  type UserProfile,
} from '../api/profile';
import { getWalletByUser, MOCK_USER_ID } from '../api/wallets';
import { ProfileStackParamList } from '../navigation/AppNavigator';
import { useWalletStore } from '../state/walletStore';
import { useProfileStore } from '../state/profileStore';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

type ErrorState = {
  profile?: string;
  referral?: string;
  wallet?: string;
};

const getErrMsg = (e: unknown) =>
  (typeof e === 'object' && e && 'message' in e && String((e as any).message)) ||
  (typeof e === 'string' ? e : 'Beklenmeyen bir hata oluştu.');

export default function ProfileScreen({ navigation }: Props) {
  const userId = MOCK_USER_ID; // mock until auth
  const setGlobalBalance = useWalletStore((s) => s.setBalance);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [refCode, setRefCode] = useState<ReferralCodeDto | null>(null);
  const [twoFA, setTwoFA] = useState(false);
  const [errors, setErrors] = useState<ErrorState>({});

  const load = useCallback(async () => {
    setLoading(true);
    setErrors({}); // reset previous errors
    let alive = true; // guard against setState after unmount

    try {
      const [pRes, rRes, wRes] = await Promise.allSettled([
        getUserProfile(userId),
        getReferralCode(userId),
        getWalletByUser(userId),
      ]);

      if (!alive) return;

      // Profile
      if (pRes.status === 'fulfilled') {
        setProfile(pRes.value);
        const { fullName, position, avatarUrl } = pRes.value || {};
        useProfileStore.getState().setProfile({ fullName: fullName ?? null, position: position ?? null, avatarUrl: avatarUrl ?? null });
      } else {
        console.error('UserProfile failed:', pRes.reason);
        setErrors((s) => ({ ...s, profile: `Profil bilgileri alınamadı: ${getErrMsg(pRes.reason)}` }));
      }

      // Referral
      if (rRes.status === 'fulfilled') {
        setRefCode(rRes.value ?? null);
      } else {
        console.warn('Referral code failed:', rRes.reason);
        setErrors((s) => ({ ...s, referral: `Referans kodu alınamadı: ${getErrMsg(rRes.reason)}` }));
      }

      // Wallet
      if (wRes.status === 'fulfilled') {
        const raw = wRes.value?.balance;
        const b = typeof raw === 'number' && isFinite(raw) ? raw : 0;
        setGlobalBalance(b); // ✅ header updates everywhere
      } else {
        console.warn('Wallet failed:', wRes.reason);
        setGlobalBalance(null);
        setErrors((s) => ({ ...s, wallet: `Cüzdan bilgisi alınamadı: ${getErrMsg(wRes.reason)}` }));
      }
    } catch (e) {
      console.error(e);
      setErrors({
        profile: `Yükleme başarısız: ${getErrMsg(e)}`,
        referral: `Yükleme başarısız: ${getErrMsg(e)}`,
        wallet: `Yükleme başarısız: ${getErrMsg(e)}`,
      });
      setGlobalBalance(null);
    } finally {
      if (alive) setLoading(false);
    }

    return () => {
      alive = false;
    };
  }, [userId, setGlobalBalance]);

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
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
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
        // clear global stores
        useWalletStore.getState().clear?.();
        useProfileStore.getState().clear?.();

        // jump to Login by resetting the Root stack (ProfileStack -> Drawer -> RootStack)
        const rootNav = navigation.getParent()?.getParent(); // ProfileStack -> Drawer -> Root
        if (rootNav) {
          rootNav.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Login' as never }],
            })
          );
        } else {
          // fallback (in case hierarchy changes)
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Login' as never }],
            })
          );
        }
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
      {/* Teal background behind avatar */}
      <View style={styles.headerBg} />

      {/* Error banner (compact & actionable) */}
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

      {/* Header card */}
      <View style={styles.headerCard}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <Text style={styles.name}>{profile?.fullName || 'Guest User'}</Text>
        <Text style={styles.position}>{profile?.position || '—'}</Text>

        {/* Referral code row */}
        <View style={styles.refRow}>
          <Text style={styles.refCode}>{refCode?.code ?? (loading ? '...' : '—')}</Text>
          <Pressable onPress={copyCode} style={styles.copyBtn} disabled={!refCode || loading}>
            <Text style={styles.copyBtnText}>Kodu Kopyala</Text>
          </Pressable>
        </View>
      </View>

      {/* Menu list */}
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

      {/* Logout */}
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
    top: 0,
    left: 0,
    right: 0,
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
