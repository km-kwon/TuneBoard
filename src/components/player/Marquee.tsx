import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface MarqueeProps {
  text: string;
  className?: string;
}

/**
 * Renders text. If the content overflows its container, animates it horizontally
 * with a slow ease that pauses briefly at start and end. Otherwise renders static.
 */
export function Marquee({ text, className }: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;
    const measure = () => {
      const cw = containerRef.current?.clientWidth ?? 0;
      const sw = contentRef.current?.scrollWidth ?? 0;
      setOverflowing(sw > cw + 1);
      if (containerRef.current) {
        containerRef.current.style.setProperty('--marquee-viewport', `${cw}px`);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [text]);

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
      <span
        ref={contentRef}
        className={cn(
          'inline-block whitespace-nowrap will-change-transform',
          overflowing && 'animate-marquee',
        )}
      >
        {text}
      </span>
    </div>
  );
}
