import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Card from '../../components/Card';
import GradientView from '../../components/GradientFill';
import GradientButton from '../../components/GradientButton';
import Icon from '../../components/Icon';
import CoinIcon from '../../components/CoinIcon';
import { usePremium } from '../../context/PremiumContext';
import { ACTIVITY_VISUALS } from '../../constants/activities';
import { durationLabel, priceLabel, shortDate } from '../../utils/format';
import { colors, gradients, radius, shadow, type, TOKEN } from '../../theme';

function Benefit({ text, index }) {
  return (
    <Animated.View entering={FadeInDown.delay(200 + index * 60).duration(400)} style={styles.benefit}>
      <View style={styles.check}>
        <Icon name="Check" size={13} color={colors.bg} strokeWidth={3} />
      </View>
      <Text style={[type.bodyStrong, styles.flex]}>{text}</Text>
    </Animated.View>
  );
}

function HabitRow({ h, isPremium }) {
  const v = ACTIVITY_VISUALS[h.id] || ACTIVITY_VISUALS.walk;
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: v.color + '22' }]}>
        <Icon name={v.icon} size={16} color={v.color} />
      </View>
      <View style={styles.flex}>
        <Text style={type.bodyStrong}>{h.name}</Text>
        <Text style={type.caption}>{isPremium ? h.premiumRate : h.rate}</Text>
      </View>
      <Text style={[styles.colFree, isPremium && styles.dim]}>{h.maxReward}</Text>
      <Text style={styles.colPremium}>{h.premiumMaxReward}</Text>
    </View>
  );
}

export default function PremiumScreen() {
  const insets = useSafeAreaInsets();
  const { plan, status, info, isPremium, available, reload, upgrade } = usePremium();
  const [busy, setBusy] = useState(false);
  const [justUpgraded, setJustUpgraded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  if (!plan) {
    return <Screen header={<Header title="Premium" />} />;
  }

  const price = priceLabel(plan.price, plan.currency);
  const period = durationLabel(plan.durationDays);
  const canBuy = available && info?.canPurchase;

  const doUpgrade = async () => {
    setBusy(true);
    try {
      await upgrade();
      setJustUpgraded(true);
    } catch (err) {
      Alert.alert('Upgrade failed', err.message);
    } finally {
      setBusy(false);
    }
  };

  const confirm = () =>
    Alert.alert(
      isPremium ? `Extend ${plan.title}?` : `Upgrade to ${plan.title}?`,
      `${price} for ${period}. You’ll earn ${plan.multiplier}x ${TOKEN} on every habit${
        isPremium ? ', added after your current plan ends' : ' starting now'
      }.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: isPremium ? 'Extend' : 'Upgrade', onPress: doUpgrade },
      ],
    );

  let cta = isPremium ? `Extend · ${price}` : `Upgrade · ${price} / ${period}`;
  if (!available) {
    cta = 'Premium is unavailable right now';
  } else if (!info?.canPurchase) {
    cta = 'Purchases coming soon';
  }

  return (
    <Screen
      scroll
      onRefresh={reload}
      edges={['top']}
      tint={colors.orange}
      accent={colors.pink}
      header={<Header title="Premium" />}
      contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
      footer={
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <GradientButton
            title={cta}
            icon={canBuy ? 'Crown' : undefined}
            colors={[colors.orange, colors.pink]}
            loading={busy}
            disabled={!canBuy}
            onPress={confirm}
          />
        </View>
      }>
      <Animated.View entering={ZoomIn.duration(450)}>
        <GradientView colors={gradients.premium} style={[styles.hero, shadow.glow(colors.orange)]}>
          <View style={styles.heroCircle} />
          <View style={styles.heroCircle2} />
          <View style={styles.crown}>
            <Icon name="Crown" size={40} color="#fff" strokeWidth={1.8} />
          </View>
          <Text style={styles.heroMult}>
            {plan.multiplier}x {TOKEN}
          </Text>
          <Text style={styles.heroTitle}>{plan.title}</Text>
          {isPremium ? (
            <View style={styles.activeChip}>
              <Icon name="BadgeCheck" size={14} color="#fff" />
              <Text style={styles.activeChipText}>Active until {shortDate(status.until)}</Text>
            </View>
          ) : (
            <Text style={styles.heroTag}>{plan.tagline}</Text>
          )}
        </GradientView>
      </Animated.View>

      {justUpgraded ? (
        <Animated.View entering={FadeInDown.springify()}>
          <Card style={styles.success}>
            <Icon name="PartyPopper" size={22} color={colors.gold} />
            <Text style={[type.bodyStrong, styles.flex]}>
              You’re premium! Every habit now earns {plan.multiplier}x {TOKEN}.
            </Text>
          </Card>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(120).duration(450)}>
        <Card style={styles.section}>
          <Text style={type.h3}>What you get</Text>
          <View style={styles.benefits}>
            {plan.benefits.map((b, i) => (
              <Benefit key={b} text={b} index={i} />
            ))}
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(450)}>
        <Card style={styles.section}>
          <View style={styles.compareHead}>
            <Text style={[type.h3, styles.flex]}>Max {TOKEN} per day</Text>
            <Text style={styles.headFree}>Free</Text>
            <Text style={styles.headPremium}>Premium</Text>
          </View>
          {(info?.habits || []).map(h => (
            <HabitRow key={h.id} h={h} isPremium={isPremium} />
          ))}
          <View style={styles.divider} />
          {plan.freeHabitGroups ? (
            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: colors.mint + '22' }]}>
                <Icon name="ListChecks" size={16} color={colors.mint} />
              </View>
              <View style={styles.flex}>
                <Text style={type.bodyStrong}>Active habits</Text>
                <Text style={type.caption}>Free: {plan.freeHabitGroups.map(g => `${g.limit} ${g.name.toLowerCase()}`).join(' + ')}</Text>
              </View>
              <Text style={[styles.colFree, isPremium && styles.dim]}>{plan.freeHabitLimit}</Text>
              <Text style={styles.colPremium}>{plan.totalHabits}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.gold + '22' }]}>
              <CoinIcon size={16} />
            </View>
            <View style={styles.flex}>
              <Text style={type.bodyStrong}>Daily earning cap</Text>
              <Text style={type.caption}>Across all habits</Text>
            </View>
            <Text style={[styles.colFree, isPremium && styles.dim]}>{plan.freeDailyCap}</Text>
            <Text style={styles.colPremium}>{plan.dailyCap}</Text>
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(260).duration(450)}>
        <Card style={[styles.section, styles.note]}>
          <Icon name="Info" size={18} color={colors.textMuted} />
          <Text style={[type.caption, styles.flex]}>
            {price} for {period}. Premium rewards apply to habit {TOKEN} (steps, cycling, water, sleep, reading and breathing). Streak
            bonuses, challenges and referrals pay their usual amounts. {TOKEN} has no cash value.
          </Text>
        </Card>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  flex: { flex: 1 },
  hero: {
    borderRadius: radius.xl,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  heroCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -90,
    right: -60,
  },
  heroCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0,0,0,0.08)',
    bottom: -50,
    left: -30,
  },
  crown: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMult: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '900',
    marginTop: 14,
    letterSpacing: -1,
  },
  heroTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  heroTag: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  activeChipText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  success: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    borderColor: 'rgba(255,201,77,0.35)',
  },
  section: { marginTop: 16 },
  benefits: { gap: 12, marginTop: 14 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  headFree: {
    width: 56,
    textAlign: 'right',
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  headPremium: {
    width: 72,
    textAlign: 'right',
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colFree: {
    width: 44,
    textAlign: 'right',
    color: colors.textSecondary,
    fontWeight: '700',
  },
  colPremium: {
    width: 60,
    textAlign: 'right',
    color: colors.gold,
    fontWeight: '900',
    fontSize: 15,
  },
  dim: { color: colors.textMuted, textDecorationLine: 'line-through' },
  divider: { height: 1, backgroundColor: colors.border, marginTop: 14 },
  note: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: 'rgba(6,9,18,0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
