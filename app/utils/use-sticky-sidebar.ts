import {useEffect, useRef} from 'react';

const HEADER_HEIGHT = 96; // 6rem

/**
 * Makes the shorter of two columns sticky so it pins to the bottom
 * of the viewport when you've scrolled past its content, while the
 * taller column continues scrolling normally.
 *
 * On scroll, the shorter column gets `position: sticky` with a `top`
 * value calculated so its bottom edge aligns with the viewport bottom.
 */
export function useStickyColumn(columnRef: React.RefObject<HTMLElement | null>) {
  const rafId = useRef<number>(0);

  useEffect(() => {
    const el = columnRef.current;
    if (!el) return;

    function update() {
      if (!el) return;
      const columnHeight = el.scrollHeight;
      const viewportHeight = window.innerHeight;

      if (columnHeight <= viewportHeight - HEADER_HEIGHT) {
        // Column fits in viewport — just stick to top below header
        el.style.position = 'sticky';
        el.style.top = `${HEADER_HEIGHT}px`;
      } else {
        // Column is taller than viewport — stick so bottom aligns with viewport bottom
        const stickyTop = -(columnHeight - viewportHeight);
        el.style.position = 'sticky';
        el.style.top = `${stickyTop}px`;
      }
    }

    // Run on mount and on resize
    update();

    function onResize() {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(update);
    }

    window.addEventListener('resize', onResize);

    // Also observe size changes (e.g. accordions expanding)
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(update);
    });
    observer.observe(el);

    return () => {
      window.removeEventListener('resize', onResize);
      observer.disconnect();
      cancelAnimationFrame(rafId.current);
    };
  }, [columnRef]);
}
