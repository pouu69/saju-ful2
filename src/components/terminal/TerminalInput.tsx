'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface TerminalInputProps {
  onSubmit: (input: string) => void;
  disabled?: boolean;
  prompt?: string;
}

export default function TerminalInput({ onSubmit, disabled = false, prompt = '>' }: TerminalInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [disabled]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && value.trim()) {
      onSubmit(value.trim());
      setValue('');
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
    <div className="flex items-center text-[#00ff41] py-1">
      <span className="text-[#cccc00] mr-2 terminal-glow-strong">{prompt}</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="bg-transparent border-none outline-none text-[#e8e8e8] flex-1 caret-[#00ff41] font-inherit"
        autoFocus
        autoComplete="off"
        spellCheck={false}
      />
      <span className="terminal-cursor">▌</span>
    </div>
  );
}
