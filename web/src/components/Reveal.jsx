import { useEffect, useRef, useState } from 'react';

/** True once the element has scrolled into view (stays true). */
export function useInView(ref, { rootMargin = '0px 0px -8% 0px', threshold = 0.12 } = {}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, threshold]);
  return inView;
}

/**
 * Animates its children in when scrolled into view.
 * variant: up | down | left | right | zoom | fade | blur
 */
export default function Reveal({ as: Tag = 'div', variant = 'up', delay = 0, className = '', style, children, ...rest }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  return (
    <Tag
      ref={ref}
      className={`reveal reveal-${variant}${inView ? ' is-in' : ''}${className ? ` ${className}` : ''}`}
      style={{ '--d': `${delay}s`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
