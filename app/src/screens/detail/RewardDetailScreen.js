import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, SlideInDown, ZoomIn } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Card from '../../components/Card';
import GradientView, { GradientFill } from '../../components/GradientFill';
import GradientButton from '../../components/GradientButton';
import Icon from '../../components/Icon';
import CoinIcon from '../../components/CoinIcon';
import { formatNumber } from '../../components/AnimatedNumber';
import { rewards, wallet } from '../../data/mock';
import { colors, gradients, radius, shadow, type, TOKEN } from '../../theme';

const FEE_RATE = 0.02;

function Line({ label, value, strong }) {
  return (
    <View style={styles.line}>
      <Text style={strong ? type.bodyStrong : type.body}>{label}</Text>
      <Text style={[styles.lineValue, strong && styles.lineStrong]}>{value}</Text>
    </View>
  );
}

export default function RewardDetailScreen({ route, navigation }) {
  const r = rewards.find(x => x.id === route.params?.id) || rewards[0];
  const insets = useSafeAreaInsets();
  const [sheet, setSheet] = useState(false);
  const [stage, setStage] = useState('confirm'); // confirm | loading | done
  const fee = Math.ceil(r.cost * FEE_RATE);
  const total = r.cost + fee;
  const affordable = wallet.balance >= total;

  const redeem = () => {
    setStage('loading');
    setTimeout(() => setStage('done'), 1300);
  };

  const close = () => {
    setSheet(false);
    if (stage === 'done') {
      navigation.goBack();
    }
    setStage('confirm');
  };

  return (
    <Screen
      scroll
      header={<Header title={r.brand} />}
      tint={r.gradient[0]}
      accent={r.gradient[1]}
      contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
      footer={
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <View>
            <Text style={type.caption}>Total</Text>
            <View style={styles.totalRow}>
              <CoinIcon size={18} />
              <Text style={styles.total}>{formatNumber(total)}</Text>
            </View>
          </View>
          <GradientButton
            title={affordable ? 'Redeem now' : 'Not enough FIT'}
            disabled={!affordable}
            style={styles.flex}
            onPress={() => setSheet(true)}
          />
        </View>
      }>
      <Animated.View entering={ZoomIn.duration(450)}>
        <GradientView colors={r.gradient} style={[styles.hero, shadow.glow(r.gradient[0])]}>
          <View style={styles.heroCircle} />
          <View style={styles.heroCircle2} />
          <Icon name={r.icon} size={64} color="#fff" strokeWidth={1.6} />
          <Text style={styles.heroBrand}>{r.brand}</Text>
        </GradientView>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <Text style={[type.h1, styles.title]}>{r.title}</Text>
        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Icon name="Tag" size={13} color={colors.textSecondary} />
            <Text style={type.caption}>{r.category}</Text>
          </View>
          <View style={styles.meta}>
            <Icon name="ShoppingBag" size={13} color={colors.textSecondary} />
            <Text style={type.caption}>{r.stock}</Text>
          </View>
          <View style={styles.meta}>
            <Icon name="Clock" size={13} color={colors.textSecondary} />
            <Text style={type.caption}>Valid 90 days</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(500)}>
        <Card style={styles.section}>
          <Text style={type.h3}>Price breakdown</Text>
          <Line label="Reward cost" value={`${formatNumber(r.cost)} ${TOKEN}`} />
          <Line label={`Platform fee (${FEE_RATE * 100}%)`} value={`${fee} ${TOKEN}`} />
          <View style={styles.divider} />
          <Line label="Total" value={`${formatNumber(total)} ${TOKEN}`} strong />
          <Line label="Balance after" value={`${formatNumber(wallet.balance - total, 2)} ${TOKEN}`} />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(220).duration(500)}>
        <Card style={styles.section}>
          <Text style={type.h3}>How it works</Text>
          {[
            'Redeem with FIT — your balance updates instantly.',
            'Your voucher code appears in Wallet → History within 24h.',
            'Redemptions are final and can’t be exchanged for cash.',
          ].map((t, i) => (
            <View key={t} style={styles.step}>
              <View style={styles.stepNum}>
                <Text style={styles.stepText}>{i + 1}</Text>
              </View>
              <Text style={[type.body, styles.flex]}>{t}</Text>
            </View>
          ))}
        </Card>
      </Animated.View>

      <Modal visible={sheet} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={close}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.backdrop}>
          <Text style={StyleSheet.absoluteFill} onPress={stage === 'loading' ? undefined : close} />
          <Animated.View entering={SlideInDown.springify().damping(18)} style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.handle} />
            {stage === 'done' ? (
              <View style={styles.success}>
                <Animated.View entering={ZoomIn.springify().damping(10)} style={styles.successIcon}>
                  <GradientFill colors={gradients.mint} />
                  <Icon name="Check" size={44} color={colors.bg} strokeWidth={3} />
                </Animated.View>
                <Animated.Text entering={FadeInDown.delay(150)} style={[type.h1, styles.center]}>
                  Reward redeemed!
                </Animated.Text>
                <Animated.Text entering={FadeInDown.delay(250)} style={[type.body, styles.center]}>
                  Your {r.brand} {r.title} is being processed. We’ll notify you when the code is ready.
                </Animated.Text>
                <GradientButton title="Done" colors={gradients.mint} onPress={close} style={styles.sheetBtn} />
              </View>
            ) : (
              <View>
                <Text style={type.h2}>Confirm redemption</Text>
                <Text style={[type.body, styles.mt6]}>
                  {formatNumber(total)} {TOKEN} will be deducted from your balance.
                </Text>
                <Card style={styles.confirmCard}>
                  <GradientView colors={r.gradient} style={styles.confirmIcon}>
                    <Icon name={r.icon} size={22} color="#fff" />
                  </GradientView>
                  <View style={styles.flex}>
                    <Text style={type.bodyStrong}>{r.title}</Text>
                    <Text style={type.caption}>{r.brand}</Text>
                  </View>
                  <Text style={styles.confirmCost}>{formatNumber(total)}</Text>
                </Card>
                <GradientButton title="Confirm & Redeem" loading={stage === 'loading'} onPress={redeem} style={styles.sheetBtn} />
                <GradientButton title="Cancel" variant="ghost" onPress={close} style={styles.mt10} />
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  mt6: { marginTop: 6 },
  mt10: { marginTop: 10 },
  hero: { height: 200, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: 10 },
  heroCircle: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.1)', top: -80, right: -60 },
  heroCircle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(0,0,0,0.08)', bottom: -50, left: -30 },
  heroBrand: { color: '#fff', fontWeight: '800', fontSize: 18, letterSpacing: 0.5 },
  title: { marginTop: 22 },
  metaRow: { flexDirection: 'row', gap: 14, marginTop: 10, flexWrap: 'wrap' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  section: { marginTop: 16 },
  line: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  lineValue: { color: colors.textSecondary, fontWeight: '600' },
  lineStrong: { color: colors.text, fontWeight: '800' },
  divider: { height: 1, backgroundColor: colors.border, marginTop: 12 },
  step: { flexDirection: 'row', gap: 12, marginTop: 14, alignItems: 'flex-start' },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(124,92,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  stepText: { color: '#B6A4FF', fontWeight: '800', fontSize: 12 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: 'rgba(6,9,18,0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  total: { color: colors.text, fontSize: 22, fontWeight: '800' },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  handle: { width: 42, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: 18 },
  confirmCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 },
  confirmIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  confirmCost: { color: colors.gold, fontWeight: '800', fontSize: 16 },
  sheetBtn: { marginTop: 22, alignSelf: 'stretch' },
  success: { alignItems: 'center', gap: 10, paddingTop: 8 },
  successIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 10 },
});
