import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

type Props = { title: string; onPress: () => void; style?: ViewStyle };

export default function LargeButton({ title, onPress, style }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, style]}>
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
  txt: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
