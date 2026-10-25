import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import TransactionRow from '../../components/TransactionRow';
import { filterTx } from '../main/WalletScreen';
import { transactions, wallet } from '../../data/mock';
import { colors, type, TOKEN } from '../../theme';

const FILTERS = ['All', 'Earned', 'Redeemed', 'Other'];

export default function TransactionsScreen({ navigation }) {
  const [filter, setFilter] = useState('All');
  const list = filterTx(transactions, filter);

  return (
    <Screen scroll edges={['top', 'bottom']} header={<Header title="Transaction history" />} contentContainerStyle={styles.content}>
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
          <Animated.View key={tx.id} entering={FadeInDown.delay(i * 50).duration(350)} layout={LinearTransition}>
            {i > 0 ? <View style={styles.sep} /> : null}
            <TransactionRow tx={tx} onPress={() => navigation.navigate('TransactionDetail', { id: tx.id })} />
          </Animated.View>
        ))}
      </Card>
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
  audit: { ...type.caption, textAlign: 'center', marginTop: 18 },
});
