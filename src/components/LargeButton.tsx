// src/components/LargeButton.tsx
import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;                // 👈 eklendi
};

export default function LargeButton({ title, onPress, style, disabled = false }: Props) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}  // 👈 disabled ise tıklama kapalı
      disabled={disabled}
      style={[styles.btn, style, disabled && styles.btnDisabled]} // 👈 disabled stili eklenir
      accessibilityState={{ disabled }}
    >
      <Text style={styles.txt}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.teal,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,                      // 👈 devre dışı görünümü
  },
  txt: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
