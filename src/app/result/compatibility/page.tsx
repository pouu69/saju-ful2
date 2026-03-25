'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSaju } from '@/hooks/useSaju';
import { SajuForm } from '@/components/form/SajuForm';
import GoldParticles from '@/components/result/GoldParticles';
import { CardReveal } from '@/components/result/CardReveal';
import { ScrollReveal } from '@/components/result/ScrollReveal';
import { renderCompatCardToPng } from '@/lib/export/compatCardExport';
import { calculateFullSaju } from '@/lib/saju/calculator';
import type { BirthInfo, SajuResult } from '@/lib/saju/types';

type Phase = 'input' | 'particles' | 'cardDraw' | 'revealed' | 'scrolling' | 'complete';

export default function CompatibilityPage() {
  const router = useRouter();
  const saju = useSaju();
  const [partnerResult, setPartnerResult] = useState<SajuResult | null>(null);
  const [cardBlob, setCardBlob] = useState<Blob | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [phase, setPhase] = useState<Phase>('input');
  const [particleCenter, setParticleCenter] = useState({ x: 0, y: 0 });

  useEffect(() => {
    window.scrollTo(0, 0);
    const result = saju.restore();
    if (!result) {
      router.replace('/');
      return;
    }
    setInitialized(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePartnerSubmit = (birthInfo: BirthInfo) => {
    try {
      setCalcError(null);
      const partner = calculateFullSaju(birthInfo);
      setPartnerResult(partner);

      // Calculate particle center and start animation
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight * 0.4;
      setParticleCenter({ x: cx, y: cy });
      setPhase('particles');

      if (saju.sajuResult) {
        // AI streaming will start after card reveal
      }
    } catch (err) {
      setCalcError(err instanceof Error ? err.message : '계산에 실패했습니다.');
    }
  };

  const sajuResult = saju.sajuResult;

  // Use ref for aiCache to prevent card re-render during streaming
  const aiCacheRef = useRef(saju.aiCache);
  useEffect(() => {
    aiCacheRef.current = saju.aiCache;
  }, [saju.aiCache]);

  const renderCompatCard = useCallback(
    () => {
      if (!sajuResult || !partnerResult) return Promise.reject(new Error('No data'));
      return renderCompatCardToPng(sajuResult, partnerResult, aiCacheRef.current);
    },
    [sajuResult, partnerResult]
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
    setTimeout(() => {
      setPhase('scrolling');
    }, 300);
  }, []);

  // Start AI streaming when scrolling phase begins
  useEffect(() => {
    if (phase === 'scrolling' && sajuResult && partnerResult && !saju.aiCache.compatibility) {
      saju.streamInterpretation('compatibility', sajuResult, partnerResult);
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

  // Also mark complete if compatibility was cached
  useEffect(() => {
    if (phase === 'scrolling' && saju.aiCache.compatibility && !saju.streaming) {
      setPhase('complete');
    }
  }, [phase, saju.aiCache.compatibility, saju.streaming]);

  // Track whether reveal animation has played
  const [hasRevealed, setHasRevealed] = useState(false);

  // Determine particle phase
  const particlePhase = (() => {
    switch (phase) {
      case 'particles': return 'gather' as const;
      case 'cardDraw': return 'burst' as const;
      case 'revealed':
      case 'scrolling': return 'idle' as const;
      default: return 'done' as const;
    }
  })();

  const filename = sajuResult && partnerResult
    ? `${sajuResult.birthInfo.name}_${partnerResult.birthInfo.name}_궁합카드.png`
    : '궁합카드.png';

  if (!initialized || !sajuResult) return null;

  const showScroll = phase === 'scrolling' || phase === 'complete';
  const showNav = phase === 'complete' || (phase === 'scrolling' && !saju.streaming);

  return (
    <main className="min-h-screen flex flex-col items-center p-4 py-8">
      {/* Gold Particles Canvas */}
      {partnerResult && (
        <GoldParticles
          phase={particlePhase}
          centerX={particleCenter.x}
          centerY={particleCenter.y}
          onPhaseComplete={handleParticlePhaseComplete}
        />
      )}

      {/* Header */}
      <div className="text-center mb-6 font-mono">
        <h1 className="text-[#FFD060] text-lg">궁합 카드</h1>
        <p className="text-[#8A7848] text-sm mt-1">
          {sajuResult.birthInfo.name || '나'}와 {partnerResult ? (partnerResult.birthInfo.name || '상대') : '상대'}의 궁합
        </p>
        <div className="text-[#D4A020] mt-2 text-sm">
          ══════════════════════
        </div>
      </div>

      {/* Partner Input Form */}
      {phase === 'input' && (
        <section className="w-full max-w-lg border border-[#D4A020]/30 p-4 mb-6">
          <h2 className="text-[#CC88FF] font-mono text-center mb-3">
            ─── 상대방 정보 입력 ───
          </h2>
          <SajuForm
            onSubmit={handlePartnerSubmit}
            error={calcError}
            compact
          />
        </section>
      )}

      {/* Card Reveal */}
      {partnerResult && (
        <div className="w-full max-w-sm mx-auto mb-8">
          <CardReveal
            renderCard={renderCompatCard}
            onBlobReady={setCardBlob}
            onRevealComplete={handleRevealComplete}
            revealed={phase !== 'input' && phase !== 'particles'}
            blob={cardBlob}
            filename={filename}
          />
        </div>
      )}

      {/* Scroll (두루마리) AI Interpretation */}
      {partnerResult && (
        <section className="w-full max-w-lg mb-6">
          <ScrollReveal
            open={showScroll}
            streaming={saju.streaming}
            title="궁합 풀이"
          >
            {saju.streaming ? (
              saju.aiText
            ) : saju.error ? (
              <div className="text-center">
                <p className="text-[#FF5544] font-mono text-sm mb-3">{saju.error}</p>
                <button
                  onClick={() => saju.streamInterpretation('compatibility', sajuResult, partnerResult)}
                  className="px-4 py-2 border border-[#D4A020] text-[#D4A020] font-mono text-sm
                    hover:bg-[#D4A020]/10"
                >
                  다시 시도
                </button>
              </div>
            ) : (
              saju.aiText || saju.aiCache.compatibility
            )}
          </ScrollReveal>
        </section>
      )}

      {/* Navigation */}
      {showNav && (
        <div className="flex gap-3 mt-4 nav-fade-in">
          <button
            onClick={() => {
              setPartnerResult(null);
              setCardBlob(null);
              setCalcError(null);
              setPhase('input');
            }}
            className="px-6 py-3 border border-[#D4A020]/50 text-[#D4A020] font-mono
              hover:bg-[#D4A020]/10 transition-colors min-h-[48px]"
          >
            다른 상대와 궁합 보기
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 border border-[#D4A020]/30 text-[#8A7848] font-mono
              hover:bg-[#D4A020]/10 transition-colors min-h-[48px]"
          >
            ◀ 돌아가기
          </button>
        </div>
      )}
    </main>
  );
}
