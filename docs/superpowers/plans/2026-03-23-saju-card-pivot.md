# Saju Card Pivot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivot from MUD game to card-focused saju service: form input → AI interpretation → card preview/share

**Architecture:** Next.js App Router with page-based routing (`/` → `/result` → `/result/compatibility`). Saju calculation library unchanged. UI rebuilt with ASCII/terminal aesthetic. State passed via sessionStorage. Cards rendered client-side with Canvas API.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS v4, Canvas API, Web Share API, D2Coding font

**Spec:** `docs/superpowers/specs/2026-03-23-saju-card-pivot-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/app/page.tsx` | Landing page: title + SajuForm, calculateFullSaju on submit, navigate to /result |
| `src/app/result/page.tsx` | Result page: AI streaming interpretation + CardPreview + ShareButtons + navigation to other cards |
| `src/app/result/compatibility/page.tsx` | Compatibility page: partner form + compatibility card |
| `src/components/form/SajuForm.tsx` | Terminal-styled form: name, birthdate, calendar, hour, gender, marital, occupation |
| `src/components/card/CardPreview.tsx` | Renders card PNG blob as `<img>` via ObjectURL, handles cleanup |
| `src/components/card/ShareButtons.tsx` | Download + Web Share API with fallback |
| `src/hooks/useSaju.ts` | Orchestrates: sessionStorage read/write, SSE streaming, aiCache management |
| `src/hooks/useShare.ts` | Web Share API wrapper with canShare detection and download fallback |
| `src/lib/export/luckCardExport.ts` | Canvas renderer for luck cycle card |
| `src/lib/export/compatCardExport.ts` | Canvas renderer for compatibility card |

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/ai/prompts.ts` | Remove MUD references, rename roomId → interpretationType, delete detail case |
| `src/lib/ai/templates.ts` | Remove MUD references from template fallback text |
| `src/app/api/interpret/route.ts` | Rename roomId → interpretationType in request body parsing |
| `src/lib/export/cardExport.ts` | Parameterize CARD_INNER_W for mobile, update title text |
| `src/app/layout.tsx` | Update SEO metadata: title, description, structured data |
| `src/app/manifest.ts` | Update description |
| `src/app/sitemap.ts` | Add /result, /result/compatibility routes |
| `src/app/opengraph-image.tsx` | Update description text |
| `src/app/(pages)/layout.tsx` | Update nav text |

### Deleted Files

| File | Reason |
|------|--------|
| `src/lib/mud/rooms.ts` | MUD rooms |
| `src/lib/mud/engine.ts` | MUD engine |
| `src/lib/mud/commandParser.ts` | MUD command parser |
| `src/lib/mud/types.ts` | MUD types |
| `src/hooks/useGame.ts` | MUD game state |
| `src/hooks/useTerminal.ts` | Terminal line management |
| `src/hooks/useStreaming.ts` | SSE logic moves into useSaju |
| `src/components/terminal/Terminal.tsx` | Terminal UI |
| `src/components/terminal/TerminalInput.tsx` | Terminal input |
| `src/components/terminal/TerminalLine.tsx` | Terminal line display |
| `src/components/terminal/TypingEffect.tsx` | Typing animation |
| `src/components/SidePanel.tsx` | Glossary sidebar |
| `src/components/saju/Charts.ts` | Terminal text charts |
| `src/components/saju/PillarDisplay.tsx` | Terminal pillar display |

---

## Task 1: AI Prompts — Remove MUD References

**Files:**
- Modify: `src/lib/ai/prompts.ts`
- Modify: `src/lib/ai/templates.ts`
- Modify: `src/app/api/interpret/route.ts`

- [ ] **Step 1: Update SYSTEM_PROMPT in prompts.ts**

Replace the MUD sage persona with a saju expert persona. Keep the same tone rules (반말, ~하지/~일세 style) but remove cave/room/MUD references.

```typescript
// Before: "당신은 MUD 텍스트 게임 속의 현자(賢者)이자..."
// After:
export const SYSTEM_PROMPT = `당신은 사주명리 전문가(賢者)이자 동양철학 해설가입니다.

[톤 & 페르소나]
- 반말 + 자연스러운 권위체: ~하지, ~일세, ~것이야, ~란다
- "그대"로 호칭
- 허허, 음... 같은 현자의 감탄사 자연스럽게 사용
- 이모지, 마크다운 금지
- ASCII 장식(──, ═══) 사용

...나머지 톤 규칙 유지, MUD/방/동굴 참조만 제거...
`;
```

- [ ] **Step 2: Rename roomId → interpretationType in getRoomPrompt**

```typescript
// Before:
export function getRoomPrompt(roomId: string, saju: SajuResult, partnerSaju?: SajuResult): string
// After:
export function getInterpretationPrompt(type: string, saju: SajuResult, partnerSaju?: SajuResult): string
```

Remove the `detail` case. Keep `synthesis`, `luck`, `compatibility`. Strip "이 방은..." prefixes from each case.

- [ ] **Step 3: Add luck card summary prompt variant**

Add a `luck-card` type that requests a 2-3 line summary suitable for card rendering:

```typescript
case 'luck-card':
  return `${sajuContext}
[요청]
위 사주의 대운과 세운을 2-3줄로 요약해주세요.
현재 대운의 핵심 기운과 올해의 흐름만 간결하게.
──────────────────`;
```

- [ ] **Step 4: Update API route to use interpretationType**

In `src/app/api/interpret/route.ts`, rename the request body field:

```typescript
// Before:
const { roomId, sajuResult, partnerSajuResult } = await req.json();
const prompt = getRoomPrompt(roomId, sajuResult, partnerSajuResult);

// After:
const { interpretationType, sajuResult, partnerSajuResult } = await req.json();
const prompt = getInterpretationPrompt(interpretationType, sajuResult, partnerSajuResult);
```

- [ ] **Step 5: Update templates.ts**

Remove MUD references from template fallback text. Replace "이 방에서는..." with neutral phrasing.

- [ ] **Step 6: Verify build passes**

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/ai/prompts.ts src/lib/ai/templates.ts src/app/api/interpret/route.ts
git commit -m "refactor: remove MUD references from AI prompts, rename roomId to interpretationType"
```

---

## Task 2: Parameterize Card Renderer for Mobile

**Files:**
- Modify: `src/lib/export/cardExport.ts`

- [ ] **Step 1: Add width parameter to renderCardToPng**

```typescript
// Before:
export async function renderCardToPng(
  saju: SajuResult,
  aiCache: Record<string, string>,
): Promise<Blob>

// After:
export async function renderCardToPng(
  saju: SajuResult,
  aiCache: Record<string, string>,
  options?: { cardWidth?: number },
): Promise<Blob> {
  const CARD_W = options?.cardWidth ?? 520;
  // Replace all CARD_INNER_W references with CARD_W
```

- [ ] **Step 2: Update title text**

Keep "사주명리의 미궁" / "四柱命理의 迷宮" — this is the brand name, not MUD-specific.

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/export/cardExport.ts
git commit -m "feat: parameterize card width for mobile responsiveness"
```

---

## Task 3: useShare Hook

**Files:**
- Create: `src/hooks/useShare.ts`

- [ ] **Step 1: Create useShare hook**

```typescript
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
      // User cancelled share dialog — not an error
      if (err instanceof Error && err.name === 'AbortError') {
        setState({ sharing: false, error: null });
        return;
      }
      // Share failed — fallback to download
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
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useShare.ts
git commit -m "feat: add useShare hook with Web Share API and download fallback"
```

---

## Task 4: useSaju Hook

**Files:**
- Create: `src/hooks/useSaju.ts`

- [ ] **Step 1: Create useSaju hook**

This hook combines saju calculation, sessionStorage persistence, SSE streaming, and aiCache management.

```typescript
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

  // Calculate saju and save to sessionStorage
  const calculate = useCallback((birthInfo: BirthInfo) => {
    try {
      const result = calculateFullSaju(birthInfo);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      sessionStorage.removeItem(AI_CACHE_KEY);
      setState(prev => ({ ...prev, sajuResult: result, aiText: '', aiCache: {}, error: null }));
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : '사주 계산에 실패했습니다.';
      setState(prev => ({ ...prev, error: msg }));
      return null;
    }
  }, []);

  // Restore from sessionStorage
  const restore = useCallback((): SajuResult | null => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const result: SajuResult = JSON.parse(stored);
      const cachedAi = sessionStorage.getItem(AI_CACHE_KEY);
      const aiCache = cachedAi ? JSON.parse(cachedAi) : {};
      setState(prev => ({ ...prev, sajuResult: result, aiCache }));
      return result;
    } catch {
      return null;
    }
  }, []);

  // Stream AI interpretation
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

      // Save to cache
      const newCache = { ...state.aiCache, [type]: fullText };
      sessionStorage.setItem(AI_CACHE_KEY, JSON.stringify(newCache));
      setState(prev => ({ ...prev, streaming: false, aiCache: newCache }));
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : '풀이에 실패했습니다.';
      setState(prev => ({ ...prev, streaming: false, error: msg }));
    }
  }, [state.aiCache]);

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
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSaju.ts
git commit -m "feat: add useSaju hook with calculation, sessionStorage, and SSE streaming"
```

---

## Task 5: SajuForm Component

**Files:**
- Create: `src/components/form/SajuForm.tsx`

- [ ] **Step 1: Create the terminal-styled form component**

```typescript
'use client';

import { useState, FormEvent } from 'react';
import type { BirthInfo } from '@/lib/saju/types';

// 시주 선택 옵션 (12지지 시간대)
const HOUR_OPTIONS = [
  { value: -1, label: '모름' },
  { value: 0, label: '자시 (23:30~01:29)' },
  { value: 1, label: '축시 (01:30~03:29)' },
  { value: 3, label: '인시 (03:30~05:29)' },
  { value: 5, label: '묘시 (05:30~07:29)' },
  { value: 7, label: '진시 (07:30~09:29)' },
  { value: 9, label: '사시 (09:30~11:29)' },
  { value: 11, label: '오시 (11:30~13:29)' },
  { value: 13, label: '미시 (13:30~15:29)' },
  { value: 15, label: '신시 (15:30~17:29)' },
  { value: 17, label: '유시 (17:30~19:29)' },
  { value: 19, label: '술시 (19:30~21:29)' },
  { value: 21, label: '해시 (21:30~23:29)' },
];

interface SajuFormProps {
  onSubmit: (birthInfo: BirthInfo) => void;
  loading?: boolean;
  error?: string | null;
  /** Compact mode: hide marital/occupation fields (for partner input) */
  compact?: boolean;
}

export function SajuForm({ onSubmit, loading, error, compact }: SajuFormProps) {
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>('solar');
  const [hour, setHour] = useState(-1);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [maritalStatus, setMaritalStatus] = useState<'single' | 'married' | 'etc'>('single');
  const [occupation, setOccupation] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const birthInfo: BirthInfo = {
      name: name.trim() || '무명',
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      hour: hour === -1 ? null : hour,
      minute: 0,
      gender,
      calendarType,
      maritalStatus: compact ? 'etc' : maritalStatus,
      ...(occupation.trim() && { occupation: occupation.trim() }),
    };
    onSubmit(birthInfo);
  };

  const inputClass = 'bg-transparent border-b border-[#D4A020]/40 text-[#E8D8C0] ' +
    'font-mono outline-none focus:border-[#D4A020] w-full py-2 px-1 text-base';
  const labelClass = 'text-[#D4A020] font-mono text-base';
  const radioClass = 'accent-[#D4A020]';

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full max-w-md mx-auto px-4">
      {/* 이름 */}
      <div>
        <label className={labelClass}>{`> 이름을 입력하시오`}</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="홍길동"
          className={inputClass}
          autoFocus
        />
      </div>

      {/* 생년월일 */}
      <div>
        <label className={labelClass}>{`> 생년월일`}</label>
        <div className="flex gap-2 mt-1">
          <input type="number" value={year} onChange={e => setYear(e.target.value)}
            placeholder="년" min="1900" max="2100" required className={`${inputClass} w-24`} />
          <input type="number" value={month} onChange={e => setMonth(e.target.value)}
            placeholder="월" min="1" max="12" required className={`${inputClass} w-16`} />
          <input type="number" value={day} onChange={e => setDay(e.target.value)}
            placeholder="일" min="1" max="31" required className={`${inputClass} w-16`} />
        </div>
      </div>

      {/* 양력/음력 */}
      <div>
        <label className={labelClass}>{`> 양력/음력`}</label>
        <div className="flex gap-6 mt-2">
          <label className="flex items-center gap-2 text-[#E8D8C0] font-mono cursor-pointer">
            <input type="radio" name="calendar" value="solar" checked={calendarType === 'solar'}
              onChange={() => setCalendarType('solar')} className={radioClass} />
            양력
          </label>
          <label className="flex items-center gap-2 text-[#E8D8C0] font-mono cursor-pointer">
            <input type="radio" name="calendar" value="lunar" checked={calendarType === 'lunar'}
              onChange={() => setCalendarType('lunar')} className={radioClass} />
            음력
          </label>
        </div>
      </div>

      {/* 태어난 시 */}
      <div>
        <label className={labelClass}>{`> 태어난 시`}</label>
        <select value={hour} onChange={e => setHour(parseInt(e.target.value))}
          className={`${inputClass} cursor-pointer`}>
          {HOUR_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* 성별 */}
      <div>
        <label className={labelClass}>{`> 성별`}</label>
        <div className="flex gap-6 mt-2">
          <label className="flex items-center gap-2 text-[#E8D8C0] font-mono cursor-pointer">
            <input type="radio" name="gender" value="male" checked={gender === 'male'}
              onChange={() => setGender('male')} className={radioClass} />
            남
          </label>
          <label className="flex items-center gap-2 text-[#E8D8C0] font-mono cursor-pointer">
            <input type="radio" name="gender" value="female" checked={gender === 'female'}
              onChange={() => setGender('female')} className={radioClass} />
            여
          </label>
        </div>
      </div>

      {/* 결혼여부 (compact 모드에서는 숨김) */}
      {!compact && (
        <div>
          <label className={labelClass}>{`> 결혼여부`}</label>
          <div className="flex gap-4 mt-2 flex-wrap">
            {([['single', '미혼'], ['married', '기혼'], ['etc', '기타']] as const).map(([val, label]) => (
              <label key={val} className="flex items-center gap-2 text-[#E8D8C0] font-mono cursor-pointer">
                <input type="radio" name="marital" value={val} checked={maritalStatus === val}
                  onChange={() => setMaritalStatus(val)} className={radioClass} />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 직업 (compact 모드에서는 숨김) */}
      {!compact && (
        <div>
          <label className={labelClass}>{`> 직업 (선택)`}</label>
          <input type="text" value={occupation} onChange={e => setOccupation(e.target.value)}
            placeholder="회사원, 학생, 자영업 등" className={inputClass} />
        </div>
      )}

      {/* 에러 표시 */}
      {error && (
        <div className="text-[#FF5544] font-mono text-sm border border-[#FF5544]/30 p-2">
          {`! ${error}`}
        </div>
      )}

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={loading || !year || !month || !day}
        className="w-full py-3 border-2 border-[#D4A020] text-[#D4A020] font-mono text-lg
          hover:bg-[#D4A020]/10 active:bg-[#D4A020]/20 disabled:opacity-40
          disabled:cursor-not-allowed transition-colors mt-4 min-h-[48px]"
      >
        {loading ? '계산 중...' : '▶ 사주 풀이 시작'}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/form/SajuForm.tsx
git commit -m "feat: add terminal-styled SajuForm component"
```

---

## Task 6: CardPreview and ShareButtons Components

**Files:**
- Create: `src/components/card/CardPreview.tsx`
- Create: `src/components/card/ShareButtons.tsx`

- [ ] **Step 1: Create CardPreview component**

```typescript
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
        // Wait for font before rendering
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
```

- [ ] **Step 2: Create ShareButtons component**

```typescript
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
      <button
        onClick={() => shareCard(blob, filename)}
        disabled={sharing}
        className="px-6 py-3 border border-[#D4A020] text-[#D4A020] font-mono
          hover:bg-[#D4A020]/10 active:bg-[#D4A020]/20 disabled:opacity-40
          transition-colors min-h-[48px]"
      >
        {sharing ? '공유 중...' : canNativeShare() ? '공유하기' : '다운로드'}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/card/CardPreview.tsx src/components/card/ShareButtons.tsx
git commit -m "feat: add CardPreview and ShareButtons components"
```

---

## Task 7: Landing Page

**Files:**
- Create: `src/app/page.tsx` (replace existing)

- [ ] **Step 1: Read the existing page.tsx to understand current structure**

```bash
# Understand what we're replacing
cat src/app/page.tsx | head -20
```

- [ ] **Step 2: Write the new landing page**

```typescript
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
```

- [ ] **Step 3: Verify build and dev server**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: replace MUD game with landing page and saju form"
```

---

## Task 8: Result Page

**Files:**
- Create: `src/app/result/page.tsx`

- [ ] **Step 1: Create result page**

```typescript
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSaju } from '@/hooks/useSaju';
import { CardPreview } from '@/components/card/CardPreview';
import { ShareButtons } from '@/components/card/ShareButtons';
import { renderCardToPng } from '@/lib/export/cardExport';

export default function ResultPage() {
  const router = useRouter();
  const saju = useSaju();
  const [cardBlob, setCardBlob] = useState<Blob | null>(null);
  const [showLuckCard, setShowLuckCard] = useState(false);

  // Restore data from sessionStorage on mount
  useEffect(() => {
    const result = saju.restore();
    if (!result) {
      router.replace('/');
      return;
    }
    // Start AI interpretation if not cached
    if (!saju.aiCache.synthesis) {
      saju.streamInterpretation('synthesis', result);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sajuResult = saju.sajuResult;
  if (!sajuResult) return null;

  const cardFilename = `${sajuResult.birthInfo.name || '사주'}_사주카드_${new Date().toISOString().slice(0, 10)}.png`;

  const renderBasicCard = useCallback(
    () => renderCardToPng(sajuResult, saju.aiCache),
    [sajuResult, saju.aiCache]
  );

  return (
    <main className="min-h-screen flex flex-col items-center p-4 py-8">
      {/* Header */}
      <div className="text-center mb-6 font-mono">
        <h1 className="text-[#FFD060] text-lg">
          {sajuResult.birthInfo.name || '무명'}의 사주 풀이
        </h1>
        <div className="text-[#D4A020] mt-2 text-sm">
          ══════════════════════
        </div>
      </div>

      {/* AI Interpretation */}
      <section className="w-full max-w-lg border border-[#D4A020]/30 p-4 mb-6">
        <h2 className="text-[#CC88FF] font-mono text-center mb-3">
          ─── 종합 풀이 ───
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
              onClick={() => saju.streamInterpretation('synthesis', sajuResult)}
              className="px-4 py-2 border border-[#D4A020] text-[#D4A020] font-mono text-sm
                hover:bg-[#D4A020]/10"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <div className="font-mono text-[#E8D8C0] text-sm whitespace-pre-wrap leading-relaxed">
            {saju.aiText || saju.aiCache.synthesis}
          </div>
        )}
      </section>

      {/* Card Preview */}
      <section className="w-full max-w-lg border border-[#D4A020]/30 p-4 mb-6">
        <h2 className="text-[#CC88FF] font-mono text-center mb-3">
          ─── 사주 카드 ───
        </h2>
        <CardPreview
          renderCard={renderBasicCard}
          onBlobReady={setCardBlob}
        />
        <ShareButtons blob={cardBlob} filename={cardFilename} />
      </section>

      {/* Navigation */}
      <section className="w-full max-w-lg border border-[#D4A020]/30 p-4">
        <h2 className="text-[#CC88FF] font-mono text-center mb-3">
          ─── 더 알아보기 ───
        </h2>
        <div className="space-y-3">
          <button
            onClick={() => setShowLuckCard(!showLuckCard)}
            className="w-full py-3 border border-[#D4A020]/50 text-[#D4A020] font-mono
              hover:bg-[#D4A020]/10 transition-colors min-h-[48px]"
          >
            {showLuckCard ? '▼ 대운/세운 카드 접기' : '▶ 대운/세운 카드 보기'}
          </button>

          {showLuckCard && (
            <div className="text-[#8A7848] font-mono text-center py-4 border border-dashed border-[#D4A020]/20">
              대운/세운 카드 (준비 중)
            </div>
          )}

          <button
            onClick={() => router.push('/result/compatibility')}
            className="w-full py-3 border border-[#D4A020]/50 text-[#D4A020] font-mono
              hover:bg-[#D4A020]/10 transition-colors min-h-[48px]"
          >
            ▶ 궁합 카드 만들기
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full py-3 border border-[#D4A020]/30 text-[#8A7848] font-mono
              hover:bg-[#D4A020]/10 transition-colors min-h-[48px]"
          >
            ◀ 다시 풀기
          </button>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/result/page.tsx
git commit -m "feat: add result page with AI interpretation and card preview"
```

---

## Task 9: Compatibility Page

**Files:**
- Create: `src/app/result/compatibility/page.tsx`

- [ ] **Step 1: Create compatibility page**

```typescript
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSaju } from '@/hooks/useSaju';
import { SajuForm } from '@/components/form/SajuForm';
import { CardPreview } from '@/components/card/CardPreview';
import { ShareButtons } from '@/components/card/ShareButtons';
import { renderCardToPng } from '@/lib/export/cardExport';
import { calculateFullSaju } from '@/lib/saju/calculator';
import type { BirthInfo, SajuResult } from '@/lib/saju/types';

export default function CompatibilityPage() {
  const router = useRouter();
  const saju = useSaju();
  const [partnerResult, setPartnerResult] = useState<SajuResult | null>(null);
  const [cardBlob, setCardBlob] = useState<Blob | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Restore my saju from sessionStorage
  useEffect(() => {
    const result = saju.restore();
    if (!result) {
      router.replace('/');
    }
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

  // Placeholder: uses basic card for now, will be replaced by compatCardExport
  const renderCompatCard = useCallback(
    () => {
      if (!partnerResult) return Promise.reject(new Error('No partner'));
      // TODO: Replace with renderCompatCardToPng when implemented
      return renderCardToPng(partnerResult, saju.aiCache);
    },
    [partnerResult, saju.aiCache]
  );

  const filename = sajuResult && partnerResult
    ? `${sajuResult.birthInfo.name}_${partnerResult.birthInfo.name}_궁합카드.png`
    : '궁합카드.png';

  if (!sajuResult) return null;

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
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/result/compatibility/page.tsx
git commit -m "feat: add compatibility page with partner input and card preview"
```

---

## Task 10: Update SEO, Metadata, and Sitemap

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/manifest.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/opengraph-image.tsx`
- Modify: `src/app/(pages)/layout.tsx`

- [ ] **Step 1: Update layout.tsx metadata**

Replace MUD-specific description text. Key changes:
- `description`: "AI 기반 사주명리 풀이 · 나만의 사주 카드를 만들고 공유하세요"
- Structured data: Remove "MUD 게임" references, update to "사주 카드 서비스"
- Keep all existing keywords, add: "사주카드", "사주공유"

- [ ] **Step 2: Update manifest.ts**

```typescript
description: 'AI 기반 사주명리 풀이 · 나만의 사주 카드를 만들고 공유하세요',
```

- [ ] **Step 3: Update sitemap.ts**

Add new routes:

```typescript
{
  url: `${baseUrl}/result`,
  lastModified: new Date(),
  changeFrequency: 'monthly' as const,
  priority: 0.8,
},
{
  url: `${baseUrl}/result/compatibility`,
  lastModified: new Date(),
  changeFrequency: 'monthly' as const,
  priority: 0.7,
},
```

- [ ] **Step 4: Update opengraph-image.tsx**

Replace: `AI 기반 한국 전통 사주팔자 풀이 · MUD 터미널 스타일`
With: `AI 기반 사주명리 풀이 · 나만의 사주 카드`

- [ ] **Step 5: Update (pages)/layout.tsx**

Replace: `← 미궁으로 돌아가기`
With: `← 처음으로 돌아가기`

- [ ] **Step 6: Verify build passes**

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/app/layout.tsx src/app/manifest.ts src/app/sitemap.ts src/app/opengraph-image.tsx src/app/\(pages\)/layout.tsx
git commit -m "chore: update SEO metadata and sitemap for card service pivot"
```

---

## Task 11: Delete MUD Code

**Files:**
- Delete: `src/lib/mud/` (entire directory)
- Delete: `src/hooks/useGame.ts`
- Delete: `src/hooks/useTerminal.ts`
- Delete: `src/hooks/useStreaming.ts`
- Delete: `src/components/terminal/` (entire directory)
- Delete: `src/components/SidePanel.tsx`
- Delete: `src/components/saju/Charts.ts`
- Delete: `src/components/saju/PillarDisplay.tsx`

- [ ] **Step 1: Verify no new code imports these files**

```bash
# Check for imports of deleted modules
grep -r "useGame\|useTerminal\|useStreaming\|/mud/\|/terminal/\|SidePanel\|Charts\|PillarDisplay" src/ --include="*.ts" --include="*.tsx" -l
```

Only the files being deleted themselves should appear. If new files import them, fix those imports first.

- [ ] **Step 2: Delete all MUD-related files**

```bash
rm -rf src/lib/mud/
rm -f src/hooks/useGame.ts
rm -f src/hooks/useTerminal.ts
rm -f src/hooks/useStreaming.ts
rm -rf src/components/terminal/
rm -f src/components/SidePanel.tsx
rm -f src/components/saju/Charts.ts
rm -f src/components/saju/PillarDisplay.tsx
```

- [ ] **Step 3: Clean up empty directories**

```bash
# Check if src/components/saju/ is now empty
ls src/components/saju/ 2>/dev/null
# If empty, remove it
rmdir src/components/saju/ 2>/dev/null
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: delete MUD game code (rooms, terminal, game hooks, charts)"
```

---

## Task 12: Smoke Test and Mobile Check

- [ ] **Step 1: Start dev server and test full flow**

```bash
npm run dev
```

Test manually:
1. Open `http://localhost:3000` — landing page with form
2. Fill in test data (name, birthdate, etc.)
3. Submit → navigate to `/result`
4. AI interpretation streams in
5. Card preview renders
6. Download button works
7. "궁합 카드 만들기" → `/result/compatibility`
8. Fill partner info → compatibility result shows

- [ ] **Step 2: Test mobile viewport**

Open Chrome DevTools → Toggle Device Toolbar → iPhone 14 Pro (390px)
- Form inputs are full width and tappable (min 48px height)
- Card image scales to screen width
- Buttons are finger-friendly

- [ ] **Step 3: Test edge cases**

- Direct access to `/result` without data → redirects to `/`
- Browser back from `/result` → returns to form
- AI streaming error → shows retry button
- Missing API keys → template fallback works

- [ ] **Step 4: Production build check**

```bash
npm run build
npm run lint
```

- [ ] **Step 5: Commit any fixes from testing**

```bash
git add -A
git commit -m "fix: address issues found during smoke testing"
```

---

## Future Tasks (Not in this plan)

These are tracked but deferred:

1. **대운/세운 카드 렌더러** (`luckCardExport.ts`) — Task 8의 placeholder를 실제 구현으로 교체
2. **궁합 카드 렌더러** (`compatCardExport.ts`) — Task 9의 placeholder를 두 사람 비교 카드로 교체
3. **`compatibility.ts`** — 궁합 기본 데이터 추출 유틸 (일간 관계, 띠 동물 등)
