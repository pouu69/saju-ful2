'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface TerminalInputProps {
  onSubmit: (input: string) => void;
  disabled?: boolean;
  prompt?: string;
}

export default function TerminalInput({ onSubmit, disabled = false, prompt = '>' }: TerminalInputProps) {
  const [value, setValue] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [disabled]);

  const syncCursor = () => {
    const pos = inputRef.current?.selectionStart ?? value.length;
    setCursorPos(pos);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && value.trim()) {
      onSubmit(value.trim());
      setValue('');
      setCursorPos(0);
    }
  };

  if (disabled) {
    return (
      <div className="flex items-center text-[#00aa2a] opacity-50 py-1">
        <span className="mr-2">{prompt}</span>
        <span className="terminal-cursor">_</span>
        <span className="ml-2 text-[11px] tracking-wider">(처리 중...)</span>
      </div>
    );
  }

  return (
    <div
      className="relative py-1 cursor-text"
      onClick={() => inputRef.current?.focus({ preventScroll: true })}
    >
      {/* 보이는 텍스트 + 커서 */}
      <div className="flex items-center text-[#00ff41]">
        <span className="text-[#cccc00] mr-2 terminal-glow-strong">{prompt}</span>
        <span className="text-[#e8e8e8] whitespace-pre">{value.slice(0, cursorPos)}</span>
        <span className="terminal-cursor">▌</span>
        <span className="text-[#e8e8e8] whitespace-pre">{value.slice(cursorPos)}</span>
      </div>

      {/* 숨겨진 실제 input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => { setValue(e.target.value); syncCursor(); }}
        onKeyDown={handleKeyDown}
        onKeyUp={syncCursor}
        onClick={syncCursor}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text"
        autoFocus
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
}
