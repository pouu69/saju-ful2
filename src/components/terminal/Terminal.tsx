'use client';

import { useRef, useEffect, useCallback } from 'react';
import TerminalLine, { LineData } from './TerminalLine';
import TerminalInput from './TerminalInput';

interface TerminalProps {
  lines: LineData[];
  onCommand: (input: string) => void;
  inputDisabled?: boolean;
  inputPrompt?: string;
  onTypingComplete?: (lineId: string) => void;
  userName?: string;
  roomName?: string;
}

/** 자동 스크롤 판정: 하단에서 이 값(px) 이내면 "바닥에 있음" */
const AUTO_SCROLL_THRESHOLD = 100;

export default function Terminal({
  lines,
  onCommand,
  inputDisabled = false,
  inputPrompt,
  onTypingComplete,
  userName,
  roomName,
}: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < AUTO_SCROLL_THRESHOLD;
    userScrolledUp.current = !atBottom;
  }, []);

  useEffect(() => {
    // 사용자가 위로 스크롤하고 있으면 자동 스크롤 하지 않음
    if (userScrolledUp.current) return;
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [lines]);

  const handleClick = () => {
    const input = scrollRef.current?.querySelector('input');
    input?.focus({ preventScroll: true });
  };

  return (
    <div className="crt-monitor" onClick={handleClick}>
      <div className="crt-screen">
        {/* CRT 오버레이 레이어 */}
        <div className="pointer-events-none absolute inset-0 z-20 crt-scanlines" />
        <div className="pointer-events-none absolute inset-0 z-20 crt-vignette" />
        <div className="pointer-events-none absolute inset-0 z-20 crt-noise" />

        {/* 화면 상단 바 */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a3a1a] bg-[#060806]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00ff41] opacity-60" />
            <span className="text-[11px] text-[#00aa2a] tracking-wider uppercase">
              사주명리 MUD v1.0
            </span>
          </div>
          {roomName && (
            <span className="text-[11px] text-[#cccc00] tracking-wider">
              [{roomName}]
            </span>
          )}
        </div>

        {/* 터미널 내용 */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="terminal-content terminal-glow h-[calc(100%-36px)] overflow-y-auto p-5 pb-24 scrollbar-thin scroll-smooth cursor-text"
        >
          {lines.map(line => (
            <TerminalLine
              key={line.id}
              line={line}
              onTypingComplete={() => onTypingComplete?.(line.id)}
              userName={userName}
            />
          ))}

          <div className="input-line">
            <TerminalInput
              onSubmit={onCommand}
              disabled={inputDisabled}
              prompt={inputPrompt}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
