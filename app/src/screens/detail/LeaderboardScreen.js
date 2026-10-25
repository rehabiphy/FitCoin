import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import Avatar, { initialsOf } from '../../components/Avatar';
import Icon from '../../components/Icon';
import { GradientFill } from '../../components/GradientFill';
import { formatNumber } from '../../components/AnimatedNumber';
import { TAB_BAR_SPACE } from '../../components/TabBar';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';
import { leaderboardApi } from '../../api/engagementApi';
import { avatarColor } from '../../utils/format';
import { colors, gradients, type } from '../../theme';

const PERIODS = ['Weekly', 'Monthly', 'All time'];

function Podium({ person, place, height, delay }) {
  if (!person) {
    // Empty spot until enough people have earned FIT this period
    return <View style={styles.podiumCol} />;
  }
  return <PodiumColumn person={person} place={place} height={height} delay={delay} />;
}

function PodiumColumn({ person, place, height, delay }) {
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = withDelay(delay, withTiming(height, { duration: 700, easing: Easing.out(Easing.back(1.4)) }));
  }, [height, delay, h]);
  const barStyle = useAnimatedStyle(() => ({ height: h.value }));
  const medal = place === 1 ? gradients.gold : place === 2 ? ['#E3E9F6', '#8D99B3'] : ['#FFB37A', '#B8612A'];

  return (
    <View style={styles.podiumCol}>
      <Animated.View entering={FadeInUp.delay(delay + 300).springify()} style={styles.podiumTop}>
        {place === 1 ? <Icon name="Crown" size={24} color={colors.gold} fill={colors.gold} /> : null}
        <Avatar initials={initialsOf(person.name)} size={place === 1 ? 70 : 56} color={avatarColor(person.userId)} />
        <Text style={styles.podiumName} numberOfLines={1}>
          {person.name.split(' ')[0]}
        </Text>
        <Text style={styles.podiumPts}>{formatNumber(person.points)}</Text>
      </Animated.View>
      <Animated.View style={[styles.podiumBar, barStyle]}>
        <GradientFill colors={[medal[0] + '66', 'rgba(255,255,255,0.02)']} direction="vertical" />
        <Text style={[styles.place, { color: medal[0] }]}>{place}</Text>
      </Animated.View>
    </View>
  );
}

const PERIOD_KEYS = { Weekly: 'weekly', Monthly: 'monthly', 'All time': 'all' };

export default function LeaderboardScreen() {
  const [period, setPeriod] = useState('Weekly');
  const insets = useSafeAreaInsets();
  const { user: account } = useAuth();
  const { data, loading } = useApi(() => leaderboardApi.get(PERIOD_KEYS[period]), [period]);
  const entries = data?.entries || [];
  const [first, second, third] = entries;
  const rest = entries.slice(3);
  const me = data?.me;
  let meSub = 'Earn FIT to join the board';
  if (me?.rank) {
    meSub = me.rank === 1 ? 'You’re #1 — stay ahead!' : `${formatNumber(me.pointsToNext)} pts to #${me.rank - 1}`;
  }

  return (
    <Screen
      scroll
      header={<Header title="Leaderboard" showBack={false} />}
      tint={colors.gold}
      contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_SPACE + 80 }]}
      footer={
        <Animated.View
          entering={FadeInUp.delay(600).springify()}
          style={[styles.me, { bottom: Math.max(insets.bottom, 12) + 68 + 12 }]}>
          <GradientFill colors={gradients.primary} direction="horizontal" />
          <Text style={styles.meRank}>{me?.rank ? `#${me.rank}` : '—'}</Text>
          <Avatar initials={initialsOf(account?.name)} size={40} ring={false} color="#ffffff" />
          <View style={styles.flex}>
            <Text style={styles.meName}>You</Text>
            <Text style={styles.meSub}>{meSub}</Text>
          </View>
          <Text style={styles.mePts}>{formatNumber(me?.points || 0)}</Text>
        </Animated.View>
      }>
      <View style={styles.chips}>
        {PERIODS.map(p => (
          <Chip key={p} label={p} active={period === p} onPress={() => setPeriod(p)} style={styles.flex} />
        ))}
      </View>

      <View style={styles.podium} key={period}>
        <Podium person={second} place={2} height={100} delay={150} />
        <Podium person={first} place={1} height={140} delay={0} />
        <Podium person={third} place={3} height={76} delay={300} />
      </View>

      {!loading && entries.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="Trophy" size={36} color={colors.textMuted} />
          <Text style={type.body}>No one has earned FIT this period yet. Be the first!</Text>
        </View>
      ) : null}

      <Card padded={false} style={[styles.list, !rest.length && styles.hidden]}>
        {rest.map((p, i) => (
          <Animated.View key={p.userId + period} entering={FadeInDown.delay(400 + i * 60).duration(400)} style={[styles.row, i > 0 && styles.rowBorder, p.isMe && styles.meRow]}>
            <Text style={styles.rank}>{p.rank}</Text>
            <Avatar initials={initialsOf(p.name)} size={42} color={avatarColor(p.userId)} />
            <View style={styles.flex}>
              <Text style={type.bodyStrong}>{p.isMe ? `${p.name} (you)` : p.name}</Text>
              <View style={styles.streak}>
                <Icon name="Flame" size={12} color={colors.orange} />
                <Text style={type.caption}>{p.streak}-day streak</Text>
              </View>
            </View>
            <Text style={styles.pts}>{formatNumber(p.points)}</Text>
          </Animated.View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 8 },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 10, marginTop: 24, height: 330 },
  podiumCol: { flex: 1, alignItems: 'center' },
  podiumTop: { alignItems: 'center', gap: 4, marginBottom: 10 },
  podiumName: { color: colors.text, fontWeight: '700', marginTop: 6 },
  podiumPts: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
  },
  place: { fontSize: 28, fontWeight: '900' },
  list: { marginTop: 0 },
  hidden: { display: 'none' },
  meRow: { backgroundColor: 'rgba(124,92,255,0.12)' },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 30 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  rank: { width: 22, color: colors.textMuted, fontWeight: '800', textAlign: 'center' },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  pts: { color: colors.text, fontWeight: '800' },
  me: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 12,
  },
  meRank: { color: '#fff', fontWeight: '900', width: 44 },
  meName: { color: '#fff', fontWeight: '800' },
  meSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  mePts: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
