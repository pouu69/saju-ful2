'use client';

import { useEffect } from 'react';
import Terminal from '@/components/terminal/Terminal';
import { useGame } from '@/hooks/useGame';

export default function Home() {
  const { lines, handleCommand, startGame, isStreaming } = useGame();

  useEffect(() => {
    startGame();
  }, [startGame]);

  return (
    <main>
      <Terminal
        lines={lines}
        onCommand={handleCommand}
        inputDisabled={isStreaming}
        inputPrompt=">"
      />
    </main>
  );
}
