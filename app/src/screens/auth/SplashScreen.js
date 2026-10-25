import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AmbientBackground } from '../../components/Screen';
import { LogoMark } from '../../components/Logo';
import { colors, type } from '../../theme';

function Pulse({ delay, size }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }), -1, false));
  }, [delay, v]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - v.value),
    transform: [{ scale: 0.6 + v.value * 1.4 }],
  }));
  return <Animated.View style={[styles.pulse, { width: size, height: size, borderRadius: size / 2 }, style]} />;
}

/** Rendered by RootNavigator while the app starts; calls onFinish when the intro animation is done. */
export default function SplashScreen({ onFinish }) {
  const scale = useSharedValue(0.3);
  const rotate = useSharedValue(-30);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    scale.value = withSequence(withSpring(1.08, { damping: 8, stiffness: 120 }), withSpring(1));
    rotate.value = withSpring(0, { damping: 10 });
    const t = setTimeout(() => finishRef.current?.(), 2600);
    return () => clearTimeout(t);
  }, [scale, rotate]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <View style={styles.root}>
      <AmbientBackground />
      <View style={styles.center}>
        <Pulse delay={0} size={180} />
        <Pulse delay={700} size={180} />
        <Pulse delay={1400} size={180} />
        <Animated.View style={logoStyle}>
          <LogoMark size={96} />
        </Animated.View>
      </View>
      <Animated.View entering={FadeInDown.delay(500).duration(700)} style={styles.textWrap}>
        <Text style={styles.brand}>
          Fit<Text style={{ color: colors.cyan }}>coin</Text>
        </Text>
        <Text style={type.body}>Move. Earn. Redeem.</Text>
      </Animated.View>
      <Animated.Text entering={FadeIn.delay(1200)} style={styles.footer}>
        Rewards for a healthier you
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', width: 200, height: 200 },
  pulse: { position: 'absolute', borderWidth: 1.5, borderColor: colors.cyan },
  textWrap: { alignItems: 'center', marginTop: 28, gap: 6 },
  brand: { ...type.display, fontSize: 40 },
  footer: { position: 'absolute', bottom: 56, color: colors.textMuted, fontSize: 12, letterSpacing: 1 },
});
