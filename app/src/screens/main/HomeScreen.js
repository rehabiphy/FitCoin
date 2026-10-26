import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Avatar, { initialsOf } from '../../components/Avatar';
import { useAuth } from '../../context/AuthContext';
import { IconButton } from '../../components/Header';
import Card from '../../components/Card';
import GradientView from '../../components/GradientFill';
import AnimatedNumber from '../../components/AnimatedNumber';
import CoinIcon from '../../components/CoinIcon';
import ProgressBar from '../../components/ProgressBar';
import ProgressRing from '../../components/ProgressRing';
import PressableScale from '../../components/PressableScale';
import SectionHeader from '../../components/SectionHeader';
import BarChart from '../../components/BarChart';
import Icon from '../../components/Icon';
import IconBubble from '../../components/IconBubble';
import { TAB_BAR_SPACE } from '../../components/TabBar';
import StepsCard from '../../components/StepsCard';
import PremiumCard from '../../components/PremiumCard';
import PremiumPopup from '../../components/PremiumPopup';
import { useSteps } from '../../context/StepsContext';
import { usePremium } from '../../context/PremiumContext';
import useApi from '../../hooks/useApi';
import { activitiesApi, challengesApi, notificationsApi, statsApi } from '../../api/engagementApi';
import { withVisuals } from '../../constants/activities';
import { timeLeft } from '../../utils/format';

const EMPTY_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({ day, value: 0 }));
import { colors, gradients, radius, type, TOKEN } from '../../theme';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) {
    return 'Good morning';
  }
  if (h < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

function Flame() {
  const s = useSharedValue(1);
  useEffect(() => {
    s.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 700, easing: Easing.inOut(Easing.quad) }), withTiming(1, { duration: 700 })),
      -1,
    );
  }, [s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={style}>
      <IconBubble icon="Flame" gradient={gradients.gold} size={48} radius={16} />
    </Animated.View>
  );
}

function BalanceCard({ navigation }) {
  const { wallet } = useSteps();
  return (
    <GradientView colors={gradients.wallet} style={styles.balance}>
      <View style={styles.balanceGlow} />
      <View style={styles.balanceTop}>
        <Text style={styles.balanceLabel}>Total balance</Text>
        <View style={styles.liveChip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>
      <View style={styles.balanceRow}>
        <CoinIcon size={32} />
        <AnimatedNumber value={wallet.balance} decimals={2} style={styles.balanceValue} />
        <Text style={styles.balanceUnit}>{TOKEN}</Text>
      </View>
      <View style={styles.todayRow}>
        <Icon name="TrendingUp" size={14} color={colors.mint} />
        <Text style={styles.todayText}>+{wallet.earnedToday} {TOKEN} today</Text>
      </View>

      <View style={styles.capWrap}>
        <View style={styles.capRow}>
          <Text style={styles.capLabel}>Daily earning cap</Text>
          <Text style={styles.capValue}>
            {wallet.earnedToday} / {wallet.dailyCap}
          </Text>
        </View>
        <ProgressBar progress={wallet.dailyCap ? wallet.earnedToday / wallet.dailyCap : 0} gradient={['#FFFFFF', '#B9F8FF']} height={6} delay={300} />
      </View>

      <View style={styles.balanceActions}>
        <PressableScale style={styles.balanceBtn} onPress={() => navigation.navigate('Referral')}>
          <Icon name="Users" size={18} color={colors.text} />
          <Text style={styles.balanceBtnText}>Invite</Text>
        </PressableScale>
        <PressableScale style={styles.balanceBtn} onPress={() => navigation.navigate('Transactions')}>
          <Icon name="Clock" size={18} color={colors.text} />
          <Text style={styles.balanceBtnText}>History</Text>
        </PressableScale>
      </View>
    </GradientView>
  );
}

function streakHint(stats) {
  if (!stats) {
    return ' ';
  }
  const { streakBonus, activeToday, streak } = stats;
  if (!activeToday) {
    return streak > 0 ? 'Earn FIT from any habit today to keep your streak' : 'Earn FIT from any habit today to start a streak';
  }
  return streakBonus.daysToBonus === streakBonus.every
    ? `Streak bonus earned! Next +${streakBonus.amount} ${TOKEN} in ${streakBonus.every} days`
    : `${streakBonus.daysToBonus} more day${streakBonus.daysToBonus > 1 ? 's' : ''} for a +${streakBonus.amount} ${TOKEN} streak bonus`;
}

function StreakCard({ stats }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const week = stats?.week || days.map(() => ({}));
  const streak = stats?.streak ?? 0;
  return (
    <Card style={styles.streak}>
      <View style={styles.streakTop}>
        <Flame />
        <View style={styles.flex}>
          <Text style={type.h3}>{streak > 0 ? `${streak}-day streak 🔥` : 'Start a streak 🔥'}</Text>
          <Text style={type.caption}>{streakHint(stats)}</Text>
        </View>
      </View>
      <View style={styles.weekRow}>
        {days.map((d, i) => {
          const day = week[i] || {};
          return (
            <Animated.View key={i} entering={FadeInDown.delay(400 + i * 60).springify()} style={styles.dayCol}>
              <View style={[styles.dayDot, day.active && styles.dayDone, day.isToday && !day.active && styles.dayToday]}>
                {day.active ? <Icon name="Check" size={14} color={colors.bg} strokeWidth={3} /> : null}
              </View>
              <Text style={[styles.dayText, day.isToday && { color: colors.text }]}>{d}</Text>
            </Animated.View>
          );
        })}
      </View>
    </Card>
  );
}

function GoalTile({ item, index, onPress }) {
  const progress = item.current / item.goal;
  return (
    <Animated.View entering={FadeInDown.delay(200 + index * 80).duration(500)} style={styles.goalCell}>
      <PressableScale onPress={onPress} style={styles.goal}>
        <ProgressRing size={74} stroke={8} progress={progress} gradient={item.gradient} delay={300 + index * 100}>
          <Icon name={item.icon} size={24} color={item.color} />
        </ProgressRing>
        <Text style={styles.goalName}>{item.name}</Text>
        <Text style={styles.goalValue}>{Math.round(progress * 100)}%</Text>
        <View style={styles.goalReward}>
          <CoinIcon size={12} />
          <Text style={styles.goalRewardText}>+{item.reward}</Text>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const QUICK = [
  { label: 'Ranks', icon: 'Crown', color: colors.primary, route: 'Leaderboard' },
  { label: 'Refer', icon: 'Users', color: colors.mint, route: 'Referral' },
  { label: 'Badges', icon: 'Medal', color: colors.pink, route: 'Badges' },
];

export default function HomeScreen({ navigation }) {
  const { user: account } = useAuth();
  const { steps, goal, wallet, reloadWallet, syncNow } = useSteps();
  const { data: stats, reload: reloadStats } = useApi(() => statsApi.me().then(d => d.stats), []);
  const { data: today, reload: reloadToday } = useApi(() => activitiesApi.today(), []);
  const { data: challengeData, reload: reloadChallenges } = useApi(() => challengesApi.list('joined'), []);
  const { data: unread, reload: reloadUnread } = useApi(() => notificationsApi.unreadCount().then(d => d.unread), []);
  const { shouldShowPopup, dismissPopup, reload: reloadPremium } = usePremium();
  const refresh = useCallback(async () => {
    await syncNow(); // upload the latest steps first so rewards below are current
    await Promise.all([reloadStats(), reloadToday(), reloadChallenges(), reloadUnread(), reloadWallet(), reloadPremium()]);
  }, [syncNow, reloadStats, reloadToday, reloadChallenges, reloadUnread, reloadWallet, reloadPremium]);
  const [popupOpen, setPopupOpen] = useState(false);
  useFocusEffect(
    useCallback(() => {
      reloadWallet();
    }, [reloadWallet]),
  );

  // Upgrade offer once per launch, after Home has settled in
  useEffect(() => {
    if (!shouldShowPopup) {
      return undefined;
    }
    const t = setTimeout(() => {
      if (navigation.isFocused()) {
        setPopupOpen(true);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [shouldShowPopup, navigation]);

  const closePopup = () => {
    setPopupOpen(false);
    dismissPopup();
  };
  const openPremium = () => {
    closePopup();
    navigation.navigate('Premium');
  };

  const joined = (challengeData?.challenges || []).slice(0, 2);
  const firstName = account?.name?.split(' ')[0] || '';
  // Walking uses the live step count; everything else comes from the server
  // Only habits that earn for this member (free members pick theirs on the Activity screen)
  const goals = (today?.activities || [])
    .filter(a => a.active !== false)
    .map(withVisuals)
    .map(a => (a.id === 'walk' ? { ...a, current: Math.max(a.current, steps), goal } : a));
  const weekly = wallet.weekly.length ? wallet.weekly : EMPTY_WEEK;

  return (
    <Screen scroll onRefresh={refresh} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.topBar}>
        <PressableScale onPress={() => navigation.navigate('Profile')}>
          <Avatar initials={initialsOf(account?.name)} size={46} />
        </PressableScale>
        <View style={styles.flex}>
          <Text style={type.caption}>{greeting()},</Text>
          <Text style={type.h2}>{firstName} 👋</Text>
        </View>
        <IconButton icon="Bell" badge={unread > 0} onPress={() => navigation.navigate('Notifications')} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(600)}>
        <BalanceCard navigation={navigation} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(600)}>
        <PremiumCard onPress={() => navigation.navigate('Premium')} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(600)}>
        <StepsCard onPress={() => navigation.navigate('ActivityDetail', { id: 'walk' })} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(600)}>
        <StreakCard stats={stats} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(220).duration(600)}>
        <View style={styles.quickRow}>
          {QUICK.map(q => (
            <PressableScale key={q.label} style={styles.quick} onPress={() => navigation.navigate(q.route)}>
              <IconBubble icon={q.icon} color={q.color} size={48} radius={16} />
              <Text style={styles.quickText}>{q.label}</Text>
            </PressableScale>
          ))}
        </View>
      </Animated.View>

      <SectionHeader title="Today’s goals" action="See all" onAction={() => navigation.navigate('Activity')} style={styles.section} />
      <View style={styles.goalGrid}>
        {goals.map((a, i) => (
          <GoalTile key={a.id} item={a} index={i} onPress={() => navigation.navigate('ActivityDetail', { id: a.id })} />
        ))}
      </View>

      <SectionHeader title="This week" style={styles.section} />
      <Animated.View entering={FadeInDown.delay(300).duration(600)}>
        <Card>
          <View style={styles.chartHead}>
            <View>
              <Text style={type.caption}>Earned this week</Text>
              <View style={styles.chartValueRow}>
                <AnimatedNumber value={wallet.earnedThisWeek} decimals={wallet.earnedThisWeek % 1 ? 1 : 0} style={type.h1} />
                <Text style={styles.chartUnit}>{TOKEN}</Text>
              </View>
            </View>
          </View>
          <BarChart data={weekly} />
        </Card>
      </Animated.View>

      <SectionHeader title="Active challenges" action="Explore" onAction={() => navigation.navigate('Challenges')} style={styles.section} />
      {challengeData && joined.length === 0 ? (
        <Card onPress={() => navigation.navigate('Challenges')} style={styles.challenge}>
          <IconBubble icon="Trophy" gradient={gradients.primary} size={50} radius={16} />
          <View style={styles.flex}>
            <Text style={type.bodyStrong}>Join a challenge</Text>
            <Text style={type.caption}>Win bonus {TOKEN} by finishing daily and weekly challenges.</Text>
          </View>
          <Icon name="ChevronRight" size={18} color={colors.textMuted} />
        </Card>
      ) : null}
      {joined.map((c, i) => (
        <Animated.View key={c.id} entering={FadeInDown.delay(350 + i * 80).duration(500)}>
          <Card onPress={() => navigation.navigate('ChallengeDetail', { id: c.id })} style={styles.challenge}>
            <IconBubble icon={c.icon} gradient={c.gradient} size={50} radius={16} />
            <View style={styles.flex}>
              <View style={styles.challengeTop}>
                <Text style={type.bodyStrong}>{c.title}</Text>
                <Text style={styles.endsIn}>{timeLeft(c.endsAt)}</Text>
              </View>
              <ProgressBar progress={c.progress} gradient={c.gradient} height={6} style={styles.challengeBar} delay={500} />
              <View style={styles.challengeTop}>
                <Text style={type.caption}>{c.progressLabel}</Text>
                <View style={styles.rewardInline}>
                  <CoinIcon size={13} />
                  <Text style={styles.rewardInlineText}>{c.reward}</Text>
                </View>
              </View>
            </View>
          </Card>
        </Animated.View>
      ))}

      <PremiumPopup visible={popupOpen} onUpgrade={openPremium} onClose={closePopup} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: TAB_BAR_SPACE },
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  section: { marginTop: 28 },

  balance: { borderRadius: radius.xl, padding: 20, marginTop: 8 },
  balanceGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.10)',
    top: -90,
    right: -60,
  },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mint },
  liveText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  balanceValue: { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: -0.8 },
  balanceUnit: { color: 'rgba(255,255,255,0.75)', fontSize: 16, fontWeight: '700', marginTop: 10 },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(6,9,18,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 10,
  },
  todayText: { color: colors.mint, fontSize: 12, fontWeight: '700' },
  capWrap: { marginTop: 18, gap: 8 },
  capRow: { flexDirection: 'row', justifyContent: 'space-between' },
  capLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  capValue: { color: '#fff', fontSize: 12, fontWeight: '700' },
  balanceActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  balanceBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(6,9,18,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  streak: { marginTop: 16 },
  streakTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  dayCol: { alignItems: 'center', gap: 6 },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDone: { backgroundColor: colors.gold },
  dayToday: { borderWidth: 2, borderColor: colors.gold, borderStyle: 'dashed' },
  dayText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },

  quickRow: { flexDirection: 'row', marginTop: 20 },
  quick: { alignItems: 'center', gap: 8, flex: 1 },
  quickText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },

  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  goalCell: { width: '48%', marginBottom: 14 },
  goal: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(22,31,51,0.72)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalName: { color: colors.text, fontWeight: '700', marginTop: 10 },
  goalValue: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  goalReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: 'rgba(255,201,77,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  goalRewardText: { color: colors.gold, fontSize: 11, fontWeight: '800' },

  chartHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  chartValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 2 },
  chartUnit: { color: colors.textMuted, fontWeight: '700', marginBottom: 4 },
  challenge: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 12 },
  challengeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  challengeBar: { marginVertical: 8 },
  endsIn: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  rewardInline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rewardInlineText: { color: colors.gold, fontSize: 12, fontWeight: '800' },
});
