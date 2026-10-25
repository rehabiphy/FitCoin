import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Icon from './Icon';
import { colors, radius } from '../theme';

/** Labelled input with icon, animated focus border and optional password toggle. */
export default function TextField({ ref, label, icon, secure, error, style, ...inputProps }) {
  const focus = useSharedValue(0);
  const [hidden, setHidden] = useState(!!secure);

  const boxStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? colors.danger
      : interpolateColor(focus.value, [0, 1], ['rgba(255,255,255,0.08)', colors.primary]),
    backgroundColor: interpolateColor(focus.value, [0, 1], ['rgba(255,255,255,0.04)', 'rgba(124,92,255,0.08)']),
  }));

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Animated.View style={[styles.box, boxStyle]}>
        {icon ? <Icon name={icon} size={19} color={colors.textMuted} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          style={styles.input}
          secureTextEntry={hidden}
          onFocus={() => (focus.value = withTiming(1, { duration: 180 }))}
          onBlur={() => (focus.value = withTiming(0, { duration: 180 }))}
          {...inputProps}
        />
        {secure ? (
          <Pressable onPress={() => setHidden(h => !h)} hitSlop={10}>
            <Icon name={hidden ? 'Eye' : 'EyeOff'} size={19} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </Animated.View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.2,
    paddingHorizontal: 16,
  },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 0 },
  error: { color: colors.danger, fontSize: 12, marginTop: 6, marginLeft: 4 },
});
