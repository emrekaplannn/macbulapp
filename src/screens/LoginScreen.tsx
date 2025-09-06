import React, { useState } from 'react';
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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { colors } from '../theme/colors';

// This matches the Root stack below
export type RootStackParamList = { Login: undefined; App: undefined; Register: undefined };
type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const teal = colors?.teal ?? '#0097A7';

  const onLogin = () => {
    // mock: skip auth and enter the app
    navigation.replace('App');
  };

  const onSignup = () => {
  navigation.navigate('Register');   // 👈 go to Register
};

  const onForgot = () => {
    Alert.alert('Yakında', 'Şifre sıfırlama akışı yakında eklenecek.');
  };

  const onKvkk = () => {
    Alert.alert('KVKK', 'KVKK metni burada gösterilecek.');
  };
  const onPrivacy = () => {
    Alert.alert('Gizlilik Politikası', 'Gizlilik politikası burada gösterilecek.');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: teal }]} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Brand */}
          <Text style={styles.brand}>MaçBul</Text>

          {/* Inputs */}
          <View style={styles.inputWrap}>
            <Feather name="phone" size={18} color="rgba(255,255,255,0.9)" />
            <TextInput
              placeholder="Telefon numarası veya e-posta"
              placeholderTextColor="rgba(255,255,255,0.8)"
              value={identifier}
              onChangeText={setIdentifier}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
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
            />
          </View>

          {/* Login */}
          <Pressable style={styles.primaryBtn} onPress={onLogin}>
            <Text style={styles.primaryBtnText}>Giriş Yap</Text>
          </Pressable>

          {/* Forgot password */}
          <Pressable onPress={onForgot} style={{ marginTop: 10 }}>
            <Text style={styles.linkRow}>
              <Feather name="help-circle" size={14} /> <Text>Şifremi unuttum</Text>
            </Text>
          </Pressable>

          {/* Divider space */}
          <View style={{ height: 28 }} />

          {/* Sign up (mock for now) */}
          <Pressable style={styles.secondaryBtn} onPress={onSignup}>
            <Text style={styles.secondaryBtnText}>Kayıt Ol</Text>
          </Pressable>

          {/* Legal */}
          <Text style={styles.legal}>
            Devam ederek{' '}
            <Text style={styles.legalLink} onPress={onKvkk}>
              KVKK metnini
            </Text>{' '}
            ve{' '}
            <Text style={styles.legalLink} onPress={onPrivacy}>
              Gizlilik Politikası
            </Text>
            ’nı kabul etmiş olursunuz.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
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
  legal: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 16,
  },
  legalLink: { textDecorationLine: 'underline', fontWeight: '800', color: '#fff' },
});
