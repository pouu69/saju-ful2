'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSaju } from '@/hooks/useSaju';
import { SajuForm } from '@/components/form/SajuForm';
import { CardPreview } from '@/components/card/CardPreview';
import { ShareButtons } from '@/components/card/ShareButtons';
import { renderCompatCardToPng } from '@/lib/export/compatCardExport';
import { calculateFullSaju } from '@/lib/saju/calculator';
import type { BirthInfo, SajuResult } from '@/lib/saju/types';

export default function CompatibilityPage() {
  const router = useRouter();
  const saju = useSaju();
  const [partnerResult, setPartnerResult] = useState<SajuResult | null>(null);
  const [cardBlob, setCardBlob] = useState<Blob | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

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
      if (saju.sajuResult) {
        saju.streamInterpretation('compatibility', saju.sajuResult, partner);
      }
    } catch (err) {
      setCalcError(err instanceof Error ? err.message : '계산에 실패했습니다.');
    }
  };

  const sajuResult = saju.sajuResult;

  const renderCompatCard = useCallback(
    () => {
      if (!sajuResult || !partnerResult) return Promise.reject(new Error('No data'));
      return renderCompatCardToPng(sajuResult, partnerResult, saju.aiCache);
    },
    [sajuResult, partnerResult, saju.aiCache]
  );

  const filename = sajuResult && partnerResult
    ? `${sajuResult.birthInfo.name}_${partnerResult.birthInfo.name}_궁합카드.png`
    : '궁합카드.png';

  if (!initialized || !sajuResult) return null;

  return (
    <main className="min-h-screen flex flex-col items-center p-4 py-8">
      {/* Header */}
      <div className="text-center mb-6 font-mono">
        <h1 className="text-[#FFD060] text-lg">궁합 카드</h1>
        <p className="text-[#8A7848] text-sm mt-1">
          {sajuResult.birthInfo.name || '나'}와 상대방의 궁합
        </p>
        <div className="text-[#D4A020] mt-2 text-sm">
          ══════════════════════
        </div>
      </div>

      {/* Partner Input Form */}
      {!partnerResult && (
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

      {/* Compatibility Result */}
      {partnerResult && (
        <>
          {/* AI Interpretation */}
          <section className="w-full max-w-lg border border-[#D4A020]/30 p-4 mb-6">
            <h2 className="text-[#CC88FF] font-mono text-center mb-3">
              ─── 궁합 풀이 ───
            </h2>
            {saju.streaming ? (
              <div className="font-mono text-[#E8D8C0] text-sm whitespace-pre-wrap leading-relaxed">
                {saju.aiText}
                <span className="inline-block w-2 h-4 bg-[#D4A020] animate-pulse ml-1" />
              </div>
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
              <div className="font-mono text-[#E8D8C0] text-sm whitespace-pre-wrap leading-relaxed">
                {saju.aiText || saju.aiCache.compatibility}
              </div>
            )}
          </section>

          {/* Card Preview */}
          <section className="w-full max-w-lg border border-[#D4A020]/30 p-4 mb-6">
            <h2 className="text-[#CC88FF] font-mono text-center mb-3">
              ─── 궁합 카드 ───
            </h2>
            <CardPreview renderCard={renderCompatCard} onBlobReady={setCardBlob} />
            <ShareButtons blob={cardBlob} filename={filename} />
          </section>
        </>
      )}

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mt-4 px-6 py-3 border border-[#D4A020]/30 text-[#8A7848] font-mono
          hover:bg-[#D4A020]/10 transition-colors min-h-[48px]"
      >
        ◀ 돌아가기
      </button>
    </main>
  );
}
