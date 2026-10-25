import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import Avatar from '../../components/Avatar';
import IconBubble from '../../components/IconBubble';
import ProgressBar from '../../components/ProgressBar';
import CoinIcon from '../../components/CoinIcon';
import Icon from '../../components/Icon';
import SectionHeader from '../../components/SectionHeader';
import GradientView from '../../components/GradientFill';
import { formatNumber } from '../../components/AnimatedNumber';
import { TAB_BAR_SPACE } from '../../components/TabBar';
import { badges, challenges, leaderboard, user } from '../../data/mock';
import { colors, gradients, radius, type } from '../../theme';

const FILTERS = ['All', 'Daily', 'Weekly', 'Joined'];

function RankCard({ onPress }) {
  const top = leaderboard.slice(0, 3);
  return (
    <Card onPress={onPress} padded={false}>
      <GradientView colors={['rgba(124,92,255,0.35)', 'rgba(34,211,238,0.08)']} style={styles.rankCard}>
        <View style={styles.flex}>
          <Text style={type.label}>Weekly leaderboard</Text>
          <Text style={[type.h1, styles.rankValue]}>#{user.rank}</Text>
          <Text style={type.caption}>Top 8% · 312 pts to move up</Text>
        </View>
        <View style={styles.stack}>
          {top.map((p, i) => (
            <View key={p.id} style={[styles.stackItem, { marginLeft: i ? -14 : 0, zIndex: 3 - i }]}>
              <Avatar initials={p.avatar} size={40} color={p.color} />
            </View>
          ))}
        </View>
        <Icon name="ChevronRight" color={colors.textSecondary} />
      </GradientView>
    </Card>
  );
}

function ChallengeCard({ c, onPress }) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.cardTop}>
        <IconBubble icon={c.icon} gradient={c.gradient} size={52} radius={17} />
        <View style={styles.flex}>
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: c.type === 'Daily' ? 'rgba(34,211,238,0.14)' : 'rgba(124,92,255,0.18)' }]}>
              <Text style={[styles.tagText, { color: c.type === 'Daily' ? colors.cyan : '#B6A4FF' }]}>{c.type}</Text>
            </View>
            {c.joined ? (
              <View style={[styles.tag, styles.joinedTag]}>
                <Icon name="Check" size={11} color={colors.mint} strokeWidth={3} />
                <Text style={[styles.tagText, { color: colors.mint }]}>Joined</Text>
              </View>
            ) : null}
          </View>
          <Text style={[type.h3, styles.cardTitle]}>{c.title}</Text>
        </View>
      </View>
      <Text style={[type.body, styles.desc]}>{c.description}</Text>
      {c.joined ? <ProgressBar progress={c.progress} gradient={c.gradient} height={6} style={styles.bar} /> : null}
      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Icon name="Users" size={14} color={colors.textMuted} />
          <Text style={type.caption}>{formatNumber(c.participants)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="Timer" size={14} color={colors.textMuted} />
          <Text style={type.caption}>{c.endsIn}</Text>
        </View>
        <View style={styles.flex} />
        <View style={styles.prize}>
          <CoinIcon size={14} />
          <Text style={styles.prizeText}>{c.reward}</Text>
        </View>
      </View>
    </Card>
  );
}

export default function ChallengesScreen({ navigation }) {
  const [filter, setFilter] = useState('All');
  const list = challenges.filter(c =>
    filter === 'All' ? true : filter === 'Joined' ? c.joined : c.type === filter,
  );

  return (
    <Screen scroll contentContainerStyle={styles.content} tint={colors.pink} accent={colors.primary}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.head}>
        <Text style={type.h1}>Challenges</Text>
        <Text style={type.body}>Compete, climb the ranks and win bonus rewards.</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(500)}>
        <RankCard onPress={() => navigation.navigate('Leaderboard')} />
      </Animated.View>

      <SectionHeader title="Badges" action="View all" onAction={() => navigation.navigate('Badges')} style={styles.section} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.badgeRow}>
        {badges.map((b, i) => (
          <Animated.View key={b.id} entering={FadeInDown.delay(120 + i * 50).springify()} style={styles.badge}>
            <View style={[styles.badgeIcon, !b.earned && styles.locked]}>
              {b.earned ? (
                <IconBubble icon={b.icon} color={b.color} size={58} radius={29} />
              ) : (
                <View style={styles.lockedBubble}>
                  <Icon name="Lock" size={20} color={colors.textMuted} />
                </View>
              )}
            </View>
            <Text style={[styles.badgeName, !b.earned && { color: colors.textMuted }]} numberOfLines={1}>
              {b.name}
            </Text>
          </Animated.View>
        ))}
      </ScrollView>

      <Text style={[type.h2, styles.section]}>Explore</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chips}>
        {FILTERS.map(f => (
          <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>

      {list.map((c, i) => (
        <Animated.View key={c.id} entering={FadeInDown.delay(i * 60).duration(400)} layout={LinearTransition.springify()}>
          <ChallengeCard c={c} onPress={() => navigation.navigate('ChallengeDetail', { id: c.id })} />
        </Animated.View>
      ))}
      {list.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="Target" size={36} color={colors.textMuted} />
          <Text style={type.body}>No challenges here yet.</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: TAB_BAR_SPACE },
  flex: { flex: 1 },
  head: { paddingVertical: 14, gap: 4 },
  section: { marginTop: 26, marginBottom: 14 },
  bleed: { marginHorizontal: -20 },
  rankCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderRadius: radius.lg },
  rankValue: { fontSize: 32, marginVertical: 2 },
  stack: { flexDirection: 'row' },
  stackItem: { borderRadius: 22, borderWidth: 2, borderColor: colors.bg },
  badgeRow: { paddingHorizontal: 20, gap: 14 },
  badge: { width: 70, alignItems: 'center', gap: 8 },
  badgeIcon: {},
  locked: { opacity: 0.6 },
  lockedBubble: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeName: { color: colors.text, fontSize: 11, fontWeight: '600' },
  chips: { paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  card: { marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tagRow: { flexDirection: 'row', gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 3 },
  joinedTag: { backgroundColor: 'rgba(52,245,180,0.12)' },
  tagText: { fontSize: 10.5, fontWeight: '800' },
  cardTitle: { marginTop: 5 },
  desc: { marginTop: 12 },
  bar: { marginTop: 14 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  prize: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,201,77,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  prizeText: { color: colors.gold, fontWeight: '800' },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 40 },
});
