# Result Page Redesign — Card Draw + Scroll Reveal

**Date:** 2026-03-25
**Status:** Approved

## Summary

결과 페이지를 **카드 공유 중심**으로 재설계한다. 캔버스 파티클 이펙트와 타로 드로우 애니메이션으로 카드를 연출하고, 두루마리(巻物) 펼침 효과로 AI 풀이를 표시한다.

## Design Decisions

| 결정 | 선택 | 대안 (기각 사유) |
|------|------|-------------------|
| 페이지 핵심 목적 | 카드 공유 중심 | AI 풀이 중심 (공유 전환율 낮음), 허브형 (초점 분산) |
| 첫 화면 | 카드 생성 애니메이션 → reveal | 카드 히어로 (밋밋), 원국 먼저 (카드까지 스크롤 필요) |
| 카드 reveal 연출 | 타로 드로우 (위→아래 슬라이드) | 뒤집기 (3D 복잡), 안개 걷힘 (과함) |
| 파티클 이펙트 | Canvas 금빛 파티클 | CSS only (표현력 부족), WebGL (과도) |
| AI 풀이 표현 | 두루마리 펼침 | 단순 텍스트 (밋밋), 아코디언 (분절감) |
| 공유 버튼 | 카드 호버/탭 오버레이 | 카드 아래 (시선 분산), 플로팅 바 (항상 노출) |
| 네비게이션 | 풀이 아래 fade-in | 카드와 풀이 사이 (흐름 끊김), 탭 (구현 복잡) |

## Page Flow

```
[진입] → [Canvas 파티클 집중 0.5s] → [카드 드로우 0.6s] → [착지 파티클 burst 0.4s]
  → [카드 안착 + 오버레이 가능] → [두루마리 펼침 + AI 스트리밍] → [네비게이션 fade-in]
```

총 연출 ~1.5초. `prefers-reduced-motion` 시 파티클 없이 fade-in.

## Component Design

### 1. `GoldParticles` — Canvas 파티클 시스템

```
src/components/result/GoldParticles.tsx
```

**Props:**
- `phase: 'gather' | 'burst' | 'idle' | 'done'`
- `centerX: number, centerY: number` — 파티클 집중/폭발 중심점
- `onPhaseComplete: (phase: string) => void`

**동작:**
1. `gather`: 금빛 파티클(80~100개, 모바일 40~50개)이 랜덤 위치에서 중심으로 모여듦 (0.5초)
2. `burst`: 중심에서 바깥으로 퍼짐 (0.4초)
3. `idle`: 파티클 서서히 소멸, canvas opacity → 0
4. `done`: canvas 제거

**파티클 속성:**
- 색상: #D4A020 ~ #FFD060 (랜덤 gold 범위)
- 크기: 1~3px
- alpha: 0.3~1.0 (생명주기에 따라)
- `requestAnimationFrame` 루프

### 2. `CardReveal` — 타로 드로우 애니메이션

```
src/components/result/CardReveal.tsx
```

**Props:**
- `renderCard: () => Promise<Blob>`
- `onBlobReady: (blob: Blob) => void`
- `onRevealComplete: () => void`

**동작:**
1. 카드 로딩 중: 파티클 gather 진행
2. 카드 준비 완료: `transform: translateY(-120%) scale(0.8)` → `translateY(0) scale(1)` (0.6초, ease-out)
3. 착지 시 파티클 burst 트리거
4. 완료 후 `onRevealComplete` 호출

**호버/탭 오버레이:**
- 카드 위에 `position: absolute` 오버레이
- `backdrop-filter: blur(4px)` + `rgba(0,0,0,0.5)`
- 중앙에 다운로드/공유 아이콘 (SVG, gold 테두리)
- 모바일: 첫 탭 → 오버레이 표시, 바깥 탭 → 해제
- 데스크톱: hover → 표시, mouse leave → 해제

### 3. `ScrollReveal` — 두루마리 풀이 영역

```
src/components/result/ScrollReveal.tsx
```

**Props:**
- `children: ReactNode` (AI 텍스트)
- `open: boolean`
- `streaming: boolean`

**구조:**
```
┌─── ═══ 종합 풀이 ═══ ───┐  ← 상단 장식 (항상 표시)
│                            │
│  [AI 스트리밍 텍스트]       │  ← max-height 트랜지션으로 펼쳐짐
│                            │
└─── ═══════════════ ───┘  ← 하단 장식 (스트리밍 완료 후)
```

**스타일:**
- 좌우 세로 테두리: `border-left/right: 1px solid #D4A020/20`
- 상하 장식: 금색 이중선 + 한자 텍스트
- 배경: 약간 밝은 `rgba(212, 160, 32, 0.03)`
- `max-height` 트랜지션: `0 → scrollHeight` (0.6초 ease-out)
- 스트리밍 중 auto-scroll 유지

### 4. 변경: `result/page.tsx`

**Phase 상태 머신:**
```
loading → particles → cardDraw → revealed → scrolling → complete
```

**레이아웃:**
```
<main>
  <GoldParticles />           ← 전체 화면 Canvas (absolute)
  <Header />                  ← 이름 + 제목 (간결)
  <CardReveal />              ← 카드 드로우 + 오버레이 공유
  <ScrollReveal>              ← 두루마리 풀이
    {AI 스트리밍 텍스트}
  </ScrollReveal>
  <Navigation />              ← 대운/궁합/다시풀기 (fade-in)
</main>
```

**기존 사주 원국 섹션:** 제거 (카드 안에 데이터가 이미 포함됨)

### 5. 변경: `result/compatibility/page.tsx`

- 동일한 `CardReveal` + `ScrollReveal` 적용
- 상대방 입력 폼은 현재 스타일 유지
- 궁합 카드 reveal 시 동일한 파티클 연출

## CSS 추가 (`globals.css`)

```css
/* 카드 드로우 */
@keyframes card-draw { ... }
/* 두루마리 펼침 */
.scroll-reveal { ... }
/* 오버레이 */
.card-overlay { ... }
```

## Responsive Design

| 화면 | 파티클 수 | 카드 크기 | 두루마리 패딩 |
|------|----------|----------|-------------|
| sm (<640px) | 40~50 | width: 100%, max-w-xs | px-3 |
| md (640px+) | 80~100 | max-w-sm (360px) | px-6 |

## Accessibility

- `prefers-reduced-motion: reduce` → 파티클 없이 카드 fade-in, 두루마리 즉시 펼침
- 카드 오버레이 버튼: `aria-label` 포함
- AI 텍스트: `aria-live="polite"` (스트리밍 중)

## Error Handling

- 카드 렌더링 실패 → 파티클 스킵, 에러 메시지 표시
- Canvas 미지원 → 파티클 없이 CSS 애니메이션만
- AI 스트리밍 실패 → 재시도 버튼 (기존과 동일)
