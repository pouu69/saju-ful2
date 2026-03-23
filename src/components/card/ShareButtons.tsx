'use client';

import { useShare } from '@/hooks/useShare';

interface ShareButtonsProps {
  blob: Blob | null;
  filename: string;
}

export function ShareButtons({ blob, filename }: ShareButtonsProps) {
  const { shareCard, downloadCard, sharing, canNativeShare } = useShare();

  if (!blob) return null;

  return (
    <div className="flex gap-3 justify-center mt-4">
      <button
        onClick={() => downloadCard(blob, filename)}
        className="px-6 py-3 border border-[#D4A020] text-[#D4A020] font-mono
          hover:bg-[#D4A020]/10 active:bg-[#D4A020]/20 transition-colors min-h-[48px]"
      >
        다운로드
      </button>
      {canNativeShare() && (
        <button
          onClick={() => shareCard(blob, filename)}
          disabled={sharing}
          className="px-6 py-3 border border-[#D4A020] text-[#D4A020] font-mono
            hover:bg-[#D4A020]/10 active:bg-[#D4A020]/20 disabled:opacity-40
            transition-colors min-h-[48px]"
        >
          {sharing ? '공유 중...' : '공유하기'}
        </button>
      )}
    </div>
  );
}
