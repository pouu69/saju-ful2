'use client';

import { useCallback, useRef } from 'react';

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
  const touchStartY = useRef<number | null>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0 && value < max) onChange(value + 1);
    if (e.deltaY < 0 && value > min) onChange(value - 1);
  }, [value, min, max, onChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    touchStartY.current = null;
    if (Math.abs(deltaY) < 20) return; // ignore small swipes
    if (deltaY > 0 && value < max) onChange(value + 1);  // swipe up = increase
    if (deltaY < 0 && value > min) onChange(value - 1);  // swipe down = decrease
  }, [value, min, max, onChange]);

  const decrement = useCallback(() => {
    if (value > min) onChange(value - 1);
  }, [value, min, onChange]);

  const increment = useCallback(() => {
    if (value < max) onChange(value + 1);
  }, [value, max, onChange]);

  const { ganji, animal, emoji } = getGanji(value);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div
          className="w-full flex flex-col items-center"
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
        <div className="text-[#3a2a08] font-mono text-xl py-2">{value - 1}</div>
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
        <div className="text-[#3a2a08] font-mono text-xl py-2">{value + 1}</div>
      </div>
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
