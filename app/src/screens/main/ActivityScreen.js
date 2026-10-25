import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import ProgressRing from '../../components/ProgressRing';
import ProgressBar from '../../components/ProgressBar';
import IconBubble from '../../components/IconBubble';
import Icon from '../../components/Icon';
import CoinIcon from '../../components/CoinIcon';
import AnimatedNumber, { formatNumber } from '../../components/AnimatedNumber';
import Header from '../../components/Header';
import { activities } from '../../data/mock';
import { colors, gradients, type, TOKEN } from '../../theme';

function Stat({ label, value, color }) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statDot, { backgroundColor: color }]} />
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={type.caption}>{label}</Text>
      </View>
    </View>
  );
}

export default function ActivityScreen({ navigation }) {
  const overall = activities.reduce((s, a) => s + Math.min(a.current / a.goal, 1), 0) / activities.length;
  const done = activities.filter(a => a.current >= a.goal).length;
  const potential = activities.reduce((s, a) => s + a.reward, 0);
  const earned = activities.reduce((s, a) => s + Math.round(a.reward * Math.min(a.current / a.goal, 1)), 0);

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      header={<Header title="Today’s activity" />}
      contentContainerStyle={styles.content}
      tint={colors.mint}
      accent={colors.primary}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.head}>
        <Text style={type.h2}>Your habits today</Text>
        <View style={styles.sync}>
          <View style={styles.syncDot} />
          <Text style={styles.syncText}>Synced 2m ago</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(600)}>
        <Card style={styles.summary}>
          <ProgressRing size={150} stroke={14} progress={overall} gradient={gradients.mint}>
            <AnimatedNumber value={Math.round(overall * 100)} suffix="%" style={styles.ringValue} />
            <Text style={type.caption}>Daily score</Text>
          </ProgressRing>
          <View style={styles.stats}>
            <Stat label="Goals done" value={`${done} / ${activities.length}`} color={colors.mint} />
            <Stat label="Earned today" value={`${earned} ${TOKEN}`} color={colors.gold} />
            <Stat label="Still to earn" value={`${potential - earned} ${TOKEN}`} color={colors.primary} />
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(140).duration(600)}>
        <Card style={styles.verify}>
          <Icon name="ShieldCheck" size={20} color={colors.mint} />
          <Text style={[type.caption, styles.flex]}>
            Activities are verified on our servers using device sensors and connected health apps before rewards are credited.
          </Text>
        </Card>
      </Animated.View>

      <Text style={[type.h2, styles.listTitle]}>Your habits</Text>
      {activities.map((a, i) => {
        const p = Math.min(a.current / a.goal, 1);
        const complete = p >= 1;
        return (
          <Animated.View key={a.id} entering={FadeInDown.delay(200 + i * 70).duration(500)}>
            <Card onPress={() => navigation.navigate('ActivityDetail', { id: a.id })} style={styles.item}>
              <View style={styles.itemTop}>
                <IconBubble icon={a.icon} gradient={a.gradient} size={48} radius={16} />
                <View style={styles.flex}>
                  <Text style={type.h3}>{a.name}</Text>
                  <Text style={type.caption}>
                    {formatNumber(a.current, a.current % 1 ? 1 : 0)} / {formatNumber(a.goal)} {a.unit}
                  </Text>
                </View>
                <View style={[styles.reward, complete && styles.rewardDone]}>
                  {complete ? <Icon name="Check" size={13} color={colors.mint} strokeWidth={3} /> : <CoinIcon size={13} />}
                  <Text style={[styles.rewardText, complete && { color: colors.mint }]}>+{a.reward}</Text>
                </View>
              </View>
              <ProgressBar progress={p} gradient={a.gradient} height={7} delay={250 + i * 70} style={styles.bar} />
              <View style={styles.itemFoot}>
                <Text style={type.caption}>{a.rate}</Text>
                <Text style={type.caption}>via {a.verified}</Text>
              </View>
            </Card>
          </Animated.View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  flex: { flex: 1 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  sync: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52,245,180,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  syncDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mint },
  syncText: { color: colors.mint, fontSize: 12, fontWeight: '700' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  ringValue: { ...type.h1, fontSize: 30 },
  stats: { flex: 1, gap: 14 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statDot: { width: 4, height: 30, borderRadius: 2 },
  statValue: { color: colors.text, fontWeight: '800', fontSize: 15 },
  verify: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, paddingVertical: 12 },
  listTitle: { marginTop: 26, marginBottom: 14 },
  item: { marginBottom: 12 },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,201,77,0.12)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  rewardDone: { backgroundColor: 'rgba(52,245,180,0.12)' },
  rewardText: { color: colors.gold, fontWeight: '800', fontSize: 12 },
  bar: { marginTop: 14 },
  itemFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
});
