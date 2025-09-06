// AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Feather from 'react-native-vector-icons/Feather';

import { colors } from '../theme/colors';

import MatchesListScreen from '../screens/MatchesListScreen';
import MatchDetailScreen from '../screens/MatchDetailScreen';
import WalletScreen from '../screens/WalletScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SupportScreen from '../screens/SupportScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

import CustomDrawerContent from './CustomDrawerContent';
import { appHeaderOptions } from './headerOptions';
import ProfileWalletRight from './ProfileWalletRight';

/** ---------- Home Stack ---------- */
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
        options={() =>
          appHeaderOptions({
            title: 'Profil',
            mode: 'drawer',
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

/** ---------- Drawer (App shell) ---------- */
export type AppDrawerParamList = {
  HomeStack: undefined;
  WalletStack: undefined;
  ProfileStack: undefined;
};
const Drawer = createDrawerNavigator<AppDrawerParamList>();

function AppShell() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: '#0097A7', width: 280 },
        drawerActiveTintColor: 'rgba(0, 0, 0, 1)',
        drawerInactiveTintColor: '#fff',
        drawerLabelStyle: { fontWeight: '700', fontSize: 15 },
        drawerItemStyle: { borderRadius: 12, marginHorizontal: 0, paddingHorizontal: 6 },
        drawerActiveBackgroundColor: '#22B9C9',
      }}
    >
      <Drawer.Screen
        name="HomeStack"
        component={HomeStackNavigator}
        options={{
          title: 'Maçlar',
          drawerIcon: ({ color, size }) => <Feather name="home" size={size ?? 20} color={color} />,
        }}
      />
      <Drawer.Screen
        name="WalletStack"
        component={WalletStackNavigator}
        options={{
          title: 'Cüzdan',
          drawerIcon: ({ color, size }) => <Feather name="credit-card" size={size ?? 20} color={color} />,
        }}
      />
      <Drawer.Screen
        name="ProfileStack"
        component={ProfileStackNavigator}
        options={{
          title: 'Profil',
          drawerIcon: ({ color, size }) => <Feather name="user" size={size ?? 20} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
}

/** ---------- Root (Login/Register -> App) ---------- */
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  App: undefined;
};
const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="Register" component={RegisterScreen} />
        <RootStack.Screen name="App" component={AppShell} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
