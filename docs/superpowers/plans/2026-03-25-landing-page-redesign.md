# Landing Page Redesign — Interactive ASCII Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dragon/phoenix (龍鳳) ASCII art intro animation to the landing page that draws in 1 second, then cross-fades to the existing saju form.

**Architecture:** Single-page client component with two phases — `IntroAnimation` renders the line-by-line ASCII art drawing, then `page.tsx` cross-fades to `CompactHeader` + `SajuForm`. All new components live in `src/components/intro/`. No new dependencies.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4

**Spec:** `docs/superpowers/specs/2026-03-25-landing-page-redesign-design.md`

**Note:** No test framework is configured in this project. Verification is manual (`npm run build` + browser check).

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/components/intro/asciiArt.ts` | ASCII art data (full + compact arrays) |
| Create | `src/components/intro/CompactHeader.tsx` | Condensed one-line dragon/phoenix header |
| Create | `src/components/intro/IntroAnimation.tsx` | Line-by-line drawing animation + skip logic |
| Modify | `src/app/page.tsx` | Intro→form transition orchestration |
| Modify | `src/app/globals.css` | Intro animation keyframes + cross-fade CSS |

---

### Task 1: ASCII Art Data

**Files:**
- Create: `src/components/intro/asciiArt.ts`

- [ ] **Step 1: Create the ASCII art data file**

```typescript
// src/components/intro/asciiArt.ts

/** Full-size dragon/phoenix art for md+ screens (640px+) */
export const DRAGON_PHOENIX_FULL: string[] = [
  '          ╭─────────────────────╮',
  '       ╱                         ╲',
  '     龍                             鳳',
  '    ╱  ╲    ◆ ═══════════ ◆    ╱  ╲',
  '   ╱    ╲   ║             ║   ╱    ╲',
  '  ╱  ╱╲  ╲  ║  命    理  ║  ╱  ╱╲  ╲',
  '  ╲  ╲╱  ╱  ║             ║  ╲  ╲╱  ╱',
  '   ╲    ╱   ◆ ═══════════ ◆   ╲    ╱',
  '    ╲  ╱                         ╲  ╱',
  '      ╲                         ╱',
  '          ╰─────────────────────╯',
  '',
  '      사 주 명 리 의  미 궁',
  '      四 柱 命 理 의  迷 宮',
];

/** Compact art for small screens (<640px) */
export const DRAGON_PHOENIX_COMPACT: string[] = [
  '    ╭───────────────╮',
  '  龍    ◆══════◆    鳳',
  '  ╱ ╲   ║ 命理 ║   ╱ ╲',
  '  ╲ ╱   ◆══════◆   ╲ ╱',
  '    ╰───────────────╯',
  '',
  '  사 주 명 리 의  미 궁',
  '  四 柱 命 理 의  迷 宮',
];

/** Line interval in ms (~70ms × 14 lines ≈ 1s for full) */
export const LINE_INTERVAL_MS = 70;

/** Safety timeout — force complete after this many ms */
export const SAFETY_TIMEOUT_MS = 2000;
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds (unused exports are fine in Next.js)

- [ ] **Step 3: Commit**

```bash
git add src/components/intro/asciiArt.ts
git commit -m "feat(landing): add dragon/phoenix ASCII art data"
```

---

### Task 2: CompactHeader Component

**Files:**
- Create: `src/components/intro/CompactHeader.tsx`

- [ ] **Step 1: Create the compact header component**

```tsx
// src/components/intro/CompactHeader.tsx
'use client';

export function CompactHeader() {
  return (
    <div className="text-center mb-8 font-mono">
      <h1 className="text-[#FFD060] text-lg sm:text-xl tracking-widest">
        龍 ══ 사주명리의 미궁 ══ 鳳
      </h1>
      <p className="text-[#CC8833] text-sm sm:text-base mt-1">
        四柱命理의 迷宮
      </p>
      <div className="text-[#D4A020] mt-3 text-sm">
        ══════════════════════
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/intro/CompactHeader.tsx
git commit -m "feat(landing): add compact dragon/phoenix header"
```

---

### Task 3: Intro Animation CSS

**Files:**
- Modify: `src/app/globals.css` (append at end)

- [ ] **Step 1: Add intro animation keyframes and cross-fade styles**

Append the following to the end of `src/app/globals.css`:

```css
/* ═══ 인트로 애니메이션 ═══ */
@keyframes intro-line-in {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes intro-glow-flash {
  0% {
    text-shadow:
      0 0 4px rgba(212, 160, 32, 0.3),
      0 0 12px rgba(212, 160, 32, 0.15);
  }
  100% {
    text-shadow: 0 0 4px var(--terminal-glow);
  }
}

.intro-line {
  animation: intro-line-in 0.15s ease-out, intro-glow-flash 0.3s ease-out;
}

/* ═══ 크로스페이드 전환 ═══ */
.intro-fade-out {
  transition: opacity 0.3s ease;
  opacity: 0;
}

.form-fade-in {
  animation: room-enter 0.3s ease-out;
}

/* ═══ 접근성: 모션 감소 ═══ */
@media (prefers-reduced-motion: reduce) {
  .intro-line {
    animation: none;
  }

  .intro-fade-out {
    transition: none;
  }

  .form-fade-in {
    animation: none;
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(landing): add intro animation and cross-fade CSS"
```

---

### Task 4: IntroAnimation Component

**Files:**
- Create: `src/components/intro/IntroAnimation.tsx`

- [ ] **Step 1: Create the intro animation component**

```tsx
// src/components/intro/IntroAnimation.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  DRAGON_PHOENIX_FULL,
  DRAGON_PHOENIX_COMPACT,
  LINE_INTERVAL_MS,
  SAFETY_TIMEOUT_MS,
} from './asciiArt';

interface IntroAnimationProps {
  onComplete: () => void;
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

export function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const lines = isDesktop ? DRAGON_PHOENIX_FULL : DRAGON_PHOENIX_COMPACT;

  const [visibleCount, setVisibleCount] = useState(0);
  const completedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    onComplete();
  }, [onComplete]);

  // Reduced motion: show all immediately, then complete
  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleCount(lines.length);
      const t = setTimeout(complete, 300);
      return () => clearTimeout(t);
    }
  }, [prefersReducedMotion, lines.length, complete]);

  // Animation: reveal lines one by one
  useEffect(() => {
    if (prefersReducedMotion) return;

    for (let i = 0; i < lines.length; i++) {
      const t = setTimeout(() => {
        setVisibleCount(i + 1);
        if (i === lines.length - 1) {
          // Last line drawn — brief pause then complete
          const finish = setTimeout(complete, 300);
          timersRef.current.push(finish);
        }
      }, LINE_INTERVAL_MS * i);
      timersRef.current.push(t);
    }

    // Safety timeout
    const safety = setTimeout(complete, SAFETY_TIMEOUT_MS);
    timersRef.current.push(safety);

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [lines, prefersReducedMotion, complete]);

  // Skip on any user interaction
  useEffect(() => {
    const skip = () => complete();
    window.addEventListener('click', skip);
    window.addEventListener('keydown', skip);
    window.addEventListener('scroll', skip, { passive: true });
    window.addEventListener('touchstart', skip, { passive: true });

    return () => {
      window.removeEventListener('click', skip);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('scroll', skip);
      window.removeEventListener('touchstart', skip);
    };
  }, [complete]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <pre
        className="font-mono text-[#D4A020] text-center leading-snug
          text-[9px] sm:text-[11px] md:text-[12px]"
        aria-label="사주명리의 미궁 - 용봉 장식"
      >
        {lines.map((line, i) => (
          <div
            key={i}
            className={i < visibleCount ? 'intro-line' : ''}
            style={{
              opacity: i < visibleCount ? 1 : 0,
              whiteSpace: 'pre',
            }}
          >
            {line || '\u00A0'}
          </div>
        ))}
      </pre>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/intro/IntroAnimation.tsx
git commit -m "feat(landing): add intro animation component with skip and a11y"
```

---

### Task 5: Wire Up page.tsx

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Rewrite page.tsx with intro→form transition**

Replace entire `src/app/page.tsx` with:

```tsx
// src/app/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SajuForm } from '@/components/form/SajuForm';
import { IntroAnimation } from '@/components/intro/IntroAnimation';
import { CompactHeader } from '@/components/intro/CompactHeader';
import { useSaju } from '@/hooks/useSaju';
import type { BirthInfo } from '@/lib/saju/types';

export default function LandingPage() {
  const router = useRouter();
  const { calculate, error } = useSaju();
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

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

  if (showIntro) {
    return <IntroAnimation onComplete={() => setShowIntro(false)} />;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 form-fade-in">
      <CompactHeader />

      <div className="w-full max-w-md border border-[#D4A020]/30 p-6">
        <SajuForm onSubmit={handleSubmit} loading={loading} error={error} />
      </div>

      <div className="text-[#6A5828] font-mono text-xs mt-8 text-center">
        AI 기반 사주명리 풀이 서비스
      </div>
    </main>
  );
}
```

**Key points:**
- `SajuForm` is conditionally rendered (not hidden via CSS) to prevent `autoFocus` from stealing focus during intro
- `form-fade-in` class handles the 0.3s entrance animation
- Existing `handleSubmit` logic unchanged

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Manual browser verification**

Run: `npm run dev`

Check the following at `http://localhost:3000`:
1. Page loads → dragon/phoenix ASCII art draws line by line (~1 second)
2. After drawing completes → cross-fades to compact header + form
3. Click/tap/keyboard during animation → skips to form immediately
4. Form submission → navigates to `/result` as before
5. Resize browser to mobile width → compact ASCII art version shown
6. CRT effects (scanlines, vignette, flicker) visible during intro

- [ ] **Step 4: Verify `prefers-reduced-motion`**

In Chrome DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`
Expected: No animation, art shown statically, transitions to form after 0.3s

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(landing): wire up intro animation with form transition"
```

---

### Task 6: Final Polish & Verify

- [ ] **Step 1: Full build check**

Run: `npm run build`
Expected: Build succeeds with no warnings

- [ ] **Step 2: Lint check**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: End-to-end browser walkthrough**

Full flow test at `http://localhost:3000`:
1. Fresh load → intro animation plays
2. Animation completes → form appears with compact header
3. Navigate to another page and back → intro plays again
4. Fill form and submit → result page works
5. Mobile responsive check (DevTools device toggle)

- [ ] **Step 4: Final commit if any polish needed**

```bash
git add -A
git commit -m "chore(landing): final polish for intro animation"
```
