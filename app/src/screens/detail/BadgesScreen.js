import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Card from '../../components/Card';
import ProgressRing from '../../components/ProgressRing';
import IconBubble from '../../components/IconBubble';
import Icon from '../../components/Icon';
import { badges, user } from '../../data/mock';
import { colors, gradients, type } from '../../theme';

export default function BadgesScreen() {
  const earned = badges.filter(b => b.earned).length;

  return (
    <Screen scroll edges={['top', 'bottom']} header={<Header title="Achievements" />} tint={colors.pink} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(500)}>
        <Card style={styles.summary}>
          <ProgressRing size={100} stroke={10} progress={earned / badges.length} gradient={gradients.pink}>
            <Text style={styles.count}>
              {earned}
              <Text style={type.caption}>/{badges.length}</Text>
            </Text>
          </ProgressRing>
          <View style={styles.flex}>
            <Text style={type.h2}>Badge collector</Text>
            <Text style={[type.body, styles.mt4]}>
              Level {user.level} {user.levelName}. Unlock {badges.length - earned} more badges to reach Champion tier.
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
});
