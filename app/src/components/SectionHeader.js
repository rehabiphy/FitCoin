import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { colors, type } from '../theme';

export default function SectionHeader({ title, action, onAction, style }) {
  return (
    <View style={[styles.row, style]}>
      <Text style={type.h2}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10} style={styles.action}>
          <Text style={styles.actionText}>{action}</Text>
          <Icon name="ChevronRight" size={16} color={colors.cyan} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionText: { color: colors.cyan, fontSize: 13, fontWeight: '600' },
});
