import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from './Icon';
import { GradientFill } from './GradientFill';

/** Rounded square tile holding an icon, tinted or with a gradient. */
export default function IconBubble({ icon, color = '#7C5CFF', gradient, size = 44, iconSize, radius = 14, style }) {
  return (
    <View
      style={[
        styles.box,
        { width: size, height: size, borderRadius: radius, backgroundColor: gradient ? undefined : color + '22' },
        style,
      ]}>
      {gradient ? <GradientFill colors={gradient} /> : null}
      <Icon name={icon} size={iconSize || size * 0.48} color={gradient ? '#FFFFFF' : color} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
