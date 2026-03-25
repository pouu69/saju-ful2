'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { SajuForm } from '@/components/form/SajuForm';
import { IntroAnimation } from '@/components/intro/IntroAnimation';
import { CompactHeader } from '@/components/intro/CompactHeader';
import { useSaju } from '@/hooks/useSaju';
import type { BirthInfo } from '@/lib/saju/types';

type Phase = 'intro' | 'fading' | 'form';

export default function LandingPage() {
  const router = useRouter();
  const { calculate, error } = useSaju();
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>('intro');

  const handleIntroComplete = () => {
    if (phase !== 'intro') return;
    setPhase('fading');
  };

  // Transition from fading to form after CSS transition completes
  useEffect(() => {
    if (phase !== 'fading') return;
    const t = setTimeout(() => setPhase('form'), 300);
    return () => clearTimeout(t);
  }, [phase]);

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
      {/* Intro layer */}
      {phase !== 'form' && (
        <div
          className={`intro-container absolute inset-0 ${phase === 'fading' ? 'fading' : ''}`}
        >
          <IntroAnimation onComplete={handleIntroComplete} />
        </div>
      )}

      {/* Form layer */}
      {phase !== 'intro' && (
        <div
          className={`form-container ${phase === 'fading' ? 'fading-in' : 'visible'}`}
        >
          <main className="min-h-screen flex flex-col items-center justify-center p-4">
            <CompactHeader />

            <div className="w-full max-w-md border border-[#D4A020]/30 p-6">
              <SajuForm onSubmit={handleSubmit} loading={loading} error={error} />
            </div>

            <div className="text-[#6A5828] font-mono text-xs mt-8 text-center">
              AI 기반 사주명리 풀이 서비스
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
