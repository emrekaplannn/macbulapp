import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { colors } from '../theme/colors';

export default function SupportScreen() {
  const openFAQ = () => {
    // later: navigate to a WebView or dedicated FAQ screen
    Alert.alert('SSS', 'SSS ekranı yakında eklenecek.');
  };

  const openFeedback = () => {
    // later: navigate to a form; for now mock
    Alert.alert('Geri Bildirim', 'Geri bildirim formu yakında eklenecek.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Destek &{'\n'}Geri Bildirim</Text>

      <Pressable style={[styles.btn, styles.btnLight]} onPress={openFAQ}>
        <Text style={[styles.btnText, styles.btnTextDark]}>SSS</Text>
      </Pressable>

      <Pressable style={[styles.btn, styles.btnLight]} onPress={openFeedback}>
        <Text style={[styles.btnText, styles.btnTextDark]}>Geri Bildirim Gönder</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.teal },
  content: { padding: 20, alignItems: 'center' },
  title: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 32,
    lineHeight: 40,
  },
  btn: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnLight: { backgroundColor: '#E7F1F4' },
  btnText: { fontSize: 18, fontWeight: '800' },
  btnTextDark: { color: '#0F1F2A' },
});
