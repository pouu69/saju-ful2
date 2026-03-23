'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SajuForm } from '@/components/form/SajuForm';
import { useSaju } from '@/hooks/useSaju';
import type { BirthInfo } from '@/lib/saju/types';

export default function LandingPage() {
  const router = useRouter();
  const { calculate, error } = useSaju();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (birthInfo: BirthInfo) => {
    setLoading(true);
    const result = calculate(birthInfo);
    if (result) {
      router.push('/result');
    } else {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Title */}
      <div className="text-center mb-8 font-mono">
        <h1 className="text-[#FFD060] text-xl sm:text-2xl tracking-widest">
          사 주 명 리 의  미 궁
        </h1>
        <p className="text-[#CC8833] text-base sm:text-lg mt-1">
          四 柱 命 理 의  迷 宮
        </p>
        <div className="text-[#D4A020] mt-3 text-sm">
          ══════════════════════
        </div>
      </div>

      {/* Form */}
      <div className="w-full max-w-md border border-[#D4A020]/30 p-6">
        <SajuForm onSubmit={handleSubmit} loading={loading} error={error} />
      </div>

      {/* Footer */}
      <div className="text-[#6A5828] font-mono text-xs mt-8 text-center">
        AI 기반 사주명리 풀이 서비스
      </div>
    </main>
  );
}
