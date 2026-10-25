import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GradientFill } from './GradientFill';
import Icon from './Icon';
import { colors, gradients, shadow } from '../theme';

export function LogoMark({ size = 56 }) {
  return (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.3 }, shadow.glow(colors.primary)]}>
      <GradientFill colors={gradients.primary} />
      <Icon name="Zap" size={size * 0.5} color="#fff" fill="#fff" strokeWidth={1.5} />
    </View>
  );
}

export default function Logo({ size = 40, showText = true }) {
  return (
    <View style={styles.row}>
      <LogoMark size={size} />
      {showText ? (
        <Text style={[styles.text, { fontSize: size * 0.55 }]}>
          Fit<Text style={styles.accent}>coin</Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  text: { color: colors.text, fontWeight: '800', letterSpacing: -0.5 },
  accent: { color: colors.cyan },
});
