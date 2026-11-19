import React, { useCallback, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Card from '../../components/Card';
import IconBubble from '../../components/IconBubble';
import Icon from '../../components/Icon';
import useApi from '../../hooks/useApi';
import { notificationsApi } from '../../api/engagementApi';
import { ensurePushPermission, hasPushPermission, registerForPush } from '../../services/push';
import { colors, type } from '../../theme';

const OPTIONS = [
  {
    key: 'reminders',
    title: 'Habit reminders',
    body: 'Personal nudges for your active habits — water, steps, sleep and more — plus streak alerts.',
    icon: 'AlarmClock',
    color: colors.cyan,
  },
  {
    key: 'tips',
    title: 'Stay-healthy tips',
    body: 'One short, practical health tip a day.',
    icon: 'HeartPulse',
    color: colors.mint,
  },
  {
    key: 'rewards',
    title: 'Rewards & progress',
    body: 'FIT earned, streak bonuses, badges, challenges and referrals.',
    icon: 'Coins',
    color: colors.gold,
  },
];

export default function NotificationSettingsScreen() {
  const { data, setData } = useApi(() => notificationsApi.preferences().then(d => d.preferences), []);
  const [allowed, setAllowed] = useState(true);
  const [error, setError] = useState(null);

  // Re-check the phone's permission when coming back from system settings
  const checkPermission = useCallback(() => {
    hasPushPermission().then(setAllowed);
  }, []);

  // Ask again in-app if Android still allows it, otherwise send them to system settings
  const allow = async () => {
    if (await ensurePushPermission()) {
      setAllowed(true);
      registerForPush();
    } else {
      Linking.openSettings();
    }
  };
  useFocusEffect(
    useCallback(() => {
      checkPermission();
      const sub = AppState.addEventListener('change', s => s === 'active' && checkPermission());
      return () => sub.remove();
    }, [checkPermission]),
  );

  const toggle = async (key, value) => {
    const previous = data;
    setData(d => ({ ...d, [key]: value }));
    setError(null);
    try {
      const { preferences } = await notificationsApi.updatePreferences({ [key]: value });
      setData(preferences);
    } catch (err) {
      setData(previous);
      setError(err.message);
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']} header={<Header title="Notification settings" />} contentContainerStyle={styles.content}>
      {!allowed ? (
        <Card style={[styles.row, styles.warn]}>
          <IconBubble icon="BellOff" color={colors.orange} size={44} />
          <View style={styles.flex}>
            <Text style={type.bodyStrong}>Notifications are off</Text>
            <Text style={[type.body, styles.body]}>Allow notifications for axyio in your phone settings to get reminders and rewards.</Text>
            <Pressable onPress={allow} hitSlop={8}>
              <Text style={[type.bodyStrong, styles.link]}>Allow notifications</Text>
            </Pressable>
          </View>
        </Card>
      ) : null}

      {OPTIONS.map(o => (
        <Card key={o.key} style={styles.row}>
          <IconBubble icon={o.icon} color={o.color} size={44} />
          <View style={styles.flex}>
            <Text style={type.bodyStrong}>{o.title}</Text>
            <Text style={[type.body, styles.body]}>{o.body}</Text>
          </View>
          <Switch
            value={data ? data[o.key] !== false : true}
            disabled={!data}
            onValueChange={v => toggle(o.key, v)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </Card>
      ))}

      <View style={styles.note}>
        <Icon name="Info" size={16} color={colors.textMuted} />
        <Text style={[type.caption, styles.flex]}>
          Important account and app updates are always sent. Everything still appears in your notification list.
        </Text>
      </View>
      {error ? <Text style={[type.caption, styles.error]}>{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 12 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  warn: { alignItems: 'flex-start', borderColor: 'rgba(255,138,61,0.4)' },
  body: { marginTop: 3, fontSize: 13 },
  link: { color: colors.cyan, marginTop: 8 },
  note: { flexDirection: 'row', gap: 8, marginTop: 8, paddingHorizontal: 4 },
  error: { color: colors.danger, marginTop: 10, textAlign: 'center' },
});
