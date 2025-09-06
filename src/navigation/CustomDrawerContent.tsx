// src/navigation/CustomDrawerContent.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '../state/profileStore';
import { colors } from '../theme/colors';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { fullName, position, avatarUrl } = useProfileStore();

  const avatar =
    avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'Guest')}&background=E7EAEE&color=111`;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#0097A7', borderRadius: 16 }}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scroll}>
        {/* Profile block */}
        <View style={styles.header}>
            <View>
                <Image source={{ uri: avatar }} style={styles.avatar} />
            </View>
          
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.name} numberOfLines={1}>{fullName || 'Guest User'}</Text>
            <Text style={styles.role} numberOfLines={1}>{position || '—'}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.itemsWrap}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 4 },
  header: {
    //flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E7EAEE' },
  name: { fontSize: 22, fontWeight: '800', color: '#fff' },
  role: { fontSize: 14, fontWeight: '600', color: '#ccc', marginTop: 2, textAlign: 'center' },
  itemsWrap: { paddingRight: 5, marginTop: 26 },
});
