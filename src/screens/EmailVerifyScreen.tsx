import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import api from '../lib/api';
import { useAuthStore } from '../state/authStore';
import { resendEmailCode, verifyEmailCode } from '../api/auth';
import { logoutSafely } from '../lib/session';


type Props = NativeStackScreenProps<RootStackParamList, 'EmailVerify'>;

export default function EmailVerifyScreen({ navigation }: Props) {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);
  const email = useAuthStore((s) => s.email); // ← e-posta store’dan

  // focus first input on mount
  useEffect(() => {
    const f = setTimeout(() => inputs.current[0]?.focus(), 200);
    return () => clearTimeout(f);
  }, []);

  // Timer (countdown)
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // Auto-verify when 6 digits entered
  useEffect(() => {
    const full = code.join('');
    if (full.length === 6 && /^\d{6}$/.test(full)) {
      verifyCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleChange = (text: string, index: number) => {
    // allow pasting all 6 digits into one box
    if (/^\d{6}$/.test(text)) {
      setCode(text.split(''));
      inputs.current[5]?.focus();
      return;
    }

    if (/^\d$/.test(text)) {
      const newCode = [...code];
      newCode[index] = text;
      setCode(newCode);
      if (index < 5) inputs.current[index + 1]?.focus();
      return;
    }

    if (text === '') {
      const newCode = [...code];
      newCode[index] = '';
      setCode(newCode);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const verifyCode = async () => {
    if (loading) return;
    const fullCode = code.join('');
    if (!/^\d{6}$/.test(fullCode)) {
      Alert.alert('Eksik Kod', 'Lütfen 6 haneli kodu giriniz.');
      return;
    }
    try {
      setLoading(true);
      // 🔁 GÜNCEL ENDPOINT
      const data = await verifyEmailCode(fullCode);  // res.data döner
      // Opsiyonel: backend verified flag dönüyorsa kontrol et
      if (data?.verified === false) {
        throw new Error(data?.message || 'Verification failed');
      }
      Alert.alert('Başarılı', 'E-posta doğrulandı!');
      navigation.replace('OnboardingAvatar');
    } catch (e: any) {
      console.log('[VERIFY][ERR]', e?.response?.data || e?.message);
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        'Kod geçersiz veya süresi dolmuş.';
      Alert.alert('Hata', msg);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (timer > 0 || loading) return;
    if (!email) {
      Alert.alert('Hata', 'Kullanıcı e-postası bulunamadı.');
      return;
    }
    try {
      // 🔁 GÜNCEL ENDPOINT (+ destination)
      setLoading(true);
      await resendEmailCode(email); 
      Alert.alert('Gönderildi', `Yeni doğrulama kodu ${email} adresine gönderildi.`);
      setCode(['', '', '', '', '', '']);
      setTimer(60);
      inputs.current[0]?.focus();
    } catch (e: any) {
      console.log('[RESEND][ERR]', e?.response?.data || e?.message);
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        'Kod yeniden gönderilemedi.';
      Alert.alert('Hata', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>E-postanı Doğrula</Text>
      <Text style={styles.subtitle}>
        Lütfen e-postana gönderilen 6 haneli kodu gir
      </Text>

      <View style={styles.inputRow}>
        {code.map((digit, i) => (
          <TextInput
            key={i}
            ref={(r) => { inputs.current[i] = r; }}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={6} // paste kolaylığı için 6; tek hane girişte yine 1 alıyoruz
            value={digit}
            onChangeText={(t) => handleChange(t, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            returnKeyType={i === 5 ? 'done' : 'next'}
          />
        ))}
      </View>

      <View style={styles.resendRow}>
        <Text style={styles.timer}>
          {timer > 0 ? `0:${timer.toString().padStart(2, '0')}` : ''}
        </Text>
        <Pressable
          onPress={resendCode}
          disabled={timer > 0 || loading}
          accessibilityState={{ disabled: timer > 0 || loading }}
        >
          <Text
            style={[
              styles.resend,
              { color: timer > 0 || loading ? colors.gray600 : colors.white },
            ]}
          >
          Kodu yeniden gönder
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.primaryBtn, { opacity: loading ? 0.6 : 1 }]}
        onPress={verifyCode}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.primaryText}>Doğrula</Text>
        )}
      </Pressable>

      <Pressable
        disabled={loading}
        onPress={async () => {
          // Oturumu güvenli şekilde kapat; navigator otomatik Login’e döner
          await logoutSafely();
          navigation.replace('Login');
        }}
      >
        <Text style={styles.backLink}>Giriş ekranına dön</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.teal, padding: 24 },
  title: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 28,
    textAlign: 'center',
    marginTop: 32,
  },
  subtitle: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    fontSize: 22,
    textAlign: 'center',
    borderRadius: 12,
    width: 48,
    height: 56,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  timer: { color: '#fff', fontSize: 14, marginRight: 12 },
  resend: { fontWeight: '800', fontSize: 14 },
  primaryBtn: {
    backgroundColor: '#004D40',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginHorizontal: 24,
  },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  backLink: {
    color: '#fff',
    marginTop: 28,
    textAlign: 'center',
    textDecorationLine: 'underline',
    fontSize: 16, fontWeight: '700',
  },
});
