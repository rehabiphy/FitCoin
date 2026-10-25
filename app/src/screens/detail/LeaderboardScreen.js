import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import Avatar from '../../components/Avatar';
import Icon from '../../components/Icon';
import { GradientFill } from '../../components/GradientFill';
import { formatNumber } from '../../components/AnimatedNumber';
import { TAB_BAR_SPACE } from '../../components/TabBar';
import { leaderboard, user } from '../../data/mock';
import { colors, gradients, type } from '../../theme';

const PERIODS = ['Weekly', 'Monthly', 'All time'];

function Podium({ person, place, height, delay }) {
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
        <Avatar initials={person.avatar} size={place === 1 ? 70 : 56} color={person.color} />
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

export default function LeaderboardScreen() {
  const [period, setPeriod] = useState('Weekly');
  const insets = useSafeAreaInsets();
  const [first, second, third] = leaderboard;
  const rest = leaderboard.slice(3);

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
          <Text style={styles.meRank}>#{user.rank}</Text>
          <Avatar initials="PP" size={40} ring={false} color="#ffffff" />
          <View style={styles.flex}>
            <Text style={styles.meName}>You</Text>
            <Text style={styles.meSub}>312 pts to #127</Text>
          </View>
          <Text style={styles.mePts}>4,280</Text>
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

      <Card padded={false} style={styles.list}>
        {rest.map((p, i) => (
          <Animated.View key={p.id + period} entering={FadeInDown.delay(400 + i * 60).duration(400)} style={[styles.row, i > 0 && styles.rowBorder]}>
            <Text style={styles.rank}>{i + 4}</Text>
            <Avatar initials={p.avatar} size={42} color={p.color} />
            <View style={styles.flex}>
              <Text style={type.bodyStrong}>{p.name}</Text>
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
