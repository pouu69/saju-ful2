'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  DRAGON_PHOENIX_FULL,
  DRAGON_PHOENIX_COMPACT,
  LINE_INTERVAL_MS,
  SAFETY_TIMEOUT_MS,
} from './asciiArt';

interface IntroAnimationProps {
  onComplete: () => void;
}

function AsciiArt({ lines, visibleCount }: { lines: readonly string[]; visibleCount: number }) {
  return (
    <pre
      className="font-mono text-[#D4A020] text-center leading-snug"
      aria-label="사주명리의 미궁 - 용봉 장식"
    >
      {lines.map((line, i) => (
        <div
          key={i}
          className={i < visibleCount ? 'intro-line' : ''}
          style={{
            opacity: i < visibleCount ? 1 : 0,
            whiteSpace: 'pre',
          }}
        >
          {line || '\u00A0'}
        </div>
      ))}
    </pre>
  );
}

export function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const completedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    onComplete();
  }, [onComplete]);

  // Check prefers-reduced-motion and start animation
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Show all lines immediately, complete after brief pause
      setVisibleCount(Math.max(DRAGON_PHOENIX_FULL.length, DRAGON_PHOENIX_COMPACT.length));
      const t = setTimeout(complete, 300);
      timersRef.current.push(t);
      return;
    }

    // Animate: reveal lines one by one using the longer array length
    const totalLines = Math.max(DRAGON_PHOENIX_FULL.length, DRAGON_PHOENIX_COMPACT.length);
    for (let i = 0; i < totalLines; i++) {
      const t = setTimeout(() => {
        setVisibleCount(i + 1);
        if (i === totalLines - 1) {
          const finish = setTimeout(complete, 300);
          timersRef.current.push(finish);
        }
      }, LINE_INTERVAL_MS * i);
      timersRef.current.push(t);
    }

    // Safety timeout
    const safety = setTimeout(complete, SAFETY_TIMEOUT_MS);
    timersRef.current.push(safety);

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [complete]);

  // Skip on any user interaction
  useEffect(() => {
    const skip = () => complete();
    window.addEventListener('click', skip);
    window.addEventListener('keydown', skip);
    window.addEventListener('scroll', skip, { passive: true });
    window.addEventListener('touchstart', skip, { passive: true });

    return () => {
      window.removeEventListener('click', skip);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('scroll', skip);
      window.removeEventListener('touchstart', skip);
    };
  }, [complete]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Full version for md+ screens */}
      <div className="hidden sm:block text-[11px] md:text-[12px]">
        <AsciiArt lines={DRAGON_PHOENIX_FULL} visibleCount={visibleCount} />
      </div>
      {/* Compact version for small screens */}
      <div className="block sm:hidden text-[9px]">
        <AsciiArt lines={DRAGON_PHOENIX_COMPACT} visibleCount={visibleCount} />
      </div>
    </div>
  );
}
