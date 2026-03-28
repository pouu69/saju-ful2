'use client';

import { useState, useEffect } from 'react';

type EnvelopePhase = 'sealed' | 'opening' | 'opened';

interface EnvelopeRevealProps {
  name: string;
  onOpen: () => void;
  autoOpen?: boolean;
}

export function EnvelopeReveal({ name, onOpen, autoOpen = false }: EnvelopeRevealProps) {
  const [phase, setPhase] = useState<EnvelopePhase>('sealed');

  const triggerOpen = () => {
    if (phase !== 'sealed') return;
    setPhase('opening');
    setTimeout(() => {
      setPhase('opened');
      onOpen();
    }, 600);
  };

  useEffect(() => {
    if (!autoOpen) return;
    const t = setTimeout(() => triggerOpen(), 2000);
    return () => clearTimeout(t);
  }, [autoOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="text-[#FFD060] font-mono text-lg font-bold mb-1">
        {name}님의
      </div>
      <div className="text-[#8A6618] font-mono text-sm mb-10">
        운명의 카드가 도착했습니다
      </div>

      <button
        type="button"
        onClick={triggerOpen}
        disabled={phase !== 'sealed'}
        aria-label="봉투 개봉"
        className="cursor-pointer disabled:cursor-default group"
        style={{ background: 'transparent', border: 'none', padding: 0 }}
      >
        <div
          className="relative transition-all duration-600"
          style={{
            width: 200,
            height: 140,
            transform: phase === 'opening' ? 'scale(1.05)' : 'scale(1)',
            opacity: phase === 'opened' ? 0 : 1,
            transition: 'transform 0.3s ease, opacity 0.3s ease',
          }}
        >
          <div
            className="absolute inset-0 rounded"
            style={{
              background: 'linear-gradient(160deg, #2a1e08, #1a1200)',
              border: '1px solid #D4A020',
              boxShadow: '0 0 32px rgba(212,160,32,0.4), 0 8px 24px rgba(0,0,0,0.6)',
            }}
          />
          <div
            className="absolute"
            style={{
              top: 0, left: 0, right: 0,
              height: '50%',
              background: 'linear-gradient(135deg, transparent 49%, rgba(212,160,32,0.15) 50%, transparent 51%)',
            }}
          />
          <div
            className="absolute flex items-center justify-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #8b0000, #5a0000)',
              border: '2px solid #D4A020',
              boxShadow: '0 0 12px rgba(139,0,0,0.6)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className="text-[#D4A020] text-2xl">☯</span>
          </div>
        </div>
      </button>

      {phase === 'sealed' && (
        <>
          <div className="text-[#D4A020] font-mono text-sm mt-8 mb-2">봉인을 여세요</div>
          <div className="text-[#555] font-mono text-xs">탭하면 열립니다</div>
          <div
            className="mt-6 flex items-center justify-center rounded-full"
            style={{
              width: 44, height: 44,
              border: '1px dashed rgba(212,160,32,0.4)',
              color: 'rgba(212,160,32,0.5)',
              fontSize: 20,
            }}
            aria-hidden="true"
          >
            👆
          </div>
        </>
      )}
    </div>
  );
}
