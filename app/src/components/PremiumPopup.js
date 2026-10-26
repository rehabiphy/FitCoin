import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { backdropIn, popupIn } from './motion';
import GradientView from './GradientFill';
import GradientButton from './GradientButton';
import Icon from './Icon';
import { usePremium } from '../context/PremiumContext';
import { durationLabel, priceLabel } from '../utils/format';
import { colors, gradients, radius, type, TOKEN } from '../theme';

/** Upgrade offer shown once when the app opens, for members who aren't premium. */
export default function PremiumPopup({ visible, onUpgrade, onClose }) {
  const { plan } = usePremium();
  if (!plan) {
    return null;
  }
  const benefits = plan.benefits.slice(0, 3);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <Animated.View entering={backdropIn} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <Animated.View entering={popupIn} style={styles.card}>
          <GradientView colors={gradients.premium} style={styles.hero}>
            <View style={styles.glow} />
            <Pressable onPress={onClose} hitSlop={12} style={styles.close} accessibilityLabel="Close">
              <Icon name="X" size={18} color="#fff" />
            </Pressable>
            <View style={styles.crown}>
              <Icon name="Crown" size={34} color="#fff" />
            </View>
            <Text style={styles.mult}>
              {plan.multiplier}x {TOKEN}
            </Text>
            <Text style={styles.title}>{plan.title}</Text>
          </GradientView>

          <View style={styles.body}>
            <Text style={[type.body, styles.center]}>{plan.tagline}</Text>
            <View style={styles.list}>
              {benefits.map(b => (
                <View key={b} style={styles.item}>
                  <View style={styles.check}>
                    <Icon name="Check" size={12} color={colors.bg} strokeWidth={3} />
                  </View>
                  <Text style={[type.bodyStrong, styles.flex]}>{b}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.price}>
              {priceLabel(plan.price, plan.currency)} <Text style={type.caption}>/ {durationLabel(plan.durationDays)}</Text>
            </Text>
            <GradientButton title="Upgrade now" icon="Crown" colors={[colors.orange, colors.pink]} onPress={onUpgrade} style={styles.btn} />
            <GradientButton title="Maybe later" variant="ghost" size="md" onPress={onClose} style={styles.later} />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  hero: { alignItems: 'center', paddingTop: 28, paddingBottom: 22 },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.15)',
    top: -100,
    right: -50,
  },
  close: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crown: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mult: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 12,
    letterSpacing: -0.5,
  },
  title: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  body: { padding: 22, paddingTop: 18 },
  list: { gap: 10, marginTop: 16 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  price: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 20,
  },
  btn: { marginTop: 16 },
  later: { marginTop: 8 },
});
