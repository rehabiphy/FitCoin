import { useEffect, useRef, useState } from 'react';
import { useInView } from './Reveal.jsx';

const fmt = n => n.toLocaleString('en-IN');

/** Counts up from 0 to `to` once visible. */
export default function Counter({ to, duration = 1600, prefix = '', suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(to);
      return undefined;
    }
    let raf = 0;
    const start = performance.now();
    const tick = now => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref} className="counter">
      {prefix}
      {fmt(value)}
      {suffix}
    </span>
  );
}
