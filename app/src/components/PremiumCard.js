import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import GradientView from './GradientFill';
import PressableScale from './PressableScale';
import Icon from './Icon';
import { usePremium } from '../context/PremiumContext';
import { shortDate } from '../utils/format';
import { colors, gradients, radius, shadow, TOKEN } from '../theme';

/** Home screen entry to Premium: an upgrade offer, or the member's active plan. */
export default function PremiumCard({ onPress }) {
  const { plan, status, isPremium, available } = usePremium();
  if (!plan || (!isPremium && !available)) {
    return null;
  }

  if (isPremium) {
    return (
      <PressableScale onPress={onPress} scaleTo={0.98} style={[styles.active]}>
        <View style={styles.crownSmall}>
          <Icon name="Crown" size={20} color={colors.gold} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.activeTitle}>
            {plan.title} · {plan.multiplier}x {TOKEN}
          </Text>
          <Text style={styles.activeSub}>
            Active until {shortDate(status.until)} · {status.daysLeft} day
            {status.daysLeft === 1 ? '' : 's'} left
          </Text>
        </View>
        <Icon name="ChevronRight" size={18} color={colors.textMuted} />
      </PressableScale>
    );
  }

  return (
    <PressableScale onPress={onPress} scaleTo={0.98}>
      <GradientView colors={gradients.premium} direction="horizontal" style={[styles.offer, shadow.glow(colors.orange)]}>
        <View style={styles.glow} />
        <View style={styles.crown}>
          <Icon name="Crown" size={24} color="#fff" />
        </View>
        <View style={styles.flex}>
          <Text style={styles.offerTitle}>{status?.expired ? `Renew ${plan.title}` : `Upgrade to ${plan.title}`}</Text>
          <Text style={styles.offerSub} numberOfLines={2}>
            {plan.tagline || `Earn ${plan.multiplier}x ${TOKEN} on every habit`}
          </Text>
        </View>
        <View style={styles.multChip}>
          <Text style={styles.multText}>{plan.multiplier}x</Text>
        </View>
      </GradientView>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  offer: {
    borderRadius: radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 16,
  },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.14)',
    top: -70,
    right: -40,
  },
  crown: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  offerSub: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  multChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  multText: { color: colors.orange, fontWeight: '900', fontSize: 14 },
  active: {
    marginTop: 16,
    borderRadius: radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,201,77,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,201,77,0.3)',
  },
  crownSmall: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(255,201,77,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTitle: { color: colors.gold, fontWeight: '800', fontSize: 14 },
  activeSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
