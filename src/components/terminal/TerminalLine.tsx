'use client';

import TypingEffect from './TypingEffect';

export interface LineData {
  id: string;
  text: string;
  type: 'text' | 'system' | 'ascii' | 'error' | 'prompt' | 'input' | 'streaming';
  color?: string;
  typing?: boolean;
}

interface TerminalLineProps {
  line: LineData;
  onTypingComplete?: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  text: 'text-green-400',
  system: 'text-cyan-400',
  ascii: 'text-green-300',
  error: 'text-red-400',
  prompt: 'text-yellow-400',
  input: 'text-white',
  streaming: 'text-green-300',
};

export default function TerminalLine({ line, onTypingComplete }: TerminalLineProps) {
  const colorClass = line.color || TYPE_COLORS[line.type] || 'text-green-400';

  if (line.typing) {
    return (
      <div className={`whitespace-pre-wrap ${colorClass}`}>
        <TypingEffect text={line.text} speed={20} onComplete={onTypingComplete} />
      </div>
    );
  }

  return (
    <div className={`whitespace-pre-wrap ${colorClass}`}>
      {line.text}
    </div>
  );
}
