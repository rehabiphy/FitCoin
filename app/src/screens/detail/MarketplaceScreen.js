import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Chip from '../../components/Chip';
import Icon from '../../components/Icon';
import CoinIcon from '../../components/CoinIcon';
import PressableScale from '../../components/PressableScale';
import GradientView from '../../components/GradientFill';
import { formatNumber } from '../../components/AnimatedNumber';
import useApi from '../../hooks/useApi';
import { marketplaceApi } from '../../api/engagementApi';
import { useSteps } from '../../context/StepsContext';
import { colors, gradients, radius, type } from '../../theme';

function RewardCard({ r, index, onPress, balance }) {
  const affordable = balance >= r.total && r.inStock;
  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400)} layout={LinearTransition.springify()} style={styles.cell}>
      <PressableScale onPress={onPress} style={styles.reward}>
        <GradientView colors={r.gradient} style={styles.rewardArt}>
          <View style={styles.artCircle} />
          <Icon name={r.icon} size={34} color="#fff" strokeWidth={1.8} />
          {r.tag ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{r.tag}</Text>
            </View>
          ) : null}
        </GradientView>
        <View style={styles.rewardBody}>
          <Text style={type.caption}>{r.brand}</Text>
          <Text style={styles.rewardTitle} numberOfLines={2}>
            {r.title}
          </Text>
          <View style={styles.costRow}>
            <CoinIcon size={15} />
            <Text style={[styles.cost, !affordable && { color: colors.textMuted }]}>{formatNumber(r.cost)}</Text>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

export default function MarketplaceScreen({ navigation }) {
  const [cat, setCat] = useState('All');
  const [query, setQuery] = useState('');
  const { wallet, reloadWallet } = useSteps();
  const { data, loading } = useApi(async () => {
    const [{ rewards }, { categories }] = await Promise.all([marketplaceApi.rewards(), marketplaceApi.categories()]);
    reloadWallet();
    return { rewards, categories };
  }, [reloadWallet]);
  const categories = data?.categories || ['All'];

  // The whole catalog is small, so search/filter instantly on the phone
  const list = useMemo(
    () =>
      (data?.rewards || []).filter(
        r =>
          (cat === 'All' || r.category === cat) &&
          (r.title + r.brand).toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [data, cat, query],
  );

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      tint={colors.gold}
      accent={colors.pink}
      header={
        <Header
          title="Marketplace"
          right={
            <View style={styles.balancePill}>
              <CoinIcon size={14} />
              <Text style={styles.balanceText}>{formatNumber(Math.floor(wallet.balance))}</Text>
            </View>
          }
        />
      }
      contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.search}>
        <Icon name="Search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search rewards, brands…"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(500)}>
        <GradientView colors={gradients.pink} style={styles.banner}>
          <View style={styles.flex}>
            <Text style={styles.bannerLabel}>LIMITED DROP</Text>
            <Text style={styles.bannerTitle}>Double value on{'\n'}fitness passes</Text>
            <Text style={styles.bannerSub}>Ends Sunday · 2× FIT value</Text>
          </View>
          <View style={styles.bannerIcon}>
            <Icon name="Dumbbell" size={44} color="#fff" />
          </View>
        </GradientView>
      </Animated.View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chips}>
        {categories.map(c => (
          <Chip key={c} label={c} active={cat === c} onPress={() => setCat(c)} />
        ))}
      </ScrollView>

      <View style={styles.grid}>
        {list.map((r, i) => (
          <RewardCard key={r.id} r={r} index={i} balance={wallet.balance} onPress={() => navigation.navigate('RewardDetail', { id: r.slug })} />
        ))}
      </View>
      {list.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Icon name="Search" size={32} color={colors.textMuted} />
          <Text style={type.body}>No rewards match your search</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  flex: { flex: 1 },
  bleed: { marginHorizontal: -20 },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,201,77,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    position: 'absolute',
    right: 0,
  },
  balanceText: { color: colors.gold, fontWeight: '800', fontSize: 12 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6,
  },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 0 },
  banner: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, padding: 20, marginTop: 16 },
  bannerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  bannerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 6, lineHeight: 25 },
  bannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 8 },
  bannerIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-15deg' }],
  },
  chips: { paddingHorizontal: 20, gap: 8, marginVertical: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cell: { width: '48%', marginBottom: 14 },
  reward: {
    borderRadius: radius.lg,
    backgroundColor: 'rgba(22,31,51,0.8)',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  rewardArt: { height: 110, alignItems: 'center', justifyContent: 'center' },
  artCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
    right: -40,
    bottom: -50,
  },
  tag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(6,9,18,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  rewardBody: { padding: 12, gap: 3 },
  rewardTitle: { color: colors.text, fontWeight: '700', fontSize: 14, minHeight: 36 },
  costRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  cost: { color: colors.gold, fontWeight: '800', fontSize: 15 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 40 },
});
