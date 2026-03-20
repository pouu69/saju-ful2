# 사주 던전 크롤러 (선택/분기 스토리) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** saju-ful2를 복사하여 saju-game 프로젝트를 만들고, MUD 방 탐험을 카드 기반 선택/분기 스토리 던전으로 전환한다. 각 층에서 사주의 시련을 마주하고 카드를 선택하면 AI가 해당 관점으로 풀이해준다.

**Architecture:** saju-ful2의 터미널 UI, 사주 계산, AI 스트리밍을 그대로 유지하면서, MUD 방 시스템을 5층 던전으로 교체. 1층은 카드 공개 세레모니, 2~5층은 시련+2장 카드 선택 → AI 풀이. 전투 없이 선택/관점만 다름.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS v4, OpenAI/Gemini AI, `@fullstackfamily/manseryeok`

**Spec:** `docs/superpowers/specs/2026-03-20-saju-dungeon-crawler-design.md`

**Note:** No test framework is configured (per CLAUDE.md). Verification is done via `npm run build` and manual browser testing with `npm run dev`.

---

## File Map

### New files to create (in saju-game)

| File | Responsibility |
|------|---------------|
| `src/lib/game/types.ts` | Card, Trial, ChoiceRecord, GameSave, Floor, Element types |
| `src/lib/game/elements.ts` | 오행 상생/상극 관계 헬퍼 (isOvercoming, isGenerating, etc.) |
| `src/lib/game/yongshin.ts` | 간이 용신/기신 판별 (dayMaster element + fiveElements 기반) |
| `src/lib/game/cards.ts` | 사주→8장 카드 생성, 선택지 카드 배정 |
| `src/lib/game/trials.ts` | 층별 시련 생성 (기신/오행불균형/세운/흉살) |
| `src/lib/game/floors.ts` | 5개 층 정의, 층별 흐름, 층 진입 텍스트 |
| `src/lib/game/prompts.ts` | 층별 AI 프롬프트 (getFloorPrompt, getCardNarrationPrompt, getEndingPrompt) |
| `src/lib/game/storage.ts` | localStorage 저장/불러오기 |
| `src/components/game/CardDisplay.ts` | ASCII 카드 렌더링 (데스크톱/모바일) → 터미널 라인 배열 반환 |
| `src/components/game/CardReveal.ts` | 카드 공개 세레모니 라인 생성 |
| `src/components/game/TrialScene.ts` | 시련 등장 + 2장 카드 선택 UI 라인 생성 |
| `src/components/game/EndingReport.ts` | 엔딩 리포트 라인 생성 |

### Existing files to modify (in saju-game)

| File | Changes |
|------|---------|
| `src/hooks/useGame.ts` | phase 확장, 카드/시련/선택 상태 추가, handleCommand에 새 phase 핸들러 |
| `src/lib/mud/commandParser.ts` | 선택 명령어 (1/2) 지원 확장 |
| `src/lib/ai/prompts.ts` | 카드 공개 내레이션용 프롬프트 추가 |
| `src/app/api/interpret/route.ts` | request body에 floor/trial/choice 컨텍스트 추가 |
| `src/app/page.tsx` | DungeonMap 교체, 내보내기에 선택 기록 포함 |

### Files to delete (from saju-game)

| File | Reason |
|------|--------|
| `src/lib/mud/rooms.ts` | → floors.ts로 대체 |
| `src/lib/mud/engine.ts` | → useGame.ts에 층 전환 로직 직접 통합 |

---

## Task 0: 프로젝트 셋업

**Files:**
- Copy: `saju-ful2/` → `saju-game/`

- [ ] **Step 1: saju-ful2를 saju-game으로 복사**

```bash
cp -r /Users/kwanung/development/experiments/saju-ful2 /Users/kwanung/development/experiments/saju-game
```

- [ ] **Step 2: saju-game에서 git 초기화 (새 프로젝트)**

```bash
cd /Users/kwanung/development/experiments/saju-game
rm -rf .git
git init
```

- [ ] **Step 3: 불필요한 파일 정리**

```bash
rm -f example.txt example1.txt
rm -rf docs/superpowers/  # 기존 계획 문서 제거 (saju-ful2에 남아있으므로)
```

- [ ] **Step 4: package.json 이름 변경**

`package.json`에서 `name`을 `"saju-game"`으로 변경.

- [ ] **Step 5: 빌드 확인**

```bash
npm run build
```

Expected: 기존 코드 그대로이므로 빌드 성공

- [ ] **Step 6: 초기 커밋**

```bash
git add -A
git commit -m "feat: initialize saju-game from saju-ful2 copy"
```

---

## Task 1: 게임 타입 정의 + 오행 헬퍼

**Files:**
- Create: `src/lib/game/types.ts`
- Create: `src/lib/game/elements.ts`

- [ ] **Step 1: types.ts 작성**

```typescript
// src/lib/game/types.ts
import { type SajuResult, type BirthInfo } from '@/lib/saju/types';

export type Element = '목' | '화' | '토' | '금' | '수';

export interface Card {
  id: string;
  hanja: string;
  hangul: string;
  element: Element;
  yinYang: '양' | '음';
  type: 'stem' | 'branch';
  source: 'year' | 'month' | 'day' | 'hour';
  keyword?: string;
  description?: string;
  approach?: 'active' | 'receptive';
}

export type TrialType = 'gishin' | 'imbalance' | 'clash' | 'sinsal';

export interface Trial {
  name: string;
  desc: string;
  element: Element;
  type: TrialType;
  floor: number;
}

export interface ChoiceRecord {
  floor: number;
  trialName: string;
  trialElement: Element;
  chosenCard: { hanja: string; hangul: string; element: Element };
  approach: 'active' | 'receptive';
  keyword: string;
}

export interface FloorDef {
  id: number;
  name: string;
  theme: string;
  description: string[];
  hasChoice: boolean;
}

export interface GameSave {
  version: number;
  birthInfo: BirthInfo;
  currentFloor: number;
  deck: Card[];
  completedFloors: number[];
  choices: ChoiceRecord[];
  aiCache: Record<string, string>;
  yongshin: Element;
  gishin: Element;
}
```

- [ ] **Step 2: elements.ts 작성**

```typescript
// src/lib/game/elements.ts
import { type Element } from './types';

// 상생: 목→화→토→금→수→목
const GENERATING: Record<Element, Element> = {
  '목': '화', '화': '토', '토': '금', '금': '수', '수': '목',
};

// 상극: 목→토, 토→수, 수→화, 화→금, 금→목
const OVERCOMING: Record<Element, Element> = {
  '목': '토', '토': '수', '수': '화', '화': '금', '금': '목',
};

/** a가 b를 극(克)하는가? (a → b 상극) */
export function isOvercoming(a: Element, b: Element): boolean {
  return OVERCOMING[a] === b;
}

/** a가 b를 생(生)하는가? (a → b 상생) */
export function isGenerating(a: Element, b: Element): boolean {
  return GENERATING[a] === b;
}

/** element를 극(克)하는 오행 반환 */
export function getOvercomingElement(element: Element): Element {
  // element를 극하는 = OVERCOMING에서 value가 element인 key
  const entries = Object.entries(OVERCOMING) as [Element, Element][];
  return entries.find(([, v]) => v === element)![0];
}

/** element를 생(生)해주는 오행 반환 */
export function getGeneratingElement(element: Element): Element {
  const entries = Object.entries(GENERATING) as [Element, Element][];
  return entries.find(([, v]) => v === element)![0];
}

/** 오행 한글 → 영문 매핑 (SajuResult.fiveElements 접근용) */
export const ELEMENT_TO_KEY: Record<Element, string> = {
  '목': 'wood', '화': 'fire', '토': 'earth', '금': 'metal', '수': 'water',
};

/** 영문 → 한글 오행 */
export const KEY_TO_ELEMENT: Record<string, Element> = {
  'wood': '목', 'fire': '화', 'earth': '토', 'metal': '금', 'water': '수',
};
```

- [ ] **Step 3: 빌드 확인**

```bash
npm run build
```

- [ ] **Step 4: 커밋**

```bash
git add src/lib/game/types.ts src/lib/game/elements.ts
git commit -m "feat: add game type definitions and five-element helpers"
```

---

## Task 2: 용신/기신 판별

**Files:**
- Create: `src/lib/game/yongshin.ts`

- [ ] **Step 1: yongshin.ts 작성**

```typescript
// src/lib/game/yongshin.ts
import { type SajuResult } from '@/lib/saju/types';
import { type Element } from './types';
import { getOvercomingElement, getGeneratingElement, ELEMENT_TO_KEY, KEY_TO_ELEMENT } from './elements';

/**
 * 간이 용신/기신 판별
 * dayMaster의 오행 비율로 신강/신약 판단 후,
 * 신강이면 극하는 오행이 용신, 생하는 오행이 기신
 * 신약이면 생하는 오행이 용신, 극하는 오행이 기신
 */
export function determineYongshin(sajuResult: SajuResult): {
  yongshin: Element;
  gishin: Element;
  isStrong: boolean;
} {
  const fe = sajuResult.fiveElements;
  const dayElement = getDayMasterElement(sajuResult);

  // 일간 오행의 비율 계산 (PillarDisplay.tsx:312-315와 동일 방식)
  const totalScore = fe.wood + fe.fire + fe.earth + fe.metal + fe.water;
  const dayKey = ELEMENT_TO_KEY[dayElement];
  const dmScore = fe[dayKey as keyof typeof fe] as number;
  const dmPct = totalScore > 0 ? Math.round((dmScore / totalScore) * 100) : 0;

  const isStrong = dmPct >= 30; // 30% 이상이면 신강

  if (isStrong) {
    return {
      yongshin: getOvercomingElement(dayElement),
      gishin: getGeneratingElement(dayElement),
      isStrong: true,
    };
  } else {
    return {
      yongshin: getGeneratingElement(dayElement),
      gishin: getOvercomingElement(dayElement),
      isStrong: false,
    };
  }
}

/** SajuResult에서 일간의 오행을 Element 타입으로 추출
 *  주의: dayMaster.element는 영문 FiveElement('wood','fire',...)이므로 한글 변환 필요 */
export function getDayMasterElement(sajuResult: SajuResult): Element {
  return KEY_TO_ELEMENT[sajuResult.dayMaster.element] || '토';
}
```

- [ ] **Step 2: 빌드 확인 + 커밋**

```bash
npm run build
git add src/lib/game/yongshin.ts
git commit -m "feat: add simple yongshin/gishin determination"
```

---

## Task 3: 카드 시스템

**Files:**
- Create: `src/lib/game/cards.ts`
- Create: `src/components/game/CardDisplay.ts`

- [ ] **Step 1: cards.ts 작성 — 사주→카드 생성 + 선택지 배정**

```typescript
// src/lib/game/cards.ts
import { type SajuResult } from '@/lib/saju/types';
import { type Card, type Element, type Trial } from './types';
import { isOvercoming, isGenerating } from './elements';

/** 10천간 데이터 */
const STEMS: Record<string, { hanja: string; element: Element; yinYang: '양' | '음' }> = {
  '갑': { hanja: '甲', element: '목', yinYang: '양' },
  '을': { hanja: '乙', element: '목', yinYang: '음' },
  '병': { hanja: '丙', element: '화', yinYang: '양' },
  '정': { hanja: '丁', element: '화', yinYang: '음' },
  '무': { hanja: '戊', element: '토', yinYang: '양' },
  '기': { hanja: '己', element: '토', yinYang: '음' },
  '경': { hanja: '庚', element: '금', yinYang: '양' },
  '신': { hanja: '辛', element: '금', yinYang: '음' },
  '임': { hanja: '壬', element: '수', yinYang: '양' },
  '계': { hanja: '癸', element: '수', yinYang: '음' },
};

/** 12지지 데이터 */
const BRANCHES: Record<string, { hanja: string; element: Element; yinYang: '양' | '음' }> = {
  '자': { hanja: '子', element: '수', yinYang: '양' },
  '축': { hanja: '丑', element: '토', yinYang: '음' },
  '인': { hanja: '寅', element: '목', yinYang: '양' },
  '묘': { hanja: '卯', element: '목', yinYang: '음' },
  '진': { hanja: '辰', element: '토', yinYang: '양' },
  '사': { hanja: '巳', element: '화', yinYang: '음' },
  '오': { hanja: '午', element: '화', yinYang: '양' },
  '미': { hanja: '未', element: '토', yinYang: '음' },
  '신': { hanja: '申', element: '금', yinYang: '양' },
  '유': { hanja: '酉', element: '금', yinYang: '음' },
  '술': { hanja: '戌', element: '토', yinYang: '양' },
  '해': { hanja: '亥', element: '수', yinYang: '음' },
};

/** SajuResult에서 8장 카드 생성 */
export function createDeckFromSaju(saju: SajuResult): Card[] {
  const pillars = [
    { pillar: saju.yearPillar, source: 'year' as const },
    { pillar: saju.monthPillar, source: 'month' as const },
    { pillar: saju.dayPillar, source: 'day' as const },
    ...(saju.hourPillar ? [{ pillar: saju.hourPillar, source: 'hour' as const }] : []),
  ];

  const cards: Card[] = [];

  for (const { pillar, source } of pillars) {
    // 천간 카드
    const stemChar = pillar.ganjiKorean[0];
    const stemData = STEMS[stemChar];
    if (stemData) {
      cards.push({
        id: `${source}-stem-${stemChar}`,
        hanja: stemData.hanja,
        hangul: stemChar,
        element: stemData.element,
        yinYang: stemData.yinYang,
        type: 'stem',
        source,
      });
    }

    // 지지 카드
    const branchChar = pillar.ganjiKorean[1];
    const branchData = BRANCHES[branchChar];
    if (branchData) {
      cards.push({
        id: `${source}-branch-${branchChar}`,
        hanja: branchData.hanja,
        hangul: branchChar,
        element: branchData.element,
        yinYang: branchData.yinYang,
        type: 'branch',
        source,
      });
    }
  }

  return cards;
}

/** 층별 능동적/수용적 키워드 */
const ACTIVE_KEYWORDS: Record<number, { keyword: string; desc: string }> = {
  2: { keyword: '돌파', desc: '적극적으로 장애를 극복하는 관점' },
  3: { keyword: '보완', desc: '부족한 기운을 채우는 관점' },
  4: { keyword: '조화', desc: '충돌을 화해하고 조화시키는 관점' },
  5: { keyword: '통제', desc: '위험 요소를 다스리고 절제하는 관점' },
};

const RECEPTIVE_KEYWORDS: Record<number, { keyword: string; desc: string }> = {
  2: { keyword: '흐름', desc: '유연하게 흐름에 맡기는 관점' },
  3: { keyword: '활용', desc: '넘치는 기운을 살려 활용하는 관점' },
  4: { keyword: '변화', desc: '충돌을 변화의 기회로 받아들이는 관점' },
  5: { keyword: '포용', desc: '위험 요소를 수용하고 전환하는 관점' },
};

/** 시련에 대한 2장의 선택지 카드 배정 */
export function assignChoiceCards(
  trial: Trial,
  deck: Card[],
  floor: number,
): [Card, Card] {
  // 능동 카드: 시련을 극하는 오행
  let activeCard = deck.find(c => isOvercoming(c.element, trial.element));
  // 수용 카드: 시련과 상생 또는 같은 오행
  let receptiveCard = deck.find(c =>
    isGenerating(c.element, trial.element) || c.element === trial.element,
  );

  // 폴백: 적합한 카드가 없으면 일간 카드를 능동, 아무 다른 카드를 수용
  const dayCard = deck.find(c => c.source === 'day' && c.type === 'stem');
  if (!activeCard) {
    activeCard = dayCard || deck[0];
  }
  if (!receptiveCard || receptiveCard.id === activeCard.id) {
    receptiveCard = deck.find(c => c.id !== activeCard!.id) || deck[1] || deck[0];
  }

  const activeKw = ACTIVE_KEYWORDS[floor] || ACTIVE_KEYWORDS[2];
  const receptiveKw = RECEPTIVE_KEYWORDS[floor] || RECEPTIVE_KEYWORDS[2];

  return [
    { ...activeCard, keyword: activeKw.keyword, description: activeKw.desc, approach: 'active' },
    { ...receptiveCard, keyword: receptiveKw.keyword, description: receptiveKw.desc, approach: 'receptive' },
  ];
}
```

- [ ] **Step 2: CardDisplay.ts 작성 — ASCII 카드 렌더링**

```typescript
// src/components/game/CardDisplay.ts

import { type Card } from '@/lib/game/types';

const ELEMENT_SYMBOLS: Record<string, string> = {
  '목': '🌿', '화': '🔥', '토': '⛰️', '금': '⚔️', '수': '💧',
};

const ELEMENT_ASCII: Record<string, string> = {
  '목': '木木', '화': '火火', '토': '土土', '금': '金金', '수': '水水',
};

/** 데스크톱용 카드 (15자 폭) */
export function renderCardDesktop(card: Card): string[] {
  const symbol = ELEMENT_ASCII[card.element] || '??';
  const keyword = card.keyword ? `"${card.keyword}"` : '';
  const desc = card.description ? card.description.slice(0, 8) : '';
  return [
    '╭─────────────╮',
    `│ ${card.hanja} (${card.hangul})     │`.slice(0, 16) + '│',
    '│   ━━━━━     │',
    `│    ${symbol}      │`,
    '│             │',
    `│  ${card.yinYang}(${card.yinYang === '양' ? '+' : '-'}) ${card.element}   │`,
    keyword ? `│  ${keyword.padEnd(10)}│` : '│             │',
    desc ? `│  ${desc.padEnd(10)}│` : '│             │',
    '╰─────────────╯',
  ];
}

/** 모바일용 카드 (11자 폭) */
export function renderCardMobile(card: Card): string[] {
  const symbol = ELEMENT_ASCII[card.element] || '??';
  const keyword = card.keyword ? `"${card.keyword}"` : '';
  return [
    '╭─────────╮',
    `│${card.hanja}(${card.hangul})    │`.slice(0, 11) + '│',
    `│  ${symbol}   │`,
    `│${card.yinYang} ${card.element}     │`.slice(0, 11) + '│',
    keyword ? `│ ${keyword.padEnd(8)}│` : '│         │',
    '╰─────────╯',
  ];
}

/** 2장 카드를 나란히 렌더링 */
export function renderCardPair(
  cardA: Card,
  cardB: Card,
  compact: boolean = false,
): string[] {
  const renderFn = compact ? renderCardMobile : renderCardDesktop;
  const linesA = renderFn(cardA);
  const linesB = renderFn(cardB);
  const maxLen = Math.max(linesA.length, linesB.length);
  const gap = compact ? '  ' : '    ';
  const result: string[] = [];
  for (let i = 0; i < maxLen; i++) {
    const a = linesA[i] || '';
    const b = linesB[i] || '';
    const padWidth = compact ? 11 : 15;
    result.push(a.padEnd(padWidth) + gap + b);
  }
  return result;
}
```

- [ ] **Step 3: 빌드 확인 + 커밋**

```bash
npm run build
git add src/lib/game/cards.ts src/components/game/CardDisplay.ts
git commit -m "feat: add card creation from saju and ASCII card rendering"
```

---

## Task 4: 시련 시스템

**Files:**
- Create: `src/lib/game/trials.ts`

- [ ] **Step 1: trials.ts 작성**

```typescript
// src/lib/game/trials.ts
import { type SajuResult } from '@/lib/saju/types';
import { type Trial, type Element } from './types';
import { KEY_TO_ELEMENT, ELEMENT_TO_KEY } from './elements';
import { determineYongshin } from './yongshin';

/** 기신 시련 템플릿 (2층) */
const GISHIN_TEMPLATES: Record<Element, { name: string; desc: string }> = {
  '목': { name: '뒤틀린 고목의 시련', desc: '성장을 막는 경직된 힘이 그대 앞을 가로막는다' },
  '화': { name: '폭주하는 화염의 시련', desc: '감정과 욕망의 불길이 그대를 태우려 한다' },
  '토': { name: '토의 장벽', desc: '변화를 막는 완고한 벽이 그대의 길을 막는다' },
  '금': { name: '서리 칼날의 시련', desc: '날카로운 비판과 고독이 그대를 에워싼다' },
  '수': { name: '깊은 심연의 시련', desc: '불안과 두려움의 깊은 물이 그대를 삼키려 한다' },
};

/** 오행 불균형 시련 템플릿 (3층) */
const IMBALANCE_TEMPLATES: Record<Element, { name: string; desc: string }> = {
  '목': { name: '넘치는 목기(木氣)', desc: '과한 성장욕이 그대를 지치게 하는 시련' },
  '화': { name: '넘치는 화기(火氣)', desc: '과한 열정이 그대를 소진시키는 시련' },
  '토': { name: '넘치는 토기(土氣)', desc: '과한 신중함이 그대를 멈추게 하는 시련' },
  '금': { name: '넘치는 금기(金氣)', desc: '과한 결단이 그대를 외롭게 하는 시련' },
  '수': { name: '넘치는 수기(水氣)', desc: '과한 사유가 그대를 불안하게 하는 시련' },
};

/** 세운 충 시련 템플릿 (4층) */
const CLASH_TEMPLATE = {
  name: (year: number, element: Element) => `${year}년 ${element}기운의 파도`,
  desc: (element: Element) => `올해의 ${element} 기운이 그대의 사주와 충돌하는 시련`,
};

/** 신살→시련 매핑 (5층) */
const SINSAL_TEMPLATES: Record<string, { name: string; desc: string; element: Element }> = {
  '공망': { name: '허무의 심연', desc: '비어있음과 헛됨을 마주하는 시련', element: '수' },
  '겁살': { name: '그림자의 시련', desc: '예상치 못한 손실과 변동의 시련', element: '금' },
  '도화살': { name: '유혹의 꽃길', desc: '매력과 인연이 가져오는 시련', element: '화' },
  '화개살': { name: '고독의 현자', desc: '깊은 사유와 외로움의 시련', element: '토' },
  '역마살': { name: '떠도는 바람', desc: '끊임없는 변화와 불안정의 시련', element: '목' },
};

const DEFAULT_SINSAL_TRIAL: { name: string; desc: string; element: Element } = {
  name: '미궁의 시련', desc: '삶의 근본적 물음을 마주하는 시련', element: '토',
};

/** 2층: 기신 시련 생성 */
export function createFloor2Trial(saju: SajuResult): Trial {
  const { gishin } = determineYongshin(saju);
  const template = GISHIN_TEMPLATES[gishin];
  return { ...template, element: gishin, type: 'gishin', floor: 2 };
}

/** 3층: 오행 불균형 시련 생성 */
export function createFloor3Trial(saju: SajuResult): Trial {
  const dominant = saju.fiveElements.dominant as string;
  const element = KEY_TO_ELEMENT[dominant] || '토';
  const template = IMBALANCE_TEMPLATES[element];
  return { ...template, element, type: 'imbalance', floor: 3 };
}

/** 4층: 세운 충/형 시련 생성 */
export function createFloor4Trial(saju: SajuResult): Trial {
  const yearlyPillar = saju.yearlyLuck?.pillar;
  const year = saju.yearlyLuck?.year || new Date().getFullYear();

  if (yearlyPillar) {
    const stemChar = yearlyPillar.ganjiKorean[0];
    // 세운 천간의 오행을 시련 오행으로
    const stemElements: Record<string, Element> = {
      '갑': '목', '을': '목', '병': '화', '정': '화', '무': '토',
      '기': '토', '경': '금', '신': '금', '임': '수', '계': '수',
    };
    const element = stemElements[stemChar] || '토';
    return {
      name: CLASH_TEMPLATE.name(year, element),
      desc: CLASH_TEMPLATE.desc(element),
      element,
      type: 'clash',
      floor: 4,
    };
  }

  return { name: `${year}년의 시련`, desc: '시간의 흐름이 가져오는 변화의 시련', element: '토', type: 'clash', floor: 4 };
}

/** 5층: 흉살/공망 시련 생성 */
export function createFloor5Trial(saju: SajuResult): Trial {
  // 공망 우선
  if (saju.gongmang && saju.gongmang.branches.length > 0) {
    return { ...SINSAL_TEMPLATES['공망'], type: 'sinsal', floor: 5 };
  }

  // 신살 중 매핑 테이블에 있는 것 찾기
  if (saju.sinsals && saju.sinsals.length > 0) {
    for (const sinsal of saju.sinsals) {
      const template = SINSAL_TEMPLATES[sinsal.name];
      if (template) {
        return { ...template, type: 'sinsal', floor: 5 };
      }
    }
  }

  return { ...DEFAULT_SINSAL_TRIAL, type: 'sinsal', floor: 5 };
}

/** 층 번호로 시련 생성 */
export function createTrialForFloor(floor: number, saju: SajuResult): Trial {
  switch (floor) {
    case 2: return createFloor2Trial(saju);
    case 3: return createFloor3Trial(saju);
    case 4: return createFloor4Trial(saju);
    case 5: return createFloor5Trial(saju);
    default: throw new Error(`No trial for floor ${floor}`);
  }
}
```

- [ ] **Step 2: 빌드 확인 + 커밋**

```bash
npm run build
git add src/lib/game/trials.ts
git commit -m "feat: add trial generation from saju risk factors"
```

---

## Task 5: 층 정의 + 시련/선택 UI 라인 생성

**Files:**
- Create: `src/lib/game/floors.ts`
- Create: `src/components/game/TrialScene.ts`
- Create: `src/components/game/CardReveal.ts`
- Create: `src/components/game/EndingReport.ts`

- [ ] **Step 1: floors.ts — 5개 층 정의**

```typescript
// src/lib/game/floors.ts
import { type FloorDef } from './types';

export const FLOORS: FloorDef[] = [
  {
    id: 1,
    name: '운명의 입구',
    theme: '카드 공개 세레모니',
    description: [
      '',
      '═══════════════════════════════',
      '  1층 — 운명의 입구',
      '═══════════════════════════════',
      '',
      '오래된 동굴 깊숙한 곳, 여덟 개의 석판이',
      '희미한 금빛을 내뿜으며 그대를 기다리고 있다.',
      '',
      '현자: "그대의 사주를 이루는 여덟 글자를',
      '하나씩 밝혀보겠노라..."',
      '',
    ],
    hasChoice: false,
  },
  {
    id: 2,
    name: '종합의 방',
    theme: '종합 운세',
    description: [
      '',
      '═══════════════════════════════',
      '  2층 — 종합의 방',
      '═══════════════════════════════',
      '',
      '모든 기운이 하나로 모이는 곳.',
      '다섯 색의 안개가 소용돌이치며',
      '그대의 운명을 비추고 있다.',
      '',
    ],
    hasChoice: true,
  },
  {
    id: 3,
    name: '오행의 시련',
    theme: '상세 분석',
    description: [
      '',
      '═══════════════════════════════',
      '  3층 — 오행의 시련',
      '═══════════════════════════════',
      '',
      '다섯 개의 화로가 각각 다른 빛으로 타오른다.',
      '그 중 하나의 불꽃이 유난히 크게 일렁이며',
      '그대에게 시련을 내린다.',
      '',
    ],
    hasChoice: true,
  },
  {
    id: 4,
    name: '시간의 회랑',
    theme: '대운/세운',
    description: [
      '',
      '═══════════════════════════════',
      '  4층 — 시간의 회랑',
      '═══════════════════════════════',
      '',
      '긴 회랑에 시간의 강이 흐르고 있다.',
      '과거와 미래가 교차하는 이곳에서',
      '올해의 기운이 그대를 시험한다.',
      '',
    ],
    hasChoice: true,
  },
  {
    id: 5,
    name: '심연의 거울',
    theme: '궁합/공망',
    description: [
      '',
      '═══════════════════════════════',
      '  5층 — 심연의 거울',
      '═══════════════════════════════',
      '',
      '동굴 가장 깊은 곳, 거대한 거울이',
      '그대의 참모습을 비추고 있다.',
      '가장 깊은 시련이 여기서 기다린다.',
      '',
    ],
    hasChoice: true,
  },
];

export function getFloor(id: number): FloorDef | undefined {
  return FLOORS.find(f => f.id === id);
}
```

- [ ] **Step 2: TrialScene.ts — 시련 등장 + 카드 선택 UI**

```typescript
// src/components/game/TrialScene.ts
import { type Trial, type Card } from '@/lib/game/types';
import { renderCardPair } from './CardDisplay';

/** 시련 등장 텍스트 생성 */
export function generateTrialIntro(trial: Trial): string[] {
  return [
    '',
    `  ◆ 시련: "${trial.name}"`,
    `  ${trial.desc}`,
    '',
    `현자: "그대의 사주에서 ${trial.element}(${trial.element})의`,
    '시련이 나타났도다..."',
    '',
  ];
}

/** 카드 선택 UI 생성 */
export function generateChoiceUI(
  cardA: Card,
  cardB: Card,
  compact: boolean = false,
): string[] {
  const lines: string[] = [];
  lines.push('─── 길을 선택하시오 ───');
  lines.push('');

  const cardLines = renderCardPair(cardA, cardB, compact);
  lines.push(...cardLines);

  lines.push('');
  lines.push(`  [1] ${cardA.hanja}${cardA.hangul} — ${cardA.description || ''}`);
  lines.push(`  [2] ${cardB.hanja}${cardB.hangul} — ${cardB.description || ''}`);
  lines.push('');

  return lines;
}

/** 카드 선택 결과 텍스트 */
export function generateChoiceResult(card: Card): string[] {
  return [
    '',
    `  ✦ "${card.keyword}" 카드를 선택하셨습니다.`,
    `  ${card.hanja}${card.hangul}(${card.element})의 관점으로 풀이합니다...`,
    '',
  ];
}
```

- [ ] **Step 3: CardReveal.ts — 1층 카드 공개 세레모니**

```typescript
// src/components/game/CardReveal.ts
import { type Card } from '@/lib/game/types';
import { renderCardDesktop, renderCardMobile } from './CardDisplay';

const SOURCE_LABELS: Record<string, string> = {
  year: '년주', month: '월주', day: '일주', hour: '시주',
};

const TYPE_LABELS: Record<string, string> = {
  stem: '천간', branch: '지지',
};

/** 카드 한 장 공개 텍스트 생성 */
export function generateCardRevealLines(
  card: Card,
  index: number,
  compact: boolean = false,
): string[] {
  const label = `${SOURCE_LABELS[card.source]} ${TYPE_LABELS[card.type]}`;
  const lines: string[] = [];

  lines.push('');
  lines.push(`  ── ${index + 1}번째 석판: ${label} ──`);
  lines.push('');

  const cardLines = compact ? renderCardMobile(card) : renderCardDesktop(card);
  lines.push(...cardLines.map(l => '  ' + l));

  return lines;
}

/** 모든 카드 공개 완료 텍스트 */
export function generateDeckCompleteLines(): string[] {
  return [
    '',
    '═══════════════════════════════',
    '  ✦ 그대의 운명 카드가 모두 밝혀졌도다.',
    '  이제 시련의 길을 걸을 준비가 되었느니라.',
    '═══════════════════════════════',
    '',
    '  (Enter를 눌러 다음 층으로)',
    '',
  ];
}
```

- [ ] **Step 4: EndingReport.ts — 엔딩 리포트**

```typescript
// src/components/game/EndingReport.ts
import { type ChoiceRecord } from '@/lib/game/types';
import { getFloor } from '@/lib/game/floors';

export function generateEndingReport(
  name: string,
  choices: ChoiceRecord[],
): string[] {
  const activeCount = choices.filter(c => c.approach === 'active').length;
  const receptiveCount = choices.filter(c => c.approach === 'receptive').length;

  const lines: string[] = [
    '',
    '══════════════════════════════════',
    `  ✦ 여정 완료 — ${name}의 사주 이야기`,
    '══════════════════════════════════',
    '',
    '▸ 선택의 기록',
  ];

  for (const choice of choices) {
    const floor = getFloor(choice.floor);
    const floorName = floor ? floor.name : `${choice.floor}층`;
    lines.push(`  ${floorName}: ${choice.chosenCard.hanja}${choice.chosenCard.hangul} (${choice.keyword}) 선택`);
  }

  lines.push('');
  lines.push('▸ 그대의 성향');
  lines.push(`  능동적 선택 ${activeCount}회 / 수용적 선택 ${receptiveCount}회`);

  if (activeCount > receptiveCount) {
    lines.push('  → "행동파 기질이 강한 사주로다"');
  } else if (receptiveCount > activeCount) {
    lines.push('  → "깊은 사유를 가진 신중한 사주로다"');
  } else {
    lines.push('  → "균형 잡힌 중용의 사주로다"');
  }

  lines.push('');
  lines.push('▸ 종합 풀이');

  return lines;
}

/** 엔딩 하단 메뉴 */
export function generateEndingMenu(): string[] {
  return [
    '',
    '──────────────────────────────────',
    '  [다시] 처음부터  [내보내기] 저장',
    '  [1~5] 층 재방문',
    '──────────────────────────────────',
    '',
  ];
}
```

- [ ] **Step 5: 빌드 확인 + 커밋**

```bash
npm run build
git add src/lib/game/floors.ts src/components/game/TrialScene.ts src/components/game/CardReveal.ts src/components/game/EndingReport.ts
git commit -m "feat: add floor definitions, trial scene, card reveal, and ending report"
```

---

## Task 6: AI 프롬프트 확장

**Files:**
- Create: `src/lib/game/prompts.ts`
- Modify: `src/app/api/interpret/route.ts`

- [ ] **Step 1: game/prompts.ts — 층별 + 선택별 프롬프트**

```typescript
// src/lib/game/prompts.ts
import { type SajuResult } from '@/lib/saju/types';
import { type Trial, type Card, type ChoiceRecord } from './types';
import { getRoomPrompt } from '@/lib/ai/prompts';

/** 층 번호 → 기존 roomId 매핑 (기존 프롬프트 재활용) */
const FLOOR_TO_ROOM: Record<number, string> = {
  2: 'synthesis',
  3: 'detail',
  4: 'luck',
  5: 'synthesis', // 5층은 종합+궁합 혼합이므로 synthesis 기반
};

/** 층별 AI 풀이 프롬프트 생성 */
export function getFloorPrompt(
  floor: number,
  saju: SajuResult,
  trial: Trial,
  chosenCard: Card,
): string {
  const roomId = FLOOR_TO_ROOM[floor] || 'synthesis';
  const basePrompt = getRoomPrompt(roomId, saju);

  const perspective = chosenCard.approach === 'active'
    ? `사용자가 "${chosenCard.keyword}" 카드를 선택했습니다.
이 시련에 대해 적극적이고 능동적인 관점에서 풀이해주세요.
도전, 극복, 행동의 관점에서 조언하되 무모함의 위험도 함께 언급하세요.`
    : `사용자가 "${chosenCard.keyword}" 카드를 선택했습니다.
이 시련에 대해 수용적이고 유연한 관점에서 풀이해주세요.
기다림, 흐름, 이해의 관점에서 조언하되 수동성의 위험도 함께 언급하세요.`;

  return `${basePrompt}

[게임 컨텍스트]
현재 시련: ${trial.name} (${trial.element}기운)
시련 설명: ${trial.desc}
선택된 카드: ${chosenCard.hanja}${chosenCard.hangul} (${chosenCard.element})

${perspective}`;
}

/** 카드 공개 내레이션 프롬프트 (1층, 카드 한 장당) */
export function getCardNarrationPrompt(
  card: Card,
  position: string,
): string {
  return `사주 원국의 ${position}(${card.hanja}${card.hangul}, ${card.element})을 짧게 소개합니다.
2-3문장으로, 이 글자가 가진 기운과 성격을 비유적으로 설명하세요.
예: "갑목(甲木)이로다. 하늘을 향해 곧게 뻗는 큰 나무의 기운이니, 그대 안에 꺾이지 않는 의지가 깃들어 있구나."
형식: 현자가 말하는 이야기체. 존칭 사용. 마크다운/이모지 금지.`;
}

/** 엔딩 종합 프롬프트 */
export function getEndingPrompt(
  saju: SajuResult,
  choices: ChoiceRecord[],
): string {
  const basePrompt = getRoomPrompt('synthesis', saju);
  const activeCount = choices.filter(c => c.approach === 'active').length;
  const receptiveCount = choices.filter(c => c.approach === 'receptive').length;

  const choiceLog = choices
    .map(c => `- ${c.floor}층 ${c.trialName}: ${c.keyword} (${c.approach === 'active' ? '능동' : '수용'}) 선택`)
    .join('\n');

  return `${basePrompt}

[엔딩 종합 풀이]
사용자의 4회 선택 기록:
${choiceLog}

능동적 선택 ${activeCount}회, 수용적 선택 ${receptiveCount}회

이 선택 패턴이 이 사람의 사주 원국과 어떻게 연결되는지,
그리고 전체 여정을 통해 드러난 사주의 특성을 종합하여
이야기체로 풀이해주세요.
사주의 강점, 주의할 점, 그리고 앞으로의 조언을 담아주세요.`;
}
```

- [ ] **Step 2: route.ts 수정 — 요청 body에 게임 컨텍스트 지원**

`src/app/api/interpret/route.ts`에서 POST 핸들러의 request body 파싱 부분을 수정. 기존 `roomId` 기반 프롬프트 생성에 `floorPrompt` 직접 전달 옵션 추가:

```typescript
// route.ts의 POST handler 내부에서:
// 기존: const { roomId, sajuResult, partnerSajuResult } = await req.json();
// 변경: floorPrompt가 있으면 그것을 user prompt로 사용
const body = await req.json();
const { roomId, sajuResult, partnerSajuResult, floorPrompt } = body;

// user prompt 결정
const userPrompt = floorPrompt || getRoomPrompt(roomId, sajuResult, partnerSajuResult);
```

이렇게 하면 기존 roomId 기반 동작도 유지되면서, 게임에서는 `floorPrompt`를 직접 전달하여 시련+선택 컨텍스트가 포함된 프롬프트를 사용할 수 있다.

**`useStreaming.ts` 수정도 필요:**
`streamInterpretation`의 시그니처에 `floorPrompt?: string` 파라미터 추가:
```typescript
// 기존: async (roomId, sajuResult, onChunk, onComplete, onError, partnerSajuResult?)
// 변경: async (roomId, sajuResult, onChunk, onComplete, onError, partnerSajuResult?, floorPrompt?)
```
fetch body에 `floorPrompt` 포함:
```typescript
body: JSON.stringify({ roomId, sajuResult, partnerSajuResult, floorPrompt })
```

- [ ] **Step 3: 빌드 확인 + 커밋**

```bash
npm run build
git add src/lib/game/prompts.ts src/app/api/interpret/route.ts
git commit -m "feat: add floor-based AI prompts with trial/choice context"
```

---

## Task 7: 상태머신 확장 (useGame.ts 핵심 수정)

**Files:**
- Modify: `src/hooks/useGame.ts`
- Modify: `src/lib/mud/commandParser.ts`
- Delete: `src/lib/mud/rooms.ts` (floors.ts로 대체)
- Delete: `src/lib/mud/engine.ts` (useGame에 통합)

이것이 가장 큰 수정. useGame.ts의 상태머신을 게임 흐름으로 전면 교체한다.

- [ ] **Step 1: commandParser.ts 수정 — 게임 명령어 지원**

기존 `parseCommand`를 게임용으로 확장:

```typescript
// src/lib/mud/commandParser.ts
export type GameCommandType =
  | { type: 'choice'; value: 1 | 2 }
  | { type: 'next' }           // Enter / 다음
  | { type: 'help' }
  | { type: 'restart' }
  | { type: 'export' }
  | { type: 'floor'; value: number }  // 층 재방문
  | { type: 'unknown'; input: string };

/**
 * 게임 명령어 파서.
 * phase를 받아서 context-aware하게 파싱:
 * - 'choice' phase에서는 1/2 → 카드 선택
 * - 'hub' phase에서는 1-5 → 층 재방문
 * - 그 외에서는 1/2 → 숫자 입력으로만 해석
 */
export function parseGameCommand(input: string, phase?: string): GameCommandType {
  const trimmed = input.trim().toLowerCase();

  // 다음 층 (Enter/빈 입력)
  if (trimmed === '' || trimmed === '다음' || trimmed === 'next') return { type: 'next' };

  // 도움
  if (['도움', 'help', '?'].includes(trimmed)) return { type: 'help' };

  // 재시작
  if (['다시', '처음', '새로', 'restart'].includes(trimmed)) return { type: 'restart' };

  // 내보내기
  if (['내보내기', 'export'].includes(trimmed)) return { type: 'export' };

  // 숫자 입력 — phase에 따라 다르게 해석
  const num = parseInt(trimmed);
  if (!isNaN(num)) {
    // choice phase에서는 1/2 → 카드 선택
    if (phase === 'choice' && (num === 1 || num === 2)) {
      return { type: 'choice', value: num };
    }
    // hub phase에서는 1-5 → 층 재방문
    if (phase === 'hub' && num >= 1 && num <= 5) {
      return { type: 'floor', value: num };
    }
    // 그 외에서 1-5 → 층 재방문 (범용)
    if (num >= 1 && num <= 5) {
      return { type: 'floor', value: num };
    }
  }

  return { type: 'unknown', input };
}
```

- [ ] **Step 2: useGame.ts 수정 — 핵심 상태 추가**

useGame.ts 상단에 새 import 및 state 추가. 기존 코드에서 다음을 변경:

1. **새 import 추가:**
```typescript
import { type Card, type Trial, type ChoiceRecord, type Element } from '@/lib/game/types';
import { createDeckFromSaju, assignChoiceCards } from '@/lib/game/cards';
import { createTrialForFloor } from '@/lib/game/trials';
import { determineYongshin } from '@/lib/game/yongshin';
import { FLOORS, getFloor } from '@/lib/game/floors';
import { getFloorPrompt, getCardNarrationPrompt, getEndingPrompt } from '@/lib/game/prompts';
import { generateCardRevealLines, generateDeckCompleteLines } from '@/components/game/CardReveal';
import { generateTrialIntro, generateChoiceUI, generateChoiceResult } from '@/components/game/TrialScene';
import { generateEndingReport, generateEndingMenu } from '@/components/game/EndingReport';
import { parseGameCommand } from '@/lib/mud/commandParser';
```

2. **GamePhase 타입 확장:**
```typescript
// 기존 phase들 유지 + 새 phase 추가
type GamePhase =
  | 'intro' | 'name' | 'date' | 'calendar' | 'time' | 'gender' | 'marriage'
  | 'card_reveal'     // 1층: 카드 순차 공개
  | 'floor_intro'     // 2~5층: 층 진입 + 시련
  | 'choice'          // 카드 선택 대기
  | 'interpretation'  // AI 풀이 스트리밍 중
  | 'floor_complete'  // 다음 층 대기
  | 'ending'          // 엔딩 리포트 + AI 종합 풀이
  | 'hub';            // 완료 후 재방문 허브
```

3. **새 상태 ref 추가:**
```typescript
const deckRef = useRef<Card[]>([]);
const currentFloorRef = useRef<number>(1);
const currentTrialRef = useRef<Trial | null>(null);
const choiceCardsRef = useRef<[Card, Card] | null>(null);
const choicesRef = useRef<ChoiceRecord[]>([]);
const completedFloorsRef = useRef<number[]>([]);
const yongshinRef = useRef<Element>('목');
const gishinRef = useRef<Element>('토');
const cardRevealIndexRef = useRef<number>(0);
```

4. **`calculateAndStart()` 수정:**
기존 `calculateAndStart()` 함수 안에서 `moveToRoom('synthesis')` 대신:

```typescript
// 사주 계산 후 카드 덱 생성
const deck = createDeckFromSaju(sajuResult);
deckRef.current = deck;
const { yongshin, gishin } = determineYongshin(sajuResult);
yongshinRef.current = yongshin;
gishinRef.current = gishin;

// 1층 진입
currentFloorRef.current = 1;
cardRevealIndexRef.current = 0;
const floor = getFloor(1)!;
addLines(floor.description, 'system');
// 사주표 표시 (기존 PillarDisplay 재활용)
// ... generatePillarLines 호출 ...

// 첫 카드 공개
const firstCard = deck[0];
const revealLines = generateCardRevealLines(firstCard, 0, isMobile);
addLines(revealLines, 'text');

setPhase('card_reveal');
// AI 카드 내레이션 스트리밍 시작
streamCardNarration(firstCard, 0);
```

5. **새 phase 핸들러 함수들:**

```typescript
/** 카드 내레이션 스트리밍 */
const streamCardNarration = (card: Card, index: number) => {
  const position = `${['년주','월주','일주','시주'][Math.floor(index/2)]} ${index % 2 === 0 ? '천간' : '지지'}`;
  const prompt = getCardNarrationPrompt(card, position);

  const lineId = addLine('', 'streaming');
  streamInterpretation(
    'card_narration', // roomId (서버에서 무시됨, floorPrompt 사용)
    sajuRef.current!,
    (chunk: string) => appendToLine(lineId, chunk),
    () => {
      // 내레이션 완료 — 다음 카드 대기 상태 유지 (card_reveal phase)
      addLine('', 'text');
      addLine('  (Enter를 눌러 다음 카드 공개)', 'system', { color: 'text-[#8A6618]' });
    },
    (error: string) => addLine(`오류: ${error}`, 'error'),
    null, // partnerSajuResult
    prompt, // floorPrompt — route.ts에서 이것을 user prompt로 사용
  );
};

/** 층 진입 */
const enterFloor = (floorNum: number) => {
  currentFloorRef.current = floorNum;
  const floor = getFloor(floorNum)!;
  clear();
  addLines(floor.description, 'system');

  if (!floor.hasChoice) {
    // 1층은 카드 공개로
    return;
  }

  // 시련 생성
  const trial = createTrialForFloor(floorNum, sajuRef.current!);
  currentTrialRef.current = trial;
  addLines(generateTrialIntro(trial), 'text');

  // 선택지 카드 배정
  const [cardA, cardB] = assignChoiceCards(trial, deckRef.current, floorNum);
  choiceCardsRef.current = [cardA, cardB];
  addLines(generateChoiceUI(cardA, cardB, isMobile), 'text');

  setPhase('choice');
};

/** 엔딩 리포트 표시 */
const showEnding = () => {
  clear();
  const name = birthInfoRef.current?.name || '그대';
  const reportLines = generateEndingReport(name, choicesRef.current);
  addLines(reportLines, 'text');

  // AI 종합 풀이 스트리밍
  const prompt = getEndingPrompt(sajuRef.current!, choicesRef.current);
  const lineId = addLine('', 'streaming');
  streamInterpretation(
    'ending',
    sajuRef.current!,
    (chunk: string) => appendToLine(lineId, chunk),
    () => {
      addLine('', 'text');
      addLines(generateEndingMenu(), 'system');
      setPhase('hub');
    },
    (error: string) => addLine(`오류: ${error}`, 'error'),
    null,
    prompt,
  );

  setPhase('ending');
};
```

6. **handleCommand에 새 phase 분기 추가:**

```typescript
// handleCommand 내부, phase별 분기에 추가:

case 'card_reveal': {
  // Enter → 다음 카드 또는 2층 진입
  const cmd = parseGameCommand(input, phase);
  if (cmd.type === 'next') {
    const nextIndex = cardRevealIndexRef.current + 1;
    if (nextIndex < deckRef.current.length) {
      cardRevealIndexRef.current = nextIndex;
      const card = deckRef.current[nextIndex];
      addLines(generateCardRevealLines(card, nextIndex, isMobile), 'text');
      streamCardNarration(card, nextIndex);
    } else {
      addLines(generateDeckCompleteLines(), 'system');
      enterFloor(2);
    }
  }
  break;
}

case 'choice': {
  const cmd = parseGameCommand(input, phase);
  if (cmd.type === 'choice') {
    const chosen = choiceCardsRef.current![cmd.value - 1];
    addLines(generateChoiceResult(chosen), 'system');

    // 선택 기록
    const trial = currentTrialRef.current!;
    choicesRef.current.push({
      floor: currentFloorRef.current,
      trialName: trial.name,
      trialElement: trial.element,
      chosenCard: { hanja: chosen.hanja, hangul: chosen.hangul, element: chosen.element },
      approach: chosen.approach!,
      keyword: chosen.keyword!,
    });

    // AI 풀이 시작
    const prompt = getFloorPrompt(currentFloorRef.current, sajuRef.current!, trial, chosen);
    setPhase('interpretation');
    const lineId = addLine('', 'streaming');
    streamInterpretation(
      `floor_${currentFloorRef.current}`,
      sajuRef.current!,
      (chunk: string) => appendToLine(lineId, chunk),
      () => {
        // 풀이 완료 → floor_complete
        aiCacheRef.current[`floor_${currentFloorRef.current}`] = ''; // 캐시 갱신은 streaming hook이 처리
        addLine('', 'text');
        addLine('  (Enter를 눌러 다음 층으로)', 'system', { color: 'text-[#8A6618]' });
        setPhase('floor_complete');
      },
      (error: string) => addLine(`오류: ${error}`, 'error'),
      null,
      prompt, // floorPrompt
    );
  }
  break;
}

case 'floor_complete': {
  const cmd = parseGameCommand(input, phase);
  if (cmd.type === 'next') {
    completedFloorsRef.current.push(currentFloorRef.current);
    const nextFloor = currentFloorRef.current + 1;
    if (nextFloor <= 5) {
      enterFloor(nextFloor);
    } else {
      showEnding();
    }
  }
  break;
}

case 'ending': {
  const cmd = parseGameCommand(input, phase);
  if (cmd.type === 'next') {
    setPhase('hub');
    addLines(generateEndingMenu(), 'system');
  }
  break;
}

case 'hub': {
  const cmd = parseGameCommand(input, phase);
  if (cmd.type === 'restart') {
    startGame();
  } else if (cmd.type === 'floor' && completedFloorsRef.current.includes(cmd.value)) {
    enterFloor(cmd.value);
  } else if (cmd.type === 'export') {
    exportAll();
  }
  break;
}
```

- [ ] **Step 3: rooms.ts, engine.ts 삭제 + import 정리**

```bash
rm src/lib/mud/rooms.ts src/lib/mud/engine.ts
```

**반드시 수정해야 할 import:**
- `src/hooks/useGame.ts`: `import { enterRoom, executeCommand } from '@/lib/mud/engine'` 제거
- `src/hooks/useGame.ts`: `import { rooms, RoomId } from '@/lib/mud/rooms'` 제거
- `src/hooks/useGame.ts`: `import { GamePhase } from '@/lib/mud/types'` 제거 → 로컬 GamePhase 타입 사용
- `src/lib/mud/types.ts`에서 `RoomId` 타입 export는 유지 가능 (commandParser가 참조할 수 있음) 또는 불필요하면 삭제

**`src/lib/mud/types.ts`** 자체는 유지하되, rooms/engine 관련 타입만 제거. `OutputLine` 등 터미널 관련 타입은 여전히 사용됨.

- [ ] **Step 4: 빌드 확인 + 수정**

```bash
npm run build
```

빌드 에러 발생 시 import 경로, 미사용 변수 등 수정.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: replace MUD room system with dungeon floor state machine"
```

---

## Task 8: page.tsx 수정 + 던전맵 교체

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: DungeonMap을 층 진행도로 교체**

기존 `<DungeonMap>` 컴포넌트를 제거하고, 현재 층 진행도를 표시하는 간단한 인디케이터로 교체:

```typescript
// page.tsx 내에서 DungeonMap 대신:
function FloorIndicator({ currentFloor, completedFloors }: {
  currentFloor: number;
  completedFloors: number[];
}) {
  return (
    <div className="hidden md:block fixed bottom-4 left-4 text-xs font-mono text-[#8A6618] opacity-70">
      {[1, 2, 3, 4, 5].map(f => {
        const isCurrent = f === currentFloor;
        const isCompleted = completedFloors.includes(f);
        const marker = isCurrent ? '▶' : isCompleted ? '✦' : '○';
        return (
          <div key={f} className={isCurrent ? 'text-[#D4A020]' : ''}>
            {marker} {f}층
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: 내보내기에 선택 기록 포함**

기존 `exportAll()` 함수를 수정하여 선택 기록(choices)을 포함:

```typescript
// 기존 export 텍스트에 추가:
const choiceText = choices.map(c =>
  `${c.floor}층 ${c.trialName}: ${c.chosenCard.hanja}${c.chosenCard.hangul} (${c.keyword}) 선택`
).join('\n');

// 내보내기 텍스트 구성에 포함
```

- [ ] **Step 3: 빌드 확인 + 커밋**

```bash
npm run build
git add src/app/page.tsx
git commit -m "feat: replace dungeon map with floor indicator, add choices to export"
```

---

## Task 9: localStorage 저장/불러오기

**Files:**
- Create: `src/lib/game/storage.ts`
- Modify: `src/hooks/useGame.ts` (저장/불러오기 통합)

- [ ] **Step 1: storage.ts 작성**

```typescript
// src/lib/game/storage.ts
import { type GameSave } from './types';

const STORAGE_KEY = 'saju-game-save';
const CURRENT_VERSION = 1;

export function saveGame(data: GameSave): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, version: CURRENT_VERSION }));
  } catch {
    console.warn('Failed to save game to localStorage');
  }
}

export function loadGame(): GameSave | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as GameSave;
    if (data.version !== CURRENT_VERSION) return null; // 버전 불일치 시 무시
    return data;
  } catch {
    return null;
  }
}

export function clearGame(): void {
  localStorage.removeItem(STORAGE_KEY);
}
```

- [ ] **Step 2: useGame.ts에 저장/불러오기 통합**

- 각 층 완료 시 `saveGame()` 호출
- `startGame()` 시 `loadGame()` 체크 → 기존 세이브가 있으면 "이어하기" 제안
- "다시" 명령 시 `clearGame()` 호출

- [ ] **Step 3: 빌드 확인 + 커밋**

```bash
npm run build
git add src/lib/game/storage.ts src/hooks/useGame.ts
git commit -m "feat: add localStorage save/load for game progress"
```

---

## Task 10: 통합 테스트 + 폴리싱

- [ ] **Step 1: dev 서버 시작 + 전체 흐름 테스트**

```bash
npm run dev
```

브라우저에서 전체 흐름 테스트:
1. 사주 입력 → 카드 공개 세레모니 (8장)
2. 2층: 기신 시련 → 카드 선택 → AI 풀이
3. 3층: 오행 시련 → 카드 선택 → AI 풀이
4. 4층: 세운 시련 → 카드 선택 → AI 풀이
5. 5층: 흉살 시련 → 카드 선택 → AI 풀이
6. 엔딩 리포트 → AI 종합 풀이
7. 허브: 층 재방문 + 내보내기

- [ ] **Step 2: 모바일 테스트**

DevTools에서 모바일 뷰포트로 전환 후:
- 카드 2장 나란히 레이아웃 확인
- 선택 UI 가독성 확인

- [ ] **Step 3: 엣지 케이스 테스트**

- 시간 "모름"인 사주 (hourPillar === null) → 6장 덱
- API 키 없는 환경 → 템플릿 풀이 폴백
- 재방문 시 localStorage 로드

- [ ] **Step 4: 최종 빌드 확인**

```bash
npm run build
npm run lint
```

- [ ] **Step 5: 최종 커밋**

```bash
git add -A
git commit -m "feat: complete saju dungeon crawler with choice/branching story"
```

---

## Verification Checklist

| 항목 | 확인 방법 |
|------|----------|
| 카드 생성 | 사주 입력 → 8장 카드 올바른 오행/음양 |
| 용신/기신 | 신강 사주 → 극하는 오행이 용신 |
| 시련 생성 | 2층 기신, 3층 오행불균형, 4층 세운, 5층 흉살 |
| 선택지 배정 | 능동(극)/ 수용(상생) 카드 정확히 2장 |
| AI 풀이 관점 | 같은 사주, 다른 카드 → 다른 톤 |
| 엔딩 | 4회 선택 패턴 → 성향 분석 + AI 종합 |
| 모바일 | 카드 2장 나란히 표시 깨짐 없음 |
| 저장/복원 | 재방문 시 진행 데이터 유지 |
| 빌드 | `npm run build` 에러 없음 |
