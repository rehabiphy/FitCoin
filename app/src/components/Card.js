import React from 'react';
import { StyleSheet, View } from 'react-native';
import PressableScale from './PressableScale';
import { colors, radius } from '../theme';

/** Glassy surface card. Becomes pressable when onPress is given. */
export default function Card({ children, style, onPress, padded = true, ...rest }) {
  const content = [styles.card, padded && styles.padded, style];
  if (onPress) {
    return (
      <PressableScale onPress={onPress} scaleTo={0.98} style={content} {...rest}>
        {children}
      </PressableScale>
    );
  }
  return (
    <View style={content} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(22,31,51,0.72)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  padded: { padding: 16 },
});
