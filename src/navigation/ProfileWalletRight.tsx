// src/navigation/ProfileWalletRight.tsx
import React from 'react';
import { Pressable, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useWalletStore } from '../state/walletStore';
import { formatTL } from '../utils/format';

export default function ProfileWalletRight() {
  const navigation = useNavigation();
  const balance = useWalletStore((s) => s.balance);

  return (
    <Pressable
      onPress={() => navigation.navigate('WalletStack' as never)}
      hitSlop={10}
      style={{ paddingHorizontal: 4 }}
    >
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>
        {balance === null ? '...' : formatTL(balance)}
      </Text>
    </Pressable>
  );
}
