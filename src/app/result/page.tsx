'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSaju } from '@/hooks/useSaju';
import { CardPreview } from '@/components/card/CardPreview';
import { ShareButtons } from '@/components/card/ShareButtons';
import { renderCardToPng } from '@/lib/export/cardExport';
import { renderLuckCardToPng } from '@/lib/export/luckCardExport';
import { ELEMENT_NAMES, ELEMENT_HEX } from '@/lib/saju/constants';

export default function ResultPage() {
  const router = useRouter();
  const saju = useSaju();
  const [cardBlob, setCardBlob] = useState<Blob | null>(null);
  const [luckCardBlob, setLuckCardBlob] = useState<Blob | null>(null);
  const [showLuckCard, setShowLuckCard] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const streamEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const result = saju.restore();
    if (!result) {
      router.replace('/');
      return;
    }
    setInitialized(true);
    if (!saju.aiCache.synthesis) {
      saju.streamInterpretation('synthesis', result);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll during AI streaming
  useEffect(() => {
    if (saju.streaming && streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [saju.aiText, saju.streaming]);

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

  // Re-render card once AI streaming completes (wisdom text available)
  const [cardVersion, setCardVersion] = useState(0);
  const prevStreaming = useRef(saju.streaming);
  useEffect(() => {
    if (prevStreaming.current && !saju.streaming) {
      setCardVersion(v => v + 1);
    }
    prevStreaming.current = saju.streaming;
  }, [saju.streaming]);

  if (!initialized || !sajuResult) return null;

  const cardFilename = `${sajuResult.birthInfo.name || '사주'}_사주카드_${new Date().toISOString().slice(0, 10)}.png`;
  const luckFilename = `${sajuResult.birthInfo.name || '사주'}_대운세운카드_${new Date().toISOString().slice(0, 10)}.png`;

  return (
    <main className="min-h-screen flex flex-col items-center p-4 py-8">
      {/* Header */}
      <div className="text-center mb-6 font-mono">
        <h1 className="text-[#FFD060] text-lg">
          {sajuResult.birthInfo.name || '무명'}의 사주 풀이
        </h1>
        <div className="text-[#D4A020] mt-2 text-sm">
          ══════════════════════
        </div>
      </div>

      {/* Saju Summary (instant, no AI needed) */}
      <section className="w-full max-w-lg border border-[#D4A020]/30 p-4 mb-6">
        <h2 className="text-[#CC88FF] font-mono text-center mb-3">
          ─── 사주 원국 ───
        </h2>
        <div className="font-mono text-sm">
          {/* Four Pillars */}
          <div className="flex justify-around mb-3">
            {[
              { label: '년주', p: sajuResult.yearPillar },
              { label: '월주', p: sajuResult.monthPillar },
              { label: '일주', p: sajuResult.dayPillar },
              ...(sajuResult.hourPillar ? [{ label: '시주', p: sajuResult.hourPillar }] : []),
            ].map(({ label, p }) => (
              <div key={label} className="text-center">
                <div className="text-[#8A7848] text-xs">{label}</div>
                <div style={{ color: ELEMENT_HEX[p.stem.element] }}>{p.stem.korean}({p.stem.hanja})</div>
                <div style={{ color: ELEMENT_HEX[p.branch.element] }}>{p.branch.korean}({p.branch.hanja})</div>
              </div>
            ))}
          </div>
          {/* Day Master + Element Balance */}
          <div className="text-center text-[#E8D8C0] text-xs space-y-1">
            <div>
              일간: <span style={{ color: ELEMENT_HEX[sajuResult.dayMaster.element] }}>
                {sajuResult.dayMaster.korean}({ELEMENT_NAMES[sajuResult.dayMaster.element].hanja})
              </span>
              {' · '}
              {sajuResult.yearPillar.branch.animal}띠
            </div>
            <div>
              강한 오행: <span style={{ color: ELEMENT_HEX[sajuResult.fiveElements.dominant] }}>
                {ELEMENT_NAMES[sajuResult.fiveElements.dominant].korean}
              </span>
              {' · '}
              약한 오행: <span style={{ color: ELEMENT_HEX[sajuResult.fiveElements.deficient] }}>
                {ELEMENT_NAMES[sajuResult.fiveElements.deficient].korean}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* AI Interpretation */}
      <section className="w-full max-w-lg border border-[#D4A020]/30 p-4 mb-6">
        <h2 className="text-[#CC88FF] font-mono text-center mb-3">
          ─── 종합 풀이 ───
        </h2>
        {saju.streaming ? (
          <div className="font-mono text-[#E8D8C0] text-sm whitespace-pre-wrap leading-relaxed">
            {saju.aiText}
            <span className="inline-block w-2 h-4 bg-[#D4A020] animate-pulse ml-1" />
            <div ref={streamEndRef} />
          </div>
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
          <div className="font-mono text-[#E8D8C0] text-sm whitespace-pre-wrap leading-relaxed">
            {saju.aiText || saju.aiCache.synthesis}
          </div>
        )}
      </section>

      {/* Card Preview */}
      <section className="w-full max-w-lg border border-[#D4A020]/30 p-4 mb-6">
        <h2 className="text-[#CC88FF] font-mono text-center mb-3">
          ─── 사주 카드 ───
        </h2>
        <CardPreview
          key={cardVersion}
          renderCard={renderBasicCard}
          onBlobReady={setCardBlob}
        />
        <ShareButtons blob={cardBlob} filename={cardFilename} />
      </section>

      {/* Navigation */}
      <section className="w-full max-w-lg border border-[#D4A020]/30 p-4">
        <h2 className="text-[#CC88FF] font-mono text-center mb-3">
          ─── 더 알아보기 ───
        </h2>
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
    </main>
  );
}
