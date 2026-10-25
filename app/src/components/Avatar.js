import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GradientFill } from './GradientFill';
import { colors } from '../theme';

/** "Parth Panchal" -> "PP" */
export const initialsOf = name =>
  (name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('') || 'FC';

/** Initials avatar with gradient ring. */
export default function Avatar({ initials = 'FC', size = 44, color = colors.primary, ring = true }) {
  const inner = ring ? size - 5 : size;
  return (
    <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}>
      {ring ? <GradientFill colors={[color, colors.cyan]} /> : null}
      <View
        style={[
          styles.inner,
          { width: inner, height: inner, borderRadius: inner / 2, backgroundColor: ring ? colors.surfaceAlt : color + '33' },
        ]}>
        <Text style={[styles.text, { fontSize: size * 0.34, color: ring ? colors.text : color }]}>{initials}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  inner: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '800' },
});
