import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { AmbientBackground } from '../../components/Screen';
import GradientButton from '../../components/GradientButton';
import { GradientFill } from '../../components/GradientFill';
import Icon from '../../components/Icon';
import Logo from '../../components/Logo';
import CoinIcon from '../../components/CoinIcon';
import { onboardingSlides } from '../../data/mock';
import { colors, gradients, shadow, type } from '../../theme';

function Orbit({ size, duration, reverse, children }) {
  const r = useSharedValue(0);
  useEffect(() => {
    r.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
  }, [duration, r]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${(reverse ? -360 : 360) * r.value}deg` }] }));
  return (
    <Animated.View style={[styles.orbit, { width: size, height: size, borderRadius: size / 2 }, style]}>{children}</Animated.View>
  );
}

function Slide({ item, index, x, width }) {
  const range = [(index - 1) * width, index * width, (index + 1) * width];

  const artStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, range, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(x.value, range, [0.6, 1, 0.6], Extrapolation.CLAMP) },
      { translateY: interpolate(x.value, range, [40, 0, 40], Extrapolation.CLAMP) },
    ],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, range, [0, 1, 0], Extrapolation.CLAMP),
    transform: [{ translateX: interpolate(x.value, range, [width * 0.35, 0, -width * 0.35], Extrapolation.CLAMP) }],
  }));

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View style={[styles.art, artStyle]}>
        <Orbit size={280} duration={22000}>
          <View style={[styles.satellite, { top: -14, left: 126 }]}>
            <CoinIcon size={28} />
          </View>
        </Orbit>
        <Orbit size={210} duration={14000} reverse>
          <View style={[styles.dot, { backgroundColor: item.gradient[0], bottom: -5, left: 100 }]} />
        </Orbit>
        <View style={[styles.hero, shadow.glow(item.gradient[0])]}>
          <GradientFill colors={item.gradient} />
          <Icon name={item.icon} size={64} color="#fff" strokeWidth={1.8} />
        </View>
      </Animated.View>
      <Animated.View style={[styles.copy, textStyle]}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={[type.body, styles.body]}>{item.body}</Text>
      </Animated.View>
    </View>
  );
}

function Dot({ index, x, width }) {
  const style = useAnimatedStyle(() => {
    const range = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      width: interpolate(x.value, range, [8, 28, 8], Extrapolation.CLAMP),
      opacity: interpolate(x.value, range, [0.35, 1, 0.35], Extrapolation.CLAMP),
    };
  });
  return (
    <Animated.View style={[styles.dotIndicator, style]}>
      <GradientFill colors={gradients.primary} direction="horizontal" />
    </Animated.View>
  );
}

export default function OnboardingScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const x = useSharedValue(0);
  const ref = useRef(null);
  const [page, setPage] = useState(0);
  const last = page === onboardingSlides.length - 1;

  const onScroll = useAnimatedScrollHandler(e => {
    x.value = e.contentOffset.x;
  });

  const next = () => {
    if (last) {
      navigation.replace('Login');
    } else {
      ref.current?.scrollTo({ x: (page + 1) * width, animated: true });
    }
  };

  return (
    <View style={styles.root}>
      <AmbientBackground />
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Logo size={30} />
        {!last ? (
          <Text style={styles.skip} onPress={() => navigation.replace('Login')}>
            Skip
          </Text>
        ) : null}
      </View>

      <Animated.ScrollView
        ref={ref}
        style={styles.pager}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={e => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}>
        {onboardingSlides.map((item, i) => (
          <Slide key={item.key} item={item} index={i} x={x} width={width} />
        ))}
      </Animated.ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dots}>
          {onboardingSlides.map((s, i) => (
            <Dot key={s.key} index={i} x={x} width={width} />
          ))}
        </View>
        <GradientButton title={last ? 'Get Started' : 'Next'} iconRight="ArrowUpRight" onPress={next} />
        <Text style={styles.signin}>
          Already have an account?{' '}
          <Text style={styles.link} onPress={() => navigation.replace('Login')}>
            Sign in
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24 },
  pager: { flex: 1 },
  skip: { color: colors.textSecondary, fontSize: 15, fontWeight: '600', padding: 8 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  art: { width: 300, height: 300, alignItems: 'center', justifyContent: 'center', marginBottom: 36 },
  orbit: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderStyle: 'dashed',
  },
  satellite: { position: 'absolute' },
  dot: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
  hero: {
    width: 140,
    height: 140,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    transform: [{ rotate: '-8deg' }],
  },
  copy: { alignItems: 'center' },
  title: { ...type.display, textAlign: 'center', lineHeight: 42 },
  body: { textAlign: 'center', marginTop: 14, fontSize: 15, lineHeight: 22, maxWidth: 320 },
  bottom: { paddingHorizontal: 24, gap: 18 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dotIndicator: { height: 8, borderRadius: 4, overflow: 'hidden' },
  signin: { textAlign: 'center', color: colors.textSecondary, fontSize: 14 },
  link: { color: colors.cyan, fontWeight: '700' },
});
