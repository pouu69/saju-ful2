'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);
  const animRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const changeYear = useCallback((delta: number) => {
    const next = value + delta;
    if (next < min || next > max) return;
    setDirection(delta > 0 ? 'up' : 'down');
    onChange(next);
    if (animRef.current) clearTimeout(animRef.current);
    animRef.current = setTimeout(() => setDirection(null), 200);
  }, [value, min, max, onChange]);

  const drumRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = drumRef.current;
    if (!el) return;
    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      if (e.deltaY > 0) changeYear(1);
      if (e.deltaY < 0) changeYear(-1);
    }
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [changeYear]);

  // Pointer Events — 마우스 + 터치 + 펜 통합
  const pointerStartY = useRef<number | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    pointerStartY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (pointerStartY.current === null) return;
    const deltaY = pointerStartY.current - e.clientY;
    if (Math.abs(deltaY) >= 30) {
      changeYear(deltaY > 0 ? 1 : -1);
      pointerStartY.current = e.clientY;
    }
  }, [changeYear]);

  const handlePointerUp = useCallback(() => {
    pointerStartY.current = null;
  }, []);

  const prev2 = getGanji(value - 2);
  const prev1 = getGanji(value - 1);
  const curr = getGanji(value);
  const next1 = getGanji(value + 1);
  const next2 = getGanji(value + 2);

  const slideClass = direction === 'up'
    ? 'translate-y-[-8px] opacity-90'
    : direction === 'down'
    ? 'translate-y-[8px] opacity-90'
    : 'translate-y-0 opacity-100';

  return (
    <div className="flex flex-col items-center gap-4 w-full select-none">
      {/* Drum area */}
      <div
        ref={drumRef}
        className="w-full flex flex-col items-center cursor-ns-resize overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDragStart={(e) => e.preventDefault()}
        style={{ touchAction: 'none', userSelect: 'none' }}
      >
        {/* -2 year (faintest) */}
        {value - 2 >= min && (
          <div className="text-[#1a1500] font-mono text-sm py-1 transition-all duration-200">
            {value - 2} {prev2.emoji}
          </div>
        )}

        {/* -1 year (dim) */}
        {value - 1 >= min && (
          <div className="text-[#3a2a08] font-mono text-lg py-1.5 transition-all duration-200">
            {value - 1} {prev1.emoji} {prev1.ganji}
          </div>
        )}

        {/* Selected year (center) */}
        <div
          className={[
            'w-full flex flex-col items-center border-t border-b border-[#D4A020] py-4 bg-[#D4A020]/5',
            'transition-transform duration-200 ease-out',
            slideClass,
          ].join(' ')}
        >
          <div className="text-[#FFD060] font-mono text-4xl font-bold">{value}</div>
          <div className="flex items-center gap-2 justify-center mt-1">
            <span className="text-2xl">{curr.emoji}</span>
            <span className="text-[#68d391] font-mono text-sm">{curr.ganji} · {curr.animal}띠</span>
          </div>
        </div>

        {/* +1 year (dim) */}
        {value + 1 <= max && (
          <div className="text-[#3a2a08] font-mono text-lg py-1.5 transition-all duration-200">
            {value + 1} {next1.emoji} {next1.ganji}
          </div>
        )}

        {/* +2 year (faintest) */}
        {value + 2 <= max && (
          <div className="text-[#1a1500] font-mono text-sm py-1 transition-all duration-200">
            {value + 2} {next2.emoji}
          </div>
        )}
      </div>

      {/* Scroll hint */}
      <div className="text-[#555] font-mono text-[10px] tracking-wider">↕ 스크롤하여 선택</div>

      {/* Direct input */}
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
