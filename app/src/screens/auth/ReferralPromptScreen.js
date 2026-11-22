import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import IconBubble from '../../components/IconBubble';
import GradientButton from '../../components/GradientButton';
import ReferralCodeForm from '../../components/ReferralCodeForm';
import CoinIcon from '../../components/CoinIcon';
import { useAuth } from '../../context/AuthContext';
import { getPendingInvite, onInvite } from '../../services/invite';
import { colors, gradients, type, TOKEN } from '../../theme';

/**
 * Shown once right after a new Google account is created (an email sign-up has
 * the code field on its form). Skipping is fine: the code can be added later
 * from Profile → Refer & earn.
 */
export default function ReferralPromptScreen() {
  const { finishReferralPrompt } = useAuth();
  const [invite, setInvite] = useState(getPendingInvite()?.code || '');
  const [done, setDone] = useState(null); // { name, bonus } after the code was added

  useEffect(() => onInvite(p => p?.code && setInvite(p.code)), []);

  if (done) {
    return (
      <Screen edges={['top', 'bottom']} contentContainerStyle={styles.center} tint={colors.mint}>
        <Animated.View entering={ZoomIn.duration(450)} style={styles.doneBox}>
          <IconBubble icon="PartyPopper" gradient={gradients.mint} size={84} radius={28} />
          <Text style={[type.h1, styles.title]}>You’re in!</Text>
          {done.bonus > 0 ? (
            <View style={styles.bonus}>
              <CoinIcon size={20} />
              <Text style={styles.bonusText}>
                +{done.bonus} {TOKEN}
              </Text>
            </View>
          ) : null}
          <Text style={[type.body, styles.centerText]}>
            You joined with {done.name}’s code{done.bonus > 0 ? ', and your welcome bonus is in your wallet.' : '.'}
          </Text>
        </Animated.View>
        <GradientButton title="Let’s go" onPress={finishReferralPrompt} style={styles.cta} />
      </Screen>
    );
  }

  return (
    <Screen scroll edges={['top', 'bottom']} contentContainerStyle={styles.content} tint={colors.mint}>
      <Animated.View entering={ZoomIn.duration(450)} style={styles.head}>
        <IconBubble icon="Gift" gradient={gradients.mint} size={72} radius={24} />
        <Text style={[type.h1, styles.title]}>Did a friend invite you?</Text>
        <Text style={[type.body, styles.centerText]}>
          Enter their referral code to get a {TOKEN} welcome bonus right now. Your friend earns {TOKEN} too.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(500)}>
        <ReferralCodeForm
          initialCode={invite}
          buttonTitle="Add code & claim bonus"
          onApplied={result => {
            if (result) {
              setDone({ name: result.referredBy?.name || 'your friend', bonus: result.welcomeBonus });
            } else {
              finishReferralPrompt();
            }
          }}
        />
      </Animated.View>

      <GradientButton title="Skip for now" variant="ghost" size="md" onPress={finishReferralPrompt} style={styles.skip} />
      <Text style={[type.caption, styles.centerText]}>You can add a code later from Profile → Refer & earn.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 40 },
  center: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  head: { alignItems: 'center', marginBottom: 28 },
  title: { marginTop: 18, textAlign: 'center' },
  centerText: { textAlign: 'center', marginTop: 8 },
  skip: { marginTop: 10 },
  doneBox: { alignItems: 'center' },
  bonus: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  bonusText: { color: colors.gold, fontSize: 28, fontWeight: '900' },
  cta: { marginTop: 32 },
});
