'use client';

import { useState, useCallback } from 'react';
import { LineData } from '@/components/terminal/TerminalLine';

let lineCounter = 0;
function nextId(): string {
  return `line-${++lineCounter}`;
}

export function useTerminal() {
  const [lines, setLines] = useState<LineData[]>([]);

  const addLine = useCallback((text: string, type: LineData['type'] = 'text', options?: { color?: string; typing?: boolean }) => {
    const line: LineData = {
      id: nextId(),
      text,
      type,
      color: options?.color,
      typing: options?.typing,
    };
    setLines(prev => [...prev, line]);
    return line.id;
  }, []);

  const addLines = useCallback((texts: string[], type: LineData['type'] = 'text', color?: string) => {
    const newLines: LineData[] = texts.map(text => ({
      id: nextId(),
      text,
      type,
      color,
    }));
    setLines(prev => [...prev, ...newLines]);
  }, []);

  const appendToLine = useCallback((lineId: string, text: string) => {
    setLines(prev =>
      prev.map(line =>
        line.id === lineId ? { ...line, text: line.text + text } : line
      )
    );
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    lineCounter = 0;
  }, []);

  return { lines, addLine, addLines, appendToLine, clear };
}
