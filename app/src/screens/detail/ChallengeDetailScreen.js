import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Avatar, { initialsOf } from '../../components/Avatar';
import ProgressRing from '../../components/ProgressRing';
import GradientButton from '../../components/GradientButton';
import IconBubble from '../../components/IconBubble';
import Icon from '../../components/Icon';
import CoinIcon from '../../components/CoinIcon';
import { formatNumber } from '../../components/AnimatedNumber';
import useApi from '../../hooks/useApi';
import { challengesApi } from '../../api/engagementApi';
import { avatarColor, timeLeft } from '../../utils/format';
import { colors, type, TOKEN } from '../../theme';

// Which activity screen the "Track" button opens, by challenge icon
const TRACK_BY_ICON = { Footprints: 'walk', Droplet: 'water', Bike: 'cycle', Wind: 'breathe', BookOpen: 'read' };

export default function ChallengeDetailScreen({ route, navigation }) {
  const id = route.params?.id;
  const insets = useSafeAreaInsets();
  const { data: c, setData, reload } = useApi(() => challengesApi.detail(id).then(d => d.challenge), [id]);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  if (!c) {
    return <Screen header={<Header title="Challenge" />} />;
  }
  const joined = c.joined;

  const join = async () => {
    setJoining(true);
    setError('');
    try {
      const { challenge } = await challengesApi.join(c.id);
      setData(challenge);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  const track = () => {
    const activity = TRACK_BY_ICON[c.icon];
    navigation.navigate(activity ? 'ActivityDetail' : 'Activity', activity ? { id: activity } : undefined);
  };

  const rules = [
    'Activity must be auto-tracked or verified to count.',
    `The prize is credited as soon as you complete it — this ${c.type.toLowerCase()} run ends in ${timeLeft(c.endsAt)}.`,
    'Duplicate or suspicious entries are excluded from rankings.',
  ];

  return (
    <Screen
      scroll
      onRefresh={reload}
      header={<Header title="Challenge" />}
      tint={c.gradient[0]}
      accent={c.gradient[1]}
      contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
      footer={
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          {joined ? (
            <Animated.View entering={FadeIn} style={styles.joinedRow}>
              <Icon name={c.completed ? 'Trophy' : 'CircleCheck'} size={20} color={c.completed ? colors.gold : colors.mint} />
              <Text style={styles.joinedText}>{c.completed ? `Completed! +${c.reward} ${TOKEN} earned` : 'You’re in! Keep going.'}</Text>
              {!c.completed ? <GradientButton title="Track" size="md" colors={c.gradient} onPress={track} /> : null}
            </Animated.View>
          ) : (
            <>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <GradientButton title={`Join challenge · win ${c.reward} ${TOKEN}`} colors={c.gradient} loading={joining} onPress={join} />
            </>
          )}
        </View>
      }>
      <Animated.View entering={ZoomIn.duration(450)} style={styles.hero}>
        <IconBubble icon={c.icon} gradient={c.gradient} size={84} radius={28} />
        <View style={styles.typeTag}>
          <Text style={styles.typeText}>{c.type} challenge</Text>
        </View>
        <Text style={[type.h1, styles.title]}>{c.title}</Text>
        <Text style={[type.body, styles.center]}>{c.description}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.statRow}>
        <Card style={styles.stat}>
          <CoinIcon size={22} />
          <Text style={styles.statValue}>{c.reward}</Text>
          <Text style={type.caption}>Prize {TOKEN}</Text>
        </Card>
        <Card style={styles.stat}>
          <Icon name="Users" size={22} color={colors.cyan} />
          <Text style={styles.statValue}>{formatNumber(c.participants)}</Text>
          <Text style={type.caption}>Joined</Text>
        </Card>
        <Card style={styles.stat}>
          <Icon name="Timer" size={22} color={colors.pink} />
          <Text style={styles.statValue}>{timeLeft(c.endsAt)}</Text>
          <Text style={type.caption}>Ends in</Text>
        </Card>
      </Animated.View>

      {joined ? (
        <Animated.View entering={FadeInDown.delay(160).duration(500)}>
          <Card style={styles.progressCard}>
            <ProgressRing size={96} stroke={10} progress={c.progress} gradient={c.gradient}>
              <Text style={styles.pct}>{Math.round(c.progress * 100)}%</Text>
            </ProgressRing>
            <View style={styles.flex}>
              <Text style={type.h3}>Your progress</Text>
              <Text style={[type.body, styles.mt4]}>{c.progressLabel}</Text>
              <Text style={[type.caption, styles.mt4]}>
                {c.percentile !== undefined ? `You’re ahead of ${c.percentile}% of participants` : 'You’re the first one here!'}
              </Text>
            </View>
          </Card>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(220).duration(500)}>
        <Card style={styles.section}>
          <Text style={type.h3}>Top participants</Text>
          {(c.topParticipants || []).map(p => (
            <View key={p.userId} style={styles.person}>
              <Text style={styles.rank}>{p.rank}</Text>
              <Avatar initials={initialsOf(p.name)} size={36} color={avatarColor(p.userId)} />
              <Text style={[type.bodyStrong, styles.flex]}>{p.isMe ? `${p.name} (you)` : p.name}</Text>
              <Text style={type.caption}>
                {formatNumber(p.progressValue, p.progressValue % 1 ? 1 : 0)} / {c.target} {c.unitLabel}
              </Text>
            </View>
          ))}
          {!c.topParticipants?.length ? <Text style={[type.caption, styles.mt4]}>No one has joined this run yet — be the first!</Text> : null}
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(280).duration(500)}>
        <Card style={styles.section}>
          <Text style={type.h3}>Rules</Text>
          {rules.map(r => (
            <View key={r} style={styles.rule}>
              <View style={[styles.bullet, { backgroundColor: c.gradient[0] }]} />
              <Text style={[type.body, styles.flex]}>{r}</Text>
            </View>
          ))}
        </Card>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  flex: { flex: 1 },
  mt4: { marginTop: 4 },
  center: { textAlign: 'center' },
  hero: { alignItems: 'center', paddingVertical: 16 },
  typeTag: { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  typeText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  title: { marginTop: 10, marginBottom: 8, textAlign: 'center' },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  stat: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14 },
  statValue: { color: colors.text, fontWeight: '800', fontSize: 16, marginTop: 4 },
  progressCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  pct: { color: colors.text, fontWeight: '800', fontSize: 18 },
  section: { marginTop: 12 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  rank: { width: 18, color: colors.textMuted, fontWeight: '800' },
  rule: { flexDirection: 'row', gap: 12, marginTop: 12, alignItems: 'flex-start' },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: 'rgba(6,9,18,0.94)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  joinedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  joinedText: { flex: 1, color: colors.text, fontWeight: '700' },
  error: { color: colors.danger, textAlign: 'center', marginBottom: 10, fontWeight: '600' },
});
