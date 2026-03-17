'use client';

import { useState, useCallback, useRef } from 'react';
import { LineData } from '@/components/terminal/TerminalLine';

let lineCounter = 0;
function nextId(): string {
  return `line-${++lineCounter}`;
}

export function useTerminal() {
  const [lines, setLines] = useState<LineData[]>([]);

  // useRef로 감싸서 콜백 안정성 확보 (의존성 체인 무한루프 방지)
  const setLinesRef = useRef(setLines);
  setLinesRef.current = setLines;

  const addLine = useCallback((text: string, type: LineData['type'] = 'text', options?: { color?: string; typing?: boolean }) => {
    const line: LineData = {
      id: nextId(),
      text,
      type,
      color: options?.color,
      typing: options?.typing,
    };
    setLinesRef.current(prev => [...prev, line]);
    return line.id;
  }, []);

  const addLines = useCallback((texts: string[], type: LineData['type'] = 'text', color?: string) => {
    const newLines: LineData[] = texts.map(text => ({
      id: nextId(),
      text,
      type,
      color,
    }));
    setLinesRef.current(prev => [...prev, ...newLines]);
  }, []);

  const appendToLine = useCallback((lineId: string, text: string) => {
    setLinesRef.current(prev =>
      prev.map(line =>
        line.id === lineId ? { ...line, text: line.text + text } : line
      )
    );
  }, []);

  const clear = useCallback(() => {
    setLinesRef.current([]);
    lineCounter = 0;
  }, []);

  return { lines, addLine, addLines, appendToLine, clear };
}
