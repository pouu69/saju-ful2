'use client';

import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  open: boolean;
  streaming: boolean;
  title?: string;
}

export function ScrollReveal({
  children,
  open,
  streaming,
  title = '종합 풀이',
}: ScrollRevealProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect reduced motion preference
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Inject fade-in keyframe once
  useEffect(() => {
    const id = 'scroll-reveal-keyframes';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `@keyframes scroll-reveal-fade-in { from { opacity: 0; } to { opacity: 1; } }`;
    document.head.appendChild(style);
  }, []);

  // Measure content height with ResizeObserver
  const updateHeight = useCallback(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => updateHeight());
    observer.observe(el);
    updateHeight();

    return () => observer.disconnect();
  }, [updateHeight]);

  // Re-measure when children change (streaming text additions)
  useEffect(() => {
    updateHeight();
  }, [children, updateHeight]);

  // Auto-scroll to bottom during streaming
  useEffect(() => {
    if (streaming && open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [children, streaming, open]);

  const showBottomDecoration = open && !streaming;

  const transitionStyle = prefersReducedMotion
    ? {}
    : { transition: 'max-height 0.8s ease-out, opacity 0.4s ease' };

  return (
    <div className="w-full font-mono">
      {/* Top decoration */}
      {open && (
        <div className="text-center mb-1">
          <div
            className="text-[#D4A020] opacity-30 text-xs tracking-widest"
            aria-hidden="true"
          >
            ─── ═══════════════════ ───
          </div>
          <div className="text-[#CC88FF] text-sm py-1 tracking-wider">
            ═══ {title} ═══
          </div>
          <div
            className="text-[#D4A020] opacity-30 text-xs tracking-widest"
            aria-hidden="true"
          >
            ─── ═══════════════════ ───
          </div>
        </div>
      )}

      {/* Content area with unfurl animation */}
      <div
        style={{
          maxHeight: open ? `${contentHeight}px` : '0px',
          opacity: open ? 1 : 0,
          overflow: 'hidden',
          ...transitionStyle,
        }}
        className={[
          'border-l border-r',
          'border-[rgba(212,160,32,0.2)]',
          'bg-[rgba(212,160,32,0.03)]',
        ].join(' ')}
      >
        <div
          ref={contentRef}
          className="px-4 py-3 md:px-6 md:py-4"
          aria-live={streaming ? 'polite' : undefined}
        >
          <div className="text-[#E8D8C0] text-sm whitespace-pre-wrap leading-relaxed font-mono">
            {children}
            {streaming && (
              <span
                className="inline-block w-2 h-4 bg-[#D4A020] animate-pulse ml-1 align-middle"
                aria-hidden="true"
              />
            )}
          </div>
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Bottom decoration — visible only after streaming completes */}
      {showBottomDecoration && (
        <div
          className="text-center mt-1"
          style={{ animation: 'scroll-reveal-fade-in 0.3s ease forwards' }}
          aria-hidden="true"
        >
          <div className="text-[#D4A020] opacity-30 text-xs tracking-widest">
            ─── ═══════════════════ ───
          </div>
        </div>
      )}
    </div>
  );
}
