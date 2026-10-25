import React, { useId } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

/** Branded FIT coin drawn in SVG. */
export default function CoinIcon({ size = 20 }) {
  const id = 'c' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFE18A" />
          <Stop offset="1" stopColor="#FF9A3D" />
        </LinearGradient>
      </Defs>
      <Circle cx="12" cy="12" r="11" fill={`url(#${id})`} />
      <Circle cx="12" cy="12" r="8.2" fill="none" stroke="#FFF3C4" strokeOpacity="0.55" strokeWidth="1" />
      <Path d="M13.4 5.8 8.6 13h3.2l-1.2 5.2 4.8-7.2h-3.2z" fill="#7A3E00" fillOpacity="0.85" />
    </Svg>
  );
}
