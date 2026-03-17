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
