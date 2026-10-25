import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import IconBubble from './IconBubble';
import { formatNumber } from './AnimatedNumber';
import { colors, TOKEN } from '../theme';

const STATUS_COLORS = {
  Completed: colors.mint,
  Pending: colors.gold,
  Processing: colors.cyan,
  Expired: colors.textMuted,
  Failed: colors.danger,
  Rewarded: colors.mint,
};

export function StatusPill({ status }) {
  const c = STATUS_COLORS[status] || colors.textSecondary;
  return (
    <View style={[styles.pill, { backgroundColor: c + '1F' }]}>
      <View style={[styles.pillDot, { backgroundColor: c }]} />
      <Text style={[styles.pillText, { color: c }]}>{status}</Text>
    </View>
  );
}

export function txColor(tx) {
  if (tx.type === 'earn' || tx.type === 'bonus') {
    return colors.mint;
  }
  if (tx.type === 'redeem') {
    return colors.cyan;
  }
  if (tx.type === 'fee') {
    return colors.gold;
  }
  return colors.textMuted;
}

export default function TransactionRow({ tx, onPress }) {
  const positive = tx.amount > 0;
  const c = txColor(tx);
  return (
    <PressableScale onPress={onPress} scaleTo={0.98} style={styles.row}>
      <IconBubble icon={tx.icon} color={c} size={46} />
      <View style={styles.mid}>
        <Text style={styles.title} numberOfLines={1}>
          {tx.title}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {tx.date}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: positive ? colors.mint : colors.text }]}>
          {positive ? '+' : '−'}
          {formatNumber(Math.abs(tx.amount))} <Text style={styles.unit}>{TOKEN}</Text>
        </Text>
        <StatusPill status={tx.status} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  mid: { flex: 1, gap: 3 },
  title: { color: colors.text, fontSize: 14.5, fontWeight: '600' },
  sub: { color: colors.textMuted, fontSize: 12 },
  right: { alignItems: 'flex-end', gap: 5 },
  amount: { fontSize: 15, fontWeight: '800' },
  unit: { fontSize: 11, color: colors.textMuted, fontWeight: '700' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  pillDot: { width: 5, height: 5, borderRadius: 3 },
  pillText: { fontSize: 10.5, fontWeight: '700' },
});
