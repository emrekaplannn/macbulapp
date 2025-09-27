import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';
import api from '../lib/api';
import { useAuthStore } from '../state/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);

  const teal = colors?.teal ?? '#0097A7';
  const setAuth = useAuthStore((s) => s.setAuth);
  const mountedRef = useRef(true);

  const canSubmit = useMemo(() => {
    return identifier.trim().length > 3 && password.length >= 4 && !loading;
  }, [identifier, password, loading]);

  const parseError = (e: any): string => {
    const msg =
      e?.response?.data && typeof e.response.data === 'string'
        ? e.response.data
        : e?.response?.data?.message ||
          e?.message ||
          'Beklenmeyen bir hata oluştu.';
    return String(msg);
  };

  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const onLogin = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      const email = identifier.trim().toLowerCase();

      console.log('[LOGIN][REQ]', { email, password: '•••' }); // mask

      // /auth/login -> api.ts, Authorization eklemez (isAuthRequest)
      const res = await api.post('/auth/login', { email, password });

      const {
        accessToken,
        refreshToken,
        tokenType = 'Bearer',
        expiresInMs = 900_000,
      } = res.data || {};

      if (!accessToken) throw new Error('Access token alınamadı.');

      setAuth({ accessToken, refreshToken, tokenType, expiresInMs, email });
      console.log('[LOGIN][OK]');

    } catch (e) {
      const msg = parseError(e);
      console.log('[LOGIN][ERR]', msg);
      Alert.alert('Giriş başarısız', msg);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const onSignup = () => navigation.navigate('Register');
  const onForgot = () => Alert.alert('Yakında', 'Şifre sıfırlama akışı yakında eklenecek.');
  const onKvkk = () => Alert.alert('KVKK', 'KVKK metni burada gösterilecek.');
  const onPrivacy = () => Alert.alert('Gizlilik Politikası', 'Gizlilik politikası burada gösterilecek.');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: teal }]} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <Text style={styles.brand}>MaçBul</Text>

          <View style={styles.inputWrap}>
            <Feather name="mail" size={18} color="rgba(255,255,255,0.9)" />
            <TextInput
              placeholder="E-posta"
              placeholderTextColor="rgba(255,255,255,0.8)"
              value={identifier}
              onChangeText={setIdentifier}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              returnKeyType="next"
              onSubmitEditing={() => { /* şifre alanına geçilebilir */ }}
            />
          </View>

          <View style={[styles.inputWrap, { marginTop: 12 }]}>
            <Feather name="lock" size={18} color="rgba(255,255,255,0.9)" />
            <TextInput
              placeholder="Şifre"
              placeholderTextColor="rgba(255,255,255,0.8)"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={onLogin}
            />
          </View>

          <Pressable
            style={[styles.primaryBtn, !canSubmit && { opacity: 0.5 }]}
            onPress={onLogin}
            disabled={!canSubmit}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Giriş Yap</Text>}
          </Pressable>

          <Pressable onPress={onForgot} style={{ marginTop: 10 }}>
            <Text style={styles.linkRow}>
              <Feather name="help-circle" size={14} /> <Text>Şifremi unuttum</Text>
            </Text>
          </Pressable>

          <View style={{ height: 28 }} />

          <Pressable style={styles.secondaryBtn} onPress={onSignup} disabled={loading}>
            <Text style={styles.secondaryBtnText}>Kayıt Ol</Text>
          </Pressable>

          <Text style={styles.legal}>
            Devam ederek <Text style={styles.legalLink} onPress={onKvkk}>KVKK metnini</Text> ve{' '}
            <Text style={styles.legalLink} onPress={onPrivacy}>Gizlilik Politikası</Text>’nı kabul etmiş olursunuz.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  brand: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 44,
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 28,
    textAlign: 'center',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryBtn: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.22)',
    marginTop: 16,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  secondaryBtn: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  secondaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  linkRow: { color: 'rgba(255,255,255,0.9)', fontWeight: '700' },
  legal: { color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 16 },
  legalLink: { textDecorationLine: 'underline', fontWeight: '800', color: '#fff' },
});
