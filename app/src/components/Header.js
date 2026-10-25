import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PressableScale from './PressableScale';
import Icon from './Icon';
import { colors, type } from '../theme';

export function IconButton({ icon, onPress, badge, style, size = 20 }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.9} style={[styles.iconBtn, style]} hitSlop={8}>
      <Icon name={icon} size={size} color={colors.text} />
      {badge ? <View style={styles.badge} /> : null}
    </PressableScale>
  );
}

/** Stack header with back button, centred title and optional right action. */
export default function Header({ title, right, onBack, showBack = true }) {
  const navigation = useNavigation();
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {showBack ? <IconButton icon="ChevronLeft" size={22} onPress={onBack || (() => navigation.goBack())} /> : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  side: { width: 44 },
  right: { alignItems: 'flex-end' },
  title: { ...type.h3, flex: 1, textAlign: 'center', fontSize: 17 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.pink,
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
});
