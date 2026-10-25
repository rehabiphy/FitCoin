import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { GradientFill } from './GradientFill';
import { colors, gradients } from '../theme';

function Bar({ value, max, index, highlight, height }) {
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = withDelay(index * 70, withTiming(value / max, { duration: 800, easing: Easing.out(Easing.back(1.2)) }));
  }, [value, max, index, h]);

  const style = useAnimatedStyle(() => ({ height: Math.max(h.value * height, 4) }));

  return (
    <Animated.View style={[styles.bar, style, !highlight && styles.barDim]}>
      <GradientFill colors={highlight ? gradients.primary : ['rgba(124,92,255,0.45)', 'rgba(34,211,238,0.25)']} direction="vertical" />
    </Animated.View>
  );
}

/** Animated weekly bar chart. Last item is highlighted as "today". */
export default function BarChart({ data, height = 110, highlightIndex = data.length - 1 }) {
  const max = Math.max(...data.map(d => d.value)) * 1.1;
  return (
    <View>
      <View style={[styles.row, { height }]}>
        {data.map((d, i) => (
          <View key={d.day} style={styles.col}>
            <Bar value={d.value} max={max} index={i} height={height} highlight={i === highlightIndex} />
          </View>
        ))}
      </View>
      <View style={styles.labels}>
        {data.map((d, i) => (
          <Text key={d.day} style={[styles.label, i === highlightIndex && styles.labelActive]}>
            {d.day}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  bar: { width: 22, borderRadius: 8, overflow: 'hidden' },
  barDim: { opacity: 0.9 },
  labels: { flexDirection: 'row', marginTop: 10 },
  label: { flex: 1, textAlign: 'center', color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  labelActive: { color: colors.text },
});
