import React from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SPRING = { damping: 15, stiffness: 320, mass: 0.6 };

/** Pressable that springs down slightly on touch — used for every tappable surface. */
export default function PressableScale({ children, style, scaleTo = 0.96, disabled, onPressIn, onPressOut, ...rest }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={e => {
        scale.value = withSpring(scaleTo, SPRING);
        opacity.value = withTiming(0.9, { duration: 90 });
        onPressIn && onPressIn(e);
      }}
      onPressOut={e => {
        scale.value = withSpring(1, SPRING);
        opacity.value = withTiming(1, { duration: 140 });
        onPressOut && onPressOut(e);
      }}
      style={[style, animatedStyle, disabled && { opacity: 0.5 }]}
      {...rest}>
      {children}
    </AnimatedPressable>
  );
}
