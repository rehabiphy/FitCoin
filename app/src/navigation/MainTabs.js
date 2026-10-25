import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TabBar from '../components/TabBar';
import HomeScreen from '../screens/main/HomeScreen';
import WalletScreen from '../screens/main/WalletScreen';
import ChallengesScreen from '../screens/main/ChallengesScreen';
import LeaderboardScreen from '../screens/detail/LeaderboardScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const renderTabBar = props => <TabBar {...props} />;

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        animation: 'shift',
      }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Challenges" component={ChallengesScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
