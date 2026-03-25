'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSaju } from '@/hooks/useSaju';
import GoldParticles from '@/components/result/GoldParticles';
import { CardReveal } from '@/components/result/CardReveal';
import { ScrollReveal } from '@/components/result/ScrollReveal';
import { renderCardToPng } from '@/lib/export/cardExport';
import { renderLuckCardToPng } from '@/lib/export/luckCardExport';
import { CardPreview } from '@/components/card/CardPreview';
import { ShareButtons } from '@/components/card/ShareButtons';

type Phase = 'loading' | 'particles' | 'cardDraw' | 'revealed' | 'scrolling' | 'complete';

export default function ResultPage() {
  const router = useRouter();
  const saju = useSaju();
  const [phase, setPhase] = useState<Phase>('loading');
  const [cardBlob, setCardBlob] = useState<Blob | null>(null);
  const [luckCardBlob, setLuckCardBlob] = useState<Blob | null>(null);
  const [showLuckCard, setShowLuckCard] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [particleCenter, setParticleCenter] = useState({ x: 0, y: 0 });
  const cardAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const result = saju.restore();
    if (!result) {
      router.replace('/');
      return;
    }
    setInitialized(true);

    // Calculate card center position for particles
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.4;
    setParticleCenter({ x: cx, y: cy });

    // Start particle gather phase
    setPhase('particles');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sajuResult = saju.sajuResult;

  // Use ref for aiCache to prevent card re-render during streaming
  const aiCacheRef = useRef(saju.aiCache);
  useEffect(() => {
    aiCacheRef.current = saju.aiCache;
  }, [saju.aiCache]);

  const renderBasicCard = useCallback(
    () => {
      if (!sajuResult) return Promise.reject(new Error('No saju'));
      return renderCardToPng(sajuResult, aiCacheRef.current);
    },
    [sajuResult]
  );

  const renderLuckCard = useCallback(
    () => {
      if (!sajuResult) return Promise.reject(new Error('No saju'));
      return renderLuckCardToPng(sajuResult, aiCacheRef.current);
    },
    [sajuResult]
  );

  // Handle particle phase transitions
  const handleParticlePhaseComplete = useCallback((completedPhase: string) => {
    if (completedPhase === 'gather') {
      setPhase('cardDraw');
    }
  }, []);

  // Handle card reveal completion
  const handleRevealComplete = useCallback(() => {
    setHasRevealed(true);
    setPhase('revealed');
    // Short delay, then start AI interpretation + scroll unfurl
    setTimeout(() => {
      setPhase('scrolling');
    }, 300);
  }, []);

  // Start AI streaming when scrolling phase begins
  useEffect(() => {
    if (phase === 'scrolling' && sajuResult && !saju.aiCache.synthesis) {
      saju.streamInterpretation('synthesis', sajuResult);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mark complete when AI streaming finishes
  const prevStreaming = useRef(saju.streaming);
  useEffect(() => {
    if (prevStreaming.current && !saju.streaming && phase === 'scrolling') {
      setPhase('complete');
    }
    prevStreaming.current = saju.streaming;
  }, [saju.streaming, phase]);

  // Also mark complete if synthesis was cached
  useEffect(() => {
    if (phase === 'scrolling' && saju.aiCache.synthesis && !saju.streaming) {
      setPhase('complete');
    }
  }, [phase, saju.aiCache.synthesis, saju.streaming]);

  // Track whether reveal animation has played (prevent re-animation on re-renders)
  const [hasRevealed, setHasRevealed] = useState(false);

  // Determine particle phase based on page phase
  const particlePhase = (() => {
    switch (phase) {
      case 'particles': return 'gather' as const;
      case 'cardDraw': return 'burst' as const;
      case 'revealed':
      case 'scrolling': return 'idle' as const;
      default: return 'done' as const;
    }
  })();

  if (!initialized || !sajuResult) return null;

  const cardFilename = `${sajuResult.birthInfo.name || '사주'}_사주카드_${new Date().toISOString().slice(0, 10)}.png`;
  const luckFilename = `${sajuResult.birthInfo.name || '사주'}_대운세운카드_${new Date().toISOString().slice(0, 10)}.png`;

  const showScroll = phase === 'scrolling' || phase === 'complete';
  const showNav = phase === 'complete' || (phase === 'scrolling' && !saju.streaming);

  return (
    <main className="min-h-screen flex flex-col items-center p-4 py-8">
      {/* Gold Particles Canvas */}
      <GoldParticles
        phase={particlePhase}
        centerX={particleCenter.x}
        centerY={particleCenter.y}
        onPhaseComplete={handleParticlePhaseComplete}
      />

      {/* Header */}
      <div className="text-center mb-8 font-mono">
        <h1 className="text-[#FFD060] text-lg">
          {sajuResult.birthInfo.name || '무명'}의 사주 풀이
        </h1>
        <div className="text-[#D4A020] mt-2 text-sm">
          ══════════════════════
        </div>
      </div>

      {/* Card Reveal Area */}
      <div ref={cardAreaRef} className="w-full max-w-sm mx-auto mb-8">
        <CardReveal
          renderCard={renderBasicCard}
          onBlobReady={setCardBlob}
          onRevealComplete={handleRevealComplete}
          revealed={phase !== 'loading' && phase !== 'particles'}
          blob={cardBlob}
          filename={cardFilename}
        />
      </div>

      {/* Scroll (두루마리) AI Interpretation */}
      <section className="w-full max-w-lg mb-6">
        <ScrollReveal
          open={showScroll}
          streaming={saju.streaming}
          title="종합 풀이"
        >
          {saju.streaming ? (
            saju.aiText
          ) : saju.error ? (
            <div className="text-center">
              <p className="text-[#FF5544] font-mono text-sm mb-3">{saju.error}</p>
              <button
                onClick={() => saju.streamInterpretation('synthesis', sajuResult)}
                className="px-4 py-2 border border-[#D4A020] text-[#D4A020] font-mono text-sm
                  hover:bg-[#D4A020]/10"
              >
                다시 시도
              </button>
            </div>
          ) : (
            saju.aiText || saju.aiCache.synthesis
          )}
        </ScrollReveal>
      </section>

      {/* Navigation — fade in after completion */}
      {showNav && (
        <section className="w-full max-w-lg nav-fade-in">
          <div className="text-center mb-4">
            <div className="text-[#CC88FF] font-mono text-sm">
              ═══ 더 알아보기 ═══
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setShowLuckCard(!showLuckCard)}
              className="w-full py-3 border border-[#D4A020]/50 text-[#D4A020] font-mono
                hover:bg-[#D4A020]/10 transition-colors min-h-[48px]"
            >
              {showLuckCard ? '▼ 대운/세운 카드 접기' : '▶ 대운/세운 카드 보기'}
            </button>

            {showLuckCard && (
              <div className="mt-3">
                <CardPreview renderCard={renderLuckCard} onBlobReady={setLuckCardBlob} />
                <ShareButtons blob={luckCardBlob} filename={luckFilename} />
              </div>
            )}

            <button
              onClick={() => router.push('/result/compatibility')}
              className="w-full py-3 border border-[#D4A020]/50 text-[#D4A020] font-mono
                hover:bg-[#D4A020]/10 transition-colors min-h-[48px]"
            >
              ▶ 궁합 카드 만들기
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full py-3 border border-[#D4A020]/30 text-[#8A7848] font-mono
                hover:bg-[#D4A020]/10 transition-colors min-h-[48px]"
            >
              ◀ 다시 풀기
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
