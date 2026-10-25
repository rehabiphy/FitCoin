import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { GradientFill } from './GradientFill';
import { colors } from '../theme';

/** Horizontal animated progress bar with gradient fill. */
export default function ProgressBar({ progress = 0, gradient = [colors.primary, colors.cyan], height = 8, delay = 0, style }) {
  const value = useSharedValue(0);

  useEffect(() => {
    value.value = withDelay(delay, withTiming(Math.min(Math.max(progress, 0), 1), { duration: 1000, easing: Easing.out(Easing.cubic) }));
  }, [progress, delay, value]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${value.value * 100}%` }));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }, style]}>
      <Animated.View style={[styles.fill, { borderRadius: height / 2 }, fillStyle]}>
        <GradientFill colors={gradient} direction="horizontal" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  fill: { height: '100%', overflow: 'hidden' },
});
