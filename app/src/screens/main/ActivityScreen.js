import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import HabitPicker, { picksLabel } from '../../components/HabitPicker';
import useApi from '../../hooks/useApi';
import { activitiesApi } from '../../api/engagementApi';
import { useSteps } from '../../context/StepsContext';
import { withVisuals } from '../../constants/activities';
import { timeAgo } from '../../utils/format';
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

function HabitsCard({ info, onChange, onPremium }) {
  if (!info) {
    return null;
  }
  if (info.isPremium) {
    return (
      <Card onPress={onPremium} style={styles.plan}>
        <IconBubble icon="Crown" color={colors.gold} size={40} radius={13} />
        <View style={styles.flex}>
          <Text style={type.bodyStrong}>All {info.total} habits active</Text>
          <Text style={type.caption}>Premium members earn from every habit</Text>
        </View>
      </Card>
    );
  }
  return (
    <Card onPress={onChange} style={[styles.plan, !info.chosen && styles.planPrompt]}>
      <IconBubble icon="ListChecks" color={info.chosen ? colors.mint : colors.gold} size={40} radius={13} />
      <View style={styles.flex}>
        <Text style={type.bodyStrong}>{info.chosen ? `${info.active.length} of ${info.total} habits active` : 'Choose your habits'}</Text>
        <Text style={type.caption}>Free plan: pick {picksLabel(info.groups)}</Text>
      </View>
      <View style={styles.changeBtn}>
        <Text style={styles.changeText}>{info.chosen ? 'Change' : 'Choose'}</Text>
      </View>
    </Card>
  );
}

export default function ActivityScreen({ navigation, route }) {
  const { steps, goal, lastSyncAt, syncNow } = useSteps();
  const { data, reload, setData } = useApi(() => activitiesApi.today(), []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const promptedOnce = useRef(false);
  const refresh = useCallback(async () => {
    await syncNow();
    await reload();
  }, [syncNow, reload]);
  const info = data?.habits;
  const all = (data?.activities || [])
    .map(withVisuals)
    .map(a => (a.id === 'walk' ? { ...a, current: Math.max(a.current, steps), goal } : a));
  // Earning habits first; the rest are shown dimmed below
  const activities = all.filter(a => a.active !== false);
  const inactive = all.filter(a => a.active === false);
  const count = activities.length || 1;
  const overall = activities.reduce((s, a) => s + Math.min(a.current / a.goal, 1), 0) / count;
  const done = activities.filter(a => a.current >= a.goal).length;
  const potential = data?.summary.potential ?? 0;
  const earned = data?.summary.earned ?? 0;
  const synced = lastSyncAt || data?.lastStepSyncAt;

  // Opened from a locked habit's screen, or a free member who hasn't picked yet
  const askToPick = route?.params?.pickHabits;
  const openTimer = useRef(null);
  useEffect(() => () => clearTimeout(openTimer.current), []);
  useEffect(() => {
    if (!info || info.isPremium) {
      return;
    }
    const shouldOpen = askToPick || (!info.chosen && !promptedOnce.current);
    if (!shouldOpen) {
      return;
    }
    promptedOnce.current = true;
    if (askToPick) {
      navigation.setParams({ pickHabits: undefined });
    }
    // Let the screen finish sliding in first, so the two animations don't overlap.
    // Only cancelled on leaving the screen (a data reload mustn't cancel it).
    clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => setPickerOpen(true), 450);
  }, [info, askToPick, navigation]);

  const openPremium = () => {
    setPickerOpen(false);
    navigation.navigate('Premium');
  };

  return (
    <Screen
      scroll
      onRefresh={refresh}
      edges={['top', 'bottom']}
      header={<Header title="Today’s activity" />}
      contentContainerStyle={styles.content}
      tint={colors.mint}
      accent={colors.primary}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.head}>
        <Text style={type.h2}>Your habits today</Text>
        <View style={styles.sync}>
          <View style={styles.syncDot} />
          <Text style={styles.syncText}>{synced ? `Synced ${timeAgo(synced)}` : 'Not synced yet'}</Text>
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

      <Animated.View entering={FadeInDown.delay(170).duration(600)}>
        <HabitsCard info={info} onChange={() => setPickerOpen(true)} onPremium={() => navigation.navigate('Premium')} />
      </Animated.View>

      <Text style={[type.h2, styles.listTitle]}>{inactive.length ? 'Earning today' : 'Your habits'}</Text>
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
                  <Text style={[styles.rewardText, complete && { color: colors.mint }]}>
                    {a.earned > 0 ? `${a.earned}/${a.reward}` : `+${a.reward}`}
                  </Text>
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

      {inactive.length ? (
        <>
          <View style={styles.inactiveHead}>
            <Text style={type.h3}>Not active</Text>
            <Text style={type.caption}>Tap to switch · Premium unlocks all</Text>
          </View>
          {inactive.map((a, i) => (
            <Animated.View key={a.id} entering={FadeInDown.delay(300 + i * 60).duration(500)}>
              <Card onPress={() => setPickerOpen(true)} style={[styles.item, styles.itemInactive]}>
                <View style={styles.itemTop}>
                  <IconBubble icon={a.icon} color={a.color} size={44} radius={14} />
                  <View style={styles.flex}>
                    <Text style={type.h3}>{a.name}</Text>
                    <Text style={type.caption}>{a.rate}</Text>
                  </View>
                  <View style={styles.lockChip}>
                    <Icon name="Lock" size={12} color={colors.textSecondary} />
                    <Text style={styles.lockText}>Not active</Text>
                  </View>
                </View>
              </Card>
            </Animated.View>
          ))}
        </>
      ) : null}

      <HabitPicker
        visible={pickerOpen}
        info={info}
        activities={all}
        onClose={() => setPickerOpen(false)}
        onSaved={today => {
          setData(today);
          setPickerOpen(false);
        }}
        onGoPremium={openPremium}
      />
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
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  planPrompt: { borderColor: 'rgba(255,201,77,0.45)' },
  changeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(124,92,255,0.2)' },
  changeText: { color: '#B6A4FF', fontWeight: '800', fontSize: 12 },
  inactiveHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 12 },
  itemInactive: { opacity: 0.6 },
  lockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  lockText: { color: colors.textSecondary, fontWeight: '700', fontSize: 12 },
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
