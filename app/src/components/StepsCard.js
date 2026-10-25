import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import Card from './Card';
import ProgressRing from './ProgressRing';
import AnimatedNumber from './AnimatedNumber';
import GradientButton from './GradientButton';
import PressableScale from './PressableScale';
import CoinIcon from './CoinIcon';
import Icon from './Icon';
import { useSteps } from '../context/StepsContext';
import { colors, gradients, type, TOKEN } from '../theme';

function Stat({ icon, color, value, label }) {
  return (
    <View style={styles.stat}>
      <Icon name={icon} size={16} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={type.caption}>{label}</Text>
    </View>
  );
}

/** Today's live step count with goal ring, reward progress and setup prompts. */
export default function StepsCard({ onPress }) {
  const {
    steps,
    goal,
    progress,
    calories,
    fitEarnedToday,
    fitMaxToday,
    isSupported,
    isTracking,
    status,
    needsReliabilityFix,
    lastReward,
    clearLastReward,
    enableTracking,
    openAppSettings,
    improveReliability,
  } = useSteps();
  const [asking, setAsking] = useState(false);
  const [blocked, setBlocked] = useState(false);

  // Show the "+N FIT" bubble for a few seconds after a reward lands
  useEffect(() => {
    if (!lastReward) {
      return undefined;
    }
    const t = setTimeout(clearLastReward, 4000);
    return () => clearTimeout(t);
  }, [lastReward, clearLastReward]);

  const enable = async () => {
    setAsking(true);
    const result = await enableTracking();
    setBlocked(result === 'blocked');
    setAsking(false);
  };

  if (status && !isSupported) {
    return (
      <Card style={styles.card}>
        <View style={styles.setupRow}>
          <Icon name="Footprints" size={22} color={colors.textMuted} />
          <Text style={[type.body, styles.flex]}>Step counting isn’t available on this device.</Text>
        </View>
      </Card>
    );
  }

  if (status && !isTracking) {
    return (
      <Card style={styles.card}>
        <View style={styles.setupRow}>
          <View style={styles.setupIcon}>
            <Icon name="Footprints" size={22} color={colors.mint} />
          </View>
          <View style={styles.flex}>
            <Text style={type.h3}>Start earning from your steps</Text>
            <Text style={type.caption}>
              Allow physical activity access. Steps are counted even when Fitcoin is closed — {STEP_RATE}.
            </Text>
          </View>
        </View>
        <GradientButton
          title={blocked ? 'Open settings' : 'Enable step tracking'}
          icon={blocked ? 'Settings' : 'Footprints'}
          size="md"
          colors={gradients.mint}
          loading={asking}
          onPress={blocked ? openAppSettings : enable}
          style={styles.setupBtn}
        />
        {blocked ? (
          <Text style={[type.caption, styles.hint]}>Permission was denied. Turn on “Physical activity” in app settings.</Text>
        ) : null}
      </Card>
    );
  }

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <ProgressRing size={128} stroke={12} progress={progress} gradient={gradients.mint} duration={900}>
          <View style={styles.ringInner}>
            <Icon name="Footprints" size={18} color={colors.mint} />
            <AnimatedNumber value={steps} duration={600} style={styles.steps} />
            <Text style={type.caption}>of {goal.toLocaleString('en-US')}</Text>
          </View>
        </ProgressRing>

        <View style={styles.flex}>
          <View style={styles.titleRow}>
            <Text style={type.h3}>Today’s steps</Text>
            <View style={styles.liveChip}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>
          <View style={styles.reward}>
            <CoinIcon size={16} />
            <Text style={styles.rewardText}>
              {fitEarnedToday} / {fitMaxToday} {TOKEN}
            </Text>
          </View>
          <Text style={type.caption}>
            {steps >= goal ? 'Goal reached — great work!' : `${(goal - steps).toLocaleString('en-US')} steps to go`}
          </Text>
        </View>

        {lastReward ? (
          <Animated.View entering={ZoomIn.springify()} exiting={FadeOut} style={styles.bubble}>
            <Text style={styles.bubbleText}>+{lastReward} {TOKEN}</Text>
          </Animated.View>
        ) : null}
      </View>

      <View style={styles.stats}>
        <Stat icon="Flame" color={colors.orange} value={calories.toLocaleString('en-US')} label="kcal" />
        <Stat icon="Route" color={colors.cyan} value={(steps * 0.000762).toFixed(2)} label="km" />
        <Stat icon="Coins" color={colors.gold} value={`${Math.floor(Math.min(steps, 10000) / 1000)}/10`} label="milestones" />
      </View>

      {needsReliabilityFix ? (
        <Animated.View entering={FadeIn}>
          <PressableScale style={styles.fix} onPress={improveReliability}>
            <Icon name="BatteryCharging" size={16} color={colors.gold} />
            <Text style={styles.fixText}>Keep counting in the background — tap to allow</Text>
            <Icon name="ChevronRight" size={16} color={colors.textMuted} />
          </PressableScale>
        </Animated.View>
      ) : null}
    </Card>
  );
}

const STEP_RATE = `6 ${TOKEN} per 1,000 steps`;

const styles = StyleSheet.create({
  card: { marginTop: 16 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  ringInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  steps: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(52,245,180,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mint },
  liveText: { color: colors.mint, fontSize: 10, fontWeight: '800' },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,201,77,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginVertical: 10,
  },
  rewardText: { color: colors.gold, fontWeight: '800', fontSize: 13 },
  bubble: {
    position: 'absolute',
    top: -6,
    right: -4,
    backgroundColor: colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  bubbleText: { color: colors.bg, fontWeight: '900', fontSize: 12 },
  stats: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { color: colors.text, fontWeight: '800', fontSize: 15 },
  fix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,201,77,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,201,77,0.25)',
  },
  fixText: { flex: 1, color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  setupRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  setupIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(52,245,180,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupBtn: { marginTop: 16 },
  hint: { marginTop: 10, textAlign: 'center' },
});
