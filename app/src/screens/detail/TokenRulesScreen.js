import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Card from '../../components/Card';
import IconBubble from '../../components/IconBubble';
import Icon from '../../components/Icon';
import CoinIcon from '../../components/CoinIcon';
import { useSteps } from '../../context/StepsContext';
import { colors, type, TOKEN } from '../../theme';

const sections = dailyCap => [
  {
    icon: 'Coins',
    color: colors.gold,
    title: 'How FIT is issued',
    points: [
      'FIT is credited only after activities are verified on our servers.',
      `Each activity has its own rate and daily maximum (e.g. 6 ${TOKEN} per 1,000 steps, up to 60 a day).`,
      `Every 7th day in a row you’re active earns a 50 ${TOKEN} streak bonus; challenges pay their prize when completed.`,
    ],
  },
  {
    icon: 'Target',
    color: colors.cyan,
    title: 'Earning limits',
    points: [
      `Daily cap: ${dailyCap} ${TOKEN} across all activities.`,
      `Referral cap: 20 rewarded referrals per month.`,
      'Unusual activity may be held for review before credit.',
    ],
  },
  {
    icon: 'Hourglass',
    color: colors.orange,
    title: 'Expiry policy',
    points: ['FIT expires 6 months after it is earned.', 'You’ll be notified 14 days before any FIT expires.', 'Oldest FIT is always spent first.'],
  },
  {
    icon: 'Gift',
    color: colors.mint,
    title: 'Redemption rules',
    points: [
      'Redeem FIT for partner vouchers, passes and offers.',
      'A 2% platform fee applies to marketplace redemptions.',
      'FIT has no cash value and can’t be transferred between users.',
    ],
  },
  {
    icon: 'ShieldCheck',
    color: colors.primary,
    title: 'Fair play',
    points: [
      'One account per person and device.',
      'Manipulated sensor data or fake referrals lead to account suspension.',
      'All reward events are recorded in an audit log.',
    ],
  },
];

function Section({ s, index }) {
  const [open, setOpen] = useState(index === 0);
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: withTiming(open ? '90deg' : '0deg') }] }));
  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(450)} layout={LinearTransition.springify()}>
      <Card onPress={() => setOpen(o => !o)} style={styles.card}>
        <View style={styles.head}>
          <IconBubble icon={s.icon} color={s.color} size={40} radius={13} />
          <Text style={[type.h3, styles.flex]}>{s.title}</Text>
          <Animated.View style={chevron}>
            <Icon name="ChevronRight" size={18} color={colors.textMuted} />
          </Animated.View>
        </View>
        {open ? (
          <Animated.View entering={FadeInDown.duration(250)} style={styles.points}>
            {s.points.map(p => (
              <View key={p} style={styles.point}>
                <View style={[styles.bullet, { backgroundColor: s.color }]} />
                <Text style={[type.body, styles.flex]}>{p}</Text>
              </View>
            ))}
          </Animated.View>
        ) : null}
      </Card>
    </Animated.View>
  );
}

export default function TokenRulesScreen() {
  const { wallet } = useSteps();
  const SECTIONS = sections(wallet.dailyCap);
  return (
    <Screen scroll edges={['top', 'bottom']} header={<Header title="Token & reward rules" />} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(450)} style={styles.intro}>
        <CoinIcon size={56} />
        <Text style={[type.h1, styles.introTitle]}>About {TOKEN} points</Text>
        <Text style={[type.body, styles.center]}>
          FIT are in-app reward points you earn for healthy habits and spend in the marketplace.
        </Text>
      </Animated.View>
      {SECTIONS.map((s, i) => (
        <Section key={s.title} s={s} index={i} />
      ))}
      <Card style={styles.note}>
        <Icon name="Info" size={18} color={colors.textMuted} />
        <Text style={[type.caption, styles.flex]}>
          Blockchain tokens, transfers, deposits, withdrawals and trading are not part of this version and will only be introduced after
          technical, security and regulatory review.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  intro: { alignItems: 'center', paddingVertical: 18, gap: 6 },
  introTitle: { marginTop: 10 },
  card: { marginBottom: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  points: { marginTop: 8 },
  point: { flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'flex-start' },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  note: { flexDirection: 'row', gap: 10, marginTop: 8, alignItems: 'flex-start' },
});
