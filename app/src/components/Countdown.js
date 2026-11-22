import React, { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { timeLeft } from '../utils/format';

/**
 * Live "time left" that ticks every second ("00:49:12", "2d 14:05:09", "Ended").
 * `onEnd` runs once when it reaches zero (e.g. to load the next challenge run).
 */
export default function Countdown({ endsAt, onEnd, style, numberOfLines = 1 }) {
  const [now, setNow] = useState(Date.now());
  const ended = useRef(false);
  const end = new Date(endsAt).getTime();

  useEffect(() => {
    ended.current = false;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  useEffect(() => {
    if (now >= end && !ended.current) {
      ended.current = true;
      onEnd?.();
    }
  }, [now, end, onEnd]);

  return (
    <Text style={[style, { fontVariant: ['tabular-nums'] }]} numberOfLines={numberOfLines}>
      {timeLeft(endsAt, now)}
    </Text>
  );
}
