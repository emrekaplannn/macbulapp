// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

import MatchesListScreen from '../screens/MatchesListScreen';
import MatchDetailScreen from '../screens/MatchDetailScreen';
import WalletScreen from '../screens/WalletScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme/colors';

/**
 * Stack only for the Matches flow (list + detail).
 * Wallet & Profile will live at the Drawer level.
 */
export type HomeStackParamList = {
  MatchesList: undefined;
  MatchDetail: { id: string };
};
const HomeStack = createNativeStackNavigator<HomeStackParamList>();



function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="MatchesList"
        component={MatchesListScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="MatchDetail"
        component={MatchDetailScreen}
        options={{
          title: 'Maç Detayı',
          headerStyle: {
            backgroundColor: colors.teal},
          headerShadowVisible: false,   // RN 0.70+ (unifies both platforms)
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff', fontSize: 23, fontWeight: '800' },
        }}
      />
    </HomeStack.Navigator>
  );
}


export type AppDrawerParamList = {
  Home: undefined;
  Wallet: undefined;
  Profile: undefined;
};
const Drawer = createDrawerNavigator<AppDrawerParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        screenOptions={{
          headerShown: false, // the Home stack hides its own header on list
          drawerStyle: { backgroundColor: colors.teal, width: 260 },
          drawerActiveTintColor: '#fff',
          drawerInactiveTintColor: '#fff',
          drawerLabelStyle: { fontWeight: '700' },
        }}
      >
        <Drawer.Screen name="Home" component={HomeStackNavigator} />
        <Drawer.Screen
          name="Wallet"
          component={WalletScreen}
          options={{
            headerShown: true,
            title: 'Cüzdan',
            headerStyle: { backgroundColor: colors.teal },
            headerTintColor: '#fff',
            headerTitleStyle: { color: '#fff', fontWeight: '800' },
          }}
        />
        <Drawer.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            headerShown: true,
            title: 'Profil',
            headerStyle: { backgroundColor: colors.teal, elevation: 0 },
            headerTintColor: '#fff',
            headerTitleStyle: { color: '#fff', fontWeight: '800' },
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
