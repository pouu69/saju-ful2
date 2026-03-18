'use client';

import { useEffect, useRef } from 'react';
import Terminal from '@/components/terminal/Terminal';
import SidePanel from '@/components/SidePanel';
import { useGame } from '@/hooks/useGame';

export default function Home() {
  const { lines, handleCommand, startGame, isStreaming, userName, roomName } = useGame();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      startGame();
    }
  }, [startGame]);

  return (
    <main>
      <Terminal
        lines={lines}
        onCommand={handleCommand}
        inputDisabled={isStreaming}
        inputPrompt=">"
        userName={userName}
        roomName={roomName}
      />
      <SidePanel />
    </main>
  );
}
