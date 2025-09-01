// AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { colors } from '../theme/colors';

import MatchesListScreen from '../screens/MatchesListScreen';
import MatchDetailScreen from '../screens/MatchDetailScreen';
import WalletScreen from '../screens/WalletScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SupportScreen from '../screens/SupportScreen';

import { appHeaderOptions } from './headerOptions';
import ProfileWalletRight from './ProfileWalletRight';

/** ---------- Home Stack ---------- */
export type HomeStackParamList = { MatchesList: undefined; MatchDetail: { id: string } };
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="MatchesList"
        component={MatchesListScreen}
        options={appHeaderOptions({
          title: 'Maçlar',
          mode: 'drawer',
          right: <ProfileWalletRight />,
        })}
      />
      <HomeStack.Screen
        name="MatchDetail"
        component={MatchDetailScreen}
        options={({ navigation }) =>
          appHeaderOptions({
            title: 'Maç Detayı',
            mode: 'back',
            right: <ProfileWalletRight />,
            onBack: navigation.goBack,
          })
        }
      />
    </HomeStack.Navigator>
  );
}

/** ---------- Wallet Stack ---------- */
export type WalletStackParamList = { Wallet: undefined };
const WalletStack = createNativeStackNavigator<WalletStackParamList>();
function WalletStackNavigator() {
  return (
    <WalletStack.Navigator>
      <WalletStack.Screen
        name="Wallet"
        component={WalletScreen}
        options={appHeaderOptions({
          title: 'Cüzdan',
          mode: 'drawer',
        })}
      />
    </WalletStack.Navigator>
  );
}

/** ---------- Profile Stack ---------- */
export type ProfileStackParamList = { Profile: undefined; Support: undefined };
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={({ route }) =>
          appHeaderOptions({
            title: 'Profil',
            mode: 'drawer',
            // if you want the balance here:
            right: <ProfileWalletRight />,
          })
        }
      />
      <ProfileStack.Screen
        name="Support"
        component={SupportScreen}
        options={({ navigation }) =>
          appHeaderOptions({
            title: 'Destek & Geri Bildirim',
            mode: 'back',
            onBack: navigation.goBack,
          })
        }
      />
    </ProfileStack.Navigator>
  );
}

/** ---------- Drawer (wrap stacks only) ---------- */
export type AppDrawerParamList = {
  HomeStack: undefined;
  WalletStack: undefined;
  ProfileStack: undefined;
};
const Drawer = createDrawerNavigator<AppDrawerParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        screenOptions={{
          headerShown: false, // always false; our stacks provide the header
          drawerStyle: { backgroundColor: colors.teal, width: 260 },
          drawerActiveTintColor: '#fff',
          drawerInactiveTintColor: '#fff',
          drawerLabelStyle: { fontWeight: '700' },
        }}
      >
        <Drawer.Screen name="HomeStack" component={HomeStackNavigator} options={{ title: 'Maçlar' }} />
        <Drawer.Screen name="WalletStack" component={WalletStackNavigator} options={{ title: 'Cüzdan' }} />
        <Drawer.Screen name="ProfileStack" component={ProfileStackNavigator} options={{ title: 'Profil' }} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
