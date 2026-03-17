# 사주명리 MUD 구현 플랜

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MUD 게임 스타일 웹앱으로 한국 전통 사주풀이(명리학)를 제공하는 서비스 구축

**Architecture:** Next.js 15 App Router 기반 웹앱. 3개 독립 레이어: (1) 사주 계산 엔진 - manseryeok-js로 팔자 계산 + 자체 십성/오행/대운 계산, (2) MUD 게임 엔진 - 방 기반 탐험 + 커맨드 파서, (3) 터미널 UI + AI 스트리밍 해석. 상태는 클라이언트 React state에만 존재 (DB 없음).

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, `@fullstackfamily/manseryeok`, `openai` (GPT-5.2-nano), D2Coding font

**Spec:** `docs/superpowers/specs/` (brainstorming에서 생성) + `/Users/kwanung/.claude/plans/compressed-munching-abelson.md`

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                    # 루트 레이아웃 (다크테마, D2Coding 폰트)
│   ├── page.tsx                      # 메인 페이지 - MudGame 컴포넌트 마운트
│   ├── globals.css                   # 터미널 테마, CRT 스캔라인, 오행 색상
│   └── api/interpret/route.ts        # Claude API 스트리밍 엔드포인트
├── components/
│   ├── terminal/
│   │   ├── Terminal.tsx              # 메인 터미널 컨테이너 (스크롤, 포커스)
│   │   ├── TerminalLine.tsx          # 개별 라인 렌더링 (일반/컬러/ASCII)
│   │   ├── TerminalInput.tsx         # 커맨드 입력 (> 프롬프트 + 깜박 커서)
│   │   └── TypingEffect.tsx          # 글자별 타이핑 애니메이션
│   └── saju/
│       └── PillarDisplay.tsx         # ASCII 사주팔자 테이블
├── lib/
│   ├── saju/
│   │   ├── types.ts                  # 사주 관련 모든 타입 정의
│   │   ├── constants.ts              # 천간/지지/오행/십성 데이터 테이블
│   │   ├── calculator.ts             # manseryeok 래핑 + 사주팔자 계산
│   │   ├── tenGods.ts                # 십성 계산 알고리즘
│   │   ├── elements.ts               # 오행 균형 분석
│   │   └── luckCycles.ts             # 대운/세운 계산
│   ├── mud/
│   │   ├── types.ts                  # MUD 게임 타입 (Room, Command, GameState)
│   │   ├── rooms.ts                  # 방 정의 및 연결 맵
│   │   ├── commandParser.ts          # 한/영 커맨드 파서
│   │   └── engine.ts                 # 게임 엔진 (순수 함수)
│   └── ai/
│       └── prompts.ts                # 방별 AI 프롬프트 템플릿
├── hooks/
│   ├── useTerminal.ts                # 터미널 라인 버퍼, 스크롤
│   ├── useGame.ts                    # 게임 상태 관리 (useReducer)
│   └── useStreaming.ts               # AI 스트리밍 소비
```

---

## Task 1: 프로젝트 초기화

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.env.local`

- [ ] **Step 1: Next.js 프로젝트 생성**

```bash
cd /Users/kwanung/development/experiments/saju-full2
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

- [ ] **Step 2: 의존성 설치**

```bash
cd /Users/kwanung/development/experiments/saju-full2
npm install @fullstackfamily/manseryeok openai
```

- [ ] **Step 3: .env.local 생성**

Create `.env.local`:
```
OPENAI_API_KEY=your-api-key-here
```

- [ ] **Step 4: 빌드 확인**

```bash
cd /Users/kwanung/development/experiments/saju-full2
npm run build
```
Expected: 빌드 성공

- [ ] **Step 5: Commit**

```bash
git init
git add -A
git commit -m "chore: initialize Next.js project with manseryeok and openai SDK"
```

---

## Task 2: 사주 타입 정의 + 상수 테이블

**Files:**
- Create: `src/lib/saju/types.ts`
- Create: `src/lib/saju/constants.ts`

- [ ] **Step 1: 사주 타입 정의 작성**

Create `src/lib/saju/types.ts`:
```typescript
// 오행 (Five Elements)
export type FiveElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

// 음양
export type YinYang = 'yang' | 'yin';

// 천간 (Heavenly Stem)
export interface HeavenlyStem {
  index: number;       // 0-9
  korean: string;      // 갑, 을, 병, 정, 무, 기, 경, 신, 임, 계
  hanja: string;       // 甲, 乙, 丙, 丁, 戊, 己, 庚, 辛, 壬, 癸
  element: FiveElement;
  yinYang: YinYang;
}

// 지지 (Earthly Branch)
export interface EarthlyBranch {
  index: number;       // 0-11
  korean: string;      // 자, 축, 인, 묘, 진, 사, 오, 미, 신, 유, 술, 해
  hanja: string;       // 子, 丑, 寅, 卯, 辰, 巳, 午, 未, 申, 酉, 戌, 亥
  element: FiveElement;
  yinYang: YinYang;
  animal: string;      // 쥐, 소, 호랑이, ...
}

// 기둥 (Pillar)
export interface Pillar {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  ganjiKorean: string;   // e.g., "경오"
  ganjiHanja: string;    // e.g., "庚午"
}

// 십성 (Ten Gods)
export type TenGodName =
  | '비견' | '겁재'     // 비겁 (같은 오행)
  | '식신' | '상관'     // 식상 (내가 생하는)
  | '편재' | '정재'     // 재성 (내가 극하는)
  | '편관' | '정관'     // 관성 (나를 극하는)
  | '편인' | '정인';    // 인성 (나를 생하는)

export interface TenGodEntry {
  name: TenGodName;
  position: string;    // "연간", "월간", "시간", "연지", "월지", "일지", "시지"
  stem: HeavenlyStem;
}

// 오행 균형
export interface FiveElementBalance {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
  dominant: FiveElement;
  deficient: FiveElement;
}

// 대운 (Major Luck Cycle)
export interface LuckCycle {
  startAge: number;
  endAge: number;
  pillar: Pillar;
}

// 세운 (Yearly Luck)
export interface YearlyLuck {
  year: number;
  pillar: Pillar;
}

// 성별
export type Gender = 'male' | 'female';

// 사주 계산 입력
export interface BirthInfo {
  name: string;
  year: number;
  month: number;
  day: number;
  hour: number | null;   // null = 모름
  minute: number;
  gender: Gender;
}

// 사주 전체 결과
export interface SajuResult {
  birthInfo: BirthInfo;
  yearPillar: Pillar;
  monthPillar: Pillar;
  dayPillar: Pillar;
  hourPillar: Pillar | null;  // null if hour unknown
  dayMaster: HeavenlyStem;
  fiveElements: FiveElementBalance;
  tenGods: TenGodEntry[];
  luckCycles: LuckCycle[];
  yearlyLuck: YearlyLuck;
}
```

- [ ] **Step 2: 상수 테이블 작성**

Create `src/lib/saju/constants.ts`:
```typescript
import { HeavenlyStem, EarthlyBranch, FiveElement, TenGodName } from './types';

// 10 천간
export const HEAVENLY_STEMS: HeavenlyStem[] = [
  { index: 0, korean: '갑', hanja: '甲', element: 'wood',  yinYang: 'yang' },
  { index: 1, korean: '을', hanja: '乙', element: 'wood',  yinYang: 'yin'  },
  { index: 2, korean: '병', hanja: '丙', element: 'fire',  yinYang: 'yang' },
  { index: 3, korean: '정', hanja: '丁', element: 'fire',  yinYang: 'yin'  },
  { index: 4, korean: '무', hanja: '戊', element: 'earth', yinYang: 'yang' },
  { index: 5, korean: '기', hanja: '己', element: 'earth', yinYang: 'yin'  },
  { index: 6, korean: '경', hanja: '庚', element: 'metal', yinYang: 'yang' },
  { index: 7, korean: '신', hanja: '辛', element: 'metal', yinYang: 'yin'  },
  { index: 8, korean: '임', hanja: '壬', element: 'water', yinYang: 'yang' },
  { index: 9, korean: '계', hanja: '癸', element: 'water', yinYang: 'yin'  },
];

// 12 지지
export const EARTHLY_BRANCHES: EarthlyBranch[] = [
  { index: 0,  korean: '자', hanja: '子', element: 'water', yinYang: 'yang', animal: '쥐'     },
  { index: 1,  korean: '축', hanja: '丑', element: 'earth', yinYang: 'yin',  animal: '소'     },
  { index: 2,  korean: '인', hanja: '寅', element: 'wood',  yinYang: 'yang', animal: '호랑이' },
  { index: 3,  korean: '묘', hanja: '卯', element: 'wood',  yinYang: 'yin',  animal: '토끼'   },
  { index: 4,  korean: '진', hanja: '辰', element: 'earth', yinYang: 'yang', animal: '용'     },
  { index: 5,  korean: '사', hanja: '巳', element: 'fire',  yinYang: 'yin',  animal: '뱀'     },
  { index: 6,  korean: '오', hanja: '午', element: 'fire',  yinYang: 'yang', animal: '말'     },
  { index: 7,  korean: '미', hanja: '未', element: 'earth', yinYang: 'yin',  animal: '양'     },
  { index: 8,  korean: '신', hanja: '申', element: 'metal', yinYang: 'yang', animal: '원숭이' },
  { index: 9,  korean: '유', hanja: '酉', element: 'metal', yinYang: 'yin',  animal: '닭'     },
  { index: 10, korean: '술', hanja: '戌', element: 'earth', yinYang: 'yang', animal: '개'     },
  { index: 11, korean: '해', hanja: '亥', element: 'water', yinYang: 'yin',  animal: '돼지'   },
];

// 지장간 (Hidden Stems in Earthly Branches)
// 각 지지 안에 숨어있는 천간들 [본기, 중기?, 여기?]
// 가중치: 본기 = 주 오행, 중기/여기 = 보조 오행
export const BRANCH_HIDDEN_STEMS: Record<string, { stem: string; weight: number }[]> = {
  '자': [{ stem: '계', weight: 1.0 }],
  '축': [{ stem: '기', weight: 0.6 }, { stem: '계', weight: 0.2 }, { stem: '신', weight: 0.2 }],
  '인': [{ stem: '갑', weight: 0.6 }, { stem: '병', weight: 0.2 }, { stem: '무', weight: 0.2 }],
  '묘': [{ stem: '을', weight: 1.0 }],
  '진': [{ stem: '무', weight: 0.6 }, { stem: '을', weight: 0.2 }, { stem: '계', weight: 0.2 }],
  '사': [{ stem: '병', weight: 0.6 }, { stem: '무', weight: 0.2 }, { stem: '경', weight: 0.2 }],
  '오': [{ stem: '정', weight: 0.6 }, { stem: '기', weight: 0.4 }],
  '미': [{ stem: '기', weight: 0.6 }, { stem: '정', weight: 0.2 }, { stem: '을', weight: 0.2 }],
  '신': [{ stem: '경', weight: 0.6 }, { stem: '임', weight: 0.2 }, { stem: '무', weight: 0.2 }],
  '유': [{ stem: '신', weight: 1.0 }],
  '술': [{ stem: '무', weight: 0.6 }, { stem: '신', weight: 0.2 }, { stem: '정', weight: 0.2 }],
  '해': [{ stem: '임', weight: 0.6 }, { stem: '갑', weight: 0.4 }],
};

// 십성 매핑 테이블
// 일간의 오행 → 대상 오행 → 음양 동/이 → 십성
// [동음양, 이음양]
export const TEN_GODS_MAP: Record<FiveElement, Record<FiveElement, [TenGodName, TenGodName]>> = {
  // 일간 오행이 wood일 때
  wood: {
    wood:  ['비견', '겁재'],   // 같은 오행 = 비겁
    fire:  ['식신', '상관'],   // 내가 생 = 식상
    earth: ['편재', '정재'],   // 내가 극 = 재성
    metal: ['편관', '정관'],   // 나를 극 = 관성
    water: ['편인', '정인'],   // 나를 생 = 인성
  },
  fire: {
    fire:  ['비견', '겁재'],
    earth: ['식신', '상관'],
    metal: ['편재', '정재'],
    water: ['편관', '정관'],
    wood:  ['편인', '정인'],
  },
  earth: {
    earth: ['비견', '겁재'],
    metal: ['식신', '상관'],
    water: ['편재', '정재'],
    wood:  ['편관', '정관'],
    fire:  ['편인', '정인'],
  },
  metal: {
    metal: ['비견', '겁재'],
    water: ['식신', '상관'],
    wood:  ['편재', '정재'],
    fire:  ['편관', '정관'],
    earth: ['편인', '정인'],
  },
  water: {
    water: ['비견', '겁재'],
    wood:  ['식신', '상관'],
    fire:  ['편재', '정재'],
    earth: ['편관', '정관'],
    metal: ['편인', '정인'],
  },
};

// 오행 한글/한자/영문
export const ELEMENT_NAMES: Record<FiveElement, { korean: string; hanja: string }> = {
  wood:  { korean: '목', hanja: '木' },
  fire:  { korean: '화', hanja: '火' },
  earth: { korean: '토', hanja: '土' },
  metal: { korean: '금', hanja: '金' },
  water: { korean: '수', hanja: '水' },
};

// 천간 한글 → index 매핑 (manseryeok 결과 파싱용)
export const STEM_KOREAN_TO_INDEX: Record<string, number> = {};
HEAVENLY_STEMS.forEach(s => { STEM_KOREAN_TO_INDEX[s.korean] = s.index; });

// 지지 한글 → index 매핑
export const BRANCH_KOREAN_TO_INDEX: Record<string, number> = {};
EARTHLY_BRANCHES.forEach(b => { BRANCH_KOREAN_TO_INDEX[b.korean] = b.index; });

// 24절기 (대운 계산에 필요한 절기 목록 - 절기만, 중기 제외)
// 절기: 입춘(1), 경칩(2), 청명(3), 입하(4), 망종(5), 소서(6),
//       입추(7), 백로(8), 한로(9), 입동(10), 대설(11), 소한(12)
export const JEOLGI_NAMES = [
  '소한', '입춘', '경칩', '청명', '입하', '망종',
  '소서', '입추', '백로', '한로', '입동', '대설',
] as const;
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/saju/types.ts src/lib/saju/constants.ts
git commit -m "feat: add saju type definitions and constant lookup tables"
```

---

## Task 3: 사주팔자 계산기 (manseryeok 래핑)

**Files:**
- Create: `src/lib/saju/calculator.ts`

- [ ] **Step 1: calculator.ts 작성**

Create `src/lib/saju/calculator.ts`:
```typescript
import { calculateSaju, getSolarTermsByYear } from '@fullstackfamily/manseryeok';
import { HEAVENLY_STEMS, EARTHLY_BRANCHES, STEM_KOREAN_TO_INDEX, BRANCH_KOREAN_TO_INDEX } from './constants';
import { Pillar, HeavenlyStem, EarthlyBranch, BirthInfo, SajuResult } from './types';
import { calculateFiveElementBalance } from './elements';
import { calculateTenGods } from './tenGods';
import { calculateLuckCycles, calculateYearlyLuck } from './luckCycles';

/**
 * manseryeok 결과의 간지 문자열(예: "경오")을 파싱하여 Pillar 객체로 변환
 */
export function parseGanji(ganjiKorean: string, ganjiHanja: string): Pillar {
  const stemKorean = ganjiKorean[0];
  const branchKorean = ganjiKorean[1];

  const stemIndex = STEM_KOREAN_TO_INDEX[stemKorean];
  const branchIndex = BRANCH_KOREAN_TO_INDEX[branchKorean];

  if (stemIndex === undefined || branchIndex === undefined) {
    throw new Error(`Invalid ganji: ${ganjiKorean}`);
  }

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex],
    ganjiKorean,
    ganjiHanja,
  };
}

/**
 * 사주팔자 전체 계산
 */
export function calculateFullSaju(birthInfo: BirthInfo): SajuResult {
  const { year, month, day, hour, minute, gender } = birthInfo;

  // 1. manseryeok으로 사주팔자 계산
  const hasHour = hour !== null;
  const sajuRaw = hasHour
    ? calculateSaju(year, month, day, hour, minute)
    : calculateSaju(year, month, day);

  // 2. 간지 문자열 → Pillar 객체 변환
  const yearPillar = parseGanji(sajuRaw.yearPillar, sajuRaw.yearPillarHanja);
  const monthPillar = parseGanji(sajuRaw.monthPillar, sajuRaw.monthPillarHanja);
  const dayPillar = parseGanji(sajuRaw.dayPillar, sajuRaw.dayPillarHanja);
  const hourPillar = hasHour
    ? parseGanji(sajuRaw.hourPillar, sajuRaw.hourPillarHanja)
    : null;

  // 3. 일간 (Day Master)
  const dayMaster = dayPillar.stem;

  // 4. 오행 균형 분석
  const pillars = [yearPillar, monthPillar, dayPillar];
  if (hourPillar) pillars.push(hourPillar);
  const fiveElements = calculateFiveElementBalance(pillars);

  // 5. 십성 계산
  const tenGods = calculateTenGods(dayMaster, yearPillar, monthPillar, dayPillar, hourPillar);

  // 6. 대운 계산
  const solarTerms = getSolarTermsByYear(year);
  const luckCycles = calculateLuckCycles(
    gender, yearPillar, monthPillar, year, month, day, solarTerms
  );

  // 7. 세운 (올해)
  const yearlyLuck = calculateYearlyLuck(new Date().getFullYear());

  return {
    birthInfo,
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    dayMaster,
    fiveElements,
    tenGods,
    luckCycles,
    yearlyLuck,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/saju/calculator.ts
git commit -m "feat: add saju calculator wrapping manseryeok library"
```

---

## Task 4: 오행 균형 분석

**Files:**
- Create: `src/lib/saju/elements.ts`

- [ ] **Step 1: elements.ts 작성**

Create `src/lib/saju/elements.ts`:
```typescript
import { Pillar, FiveElement, FiveElementBalance } from './types';
import { HEAVENLY_STEMS, BRANCH_HIDDEN_STEMS, STEM_KOREAN_TO_INDEX } from './constants';

/**
 * 사주 기둥들의 오행 균형을 계산한다.
 * 천간 직접 오행 + 지지 지장간 가중치 오행을 합산.
 */
export function calculateFiveElementBalance(pillars: Pillar[]): FiveElementBalance {
  const scores: Record<FiveElement, number> = {
    wood: 0, fire: 0, earth: 0, metal: 0, water: 0,
  };

  for (const pillar of pillars) {
    // 천간 오행 (가중치 1.0)
    scores[pillar.stem.element] += 1.0;

    // 지지 지장간 오행 (가중치별)
    const hiddenStems = BRANCH_HIDDEN_STEMS[pillar.branch.korean];
    if (hiddenStems) {
      for (const { stem, weight } of hiddenStems) {
        const stemIndex = STEM_KOREAN_TO_INDEX[stem];
        if (stemIndex !== undefined) {
          const element = HEAVENLY_STEMS[stemIndex].element;
          scores[element] += weight;
        }
      }
    }
  }

  // 가장 강한/약한 오행 찾기
  const entries = Object.entries(scores) as [FiveElement, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const dominant = entries[0][0];
  const deficient = entries[entries.length - 1][0];

  return { ...scores, dominant, deficient };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/saju/elements.ts
git commit -m "feat: add five elements balance analysis"
```

---

## Task 5: 십성 계산

**Files:**
- Create: `src/lib/saju/tenGods.ts`

- [ ] **Step 1: tenGods.ts 작성**

Create `src/lib/saju/tenGods.ts`:
```typescript
import { HeavenlyStem, Pillar, TenGodEntry, TenGodName } from './types';
import { TEN_GODS_MAP, BRANCH_HIDDEN_STEMS, HEAVENLY_STEMS, STEM_KOREAN_TO_INDEX } from './constants';

/**
 * 일간(dayMaster)과 대상 천간의 십성 관계를 구한다.
 * 같은 음양이면 [0] (편), 다른 음양이면 [1] (정)
 */
function getTenGodRelation(dayMaster: HeavenlyStem, target: HeavenlyStem): TenGodName {
  const pair = TEN_GODS_MAP[dayMaster.element][target.element];
  const sameYinYang = dayMaster.yinYang === target.yinYang;
  return sameYinYang ? pair[0] : pair[1];
}

/**
 * 모든 기둥의 천간에 대해 십성을 계산한다.
 * 일간(dayPillar.stem)은 자기 자신이므로 '일간'으로 표시.
 */
export function calculateTenGods(
  dayMaster: HeavenlyStem,
  yearPillar: Pillar,
  monthPillar: Pillar,
  dayPillar: Pillar,
  hourPillar: Pillar | null,
): TenGodEntry[] {
  const entries: TenGodEntry[] = [];

  // 연간
  entries.push({
    name: getTenGodRelation(dayMaster, yearPillar.stem),
    position: '연간',
    stem: yearPillar.stem,
  });

  // 월간
  entries.push({
    name: getTenGodRelation(dayMaster, monthPillar.stem),
    position: '월간',
    stem: monthPillar.stem,
  });

  // 시간
  if (hourPillar) {
    entries.push({
      name: getTenGodRelation(dayMaster, hourPillar.stem),
      position: '시간',
      stem: hourPillar.stem,
    });
  }

  // 지지의 지장간(본기)에 대해서도 십성 계산
  const branchPillars: { pillar: Pillar; posPrefix: string }[] = [
    { pillar: yearPillar, posPrefix: '연지' },
    { pillar: monthPillar, posPrefix: '월지' },
    { pillar: dayPillar, posPrefix: '일지' },
  ];
  if (hourPillar) {
    branchPillars.push({ pillar: hourPillar, posPrefix: '시지' });
  }

  for (const { pillar, posPrefix } of branchPillars) {
    const hiddenStems = BRANCH_HIDDEN_STEMS[pillar.branch.korean];
    if (hiddenStems && hiddenStems.length > 0) {
      // 본기(첫 번째)만 주요 십성으로 사용
      const mainStemIndex = STEM_KOREAN_TO_INDEX[hiddenStems[0].stem];
      if (mainStemIndex !== undefined) {
        const mainStem = HEAVENLY_STEMS[mainStemIndex];
        entries.push({
          name: getTenGodRelation(dayMaster, mainStem),
          position: posPrefix,
          stem: mainStem,
        });
      }
    }
  }

  return entries;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/saju/tenGods.ts
git commit -m "feat: add ten gods (십성) calculation"
```

---

## Task 6: 대운/세운 계산

**Files:**
- Create: `src/lib/saju/luckCycles.ts`

- [ ] **Step 1: luckCycles.ts 작성**

Create `src/lib/saju/luckCycles.ts`:
```typescript
import { calculateSaju, getSolarTermsByYear } from '@fullstackfamily/manseryeok';
import { Gender, Pillar, LuckCycle, YearlyLuck } from './types';
import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from './constants';
import { parseGanji } from './calculator';

/**
 * 대운 계산.
 *
 * 순행/역행 결정:
 * - 남자 양년생(연주 천간 양) 또는 여자 음년생(연주 천간 음) → 순행
 * - 남자 음년생 또는 여자 양년생 → 역행
 *
 * 대운 시작 나이:
 * - 생일에서 다음/이전 절기까지의 일수 ÷ 3 = 대운 시작 나이
 *
 * 대운 간지:
 * - 월주에서 순행이면 다음 간지, 역행이면 이전 간지 (60갑자 순환)
 */
export function calculateLuckCycles(
  gender: Gender,
  yearPillar: Pillar,
  monthPillar: Pillar,
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  solarTerms: { name: string; month: number; day: number; hour: number; minute: number }[],
): LuckCycle[] {
  // 순행/역행 결정
  const isYangYear = yearPillar.stem.yinYang === 'yang';
  const isMale = gender === 'male';
  const isForward = (isMale && isYangYear) || (!isMale && !isYangYear);

  // 절기(절만, 중기 제외) 찾기 - 월주를 결정하는 절기들
  // 절기: 입춘, 경칩, 청명, 입하, 망종, 소서, 입추, 백로, 한로, 입동, 대설, 소한
  const jeolgiNames = new Set([
    '소한', '입춘', '경칩', '청명', '입하', '망종',
    '소서', '입추', '백로', '한로', '입동', '대설',
  ]);
  const jeolgis = solarTerms.filter(t => jeolgiNames.has(t.name));

  // 생일 기준 다음/이전 절기까지의 일수 계산
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
  let daysDiff = 30; // 기본값 (절기를 못 찾을 경우)

  if (isForward) {
    // 순행: 생일 이후 가장 가까운 절기
    const nextJeolgi = jeolgis.find(j => {
      const jDate = new Date(birthYear, j.month - 1, j.day);
      return jDate > birthDate;
    });
    if (nextJeolgi) {
      const jDate = new Date(birthYear, nextJeolgi.month - 1, nextJeolgi.day);
      daysDiff = Math.ceil((jDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  } else {
    // 역행: 생일 이전 가장 가까운 절기
    const prevJeolgis = jeolgis.filter(j => {
      const jDate = new Date(birthYear, j.month - 1, j.day);
      return jDate < birthDate;
    });
    if (prevJeolgis.length > 0) {
      const lastJeolgi = prevJeolgis[prevJeolgis.length - 1];
      const jDate = new Date(birthYear, lastJeolgi.month - 1, lastJeolgi.day);
      daysDiff = Math.ceil((birthDate.getTime() - jDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  // 대운 시작 나이 = 일수 ÷ 3 (반올림)
  const startAge = Math.round(daysDiff / 3);

  // 월주의 60갑자 인덱스 찾기
  const monthStemIdx = monthPillar.stem.index;
  const monthBranchIdx = monthPillar.branch.index;

  // 대운 간지 생성 (8개 대운)
  const cycles: LuckCycle[] = [];
  for (let i = 1; i <= 8; i++) {
    const direction = isForward ? i : -i;
    const stemIdx = ((monthStemIdx + direction) % 10 + 10) % 10;
    const branchIdx = ((monthBranchIdx + direction) % 12 + 12) % 12;

    const stem = HEAVENLY_STEMS[stemIdx];
    const branch = EARTHLY_BRANCHES[branchIdx];
    const pillar: Pillar = {
      stem,
      branch,
      ganjiKorean: stem.korean + branch.korean,
      ganjiHanja: stem.hanja + branch.hanja,
    };

    const cycleStartAge = startAge + (i - 1) * 10;
    cycles.push({
      startAge: cycleStartAge,
      endAge: cycleStartAge + 9,
      pillar,
    });
  }

  return cycles;
}

/**
 * 세운 계산 (특정 년도의 간지)
 */
export function calculateYearlyLuck(year: number): YearlyLuck {
  const sajuRaw = calculateSaju(year, 6, 15); // 해당 년도 중간 날짜로 연주 추출
  const pillar = parseGanji(sajuRaw.yearPillar, sajuRaw.yearPillarHanja);
  return { year, pillar };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/saju/luckCycles.ts
git commit -m "feat: add luck cycles (대운/세운) calculation"
```

---

## Task 7: MUD 게임 엔진

**Files:**
- Create: `src/lib/mud/types.ts`
- Create: `src/lib/mud/rooms.ts`
- Create: `src/lib/mud/commandParser.ts`
- Create: `src/lib/mud/engine.ts`

- [ ] **Step 1: MUD 타입 정의**

Create `src/lib/mud/types.ts`:
```typescript
export type RoomId = 'entrance' | 'cave' | 'elements' | 'tenGods' | 'luck' | 'synthesis';

export interface RoomExit {
  direction: string;    // "동", "서", "남", "북"
  roomId: RoomId;
  label: string;        // "오행의 방"
}

export interface Room {
  id: RoomId;
  name: string;
  description: string[];  // 방 진입 시 표시할 텍스트 라인들
  exits: RoomExit[];
  aiInterpretation: boolean;  // AI 해석 요청 여부
}

export type CommandType =
  | { type: 'move'; direction: string }
  | { type: 'look' }
  | { type: 'help' }
  | { type: 'restart' }
  | { type: 'unknown'; raw: string };

export type GamePhase = 'intro' | 'name' | 'date' | 'time' | 'gender' | 'exploring';

export interface GameState {
  phase: GamePhase;
  currentRoom: RoomId;
  visitedRooms: Set<RoomId>;
}

// 엔진 출력
export type OutputLineType = 'text' | 'system' | 'ascii' | 'error' | 'prompt';

export interface OutputLine {
  text: string;
  type: OutputLineType;
  color?: string;  // CSS 색상 클래스
}

export interface EngineResult {
  lines: OutputLine[];
  newRoom?: RoomId;
  requestAi?: boolean;  // AI 해석 요청
}
```

- [ ] **Step 2: 방 정의**

Create `src/lib/mud/rooms.ts`:
```typescript
import { Room } from './types';

export const ROOMS: Record<string, Room> = {
  entrance: {
    id: 'entrance',
    name: '동굴 입구',
    description: [
      '',
      '  어둠 속에서 은은한 빛이 당신을 이끕니다...',
      '  고대의 현자가 동굴 입구에서 기다리고 있습니다.',
      '',
    ],
    exits: [],
    aiInterpretation: false,
  },
  cave: {
    id: 'cave',
    name: '사주의 동굴',
    description: [
      '',
      '  [사주의 동굴]에 들어섰습니다.',
      '  동굴 벽면에서 신비로운 빛이 흘러나옵니다.',
      '  현자가 눈을 감고 당신의 사주를 펼칩니다...',
      '',
    ],
    exits: [
      { direction: '동', roomId: 'elements', label: '오행의 방' },
      { direction: '서', roomId: 'tenGods', label: '십성의 방' },
      { direction: '남', roomId: 'luck', label: '운세의 방' },
      { direction: '북', roomId: 'synthesis', label: '종합 풀이' },
    ],
    aiInterpretation: true,
  },
  elements: {
    id: 'elements',
    name: '오행의 방',
    description: [
      '',
      '  [오행의 방]에 들어섰습니다.',
      '  다섯 개의 화로가 각각 다른 빛으로 타오르고 있습니다.',
      '  목(木)의 초록, 화(火)의 붉음, 토(土)의 노랑,',
      '  금(金)의 흰빛, 수(水)의 푸름이 공간을 채웁니다.',
      '',
    ],
    exits: [
      { direction: '서', roomId: 'cave', label: '사주의 동굴' },
    ],
    aiInterpretation: true,
  },
  tenGods: {
    id: 'tenGods',
    name: '십성의 방',
    description: [
      '',
      '  [십성의 방]에 들어섰습니다.',
      '  열 개의 석상이 원형으로 서 있습니다.',
      '  각 석상은 서로 다른 운명의 힘을 상징합니다.',
      '',
    ],
    exits: [
      { direction: '동', roomId: 'cave', label: '사주의 동굴' },
    ],
    aiInterpretation: true,
  },
  luck: {
    id: 'luck',
    name: '운세의 방',
    description: [
      '',
      '  [운세의 방]에 들어섰습니다.',
      '  긴 회랑에 시간의 강이 흐르고 있습니다.',
      '  강물 위에 과거와 미래의 운이 떠다닙니다.',
      '',
    ],
    exits: [
      { direction: '북', roomId: 'cave', label: '사주의 동굴' },
    ],
    aiInterpretation: true,
  },
  synthesis: {
    id: 'synthesis',
    name: '종합 풀이',
    description: [
      '',
      '  [종합 풀이의 전당]에 들어섰습니다.',
      '  모든 기운이 하나로 모이는 곳입니다.',
      '  현자가 깊은 숨을 내쉬며 말합니다...',
      '',
    ],
    exits: [
      { direction: '남', roomId: 'cave', label: '사주의 동굴' },
    ],
    aiInterpretation: true,
  },
};
```

- [ ] **Step 3: 커맨드 파서**

Create `src/lib/mud/commandParser.ts`:
```typescript
import { CommandType, RoomExit } from './types';

const DIRECTION_MAP: Record<string, string> = {
  // 한글
  '동': '동', '서': '서', '남': '남', '북': '북',
  // 단축키
  'ㄷ': '동', 'ㅅ': '서', 'ㄴ': '남', 'ㅂ': '북',
  // 영문
  'east': '동', 'west': '서', 'south': '남', 'north': '북',
  'e': '동', 'w': '서', 's': '남', 'n': '북',
};

const ROOM_NAME_MAP: Record<string, string> = {
  '오행': '동',
  '십성': '서',
  '운세': '남',
  '종합': '북',
  '동굴': '남',  // synthesis → cave 방향
};

export function parseCommand(input: string, exits: RoomExit[]): CommandType {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) return { type: 'look' };

  // 도움/help
  if (trimmed === '도움' || trimmed === '도움말' || trimmed === 'help' || trimmed === '?') {
    return { type: 'help' };
  }

  // 보기/look
  if (trimmed === '보기' || trimmed === 'look' || trimmed === 'l') {
    return { type: 'look' };
  }

  // 다시/restart
  if (trimmed === '다시' || trimmed === '처음' || trimmed === 'restart') {
    return { type: 'restart' };
  }

  // 숫자 선택 (1, 2, 3, 4)
  const num = parseInt(trimmed);
  if (!isNaN(num) && num >= 1 && num <= exits.length) {
    return { type: 'move', direction: exits[num - 1].direction };
  }

  // 방향 매핑
  const direction = DIRECTION_MAP[trimmed];
  if (direction) {
    return { type: 'move', direction };
  }

  // 방 이름 매핑
  const roomDirection = ROOM_NAME_MAP[trimmed];
  if (roomDirection) {
    return { type: 'move', direction: roomDirection };
  }

  return { type: 'unknown', raw: input };
}
```

- [ ] **Step 4: 게임 엔진**

Create `src/lib/mud/engine.ts`:
```typescript
import { CommandType, EngineResult, OutputLine, RoomId } from './types';
import { ROOMS } from './rooms';

function text(t: string, color?: string): OutputLine {
  return { text: t, type: 'text', color };
}

function system(t: string): OutputLine {
  return { text: t, type: 'system' };
}

function error(t: string): OutputLine {
  return { text: t, type: 'error' };
}

/**
 * 방 진입 시 출력 생성
 */
export function enterRoom(roomId: RoomId): EngineResult {
  const room = ROOMS[roomId];
  if (!room) {
    return { lines: [error(`알 수 없는 장소입니다.`)] };
  }

  const lines: OutputLine[] = [];

  // 방 설명
  for (const desc of room.description) {
    lines.push(text(desc));
  }

  return {
    lines,
    newRoom: roomId,
    requestAi: room.aiInterpretation,
  };
}

/**
 * 방 출구 목록 텍스트 생성
 */
export function getExitLines(roomId: RoomId): OutputLine[] {
  const room = ROOMS[roomId];
  if (!room || room.exits.length === 0) return [];

  const lines: OutputLine[] = [
    text(''),
    text('  출구:', 'text-gray-400'),
  ];

  room.exits.forEach((exit, i) => {
    lines.push(text(`    [${exit.direction}] ${exit.label}  (${i + 1})`, 'text-yellow-400'));
  });

  lines.push(text(''));
  return lines;
}

/**
 * 커맨드 실행
 */
export function executeCommand(command: CommandType, currentRoom: RoomId): EngineResult {
  const room = ROOMS[currentRoom];

  switch (command.type) {
    case 'move': {
      const exit = room.exits.find(e => e.direction === command.direction);
      if (!exit) {
        return { lines: [error('  그 방향으로는 갈 수 없습니다.')] };
      }
      return enterRoom(exit.roomId);
    }

    case 'look':
      return enterRoom(currentRoom);

    case 'help':
      return {
        lines: [
          text(''),
          system('  ═══ 도움말 ═══'),
          text('  이동: 동/서/남/북 또는 1/2/3/4'),
          text('  보기: 현재 방 다시 보기'),
          text('  도움: 이 도움말 표시'),
          text('  다시: 처음부터 다시 시작'),
          text(''),
        ],
      };

    case 'restart':
      return {
        lines: [system('  처음으로 돌아갑니다...')],
      };

    case 'unknown':
      return {
        lines: [error(`  "${command.raw}" - 알 수 없는 명령입니다. "도움"을 입력해보세요.`)],
      };
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/mud/
git commit -m "feat: add MUD game engine with rooms, command parser, and game logic"
```

---

## Task 8: AI 프롬프트 템플릿

**Files:**
- Create: `src/lib/ai/prompts.ts`

- [ ] **Step 1: prompts.ts 작성**

Create `src/lib/ai/prompts.ts`:
```typescript
import { SajuResult } from '../saju/types';
import { ELEMENT_NAMES } from '../saju/constants';

export const SYSTEM_PROMPT = `당신은 MUD 텍스트 게임 속의 고대 한국 도사(道士)입니다.
신비롭고 분위기 있는 한국어로 말하되, 지나치게 고어체를 사용하지는 마세요.
터미널 출력에 맞게 한 줄에 최대 45자 내외로 작성하세요.
마크다운, 이모지는 절대 사용하지 마세요. 이것은 터미널입니다.
박스 문자(═─╔╗╚╝│┌┐└┘)는 사용 가능합니다.
명리학적으로 정확한 해석을 기반으로 하되, 이야기하듯 풀어주세요.
각 문단 사이에 빈 줄을 넣어 가독성을 높이세요.
"현자:" 라는 접두어 없이, 도사가 직접 말하는 것처럼 작성하세요.`;

function formatSajuData(saju: SajuResult): string {
  const pillars = [
    saju.hourPillar ? `시주: ${saju.hourPillar.ganjiKorean}(${saju.hourPillar.ganjiHanja})` : '시주: 미상',
    `일주: ${saju.dayPillar.ganjiKorean}(${saju.dayPillar.ganjiHanja})`,
    `월주: ${saju.monthPillar.ganjiKorean}(${saju.monthPillar.ganjiHanja})`,
    `연주: ${saju.yearPillar.ganjiKorean}(${saju.yearPillar.ganjiHanja})`,
  ].join(' | ');

  const dm = saju.dayMaster;
  const dayMasterStr = `일간: ${dm.korean}${ELEMENT_NAMES[dm.element].hanja}(${dm.yinYang === 'yang' ? '양' : '음'})`;

  return `이름: ${saju.birthInfo.name}\n사주팔자: ${pillars}\n${dayMasterStr}`;
}

export function getRoomPrompt(roomId: string, saju: SajuResult): string {
  const base = formatSajuData(saju);

  const fiveEl = saju.fiveElements;
  const elementStr = Object.entries(ELEMENT_NAMES)
    .map(([key, val]) => `${val.korean}(${val.hanja}): ${fiveEl[key as keyof typeof fiveEl]}점`)
    .join(', ');

  const tenGodsStr = saju.tenGods
    .map(tg => `${tg.position}: ${tg.name}(${tg.stem.korean}${ELEMENT_NAMES[tg.stem.element].hanja})`)
    .join(', ');

  const luckStr = saju.luckCycles
    .map(lc => `${lc.startAge}-${lc.endAge}세: ${lc.pillar.ganjiKorean}`)
    .join(', ');

  switch (roomId) {
    case 'cave':
      return `${base}

이 사람의 사주팔자를 처음으로 펼쳐보며 드라마틱하게 소개해주세요.
각 기둥(연주/월주/일주/시주)이 무엇을 관장하는지 간단히 설명하고,
일간의 성격과 기질을 중심으로 첫인상을 이야기해주세요.
15-20줄로 작성하세요.`;

    case 'elements':
      return `${base}
오행 점수: ${elementStr}
강한 오행: ${ELEMENT_NAMES[fiveEl.dominant].korean}(${ELEMENT_NAMES[fiveEl.dominant].hanja})
약한 오행: ${ELEMENT_NAMES[fiveEl.deficient].korean}(${ELEMENT_NAMES[fiveEl.deficient].hanja})

이 사람의 오행 배치를 분석해주세요.
어떤 오행이 강하고 약한지, 그것이 성격/건강/인간관계에 어떤 영향을 미치는지,
균형을 맞추기 위한 조언도 포함해주세요.
20-25줄로 작성하세요.`;

    case 'tenGods':
      return `${base}
십성 배치: ${tenGodsStr}

이 사람의 십성 관계를 해석해주세요.
가장 두드러진 십성이 무엇인지, 그것이 직업/재물/인간관계에 어떤 의미인지,
구체적이고 실용적인 해석을 해주세요.
20-25줄로 작성하세요.`;

    case 'luck':
      return `${base}
대운 흐름: ${luckStr}
현재 세운(${saju.yearlyLuck.year}년): ${saju.yearlyLuck.pillar.ganjiKorean}

이 사람의 대운 흐름을 해석해주세요.
현재 어떤 대운 시기에 있는지, 지나온 대운과 앞으로의 대운 변화,
특히 올해 세운과의 관계를 중심으로 조언해주세요.
20-25줄로 작성하세요.`;

    case 'synthesis':
      return `${base}
오행: ${elementStr}
십성: ${tenGodsStr}
대운: ${luckStr}

이 사람의 사주를 종합적으로 풀이해주세요.
전체 운명의 테마, 타고난 강점과 약점, 인생에서 주의할 점,
그리고 앞으로의 방향에 대한 조언을 담아주세요.
이것은 모든 분석의 그랜드 피날레입니다. 깊이 있고 인상적으로 작성해주세요.
30-40줄로 작성하세요.`;

    default:
      return base;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/prompts.ts
git commit -m "feat: add AI prompt templates for each MUD room"
```

---

## Task 9: Claude API 스트리밍 엔드포인트

**Files:**
- Create: `src/app/api/interpret/route.ts`

- [ ] **Step 1: API 라우트 작성**

Create `src/app/api/interpret/route.ts`:
```typescript
import OpenAI from 'openai';
import { SYSTEM_PROMPT, getRoomPrompt } from '@/lib/ai/prompts';
import { SajuResult } from '@/lib/saju/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const { roomId, sajuResult, userName } = await request.json() as {
    roomId: string;
    sajuResult: SajuResult;
    userName: string;
  };

  const userPrompt = getRoomPrompt(roomId, sajuResult);

  const stream = await openai.chat.completions.create({
    model: 'gpt-5.2-nano',
    max_tokens: 1024,
    stream: true,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });

  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) {
            const data = `data: ${JSON.stringify({ text })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'AI 해석 중 오류가 발생했습니다.' })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/interpret/route.ts
git commit -m "feat: add Claude API streaming endpoint for saju interpretation"
```

---

## Task 10: 터미널 UI 컴포넌트

**Files:**
- Create: `src/components/terminal/Terminal.tsx`
- Create: `src/components/terminal/TerminalLine.tsx`
- Create: `src/components/terminal/TerminalInput.tsx`
- Create: `src/components/terminal/TypingEffect.tsx`

- [ ] **Step 1: TypingEffect 컴포넌트**

Create `src/components/terminal/TypingEffect.tsx`:
```tsx
'use client';

import { useState, useEffect, useRef } from 'react';

interface TypingEffectProps {
  text: string;
  speed?: number;   // ms per character
  onComplete?: () => void;
  className?: string;
}

export default function TypingEffect({ text, speed = 30, onComplete, className }: TypingEffectProps) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed('');

    const timer = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current <= text.length) {
        setDisplayed(text.slice(0, indexRef.current));
      } else {
        clearInterval(timer);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  return <span className={className}>{displayed}<span className="animate-pulse">▌</span></span>;
}
```

- [ ] **Step 2: TerminalLine 컴포넌트**

Create `src/components/terminal/TerminalLine.tsx`:
```tsx
'use client';

import TypingEffect from './TypingEffect';

export interface LineData {
  id: string;
  text: string;
  type: 'text' | 'system' | 'ascii' | 'error' | 'prompt' | 'input' | 'streaming';
  color?: string;
  typing?: boolean;
}

interface TerminalLineProps {
  line: LineData;
  onTypingComplete?: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  text: 'text-green-400',
  system: 'text-cyan-400',
  ascii: 'text-green-300',
  error: 'text-red-400',
  prompt: 'text-yellow-400',
  input: 'text-white',
  streaming: 'text-green-300',
};

export default function TerminalLine({ line, onTypingComplete }: TerminalLineProps) {
  const colorClass = line.color || TYPE_COLORS[line.type] || 'text-green-400';

  if (line.typing) {
    return (
      <div className={`whitespace-pre-wrap ${colorClass}`}>
        <TypingEffect text={line.text} speed={20} onComplete={onTypingComplete} />
      </div>
    );
  }

  return (
    <div className={`whitespace-pre-wrap ${colorClass}`}>
      {line.text}
    </div>
  );
}
```

- [ ] **Step 3: TerminalInput 컴포넌트**

Create `src/components/terminal/TerminalInput.tsx`:
```tsx
'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface TerminalInputProps {
  onSubmit: (input: string) => void;
  disabled?: boolean;
  prompt?: string;
}

export default function TerminalInput({ onSubmit, disabled = false, prompt = '>' }: TerminalInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  if (disabled) return null;

  return (
    <div className="flex items-center text-green-400">
      <span className="text-yellow-400 mr-2">{prompt}</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="bg-transparent border-none outline-none text-white flex-1 caret-green-400"
        autoFocus
        autoComplete="off"
        spellCheck={false}
      />
      <span className="animate-pulse text-green-400">▌</span>
    </div>
  );
}
```

- [ ] **Step 4: Terminal 메인 컨테이너**

Create `src/components/terminal/Terminal.tsx`:
```tsx
'use client';

import { useRef, useEffect } from 'react';
import TerminalLine, { LineData } from './TerminalLine';
import TerminalInput from './TerminalInput';

interface TerminalProps {
  lines: LineData[];
  onCommand: (input: string) => void;
  inputDisabled?: boolean;
  inputPrompt?: string;
  onTypingComplete?: (lineId: string) => void;
}

export default function Terminal({
  lines,
  onCommand,
  inputDisabled = false,
  inputPrompt,
  onTypingComplete,
}: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const handleClick = () => {
    // 터미널 아무 곳 클릭 시 input 포커스
    const input = scrollRef.current?.querySelector('input');
    input?.focus();
  };

  return (
    <div
      className="relative w-full h-screen bg-[#0a0a0a] overflow-hidden font-mono cursor-text"
      onClick={handleClick}
    >
      {/* CRT 스캔라인 효과 */}
      <div className="pointer-events-none absolute inset-0 z-10 crt-scanlines" />

      {/* 터미널 내용 */}
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto p-4 pb-20 scrollbar-thin scrollbar-thumb-green-900"
      >
        {lines.map(line => (
          <TerminalLine
            key={line.id}
            line={line}
            onTypingComplete={() => onTypingComplete?.(line.id)}
          />
        ))}

        <TerminalInput
          onSubmit={onCommand}
          disabled={inputDisabled}
          prompt={inputPrompt}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/terminal/
git commit -m "feat: add terminal UI components (Terminal, TerminalLine, TerminalInput, TypingEffect)"
```

---

## Task 11: 사주 ASCII 표시 컴포넌트

**Files:**
- Create: `src/components/saju/PillarDisplay.tsx`

- [ ] **Step 1: PillarDisplay 작성**

Create `src/components/saju/PillarDisplay.tsx`:
```typescript
import { SajuResult } from '@/lib/saju/types';
import { ELEMENT_NAMES } from '@/lib/saju/constants';

/**
 * 사주팔자를 ASCII 테이블 문자열 배열로 생성한다.
 * Terminal에 텍스트 라인으로 출력한다.
 */
export function generatePillarLines(saju: SajuResult): string[] {
  const { yearPillar: y, monthPillar: m, dayPillar: d, hourPillar: h } = saju;

  const hStem = h ? `${h.stem.korean}(${h.stem.hanja})` : '  --  ';
  const hBranch = h ? `${h.branch.korean}(${h.branch.hanja})` : '  --  ';
  const hElement = h
    ? `${ELEMENT_NAMES[h.stem.element].korean}${ELEMENT_NAMES[h.branch.element].korean}`
    : ' -- ';

  const lines = [
    '  ┌────────┬────────┬────────┬────────┐',
    '  │ 시 주  │ 일 주  │ 월 주  │ 연 주  │',
    '  ├────────┼────────┼────────┼────────┤',
    `  │ ${pad(hStem)}│ ${pad(`${d.stem.korean}(${d.stem.hanja})`)}│ ${pad(`${m.stem.korean}(${m.stem.hanja})`)}│ ${pad(`${y.stem.korean}(${y.stem.hanja})`)}│ 천간`,
    `  │ ${pad(hBranch)}│ ${pad(`${d.branch.korean}(${d.branch.hanja})`)}│ ${pad(`${m.branch.korean}(${m.branch.hanja})`)}│ ${pad(`${y.branch.korean}(${y.branch.hanja})`)}│ 지지`,
    '  ├────────┼────────┼────────┼────────┤',
    `  │ ${pad(hElement)} │ ${pad(`${ELEMENT_NAMES[d.stem.element].korean}${ELEMENT_NAMES[d.branch.element].korean}`)} │ ${pad(`${ELEMENT_NAMES[m.stem.element].korean}${ELEMENT_NAMES[m.branch.element].korean}`)} │ ${pad(`${ELEMENT_NAMES[y.stem.element].korean}${ELEMENT_NAMES[y.branch.element].korean}`)} │ 오행`,
    '  └────────┴────────┴────────┴────────┘',
  ];

  return lines;
}

function pad(str: string, width: number = 7): string {
  // 한글은 2칸, 영문/특수문자는 1칸으로 계산
  const len = getDisplayWidth(str);
  const padding = Math.max(0, width - len);
  return str + ' '.repeat(padding);
}

function getDisplayWidth(str: string): number {
  let width = 0;
  for (const char of str) {
    const code = char.charCodeAt(0);
    // CJK, 한글, 한자 등은 2칸
    if (
      (code >= 0xAC00 && code <= 0xD7AF) || // 한글
      (code >= 0x4E00 && code <= 0x9FFF) || // 한자
      (code >= 0x3400 && code <= 0x4DBF) || // 한자 확장
      (code >= 0xFF00 && code <= 0xFFEF)    // 전각
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/saju/PillarDisplay.tsx
git commit -m "feat: add ASCII pillar display for saju table"
```

---

## Task 12: React Hooks (useTerminal, useGame, useStreaming)

**Files:**
- Create: `src/hooks/useTerminal.ts`
- Create: `src/hooks/useStreaming.ts`
- Create: `src/hooks/useGame.ts`

- [ ] **Step 1: useTerminal 훅**

Create `src/hooks/useTerminal.ts`:
```typescript
'use client';

import { useState, useCallback } from 'react';
import { LineData } from '@/components/terminal/TerminalLine';

let lineCounter = 0;
function nextId(): string {
  return `line-${++lineCounter}`;
}

export function useTerminal() {
  const [lines, setLines] = useState<LineData[]>([]);

  const addLine = useCallback((text: string, type: LineData['type'] = 'text', options?: { color?: string; typing?: boolean }) => {
    const line: LineData = {
      id: nextId(),
      text,
      type,
      color: options?.color,
      typing: options?.typing,
    };
    setLines(prev => [...prev, line]);
    return line.id;
  }, []);

  const addLines = useCallback((texts: string[], type: LineData['type'] = 'text', color?: string) => {
    const newLines: LineData[] = texts.map(text => ({
      id: nextId(),
      text,
      type,
      color,
    }));
    setLines(prev => [...prev, ...newLines]);
  }, []);

  const appendToLine = useCallback((lineId: string, text: string) => {
    setLines(prev =>
      prev.map(line =>
        line.id === lineId ? { ...line, text: line.text + text } : line
      )
    );
  }, []);

  const clear = useCallback(() => {
    setLines([]);
  }, []);

  return { lines, addLine, addLines, appendToLine, clear };
}
```

- [ ] **Step 2: useStreaming 훅**

Create `src/hooks/useStreaming.ts`:
```typescript
'use client';

import { useState, useCallback, useRef } from 'react';
import { SajuResult } from '@/lib/saju/types';

interface UseStreamingReturn {
  isStreaming: boolean;
  streamInterpretation: (
    roomId: string,
    sajuResult: SajuResult,
    onChunk: (text: string) => void,
    onComplete: () => void,
    onError: (error: string) => void,
  ) => void;
  cancelStream: () => void;
}

export function useStreaming(): UseStreamingReturn {
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
    ) => {
      cancelStream();
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch('/api/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, sajuResult, userName: sajuResult.birthInfo.name }),
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
```

- [ ] **Step 3: useGame 훅**

Create `src/hooks/useGame.ts`:
```typescript
'use client';

import { useState, useCallback, useRef } from 'react';
import { useTerminal } from './useTerminal';
import { useStreaming } from './useStreaming';
import { GamePhase, RoomId } from '@/lib/mud/types';
import { parseCommand } from '@/lib/mud/commandParser';
import { enterRoom, executeCommand, getExitLines } from '@/lib/mud/engine';
import { ROOMS } from '@/lib/mud/rooms';
import { calculateFullSaju } from '@/lib/saju/calculator';
import { generatePillarLines } from '@/components/saju/PillarDisplay';
import { BirthInfo, Gender, SajuResult } from '@/lib/saju/types';

const TITLE_ART = [
  '',
  '  ╔═══════════════════════════════════════╗',
  '  ║                                       ║',
  '  ║    사 주 명 리 의   미 궁             ║',
  '  ║    Labyrinth of Four Pillars          ║',
  '  ║                                       ║',
  '  ╚═══════════════════════════════════════╝',
  '',
];

export function useGame() {
  const terminal = useTerminal();
  const streaming = useStreaming();

  const [phase, setPhase] = useState<GamePhase>('intro');
  const [currentRoom, setCurrentRoom] = useState<RoomId>('entrance');
  const sajuRef = useRef<SajuResult | null>(null);
  const birthInfoRef = useRef<Partial<BirthInfo>>({});

  const showExits = useCallback((roomId: RoomId) => {
    const exitLines = getExitLines(roomId);
    for (const line of exitLines) {
      terminal.addLine(line.text, line.type, { color: line.color });
    }
  }, [terminal]);

  const triggerAi = useCallback((roomId: RoomId) => {
    if (!sajuRef.current) return;

    terminal.addLine('');
    const streamLineId = terminal.addLine('', 'streaming');

    streaming.streamInterpretation(
      roomId,
      sajuRef.current,
      (chunk) => terminal.appendToLine(streamLineId, chunk),
      () => {
        showExits(roomId);
      },
      (error) => {
        terminal.addLine(`  오류: ${error}`, 'error');
        showExits(roomId);
      },
    );
  }, [terminal, streaming, showExits]);

  const moveToRoom = useCallback((roomId: RoomId) => {
    setCurrentRoom(roomId);
    const result = enterRoom(roomId);

    for (const line of result.lines) {
      terminal.addLine(line.text, line.type, { color: line.color });
    }

    // 사주 테이블 표시 (cave 방)
    if (roomId === 'cave' && sajuRef.current) {
      const pillarLines = generatePillarLines(sajuRef.current);
      terminal.addLines(pillarLines, 'ascii', 'text-yellow-300');
    }

    if (result.requestAi) {
      triggerAi(roomId);
    } else {
      showExits(roomId);
    }
  }, [terminal, triggerAi, showExits]);

  const startGame = useCallback(() => {
    terminal.clear();
    terminal.addLines(TITLE_ART, 'ascii', 'text-cyan-400');
    terminal.addLine('  어둠 속에서 은은한 빛이 당신을 이끕니다...', 'text');
    terminal.addLine('  고대의 현자가 동굴 입구에서 기다리고 있습니다.', 'text');
    terminal.addLine('', 'text');
    terminal.addLine('  현자: "그대의 이름이 무엇인가?"', 'system');
    setPhase('name');
    setCurrentRoom('entrance');
    sajuRef.current = null;
    birthInfoRef.current = {};
  }, [terminal]);

  const handleCommand = useCallback((input: string) => {
    // 사용자 입력 표시
    terminal.addLine(`  > ${input}`, 'input');

    switch (phase) {
      case 'name':
        birthInfoRef.current.name = input;
        terminal.addLine('', 'text');
        terminal.addLine('  현자: "생년월일을 알려주시오. (예: 1990-03-15)"', 'system');
        setPhase('date');
        break;

      case 'date': {
        const match = input.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
        if (!match) {
          terminal.addLine('  형식이 올바르지 않습니다. (예: 1990-03-15)', 'error');
          return;
        }
        birthInfoRef.current.year = parseInt(match[1]);
        birthInfoRef.current.month = parseInt(match[2]);
        birthInfoRef.current.day = parseInt(match[3]);
        terminal.addLine('', 'text');
        terminal.addLine('  현자: "태어난 시간은? (예: 14:30, 모르면 \'모름\')"', 'system');
        setPhase('time');
        break;
      }

      case 'time': {
        if (input === '모름' || input === '모름' || input.toLowerCase() === 'unknown') {
          birthInfoRef.current.hour = null;
          birthInfoRef.current.minute = 0;
        } else {
          const match = input.match(/^(\d{1,2}):?(\d{2})?$/);
          if (!match) {
            terminal.addLine('  형식이 올바르지 않습니다. (예: 14:30 또는 모름)', 'error');
            return;
          }
          birthInfoRef.current.hour = parseInt(match[1]);
          birthInfoRef.current.minute = match[2] ? parseInt(match[2]) : 0;
        }
        terminal.addLine('', 'text');
        terminal.addLine('  현자: "성별은? (남/여)"', 'system');
        setPhase('gender');
        break;
      }

      case 'gender': {
        const g = input.toLowerCase();
        if (g === '남' || g === '남자' || g === 'male' || g === 'm') {
          birthInfoRef.current.gender = 'male';
        } else if (g === '여' || g === '여자' || g === 'female' || g === 'f') {
          birthInfoRef.current.gender = 'female';
        } else {
          terminal.addLine('  남 또는 여를 입력해주세요.', 'error');
          return;
        }

        terminal.addLine('', 'text');
        terminal.addLine('  현자가 눈을 감고 사주를 읽기 시작합니다...', 'system');
        terminal.addLine('', 'text');

        try {
          const saju = calculateFullSaju(birthInfoRef.current as BirthInfo);
          sajuRef.current = saju;
          setPhase('exploring');
          moveToRoom('cave');
        } catch (err) {
          terminal.addLine('  사주 계산 중 오류가 발생했습니다. 날짜를 확인해주세요.', 'error');
          terminal.addLine('  현자: "다시 생년월일을 알려주시오. (예: 1990-03-15)"', 'system');
          setPhase('date');
          birthInfoRef.current = { name: birthInfoRef.current.name };
        }
        break;
      }

      case 'exploring': {
        const room = ROOMS[currentRoom];
        const command = parseCommand(input, room.exits);

        if (command.type === 'restart') {
          startGame();
          return;
        }

        const result = executeCommand(command, currentRoom);

        for (const line of result.lines) {
          terminal.addLine(line.text, line.type, { color: line.color });
        }

        if (result.newRoom && result.newRoom !== currentRoom) {
          moveToRoom(result.newRoom);
        }
        break;
      }

      default:
        startGame();
    }
  }, [phase, currentRoom, terminal, moveToRoom, startGame]);

  return {
    lines: terminal.lines,
    handleCommand,
    startGame,
    isStreaming: streaming.isStreaming,
    phase,
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/
git commit -m "feat: add React hooks (useTerminal, useStreaming, useGame)"
```

---

## Task 13: 글로벌 CSS + 레이아웃 + 메인 페이지

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: globals.css - 터미널 테마**

Replace `src/app/globals.css` with:
```css
@import "tailwindcss";

:root {
  --terminal-bg: #0a0a0a;
  --terminal-text: #00ff41;
  --terminal-dim: #00aa2a;
  --terminal-bright: #ffffff;
}

body {
  background: var(--terminal-bg);
  color: var(--terminal-text);
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* CRT 스캔라인 효과 */
.crt-scanlines {
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.15) 0px,
    rgba(0, 0, 0, 0.15) 1px,
    transparent 1px,
    transparent 2px
  );
}

/* 스크롤바 스타일 */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #1a3a1a;
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #2a5a2a;
}

/* 깜박이는 커서 */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.animate-blink {
  animation: blink 1s step-end infinite;
}

/* 모바일 최적화 */
input {
  font-size: 16px; /* iOS에서 줌 방지 */
}
```

- [ ] **Step 2: layout.tsx**

Replace `src/app/layout.tsx` with:
```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '사주명리의 미궁 - Labyrinth of Four Pillars',
  description: 'MUD 스타일 사주 풀이 서비스',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/wan2land/d2coding/d2coding-ligature-full.css"
        />
      </head>
      <body className="font-['D2Coding',_'D2_Coding_Ligature',_monospace]">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: page.tsx**

Replace `src/app/page.tsx` with:
```tsx
'use client';

import { useEffect } from 'react';
import Terminal from '@/components/terminal/Terminal';
import { useGame } from '@/hooks/useGame';

export default function Home() {
  const { lines, handleCommand, startGame, isStreaming } = useGame();

  useEffect(() => {
    startGame();
  }, [startGame]);

  return (
    <main>
      <Terminal
        lines={lines}
        onCommand={handleCommand}
        inputDisabled={isStreaming}
        inputPrompt=">"
      />
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/app/page.tsx
git commit -m "feat: add terminal theme CSS, layout with D2Coding font, and main page"
```

---

## Task 14: 빌드 + 실행 검증

- [ ] **Step 1: TypeScript 빌드 확인**

```bash
cd /Users/kwanung/development/experiments/saju-full2
npm run build
```
Expected: 빌드 성공 (경고는 OK, 에러 없어야 함)

- [ ] **Step 2: 빌드 에러 수정 (있다면)**

빌드 에러가 있으면 해당 파일 수정 후 다시 빌드.

- [ ] **Step 3: 개발 서버 실행 테스트**

```bash
npm run dev
```
Expected: localhost:3000에서 터미널 UI 표시, 이름 입력 프롬프트 동작

- [ ] **Step 4: 전체 흐름 테스트**

브라우저에서:
1. 이름 입력 → 생년월일 입력 → 시간 입력 → 성별 입력
2. 사주의 동굴에서 사주팔자 테이블 표시 확인
3. AI 스트리밍 텍스트 출력 확인 (ANTHROPIC_API_KEY 필요)
4. 방 이동 (동/서/남/북) 동작 확인
5. 도움 커맨드 동작 확인

- [ ] **Step 5: 최종 Commit**

```bash
git add -A
git commit -m "feat: complete saju MUD web app - working end-to-end"
```

---

## Verification

1. **사주 계산 정확도**: 1990-03-15 14:30 남자로 테스트 → 온라인 사주 사이트(예: 만세력닷컴)와 사주팔자 대조
2. **터미널 UI**: `npm run dev` → 브라우저에서 녹색 터미널, CRT 스캔라인, 깜박 커서 확인
3. **MUD 내비게이션**: 동/서/남/북, 1/2/3/4, 오행/십성/운세 커맨드 모두 동작
4. **AI 스트리밍**: 각 방 진입 시 텍스트가 타이핑 효과로 출력
5. **엣지 케이스**: 시간 "모름" → 3주만으로 분석, 잘못된 날짜 → 에러 메시지
6. **모바일**: 터미널이 화면에 맞게 표시, 입력 가능
