import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';

import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import MainTabs from './MainTabs';
import ActivityDetailScreen from '../screens/detail/ActivityDetailScreen';
import ChallengeDetailScreen from '../screens/detail/ChallengeDetailScreen';
import ActivityScreen from '../screens/main/ActivityScreen';
import MarketplaceScreen from '../screens/detail/MarketplaceScreen';
import RewardDetailScreen from '../screens/detail/RewardDetailScreen';
import ReferralScreen from '../screens/detail/ReferralScreen';
import NotificationsScreen from '../screens/detail/NotificationsScreen';
import BadgesScreen from '../screens/detail/BadgesScreen';
import TransactionsScreen from '../screens/detail/TransactionsScreen';
import TransactionDetailScreen from '../screens/detail/TransactionDetailScreen';
import TokenRulesScreen from '../screens/detail/TokenRulesScreen';
import EditProfileScreen from '../screens/detail/EditProfileScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { status } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  // Keep the splash up until its animation finishes and the saved session has been checked
  if (!splashDone || status === 'loading') {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.bg },
      }}>
      {status === 'signedIn' ? (
        <Stack.Group>
          <Stack.Screen name="Main" component={MainTabs} options={{ animation: 'fade' }} />
          <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
          <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} />
          <Stack.Screen name="Activity" component={ActivityScreen} />
          <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
          <Stack.Screen name="RewardDetail" component={RewardDetailScreen} options={{ animation: 'fade_from_bottom' }} />
          <Stack.Screen name="Referral" component={ReferralScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Badges" component={BadgesScreen} />
          <Stack.Screen name="Transactions" component={TransactionsScreen} />
          <Stack.Screen
            name="TransactionDetail"
            component={TransactionDetailScreen}
            options={{ presentation: 'transparentModal', animation: 'fade' }}
          />
          <Stack.Screen name="TokenRules" component={TokenRulesScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        </Stack.Group>
      ) : (
        <Stack.Group>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'fade_from_bottom' }} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
