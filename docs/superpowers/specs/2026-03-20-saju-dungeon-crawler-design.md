# 사주 던전 크롤러 — 설계 문서

> 사주명리의 미궁을 카드 기반 선택/분기 스토리 던전으로 확장하는 설계

## 1. 개요

### 목적
현재 MUD 스타일 사주풀이 앱을 **카드 공개형 스토리텔링 + 선택/분기 던전**으로 전환한다. 각 층에서 사주의 시련을 마주하고, 카드를 선택하여 **어떤 관점으로 풀이를 받을지** 결정한다. 전투가 아닌 **선택과 해석**이 핵심이다.

### 타겟 사용자
사주에 관심 있는 MZ세대 (20-30대). 가벼운 운세/성격 테스트를 좋아하고, 게임적 재미와 반복 방문 동기를 원하는 사용자.

### 핵심 원칙
- **사주 풀이가 주인공** — 게임은 풀이를 전달하는 연출
- **내 사주의 위험 요소가 시련** — 기신, 흉살, 상극 오행이 시련으로 등장
- **선택이 관점을 결정** — 정답/오답 없음, 카드 선택에 따라 AI가 다른 관점으로 풀이
- **CRT 터미널 미학 유지** — ASCII 카드 아트, 기존 레트로 분위기 보존
- **서버리스** — 모든 게임 상태 localStorage, DB 불필요

---

## 2. 게임 구조

### 2.1 메인 플레이 (1회성 딥 플레이)

```
[사주 입력] → [카드 공개 세레모니] → [던전 탐험 4층] → [엔딩 리포트]
```

**카드 공개 세레모니 (1층):** 사주 계산 후, 8장의 카드(4주 × 천간/지지)가 한 장씩 뒤집히며 공개. 각 카드 공개 시 AI 짧은 내레이션(2-3문장).

**던전 탐험 (2~5층):** 4개 층을 순서대로 진행. 각 층에서:
1. 시련(내 사주의 위험 요소) 등장
2. 2장의 카드가 선택지로 제시
3. 카드 선택 → 선택한 카드의 관점으로 AI 풀이

**엔딩 리포트:** 모든 층 완료 후 종합 리포트.

### 2.2 시련과 선택의 의미

**시련** = 내 사주에서 약하거나 위험한 요소 (기신, 흉살, 오행 불균형 등)

**카드 선택** = 그 시련에 대한 **태도/접근법** 선택. 정답 없음.

예시:
- 재물운의 시련 앞에서 → "甲木 (돌파)" vs "壬水 (흐름)"
- 돌파를 선택하면: "적극적으로 도전하는 관점"에서 AI 풀이
- 흐름을 선택하면: "유연하게 기다리는 관점"에서 AI 풀이

둘 다 같은 사주 분석을 전달하지만, **조언의 방향이 달라진다.**

### 2.3 엔딩 리포트

모든 층 완료 후 표시:

```
══════════════════════════════════
  ✦ 여정 완료 — {이름}의 사주 이야기
══════════════════════════════════

▸ 선택의 기록
  2층 종합의 방: 甲木 (돌파) 선택
  3층 오행 시련: 壬水 (흐름) 선택
  4층 시간 회랑: 丁火 (열정) 선택
  5층 심연 거울: 庚金 (절제) 선택

▸ 그대의 성향
  도전적 선택 3회 / 신중한 선택 1회
  → "행동파 기질이 강한 사주로다"

▸ 종합 풀이
  [AI 종합 풀이 — 선택 패턴을 반영한 최종 해석]

──────────────────────────────────
[다시 시작] [내보내기]
```

- AI 종합 풀이: 4회의 선택 패턴(도전형/신중형)을 프롬프트에 포함하여 성향 + 종합 사주 해석
- 내보내기: 현재와 동일한 `.txt` 내보내기 + 선택 기록 포함

### 2.4 리텐션 시스템 (후속 작업)

> 1차 구현 범위에서 제외. 메인 스토리 완성 후 별도 작업으로 추가.

향후 추가 예정:
- 일일 운세 (일진 기반 매일 새로운 시련 + 카드 선택)
- 방문 스트릭, 60간지 컬렉션
- 레벨/칭호 시스템

---

## 3. 던전 층 구조

```
╭──────────────────────────────────╮
│         사주명리의 미궁           │
│                                  │
│  [1층] 운명의 입구 — 카드 공개    │
│          ↓                       │
│  [2층] 종합의 방 — 종합 운세      │
│          ↓                       │
│  [3층] 오행의 시련 — 상세 분석    │
│          ↓                       │
│  [4층] 시간의 회랑 — 대운/세운    │
│          ↓                       │
│  [5층] 심연의 거울 — 궁합/공망    │
╰──────────────────────────────────╯
```

### 층별 상세

| 층 | 테마 | 흐름 유형 | 시련 원리 | AI 풀이 주제 |
|----|------|----------|----------|-------------|
| 1층 | 카드 공개 세레모니 | **비선택** (카드 공개만) | 없음 | 사주 원국 소개, 일간 성격 |
| 2층 | 종합의 방 | **선택** | 기신(忌神) 시련 | 종합 운세, 성격, 적성 |
| 3층 | 오행의 시련 | **선택** | 과다/부족 오행 시련 | 오행 밸런스, 건강, 재물 |
| 4층 | 시간의 회랑 | **선택** | 대운/세운 충(沖)·형(刑) | 시기별 운세, 주의 시기 |
| 5층 | 심연의 거울 | **선택** | 공망 + 흉살 | 깊은 자아 분석, 궁합 |

### 1층 흐름 (카드 공개 세레모니)

```
[1층 진입 → "운명의 입구" 분위기 묘사]
    ↓
[사주표 표시 (현재 PillarDisplay와 동일)]
    ↓
[8장 카드 순차 공개 — 각 카드마다 짧은 AI 내레이션]
  년주 천간 → 년주 지지 → 월주 천간 → ... → 시주 지지
    ↓
["다음 층으로" (Enter)]
```

### 2~5층 흐름 (선택/분기 스토리)

```
[층 진입 → 분위기 묘사]
    ↓
[시련 등장 + 현자가 시련의 의미를 설명]
  "그대의 사주에서 토(土)의 기신이 나타났도다.
   이는 그대의 재물운을 억누르는 힘이니..."
    ↓
[2장 카드 선택지 제시]

  ╭───────────╮  ╭───────────╮
  │ 甲 (갑)   │  │ 壬 (임)   │
  │   木木    │  │   水水    │
  │           │  │           │
  │ "돌파"    │  │ "흐름"    │
  │ 장애를    │  │ 흐름에    │
  │ 극복하라  │  │ 맡겨라    │
  ╰───────────╯  ╰───────────╯

  [1] 甲木 — 적극적으로 돌파하는 관점
  [2] 壬水 — 유연하게 흐름에 맡기는 관점

    ↓
[카드 선택 (1 또는 2 입력)]
    ↓
[선택한 카드의 관점으로 AI 사주 풀이 스트리밍]
  (현재와 동일한 깊이의 풀이, 관점만 다름)
    ↓
["다음 층으로" (Enter) / 완료 후 재방문 가능]
```

### 선택지 카드 생성 규칙

각 층의 시련에 대해, **대비되는 2가지 접근법**을 카드로 제시:

| 시련 유형 | 카드 A (능동적) | 카드 B (수용적) |
|----------|----------------|----------------|
| 기신 시련 | 기신을 극(克)하는 오행 카드 = "돌파/극복" | 기신을 생(生)하여 달래는 오행 카드 = "수용/이해" |
| 오행 불균형 | 부족 오행 카드 = "채우기/보완" | 과다 오행 카드 = "활용/살리기" |
| 세운 충/형 | 충을 해소하는 합(合) 오행 카드 = "조화/화해" | 충을 정면으로 맞는 오행 카드 = "변화/혁신" |
| 흉살/공망 | 흉살을 제어하는 오행 카드 = "통제/절제" | 흉살을 수용하는 오행 카드 = "포용/전환" |

**각 카드에 키워드 부여:**
- 카드 A: "돌파", "보완", "조화", "통제" 등 (능동적 태도)
- 카드 B: "흐름", "활용", "변화", "포용" 등 (수용적 태도)

카드는 플레이어 덱(사주 8장)에서 시련과 관련된 오행을 기반으로 자동 선별.

### 층 탐색 규칙

- **진행:** 선형 (1→2→3→4→5), 첫 플레이 시 순서대로만 진행
- **재방문:** 완료한 층은 재방문 가능 (AI 풀이 캐시에서 표시, 다른 카드로 재선택도 가능)
- **내비게이션:** 완료 후 층 번호 입력으로 이동

---

## 4. 카드 시스템

### 4.1 카드 비주얼 (ASCII)

**데스크톱 (15자 폭):**
```
╭─────────────╮
│ 甲 (갑)     │
│   ━━━━━     │
│    木木      │
│   🌿🌿     │
│             │
│  양(+) 목   │
│  "돌파"     │
│  장애극복   │
╰─────────────╯
```

**모바일 (11자 폭, 카드 2장 나란히 = 22자 + 여백):**
```
╭─────────╮
│甲 (갑)  │
│  木木   │
│양(+) 목 │
│ "돌파"  │
╰─────────╯
```

카드에 표시: 한자, 한글 읽기, 오행 심볼, 음양, **키워드** (태도/접근법), 설명

> ATK/DEF 수치 없음 — 전투가 아니므로 수치 불필요

### 4.2 플레이어 카드 (사주에서 자동 생성)

**기본 카드 (8장):** 4주의 천간 4장 + 지지 4장. 사주 계산 결과에서 자동 생성.

| 카드 출처 | 수량 | 예시 |
|----------|------|------|
| 년주 천간/지지 | 2장 | 庚(경금), 午(오화) |
| 월주 천간/지지 | 2장 | 丁(정화), 亥(해수) |
| 일주 천간/지지 | 2장 | 壬(임수), 辰(진토) |
| 시주 천간/지지 | 2장 | 甲(갑목), 寅(인목) |

### 4.3 카드 속성

각 카드에 부여되는 속성:

```typescript
interface Card {
  id: string;           // 예: "gap-mok" (갑목)
  hanja: string;        // 甲
  hangul: string;       // 갑
  element: Element;     // 목/화/토/금/수
  yinYang: '양' | '음';
  type: 'stem' | 'branch';  // 천간/지지
  source: 'year' | 'month' | 'day' | 'hour';  // 어느 주에서 왔는지

  // 선택지용 속성 (시련 대응 시 동적 부여)
  keyword?: string;     // "돌파", "흐름" 등
  description?: string; // "적극적으로 장애를 극복하는 관점"
  approach?: 'active' | 'receptive';  // 능동적/수용적
}
```

### 4.4 용신/기신 판별 (간이 방식)

> 현재 `SajuResult`에 용신/기신 필드가 없으므로, 기존 데이터에서 간이 판별한다.

```typescript
function determineYongshin(sajuResult: SajuResult): { yongshin: Element, gishin: Element } {
  const { dayMaster, fiveElements } = sajuResult;
  const dayElement = dayMaster.element;

  // 신강/신약 판단 (SajuResult.dayMaster.strength 활용)
  const isStrong = dayMaster.strength === '신강';

  if (isStrong) {
    // 신강 → 일간을 극하는 오행이 용신, 생하는 오행이 기신
    return {
      yongshin: getOvercomingElement(dayElement),
      gishin: getGeneratingElement(dayElement),
    };
  } else {
    // 신약 → 일간을 생하는 오행이 용신, 극하는 오행이 기신
    return {
      yongshin: getGeneratingElement(dayElement),
      gishin: getOvercomingElement(dayElement),
    };
  }
}
```

오행 상생/상극 참조:
- 상생: 목→화→토→금→수→목
- 상극: 목→토, 토→수, 수→화, 화→금, 금→목

### 4.5 시련 시스템

시련 = 내 사주의 위험/약한 요소가 실체화된 것. 전투 상대가 아닌 **마주해야 할 과제**.

#### 시련 생성 알고리즘

**2층 — 기신 시련:**
```typescript
function createGishinTrial(gishin: Element): Trial {
  const templates = {
    목: { name: "뒤틀린 고목의 시련", desc: "성장을 막는 경직된 힘" },
    화: { name: "폭주하는 화염의 시련", desc: "감정과 욕망의 불길" },
    토: { name: "토의 장벽", desc: "변화를 막는 완고한 벽" },
    금: { name: "서리 칼날의 시련", desc: "날카로운 비판과 고독" },
    수: { name: "깊은 심연의 시련", desc: "불안과 두려움의 깊이" },
  };
  return { ...templates[gishin], element: gishin, type: 'gishin' };
}
```

**3층 — 오행 불균형 시련:**
```typescript
// fiveElements.dominant(과다) 오행을 시련으로
// "과다한 화(火) — 열정이 넘쳐 소진되기 쉬운 기운"
```

**4층 — 세운 충/형 시련:**
```typescript
// 올해 세운 간지와 내 사주의 충(沖) 관계 체크
// 충이 있으면 해당 충을 시련으로, 없으면 세운 자체를 시련으로
```

**5층 — 흉살/공망 시련:**
```typescript
// 우선순위: 공망 > 겁살 > 도화살 > 기타 신살
// 공망이 있으면 → "허무의 심연" 시련
```

#### 신살→시련 매핑 테이블

| 신살 | 시련 이름 | 시련 설명 |
|------|----------|----------|
| 공망(空亡) | 허무의 심연 | 비어있음과 헛됨을 마주하는 시련 |
| 겁살(劫殺) | 그림자의 시련 | 예상치 못한 손실과 변동 |
| 도화살(桃花殺) | 유혹의 꽃길 | 매력과 인연이 가져오는 시련 |
| 화개살(華蓋殺) | 고독의 현자 | 깊은 사유와 외로움의 시련 |
| 역마살(驛馬殺) | 떠도는 바람 | 끊임없는 변화와 불안정 |
| 기본 (신살 없음) | 미궁의 시련 | 삶의 근본적 물음 |

### 4.6 선택지 카드 배정 로직

각 층의 시련에 대해 2장의 카드를 배정:

```typescript
function assignChoiceCards(
  trial: Trial,
  deck: Card[],
  floor: number
): [Card, Card] {
  // 1. 시련의 오행과 관계있는 카드 2장 선별
  //    - 카드 A: 시련을 극(克)하는 오행 → 능동적 접근
  //    - 카드 B: 시련과 상생 또는 같은 오행 → 수용적 접근

  const activeCard = deck.find(c =>
    isOvercoming(c.element, trial.element)  // 내 카드가 시련을 극함
  );
  const receptiveCard = deck.find(c =>
    isGenerating(c.element, trial.element) || c.element === trial.element
  );

  // 2. 키워드 동적 부여
  activeCard.keyword = getActiveKeyword(floor);     // "돌파", "보완", "조화", "통제"
  activeCard.approach = 'active';
  receptiveCard.keyword = getReceptiveKeyword(floor); // "흐름", "활용", "변화", "포용"
  receptiveCard.approach = 'receptive';

  return [activeCard, receptiveCard];
}
```

**덱에 적합한 카드가 없는 경우:**
- 8장 중 해당 오행이 없으면, 가장 가까운 상생 관계의 카드를 대신 사용
- 최악의 경우 일간(日干) 카드를 기본 능동 카드로 사용

---

## 5. AI 프롬프트 설계

### 5.1 층별 프롬프트

기존 `getRoomPrompt()` → `getFloorPrompt()` 확장:

```typescript
function getFloorPrompt(
  floor: number,
  trial: Trial,
  chosenCard: Card
): string {
  const basePrompt = existingRoomPrompts[floor]; // 현재 방별 기본 프롬프트

  const perspective = chosenCard.approach === 'active'
    ? `사용자가 "${chosenCard.keyword}" 카드를 선택했습니다.
       이 시련에 대해 적극적이고 능동적인 관점에서 풀이해주세요.
       도전, 극복, 행동의 관점에서 조언하되 무모함의 위험도 함께 언급하세요.`
    : `사용자가 "${chosenCard.keyword}" 카드를 선택했습니다.
       이 시련에 대해 수용적이고 유연한 관점에서 풀이해주세요.
       기다림, 흐름, 이해의 관점에서 조언하되 수동성의 위험도 함께 언급하세요.`;

  return `${basePrompt}

현재 시련: ${trial.name} (${trial.element}기운)
시련 설명: ${trial.desc}
선택된 카드: ${chosenCard.hanja}${chosenCard.hangul} (${chosenCard.element})

${perspective}`;
}
```

### 5.2 엔딩 종합 프롬프트

```
사용자의 4회 선택 기록:
- 2층 기신 시련: ${card.keyword} (${card.approach}) 선택
- 3층 오행 시련: ${card.keyword} (${card.approach}) 선택
- 4층 세운 시련: ${card.keyword} (${card.approach}) 선택
- 5층 공망 시련: ${card.keyword} (${card.approach}) 선택

능동적 선택 ${activeCount}회, 수용적 선택 ${receptiveCount}회

이 선택 패턴이 이 사람의 사주 원국과 어떻게 연결되는지,
그리고 전체 여정을 통해 드러난 사주의 특성을 종합하여
이야기체로 풀이해주세요.
```

### 5.3 카드 공개 내레이션 프롬프트 (1층)

```
사주 원국의 {위치}({hanja}{hangul}, {element})을 짧게 소개합니다.
2-3문장으로, 이 글자가 가진 기운과 성격을 비유적으로 설명하세요.
예: "갑목(甲木)이로다. 하늘을 향해 곧게 뻗는 큰 나무의 기운이니,
그대 안에 꺾이지 않는 의지가 깃들어 있구나."
```

---

## 6. 기술적 설계

### 6.0 프로젝트 셋업

- **새 프로젝트 경로:** `/Users/kwanung/development/experiments/saju-game`
- **기반:** `saju-ful2` 복사 후 수정
- 기존 사주 계산, AI 풀이, 터미널 UI 등을 그대로 가져온 뒤 게임 요소를 추가/수정

### 6.1 현재 코드베이스 활용 (saju-ful2에서 가져오는 것)

| 현재 모듈 | 변경 사항 |
|----------|----------|
| `src/hooks/useGame.ts` | phase 확장 (card_reveal, trial, choice, interpretation, ending) |
| `src/lib/mud/rooms.ts` | → `src/lib/game/floors.ts`로 확장 (방 → 층) |
| `src/lib/mud/commandParser.ts` | 선택 명령어 추가 (1/2 카드 선택) |
| `src/lib/mud/engine.ts` | 층 전환 + 시련/선택 흐름 통합 |
| `src/components/saju/PillarDisplay.tsx` | 유지 (1층 카드 공개 시 활용) |
| `src/app/api/interpret/route.ts` | 시련+선택 컨텍스트를 프롬프트에 추가 |
| `src/lib/ai/prompts.ts` | 층별 + 선택별 프롬프트 확장 |
| `src/lib/saju/calculator.ts` | 기존 유지 (용신/기신은 game 레이어에서 간이 판별) |
| `src/hooks/useTerminal.ts` | 그대로 유지 |
| `src/hooks/useStreaming.ts` | 그대로 유지 |
| `src/components/terminal/` | 그대로 유지 |

### 6.2 새로 추가할 모듈

```
src/lib/game/
  ├── types.ts          # Card, Trial, Choice, GameSave 등 타입
  ├── cards.ts          # 사주→카드 생성, 선택지 카드 배정
  ├── yongshin.ts       # 간이 용신/기신 판별
  ├── trials.ts         # 시련 생성 (기신/흉살/상극 → 시련)
  ├── floors.ts         # 5개 층 정의 + 층별 흐름
  └── storage.ts        # localStorage 저장/불러오기

src/components/game/
  ├── CardDisplay.tsx   # ASCII 카드 렌더링 (데스크톱/모바일 반응형)
  ├── TrialScene.tsx    # 시련 등장 + 카드 선택 UI
  ├── CardReveal.tsx    # 카드 공개 세레모니 (1층)
  └── EndingReport.tsx  # 엔딩 리포트 UI
```

### 6.3 상태머신 확장

현재 phase:
```
intro → name → date → calendar → time → gender → marriage → exploring
```

확장 후:
```
intro → name → date → calendar → time → gender → marriage
  → card_reveal      (1층: 카드 8장 순차 공개)
  → floor_intro      (2~5층: 층 진입 + 시련 등장)
  → choice           (2장 카드 선택 대기)
  → interpretation   (선택한 관점으로 AI 풀이 스트리밍)
  → floor_complete   ("다음 층으로" 대기)
  → ending           (엔딩 리포트 + AI 종합 풀이)
  → hub              (완료 후: 층 재방문 선택)
```

**전환 규칙:**
- `card_reveal` → `floor_intro` (1층 완료, Enter 입력)
- `floor_intro` → `choice` (시련 설명 후 자동)
- `choice` → `interpretation` (카드 1 또는 2 선택)
- `interpretation` → `floor_complete` (AI 풀이 스트리밍 완료)
- `floor_complete` → `floor_intro` (다음 층) 또는 `ending` (5층 완료)
- `ending` → `hub` (리포트 확인 후)
- `hub` → `floor_intro` (층 재방문)

### 6.4 저장 구조 (localStorage)

```typescript
interface GameSave {
  version: number;

  // 기본 정보
  birthInfo: BirthInfo;
  sajuResult: SajuResult;
  yongshin: Element;
  gishin: Element;

  // 메인 플레이 진행
  currentFloor: number;
  deck: Card[];
  completedFloors: number[];
  choices: ChoiceRecord[];  // { floor, trial, chosenCard, approach }

  // AI 풀이 캐시 (최대 5개 층분)
  aiCache: Record<string, string>;
}

interface ChoiceRecord {
  floor: number;
  trialName: string;
  trialElement: Element;
  chosenCard: { hanja: string; hangul: string; element: Element };
  approach: 'active' | 'receptive';
  keyword: string;
}
```

**localStorage 용량 관리:**
- AI 풀이 캐시: 최대 5개 층분만 보관 (~300KB 예상)
- 재방문 시 다른 카드 선택하면 해당 층 캐시 갱신
- 5MB 제한 대비 충분한 여유

---

## 7. 검증 방법

1. **카드 생성:** 사주 입력 → 8장 카드가 올바른 오행/음양으로 생성되는지 확인
2. **용신/기신 판별:** 신강/신약 사주 각각 테스트
3. **시련 생성:** 각 층별 시련이 사주 위험 요소에서 올바르게 생성되는지 확인
4. **선택지 배정:** 시련에 대해 능동/수용 2장 카드가 올바르게 배정되는지 확인
5. **AI 풀이 관점:** 같은 사주로 카드 A/B 각각 선택 시 풀이 톤이 다른지 확인
6. **엔딩 리포트:** 4회 선택 패턴이 종합 풀이에 반영되는지 확인
7. **E2E 흐름:** 사주 입력 → 카드 공개 → 4층 선택 → 엔딩 리포트 전체 흐름
8. **모바일:** 카드 2장 나란히 표시가 모바일에서 깨지지 않는지 확인
9. **재방문:** 완료한 층 재방문 + 다른 카드 선택 시 캐시 갱신 확인

---

## 8. 구현 우선순위

1. **Phase 1:** 게임 타입 정의 + 용신/기신 판별 (`types.ts`, `yongshin.ts`)
2. **Phase 2:** 카드 시스템 + 카드 공개 세레모니 (`cards.ts`, `CardDisplay.tsx`, `CardReveal.tsx`)
3. **Phase 3:** 시련 생성 + 선택지 배정 (`trials.ts`, `TrialScene.tsx`)
4. **Phase 4:** 던전 층 구조 전환 + 상태머신 (`floors.ts`, useGame 확장)
5. **Phase 5:** AI 프롬프트 확장 + 엔딩 리포트 (프롬프트 수정, `EndingReport.tsx`)
6. **Phase 6:** localStorage 저장 + 재방문 (`storage.ts`)
