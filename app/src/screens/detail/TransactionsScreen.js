import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import GradientButton from '../../components/GradientButton';
import CoinIcon from '../../components/CoinIcon';
import TransactionRow from '../../components/TransactionRow';
import { TX_GROUPS } from '../main/WalletScreen';
import { useSteps } from '../../context/StepsContext';
import { transactionsApi } from '../../api/engagementApi';
import { txView } from '../../utils/format';
import { colors, type, TOKEN } from '../../theme';

const FILTERS = ['All', 'Earned', 'Redeemed', 'Other'];
const PAGE_SIZE = 20;

export default function TransactionsScreen({ navigation }) {
  const [filter, setFilter] = useState('All');
  const { wallet, reloadWallet } = useSteps();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async nextPage => {
      setLoading(true);
      try {
        const res = await transactionsApi.list({ page: nextPage, limit: PAGE_SIZE, group: TX_GROUPS[filter] });
        setItems(prev => (nextPage === 1 ? res.items : [...prev, ...res.items]));
        setHasMore(res.hasMore);
        setPage(nextPage);
      } catch {
        // keep what we have
      } finally {
        setLoading(false);
      }
    },
    [filter],
  );

  useEffect(() => {
    load(1);
    reloadWallet();
  }, [load, reloadWallet]);

  const refresh = useCallback(() => Promise.all([load(1), reloadWallet()]), [load, reloadWallet]);

  const list = items.map(txView);

  return (
    <Screen scroll onRefresh={refresh} edges={['top', 'bottom']} header={<Header title="Transaction history" />} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.summary}>
        <Card style={styles.sumCard}>
          <Text style={type.caption}>Total earned</Text>
          <Text style={[styles.sumValue, { color: colors.mint }]}>+{wallet.lifetime.toLocaleString('en-US')}</Text>
          <Text style={type.caption}>{TOKEN}</Text>
        </Card>
        <Card style={styles.sumCard}>
          <Text style={type.caption}>Total redeemed</Text>
          <Text style={styles.sumValue}>−{wallet.redeemed.toLocaleString('en-US')}</Text>
          <Text style={type.caption}>{TOKEN}</Text>
        </Card>
      </Animated.View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chips}>
        {FILTERS.map(f => (
          <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>

      <Card padded={false} style={styles.list}>
        {list.map((tx, i) => (
          <Animated.View key={tx.id} entering={FadeInDown.delay((i % PAGE_SIZE) * 40).duration(350)} layout={LinearTransition}>
            {i > 0 ? <View style={styles.sep} /> : null}
            <TransactionRow tx={tx} onPress={() => navigation.navigate('TransactionDetail', { id: tx.id })} />
          </Animated.View>
        ))}
        {list.length === 0 && !loading ? (
          <View style={styles.empty}>
            <CoinIcon size={32} />
            <Text style={type.body}>No transactions yet</Text>
          </View>
        ) : null}
      </Card>

      {hasMore ? (
        <GradientButton title="Load more" variant="ghost" size="md" loading={loading} onPress={() => load(page + 1)} style={styles.more} />
      ) : null}
      <Text style={styles.audit}>All rewards are calculated server-side and recorded in an audit log.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  bleed: { marginHorizontal: -20 },
  summary: { flexDirection: 'row', gap: 10, marginTop: 8 },
  sumCard: { flex: 1, gap: 2 },
  sumValue: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 4 },
  chips: { paddingHorizontal: 20, gap: 8, marginVertical: 18 },
  list: { paddingHorizontal: 14 },
  sep: { height: 1, backgroundColor: colors.border },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  more: { marginTop: 14 },
  audit: { ...type.caption, textAlign: 'center', marginTop: 18 },
});
