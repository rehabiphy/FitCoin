import React, { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';

const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

export function formatNumber(n, decimals = 0) {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Counts up from the previous value to `value` with an ease-out curve. */
export default function AnimatedNumber({ value, decimals = 0, duration = 1100, prefix = '', suffix = '', style, delay = 0 }) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    let frame;
    let start;
    const startValue = from.current;
    const timer = setTimeout(() => {
      const tick = ts => {
        if (start === undefined) {
          start = ts;
        }
        const t = Math.min((ts - start) / duration, 1);
        const v = startValue + (value - startValue) * easeOutCubic(t);
        setDisplay(v);
        // Remember where we are, so a new value arriving mid-animation continues from here
        from.current = v;
        if (t < 1) {
          frame = requestAnimationFrame(tick);
        }
      };
      frame = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [value, duration, delay]);

  return (
    <Text style={style}>
      {prefix}
      {formatNumber(display, decimals)}
      {suffix}
    </Text>
  );
}
