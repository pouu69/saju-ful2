'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Terminal from '@/components/terminal/Terminal';
import SidePanel, { PanelTab } from '@/components/SidePanel';
import { useGame } from '@/hooks/useGame';

export default function Home() {
  const { lines, handleCommand, startGame, isStreaming, userName, roomName } = useGame();
  const initialized = useRef(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<PanelTab>('guide');

  const openPanel = useCallback((tab: PanelTab) => {
    setPanelTab(tab);
    setSidePanelOpen(true);
  }, []);
  const closePanel = useCallback(() => setSidePanelOpen(false), []);

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

      {/* 상단 우측 버튼들 — CRT 밖에 렌더링 */}
      {!sidePanelOpen && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <PanelButton onClick={() => openPanel('glossary')} aria-label="용어 사전 열기">
            <span className="text-[12px]">용어 사전</span>
          </PanelButton>
          <PanelButton onClick={() => openPanel('guide')} aria-label="도움말 열기">
            <span>?</span>
            <span className="text-[12px] text-[#00aa2a]">도움말</span>
          </PanelButton>
        </div>
      )}

      <SidePanel isOpen={sidePanelOpen} onClose={closePanel} activeTab={panelTab} onTabChange={setPanelTab} />
    </main>
  );
}

function PanelButton({ onClick, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 flex items-center gap-1.5 rounded border border-[#00aa2a] bg-[#0a0a0a] text-[#00ff41] hover:bg-[#0f1a0f] hover:border-[#00ff41] transition-colors text-sm terminal-glow-strong"
      {...props}
    >
      {children}
    </button>
  );
}
