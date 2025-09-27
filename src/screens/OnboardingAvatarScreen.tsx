import React, {useState} from 'react';
import {
  View, Text, StyleSheet, Image, Pressable, ActivityIndicator, Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';
import {colors} from '../theme/colors';
import {pickImage} from '../lib/pickImage';
import {uploadMyAvatar, getMyAvatar} from '../api/avatars';
import {useProfileStore} from '../state/profileStore';

export default function OnboardingAvatarScreen() {
  const nav = useNavigation<any>();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const setAvatar = useProfileStore((s) => s.setAvatar);

  const choose = async () => {
    const f = await pickImage();
    if (!f) return;
    setPreviewUri(f.uri);
    try {
      setBusy(true);
      const resp = await uploadMyAvatar(f);                 // BE: eskiyi sil + yenisini yükle
      // 30 günlük signed url yenile
      const fresh = await getMyAvatar();
      setAvatar({ path: fresh.path ?? resp.path, url: fresh.url ?? null });
      //Alert.alert('Tamam', 'Profil fotoğrafın güncellendi.');
    } catch (e: any) {
      console.log('[avatar upload err]', e?.response?.data || e?.message);
      Alert.alert('Hata', 'Fotoğraf yüklenemedi.');
    } finally {
      setBusy(false);
    }
  };

  const goNext = () => nav.replace('App'); // ana ekrana
  const skip   = () => nav.replace('App');

  const avatar = previewUri
    ? {uri: previewUri}
    : {uri: 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff'};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil{'\n'}Fotoğrafı Ekle</Text>

      <View style={styles.avatarWrap}>
        <Image source={avatar} style={styles.avatar} />
        <Pressable style={styles.edit} onPress={choose} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Feather name="edit-2" size={18} color="#fff" />}
        </Pressable>
      </View>

      <Pressable style={styles.primary} onPress={goNext} disabled={busy}>
        <Text style={styles.primaryText}>Devam</Text>
      </Pressable>

      <Pressable onPress={skip} disabled={busy}>
        <Text style={styles.skip}>Bu adımı atla</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.teal, alignItems: 'center', paddingTop: 48},
  title: {color: '#fff', fontSize: 36, fontWeight: '900', textAlign: 'center', lineHeight: 40},
  avatarWrap: {marginTop: 40, width: 200, height: 200},
  avatar: {width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.15)'},
  edit: {
    position: 'absolute', right: 12, bottom: 12,
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#0f3d44',
    alignItems: 'center', justifyContent: 'center',
  },
  primary: {
    marginTop: 40, backgroundColor: '#0f3d44', paddingVertical: 14,
    paddingHorizontal: 32, borderRadius: 12, width: '72%', alignItems: 'center',
  },
  primaryText: {color: '#fff', fontWeight: '800', fontSize: 18},
  skip: {color: '#e5f3f5', marginTop: 16, fontSize: 16},
});
