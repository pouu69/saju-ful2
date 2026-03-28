'use client';

import { useShare } from '@/hooks/useShare';
import { useToast } from '@/hooks/useToast';

interface ShareButtonsProps {
  blob: Blob | null;
  filename: string;
  shareToken?: string;
}

export function ShareButtons({ blob, filename, shareToken }: ShareButtonsProps) {
  const { shareCard, downloadCard, sharing, canNativeShare } = useShare();
  const { show: showToast, ToastUI } = useToast();

  const handleCopyLink = async () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/share/${shareToken}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('링크가 복사되었습니다!');
    } catch {
      showToast('링크: ' + url);
    }
  };

  if (!blob && !shareToken) return null;

  return (
    <div className="flex gap-3 justify-center mt-4 flex-wrap">
      {blob && (
        <button
          onClick={() => downloadCard(blob, filename)}
          className="px-6 py-3 border border-[#D4A020] text-[#D4A020] font-mono
            hover:bg-[#D4A020]/10 active:bg-[#D4A020]/20 transition-colors min-h-[48px]"
        >
          💾 저장
        </button>
      )}
      {blob && canNativeShare() && (
        <button
          onClick={() => shareCard(blob, filename)}
          disabled={sharing}
          className="px-6 py-3 border border-[#D4A020] text-[#D4A020] font-mono
            hover:bg-[#D4A020]/10 active:bg-[#D4A020]/20 disabled:opacity-40
            transition-colors min-h-[48px]"
        >
          {sharing ? '공유 중...' : '📤 공유'}
        </button>
      )}
      {shareToken && (
        <button
          onClick={handleCopyLink}
          className="px-6 py-3 border border-[#68d391]/50 text-[#68d391] font-mono
            hover:bg-[#68d391]/10 transition-colors min-h-[48px]"
        >
          🔗 링크 복사
        </button>
      )}
      {ToastUI}
    </div>
  );
}
