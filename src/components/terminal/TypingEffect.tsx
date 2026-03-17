'use client';

import { useState, useEffect, useRef } from 'react';

interface TypingEffectProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export default function TypingEffect({ text, speed = 30, onComplete, className }: TypingEffectProps) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);
  const completedRef = useRef(false);

  useEffect(() => {
    indexRef.current = 0;
    completedRef.current = false;
    setDisplayed('');

    const timer = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current <= text.length) {
        setDisplayed(text.slice(0, indexRef.current));
      } else {
        clearInterval(timer);
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        }
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  const showCursor = indexRef.current <= text.length;

  return (
    <span className={className}>
      {displayed}
      {showCursor && <span className="terminal-cursor">▌</span>}
    </span>
  );
}
