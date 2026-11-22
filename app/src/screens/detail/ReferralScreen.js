import React, { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, ZoomIn } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Avatar, { initialsOf } from '../../components/Avatar';
import GradientView from '../../components/GradientFill';
import GradientButton from '../../components/GradientButton';
import PressableScale from '../../components/PressableScale';
import Icon from '../../components/Icon';
import IconBubble from '../../components/IconBubble';
import CoinIcon from '../../components/CoinIcon';
import { StatusPill } from '../../components/TransactionRow';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';
import { referralsApi } from '../../api/engagementApi';
import ReferralCodeForm from '../../components/ReferralCodeForm';
import { getPendingInvite } from '../../services/invite';
import { inviteLink } from '../../config';
import { avatarColor } from '../../utils/format';
import { colors, gradients, radius, type, TOKEN } from '../../theme';

export default function ReferralScreen({ route }) {
  const { user } = useAuth();
  const { data, setData, reload } = useApi(() => referralsApi.get(), []);
  const [added, setAdded] = useState(null); // { name, bonus } right after adding a code
  // A tapped invite link opens this screen with the code; otherwise use one from a Play install
  const invitedCode = route?.params?.code || getPendingInvite()?.code || '';
  const [sent, setSent] = useState(false);
  const code = data?.code || user?.referralCode || '';
  const rules = data?.rules || { referrerReward: 200, refereeReward: 100, maxRewardedPerMonth: 20 };
  const stats = data?.stats || { invited: 0, rewarded: 0, earned: 0 };
  const referrals = data?.referrals || [];

  const STEPS = [
    { icon: 'Share2', title: 'Share your link', body: 'Send your invite link or code to friends.' },
    { icon: 'User', title: 'Friend joins', body: 'The link fills in your code when they sign up. They can also add it later from their profile.' },
    { icon: 'Coins', title: 'You both earn, instantly', body: `You get ${rules.referrerReward} ${TOKEN}, they get ${rules.refereeReward} ${TOKEN}, as soon as the code is added.` },
  ];

  // Sends just the code (React Native has no built-in clipboard)
  const sendCode = async () => {
    const result = await Share.share({ message: code });
    if (result.action === Share.sharedAction) {
      setSent(true);
      setTimeout(() => setSent(false), 1600);
    }
  };

  const share = () =>
    Share.share({
      message: `Join me on axyio and earn rewards for staying active! Sign up with my code ${code} and get ${rules.refereeReward} ${TOKEN}: ${inviteLink(code)}`,
    });

  return (
    <Screen scroll onRefresh={reload} edges={['top', 'bottom']} header={<Header title="Refer & Earn" />} tint={colors.mint} contentContainerStyle={styles.content}>
      <Animated.View entering={ZoomIn.duration(450)}>
        <GradientView colors={gradients.mint} style={styles.hero}>
          <View style={styles.heroCircle} />
          <View style={styles.heroIcons}>
            <IconBubble icon="Gift" color="#062A22" size={60} radius={20} style={styles.heroBubble} />
          </View>
          <Text style={styles.heroTitle}>
            Invite friends,{'\n'}earn {rules.referrerReward} {TOKEN} each
          </Text>
          <Text style={styles.heroSub}>Up to {rules.maxRewardedPerMonth} rewarded referrals per month</Text>
        </GradientView>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <Text style={[type.label, styles.label]}>Your referral code</Text>
        <PressableScale onPress={sendCode} style={styles.code}>
          <Text selectable style={styles.codeText}>
            {code}
          </Text>
          {sent ? (
            <Animated.View entering={ZoomIn} exiting={FadeOut} style={styles.copied}>
              <Icon name="Check" size={14} color={colors.bg} strokeWidth={3} />
              <Text style={styles.copiedText}>Sent</Text>
            </Animated.View>
          ) : (
            <View style={styles.copyBtn}>
              <Icon name="Send" size={16} color={colors.mint} />
              <Text style={styles.copyText}>Send</Text>
            </View>
          )}
        </PressableScale>
        <GradientButton title="Share invite link" icon="Share2" colors={gradients.mint} onPress={share} style={styles.share} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(500)} style={styles.stats}>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>{stats.invited}</Text>
          <Text style={type.caption}>Invited</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>{stats.rewarded}</Text>
          <Text style={type.caption}>Rewarded</Text>
        </Card>
        <Card style={styles.stat}>
          <View style={styles.earnRow}>
            <CoinIcon size={16} />
            <Text style={styles.statValue}>{stats.earned}</Text>
          </View>
          <Text style={type.caption}>Earned</Text>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(190).duration(500)}>
        {data?.referredBy ? (
          <Card style={styles.section}>
            <View style={styles.joinedRow}>
              <IconBubble icon="Lock" color={colors.mint} size={40} radius={13} />
              <View style={styles.flex}>
                <Text style={type.bodyStrong}>You joined with {data.referredBy.name}’s code</Text>
                <Text style={type.caption}>
                  {data.referredBy.code ? `${data.referredBy.code} · ` : ''}A referral code can only be added once.
                </Text>
              </View>
            </View>
            {added?.bonus ? (
              <Text style={[type.caption, styles.addedNote]}>
                +{added.bonus} {TOKEN} welcome bonus added to your wallet.
              </Text>
            ) : null}
          </Card>
        ) : data?.canAddCode ? (
          <Card style={styles.section}>
            <Text style={type.h3}>Did a friend invite you?</Text>
            <Text style={[type.caption, styles.addIntro]}>
              Add their code to get {rules.refereeReward} {TOKEN} now. Your friend gets {rules.referrerReward} {TOKEN}.
            </Text>
            <ReferralCodeForm
              initialCode={invitedCode !== code ? invitedCode : ''}
              onApplied={result => {
                if (result) {
                  setAdded({ bonus: result.welcomeBonus });
                  setData(result.info);
                } else {
                  reload();
                }
              }}
            />
          </Card>
        ) : null}
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
          <Text style={type.h3}>People who used your code</Text>
          {referrals.length === 0 ? (
            <Text style={[type.caption, styles.none]}>No friends have joined with your code yet.</Text>
          ) : null}
          {referrals.map(f => (
            <View key={f.id} style={styles.friend}>
              <Avatar initials={initialsOf(f.name)} size={40} color={avatarColor(f.id)} />
              <View style={styles.flex}>
                <Text style={type.bodyStrong}>{f.name}</Text>
                <Text style={type.caption}>{f.note}</Text>
              </View>
              {f.reward > 0 ? (
                <View style={styles.friendReward}>
                  <CoinIcon size={13} />
                  <Text style={styles.friendRewardText}>+{f.reward}</Text>
                </View>
              ) : (
                <StatusPill status={f.status} />
              )}
            </View>
          ))}
        </Card>
      </Animated.View>

      <View style={styles.fine}>
        <Icon name="ShieldCheck" size={16} color={colors.textMuted} />
        <Text style={[type.caption, styles.flex]}>
          Referral rewards are for genuine new users. Accounts flagged for self-referral or fraud are not eligible.
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
  none: { marginTop: 10 },
  fine: { flexDirection: 'row', gap: 10, marginTop: 18, paddingHorizontal: 4 },
  joinedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addedNote: { marginTop: 12, color: colors.mint },
  addIntro: { marginTop: 4, marginBottom: 14 },
  friendReward: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  friendRewardText: { color: colors.gold, fontWeight: '800' },
});
