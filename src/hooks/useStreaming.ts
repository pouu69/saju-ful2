'use client';

import { useState, useCallback, useRef } from 'react';
import { SajuResult } from '@/lib/saju/types';

export function useStreaming() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const streamInterpretation = useCallback(
    async (
      roomId: string,
      sajuResult: SajuResult,
      onChunk: (text: string) => void,
      onComplete: () => void,
      onError: (error: string) => void,
      partnerSajuResult?: SajuResult | null,
    ) => {
      cancelStream();
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch('/api/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, sajuResult, userName: sajuResult.birthInfo.name, partnerSajuResult }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('AI 서버 응답 오류');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('스트림을 읽을 수 없습니다');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                onComplete();
                setIsStreaming(false);
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) onChunk(parsed.text);
                if (parsed.error) onError(parsed.error);
              } catch {
                // skip parse errors
              }
            }
          }
        }

        onComplete();
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          onError('AI 해석 중 오류가 발생했습니다.');
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [cancelStream],
  );

  return { isStreaming, streamInterpretation, cancelStream };
}
