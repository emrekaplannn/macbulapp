import React, { useCallback, useLayoutEffect, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { AppDrawerParamList } from '../navigation/AppNavigator'; // use Drawer params now
import { colors } from '../theme/colors';
import { getReferralCode, getUserProfile, ReferralCodeDto, type UserProfile } from '../api/profile';
import { getWalletByUser, MOCK_USER_ID } from '../api/wallets';
import { formatTL } from '../utils/format';

type Props = DrawerScreenProps<AppDrawerParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const userId = MOCK_USER_ID; // mock until auth is ready

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [refCode, setRefCode] = useState<ReferralCodeDto | null>(null);
  const [twoFA, setTwoFA] = useState(false); // local-only mock
  const [balance, setBalance] = useState<number | null>(null); // header balance

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, rRes, wRes] = await Promise.allSettled([
      getUserProfile(userId),
      getReferralCode(userId),
      getWalletByUser(userId),
    ]);
      // Debug logs — check which one failed
        console.log('UserProfile result:', pRes);
        console.log('Referral result:', rRes);
        console.log('Wallet result:', wRes);
        if (pRes.status === 'fulfilled') {
      setProfile(pRes.value);
    } else {
      console.error('UserProfile failed:', pRes.reason);
    }
      if (pRes.status === 'fulfilled') {
      setProfile(pRes.value);
    } else {
      console.error('UserProfile failed:', pRes.reason);
    }

    if (rRes.status === 'fulfilled') {
      setRefCode(rRes.value ?? null);
    } else {
      console.warn('Referral code failed:', rRes.reason);
    }

    if (wRes.status === 'fulfilled') {
      setBalance(wRes.value.balance ?? 0);
    } else {
      console.warn('Wallet failed:', wRes.reason);
    }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  // Put balance on the native header (right)
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Profil',
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('Wallet')}>
          <Text style={styles.headerBalance}>
            {balance === null ? '...' : formatTL(balance)}
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, balance]);

  const copyCode = () => {
    if (!refCode?.code) return;
    Clipboard.setString(refCode.code);
    Alert.alert('Copied', 'Referral code copied to clipboard.');
  };

  const openNotificationPrefs = () => {
    Alert.alert('Coming soon', 'Notification preferences screen will be implemented later.');
  };
  const openKvkk = () => {
    Alert.alert('KVKK', 'KVKK text will be shown here (webview or in-app page).');
  };
  const changePassword = () => {
    Alert.alert('Change Password', 'Password change flow will be implemented later.');
  };
  const logout = () => {
    Alert.alert('Logout', 'Mock logout. Auth will be added at the end.');
  };

  const avatar =
    profile?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName || 'Guest')}&background=0D8ABC&color=fff`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 36 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >

        {/* Background header */}
    <View style={styles.headerBg} />
      {/* Header card */}
      <View style={styles.headerCard}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <Text style={styles.name}>{profile?.fullName || 'Guest User'}</Text>
        <Text style={styles.position}>{profile?.position || '—'}</Text>

        {/* Referral code row */}
        <View style={styles.refRow}>
          <Text style={styles.refCode}>{refCode?.code ?? '—'}</Text>
          <Pressable onPress={copyCode} style={styles.copyBtn} disabled={!refCode}>
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

        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text style={styles.rowTitle}>2-Aşamalı Doğrulama </Text>
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
  headerBalance: { color: '#fff', fontSize: 18, fontWeight: '800', paddingHorizontal: 16 },
    // New teal background
  headerBg: {
    position: 'absolute',
    top:0,
    left: 0,
    right: 0,
    height: 96, // tweak until it covers half the avatar
    backgroundColor: colors.teal,
    zIndex: -1
  },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: 'center',
    padding: 16,
  },
  avatar: { width: 128, height: 128, borderRadius: 64, marginBottom: 8 
},
  name: { fontSize: 24, fontWeight: '900', marginTop: 6 },
  position: { color: colors.gray600, marginTop: 2 , fontWeight: '700'},
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
