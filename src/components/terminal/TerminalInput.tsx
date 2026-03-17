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
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  if (disabled) return null;

  return (
    <div className="flex items-center text-green-400">
      <span className="text-yellow-400 mr-2">{prompt}</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="bg-transparent border-none outline-none text-white flex-1 caret-green-400"
        autoFocus
        autoComplete="off"
        spellCheck={false}
      />
      <span className="animate-pulse text-green-400">▌</span>
    </div>
  );
}
