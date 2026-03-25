# Landing Page Redesign — Interactive ASCII Intro

**Date:** 2026-03-25
**Status:** Draft

## Summary

현재 단순한 폼 중심 랜딩페이지를 **용봉(龍鳳) ASCII 아트 인트로 애니메이션 + 폼**으로 재구성한다. 기존 CRT 레트로/ASCII 아트 컨셉을 유지하면서, 일본 사용자에게도 어필할 수 있는 절제된 동양적 미감을 적용한다.

## Design Decisions

| 결정 | 선택 | 대안 (기각 사유) |
|------|------|-------------------|
| 페이지 목표 | 빠른 전환 (폼 중심) | 서비스 소개형 (스크롤이 길어 전환율 하락), 허브형 (서비스가 아직 다양하지 않음) |
| 폼 위 요소 | 히어로 ASCII 아트 + 한 줄 카피 | 미니 데모 (구현 복잡), 소셜 프루프 (아직 사용자 데이터 없음) |
| 폼 아래 요소 | 최소한 (푸터만) | 서비스 특징 섹션 (원페이지 유지), FAQ (SEO는 JSON-LD로 충분) |
| ASCII 모티프 | 용봉 (龍鳳) | 팔괘도 (정적), 사주 기둥 (교육적이나 임팩트 부족), 미궁 (게임 강조 과함) |
| 접근 방식 | 인터랙티브 인트로 (타이핑 애니메이션) | 풀스크린 히어로→스크롤 (한 스텝 더), 통합형 (ASCII 크기 제한) |
| 인트로 시간 | 1초 (줄 단위 드로잉) | 3초 (너무 느림), 5.5초 다단계 (과한 연출) |
| 재방문 처리 | 매번 애니메이션 재생 (스킵 가능) | localStorage 스킵 (브랜딩 효과 상실) |

## Architecture

### Page Flow

```
[빈 화면] → (1초 드로잉) → [용봉 ASCII + 타이틀] → (0.3초 전환) → [축소 헤더 + 폼] → [미니 푸터]
```

총 ~1.3초. 클릭/탭/스크롤로 언제든 스킵 → 즉시 폼 화면.

### Step 1: 용봉 ASCII 드로잉 (1초)

**화면:** 검은 배경 위에 용봉 ASCII 아트가 행(row) 단위로 빠르게 그려진다.

```
        ╭─────────────────────╮
     ╱                         ╲
   龍                             鳳
  ╱  ╲    ◆ ═══════════ ◆    ╱  ╲
 ╱    ╲   ║             ║   ╱    ╲
╱  ╱╲  ╲  ║  命    理  ║  ╱  ╱╲  ╲
╲  ╲╱  ╱  ║             ║  ╲  ╲╱  ╱
 ╲    ╱   ◆ ═══════════ ◆   ╲    ╱
  ╲  ╱                         ╲  ╱
    ╲                         ╱
        ╰─────────────────────╯

    사 주 명 리 의  미 궁
    四 柱 命 理 의  迷 宮
```

**애니메이션 방식:**
- 각 행이 ~70ms 간격으로 나타남 (약 14행 × 70ms ≈ 1초)
- 각 행: opacity 0→1 + glow flash (기존 `terminal-glow-strong` 클래스의 `text-shadow` 적용 후 0.3초 뒤 `terminal-glow`로 전환)
- 타이머: `setTimeout` 체인 (70ms 간격). `requestAnimationFrame`이 아닌 고정 간격이 적합.
- 기존 CRT 스캔라인/비네팅/횃불 플리커 효과는 계속 적용 (z-index 불필요 — CRT 오버레이가 `body::before/::after`로 자동 위에 렌더링)

**접근성:**
- `prefers-reduced-motion: reduce` 미디어 쿼리 감지 시, 애니메이션 없이 완성된 아트를 정적으로 즉시 표시 → 0.3초 후 폼 전환

**일본 미감 포인트:**
- 여백 충분 (화면 중앙, 좌우 패딩 넉넉)
- 완전한 좌우 대칭 구도
- 용/봉황은 추상적 선으로만 — 디테일보다 실루엣
- 골드(#D4A020) 단색으로 절제

**스킵:**
- 클릭, 탭, 스크롤, 키보드 아무 키 → 즉시 완성 상태로 점프
- 스킵 시 전환 애니메이션(Step 2)도 건너뛰고 바로 폼 표시

### Step 2: 폼 전환 (0.3초)

**전환 애니메이션 (크로스페이드):**
- 풀 ASCII 아트가 opacity 1→0으로 페이드아웃
- 동시에 축소 헤더 + 폼이 opacity 0→1로 페이드인
- CSS `transition: opacity 0.3s ease` — 레이아웃 시프트 없음

**축소 헤더:**
```
龍 ══ 사주명리의 미궁 ══ 鳳
      四柱命理의 迷宮
```

**폼:**
- 기존 `SajuForm` 컴포넌트 그대로 재사용
- 변경 없음 (이름, 생년월일, 양력/음력, 시, 성별, 결혼여부, 직업)

### Footer

현재와 동일:
- "AI 기반 사주명리 풀이 서비스" 텍스트만 (현재 약관/개인정보 링크 없음 — 별도 scope)

## Component Design

### 신규: `IntroAnimation` 컴포넌트

```
src/components/intro/IntroAnimation.tsx
```

**Props:**
- `onComplete: () => void` — 애니메이션 완료 또는 스킵 시 호출

**State:**
- `phase: 'drawing' | 'complete'`
- `visibleLines: number` — 현재까지 보여진 행 수

**동작:**
1. 마운트 시 `setTimeout` 체인 시작 (70ms 간격)
2. ~70ms마다 `visibleLines` 1씩 증가
3. 모든 행 표시 완료 → `onComplete()` 호출
4. 클릭/탭/키보드/스크롤 이벤트 → 즉시 `onComplete()` 호출
5. `prefers-reduced-motion: reduce` 감지 시 → 즉시 전체 아트 표시 후 `onComplete()`
6. **cleanup:** 언마운트 또는 스킵 시 모든 타이머 clear + 전역 이벤트 리스너 제거

### 신규: `CompactHeader` 컴포넌트

```
src/components/intro/CompactHeader.tsx
```

축소된 용봉 한 줄 헤더. 폼 상단에 표시.

```
龍 ══ 사주명리의 미궁 ══ 鳳
```

### 신규: ASCII 아트 데이터

```
src/components/intro/asciiArt.ts
```

용봉 ASCII 아트를 행 배열로 저장. 모바일/데스크톱 버전 분리.

- `DRAGON_PHOENIX_FULL: string[]` — md+ 화면용 (풀 사이즈)
- `DRAGON_PHOENIX_COMPACT: string[]` — sm 화면용 (축소 버전)

### 변경: `page.tsx` (랜딩페이지)

```
src/app/page.tsx
```

**변경 내용:**
- `IntroAnimation` → `SajuForm` 전환 로직 추가
- state: `showIntro: boolean` (기본값 `true`)
- `onComplete` 시 `showIntro = false` → 폼 화면으로 전환 (0.3초 CSS transition)
- 기존 타이틀/헤더 블록 (괘상 ASCII `☰☱☲...`, h1, p, 구분선, 설명문) 제거 → `CompactHeader`로 대체

**중요: `SajuForm`은 조건부 렌더링 (not CSS display/visibility)**
- `showIntro === false`일 때만 `<SajuForm />`을 마운트
- 이유: SajuForm 내부의 `autoFocus` 속성이 인트로 중 포커스를 빼앗아 스킵 이벤트 리스너를 방해함

**기존 코드 영향:**
- `SajuForm` 컴포넌트: 변경 없음
- `useSaju` 훅: 변경 없음
- `globals.css`: 크로스페이드 전환용 CSS 추가

## Responsive Design

| 화면 | ASCII 아트 | 폰트 크기 | 여백 |
|------|-----------|-----------|------|
| sm (<640px) | 축소 버전 (`COMPACT`) | 9-10px | 좌우 16px |
| md (640px+) | 풀 버전 (`FULL`) | 11-12px | 좌우 auto (중앙) |

## Data Flow

```
page.tsx
├── showIntro === true
│   └── <IntroAnimation onComplete={→ setShowIntro(false)} />
└── showIntro === false
    ├── <CompactHeader />
    └── <SajuForm onSubmit={handleSubmit} />
```

## Error Handling

- ASCII 아트 렌더링 실패 → 스킵하고 바로 폼 표시
- 애니메이션 타이머 이상 → 2초 후 자동 완료 (safety timeout)

## Testing Plan

- [ ] 인트로 애니메이션이 1초 내 완료되는지
- [ ] 클릭/탭/스크롤/키보드로 스킵이 되는지
- [ ] 스킵 후 폼이 정상 표시되는지
- [ ] 모바일(sm)에서 ASCII 아트가 잘려 보이지 않는지
- [ ] 폼 제출 → 결과 페이지 이동이 기존과 동일한지
- [ ] CRT 효과(스캔라인, 비네팅, 플리커)가 인트로에도 적용되는지
