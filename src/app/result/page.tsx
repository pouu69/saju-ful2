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
import { useResultPhase } from '@/hooks/useResultPhase';
import { ResultLoading } from '@/components/result/ResultLoading';
import { EnvelopeReveal } from '@/components/result/EnvelopeReveal';
import { encodeShareToken } from '@/lib/share/tokenCodec';
import { extractWisdom } from '@/lib/export/cardExport';
import { ELEMENT_NAMES } from '@/lib/saju/constants';
import { useToast } from '@/hooks/useToast';

export default function ResultPage() {
  const router = useRouter();
  const saju = useSaju();
  const { phase, setPhase, particlePhase, handleParticleComplete, handleRevealComplete, handleStreamingComplete } = useResultPhase();
  const { show: showToast, ToastUI } = useToast();
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
      handleStreamingComplete();
    }
    prevStreaming.current = saju.streaming;
  }, [saju.streaming, phase, handleStreamingComplete]);

  // Also mark complete if synthesis was cached
  useEffect(() => {
    if (phase === 'scrolling' && saju.aiCache.synthesis && !saju.streaming) {
      handleStreamingComplete();
    }
  }, [phase, saju.aiCache.synthesis, saju.streaming, handleStreamingComplete]);

  const onRevealComplete = useCallback(() => {
    handleRevealComplete();
  }, [handleRevealComplete]);

  if (!initialized || !sajuResult) {
    return <ResultLoading />;
  }

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
        onPhaseComplete={handleParticleComplete}
      />

      {/* Header */}
      <div className="text-center mb-6 font-mono">
        <div className="text-[#8A6618] text-[10px] tracking-[3px] mb-2">四柱命理의 미궁</div>
        <h1 className="text-[#FFD060] text-xl font-bold">
          {sajuResult.birthInfo.name || '무명'}님의 사주
        </h1>
      </div>

      {/* Envelope Phase */}
      {phase === 'envelope' && sajuResult && (
        <div className="absolute inset-0 z-10">
          <EnvelopeReveal
            name={sajuResult.birthInfo.name}
            onOpen={() => setPhase('cardDraw')}
          />
        </div>
      )}

      {/* Card Reveal Area */}
      <div ref={cardAreaRef} className="w-full max-w-sm mx-auto mb-8" style={{
        filter: phase === 'revealed' || phase === 'scrolling' || phase === 'complete'
          ? 'drop-shadow(0 0 40px rgba(212,160,32,0.3))' : 'none',
        transition: 'filter 0.6s ease',
      }}>
        <CardReveal
          renderCard={renderBasicCard}
          onBlobReady={setCardBlob}
          onRevealComplete={onRevealComplete}
          revealed={phase !== 'loading' && phase !== 'particles' && phase !== 'envelope'}
          blob={cardBlob}
          filename={cardFilename}
        />
      </div>

      {/* Share buttons — visible after card reveal */}
      {(phase === 'revealed' || phase === 'scrolling' || phase === 'complete') && sajuResult && (() => {
        const token = encodeShareToken({
          year: sajuResult.birthInfo.year,
          month: sajuResult.birthInfo.month,
          day: sajuResult.birthInfo.day,
          hour: sajuResult.birthInfo.hour,
          gender: sajuResult.birthInfo.gender,
          calendarType: sajuResult.birthInfo.calendarType,
        });
        const shareUrl = `${window.location.origin}/share/${token}`;
        const animal = sajuResult.yearPillar.branch.animal;
        const elHanja = ELEMENT_NAMES[sajuResult.fiveElements.dominant].hanja;
        const wisdom = extractWisdom(saju.aiCache);
        const threadsText = [
          `${animal}띠의 사주에 숨겨진 비밀...`,
          '',
          `${elHanja}의 기운이 제일 강하대`,
          `"${wisdom}"`,
          '',
          '너도 해봐',
          shareUrl,
        ].join('\n');
        const threadsUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(threadsText)}`;
        return (
          <div className="w-full max-w-sm mx-auto mb-6 flex gap-3">
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  showToast('링크가 복사되었습니다!');
                } catch {
                  showToast('링크: ' + shareUrl);
                }
              }}
              className="flex-1 py-3 border border-[#68d391]/50 text-[#68d391] font-mono text-sm
                hover:bg-[#68d391]/10 transition-colors min-h-[44px] rounded"
            >
              링크 복사
            </button>
            <a
              href={threadsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 border border-[#B4B9BE]/50 text-[#B4B9BE] font-mono text-sm
                hover:bg-[#B4B9BE]/10 transition-colors min-h-[44px] rounded
                flex items-center justify-center"
            >
              Threads 공유
            </a>
          </div>
        );
      })()}

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
          <div className="flex items-center gap-3 w-full mb-4">
            <div className="flex-1 h-px" style={{ background: '#1a1500' }} />
            <span className="text-[#8A6618] font-mono text-xs">더 알아보기</span>
            <div className="flex-1 h-px" style={{ background: '#1a1500' }} />
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

            {/* 궁합 카드 — 다음 phase에서 재개발 예정
            <button
              onClick={() => router.push('/result/compatibility')}
              className="w-full py-3 border border-[#D4A020]/50 text-[#D4A020] font-mono
                hover:bg-[#D4A020]/10 transition-colors min-h-[48px]"
            >
              ▶ 궁합 카드 만들기
            </button>
            */}

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
      {ToastUI}
    </main>
  );
}
