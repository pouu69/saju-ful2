'use client';

import { useCallback, useState } from 'react';
import { downloadBlob } from '@/lib/export/cardExport';

interface ShareState {
  sharing: boolean;
  error: string | null;
}

export function useShare() {
  const [state, setState] = useState<ShareState>({ sharing: false, error: null });

  const canNativeShare = useCallback(() => {
    if (typeof navigator === 'undefined') return false;
    if (!navigator.canShare) return false;
    try {
      const testFile = new File(['test'], 'test.png', { type: 'image/png' });
      return navigator.canShare({ files: [testFile] });
    } catch {
      return false;
    }
  }, []);

  const shareCard = useCallback(async (blob: Blob, filename: string) => {
    setState({ sharing: true, error: null });
    try {
      const file = new File([blob], filename, { type: 'image/png' });

      if (canNativeShare()) {
        await navigator.share({
          title: '나의 사주 카드',
          files: [file],
        });
      } else {
        downloadBlob(blob, filename);
      }
      setState({ sharing: false, error: null });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setState({ sharing: false, error: null });
        return;
      }
      try {
        downloadBlob(blob, filename);
        setState({ sharing: false, error: null });
      } catch {
        setState({ sharing: false, error: '공유에 실패했습니다.' });
      }
    }
  }, [canNativeShare]);

  const downloadCard = useCallback((blob: Blob, filename: string) => {
    downloadBlob(blob, filename);
  }, []);

  return { ...state, shareCard, downloadCard, canNativeShare };
}
