import React from 'react';
import * as Lucide from 'lucide-react-native';
import { colors } from '../theme';

/**
 * Renders a lucide icon by name, so data files can reference icons as strings.
 */
export default function Icon({ name, size = 22, color = colors.text, strokeWidth = 2, ...rest }) {
  const Cmp = Lucide[name] || Lucide.Sparkles;
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} {...rest} />;
}
