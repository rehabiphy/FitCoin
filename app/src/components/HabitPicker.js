import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { backdropIn, sheetIn } from './motion';
import IconBubble from './IconBubble';
import Icon from './Icon';
import GradientButton from './GradientButton';
import PressableScale from './PressableScale';
import { activitiesApi } from '../api/engagementApi';
import { colors, radius, type, TOKEN } from '../theme';

const GROUP_HINTS = {
  movement: 'Walking or cycling',
  lifestyle: 'Water, sleep, reading or breathing',
};

/** "1 movement + 2 lifestyle" */
export const picksLabel = groups => groups.map(g => `${g.limit} ${g.name.toLowerCase()}`).join(' + ');

/**
 * Bottom sheet where a free member picks which habits earn FIT, per group
 * (by default 1 movement + 2 lifestyle; limits come from the admin panel).
 * `info` is `habits` from GET /activities; `activities` are today's habits with visuals.
 * Calls onSaved with the refreshed today payload.
 */
export default function HabitPicker({ visible, info, activities, onClose, onSaved, onGoPremium }) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Start from the current picks each time the sheet opens
  useEffect(() => {
    if (visible && info) {
      setSelected(info.active);
      setError('');
    }
  }, [visible, info]);

  if (!info) {
    return null;
  }
  const { groups, locked } = info;
  const countIn = g => selected.filter(id => g.ids.includes(id)).length;
  const unchanged = selected.length === info.active.length && selected.every(id => info.active.includes(id));
  const byId = Object.fromEntries(activities.map(a => [a.id, a]));

  const toggle = (a, g) => {
    setError('');
    if (selected.includes(a.id)) {
      if (locked.includes(a.id)) {
        setError(`${a.name} already earned ${TOKEN} or has a session running today, so it stays active until tomorrow.`);
        return;
      }
      setSelected(s => s.filter(id => id !== a.id));
      return;
    }
    if (g.limit === 0) {
      setError(`${g.name} habits are Premium only.`);
      return;
    }
    if (countIn(g) >= g.limit) {
      // One pick in this group: swap straight to the new one, if the old one isn't locked
      const current = selected.filter(id => g.ids.includes(id));
      const swappable = current.filter(id => !locked.includes(id));
      if (g.limit === 1 && swappable.length === 1) {
        setSelected(s => [...s.filter(id => id !== swappable[0]), a.id]);
        return;
      }
      setError(`You can pick ${g.limit} ${g.name.toLowerCase()} habit${g.limit === 1 ? '' : 's'}. Remove one first, or go Premium to unlock all.`);
      return;
    }
    setSelected(s => [...s, a.id]);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      onSaved(await activitiesApi.selectHabits(selected));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <Animated.View entering={backdropIn} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={saving ? undefined : onClose} accessibilityLabel="Close" />
        <Animated.View entering={sheetIn} style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <Text style={type.h2}>Choose your habits</Text>
            <Text style={[type.body, styles.mt6]}>
              Free members earn {TOKEN} from {picksLabel(groups)} habits. Pick the ones you’ll do every day — you can change them anytime.
            </Text>

            {groups.map(g => {
              const count = countIn(g);
              const full = count >= g.limit;
              return (
                <View key={g.id} style={styles.group}>
                  <View style={styles.groupHead}>
                    <View style={styles.flex}>
                      <Text style={type.label}>{g.name}</Text>
                      <Text style={type.caption}>{g.limit === 0 ? 'Premium only' : `Pick ${g.limit} · ${GROUP_HINTS[g.id] || ''}`}</Text>
                    </View>
                    <View style={[styles.counter, full && g.limit > 0 && styles.counterFull]}>
                      <Text style={[styles.counterText, full && g.limit > 0 && { color: colors.mint }]}>
                        {count} / {g.limit}
                      </Text>
                    </View>
                  </View>
                  {g.ids
                    .map(id => byId[id])
                    .filter(Boolean)
                    .map(a => {
                      const on = selected.includes(a.id);
                      const isLocked = on && locked.includes(a.id);
                      return (
                        <PressableScale
                          key={a.id}
                          onPress={() => toggle(a, g)}
                          scaleTo={0.98}
                          style={[styles.row, on && { borderColor: a.color, backgroundColor: a.color + '14' }, !on && full && g.limit !== 1 && styles.rowDim]}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: on }}
                          accessibilityLabel={a.name}>
                          <IconBubble icon={a.icon} gradient={on ? a.gradient : undefined} color={a.color} size={40} radius={13} />
                          <View style={styles.flex}>
                            <Text style={type.bodyStrong}>{a.name}</Text>
                            <Text style={type.caption}>
                              {isLocked ? 'Earned today · locked until tomorrow' : `${a.rate} · up to ${a.reward} ${TOKEN}/day`}
                            </Text>
                          </View>
                          <View style={[styles.check, on && { backgroundColor: a.color, borderColor: a.color }]}>
                            {isLocked ? (
                              <Icon name="Lock" size={12} color={colors.bg} strokeWidth={3} />
                            ) : on ? (
                              <Icon name="Check" size={13} color={colors.bg} strokeWidth={3} />
                            ) : null}
                          </View>
                        </PressableScale>
                      );
                    })}
                </View>
              );
            })}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <GradientButton
              title={unchanged && info.chosen ? 'No changes' : `Save ${selected.length} habit${selected.length === 1 ? '' : 's'}`}
              loading={saving}
              disabled={!selected.length || (unchanged && info.chosen)}
              onPress={save}
              style={styles.save}
            />
            {onGoPremium ? (
              <Pressable onPress={onGoPremium} style={styles.premium} hitSlop={8}>
                <Icon name="Crown" size={16} color={colors.gold} />
                <Text style={styles.premiumText}>Unlock all {info.total} habits with Premium</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  mt6: { marginTop: 6 },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '90%',
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  handle: { width: 42, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: 18 },
  group: { gap: 8, marginTop: 20 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 2 },
  counter: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
  counterFull: { backgroundColor: 'rgba(52,245,180,0.14)' },
  counterText: { color: colors.textSecondary, fontWeight: '800', fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  rowDim: { opacity: 0.55 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { color: colors.danger, textAlign: 'center', marginTop: 14, fontWeight: '600' },
  save: { marginTop: 20 },
  premium: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 },
  premiumText: { color: colors.gold, fontWeight: '700' },
});
