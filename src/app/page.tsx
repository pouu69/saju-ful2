'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { StepInput } from '@/components/input/StepInput';
import { IntroAnimation } from '@/components/intro/IntroAnimation';
import { useSaju } from '@/hooks/useSaju';
import type { BirthInfo } from '@/lib/saju/types';

type Phase = 'hero' | 'intro' | 'fading' | 'input';

export default function LandingPage() {
  const router = useRouter();
  const { calculate, error } = useSaju();
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>('hero');

  useEffect(() => {
    if (phase !== 'intro') return;
    const t = setTimeout(() => setPhase('fading'), 2500);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'fading') return;
    const t = setTimeout(() => setPhase('input'), 300);
    return () => clearTimeout(t);
  }, [phase]);

  const handleCTA = () => setPhase('intro');

  const handleIntroComplete = () => {
    if (phase === 'intro') setPhase('fading');
  };

  const handleSubmit = (birthInfo: BirthInfo) => {
    setLoading(true);
    const result = calculate(birthInfo);
    if (result) {
      router.push('/result');
      setTimeout(() => setLoading(false), 5000);
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">

      {/* Hero landing */}
      {phase === 'hero' && (
        <main className="min-h-screen flex flex-col">
          {/* Top hero section */}
          <div
            className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center"
            style={{ background: 'radial-gradient(ellipse at 50% 70%, rgba(212,160,32,0.12) 0%, transparent 60%)' }}
          >
            <div className="text-[#8A6618] font-mono text-xs tracking-[4px] mb-6">AI · 四柱命理</div>

            {/* Demo card */}
            <div
              className="mb-8 rounded-xl px-5 py-5 text-center"
              style={{
                background: 'linear-gradient(145deg, #1a1200, #2a1e08)',
                border: '1px solid #D4A020',
                width: 140,
                boxShadow: '0 0 32px rgba(212,160,32,0.4), 0 8px 24px rgba(0,0,0,0.6)',
              }}
            >
              <div className="text-[#FFD060] font-mono text-[10px] tracking-widest mb-3">龍 ══ 鳳</div>
              <div className="text-3xl mb-3">🐉</div>
              <div className="grid grid-cols-4 gap-1 mb-3">
                {[
                  { hanja: '甲', element: '木', color: 'var(--element-wood)' },
                  { hanja: '丙', element: '火', color: 'var(--element-fire)' },
                  { hanja: '壬', element: '水', color: 'var(--element-water)' },
                  { hanja: '庚', element: '金', color: 'var(--element-metal)' },
                ].map(({ hanja, element, color }) => (
                  <div
                    key={hanja}
                    className="rounded flex flex-col items-center py-1"
                    style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 40%, transparent)` }}
                  >
                    <span className="font-mono text-xs font-bold" style={{ color }}>{hanja}</span>
                    <span className="font-mono text-[9px]" style={{ color }}>{element}</span>
                  </div>
                ))}
              </div>
              <div
                className="font-mono text-[9px] italic pt-2"
                style={{ color: '#8A6618', borderTop: '1px solid #2a1e08' }}
              >
                &quot;강인한 의지의 용&quot;
              </div>
            </div>

            <div className="text-[#FFD060] font-mono text-2xl font-bold mb-2">나의 사주 카드</div>
            <div className="text-[#8A6618] font-mono text-sm">나만의 운명 카드를 받아보세요</div>
          </div>

          {/* Bottom panel */}
          <div className="px-6 pb-8 pt-6" style={{ background: '#0d0b00', borderTop: '1px solid #1a1500' }}>
            <div className="space-y-4 mb-6">
              {[
                { emoji: '🔮', title: 'AI 사주 해석', desc: 'GPT 기반 개인 맞춤 풀이' },
                { emoji: '🃏', title: '사주 카드 증정', desc: '저장·공유 가능한 나만의 카드' },
                { emoji: '⚡', title: '1분 완성', desc: '생년월일시만 입력하면 끝' },
              ].map(({ emoji, title, desc }) => (
                <div key={title} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'rgba(212,160,32,0.1)', border: '1px solid rgba(212,160,32,0.2)' }}
                  >
                    {emoji}
                  </div>
                  <div>
                    <div className="text-[#D4A020] font-mono text-sm font-bold">{title}</div>
                    <div className="text-[#555] font-mono text-xs">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleCTA}
              className="w-full py-4 rounded-xl font-mono text-base font-bold text-[#080600] min-h-[56px]"
              style={{ background: 'linear-gradient(135deg, #D4A020, #FFD060)', boxShadow: '0 4px 16px rgba(212,160,32,0.4)' }}
            >
              지금 무료로 받기 ✦
            </button>
            <div className="text-center text-[#555] font-mono text-xs mt-2">무료 · 1분 소요</div>
          </div>
        </main>
      )}

      {/* Brief ASCII intro after CTA */}
      {(phase === 'intro' || phase === 'fading') && (
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{ opacity: phase === 'fading' ? 0 : 1 }}
        >
          <IntroAnimation onComplete={handleIntroComplete} />
        </div>
      )}

      {/* 6-step input */}
      {phase === 'input' && (
        <StepInput onComplete={handleSubmit} loading={loading} />
      )}

      {/* Global error */}
      {error && phase === 'input' && (
        <div className="fixed bottom-4 left-4 right-4 text-[#FF5544] font-mono text-sm
          border border-[#FF5544]/30 p-3 bg-[#080600] z-50">
          ! {error}
        </div>
      )}
    </div>
  );
}
