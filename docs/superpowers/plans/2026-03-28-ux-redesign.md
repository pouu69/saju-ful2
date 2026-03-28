# UX 리디자인 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** B2C 배포 가능한 모바일 퍼스트 UX로 전면 개편 — 히어로 랜딩, 6단계 의식 입력, 봉투 공개, 오행 컬러 카드, DB 없는 공유 링크.

**Architecture:** 기존 컴포넌트 구조 유지. 랜딩·입력·결과 플로우 재설계. 공유는 base64url 토큰으로 URL에 사주 입력 데이터 임베드 (서버리스, ~16자).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS v4, Canvas API, @fullstackfamily/manseryeok

---

## 파일 맵

| 작업 | 파일 | 변경 |
|------|------|------|
| Task 1 | `src/app/globals.css` | 오행 CSS 변수 추가 |
| Task 1b | `src/hooks/useToast.ts` | 신규: 간단 toast hook (공유 링크 복사 알림용) |
| Task 2 | `src/lib/share/tokenCodec.ts` | 신규: base64url 인코더/디코더 |
| Task 3 | `src/lib/ai/templates.ts` | `generateShareSummary` 함수 export 추가 |
| Task 4 | `src/components/input/TimeGrid.tsx` | 신규: 시진 그리드 |
| Task 5 | `src/components/input/YearDrum.tsx` | 신규: 연도 선택기 |
| Task 6 | `src/components/input/StepInput.tsx` | 신규: 6단계 입력 컨테이너 |
| Task 7 | `src/app/page.tsx` | 히어로 랜딩 + StepInput 연결 |
| Task 8 | `src/components/result/EnvelopeReveal.tsx` | 신규: 봉투 개봉 애니메이션 |
| Task 9 | `src/app/result/page.tsx` | envelope 단계 + 공유링크 버튼 추가 |
| Task 10 | `src/lib/export/cardExport.ts` | 오행 4기둥 컬러 그리드 추가 |
| Task 11 | `src/components/card/ShareButtons.tsx` | 공유 링크 복사 버튼 추가 |
| Task 12 | `src/app/share/[token]/page.tsx` | 신규: 공유 카드 티저 페이지 |

---

## Task 1: 오행 CSS 변수 추가

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: globals.css의 `:root` 블록에 오행 색상 변수 추가**

`src/app/globals.css`의 `:root { --terminal-bg: ...` 블록 안에 다음 줄 추가 (기존 변수들 바로 다음에):

```css
    --element-wood:  #68d391;
    --element-fire:  #fc8181;
    --element-earth: #D4A020;
    --element-metal: #e2e8f0;
    --element-water: #76e4f7;
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 3: 커밋**

```bash
git add src/app/globals.css
git commit -m "feat: add ohaeng CSS custom properties"
```

---

## Task 1b: Toast Hook 추가

**Files:**
- Create: `src/hooks/useToast.ts`

- [ ] **Step 1: useToast.ts 생성**

```typescript
// src/hooks/useToast.ts
'use client';

import { useState, useCallback, useRef } from 'react';

interface ToastState {
  message: string;
  visible: boolean;
}

export function useToast(duration = 2000) {
  const [toast, setToast] = useState<ToastState>({ message: '', visible: false });
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback((message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, visible: true });
    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, duration);
  }, [duration]);

  const ToastUI = toast.visible ? (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        px-5 py-3 rounded-lg font-mono text-sm
        text-[#080600] font-bold
        animate-[fadeInUp_0.3s_ease]"
      style={{
        background: 'linear-gradient(135deg, #D4A020, #FFD060)',
        boxShadow: '0 4px 16px rgba(212,160,32,0.4)',
      }}
    >
      {toast.message}
    </div>
  ) : null;

  return { show, ToastUI };
}
```

- [ ] **Step 2: globals.css에 fadeInUp 키프레임 추가**

`src/app/globals.css`에 `@keyframes` 섹션 근처에 추가:

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translate(-50%, 10px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/useToast.ts src/app/globals.css
git commit -m "feat: add useToast hook for copy-link feedback"
```

---

## Task 2: Share Token 인코더/디코더

**Files:**
- Create: `src/lib/share/tokenCodec.ts`

- [ ] **Step 1: tokenCodec.ts 생성**

```typescript
// src/lib/share/tokenCodec.ts
// Encodes saju input (without name) into a ~16-char base64url token
// Format: YYYYMMDD + HH (xx=unknown) + G (M/F) + C (S/L)  = 12 chars → base64url ~16 chars

export interface ShareTokenData {
  year: number;
  month: number;
  day: number;
  hour: number | null;       // null = 모름
  gender: 'male' | 'female';
  calendarType: 'solar' | 'lunar';
}

export function encodeShareToken(data: ShareTokenData): string {
  const y = String(data.year).padStart(4, '0');
  const m = String(data.month).padStart(2, '0');
  const d = String(data.day).padStart(2, '0');
  const h = data.hour === null ? 'xx' : String(data.hour).padStart(2, '0');
  const g = data.gender === 'male' ? 'M' : 'F';
  const c = data.calendarType === 'solar' ? 'S' : 'L';
  const raw = `${y}${m}${d}${h}${g}${c}`;
  // base64url: replace + with -, / with _, strip trailing =
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decodeShareToken(token: string): ShareTokenData | null {
  try {
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const raw = atob(padded);
    if (raw.length < 12) return null;

    const year = parseInt(raw.slice(0, 4), 10);
    const month = parseInt(raw.slice(4, 6), 10);
    const day = parseInt(raw.slice(6, 8), 10);
    const hourStr = raw.slice(8, 10);
    const hour = hourStr === 'xx' ? null : parseInt(hourStr, 10);
    const gender: 'male' | 'female' = raw[10] === 'M' ? 'male' : 'female';
    const calendarType: 'solar' | 'lunar' = raw[11] === 'S' ? 'solar' : 'lunar';

    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    if (year < 1900 || year > 2100) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;

    return { year, month, day, hour, gender, calendarType };
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: 수동 검증 — 인코딩 왕복 테스트**

`npm run dev` 실행 후 브라우저 콘솔에서:
```javascript
// 예: 1990년 6월 15일, 오시(11), 남성, 양력
const raw = "1990061511MS";
const token = btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
console.log("token length:", token.length); // 기대값: 16
console.log("token:", token);
```

- [ ] **Step 3: 커밋**

```bash
git add src/lib/share/tokenCodec.ts
git commit -m "feat: add share token base64url codec"
```

---

## Task 3: 공유 요약 함수 추가

**Files:**
- Modify: `src/lib/ai/templates.ts`

- [ ] **Step 1: templates.ts에 export 함수 추가**

`src/lib/ai/templates.ts` 파일 끝에 추가:

```typescript
export interface ShareSummary {
  elementKeyword: string;      // "성장과 도전"
  elementDesc: string;         // "나무처럼 위로 뻗어가는..."
  dayMasterTheme: string;      // "겉바속촉 리더"
  dayMasterMetaphor: string;   // "하늘을 향해 곧게 솟은 거목"
  dominantElement: FiveElement;
  deficientElement: FiveElement;
  zodiacLabel: string;         // "甲子年生 쥐띠"
}

export function generateShareSummary(saju: SajuResult): ShareSummary {
  const dominant = saju.fiveElements.dominant;
  const deficient = saju.fiveElements.deficient;
  const dm = saju.dayMaster;

  const personality = ELEMENT_PERSONALITY[dominant];
  const metaphor = DAY_MASTER_METAPHOR[dm.korean] ?? {
    metaphor: '알 수 없는 운명',
    theme: '독특한 기운',
  };

  const animal = saju.yearPillar.branch.animal;
  const zodiacLabel = `${saju.yearPillar.ganjiHanja}年生 ${animal}띠`;

  return {
    elementKeyword: personality.keyword,
    elementDesc: personality.desc,
    dayMasterTheme: metaphor.theme,
    dayMasterMetaphor: metaphor.metaphor,
    dominantElement: dominant,
    deficientElement: deficient,
    zodiacLabel,
  };
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 3: 커밋**

```bash
git add src/lib/ai/templates.ts
git commit -m "feat: export generateShareSummary from templates"
```

---

## Task 4: TimeGrid 컴포넌트

**Files:**
- Create: `src/components/input/TimeGrid.tsx`

- [ ] **Step 1: TimeGrid.tsx 생성**

```tsx
// src/components/input/TimeGrid.tsx
'use client';

interface TimeOption {
  value: number | null;
  label: string;
  hanja: string;
  emoji: string;
  range: string;
}

// value must match SajuForm HOUR_OPTIONS (0,1,3,5,...21) — passed directly to calculateSaju
const TIME_OPTIONS: TimeOption[] = [
  { value: 0,  label: '자시', hanja: '子', emoji: '🌙', range: '23:30~01:29' },
  { value: 1,  label: '축시', hanja: '丑', emoji: '🐄', range: '01:30~03:29' },
  { value: 3,  label: '인시', hanja: '寅', emoji: '🌄', range: '03:30~05:29' },
  { value: 5,  label: '묘시', hanja: '卯', emoji: '🌅', range: '05:30~07:29' },
  { value: 7,  label: '진시', hanja: '辰', emoji: '🌤', range: '07:30~09:29' },
  { value: 9,  label: '사시', hanja: '巳', emoji: '☀️', range: '09:30~11:29' },
  { value: 11, label: '오시', hanja: '午', emoji: '🌞', range: '11:30~13:29' },
  { value: 13, label: '미시', hanja: '未', emoji: '⛅', range: '13:30~15:29' },
  { value: 15, label: '신시', hanja: '申', emoji: '🌆', range: '15:30~17:29' },
  { value: 17, label: '유시', hanja: '酉', emoji: '🌇', range: '17:30~19:29' },
  { value: 19, label: '술시', hanja: '戌', emoji: '🌃', range: '19:30~21:29' },
  { value: 21, label: '해시', hanja: '亥', emoji: '🌙', range: '21:30~23:29' },
  { value: null, label: '모름', hanja: '?', emoji: '❓', range: '괜찮아요' },
];

interface TimeGridProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export function TimeGrid({ value, onChange }: TimeGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 w-full">
      {TIME_OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              'flex flex-col items-center justify-center py-3 px-1 rounded border transition-all min-h-[72px]',
              isSelected
                ? 'border-[#D4A020] bg-[#D4A020]/15 text-[#FFD060]'
                : 'border-[#2a1e08] bg-transparent text-[#D4A020] hover:border-[#D4A020]/50 hover:bg-[#D4A020]/5',
            ].join(' ')}
          >
            <span className="text-lg mb-1">{opt.emoji}</span>
            <span className="font-mono text-xs font-bold">{opt.hanja}{opt.label !== '모름' ? '時' : ''}</span>
            <span className="font-mono text-[10px] text-[#8A6618] mt-0.5">{opt.range}</span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: lint 확인**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 3: 커밋**

```bash
git add src/components/input/TimeGrid.tsx
git commit -m "feat: add TimeGrid component for 시진 selection"
```

---

## Task 5: YearDrum 컴포넌트

**Files:**
- Create: `src/components/input/YearDrum.tsx`

- [ ] **Step 1: YearDrum.tsx 생성**

```tsx
// src/components/input/YearDrum.tsx
'use client';

import { useCallback } from 'react';

// 간지 60갑자 순환 계산
const STEMS = ['갑','을','병','정','무','기','경','신','임','계'];
const BRANCHES = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
const ANIMALS = ['쥐','소','호랑이','토끼','용','뱀','말','양','원숭이','닭','개','돼지'];
const ANIMAL_EMOJI = ['🐭','🐄','🐯','🐰','🐲','🐍','🐎','🐑','🐒','🐓','🐕','🐖'];

function getGanji(year: number): { ganji: string; animal: string; emoji: string } {
  const stemIdx = (year - 4) % 10;
  const branchIdx = (year - 4) % 12;
  const stem = STEMS[((stemIdx % 10) + 10) % 10];
  const branch = BRANCHES[((branchIdx % 12) + 12) % 12];
  const animalIdx = ((branchIdx % 12) + 12) % 12;
  return {
    ganji: `${stem}${branch}년`,
    animal: ANIMALS[animalIdx],
    emoji: ANIMAL_EMOJI[animalIdx],
  };
}

interface YearDrumProps {
  value: number;
  onChange: (year: number) => void;
  min?: number;
  max?: number;
}

export function YearDrum({ value, onChange, min = 1930, max = new Date().getFullYear() }: YearDrumProps) {
  const decrement = useCallback(() => {
    if (value > min) onChange(value - 1);
  }, [value, min, onChange]);

  const increment = useCallback(() => {
    if (value < max) onChange(value + 1);
  }, [value, max, onChange]);

  const { ganji, animal, emoji } = getGanji(value);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Drum display */}
      <div className="w-full flex flex-col items-center">
        {/* Previous year (dim) */}
        <div className="text-[#3a2a08] font-mono text-xl py-2">{value - 1}</div>

        {/* Selected year */}
        <div className="relative w-full flex items-center justify-center border-t border-b border-[#D4A020] py-4 bg-[#D4A020]/5">
          <button
            type="button"
            onClick={decrement}
            disabled={value <= min}
            className="absolute left-4 text-[#D4A020] text-2xl font-bold disabled:text-[#2a1e08] min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="이전 연도"
          >
            ‹
          </button>

          <div className="text-center">
            <div className="text-[#FFD060] font-mono text-4xl font-bold">{value}</div>
            <div className="flex items-center gap-2 justify-center mt-1">
              <span className="text-xl">{emoji}</span>
              <span className="text-[#68d391] font-mono text-sm">{ganji} · {animal}띠</span>
            </div>
          </div>

          <button
            type="button"
            onClick={increment}
            disabled={value >= max}
            className="absolute right-4 text-[#D4A020] text-2xl font-bold disabled:text-[#2a1e08] min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="다음 연도"
          >
            ›
          </button>
        </div>

        {/* Next year (dim) */}
        <div className="text-[#3a2a08] font-mono text-xl py-2">{value + 1}</div>
      </div>

      {/* Fast jump input */}
      <div className="flex items-center gap-2">
        <span className="text-[#8A6618] font-mono text-sm">직접 입력:</span>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v) && v >= min && v <= max) onChange(v);
          }}
          className="bg-transparent border-b border-[#D4A020]/40 text-[#E8D8C0] font-mono
            outline-none focus:border-[#D4A020] w-20 py-1 px-1 text-sm text-center"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: lint 확인**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 3: 커밋**

```bash
git add src/components/input/YearDrum.tsx
git commit -m "feat: add YearDrum component with ganji display"
```

---

## Task 6: StepInput 컨테이너

**Files:**
- Create: `src/components/input/StepInput.tsx`

- [ ] **Step 1: StepInput.tsx 생성**

```tsx
// src/components/input/StepInput.tsx
'use client';

import { useState, useCallback } from 'react';
import { YearDrum } from './YearDrum';
import { TimeGrid } from './TimeGrid';
import type { BirthInfo } from '@/lib/saju/types';

interface StepInputProps {
  onComplete: (birthInfo: BirthInfo) => void;
  loading?: boolean;
}

interface StepState {
  name: string;
  year: number;
  month: string;
  day: string;
  calendarType: 'solar' | 'lunar';
  hour: number | null;
  gender: 'male' | 'female';
  maritalStatus: 'single' | 'married' | 'etc';
}

const TOTAL_STEPS = 6;

const STEP_LABELS = ['성함', '생년', '생월/일', '역법', '시간', '성별'];

export function StepInput({ onComplete, loading }: StepInputProps) {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<StepState>({
    name: '',
    year: new Date().getFullYear() - 30,
    month: '',
    day: '',
    calendarType: 'solar',
    hour: null,
    gender: 'male',
    maritalStatus: 'single',
  });
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(<K extends keyof StepState>(key: K, value: StepState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }, []);

  const validateStep = (): boolean => {
    setError(null);
    if (step === 1 && !state.name.trim()) {
      setError('성함을 입력해주세요');
      return false;
    }
    if (step === 3) {
      const m = parseInt(state.month, 10);
      const d = parseInt(state.day, 10);
      if (isNaN(m) || m < 1 || m > 12) { setError('월은 1~12 사이로 입력해주세요'); return false; }
      if (isNaN(d) || d < 1 || d > 31) { setError('일은 1~31 사이로 입력해주세요'); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const birthInfo: BirthInfo = {
      name: state.name.trim() || '무명',
      year: state.year,
      month: parseInt(state.month, 10),
      day: parseInt(state.day, 10),
      hour: state.hour,
      minute: 0,
      gender: state.gender,
      calendarType: state.calendarType,
      maritalStatus: state.maritalStatus,
    };
    onComplete(birthInfo);
  };

  const inputClass = 'bg-transparent border-b border-[#D4A020]/40 text-[#E8D8C0] ' +
    'font-mono outline-none focus:border-[#D4A020] w-full py-2 px-1 text-xl';

  return (
    <div className="w-full max-w-md mx-auto px-4 flex flex-col min-h-screen py-8">
      {/* Progress bar */}
      <div className="flex gap-1.5 mb-6">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-all duration-300 ${
              i < step ? 'bg-[#D4A020]' : 'bg-[#2a1e08]'
            }`}
          />
        ))}
      </div>

      <div className="text-[#8A6618] font-mono text-xs mb-8 tracking-widest">
        {step} / {TOTAL_STEPS} · {STEP_LABELS[step - 1]}
      </div>

      {/* Step content */}
      <div className="flex-1">

        {step === 1 && (
          <div>
            <div className="text-[#FFD060] font-mono text-2xl font-bold leading-tight mb-2">
              성함이<br />어떻게 되십니까?
            </div>
            <div className="text-[#8A6618] font-mono text-sm mb-8">
              이름을 알아야 운명을 읽을 수 있습니다
            </div>
            <div className="border-b border-[#D4A020] pb-2 flex items-center gap-2">
              <span className="text-[#8A6618] font-mono text-lg">›</span>
              <input
                type="text"
                value={state.name}
                onChange={(e) => update('name', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                placeholder="홍길동"
                className={inputClass}
                autoFocus
              />
            </div>
            <div className="text-[#555] font-mono text-xs mt-2">한글 또는 영문</div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="text-[#FFD060] font-mono text-2xl font-bold leading-tight mb-2">
              태어난 해는<br />언제인가요?
            </div>
            <div className="text-[#8A6618] font-mono text-sm mb-8">
              간지(干支)의 첫 번째 기둥입니다
            </div>
            <YearDrum
              value={state.year}
              onChange={(y) => update('year', y)}
            />
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="text-[#FFD060] font-mono text-2xl font-bold leading-tight mb-2">
              태어난 월과<br />일은 언제인가요?
            </div>
            <div className="text-[#8A6618] font-mono text-sm mb-8">
              두 번째, 세 번째 기둥을 세웁니다
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="text-[#D4A020] font-mono text-sm mb-1">월</div>
                <input
                  type="number"
                  value={state.month}
                  onChange={(e) => update('month', e.target.value)}
                  placeholder="6"
                  min={1}
                  max={12}
                  className={inputClass}
                  autoFocus
                />
              </div>
              <div className="flex-1">
                <div className="text-[#D4A020] font-mono text-sm mb-1">일</div>
                <input
                  type="number"
                  value={state.day}
                  onChange={(e) => update('day', e.target.value)}
                  placeholder="15"
                  min={1}
                  max={31}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="text-[#FFD060] font-mono text-2xl font-bold leading-tight mb-2">
              양력인가요,<br />음력인가요?
            </div>
            <div className="text-[#8A6618] font-mono text-sm mb-8">
              달력 기준이 사주 계산에 영향을 줍니다
            </div>
            <div className="flex gap-4">
              {(['solar', 'lunar'] as const).map((cal) => (
                <button
                  key={cal}
                  type="button"
                  onClick={() => update('calendarType', cal)}
                  className={[
                    'flex-1 py-5 border-2 rounded font-mono text-lg font-bold transition-all',
                    state.calendarType === cal
                      ? 'border-[#D4A020] bg-[#D4A020]/15 text-[#FFD060]'
                      : 'border-[#2a1e08] text-[#8A6618] hover:border-[#D4A020]/50',
                  ].join(' ')}
                >
                  {cal === 'solar' ? '양력 ☀️' : '음력 🌙'}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <div className="text-[#FFD060] font-mono text-2xl font-bold leading-tight mb-2">
              태어난 시간을<br />아시나요?
            </div>
            <div className="text-[#8A6618] font-mono text-sm mb-6">
              시주(時柱) — 네 번째 기둥. 모르셔도 괜찮습니다
            </div>
            <TimeGrid value={state.hour} onChange={(v) => update('hour', v)} />
          </div>
        )}

        {step === 6 && (
          <div>
            <div className="text-[#FFD060] font-mono text-2xl font-bold leading-tight mb-2">
              마지막으로<br />성별과 결혼 여부는?
            </div>
            <div className="text-[#8A6618] font-mono text-sm mb-8">
              운세 해석의 방향이 달라집니다
            </div>
            <div className="space-y-6">
              <div>
                <div className="text-[#D4A020] font-mono text-sm mb-2">성별</div>
                <div className="flex gap-4">
                  {([['male', '남 ♂'], ['female', '여 ♀']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => update('gender', val)}
                      className={[
                        'flex-1 py-4 border-2 rounded font-mono text-base font-bold transition-all',
                        state.gender === val
                          ? 'border-[#D4A020] bg-[#D4A020]/15 text-[#FFD060]'
                          : 'border-[#2a1e08] text-[#8A6618] hover:border-[#D4A020]/50',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[#D4A020] font-mono text-sm mb-2">결혼 여부</div>
                <div className="flex gap-3">
                  {([['single', '미혼'], ['married', '기혼'], ['etc', '기타']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => update('maritalStatus', val)}
                      className={[
                        'flex-1 py-3 border rounded font-mono text-sm transition-all',
                        state.maritalStatus === val
                          ? 'border-[#D4A020] bg-[#D4A020]/15 text-[#FFD060]'
                          : 'border-[#2a1e08] text-[#8A6618] hover:border-[#D4A020]/50',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Error */}
      {error && (
        <div className="text-[#FF5544] font-mono text-sm border border-[#FF5544]/30 p-2 mb-4">
          ! {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="px-5 py-4 border border-[#2a1e08] text-[#8A6618] font-mono
              hover:border-[#D4A020]/40 transition-colors min-h-[56px]"
          >
            ←
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={loading}
          className="flex-1 py-4 border-2 border-[#D4A020] text-[#D4A020] font-mono text-lg font-bold
            hover:bg-[#D4A020]/10 active:bg-[#D4A020]/20 disabled:opacity-40
            transition-colors min-h-[56px]"
          style={{ background: step === TOTAL_STEPS ? 'linear-gradient(135deg,#D4A020,#FFD060)' : undefined,
                   color: step === TOTAL_STEPS ? '#080600' : undefined }}
        >
          {loading ? '계산 중...' : step === TOTAL_STEPS ? '✦ 카드 받기' : '다음 →'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: lint 확인**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 3: 커밋**

```bash
git add src/components/input/
git commit -m "feat: add StepInput 6-step conversational wizard"
```

---

## Task 7: 랜딩 페이지 B2 리디자인

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: page.tsx 전체 교체**

`src/app/page.tsx`를 다음 내용으로 교체:

```tsx
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

  // Auto-skip intro after 2.5s
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
                "강인한 의지의 용"
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
```

- [ ] **Step 2: 개발 서버에서 랜딩 확인**

```bash
npm run dev
```

브라우저 `http://localhost:3000` 에서:
- 히어로 카드 + 특징 3줄 + CTA 버튼 표시 확인
- "지금 무료로 받기" 탭 → ASCII 인트로 → 6단계 입력 전환 확인

- [ ] **Step 3: 커밋**

```bash
git add src/app/page.tsx
git commit -m "feat: redesign landing page with B2 hero + StepInput flow"
```

---

## Task 8: EnvelopeReveal 컴포넌트

**Files:**
- Create: `src/components/result/EnvelopeReveal.tsx`

- [ ] **Step 1: EnvelopeReveal.tsx 생성**

```tsx
// src/components/result/EnvelopeReveal.tsx
'use client';

import { useState, useEffect } from 'react';

type EnvelopePhase = 'sealed' | 'opening' | 'opened';

interface EnvelopeRevealProps {
  name: string;       // 이름 (표시용)
  onOpen: () => void; // 개봉 완료 콜백
  autoOpen?: boolean; // true이면 2초 후 자동 개봉
}

export function EnvelopeReveal({ name, onOpen, autoOpen = false }: EnvelopeRevealProps) {
  const [phase, setPhase] = useState<EnvelopePhase>('sealed');

  useEffect(() => {
    if (!autoOpen) return;
    const t = setTimeout(() => triggerOpen(), 2000);
    return () => clearTimeout(t);
  }, [autoOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerOpen = () => {
    if (phase !== 'sealed') return;
    setPhase('opening');
    setTimeout(() => {
      setPhase('opened');
      onOpen();
    }, 600);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="text-[#FFD060] font-mono text-lg font-bold mb-1">
        {name}님의
      </div>
      <div className="text-[#8A6618] font-mono text-sm mb-10">
        운명의 카드가 도착했습니다
      </div>

      {/* Envelope */}
      <button
        type="button"
        onClick={triggerOpen}
        disabled={phase !== 'sealed'}
        aria-label="봉투 개봉"
        className="cursor-pointer disabled:cursor-default group"
        style={{ background: 'transparent', border: 'none', padding: 0 }}
      >
        <div
          className="relative transition-all duration-600"
          style={{
            width: 200,
            height: 140,
            transform: phase === 'opening' ? 'scale(1.05)' : 'scale(1)',
            opacity: phase === 'opened' ? 0 : 1,
            transition: 'transform 0.3s ease, opacity 0.3s ease',
          }}
        >
          {/* Envelope body */}
          <div
            className="absolute inset-0 rounded"
            style={{
              background: 'linear-gradient(160deg, #2a1e08, #1a1200)',
              border: '1px solid #D4A020',
              boxShadow: '0 0 32px rgba(212,160,32,0.4), 0 8px 24px rgba(0,0,0,0.6)',
            }}
          />
          {/* Diagonal lines (envelope V) */}
          <div
            className="absolute"
            style={{
              top: 0, left: 0, right: 0,
              height: '50%',
              background: 'linear-gradient(135deg, transparent 49%, rgba(212,160,32,0.15) 50%, transparent 51%)',
            }}
          />
          {/* Wax seal */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #8b0000, #5a0000)',
              border: '2px solid #D4A020',
              boxShadow: '0 0 12px rgba(139,0,0,0.6)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className="text-[#D4A020] text-2xl">☯</span>
          </div>
        </div>
      </button>

      {phase === 'sealed' && (
        <>
          <div className="text-[#D4A020] font-mono text-sm mt-8 mb-2">봉인을 여세요</div>
          <div className="text-[#555] font-mono text-xs">탭하면 열립니다</div>
          <div
            className="mt-6 flex items-center justify-center rounded-full"
            style={{
              width: 44, height: 44,
              border: '1px dashed rgba(212,160,32,0.4)',
              color: 'rgba(212,160,32,0.5)',
              fontSize: 20,
            }}
            aria-hidden="true"
          >
            👆
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: lint 확인**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 3: 커밋**

```bash
git add src/components/result/EnvelopeReveal.tsx
git commit -m "feat: add EnvelopeReveal component with seal animation"
```

---

## Task 9: 결과 페이지 envelope 단계 + 공유링크 추가

**Files:**
- Modify: `src/app/result/page.tsx`

- [ ] **Step 0: 로딩 화면 추가 (초기화 중 빈 화면 대체)**

`src/app/result/page.tsx`에서 `if (!initialized || !sajuResult) return null;` 줄을 다음으로 교체:

```tsx
if (!initialized || !sajuResult) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div
        className="mb-8 flex items-center justify-center rounded-full"
        style={{
          width: 100, height: 100,
          background: 'radial-gradient(circle, rgba(212,160,32,0.2) 0%, rgba(212,160,32,0.04) 60%, transparent 100%)',
          border: '1px solid rgba(212,160,32,0.25)',
          boxShadow: '0 0 32px rgba(212,160,32,0.15)',
        }}
      >
        <span style={{ fontSize: 40 }}>☯</span>
      </div>
      <div className="text-[#FFD060] font-mono text-lg font-bold mb-3">운명을 읽는 중...</div>
      <div className="text-[#8A6618] font-mono text-sm mb-8 leading-relaxed">
        사주팔자를 계산하고<br />AI가 해석하고 있습니다
      </div>
      <div className="w-full max-w-xs space-y-3">
        {[
          { done: true, label: '사주팔자 계산 완료' },
          { done: false, label: '오행 균형 분석 중...' },
          { done: false, label: '카드 생성 대기중' },
        ].map(({ done, label }, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full"
              style={{
                width: 18, height: 18,
                background: done ? '#68d391' : i === 1 ? '#D4A020' : '#2a1e08',
                border: i === 2 ? '1px solid #3a2a08' : 'none',
                fontSize: 10,
              }}
            >
              {done ? '✓' : i === 1 ? '◐' : ''}
            </div>
            <span
              className="font-mono text-sm"
              style={{ color: done ? '#68d391' : i === 1 ? '#D4A020' : '#3a2a08' }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 1: Phase 타입에 'envelope' 추가 및 관련 로직 수정**

`src/app/result/page.tsx`에서:

1. `type Phase` 변경:
```typescript
type Phase = 'loading' | 'particles' | 'envelope' | 'cardDraw' | 'revealed' | 'scrolling' | 'complete';
```

2. `handleParticlePhaseComplete` 수정 (gather → envelope, 기존은 cardDraw였음):
```typescript
const handleParticlePhaseComplete = useCallback((completedPhase: string) => {
  if (completedPhase === 'gather') {
    setPhase('envelope');
  }
}, []);
```

3. `particlePhase` 계산에 'envelope' 추가 (envelope 중에는 idle, burst는 카드 등장 시):
```typescript
const particlePhase = (() => {
  switch (phase) {
    case 'particles': return 'gather' as const;
    case 'envelope': return 'idle' as const;
    case 'cardDraw': return 'burst' as const;
    case 'revealed':
    case 'scrolling': return 'idle' as const;
    default: return 'done' as const;
  }
})();
```

4. `CardReveal`의 `revealed` prop 수정:
```typescript
revealed={phase !== 'loading' && phase !== 'particles' && phase !== 'envelope'}
```

- [ ] **Step 2: EnvelopeReveal import 및 렌더 추가**

`src/app/result/page.tsx` 상단 import에 추가:
```typescript
import { EnvelopeReveal } from '@/components/result/EnvelopeReveal';
import { encodeShareToken } from '@/lib/share/tokenCodec';
import { useToast } from '@/hooks/useToast';
```

`ResultPage` 함수 상단에 추가:
```typescript
const { show: showToast, ToastUI } = useToast();
```

return 문 안에 GoldParticles 다음에 추가:
```tsx
{/* Envelope step */}
{phase === 'envelope' && sajuResult && (
  <div className="absolute inset-0 z-10">
    <EnvelopeReveal
      name={sajuResult.birthInfo.name}
      onOpen={() => setPhase('cardDraw')}
    />
  </div>
)}
```

- [ ] **Step 3: 공유 링크 버튼 추가**

`showNav` 블록 안 버튼들 위에 공유 링크 버튼 추가:

```tsx
{sajuResult && (() => {
  const token = encodeShareToken({
    year: sajuResult.birthInfo.year,
    month: sajuResult.birthInfo.month,
    day: sajuResult.birthInfo.day,
    hour: sajuResult.birthInfo.hour,
    gender: sajuResult.birthInfo.gender,
    calendarType: sajuResult.birthInfo.calendarType,
  });
  const shareUrl = `${window.location.origin}/share/${token}`;
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(shareUrl);
          showToast('링크가 복사되었습니다!');
        } catch {
          // HTTPS 아닌 환경 fallback
          showToast('링크: ' + shareUrl);
        }
      }}
      className="w-full py-3 border border-[#68d391]/50 text-[#68d391] font-mono
        hover:bg-[#68d391]/10 transition-colors min-h-[48px]"
    >
      🔗 공유 링크 복사
    </button>
  );
})()}
```

- [ ] **Step 4: 개발 서버에서 결과 페이지 확인**

```bash
npm run dev
```

- 입력 완료 후 결과 페이지 이동
- particles → 봉투 화면 → 탭 → 카드 공개 순서 확인
- 완료 후 "공유 링크 복사" 버튼 표시 확인

- [ ] **Step 5: 커밋**

```bash
git add src/app/result/page.tsx
git commit -m "feat: add envelope phase to result flow and share link button"
```

---

## Task 10: 카드 오행 컬러 그리드 추가

**Files:**
- Modify: `src/lib/export/cardExport.ts`

- [ ] **Step 1: 오행 색상 맵과 4기둥 그리드 그리기 함수 추가**

`src/lib/export/cardExport.ts`에서 오행 색상 맵을 파일 상단 상수로 추가:

```typescript
const ELEMENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  wood:  { bg: 'rgba(104,211,145,0.15)', text: '#68d391', border: 'rgba(104,211,145,0.4)' },
  fire:  { bg: 'rgba(252,129,129,0.15)', text: '#fc8181', border: 'rgba(252,129,129,0.4)' },
  earth: { bg: 'rgba(212,160,32,0.15)',  text: '#D4A020', border: 'rgba(212,160,32,0.4)'  },
  metal: { bg: 'rgba(226,232,240,0.15)', text: '#e2e8f0', border: 'rgba(226,232,240,0.4)' },
  water: { bg: 'rgba(118,228,247,0.15)', text: '#76e4f7', border: 'rgba(118,228,247,0.4)' },
};
```

그리고 `renderCardToPng` 함수 내부의 사주 기둥 그리기 섹션에서, 기존 천간/지지 텍스트 출력 이후에 오행 그리드 추가. 기둥 배열을 구성하는 부분을 찾아 4기둥 그리드를 그리는 코드 삽입:

```typescript
// 오행 4기둥 컬러 그리드 (천간 기준)
const pillars = [
  { label: '년', pillar: sajuResult.yearPillar },
  { label: '월', pillar: sajuResult.monthPillar },
  { label: '일', pillar: sajuResult.dayPillar },
  { label: '시', pillar: sajuResult.hourPillar },
];

const gridX = CARD_PADDING;
const gridCellW = (CARD_INNER_W - 9) / 4; // 3px gaps
let gridY = y; // y = current draw position

pillars.forEach((p, i) => {
  const cellX = gridX + i * (gridCellW + 3);
  const colors = p.pillar ? ELEMENT_COLORS[p.pillar.stem.element] ?? ELEMENT_COLORS.earth : { bg: 'rgba(42,30,8,0.3)', text: '#3a2a08', border: 'rgba(42,30,8,0.5)' };

  // Cell background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(cellX, gridY, gridCellW, 52);

  // Cell border
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(cellX + 0.5, gridY + 0.5, gridCellW - 1, 51);

  // Hanja stem
  ctx.fillStyle = colors.text;
  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText(p.pillar?.stem.hanja ?? '?', cellX + gridCellW / 2, gridY + 20);

  // Position label
  ctx.fillStyle = '#555';
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillText(p.label, cellX + gridCellW / 2, gridY + 34);

  // Element name
  ctx.fillStyle = colors.text;
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillText(p.pillar?.stem.element ? { wood:'木',fire:'火',earth:'土',metal:'金',water:'水' }[p.pillar.stem.element] ?? '' : '', cellX + gridCellW / 2, gridY + 48);
});
y = gridY + 52 + 12;
```

**주의:** 위 코드는 `renderCardToPng` 함수 내에서 적절한 위치(사주 기둥 정보 출력 직후)에 삽입해야 합니다. 기존 코드에서 `y` 변수가 사용되는 위치를 확인하여 연속성을 유지하세요.

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공 (타입 에러 없음)

- [ ] **Step 3: 개발 서버에서 카드 비주얼 확인**

결과 페이지에서 카드 공개 후 오행 컬러 그리드가 표시되는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add src/lib/export/cardExport.ts
git commit -m "feat: add ohaeng color grid to card canvas export"
```

---

## Task 11: ShareButtons 공유 링크 버튼 추가

**Files:**
- Modify: `src/components/card/ShareButtons.tsx`

- [ ] **Step 1: ShareButtons에 링크 복사 버튼 prop 추가**

`src/components/card/ShareButtons.tsx` 전체 교체:

```tsx
'use client';

import { useShare } from '@/hooks/useShare';
import { useToast } from '@/hooks/useToast';

interface ShareButtonsProps {
  blob: Blob | null;
  filename: string;
  shareToken?: string;  // 공유 링크 토큰 (선택적)
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
```

- [ ] **Step 2: lint 확인**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 3: 커밋**

```bash
git add src/components/card/ShareButtons.tsx
git commit -m "feat: add share link copy button to ShareButtons"
```

---

## Task 12: 공유 카드 티저 페이지

**Files:**
- Create: `src/app/share/[token]/page.tsx`

- [ ] **Step 1: share 디렉토리 생성 및 page.tsx 작성**

```tsx
// src/app/share/[token]/page.tsx
import { decodeShareToken } from '@/lib/share/tokenCodec';
import { calculateFullSaju } from '@/lib/saju/calculator';
import { generateShareSummary } from '@/lib/ai/templates';
import type { Metadata } from 'next';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const data = decodeShareToken(token);
  if (!data) return { title: '사주명리의 미궁' };

  const birthInfo = {
    name: '',
    year: data.year,
    month: data.month,
    day: data.day,
    hour: data.hour,
    minute: 0,
    gender: data.gender,
    calendarType: data.calendarType,
    maritalStatus: 'etc' as const,
  };

  try {
    const saju = calculateFullSaju(birthInfo);
    const summary = generateShareSummary(saju);
    return {
      title: `${summary.zodiacLabel} 사주카드 — 사주명리의 미궁`,
      description: `${summary.elementKeyword}의 기운 — AI 사주명리의 미궁에서 나의 운명을 확인하세요`,
    };
  } catch {
    return { title: '사주명리의 미궁' };
  }
}

const ELEMENT_COLOR: Record<string, string> = {
  wood: '#68d391', fire: '#fc8181', earth: '#D4A020', metal: '#e2e8f0', water: '#76e4f7',
};
const ELEMENT_HANJA: Record<string, string> = {
  wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
};

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const data = decodeShareToken(token);

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <div className="text-[#FF5544] font-mono text-sm mb-4">유효하지 않은 링크입니다</div>
          <a href="/" className="text-[#D4A020] font-mono text-sm underline">홈으로 돌아가기</a>
        </div>
      </main>
    );
  }

  const birthInfo = {
    name: '',
    year: data.year,
    month: data.month,
    day: data.day,
    hour: data.hour,
    minute: 0,
    gender: data.gender,
    calendarType: data.calendarType,
    maritalStatus: 'etc' as const,
  };

  let saju;
  try {
    saju = calculateFullSaju(birthInfo);
  } catch {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <div className="text-[#FF5544] font-mono text-sm mb-4">사주 계산에 실패했습니다</div>
          <a href="/" className="text-[#D4A020] font-mono text-sm underline">홈으로 돌아가기</a>
        </div>
      </main>
    );
  }

  const summary = generateShareSummary(saju);
  const pillars = [
    { label: '년', pillar: saju.yearPillar },
    { label: '월', pillar: saju.monthPillar },
    { label: '일', pillar: saju.dayPillar },
    { label: '시', pillar: saju.hourPillar },
  ];

  const dominantColor = ELEMENT_COLOR[summary.dominantElement] ?? '#D4A020';
  const deficientColor = ELEMENT_COLOR[summary.deficientElement] ?? '#8A6618';

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-[#8A6618] font-mono text-[10px] tracking-[3px] mb-2">四柱命理의 미궁</div>
        <div className="text-[#D4A020] font-mono text-sm">{summary.zodiacLabel}의 사주</div>
      </div>

      {/* Card */}
      <div
        className="rounded-xl px-5 py-5 text-center mb-8 w-full max-w-[200px]"
        style={{
          background: 'linear-gradient(145deg, #1a1200, #2a1e08)',
          border: '1px solid #D4A020',
          boxShadow: '0 0 40px rgba(212,160,32,0.4), 0 12px 32px rgba(0,0,0,0.7)',
        }}
      >
        <div className="text-[#FFD060] font-mono text-[9px] tracking-widest mb-3">龍 ══ 사주명리 ══ 鳳</div>
        <div className="text-4xl mb-3">{saju.yearPillar.branch.animal === '용' ? '🐉' : '⭐'}</div>

        {/* 4-pillar color grid */}
        <div className="grid grid-cols-4 gap-1 mb-3">
          {pillars.map(({ label, pillar }) => {
            const el = pillar?.stem.element ?? 'earth';
            const color = ELEMENT_COLOR[el] ?? '#D4A020';
            return (
              <div
                key={label}
                className="rounded flex flex-col items-center py-1.5"
                style={{
                  background: `color-mix(in srgb, ${color} 15%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
                }}
              >
                <span className="font-mono text-sm font-bold" style={{ color }}>
                  {pillar?.stem.hanja ?? '?'}
                </span>
                <span className="font-mono text-[9px]" style={{ color }}>{ELEMENT_HANJA[el]}</span>
                <span className="font-mono text-[8px] text-[#555]">{label}</span>
              </div>
            );
          })}
        </div>

        <div
          className="font-mono text-[9px] italic pt-2"
          style={{ color: '#8A6618', borderTop: '1px solid #2a1e08' }}
        >
          {summary.dayMasterMetaphor}
        </div>
      </div>

      {/* Teaser sections */}
      <div className="w-full max-w-sm space-y-3 mb-8">

        {/* 오행 성향 */}
        <div
          className="rounded-lg p-4"
          style={{ background: 'rgba(212,160,32,0.06)', border: '1px solid rgba(212,160,32,0.15)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">🌿</span>
            <span className="text-[#D4A020] font-mono text-xs font-bold">오행 성향</span>
          </div>
          <div className="text-[#FFD060] font-mono text-sm font-bold">{summary.elementKeyword}</div>
          <div className="text-[#8A6618] font-mono text-xs mt-1 leading-relaxed">{summary.elementDesc}</div>
        </div>

        {/* 일간 테마 */}
        <div
          className="rounded-lg p-4"
          style={{ background: 'rgba(212,160,32,0.06)', border: '1px solid rgba(212,160,32,0.15)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">☯</span>
            <span className="text-[#D4A020] font-mono text-xs font-bold">일간 성격</span>
          </div>
          <div className="text-[#FFD060] font-mono text-sm font-bold">{summary.dayMasterTheme}</div>
          <div className="text-[#8A6618] font-mono text-xs mt-1">{summary.dayMasterMetaphor}</div>
        </div>

        {/* 오행 균형 */}
        <div
          className="rounded-lg p-4"
          style={{ background: 'rgba(212,160,32,0.06)', border: '1px solid rgba(212,160,32,0.15)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">🍀</span>
            <span className="text-[#D4A020] font-mono text-xs font-bold">오행 균형</span>
          </div>
          <div className="flex gap-4 text-xs font-mono">
            <div>
              <span className="text-[#8A6618]">강한 기운 </span>
              <span style={{ color: dominantColor }}>
                {ELEMENT_HANJA[summary.dominantElement]} {summary.dominantElement}
              </span>
            </div>
            <div>
              <span className="text-[#8A6618]">부족한 기운 </span>
              <span style={{ color: deficientColor }}>
                {ELEMENT_HANJA[summary.deficientElement]} {summary.deficientElement}
              </span>
            </div>
          </div>
        </div>

        {/* Locked full reading */}
        <div
          className="rounded-lg p-4 text-center"
          style={{ background: 'rgba(42,30,8,0.4)', border: '1px dashed rgba(212,160,32,0.2)' }}
        >
          <div className="text-[#555] font-mono text-xs mb-1">🔒 전체 AI 풀이</div>
          <div className="text-[#8A6618] font-mono text-xs">직접 받아야 볼 수 있습니다</div>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 w-full max-w-sm mb-6">
        <div className="flex-1 h-px" style={{ background: '#1a1500' }} />
        <span className="text-[#555] font-mono text-xs">당신의 사주는?</span>
        <div className="flex-1 h-px" style={{ background: '#1a1500' }} />
      </div>

      {/* CTA */}
      <a
        href="/"
        className="w-full max-w-sm block text-center py-4 rounded-xl font-mono text-base font-bold text-[#080600] no-underline"
        style={{
          background: 'linear-gradient(135deg, #D4A020, #FFD060)',
          boxShadow: '0 4px 16px rgba(212,160,32,0.4)',
        }}
      >
        나도 카드 받기 ✦
      </a>
      <div className="text-[#555] font-mono text-xs mt-2">무료 · 1분 소요</div>
    </main>
  );
}
```

- [ ] **Step 2: calculateFullSaju export 확인**

```bash
grep "export.*calculateFullSaju" src/lib/saju/calculator.ts
```

Expected: `export function calculateFullSaju` 또는 `export { calculateFullSaju }` 출력.
없으면: `calculator.ts`에서 함수 앞에 `export` 키워드 추가.

- [ ] **Step 3: 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공

- [ ] **Step 4: 공유 페이지 수동 테스트**

```bash
npm run dev
```

1. 결과 페이지에서 "공유 링크 복사" 클릭
2. 복사된 URL(`http://localhost:3000/share/[token]`) 브라우저에서 열기
3. 사주 카드 + 3개 티저 섹션 + "나도 카드 받기" CTA 확인
4. "나도 카드 받기" 클릭 → `/` 로 이동 확인

- [ ] **Step 5: 커밋**

```bash
git add src/app/share/
git commit -m "feat: add share card teaser page at /share/[token]"
```

---

## 최종 빌드 검증

- [ ] **전체 빌드 성공 확인**

```bash
npm run build
```

Expected: 에러 없이 빌드 완료

- [ ] **전체 플로우 수동 테스트**

`npm run dev` 후:
1. `http://localhost:3000` → 히어로 B2 랜딩 확인
2. "지금 무료로 받기" → ASCII 인트로 → 6단계 입력
3. 입력 완료 → 결과 페이지: particles → 봉투 → 카드 공개 → 스크롤
4. 완료 후 "공유 링크 복사" → 링크 오픈 → 티저 페이지 확인

- [ ] **최종 커밋**

```bash
git add .
git commit -m "feat: complete UX redesign for B2C deployment

Ritual Journey flow, 6-step input, envelope reveal, ohaeng card,
and serverless share links via base64url token.

Scope-risk: broad
Confidence: high"
```
