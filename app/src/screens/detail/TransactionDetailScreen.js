import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInDown, ZoomIn } from 'react-native-reanimated';
import IconBubble from '../../components/IconBubble';
import GradientButton from '../../components/GradientButton';
import { StatusPill, txColor } from '../../components/TransactionRow';
import { formatNumber } from '../../components/AnimatedNumber';
import useApi from '../../hooks/useApi';
import { transactionsApi } from '../../api/engagementApi';
import { txView } from '../../utils/format';
import { colors, type, TOKEN } from '../../theme';

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={type.body}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const TYPE_LABEL = { earn: 'Reward', bonus: 'Bonus', redeem: 'Redemption', fee: 'Fee', expire: 'Expiry' };

/** Bottom sheet presented as a transparent modal over the wallet. */
export default function TransactionDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { data } = useApi(() => transactionsApi.get(route.params?.id).then(d => txView(d.transaction)), [route.params?.id], { focus: false });

  if (!data) {
    return (
      <Animated.View entering={FadeIn.duration(200)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => navigation.goBack()} />
      </Animated.View>
    );
  }
  const tx = data;
  const positive = tx.amount > 0;

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => navigation.goBack()} />
      <Animated.View entering={SlideInDown.springify().damping(18)} style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.handle} />
        <Animated.View entering={ZoomIn.delay(150).springify()} style={styles.center}>
          <IconBubble icon={tx.icon} color={txColor(tx)} size={64} radius={22} />
        </Animated.View>
        <Text style={[styles.amount, { color: positive ? colors.mint : colors.text }]}>
          {positive ? '+' : '−'}
          {formatNumber(Math.abs(tx.amount))} <Text style={styles.unit}>{TOKEN}</Text>
        </Text>
        <Text style={[type.h3, styles.title]}>{tx.title}</Text>
        <View style={styles.center}>
          <StatusPill status={tx.status} />
        </View>

        <View style={styles.details}>
          <Row label="Type" value={TYPE_LABEL[tx.type]} />
          {tx.subtitle ? <Row label="Details" value={tx.subtitle} /> : null}
          <Row label="Date" value={tx.date} />
          {tx.voucherCode ? <Row label="Voucher code" value={tx.voucherCode} /> : null}
          <Row label="Reference" value={tx.reference} />
          <Row label="Network" value="Off-chain ledger" />
        </View>

        <GradientButton title="Close" variant="ghost" onPress={() => navigation.goBack()} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  handle: { width: 42, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: 20 },
  center: { alignItems: 'center' },
  amount: { fontSize: 34, fontWeight: '900', textAlign: 'center', marginTop: 16 },
  unit: { fontSize: 16, color: colors.textMuted },
  title: { textAlign: 'center', marginTop: 4, marginBottom: 10 },
  details: {
    marginVertical: 22,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  value: { color: colors.text, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
});
