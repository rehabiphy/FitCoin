import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { StepsProvider } from './src/context/StepsContext';
import { PremiumProvider } from './src/context/PremiumContext';
import PushHandler from './src/components/PushHandler';
import InviteHandler from './src/components/InviteHandler';
import { navigationRef } from './src/navigation/navigationRef';
import { colors } from './src/theme';

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    notification: colors.pink,
  },
};

export default function App() {
  return (
    <SafeAreaProvider style={{ backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <AuthProvider>
        <StepsProvider>
          <PremiumProvider>
            <NavigationContainer ref={navigationRef} theme={navTheme}>
              <RootNavigator />
            </NavigationContainer>
            <PushHandler />
            <InviteHandler />
          </PremiumProvider>
        </StepsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
