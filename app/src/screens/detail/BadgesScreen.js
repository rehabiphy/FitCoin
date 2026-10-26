import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Card from '../../components/Card';
import ProgressRing from '../../components/ProgressRing';
import IconBubble from '../../components/IconBubble';
import Icon from '../../components/Icon';
import useApi from '../../hooks/useApi';
import { badgesApi, statsApi } from '../../api/engagementApi';
import { themeColor } from '../../utils/format';
import { colors, gradients, type } from '../../theme';

export default function BadgesScreen() {
  const { data, reload } = useApi(() => badgesApi.list(), []);
  const { data: stats, reload: reloadStats } = useApi(() => statsApi.me().then(d => d.stats), []);
  const refresh = useCallback(() => Promise.all([reload(), reloadStats()]), [reload, reloadStats]);
  const badges = (data?.badges || []).map(b => ({ ...b, color: themeColor(b.color) }));
  const earned = badges.filter(b => b.earned).length;
  const total = badges.length || 1;
  const left = badges.length - earned;

  return (
    <Screen scroll onRefresh={refresh} edges={['top', 'bottom']} header={<Header title="Achievements" />} tint={colors.pink} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(500)}>
        <Card style={styles.summary}>
          <ProgressRing size={100} stroke={10} progress={earned / total} gradient={gradients.pink}>
            <Text style={styles.count}>
              {earned}
              <Text style={type.caption}>/{badges.length}</Text>
            </Text>
          </ProgressRing>
          <View style={styles.flex}>
            <Text style={type.h2}>Badge collector</Text>
            <Text style={[type.body, styles.mt4]}>
              {stats ? `Level ${stats.level} ${stats.levelName}. ` : ''}
              {left > 0 ? `Unlock ${left} more badge${left > 1 ? 's' : ''} to complete your collection.` : 'You’ve unlocked every badge!'}
            </Text>
          </View>
        </Card>
      </Animated.View>

      <View style={styles.grid}>
        {badges.map((b, i) => (
          <Animated.View key={b.id} entering={ZoomIn.delay(100 + i * 60).springify()} style={styles.cell}>
            <Card style={[styles.badge, !b.earned && styles.locked]}>
              <View>
                <IconBubble icon={b.icon} color={b.earned ? b.color : colors.textMuted} size={64} radius={32} />
                {!b.earned ? (
                  <View style={styles.lock}>
                    <Icon name="Lock" size={12} color={colors.text} />
                  </View>
                ) : null}
              </View>
              <Text style={[type.bodyStrong, styles.name]}>{b.name}</Text>
              <Text style={[type.caption, styles.center]}>{b.desc}</Text>
              {!b.earned && b.target > 1 ? (
                <Text style={[type.caption, styles.progress]}>
                  {b.progressValue} / {b.target}
                </Text>
              ) : null}
            </Card>
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  flex: { flex: 1 },
  mt4: { marginTop: 4 },
  center: { textAlign: 'center' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 8 },
  count: { color: colors.text, fontWeight: '900', fontSize: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 16 },
  cell: { width: '48%', marginBottom: 14 },
  badge: { alignItems: 'center', paddingVertical: 20, gap: 4 },
  locked: { opacity: 0.55 },
  lock: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { marginTop: 10 },
  progress: { marginTop: 4, color: colors.textSecondary, fontWeight: '700' },
});
