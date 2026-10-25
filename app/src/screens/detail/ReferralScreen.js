import React, { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, ZoomIn } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Avatar from '../../components/Avatar';
import GradientView from '../../components/GradientFill';
import GradientButton from '../../components/GradientButton';
import PressableScale from '../../components/PressableScale';
import Icon from '../../components/Icon';
import IconBubble from '../../components/IconBubble';
import CoinIcon from '../../components/CoinIcon';
import { StatusPill } from '../../components/TransactionRow';
import { referrals, user } from '../../data/mock';
import { colors, gradients, radius, type, TOKEN } from '../../theme';

const STEPS = [
  { icon: 'Share2', title: 'Share your code', body: 'Send your invite link to friends.' },
  { icon: 'User', title: 'Friend signs up', body: 'They verify their phone number.' },
  { icon: 'Activity', title: '3 active days', body: 'They complete 3 verified activity days.' },
  { icon: 'Coins', title: 'You both earn', body: `You get 100 ${TOKEN}, they get 50 ${TOKEN}.` },
];

export default function ReferralScreen() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    // Hook up @react-native-clipboard/clipboard here when needed.
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const share = () =>
    Share.share({
      message: `Join me on Fitcoin and earn rewards for staying active! Use my code ${user.referralCode} to get 50 FIT.`,
    });

  return (
    <Screen scroll edges={['top', 'bottom']} header={<Header title="Refer & Earn" />} tint={colors.mint} contentContainerStyle={styles.content}>
      <Animated.View entering={ZoomIn.duration(450)}>
        <GradientView colors={gradients.mint} style={styles.hero}>
          <View style={styles.heroCircle} />
          <View style={styles.heroIcons}>
            <IconBubble icon="Gift" color="#062A22" size={60} radius={20} style={styles.heroBubble} />
          </View>
          <Text style={styles.heroTitle}>Invite friends,{'\n'}earn 100 {TOKEN} each</Text>
          <Text style={styles.heroSub}>Up to 20 rewarded referrals per month</Text>
        </GradientView>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <Text style={[type.label, styles.label]}>Your referral code</Text>
        <PressableScale onPress={copy} style={styles.code}>
          <Text style={styles.codeText}>{user.referralCode}</Text>
          {copied ? (
            <Animated.View entering={ZoomIn} exiting={FadeOut} style={styles.copied}>
              <Icon name="Check" size={14} color={colors.bg} strokeWidth={3} />
              <Text style={styles.copiedText}>Copied</Text>
            </Animated.View>
          ) : (
            <View style={styles.copyBtn}>
              <Icon name="Copy" size={16} color={colors.mint} />
              <Text style={styles.copyText}>Copy</Text>
            </View>
          )}
        </PressableScale>
        <GradientButton title="Share invite link" icon="Share2" colors={gradients.mint} onPress={share} style={styles.share} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(500)} style={styles.stats}>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>4</Text>
          <Text style={type.caption}>Invited</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>3</Text>
          <Text style={type.caption}>Rewarded</Text>
        </Card>
        <Card style={styles.stat}>
          <View style={styles.earnRow}>
            <CoinIcon size={16} />
            <Text style={styles.statValue}>300</Text>
          </View>
          <Text style={type.caption}>Earned</Text>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(220).duration(500)}>
        <Card style={styles.section}>
          <Text style={type.h3}>How it works</Text>
          {STEPS.map((s, i) => (
            <View key={s.title} style={styles.step}>
              <View style={styles.stepRail}>
                <IconBubble icon={s.icon} color={colors.mint} size={40} radius={13} />
                {i < STEPS.length - 1 ? <View style={styles.rail} /> : null}
              </View>
              <View style={styles.stepBody}>
                <Text style={type.bodyStrong}>{s.title}</Text>
                <Text style={type.caption}>{s.body}</Text>
              </View>
            </View>
          ))}
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(280).duration(500)}>
        <Card style={styles.section}>
          <Text style={type.h3}>Your referrals</Text>
          {referrals.map(f => (
            <View key={f.id} style={styles.friend}>
              <Avatar initials={f.avatar} size={40} color={f.color} />
              <View style={styles.flex}>
                <Text style={type.bodyStrong}>{f.name}</Text>
                <Text style={type.caption}>{f.note}</Text>
              </View>
              <StatusPill status={f.status} />
            </View>
          ))}
        </Card>
      </Animated.View>

      <View style={styles.fine}>
        <Icon name="ShieldCheck" size={16} color={colors.textMuted} />
        <Text style={[type.caption, styles.flex]}>
          Referral rewards require a unique verified device and phone number. Accounts flagged for self-referral or fraud are not eligible.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  flex: { flex: 1 },
  hero: { borderRadius: radius.xl, padding: 22, marginTop: 8 },
  heroCircle: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(255,255,255,0.18)', right: -90, top: -90 },
  heroIcons: { flexDirection: 'row' },
  heroBubble: { backgroundColor: 'rgba(255,255,255,0.45)' },
  heroTitle: { color: '#062A22', fontSize: 24, fontWeight: '900', marginTop: 18, lineHeight: 30 },
  heroSub: { color: 'rgba(6,42,34,0.75)', marginTop: 6, fontWeight: '600' },
  label: { marginTop: 24, marginBottom: 10, marginLeft: 4 },
  code: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingLeft: 18,
    paddingRight: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(52,245,180,0.45)',
    backgroundColor: 'rgba(52,245,180,0.06)',
  },
  codeText: { color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 42, borderRadius: 12, backgroundColor: 'rgba(52,245,180,0.12)' },
  copyText: { color: colors.mint, fontWeight: '800' },
  copied: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 42, borderRadius: 12, backgroundColor: colors.mint },
  copiedText: { color: colors.bg, fontWeight: '800' },
  share: { marginTop: 14 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 18 },
  stat: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14 },
  statValue: { color: colors.text, fontWeight: '900', fontSize: 20 },
  earnRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  section: { marginTop: 14 },
  step: { flexDirection: 'row', gap: 14, marginTop: 14 },
  stepRail: { alignItems: 'center' },
  rail: { width: 2, flex: 1, minHeight: 16, backgroundColor: 'rgba(52,245,180,0.2)', marginTop: 4, marginBottom: -14 },
  stepBody: { flex: 1, gap: 2, paddingTop: 2 },
  friend: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  fine: { flexDirection: 'row', gap: 10, marginTop: 18, paddingHorizontal: 4 },
});
