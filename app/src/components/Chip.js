import React from 'react';
import { StyleSheet, Text } from 'react-native';
import PressableScale from './PressableScale';
import { GradientFill } from './GradientFill';
import { colors, gradients, radius } from '../theme';

/** Selectable pill used for filters and segmented tabs. */
export default function Chip({ label, active, onPress, style }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.94} style={[styles.chip, active && styles.active, style]}>
      {active ? <GradientFill colors={gradients.primary} direction="horizontal" /> : null}
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  active: { borderColor: 'transparent' },
  text: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  textActive: { color: colors.text },
});
