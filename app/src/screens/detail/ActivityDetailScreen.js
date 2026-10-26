import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  ZoomIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Card from '../../components/Card';
import ProgressRing from '../../components/ProgressRing';
import GradientButton from '../../components/GradientButton';
import PressableScale from '../../components/PressableScale';
import TextField from '../../components/TextField';
import Icon from '../../components/Icon';
import CoinIcon from '../../components/CoinIcon';
import BarChart from '../../components/BarChart';
import { formatNumber } from '../../components/AnimatedNumber';
import { useSteps } from '../../context/StepsContext';
import useApi from '../../hooks/useApi';
import { activitiesApi } from '../../api/engagementApi';
import { ACTIVITY_VISUALS } from '../../constants/activities';
import { colors, type, TOKEN } from '../../theme';

/** Pulsing orb shown while a live session runs (breathing gets slow 4s in/out). */
function SessionOrb({ active, color, slow }) {
  const s = useSharedValue(1);
  useEffect(() => {
    if (active) {
      const d = slow ? 4000 : 900;
      s.value = withRepeat(
        withSequence(withTiming(1.25, { duration: d, easing: Easing.inOut(Easing.sin) }), withTiming(1, { duration: d, easing: Easing.inOut(Easing.sin) })),
        -1,
      );
    } else {
      cancelAnimation(s);
      s.value = withSpring(1);
    }
  }, [active, slow, s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }], opacity: 0.25 + (s.value - 1) * 1.2 }));
  return <Animated.View style={[styles.orb, { backgroundColor: color }, style]} />;
}

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return h ? `${h}:${mm}` : mm;
}

/** Seconds since a server timestamp, ticking every second while `startedAt` is set. */
function useElapsed(startedAt) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startedAt) {
      return undefined;
    }
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  return startedAt ? Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000)) : 0;
}

const SLEEP_OPTIONS = [6, 7, 7.5, 8, 8.5, 9];

export default function ActivityDetailScreen({ route, navigation }) {
  const id = route.params?.id || 'walk';
  const visuals = ACTIVITY_VISUALS[id] || ACTIVITY_VISUALS.walk;
  const live = useSteps();
  const isWalk = id === 'walk';
  const { data, reload, setData } = useApi(() => activitiesApi.detail(id).then(d => d.activity), [id]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { text, tone: 'ok' | 'error' }
  const [sleepHours, setSleepHours] = useState(8);
  const [km, setKm] = useState('');

  const session = data?.activeSession || null;
  const elapsed = useElapsed(session?.startedAt);

  const item = data
    ? { ...data, ...visuals, ...(isWalk ? { current: Math.max(data.current, live.steps), goal: live.goal } : {}) }
    : { ...visuals, name: '', current: 0, goal: 1, unit: '', reward: 0, earned: 0, rate: '', verified: '', history: [] };
  const current = item.current;
  const progress = Math.min(current / item.goal, 1);
  const remaining = Math.max(item.goal - current, 0);
  const complete = progress >= 1;
  const decimals = current % 1 ? 1 : 0;
  const earned = isWalk ? live.fitEarnedToday : item.earned;

  const stats = [
    { label: 'Goal', value: `${formatNumber(item.goal)} ${item.unit}` },
    { label: 'Remaining', value: `${formatNumber(remaining, remaining % 1 ? 1 : 0)}` },
    { label: 'Earned today', value: `${earned}/${item.reward} ${TOKEN}` },
  ];

  /** Runs an action, shows what it earned, and refreshes the screen. */
  const act = async (fn, okText) => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await fn();
      const added = result?.fitAdded;
      setMessage({ text: added > 0 ? `${okText} · +${added} ${TOKEN}` : okText, tone: 'ok' });
      await reload();
      live.reloadWallet();
    } catch (err) {
      setMessage({ text: err.message, tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const start = () =>
    act(async () => {
      const { session: s } = await activitiesApi.startSession(id);
      setData(d => ({ ...d, activeSession: s }));
    }, 'Session started');

  const finish = () => {
    if (id === 'cycle') {
      const value = parseFloat(km.replace(',', '.'));
      if (!(value > 0)) {
        setMessage({ text: 'Enter the distance you rode in km', tone: 'error' });
        return;
      }
      act(() => activitiesApi.finishSession(session.id, value), `Ride saved · ${value} km`);
      setKm('');
      return;
    }
    act(() => activitiesApi.finishSession(session.id), `Session saved · ${Math.floor(elapsed / 60)} min`);
  };

  const cancel = () =>
    Alert.alert('Discard session?', 'This session won’t count toward your goal.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => act(() => activitiesApi.cancelSession(session.id), 'Session discarded') },
    ]);

  // Free members can only log habits they picked
  const inactive = data?.active === false;
  const changeHabits = () => {
    const inHistory = navigation.getState().routes.some(r => r.name === 'Activity');
    if (inHistory) {
      navigation.popTo('Activity', { pickHabits: true });
    } else {
      navigation.navigate('Activity', { pickHabits: true });
    }
  };

  const refresh = async () => {
    if (isWalk) {
      await live.syncNow();
    }
    await Promise.all([reload(), live.reloadWallet()]);
  };

  const historyData = (item.history || []).map((d, i, all) => ({
    day: new Date(`${d.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' }),
    value: isWalk && i === all.length - 1 ? Math.max(d.value, live.steps) : d.value,
  }));

  return (
    <Screen scroll onRefresh={refresh} edges={['top', 'bottom']} header={<Header title={item.name} />} tint={item.color} accent={item.gradient[1]} contentContainerStyle={styles.content}>
      <Animated.View entering={ZoomIn.duration(500)} style={styles.ringWrap}>
        <SessionOrb active={!!session} color={item.color} slow={id === 'breathe'} />
        <ProgressRing size={230} stroke={18} progress={progress} gradient={item.gradient}>
          <Icon name={item.icon} size={30} color={item.color} />
          <Text style={styles.big}>{formatNumber(current, decimals)}</Text>
          <Text style={type.caption}>
            of {formatNumber(item.goal)} {item.unit}
          </Text>
          {session ? <Text style={[styles.timer, { color: item.color }]}>{formatTime(elapsed)}</Text> : null}
        </ProgressRing>
      </Animated.View>

      {complete ? (
        <Animated.View entering={FadeInDown.springify()} style={styles.doneBanner}>
          <Icon name="CircleCheck" size={18} color={colors.mint} />
          <Text style={styles.doneText}>
            Goal complete! +{earned} {TOKEN} earned today
          </Text>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.stats}>
        {stats.map(s => (
          <Card key={s.label} style={styles.stat}>
            <Text style={type.caption}>{s.label}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
          </Card>
        ))}
      </Animated.View>

      {inactive ? (
        <Animated.View entering={FadeInDown.delay(180).duration(500)}>
          <Card style={styles.inactive}>
            <View style={styles.inactiveTop}>
              <Icon name="Lock" size={18} color={colors.gold} />
              <Text style={[type.bodyStrong, styles.flex]}>{item.name} isn’t one of your active habits</Text>
            </View>
            <Text style={type.body}>
              Free members earn {TOKEN} from the habits they pick. Switch one of yours to {item.name.toLowerCase()}, or go Premium to earn from every habit.
            </Text>
            <GradientButton title="Change my habits" icon="ListChecks" colors={item.gradient} onPress={changeHabits} style={styles.mt14} />
            <GradientButton title="Unlock all with Premium" icon="Crown" variant="ghost" size="md" onPress={() => navigation.navigate('Premium')} />
          </Card>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(180).duration(500)} style={[styles.actions, inactive && styles.hidden]}>
        {isWalk ? (
          <>
            <GradientButton title="Sync now" icon="RefreshCw" colors={item.gradient} onPress={live.syncNow} />
            {live.lastSyncAt ? (
              <Text style={[type.caption, styles.center]}>
                Counted automatically, even when the app is closed · synced{' '}
                {live.lastSyncAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </Text>
            ) : null}
          </>
        ) : null}

        {id === 'water' ? (
          <GradientButton title="Log a glass" icon="Plus" colors={item.gradient} loading={busy} onPress={() => act(() => activitiesApi.logWater(), 'Glass logged')} />
        ) : null}

        {id === 'sleep' ? (
          <Card>
            <Text style={type.bodyStrong}>How long did you sleep last night?</Text>
            <View style={styles.optionRow}>
              {SLEEP_OPTIONS.map(h => (
                <PressableScale key={h} onPress={() => setSleepHours(h)} style={[styles.option, sleepHours === h && { borderColor: item.color, backgroundColor: item.color + '22' }]}>
                  <Text style={[styles.optionText, sleepHours === h && { color: colors.text }]}>{h}h</Text>
                </PressableScale>
              ))}
            </View>
            <GradientButton
              title={`Log ${sleepHours} hours`}
              icon="Moon"
              colors={item.gradient}
              loading={busy}
              onPress={() => act(() => activitiesApi.logSleep(sleepHours), `${sleepHours}h logged`)}
              style={styles.mt14}
            />
          </Card>
        ) : null}

        {data?.kind === 'session' ? (
          session ? (
            <>
              {id === 'cycle' ? (
                <TextField label="Distance ridden (km)" icon="Route" placeholder="e.g. 12.5" keyboardType="decimal-pad" value={km} onChangeText={setKm} />
              ) : null}
              <GradientButton title={id === 'cycle' ? 'Finish ride' : 'Finish session'} icon="Square" colors={item.gradient} loading={busy} onPress={finish} />
              <GradientButton title="Discard" variant="ghost" size="md" onPress={cancel} disabled={busy} />
            </>
          ) : (
            <GradientButton title={id === 'cycle' ? 'Start ride' : 'Start session'} icon="Play" colors={item.gradient} loading={busy} onPress={start} />
          )
        ) : null}

        {message ? (
          <Animated.Text entering={FadeInDown} style={[styles.message, { color: message.tone === 'error' ? colors.danger : colors.mint }]}>
            {message.text}
          </Animated.Text>
        ) : null}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).duration(500)}>
        <Card style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={type.h3}>Last 7 days</Text>
            <Text style={type.caption}>{data ? `${data.goalDays}/7 goals met` : ''}</Text>
          </View>
          <BarChart data={historyData.length ? historyData : EMPTY_WEEK} />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <Card style={styles.section}>
          <Text style={type.h3}>How you earn</Text>
          <View style={styles.ruleRow}>
            <CoinIcon size={18} />
            <Text style={[type.body, styles.flex]}>
              {item.rate}, up to {item.reward} {TOKEN} per day
            </Text>
          </View>
          <View style={styles.ruleRow}>
            <Icon name="ShieldCheck" size={18} color={colors.mint} />
            <Text style={[type.body, styles.flex]}>
              Verified via {String(item.verified).toLowerCase()}. {data?.kind === 'session' ? 'Time is measured on our servers.' : 'Unusual patterns are reviewed before credit.'}
            </Text>
          </View>
          <View style={styles.ruleRow}>
            <Icon name="Flame" size={18} color={colors.orange} />
            <Text style={[type.body, styles.flex]}>Counts towards your daily streak and active challenges.</Text>
          </View>
        </Card>
      </Animated.View>
    </Screen>
  );
}

const EMPTY_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({ day, value: 0 }));

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  mt14: { marginTop: 14 },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 20, height: 260 },
  orb: { position: 'absolute', width: 230, height: 230, borderRadius: 115 },
  big: { ...type.display, fontSize: 40, marginTop: 6 },
  timer: { fontWeight: '800', marginTop: 6, fontSize: 15, letterSpacing: 1 },
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(52,245,180,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 12,
  },
  doneText: { color: colors.mint, fontWeight: '700', fontSize: 13 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14, paddingHorizontal: 6 },
  statValue: { color: colors.text, fontWeight: '800', fontSize: 14 },
  actions: { marginTop: 18, gap: 10 },
  hidden: { display: 'none' },
  inactive: { marginTop: 18, gap: 10, borderColor: 'rgba(255,201,77,0.35)' },
  inactiveTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  optionText: { color: colors.textSecondary, fontWeight: '700' },
  message: { textAlign: 'center', fontWeight: '700' },
  section: { marginTop: 16 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 14 },
});
