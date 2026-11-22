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
import { MARKETPLACE_ENABLED } from '../config';
import ReferralScreen from '../screens/detail/ReferralScreen';
import NotificationsScreen from '../screens/detail/NotificationsScreen';
import NotificationSettingsScreen from '../screens/detail/NotificationSettingsScreen';
import BadgesScreen from '../screens/detail/BadgesScreen';
import TransactionsScreen from '../screens/detail/TransactionsScreen';
import TransactionDetailScreen from '../screens/detail/TransactionDetailScreen';
import TokenRulesScreen from '../screens/detail/TokenRulesScreen';
import EditProfileScreen from '../screens/detail/EditProfileScreen';
import PremiumScreen from '../screens/detail/PremiumScreen';
import ReferralPromptScreen from '../screens/auth/ReferralPromptScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { status, askReferral } = useAuth();
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
          {/* First screen after a Google sign-up: "Did a friend invite you?" (removed once answered) */}
          {askReferral ? <Stack.Screen name="ReferralPrompt" component={ReferralPromptScreen} options={{ animation: 'fade' }} /> : null}
          <Stack.Screen name="Main" component={MainTabs} options={{ animation: 'fade' }} />
          <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
          <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} />
          <Stack.Screen name="Activity" component={ActivityScreen} />
          {MARKETPLACE_ENABLED ? (
            <>
              <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
              <Stack.Screen name="RewardDetail" component={RewardDetailScreen} options={{ animation: 'fade_from_bottom' }} />
            </>
          ) : null}
          <Stack.Screen name="Referral" component={ReferralScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
          <Stack.Screen name="Badges" component={BadgesScreen} />
          <Stack.Screen name="Transactions" component={TransactionsScreen} />
          <Stack.Screen
            name="TransactionDetail"
            component={TransactionDetailScreen}
            options={{ presentation: 'transparentModal', animation: 'fade' }}
          />
          <Stack.Screen name="TokenRules" component={TokenRulesScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Premium" component={PremiumScreen} options={{ animation: 'fade_from_bottom' }} />
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
