# Saju Card Pivot Design Spec

## Overview

사주명리의 미궁을 MUD 게임에서 **사주 카드 생성 서비스**로 피벗한다.
폼 입력 → 기본 풀이 → 카드 미리보기/공유 플로우로 전환하되, ASCII/터미널 미학은 유지한다.

## Goals

- 사주 카드가 메인 컨텐츠
- 모바일웹 친화적 + MUD(아스키아트) 디자인
- 카드 3종: 기본 사주 카드, 대운/세운 카드, 궁합 카드
- PNG 다운로드 + Web Share API 공유

## Non-Goals

- MUD 방 탐험 / 명령어 파서 유지
- 상세 풀이 (십이운성, 신살 상세 등) — 종합 요약만 제공
- 서버 저장 / 공유 URL 생성 (클라이언트 사이드만)
- `detail` room 해석 (삭제)

---

## Architecture

### Preserved (변경 없음)

| Path | Purpose |
|------|---------|
| `src/lib/saju/` | 사주 계산 엔진 (calculator, types, constants, helpers) |
| `src/app/api/interpret/` | SSE 스트리밍 API |
| `src/lib/export/zodiacArt.ts` | 12지 ASCII 아트 |
| `src/lib/logger.ts` | 파일 로깅 |
| `src/app/globals.css` | CRT 효과 (스캔라인, 플리커, 비네트) |
| `src/app/(pages)/` | about, privacy, terms 페이지 |

### Modified (수정 필요)

| Path | Changes |
|------|---------|
| `src/lib/ai/prompts.ts` | MUD 용어 제거: "이 방은", "현자", "방에 들어서면" 등을 카드 서비스 맥락으로 변경. `roomId` 파라미터를 `interpretationType`으로 리네이밍. `detail` case 제거. |
| `src/lib/ai/templates.ts` | MUD 참조 제거, 카드 서비스 맥락으로 수정 |
| `src/lib/export/cardExport.ts` | 모바일 대응: `CARD_INNER_W`를 파라미터화하여 뷰포트 기준 조절 가능하게. 제목 텍스트 업데이트. |
| `src/app/layout.tsx` | SEO 메타데이터 업데이트: MUD 게임 설명 → 사주 카드 서비스 설명 |
| `src/app/manifest.ts` | PWA 설명 업데이트: MUD → 사주 카드 |
| `src/app/sitemap.ts` | 새 라우트 추가: `/result`, `/result/compatibility` |
| `src/app/opengraph-image.tsx` | OG 이미지 설명 업데이트 |
| `src/app/(pages)/layout.tsx` | 네비게이션 텍스트 업데이트 ("← 미궁으로" → "← 처음으로") |

### New (신규 작성)

| Path | Purpose |
|------|---------|
| `src/app/page.tsx` | 랜딩 + 입력 폼 (터미널 프롬프트 스타일) |
| `src/app/result/page.tsx` | 결과: AI 풀이 + 카드 미리보기 + 공유 |
| `src/app/result/compatibility/page.tsx` | 궁합: 상대방 입력 + 궁합 카드 |
| `src/components/form/SajuForm.tsx` | 터미널 스타일 입력 폼 컴포넌트 |
| `src/components/card/CardPreview.tsx` | 카드 Canvas 인라인 미리보기 (Blob → ObjectURL 변환 + cleanup) |
| `src/components/card/ShareButtons.tsx` | 다운로드 + Web Share API 버튼 |
| `src/components/card/CardSelector.tsx` | 카드 종류 선택 (3종) |
| `src/hooks/useSaju.ts` | 사주 계산 + AI 풀이 상태 관리 (useStreaming 로직 통합) |
| `src/hooks/useShare.ts` | Web Share API + fallback 로직 |
| `src/lib/export/luckCardExport.ts` | 대운/세운 카드 렌더러 |
| `src/lib/export/compatCardExport.ts` | 궁합 카드 렌더러 |
| `src/lib/saju/compatibility.ts` | 궁합 계산 로직 |

### Deleted (삭제)

| Path | Reason |
|------|--------|
| `src/lib/mud/` | MUD 방/명령어 파서 — 더 이상 불필요 |
| `src/hooks/useGame.ts` | MUD 게임 상태 머신 — useSaju로 대체 |
| `src/hooks/useTerminal.ts` | 터미널 출력 라인 관리 — 불필요 |
| `src/hooks/useStreaming.ts` | useSaju에 SSE 로직 통합 (별도 훅 불필요) |
| `src/components/terminal/` | 터미널 UI 컴포넌트 — 새 컴포넌트로 대체 |
| `src/components/SidePanel.tsx` | 가이드/용어 사이드바 — 불필요 |
| `src/components/saju/Charts.ts` | MUD 터미널용 텍스트 차트 — 카드 렌더러가 대체 |
| `src/components/saju/PillarDisplay.tsx` | MUD 터미널용 기둥 표시 — 카드 렌더러가 대체 |

---

## Page Designs

### 1. Landing Page (`/`)

```
╔══════════════════════════════════╗
║  사 주 명 리 의  미 궁           ║
║  四 柱 命 理 의  迷 宮           ║
╠══════════════════════════════════╣
║                                  ║
║  > 이름을 입력하시오: [______]   ║
║  > 생년월일: [____년 __월 __일]  ║
║  > 양력/음력: (●양력 ○음력)     ║
║  > 태어난 시: [선택▼]            ║
║  > 성별: (●남 ○여)              ║
║  > 결혼여부: (●미혼 ○기혼 ○기타)║
║  > 직업 (선택): [______]         ║
║                                  ║
║  [ ▶ 사주 풀이 시작 ]            ║
║                                  ║
╚══════════════════════════════════╝
```

- CRT 스캔라인 + 비네트 + 플리커 효과 유지
- D2Coding 폰트, 금색(#D4A020) on 다크(#080600)
- 폼이지만 터미널 프롬프트(`>`) 스타일
- 모바일: 풀 너비, 큰 터치 타겟 (min 44px)
- 입력 필드: 이름, 생년월일, 양/음력, 시간(시주), 성별, **결혼여부(필수)**, **직업(선택)**
  - `maritalStatus`는 `BirthInfo` 타입에서 필수 필드
  - `occupation`은 선택이지만 AI 프롬프트가 맞춤 조언에 활용
- 제출 시 클라이언트에서 `calculateFullSaju()` 수행 후 `/result`로 이동

### 2. Result Page (`/result`)

```
╔══════════════════════════════════╗
║  [홍길동]의 사주 풀이            ║
╠══════════════════════════════════╣
║                                  ║
║  ─── 종합 풀이 ───               ║
║  (AI 스트리밍 표시)               ║
║  일주론 + 오행 + 십성 + 한마디   ║
║                                  ║
║  ─── 풀이 중... ───              ║  ← 로딩 상태
║  ▌ (깜빡이는 커서 애니메이션)    ║
║                                  ║
╠══════════════════════════════════╣
║                                  ║
║  ─── 사주 카드 ───               ║
║  [카드 미리보기 Canvas]           ║
║                                  ║
║  [📥 다운로드] [📤 공유하기]     ║
║                                  ║
╠══════════════════════════════════╣
║                                  ║
║  ─── 더 알아보기 ───             ║
║  [ ▶ 대운/세운 카드 보기 ]       ║
║  [ ▶ 궁합 카드 만들기 ]          ║
║  [ ◀ 다시 풀기 ]                 ║
║                                  ║
╚══════════════════════════════════╝
```

- AI 풀이: `synthesis` 해석 타입으로 SSE 스트리밍 (`/api/interpret`)
- 카드 미리보기: `renderCardToPng()` → Blob → `URL.createObjectURL()` → `<img>` 표시, unmount 시 `revokeObjectURL`
- 대운/세운 카드: 클릭 시 기본 카드 아래에 추가 카드 렌더링 (스택)
- 궁합 카드: `/result/compatibility`로 이동
- **로딩 상태**: AI 스트리밍 중 깜빡이는 커서 애니메이션, 카드 렌더링 중 "카드 생성 중..." 표시
- **에러 상태**: AI 실패 시 "풀이에 실패했습니다. 다시 시도해주세요." + 재시도 버튼

### 3. Compatibility Page (`/result/compatibility`)

```
╔══════════════════════════════════╗
║  ─── 궁합 카드 ───               ║
║  > 상대방 이름: [______]         ║
║  > 생년월일: [____년 __월 __일]  ║
║  > 양력/음력 · 시간 · 성별       ║
║  [ ▶ 궁합 보기 ]                 ║
╠══════════════════════════════════╣
║  (결과)                           ║
║  [궁합 카드 미리보기]             ║
║  [📥 다운로드] [📤 공유하기]     ║
╚══════════════════════════════════╝
```

- 본인 사주는 sessionStorage에서 복원
- 상대방 정보 입력 → `calculateFullSaju()` → 궁합 분석
- AI 해석: compatibility 해석 타입 사용
- 궁합 카드: 두 사람의 사주를 나란히 비교하는 카드 레이아웃

---

## State Management

### sessionStorage 기반 상태 전달

페이지 간 데이터 전달은 **sessionStorage**를 사용한다.

```typescript
// 키 이름
const STORAGE_KEY = 'saju-result';
const STORAGE_AI_KEY = 'saju-ai-cache';

// 저장 (Landing → Result 전환 시)
sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sajuResult));

// 복원 (Result 페이지 mount 시)
const stored = sessionStorage.getItem(STORAGE_KEY);
if (!stored) {
  router.replace('/');  // 데이터 없으면 홈으로 리다이렉트
  return;
}
const sajuResult: SajuResult = JSON.parse(stored);
```

- **저장 시점**: `calculateFullSaju()` 성공 후, `/result` 이동 전
- **복원 시점**: `/result` 및 `/result/compatibility` 페이지 mount 시
- **데이터 없을 때**: `router.replace('/')` 로 홈 리다이렉트
- **클리어 시점**: 새 사주 계산 시 기존 데이터 덮어쓰기, 브라우저 탭 닫으면 자동 소멸
- **AI 캐시**: 별도 키(`saju-ai-cache`)로 저장, `extractWisdom()`이 이 캐시에서 "현자의 한마디" 추출

### 폰트 로딩

Canvas 렌더링 전 D2Coding 폰트 로딩 보장:

```typescript
await document.fonts.load(`16px "D2Coding"`);
// 이후 renderCardToPng() 호출
```

---

## Card Types (3종)

### 기본 사주 카드

- 현재 `cardExport.ts`의 `renderCardToPng()` 기반
- 모바일 대응: `CARD_INNER_W`를 파라미터로 받아 뷰포트 너비에 맞게 조절
- 내용: 제목, 이름/생일, 띠 ASCII 아트, 현자의 한마디, 사주 네 기둥, 오행/십성 요약

### 대운/세운 카드 (`luckCardExport.ts` — 신규)

- 데이터: `SajuResult.luckCycles` + `SajuResult.yearlyLuck`
- 레이아웃: 제목 → 이름/생일 → 현재 대운 강조 → 10년 대운 타임라인 → 올해 세운 요약
- AI 해석: luck 해석 타입 사용, 카드용으로 간략화 (2-3줄 요약만 요청하는 프롬프트 수정)
- 디자인: 기본 카드와 동일한 미학 (금색 테두리, 어두운 배경, ASCII 장식)

### 궁합 카드 (`compatCardExport.ts` — 신규)

- 데이터: 두 SajuResult + AI 궁합 해석
- 레이아웃: 두 사람 이름 + 띠 ASCII 아트 나란히 → 궁합 요약 → AI 한마디
- **궁합 계산은 AI에 위임**: 클라이언트에서는 두 SajuResult를 API에 전달하고, AI가 오행 상생/상극, 일간 합충, 지지 관계를 분석하여 텍스트로 반환
- `compatibility.ts`에는 카드 렌더링에 필요한 기본 데이터 추출만 (두 사람의 일간 관계, 띠 동물 등)

---

## Data Flow

```
[Landing Page]
    │
    ├─ 폼 입력 수집 (이름, 생일, 양음력, 시간, 성별, 결혼여부, 직업)
    ├─ calculateFullSaju(birthInfo) → SajuResult
    ├─ sessionStorage.setItem('saju-result', JSON.stringify(result))
    ├─ router.push('/result')
    │
    ▼
[Result Page]
    │
    ├─ sessionStorage에서 SajuResult 복원 (없으면 '/'로 리다이렉트)
    ├─ document.fonts.load('D2Coding') 대기
    ├─ POST /api/interpret { saju, type: 'synthesis' } → SSE stream
    ├─ AI 풀이 텍스트 표시 + aiCache에 저장
    ├─ renderCardToPng(saju, aiCache) → Blob → ObjectURL → <img>
    │
    ├─ [대운/세운 카드 클릭]
    │   ├─ POST /api/interpret { saju, type: 'luck' } → SSE stream
    │   └─ renderLuckCardToPng(saju, aiCache) → Blob → ObjectURL → <img>
    │
    ├─ [궁합 카드 클릭] → router.push('/result/compatibility')
    │
    ▼
[Compatibility Page]
    │
    ├─ sessionStorage에서 본인 SajuResult 복원
    ├─ 상대방 폼 입력 → calculateFullSaju(partnerBirthInfo)
    ├─ POST /api/interpret { saju, partnerSaju, type: 'compatibility' } → SSE
    └─ renderCompatCardToPng(saju, partnerSaju, aiCache) → Blob → ObjectURL
    │
    ▼
[Share (모든 카드 공통)]
    ├─ navigator.canShare({ files }) → navigator.share({ files: [File] })
    └─ fallback: a.download 클릭 (데스크톱 또는 미지원 브라우저)
```

---

## Sharing Implementation

```typescript
// useShare.ts
async function shareCard(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: 'image/png' });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: '나의 사주 카드',
      files: [file],
    });
  } else {
    // fallback: 다운로드
    downloadBlob(blob, filename);
  }
}
```

- Web Share API: 모바일 Chrome, Safari 지원 (iOS Safari는 파일 공유 제한적 — 이미지는 지원)
- 데스크톱 fallback: PNG 다운로드
- 에러 처리: `share()` 실패 시 자동으로 다운로드 fallback

---

## Visual Design Principles

- **CRT 터미널 미학 유지**: 스캔라인, 비네트, 플리커 (`src/app/globals.css`)
- **ASCII 아트 활용**: 입력 폼 테두리, 섹션 구분, 카드 장식
- **컬러 팔레트**: 금색(#D4A020) on 다크(#080600), 오행별 색상 유지
- **폰트**: D2Coding 모노스페이스
- **모바일 최적화**: 터치 타겟 44px+, 반응형 너비, 세로 스크롤 중심
- **카드 스타일**: 현재 A 스타일 (세로형, 정보 풍부) 기반 + 모바일 너비 대응

---

## AI Prompt Changes

| 해석 타입 | 기존 prompt | 변경 사항 |
|-----------|------------|-----------|
| `synthesis` | MUD 방 설명 포함 | MUD 용어 제거, "사주 종합 해석" 맥락으로 |
| `luck` | MUD 방 설명 포함 | MUD 용어 제거, 카드용 간략 요약 (2-3줄) 요청 추가 |
| `compatibility` | MUD 방 설명 포함 | MUD 용어 제거, 두 사람 비교 맥락 유지 |
| `detail` | 상세 풀이 | **삭제** — 종합 요약만 제공 |
| `SYSTEM_PROMPT` | "MUD 텍스트 게임 속의 현자" | "사주명리 전문가" 로 변경 |

`roomId` 파라미터 → `interpretationType`으로 리네이밍 (API route 포함)

---

## Error Handling

| 상황 | 처리 |
|------|------|
| `calculateFullSaju()` 실패 | 폼에 에러 메시지 표시, 제출 버튼 재활성화 |
| `/result` 접속 시 데이터 없음 | `router.replace('/')` 리다이렉트 |
| AI 스트리밍 실패 | "풀이에 실패했습니다" + 재시도 버튼. 카드는 AI 없이도 생성 가능 (현자의 한마디 기본값 사용) |
| Canvas 렌더링 실패 | "카드 생성에 실패했습니다" + 재시도 버튼 |
| Web Share API 실패 | 자동으로 다운로드 fallback |
| 폰트 로딩 실패 | 시스템 모노스페이스 폰트로 fallback |

---

## Migration Checklist

1. AI 프롬프트 수정 (MUD 용어 제거, `roomId` → `interpretationType`)
2. 새 페이지/컴포넌트 작성 (landing, result, compatibility)
3. `SajuForm` 컴포넌트 작성 (결혼여부, 직업 필드 포함)
4. `useSaju` 훅 작성 (계산 + sessionStorage + AI 풀이 + aiCache)
5. `CardPreview` 컴포넌트 작성 (Blob → ObjectURL → img + cleanup)
6. `useShare` 훅 작성 (Web Share API + fallback)
7. 기존 카드 렌더러 모바일 대응 (`CARD_INNER_W` 파라미터화)
8. 대운/세운 카드 렌더러 작성
9. 궁합 카드 렌더러 작성 + `compatibility.ts` 기본 데이터 추출
10. SEO/메타데이터 업데이트 (layout, manifest, sitemap, opengraph, pages layout)
11. MUD 관련 코드 삭제 (mud/, useGame, useTerminal, useStreaming, terminal/, SidePanel, Charts, PillarDisplay)
12. 모바일 테스트 및 확인
