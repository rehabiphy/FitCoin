import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import GradientButton from '../../components/GradientButton';
import IconBubble from '../../components/IconBubble';
import { colors, gradients, radius, type } from '../../theme';

const LENGTH = 6;

function Cell({ char, active, filled }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (filled) {
      scale.value = withSequence(withTiming(1.12, { duration: 90 }), withSpring(1));
    }
  }, [filled, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.cell, active && styles.cellActive, filled && styles.cellFilled, style]}>
      <Text style={styles.cellText}>{char}</Text>
      {active ? <View style={styles.caret} /> : null}
    </Animated.View>
  );
}

export default function OtpScreen({ navigation, route }) {
  const target = route.params?.target || 'your phone';
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const verify = () => {
    if (code.length < LENGTH) {
      setError('Enter the 6-digit code');
      shake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }, 1000);
  };

  return (
    <Screen edges={['top', 'bottom']} header={<Header title="Verification" />} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.intro}>
        <IconBubble icon="ShieldCheck" gradient={gradients.mint} size={72} radius={24} />
        <Text style={[type.h1, styles.title]}>Enter the code</Text>
        <Text style={[type.body, styles.center]}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.target}>{target}</Text>
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(500)}>
        <Pressable onPress={() => inputRef.current?.focus()}>
          <Animated.View style={[styles.row, shakeStyle]}>
            {Array.from({ length: LENGTH }).map((_, i) => (
              <Cell key={i} char={code[i] || ''} filled={!!code[i]} active={i === code.length} />
            ))}
          </Animated.View>
        </Pressable>
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={t => {
            setError('');
            setCode(t.replace(/[^0-9]/g, '').slice(0, LENGTH));
          }}
          keyboardType="number-pad"
          maxLength={LENGTH}
          autoFocus
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          style={styles.hidden}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Animated.View>

      <View style={styles.resendRow}>
        {seconds > 0 ? (
          <Text style={type.body}>
            Resend code in <Text style={styles.target}>0:{String(seconds).padStart(2, '0')}</Text>
          </Text>
        ) : (
          <Text style={styles.link} onPress={() => setSeconds(30)}>
            Resend code
          </Text>
        )}
      </View>

      <View style={styles.spacer} />
      <GradientButton title="Verify & Continue" onPress={verify} loading={loading} style={styles.cta} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24 },
  intro: { alignItems: 'center', marginTop: 16, marginBottom: 32 },
  title: { marginTop: 20, marginBottom: 8 },
  center: { textAlign: 'center' },
  target: { color: colors.text, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cell: {
    flex: 1,
    aspectRatio: 0.85,
    maxHeight: 62,
    borderRadius: radius.md,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: { borderColor: colors.primary, backgroundColor: 'rgba(124,92,255,0.08)' },
  cellFilled: { borderColor: 'rgba(34,211,238,0.5)' },
  cellText: { color: colors.text, fontSize: 24, fontWeight: '800' },
  caret: { position: 'absolute', width: 2, height: 24, backgroundColor: colors.primary, borderRadius: 1 },
  hidden: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  error: { color: colors.danger, textAlign: 'center', marginTop: 14 },
  resendRow: { alignItems: 'center', marginTop: 28 },
  link: { color: colors.cyan, fontWeight: '700', fontSize: 15 },
  spacer: { flex: 1 },
  cta: { marginBottom: 16 },
});
