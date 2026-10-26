import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

/** Soft ambient glows behind every screen for the futuristic look. */
export function AmbientBackground({ tint = colors.primary, accent = colors.cyan }) {
  const base = 'a' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={base + '1'} cx="10%" cy="0%" rx="75%" ry="40%" fx="10%" fy="0%">
            <Stop offset="0" stopColor={tint} stopOpacity="0.32" />
            <Stop offset="1" stopColor={tint} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={base + '2'} cx="100%" cy="35%" rx="60%" ry="35%" fx="100%" fy="35%">
            <Stop offset="0" stopColor={accent} stopOpacity="0.14" />
            <Stop offset="1" stopColor={accent} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={colors.bg} />
        <Rect width="100%" height="100%" fill={`url(#${base}1)`} />
        <Rect width="100%" height="100%" fill={`url(#${base}2)`} />
      </Svg>
    </View>
  );
}

/**
 * Base screen: dark ambient background + safe-area padding.
 * `scroll` wraps content in a ScrollView. `edges` controls which insets are applied.
 * `onRefresh` (scroll screens) enables pull-to-refresh; the spinner stays until its promise settles.
 */
export default function Screen({
  children,
  scroll = false,
  edges = ['top'],
  contentContainerStyle,
  style,
  tint,
  accent,
  header,
  footer,
  onRefresh,
  ...rest
}) {
  const insets = useSafeAreaInsets();
  const padTop = edges.includes('top') ? insets.top : 0;
  const padBottom = edges.includes('bottom') ? insets.bottom : 0;
  const [refreshing, setRefreshing] = useState(false);
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } catch {
      // screens keep showing their last data
    } finally {
      if (mounted.current) {
        setRefreshing(false);
      }
    }
  }, [onRefresh]);

  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={colors.text}
      colors={[colors.primary, colors.cyan]}
      progressBackgroundColor={colors.surfaceAlt}
    />
  ) : undefined;

  return (
    <View style={[styles.root, style]}>
      <AmbientBackground tint={tint} accent={accent} />
      <View style={{ paddingTop: padTop }}>{header}</View>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[{ paddingBottom: padBottom + 24 }, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
          {...rest}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, { paddingBottom: padBottom }, contentContainerStyle]}>{children}</View>
      )}
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
});
