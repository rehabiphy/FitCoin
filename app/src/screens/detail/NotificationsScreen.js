import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutLeft, LinearTransition } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Card from '../../components/Card';
import IconBubble from '../../components/IconBubble';
import Icon from '../../components/Icon';
import { notifications as initial } from '../../data/mock';
import { colors, type } from '../../theme';

export default function NotificationsScreen() {
  const [items, setItems] = useState(initial);
  const groups = ['Today', 'Earlier'];

  const markAll = () => setItems(list => list.map(n => ({ ...n, unread: false })));
  const dismiss = id => setItems(list => list.filter(n => n.id !== id));
  const read = id => setItems(list => list.map(n => (n.id === id ? { ...n, unread: false } : n)));

  return (
    <Screen
      scroll
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
      {items.length === 0 ? (
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
