'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Terminal from '@/components/terminal/Terminal';
import SidePanel, { PanelTab } from '@/components/SidePanel';
import { useGame } from '@/hooks/useGame';

export default function Home() {
  const {
    lines, handleCommand, startGame, isStreaming,
    userName, roomName, currentRoom,
    copyCurrentRoom, exportAll, exportCardPng, hasAiContent, hasAnyAiContent,
  } = useGame();
  const initialized = useRef(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<PanelTab>('guide');
  const [showExportDialog, setShowExportDialog] = useState(false);

  const openPanel = useCallback((tab: PanelTab) => {
    setPanelTab(tab);
    setSidePanelOpen(true);
  }, []);
  const closePanel = useCallback(() => setSidePanelOpen(false), []);

  const handleExportClick = useCallback(() => {
    setShowExportDialog(true);
  }, []);

  const handleExportTxt = useCallback(async () => {
    setShowExportDialog(false);
    await exportAll();
  }, [exportAll]);

  const handleExportPng = useCallback(async () => {
    setShowExportDialog(false);
    await exportCardPng();
  }, [exportCardPng]);

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
        showCopy={hasAiContent && !isStreaming}
        onCopy={copyCurrentRoom}
      />

      {/* 상단 우측 버튼들 — CRT 밖에 렌더링 */}
      {!sidePanelOpen && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          {hasAnyAiContent && (
            <PanelButton onClick={handleExportClick} aria-label="전체 내보내기">
              <span className="text-[12px]">내보내기</span>
            </PanelButton>
          )}
          <PanelButton onClick={() => openPanel('glossary')} aria-label="용어 사전 열기">
            <span className="text-[12px]">용어 사전</span>
          </PanelButton>
          <PanelButton onClick={() => openPanel('guide')} aria-label="도움말 열기">
            <span>?</span>
            <span className="text-[12px] text-[#8A6618]">도움말</span>
          </PanelButton>
        </div>
      )}

      {/* 내보내기 확인 팝업 */}
      {showExportDialog && (
        <ExportDialog
          onExportTxt={handleExportTxt}
          onExportPng={handleExportPng}
          onCancel={() => setShowExportDialog(false)}
        />
      )}

      <SidePanel isOpen={sidePanelOpen} onClose={closePanel} activeTab={panelTab} onTabChange={setPanelTab} />

      <DungeonMap currentRoom={currentRoom} />
    </main>
  );
}

function PanelButton({ onClick, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 flex items-center gap-1.5 rounded border border-[#8A6618] bg-[#080600] text-[#D4A020] hover:bg-[#1a1400] hover:border-[#D4A020] transition-colors text-sm terminal-glow-strong"
      {...props}
    >
      {children}
    </button>
  );
}

function ExportDialog({ onExportTxt, onExportPng, onCancel }: {
  onExportTxt: () => void;
  onExportPng: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative z-10 w-80 rounded border border-[#2a1e08] bg-[#0c0a02] p-6 font-['D2Coding',_monospace] shadow-lg"
        style={{ boxShadow: '0 0 30px rgba(212, 160, 32, 0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-[#D4A020] text-sm mb-3 terminal-glow-strong">내보내기</h3>
        <p className="text-[#8A7848] text-[12px] leading-relaxed mb-5">
          사주 풀이를 내보낼 형식을 선택하세요.
        </p>
        <div className="flex flex-col gap-2 mb-4">
          <button
            onClick={onExportPng}
            className="w-full px-4 py-2.5 rounded border border-[#D4A020] bg-[#1a1400] text-left hover:bg-[#2a2000] transition-colors"
          >
            <span className="text-[#D4A020] text-[12px] terminal-glow-strong block">사주 카드 (PNG)</span>
            <span className="text-[#8A6618] text-[11px] block mt-0.5">
              12지 동물 + 현자의 한마디 카드 이미지
            </span>
          </button>
          <button
            onClick={onExportTxt}
            className="w-full px-4 py-2.5 rounded border border-[#2a1e08] text-left hover:border-[#8A6618] transition-colors"
          >
            <span className="text-[#8A7848] text-[12px] block">전체 풀이 (TXT)</span>
            <span className="text-[#8A6618] text-[11px] block mt-0.5">
              모든 방의 풀이를 텍스트 파일로 다운로드
            </span>
          </button>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded border border-[#2a1e08] text-[#8A6618] text-[12px] hover:border-[#8A6618] hover:text-[#D4A020] transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

const ROOM_HIGHLIGHTS: Record<string, string> = {
  synthesis: '종합',
  detail: '상세',
  luck: '운세',
  compatibility: '궁합',
};

function DungeonMap({ currentRoom }: { currentRoom?: string }) {
  if (!currentRoom || currentRoom === 'entrance') return null;

  const mapLines = [
    '  [상세]───[운세]',
    '     \\     /',
    '     [종합]',
    '        \\',
    '        [궁합]',
  ];

  const highlightName = ROOM_HIGHLIGHTS[currentRoom];

  return (
    <div className="fixed bottom-4 left-4 z-50 dungeon-map hidden md:block">
      <div className="px-3 py-2 rounded border border-[#2a1e08] bg-[#080600]/90 backdrop-blur-sm">
        <div className="text-[10px] text-[#8A6618] mb-1 tracking-wider">MAP</div>
        {mapLines.map((line, i) => (
          <div key={i} className="whitespace-pre font-['D2Coding',_monospace]">
            {highlightName && line.includes(`[${highlightName}]`) ? (
              <>
                {line.split(`[${highlightName}]`).map((part, j, arr) => (
                  <span key={j}>
                    <span className="text-[#8A6618]">{part}</span>
                    {j < arr.length - 1 && (
                      <span className="text-[#FFD060] font-bold" style={{ textShadow: '0 0 6px rgba(212, 160, 32, 0.4)' }}>
                        [{highlightName}]
                      </span>
                    )}
                  </span>
                ))}
              </>
            ) : (
              <span className="text-[#8A6618]">{line}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
