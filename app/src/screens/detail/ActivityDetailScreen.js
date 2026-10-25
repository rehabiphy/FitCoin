import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  ZoomIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Card from '../../components/Card';
import ProgressRing from '../../components/ProgressRing';
import GradientButton from '../../components/GradientButton';
import Icon from '../../components/Icon';
import CoinIcon from '../../components/CoinIcon';
import { formatNumber } from '../../components/AnimatedNumber';
import { activities } from '../../data/mock';
import { colors, type, TOKEN } from '../../theme';

const HOURS = [0.1, 0.25, 0.6, 0.35, 0.8, 0.45, 0.9, 0.3, 0.55, 0.7, 0.2, 0.4];

/** Pulsing orb shown while a live session runs (breathing gets slow 4s in/out). */
function SessionOrb({ active, color, slow }) {
  const s = useSharedValue(1);
  useEffect(() => {
    if (active) {
      const d = slow ? 4000 : 900;
      s.value = withRepeat(
        withSequence(withTiming(1.25, { duration: d, easing: Easing.inOut(Easing.sin) }), withTiming(1, { duration: d, easing: Easing.inOut(Easing.sin) })),
        -1,
      );
    } else {
      cancelAnimation(s);
      s.value = withSpring(1);
    }
  }, [active, slow, s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }], opacity: 0.25 + (s.value - 1) * 1.2 }));
  return <Animated.View style={[styles.orb, { backgroundColor: color }, style]} />;
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ActivityDetailScreen({ route }) {
  const item = activities.find(a => a.id === route.params?.id) || activities[0];
  const [current, setCurrent] = useState(item.current);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timer = useRef(null);
  const isCounter = item.id === 'water';
  const isSession = ['read', 'breathe', 'walk', 'cycle'].includes(item.id);

  useEffect(() => {
    if (running) {
      timer.current = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(timer.current);
  }, [running]);

  const progress = Math.min(current / item.goal, 1);
  const remaining = Math.max(item.goal - current, 0);
  const complete = progress >= 1;
  const decimals = item.current % 1 ? 1 : 0;

  const stats = [
    { label: 'Goal', value: `${formatNumber(item.goal)} ${item.unit}` },
    { label: 'Remaining', value: `${formatNumber(remaining, decimals)}` },
    { label: 'Reward', value: `${item.reward} ${TOKEN}` },
  ];

  return (
    <Screen scroll edges={['top', 'bottom']} header={<Header title={item.name} />} tint={item.color} accent={item.gradient[1]} contentContainerStyle={styles.content}>
      <Animated.View entering={ZoomIn.duration(500)} style={styles.ringWrap}>
        <SessionOrb active={running} color={item.color} slow={item.id === 'breathe'} />
        <ProgressRing size={230} stroke={18} progress={progress} gradient={item.gradient}>
          <Icon name={item.icon} size={30} color={item.color} />
          <Text style={styles.big}>{formatNumber(current, decimals)}</Text>
          <Text style={type.caption}>
            of {formatNumber(item.goal)} {item.unit}
          </Text>
          {running ? <Text style={[styles.timer, { color: item.color }]}>{formatTime(seconds)}</Text> : null}
        </ProgressRing>
      </Animated.View>

      {complete ? (
        <Animated.View entering={FadeInDown.springify()} style={styles.doneBanner}>
          <Icon name="CircleCheck" size={18} color={colors.mint} />
          <Text style={styles.doneText}>
            Goal complete! +{item.reward} {TOKEN} pending verification
          </Text>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.stats}>
        {stats.map(s => (
          <Card key={s.label} style={styles.stat}>
            <Text style={type.caption}>{s.label}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
          </Card>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180).duration(500)} style={styles.actions}>
        {isCounter ? (
          <GradientButton
            title="Log a glass"
            icon="Plus"
            colors={item.gradient}
            onPress={() => setCurrent(c => Math.min(c + 1, item.goal + 4))}
          />
        ) : null}
        {isSession ? (
          <GradientButton
            title={running ? 'Pause session' : 'Start session'}
            icon={running ? 'Pause' : 'Play'}
            colors={item.gradient}
            onPress={() => setRunning(r => !r)}
          />
        ) : null}
        {!isCounter && !isSession ? (
          <GradientButton title="Sync from Health Connect" icon="RefreshCw" colors={item.gradient} onPress={() => {}} />
        ) : null}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).duration(500)}>
        <Card style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={type.h3}>Today’s timeline</Text>
            <Text style={type.caption}>6 AM – 6 PM</Text>
          </View>
          <View style={styles.timeline}>
            {HOURS.map((h, i) => (
              <Animated.View
                key={i}
                entering={FadeInDown.delay(300 + i * 40).springify()}
                style={[styles.hour, { height: 12 + h * 70, backgroundColor: item.color, opacity: 0.35 + h * 0.65 }]}
              />
            ))}
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <Card style={styles.section}>
          <Text style={type.h3}>How you earn</Text>
          <View style={styles.ruleRow}>
            <CoinIcon size={18} />
            <Text style={[type.body, styles.flex]}>{item.rate}, up to {item.reward} {TOKEN} per day</Text>
          </View>
          <View style={styles.ruleRow}>
            <Icon name="ShieldCheck" size={18} color={colors.mint} />
            <Text style={[type.body, styles.flex]}>Verified via {item.verified}. Unusual patterns are reviewed before credit.</Text>
          </View>
          <View style={styles.ruleRow}>
            <Icon name="Flame" size={18} color={colors.orange} />
            <Text style={[type.body, styles.flex]}>Counts towards your daily streak and active challenges.</Text>
          </View>
        </Card>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  flex: { flex: 1 },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 20, height: 260 },
  orb: { position: 'absolute', width: 230, height: 230, borderRadius: 115 },
  big: { ...type.display, fontSize: 40, marginTop: 6 },
  timer: { fontWeight: '800', marginTop: 6, fontSize: 15, letterSpacing: 1 },
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(52,245,180,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 12,
  },
  doneText: { color: colors.mint, fontWeight: '700', fontSize: 13 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14, paddingHorizontal: 6 },
  statValue: { color: colors.text, fontWeight: '800', fontSize: 14 },
  actions: { marginTop: 18, gap: 10 },
  section: { marginTop: 16 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeline: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 90, marginTop: 16 },
  hour: { width: 14, borderRadius: 6 },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 14 },
});
