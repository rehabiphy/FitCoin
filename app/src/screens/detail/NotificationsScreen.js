import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutLeft, LinearTransition } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Card from '../../components/Card';
import IconBubble from '../../components/IconBubble';
import Icon from '../../components/Icon';
import useApi from '../../hooks/useApi';
import { notificationsApi } from '../../api/engagementApi';
import { isToday, themeColor, timeAgo } from '../../utils/format';
import { colors, type } from '../../theme';

const withGroup = n => ({ ...n, color: themeColor(n.color), time: timeAgo(n.createdAt), group: isToday(n.createdAt) ? 'Today' : 'Earlier' });

export default function NotificationsScreen() {
  const { data, loading, setData, reload } = useApi(() => notificationsApi.list(), []);
  const items = (data?.items || []).map(withGroup);
  const groups = ['Today', 'Earlier'];

  // Update the screen immediately, then tell the server (it's fine if that fails; the next load corrects it)
  const update = fn => setData(d => (d ? { ...d, items: fn(d.items) } : d));
  const markAll = () => {
    update(list => list.map(n => ({ ...n, unread: false })));
    notificationsApi.readAll().catch(() => {});
  };
  const dismiss = id => {
    update(list => list.filter(n => n.id !== id));
    notificationsApi.remove(id).catch(() => {});
  };
  const read = id => {
    const n = items.find(x => x.id === id);
    if (!n?.unread) {
      return;
    }
    update(list => list.map(x => (x.id === id ? { ...x, unread: false } : x)));
    notificationsApi.read(id).catch(() => {});
  };

  return (
    <Screen
      scroll
      onRefresh={reload}
      edges={['top', 'bottom']}
      header={
        <Header
          title="Notifications"
          right={
            <Pressable onPress={markAll} hitSlop={10}>
              <Icon name="CircleCheck" size={22} color={colors.cyan} />
            </Pressable>
          }
        />
      }
      contentContainerStyle={styles.content}>
      {groups.map(g => {
        const list = items.filter(n => n.group === g);
        if (!list.length) {
          return null;
        }
        return (
          <View key={g}>
            <Text style={[type.label, styles.group]}>{g}</Text>
            {list.map((n, i) => (
              <Animated.View
                key={n.id}
                entering={FadeInDown.delay(i * 60).duration(400)}
                exiting={FadeOutLeft.duration(250)}
                layout={LinearTransition.springify()}>
                <Card onPress={() => read(n.id)} style={[styles.item, n.unread && styles.unread]}>
                  <IconBubble icon={n.icon} color={n.color} size={44} />
                  <View style={styles.flex}>
                    <View style={styles.titleRow}>
                      <Text style={[type.bodyStrong, styles.flex]}>{n.title}</Text>
                      <Text style={type.caption}>{n.time}</Text>
                    </View>
                    <Text style={[type.body, styles.body]}>{n.body}</Text>
                  </View>
                  <Pressable onPress={() => dismiss(n.id)} hitSlop={10} style={styles.close}>
                    <Icon name="X" size={14} color={colors.textMuted} />
                  </Pressable>
                  {n.unread ? <View style={styles.dot} /> : null}
                </Card>
              </Animated.View>
            ))}
          </View>
        );
      })}
      {items.length === 0 && !loading ? (
        <Animated.View entering={FadeInDown} style={styles.empty}>
          <IconBubble icon="Bell" color={colors.primary} size={72} radius={24} />
          <Text style={type.h3}>You’re all caught up</Text>
          <Text style={type.body}>New rewards and reminders will show up here.</Text>
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  flex: { flex: 1 },
  group: { marginTop: 18, marginBottom: 10, marginLeft: 4 },
  item: { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },
  unread: { borderColor: 'rgba(124,92,255,0.35)', backgroundColor: 'rgba(124,92,255,0.08)' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  body: { marginTop: 3, fontSize: 13 },
  close: { padding: 2 },
  dot: { position: 'absolute', top: 14, left: 12, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.pink, borderWidth: 2, borderColor: colors.bg },
  empty: { alignItems: 'center', gap: 10, paddingTop: 80 },
});
