'use client';

import { useEffect, useState } from 'react';

interface CardPreviewProps {
  renderCard: () => Promise<Blob>;
  onBlobReady?: (blob: Blob) => void;
  className?: string;
}

export function CardPreview({ renderCard, onBlobReady, className }: CardPreviewProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function render() {
      try {
        setLoading(true);
        setError(null);
        await document.fonts.load('16px "D2Coding"');
        const blob = await renderCard();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setImgSrc(objectUrl);
        onBlobReady?.(blob);
      } catch {
        if (!cancelled) setError('카드 생성에 실패했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    render();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [renderCard, onBlobReady]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 border border-[#D4A020]/20 ${className ?? ''}`}>
        <span className="text-[#D4A020] font-mono animate-pulse">카드 생성 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 border border-[#FF5544]/30 ${className ?? ''}`}>
        <span className="text-[#FF5544] font-mono">{error}</span>
      </div>
    );
  }

  return imgSrc ? (
    <img
      src={imgSrc}
      alt="사주 카드"
      className={`w-full max-w-md mx-auto block ${className ?? ''}`}
    />
  ) : null;
}
