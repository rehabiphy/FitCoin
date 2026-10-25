import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Avatar, { initialsOf } from '../../components/Avatar';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/Icon';
import IconBubble from '../../components/IconBubble';
import ProgressBar from '../../components/ProgressBar';
import PressableScale from '../../components/PressableScale';
import { TAB_BAR_SPACE } from '../../components/TabBar';
import useApi from '../../hooks/useApi';
import { statsApi } from '../../api/engagementApi';
import { colors, gradients, type } from '../../theme';

function Row({ icon, color, label, value, onPress, right, last }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.98} style={[styles.row, !last && styles.rowBorder]}>
      <IconBubble icon={icon} color={color} size={38} radius={12} />
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={type.caption}>{value}</Text> : null}
      {right || <Icon name="ChevronRight" size={18} color={colors.textMuted} />}
    </PressableScale>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user: account, signOut } = useAuth();
  const [reminders, setReminders] = useState(true);
  const go = r => () => navigation.navigate(r);

  const confirmLogout = () =>
    Alert.alert('Log out?', 'You will need to sign in again to collect rewards.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: signOut },
    ]);

  const joined = account?.createdAt
    ? new Date(account.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';
  const { data: me } = useApi(() => statsApi.me().then(d => d.stats), []);
  const user = me || { level: 1, levelName: 'Starter', xp: 0, xpLevelStart: 0, xpNext: 100, streak: 0, weeklyRank: null, lifetimeEarned: 0 };
  const earned = user.lifetimeEarned;
  const levelSpan = Math.max(1, user.xpNext - user.xpLevelStart);

  const stats = [
    { label: 'Streak', value: `${user.streak}d`, icon: 'Flame', color: colors.orange },
    { label: 'Weekly rank', value: user.weeklyRank ? `#${user.weeklyRank}` : '—', icon: 'Crown', color: colors.gold },
    { label: 'Earned', value: earned >= 1000 ? `${(earned / 1000).toFixed(1)}k` : `${Math.round(earned)}`, icon: 'Coins', color: colors.mint },
  ];

  return (
    <Screen scroll contentContainerStyle={styles.content} tint={colors.cyan} accent={colors.pink}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
        <Avatar initials={initialsOf(account?.name)} size={92} />
        <Text style={[type.h1, styles.name]}>{account?.name}</Text>
        <Text style={type.caption}>
          {account?.email} · Member since {joined}
        </Text>
        <PressableScale style={styles.edit} onPress={go('EditProfile')}>
          <Icon name="Settings" size={14} color={colors.text} />
          <Text style={styles.editText}>Edit profile</Text>
        </PressableScale>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(500)}>
        <Card>
          <View style={styles.levelRow}>
            <IconBubble icon="Award" gradient={gradients.primary} size={44} />
            <View style={styles.flex}>
              <Text style={type.h3}>
                Level {user.level} · {user.levelName}
              </Text>
              <Text style={type.caption}>
                {user.xpNext - user.xp} XP to Level {user.level + 1}
              </Text>
            </View>
            <Text style={styles.xp}>
              {user.xp}
              <Text style={type.caption}>/{user.xpNext}</Text>
            </Text>
          </View>
          <ProgressBar progress={(user.xp - user.xpLevelStart) / levelSpan} height={8} style={styles.levelBar} delay={300} />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(140).duration(500)} style={styles.stats}>
        {stats.map(s => (
          <Card key={s.label} style={styles.stat}>
            <Icon name={s.icon} size={20} color={s.color} />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={type.caption}>{s.label}</Text>
          </Card>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <Text style={[type.label, styles.groupLabel]}>Rewards</Text>
        <Card padded={false}>
          <Row icon="Medal" color={colors.pink} label="Achievements" value="5 / 8" onPress={go('Badges')} />
          <Row icon="Users" color={colors.mint} label="Refer & earn" value="+100 FIT" onPress={go('Referral')} />
          <Row icon="ShoppingBag" color={colors.gold} label="Marketplace" onPress={go('Marketplace')} />
          <Row icon="Info" color={colors.primary} label="Token & reward rules" onPress={go('TokenRules')} last />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(260).duration(500)}>
        <Text style={[type.label, styles.groupLabel]}>Preferences</Text>
        <Card padded={false}>
          <Row icon="Bell" color={colors.cyan} label="Notifications" onPress={go('Notifications')} />
          <Row
            icon="Clock"
            color={colors.blue}
            label="Daily reminders"
            onPress={() => setReminders(r => !r)}
            right={
              <Switch
                value={reminders}
                onValueChange={setReminders}
                trackColor={{ false: 'rgba(255,255,255,0.12)', true: colors.primary }}
                thumbColor="#fff"
              />
            }
          />
          <Row icon="Heart" color={colors.red} label="Connected apps" value="Health Connect" onPress={() => {}} />
          <Row icon="ShieldCheck" color={colors.mint} label="Security & privacy" onPress={() => {}} last />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(320).duration(500)}>
        <Text style={[type.label, styles.groupLabel]}>Support</Text>
        <Card padded={false}>
          <Row icon="Info" color={colors.textSecondary} label="Help center" onPress={() => {}} />
          <Row
            icon="LogOut"
            color={colors.danger}
            label="Log out"
            onPress={confirmLogout}
            right={<View />}
            last
          />
        </Card>
        <Text style={styles.version}>Fitcoin v1.0.0</Text>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: TAB_BAR_SPACE },
  flex: { flex: 1 },
  hero: { alignItems: 'center', paddingTop: 20, paddingBottom: 24, gap: 4 },
  name: { marginTop: 14 },
  edit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  editText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  xp: { color: colors.text, fontWeight: '800' },
  levelBar: { marginTop: 14 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 12 },
  stat: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14 },
  statValue: { color: colors.text, fontWeight: '800', fontSize: 18, marginTop: 4 },
  groupLabel: { marginTop: 24, marginBottom: 10, marginLeft: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '500' },
  version: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: 20 },
});
