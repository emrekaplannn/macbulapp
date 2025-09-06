import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { useProfileStore } from '../state/profileStore';
// If you exported RootStackParamList from AppNavigator (see step 2)
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const POSITIONS = ['Kaleci', 'Defans', 'Orta Saha', 'Forvet', 'Diğer'];

export default function RegisterScreen({ navigation }: Props) {
  const teal = colors?.teal ?? '#0097A7';
  const setProfile = useProfileStore((s) => s.setProfile);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [consent, setConsent] = useState(false);

  const [posModal, setPosModal] = useState(false);

  const isValid = useMemo(() => {
    return (
      name.trim().length > 1 &&
      email.trim().length > 3 &&
      phone.trim().length > 5 &&
      !!position &&
      password.length >= 4 &&
      confirm === password &&
      consent
    );
  }, [name, email, phone, position, password, confirm, consent]);

  const onSubmit = () => {
    // Mock: save to profile store then go to App shell
    setProfile({
      fullName: name.trim(),
      position: position ?? null,
      avatarUrl: null,
    });
    navigation.replace('App');
  };

  const onKvkk = () => Alert.alert('KVKK', 'KVKK metni burada gösterilecek.');
  const onPrivacy = () => Alert.alert('Gizlilik Politikası', 'Gizlilik politikası burada gösterilecek.');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: teal }]} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: undefined })}>
        <View style={styles.container}>
          <Text style={styles.brand}>MaçBul</Text>

          {/* Ad Soyad */}
          <InputRow
            icon="user"
            placeholder="Ad Soyad"
            value={name}
            onChangeText={setName}
          />

          {/* E-posta */}
          <InputRow
            icon="mail"
            placeholder="E-posta"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Telefon */}
          <InputRow
            icon="phone"
            placeholder="Telefon numarası"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {/* Pozisyon (select) */}
          <Pressable style={styles.inputWrap} onPress={() => setPosModal(true)}>
            <Feather name="briefcase" size={18} color="rgba(255,255,255,0.9)" />
            <Text style={[styles.inputText, { opacity: position ? 1 : 0.8 }]}>
              {position || 'Pozisyon'}
            </Text>
            <Feather name="chevron-down" size={18} color="rgba(255,255,255,0.9)" />
          </Pressable>

          {/* Şifre */}
          <InputRow
            icon="lock"
            placeholder="Şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Şifreyi Onayla */}
          <InputRow
            icon="check-square"
            placeholder="Şifreyi Onayla"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />

          {/* KVKK / Gizlilik */}
          <Pressable style={styles.consentRow} onPress={() => setConsent((v) => !v)}>
            <Feather name={consent ? 'check-square' : 'square'} size={18} color="#fff" />
            <Text style={styles.legal}>
              {''}Devam ederek{' '}
              <Text style={styles.legalLink} onPress={onKvkk}>KVKK metnini</Text> ve{' '}
              <Text style={styles.legalLink} onPress={onPrivacy}>Gizlilik Politikası</Text>
              ’nı kabul etmiş olursun.
            </Text>
          </Pressable>


          {/* Kayıt Ol */}
          <Pressable style={[styles.primaryBtn, !isValid && { opacity: 0.5 }]} onPress={onSubmit} disabled={!isValid}>
            <Text style={styles.primaryBtnText}>Kayıt Ol</Text>
          </Pressable>

          

          {/* Giriş Yap link */}
          <Pressable onPress={() => navigation.replace('Login')} style={{ marginTop: 'auto', marginBottom: 'auto' }}>
            <Text style={styles.loginLink2}>Zaten bir hesabınız var mı?</Text>
            <Text style={styles.loginLink}>Giriş Yap</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Position modal */}
      <Modal visible={posModal} transparent animationType="fade" onRequestClose={() => setPosModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPosModal(false)}>
          <View style={styles.modalSheet}>
            {POSITIONS.map((p) => (
              <Pressable
                key={p}
                style={styles.modalItem}
                onPress={() => {
                  setPosition(p);
                  setPosModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{p}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function InputRow(props: React.ComponentProps<typeof TextInput> & { icon: string }) {
  const { icon, style, ...rest } = props;
  return (
    <View style={styles.inputWrap}>
      <Feather name={icon as any} size={18} color="rgba(255,255,255,0.9)" />
      <TextInput
        placeholderTextColor="rgba(255,255,255,0.8)"
        style={[styles.input, style]}
        selectionColor="#fff"
        {...rest}
      />
    </View>
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
    marginTop: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  inputText: {
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
    marginTop: 18,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  consentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  legal: { color: 'rgba(255,255,255,0.9)', flex: 1, marginLeft: 8 },
  legalLink: { textDecorationLine: 'underline', fontWeight: '800', color: '#fff' },
  loginLink: { textAlign: 'center', color: '#003d44', fontSize: 18, fontWeight: '900' },
  loginLink2: {  textAlign: 'center', color: 'rgba(255,255,255,0.9)', fontSize: 13 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderRadius: 14,
    width: '100%',
    paddingVertical: 8,
  },
  modalItem: { paddingVertical: 12, paddingHorizontal: 16 },
  modalItemText: { fontSize: 16, fontWeight: '700', color: '#111' },
});
