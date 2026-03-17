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

const TYPE_STYLES: Record<string, string> = {
  text: 'text-[#00dd38]',
  system: 'text-[#00cccc] terminal-glow-strong',
  ascii: 'text-[#00ee44]',
  error: 'text-[#ff4444] terminal-glow-strong',
  prompt: 'text-[#cccc00]',
  input: 'text-[#e0e0e0] opacity-70',
  streaming: 'text-[#00dd38]',
};

export default function TerminalLine({ line, onTypingComplete }: TerminalLineProps) {
  const styleClass = line.color || TYPE_STYLES[line.type] || 'text-[#00dd38]';

  // 빈 줄은 간격용
  if (!line.text && !line.typing) {
    return <div className="h-3" />;
  }

  if (line.typing) {
    return (
      <div className={`whitespace-pre-wrap line-enter ${styleClass}`}>
        <TypingEffect text={line.text} speed={20} onComplete={onTypingComplete} />
      </div>
    );
  }

  return (
    <div className={`whitespace-pre-wrap line-enter ${styleClass}`}>
      {line.text}
    </div>
  );
}
