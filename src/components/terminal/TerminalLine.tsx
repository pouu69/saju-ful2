'use client';

import { ReactNode } from 'react';
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

/**
 * 텍스트에서 강조 패턴을 찾아 색상 처리한다.
 * - "따옴표" → 노란색 강조
 * - ━━━ 제목 ━━━ → 시안 강조
 * - ═══ 구분선 → 시안 강조
 * - 오행 한자 (木火土金水) → 각 오행 색상
 */
function highlightText(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // "따옴표" 강조
    const qReg = /^([\s\S]*?)\u201c([^\u201d]+)\u201d|^([\s\S]*?)"([^"]+)"/;
    const quoteMatch = remaining.match(qReg);
    if (quoteMatch) {
      const before = quoteMatch[1] ?? quoteMatch[3] ?? '';
      const word = quoteMatch[2] ?? quoteMatch[4] ?? '';
      if (before) {
        parts.push(<span key={key++}>{highlightSpecial(before)}</span>);
      }
      parts.push(
        <span key={key++} className="text-[#ffcc00] terminal-glow-strong">
          {'\u201c'}{word}{'\u201d'}
        </span>
      );
      remaining = remaining.slice((before + '"' + word + '"').length);
      continue;
    }

    // 나머지는 특수 하이라이트만 적용
    parts.push(<span key={key++}>{highlightSpecial(remaining)}</span>);
    break;
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

/**
 * 오행 한자, 구분선 등 특수 패턴 강조
 */
function highlightSpecial(text: string): ReactNode {
  const parts: ReactNode[] = [];
  // 오행 한자 + 괄호 패턴: 목(木), 화(火), 토(土), 금(金), 수(水)
  const regex = /(목\(木\)|화\(火\)|토\(土\)|금\(金\)|수\(水\)|━+[^━]+━+|═{3,})/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const m = match[0];
    if (m.includes('목(木)')) {
      parts.push(<span key={`s${match.index}`} className="text-[#44cc44]">{m}</span>);
    } else if (m.includes('화(火)')) {
      parts.push(<span key={`s${match.index}`} className="text-[#ff6644]">{m}</span>);
    } else if (m.includes('토(土)')) {
      parts.push(<span key={`s${match.index}`} className="text-[#ccaa44]">{m}</span>);
    } else if (m.includes('금(金)')) {
      parts.push(<span key={`s${match.index}`} className="text-[#dddddd]">{m}</span>);
    } else if (m.includes('수(水)')) {
      parts.push(<span key={`s${match.index}`} className="text-[#4488ff]">{m}</span>);
    } else {
      // 구분선 (━━━, ═══)
      parts.push(<span key={`s${match.index}`} className="text-[#00aaaa]">{m}</span>);
    }

    lastIndex = match.index + m.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

export default function TerminalLine({ line, onTypingComplete }: TerminalLineProps) {
  const styleClass = line.color || TYPE_STYLES[line.type] || 'text-[#00dd38]';

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

  // ascii, input 타입은 하이라이트 안함
  const skipHighlight = line.type === 'ascii' || line.type === 'input' || line.type === 'error';

  return (
    <div className={`whitespace-pre-wrap line-enter ${styleClass}`}>
      {skipHighlight ? line.text : highlightText(line.text)}
    </div>
  );
}
