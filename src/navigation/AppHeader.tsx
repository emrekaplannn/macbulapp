import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { DrawerToggleButton } from '@react-navigation/drawer';
import { HeaderBackButton } from '@react-navigation/elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

type Props = {
  title: string;
  mode: 'drawer' | 'back';          // drawer = hamburger, back = arrow
  right?: React.ReactNode;          // e.g., wallet balance
  onBack?: () => void;
  tint?: string;
  background?: string;
};

const ICON_SIZE = 28; // central place to tune size

function HamburgerButton({ color = '#fff', size = ICON_SIZE }: { color?: string; size?: number }) {
  const navigation = useNavigation();
  return (
    <Pressable
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      hitSlop={12}
      style={{ padding: 4 }} // keeps a ~44x44 touch target
      accessibilityRole="button"
      accessibilityLabel="Menü"
    >
      <Icon name="menu" size={size} color={color} />
    </Pressable>
  );
}

export default function AppHeader({
  title,
  mode,
  right,
  onBack,
  tint = '#fff',
  background = '#0097a7',           // colors.teal
}: Props) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: background }}>
      <View style={{ height: 56, justifyContent: 'center' }}>
        {/* Left */}
        <View style={{ position: 'absolute', left: 8, top: 0, bottom: 0, justifyContent: 'center' }}>
          {mode === 'drawer' ? (
            <HamburgerButton color={tint} size={ICON_SIZE} />
          ) : (
            <HeaderBackButton tintColor={tint} onPress={onBack} />
          )}
        </View>

        {/* Right area (e.g., balance) */}
        <View style={{ position: 'absolute', right: 8, top: 0, bottom: 0, justifyContent: 'center' }}>
          {right}
        </View>

        {/* Centered title */}
        <View style={{ alignItems: 'center', pointerEvents: 'none' }}>
          <Text numberOfLines={1} style={{ color: tint, fontWeight: '800', fontSize: 24, letterSpacing: 0.8 }}>
            {title}
          </Text>
        </View>

        
      </View>
    </SafeAreaView>
  );
}
