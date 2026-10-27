import { useEffect } from 'react';

/**
 * Publishes scroll position as CSS variables (--scroll in px, --progress 0..1)
 * so parallax and the progress bar are pure CSS. Also renders the progress bar.
 */
export default function ScrollEffects() {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = root.scrollHeight - window.innerHeight;
      root.style.setProperty('--scroll', String(window.scrollY));
      root.style.setProperty('--progress', String(max > 0 ? window.scrollY / max : 0));
      root.classList.toggle('scrolled', window.scrollY > 12);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return <div className="scroll-progress" aria-hidden="true" />;
}
