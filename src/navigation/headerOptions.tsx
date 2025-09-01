import React from 'react';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import AppHeader from './AppHeader';

export function appHeaderOptions(params: {
  title: string;
  mode: 'drawer' | 'back';
  right?: React.ReactNode;
  onBack?: () => void;
  background?: string;
  tint?: string;
}): NativeStackNavigationOptions {
  return {
    header: () => <AppHeader {...params} />,
    headerShadowVisible: false,
  };
}
