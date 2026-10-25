import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Icon from './Icon';
import { GradientFill } from './GradientFill';
import { colors, gradients, shadow } from '../theme';

const TAB_META = {
  Home: { icon: 'House', label: 'Home' },
  Wallet: { icon: 'Wallet', label: 'Wallet' },
  Challenges: { icon: 'Trophy', label: 'Compete' },
  Leaderboard: { icon: 'Crown', label: 'Ranks' },
  Profile: { icon: 'User', label: 'Profile' },
};

const SPRING = { damping: 18, stiffness: 180, mass: 0.7 };

function TabItem({ route, focused, onPress }) {
  const meta = TAB_META[route.name] || { icon: 'Sparkles', label: route.name };
  const lift = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    lift.value = withSpring(focused ? 1 : 0, SPRING);
  }, [focused, lift]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -lift.value * 2 }, { scale: 1 + lift.value * 0.06 }],
  }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: withTiming(focused ? 1 : 0.55, { duration: 200 }) }));

  return (
    <Pressable onPress={onPress} style={styles.item} hitSlop={4}>
      <Animated.View style={iconStyle}>
        <Icon name={meta.icon} size={22} color={focused ? colors.text : colors.textMuted} strokeWidth={focused ? 2.3 : 2} />
      </Animated.View>
      <Animated.Text style={[styles.label, focused && styles.labelActive, labelStyle]}>{meta.label}</Animated.Text>
    </Pressable>
  );
}

/** Floating glass tab bar with a spring-animated gradient pill behind the active tab. */
export default function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const count = state.routes.length;
  const tabWidth = width / count;
  const x = useSharedValue(0);

  useEffect(() => {
    if (tabWidth) {
      x.value = withSpring(state.index * tabWidth, SPRING);
    }
  }, [state.index, tabWidth, x]);

  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View style={styles.bar} onLayout={e => setWidth(e.nativeEvent.layout.width - 12)}>
        {width > 0 ? (
          <Animated.View style={[styles.pillTrack, { width: tabWidth }, pillStyle]}>
            <View style={[styles.pill, shadow.glow(colors.primary)]}>
              <GradientFill colors={gradients.primary} opacity={0.9} />
            </View>
          </Animated.View>
        ) : null}
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          return <TabItem key={route.key} route={route} focused={focused} onPress={onPress} />;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar: {
    flexDirection: 'row',
    height: 68,
    padding: 6,
    borderRadius: 26,
    backgroundColor: '#0F1626',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  pillTrack: { position: 'absolute', top: 6, bottom: 6, left: 6, paddingHorizontal: 4 },
  pill: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: 10.5, fontWeight: '600', color: colors.textMuted },
  labelActive: { color: colors.text, fontWeight: '700' },
});

export const TAB_BAR_SPACE = 110;
