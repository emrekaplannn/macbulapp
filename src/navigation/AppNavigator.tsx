import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MatchesListScreen from '../screens/MatchesListScreen';
import MatchDetailScreen from '../screens/MatchDetailScreen';
import WalletScreen from '../screens/WalletScreen';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  MatchesList: undefined;
  MatchDetail: { id: string };
  Wallet: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="MatchesList"
          component={MatchesListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MatchDetail"
          component={MatchDetailScreen}
          options={{
            title: 'Maç Detayı',
            headerStyle: { backgroundColor: colors.teal },
            headerTintColor: '#fff',
            headerTitleStyle: { color: '#fff', fontSize: 23, fontWeight: '800' },
          }}
        />
        <Stack.Screen
          name="Wallet"
          component={WalletScreen}
          options={{ title: 'Cüzdan',
            headerStyle: { backgroundColor: colors.teal },
            headerTintColor: '#fff',
            headerTitleStyle: { color: '#fff', fontWeight: '800' }, }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
