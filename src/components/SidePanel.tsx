'use client';

import { useState } from 'react';

export default function SidePanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 토글 버튼 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 right-4 z-50 px-3 py-1.5 flex items-center gap-1.5 rounded border border-[#00aa2a] bg-[#0a0a0a] text-[#00ff41] hover:bg-[#0f1a0f] hover:border-[#00ff41] transition-colors text-sm terminal-glow-strong"
          aria-label="도움말 열기"
        >
          <span>?</span>
          <span className="text-[12px] text-[#00aa2a]">도움말</span>
        </button>
      )}

      {/* 패널 */}
      <div
        className={`fixed top-0 right-0 z-40 h-full w-72 bg-[#080a08] border-l border-[#1a3a1a] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-5 pt-5 h-full overflow-y-auto scrollbar-thin text-[13px] leading-relaxed font-['D2Coding',_monospace]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#00ff41] text-base terminal-glow-strong">
              사주명리의 미궁
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded border border-[#1a3a1a] text-[#00aa2a] hover:text-[#00ff41] hover:border-[#00aa2a] transition-colors text-sm"
              aria-label="도움말 닫기"
            >
              ✕
            </button>
          </div>

          <Section title="사주 풀이란?">
            사주(四柱)는 태어난 연/월/일/시의 네 기둥으로 운명을 읽는 한국 전통 명리학입니다.
            각 기둥은 천간(天干)과 지지(地支)로 이루어져 있으며, 이를 통해 성격, 적성, 운의 흐름을 파악합니다.
          </Section>

          <Section title="진행 방법">
            <Step n="1">이름을 입력합니다</Step>
            <Step n="2">생년월일을 입력합니다 (예: 1990-03-15)</Step>
            <Step n="3">태어난 시간을 입력합니다 (모르면 &quot;모름&quot;)</Step>
            <Step n="4">성별을 입력합니다 (남/여)</Step>
            <Step n="5">각 방을 번호로 선택하여 탐험합니다</Step>
          </Section>

          <Section title="방 안내">
            <Room emoji="🔮" name="사주의 동굴" desc="사주팔자 개요" />
            <Room emoji="🌿" name="오행의 방" desc="목화토금수 균형 분석" />
            <Room emoji="⭐" name="십성의 방" desc="십성 관계 해석" />
            <Room emoji="🌊" name="운세의 방" desc="대운/세운 흐름" />
            <Room emoji="📜" name="종합 풀이" desc="모든 것을 종합한 풀이" />
          </Section>

          <Section title="명령어">
            <Cmd cmd="1, 2, 3..." desc="방 선택 (번호)" />
            <Cmd cmd="동/서/남/북" desc="방향으로 이동" />
            <Cmd cmd="이전" desc="입력 단계 되돌리기" />
            <Cmd cmd="새로" desc="처음부터 새 풀이" />
            <Cmd cmd="보기" desc="현재 방 다시 보기" />
            <Cmd cmd="도움" desc="도움말 표시" />
          </Section>

          <div className="mt-6 pt-4 border-t border-[#1a3a1a] text-[#00aa2a] text-[11px]">
            사주는 참고일 뿐, 운명은 스스로 만들어가는 것입니다.
          </div>
        </div>
      </div>

      {/* 배경 오버레이 (모바일) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-[#00cccc] text-[12px] tracking-wider uppercase mb-2">{title}</h3>
      <div className="text-[#00bb33]">{children}</div>
    </div>
  );
}

function Step({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 mb-1">
      <span className="text-[#cccc00] shrink-0">{n}.</span>
      <span>{children}</span>
    </div>
  );
}

function Room({ emoji, name, desc }: { emoji: string; name: string; desc: string }) {
  return (
    <div className="flex gap-2 mb-1.5">
      <span className="shrink-0">{emoji}</span>
      <div>
        <span className="text-[#cccc00]">{name}</span>
        <span className="text-[#00aa2a]"> — {desc}</span>
      </div>
    </div>
  );
}

function Cmd({ cmd, desc }: { cmd: string; desc: string }) {
  return (
    <div className="flex gap-2 mb-1">
      <span className="text-[#cccc00] shrink-0 w-20">{cmd}</span>
      <span className="text-[#00aa2a]">{desc}</span>
    </div>
  );
}
