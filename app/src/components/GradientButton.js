import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import { GradientFill } from './GradientFill';
import Icon from './Icon';
import { colors, gradients, radius, shadow } from '../theme';

/**
 * Primary call-to-action.
 * variant: 'primary' (gradient) | 'outline' | 'ghost' | 'light'
 */
export default function GradientButton({
  title,
  onPress,
  variant = 'primary',
  colors: stops = gradients.primary,
  icon,
  iconRight,
  loading,
  disabled,
  size = 'lg',
  style,
}) {
  const isPrimary = variant === 'primary';
  const height = size === 'sm' ? 40 : size === 'md' ? 48 : 56;
  const textColor = variant === 'light' ? colors.bg : colors.text;

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        { height },
        isPrimary && shadow.glow(stops[0]),
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        variant === 'light' && styles.light,
        style,
      ]}>
      {isPrimary && <GradientFill colors={stops} direction="horizontal" style={styles.fill} />}
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 19} color={textColor} /> : null}
          <Text style={[styles.text, { color: textColor }, size === 'sm' && styles.textSm]}>{title}</Text>
          {iconRight ? <Icon name={iconRight} size={size === 'sm' ? 16 : 19} color={textColor} /> : null}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    backgroundColor: colors.surface,
  },
  fill: { borderRadius: radius.pill, overflow: 'hidden' },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.borderStrong },
  ghost: { backgroundColor: 'rgba(255,255,255,0.06)' },
  light: { backgroundColor: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  textSm: { fontSize: 13 },
});
