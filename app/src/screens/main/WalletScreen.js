import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import GradientView from '../../components/GradientFill';
import AnimatedNumber from '../../components/AnimatedNumber';
import CoinIcon from '../../components/CoinIcon';
import Icon from '../../components/Icon';
import IconBubble from '../../components/IconBubble';
import PressableScale from '../../components/PressableScale';
import SectionHeader from '../../components/SectionHeader';
import TransactionRow from '../../components/TransactionRow';
import { TAB_BAR_SPACE } from '../../components/TabBar';
import { transactions, wallet } from '../../data/mock';
import { colors, gradients, radius, type, TOKEN } from '../../theme';

const FILTERS = ['All', 'Earned', 'Redeemed', 'Other'];

export function filterTx(list, f) {
  if (f === 'Earned') {
    return list.filter(t => t.type === 'earn');
  }
  if (f === 'Redeemed') {
    return list.filter(t => t.type === 'redeem');
  }
  if (f === 'Other') {
    return list.filter(t => t.type === 'fee' || t.type === 'expire');
  }
  return list;
}

function WalletCard() {
  return (
    <GradientView colors={gradients.wallet} style={styles.card}>
      <View style={styles.ring1} />
      <View style={styles.ring2} />
      <View style={styles.cardTop}>
        <View style={styles.chip}>
          <Icon name="Wallet" size={14} color="#fff" />
          <Text style={styles.chipText}>Rewards wallet</Text>
        </View>
        <Icon name="Zap" size={22} color="#fff" fill="#fff" />
      </View>
      <Text style={styles.cardLabel}>Available balance</Text>
      <View style={styles.balanceRow}>
        <AnimatedNumber value={wallet.balance} decimals={2} style={styles.balance} />
        <Text style={styles.unit}>{TOKEN}</Text>
      </View>
      <Text style={styles.approx}>≈ ₹{(wallet.balance * 0.5).toFixed(2)} in marketplace value</Text>
      <View style={styles.cardFoot}>
        <View>
          <Text style={styles.footLabel}>Pending</Text>
          <Text style={styles.footValue}>{wallet.pending} {TOKEN}</Text>
        </View>
        <View style={styles.footDivider} />
        <View>
          <Text style={styles.footLabel}>Lifetime earned</Text>
          <Text style={styles.footValue}>{wallet.lifetime.toLocaleString('en-US')} {TOKEN}</Text>
        </View>
      </View>
    </GradientView>
  );
}

export default function WalletScreen({ navigation }) {
  const [filter, setFilter] = useState('All');
  const list = filterTx(transactions, filter).slice(0, 6);

  const actions = [
    { label: 'Refer', icon: 'Users', color: colors.mint, onPress: () => navigation.navigate('Referral') },
    { label: 'History', icon: 'Clock', color: colors.cyan, onPress: () => navigation.navigate('Transactions') },
    { label: 'Rules', icon: 'Info', color: colors.primary, onPress: () => navigation.navigate('TokenRules') },
  ];

  return (
    <Screen scroll contentContainerStyle={styles.content} tint={colors.primary} accent={colors.gold}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.head}>
        <Text style={type.h1}>Wallet</Text>
        <PressableScale style={styles.qr} onPress={() => navigation.navigate('Referral')}>
          <Icon name="QrCode" size={20} color={colors.text} />
        </PressableScale>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(600)}>
        <WalletCard />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(600)} style={styles.actions}>
        {actions.map(a => (
          <PressableScale key={a.label} onPress={a.onPress} style={styles.action}>
            <IconBubble icon={a.icon} color={a.color} size={52} radius={18} />
            <Text style={styles.actionText}>{a.label}</Text>
          </PressableScale>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(220).duration(600)}>
        <Card style={styles.expiry}>
          <IconBubble icon="Hourglass" color={colors.orange} size={42} />
          <View style={styles.flex}>
            <Text style={type.bodyStrong}>
              {wallet.expiringSoon} {TOKEN} expiring soon
            </Text>
            <Text style={type.caption}>Use them before {wallet.expiryDate}</Text>
          </View>
          <PressableScale style={styles.useBtn} onPress={() => navigation.navigate('Marketplace')}>
            <Text style={styles.useText}>Use now</Text>
          </PressableScale>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(260).duration(600)}>
        <Card style={styles.soon}>
          <Icon name="Lock" size={18} color={colors.textMuted} />
          <View style={styles.flex}>
            <Text style={[type.bodyStrong, { color: colors.textSecondary }]}>Transfers & withdrawals</Text>
            <Text style={type.caption}>On-chain features are coming in a future update.</Text>
          </View>
          <View style={styles.soonTag}>
            <Text style={styles.soonText}>SOON</Text>
          </View>
        </Card>
      </Animated.View>

      <SectionHeader title="Transactions" action="See all" onAction={() => navigation.navigate('Transactions')} style={styles.section} />
      <View style={styles.chips}>
        {FILTERS.map(f => (
          <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>
      <Card padded={false} style={styles.txCard}>
        {list.map((tx, i) => (
          <Animated.View key={tx.id} entering={FadeInDown.delay(i * 50).duration(350)} layout={LinearTransition}>
            {i > 0 ? <View style={styles.sep} /> : null}
            <TransactionRow tx={tx} onPress={() => navigation.navigate('TransactionDetail', { id: tx.id })} />
          </Animated.View>
        ))}
        {list.length === 0 ? (
          <View style={styles.empty}>
            <CoinIcon size={32} />
            <Text style={type.body}>No transactions yet</Text>
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: TAB_BAR_SPACE },
  flex: { flex: 1 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  qr: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { borderRadius: radius.xl, padding: 22, minHeight: 210 },
  ring1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 30,
    borderColor: 'rgba(255,255,255,0.06)',
    right: -110,
    top: -100,
  },
  ring2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 18,
    borderColor: 'rgba(255,255,255,0.05)',
    left: -70,
    bottom: -90,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(6,9,18,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cardLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 22 },
  balanceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 4 },
  balance: { color: '#fff', fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  unit: { color: 'rgba(255,255,255,0.8)', fontWeight: '800', fontSize: 16, marginBottom: 7 },
  approx: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  footLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  footValue: { color: '#fff', fontWeight: '800', marginTop: 2 },
  footDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.18)' },
  actions: { flexDirection: 'row', marginTop: 22 },
  action: { alignItems: 'center', gap: 8, flex: 1 },
  actionText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  expiry: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22, borderColor: 'rgba(255,138,61,0.25)' },
  useBtn: { backgroundColor: 'rgba(255,138,61,0.16)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  useText: { color: colors.orange, fontWeight: '800', fontSize: 12 },
  soon: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, paddingVertical: 12 },
  soonTag: { backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  soonText: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  section: { marginTop: 28 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  txCard: { paddingHorizontal: 14 },
  sep: { height: 1, backgroundColor: colors.border },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 32 },
});
