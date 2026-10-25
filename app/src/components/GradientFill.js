import React, { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

const DIRECTIONS = {
  horizontal: { x1: '0', y1: '0', x2: '1', y2: '0' },
  vertical: { x1: '0', y1: '0', x2: '0', y2: '1' },
  diagonal: { x1: '0', y1: '0', x2: '1', y2: '1' },
};

/**
 * Absolutely-positioned SVG gradient that fills its parent.
 * Parent should set borderRadius + overflow: 'hidden' for rounded corners.
 */
export function GradientFill({ colors: stops, direction = 'diagonal', opacity = 1, style }) {
  const id = 'g' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const dir = DIRECTIONS[direction] || DIRECTIONS.diagonal;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} {...dir}>
            {stops.map((c, i) => (
              <Stop
                key={c + i}
                offset={String(stops.length === 1 ? 0 : i / (stops.length - 1))}
                stopColor={c}
                stopOpacity={opacity}
              />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/** A View with a gradient background. */
export default function GradientView({ colors: stops, direction, opacity, style, children, ...rest }) {
  return (
    <View style={[styles.clip, style]} {...rest}>
      <GradientFill colors={stops} direction={direction} opacity={opacity} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
