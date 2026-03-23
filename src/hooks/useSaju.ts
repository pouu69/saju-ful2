'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { calculateFullSaju } from '@/lib/saju/calculator';
import type { BirthInfo, SajuResult } from '@/lib/saju/types';

const STORAGE_KEY = 'saju-result';
const AI_CACHE_KEY = 'saju-ai-cache';

export interface SajuState {
  sajuResult: SajuResult | null;
  aiText: string;
  aiCache: Record<string, string>;
  streaming: boolean;
  error: string | null;
}

export function useSaju() {
  const router = useRouter();
  const [state, setState] = useState<SajuState>({
    sajuResult: null,
    aiText: '',
    aiCache: {},
    streaming: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);
  const aiCacheRef = useRef<Record<string, string>>({});

  const calculate = useCallback((birthInfo: BirthInfo) => {
    try {
      const result = calculateFullSaju(birthInfo);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      sessionStorage.removeItem(AI_CACHE_KEY);
      aiCacheRef.current = {};
      setState(prev => ({ ...prev, sajuResult: result, aiText: '', aiCache: {}, error: null }));
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : '사주 계산에 실패했습니다.';
      setState(prev => ({ ...prev, error: msg }));
      return null;
    }
  }, []);

  const restore = useCallback((): SajuResult | null => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const result: SajuResult = JSON.parse(stored);
      const cachedAi = sessionStorage.getItem(AI_CACHE_KEY);
      const aiCache = cachedAi ? JSON.parse(cachedAi) : {};
      aiCacheRef.current = aiCache;
      setState(prev => ({ ...prev, sajuResult: result, aiCache }));
      return result;
    } catch {
      return null;
    }
  }, []);

  const streamInterpretation = useCallback(async (
    type: string,
    sajuResult: SajuResult,
    partnerSajuResult?: SajuResult,
  ) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState(prev => ({ ...prev, streaming: true, aiText: '', error: null }));
    let fullText = '';

    try {
      const body: Record<string, unknown> = {
        interpretationType: type,
        sajuResult,
      };
      if (partnerSajuResult) {
        body.partnerSajuResult = partnerSajuResult;
      }

      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error('AI 풀이 요청에 실패했습니다.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              fullText += parsed.text;
              setState(prev => ({ ...prev, aiText: fullText }));
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      const newCache = { ...aiCacheRef.current, [type]: fullText };
      aiCacheRef.current = newCache;
      sessionStorage.setItem(AI_CACHE_KEY, JSON.stringify(newCache));
      setState(prev => ({ ...prev, streaming: false, aiCache: newCache }));
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : '풀이에 실패했습니다.';
      setState(prev => ({ ...prev, streaming: false, error: msg }));
    }
  }, []);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    setState(prev => ({ ...prev, streaming: false }));
  }, []);

  const redirectIfNoData = useCallback(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      router.replace('/');
      return true;
    }
    return false;
  }, [router]);

  return {
    ...state,
    calculate,
    restore,
    streamInterpretation,
    cancelStream,
    redirectIfNoData,
  };
}
