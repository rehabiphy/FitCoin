import React from 'react';
import { Image } from 'react-native';

const wordmark = require('../assets/logo-wordmark.png');
const ASPECT = 824 / 309; // width / height of logo-wordmark.png

/** The axyio wordmark. `size` is its height in dp. */
export default function Logo({ size = 40, style }) {
  return (
    <Image
      source={wordmark}
      style={[{ height: size, width: size * ASPECT }, style]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="axyio"
    />
  );
}

export const LogoMark = Logo;
