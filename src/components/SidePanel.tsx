'use client';

import { useState, useMemo } from 'react';

export type PanelTab = 'guide' | 'glossary';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
}

export default function SidePanel({ isOpen, onClose, activeTab, onTabChange }: SidePanelProps) {
  return (
    <>
      {/* 패널 */}
      <div
        className={`fixed top-0 right-0 z-40 h-full w-80 bg-[#080600] border-l border-[#2a1e08] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full font-['D2Coding',_monospace]">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-[#D4A020] text-base terminal-glow-strong">
              {activeTab === 'guide' ? '도움말' : '용어 사전'}
            </h2>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded border border-[#2a1e08] text-[#8A6618] hover:text-[#D4A020] hover:border-[#8A6618] transition-colors text-sm"
              aria-label="패널 닫기"
            >
              ✕
            </button>
          </div>

          {/* 탭 */}
          <div className="flex px-5 gap-1 mb-3">
            <TabButton active={activeTab === 'guide'} onClick={() => onTabChange('guide')}>
              안내
            </TabButton>
            <TabButton active={activeTab === 'glossary'} onClick={() => onTabChange('glossary')}>
              용어 사전
            </TabButton>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-5 pb-5 text-[13px] leading-relaxed">
            {activeTab === 'guide' ? <GuideTab /> : <GlossaryTab />}
          </div>
        </div>
      </div>

      {/* 배경 오버레이 (모바일) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-[12px] rounded border transition-colors ${
        active
          ? 'border-[#D4A020] bg-[#1a1400] text-[#D4A020] terminal-glow-strong'
          : 'border-[#2a1e08] text-[#8A6618] hover:border-[#8A6618] hover:text-[#D4A020]'
      }`}
    >
      {children}
    </button>
  );
}

/* ── 안내 탭 ── */
function GuideTab() {
  return (
    <>
      <Section title="사주 풀이란?">
        사주(四柱)는 태어난 연/월/일/시의 네 기둥으로 운명을 읽는 한국 전통 명리학입니다.
        각 기둥은 천간(天干)과 지지(地支)로 이루어져 있으며, 이를 통해 성격, 적성, 운의 흐름을 파악합니다.
      </Section>

      <Section title="진행 방법">
        <Step n="1">이름을 입력합니다</Step>
        <Step n="2">생년월일을 입력합니다 (예: 1990-03-15)</Step>
        <Step n="3">양력/음력을 선택합니다</Step>
        <Step n="4">태어난 시간을 입력합니다 (모르면 &quot;모름&quot;)</Step>
        <Step n="5">성별을 입력합니다 (남/여)</Step>
        <Step n="6">각 방을 번호로 선택하여 탐험합니다</Step>
      </Section>

      <Section title="방 안내">
        <Room emoji="📜" name="종합 풀이" desc="사주 전체 개요 (메인)" />
        <Room emoji="🔮" name="사주 상세" desc="오행·십성·원국 깊이 분석" />
        <Room emoji="🌊" name="운세의 방" desc="대운/세운 흐름" />
        <Room emoji="💑" name="궁합의 방" desc="두 사람의 궁합 분석" />
      </Section>

      <Section title="명령어">
        <Cmd cmd="1, 2, 3..." desc="방 선택 (번호)" />
        <Cmd cmd="동/서/남/북" desc="방향으로 이동" />
        <Cmd cmd="이전" desc="입력 단계 되돌리기" />
        <Cmd cmd="새로" desc="처음부터 새 풀이" />
        <Cmd cmd="보기" desc="현재 방 다시 보기" />
        <Cmd cmd="도움" desc="도움말 표시" />
      </Section>

      <div className="mt-6 pt-4 border-t border-[#2a1e08] text-[#8A6618] text-[11px]">
        사주는 참고일 뿐, 운명은 스스로 만들어가는 것입니다.
      </div>
    </>
  );
}

/* ── 용어 데이터 ── */
interface TermData {
  name: string;
  desc: string;
  color?: string;
  group?: string;
}

interface SectionData {
  title: string;
  terms: TermData[];
}

const GLOSSARY_DATA: SectionData[] = [
  {
    title: '사주 기본 구조',
    terms: [
      { name: '사주(四柱)', desc: '연주·월주·일주·시주, 네 개의 기둥. 각각 태어난 연·월·일·시를 나타냅니다.' },
      { name: '천간(天干)', desc: '갑·을·병·정·무·기·경·신·임·계. 10개의 하늘 기운으로, 외적 성향과 의지를 나타냅니다.' },
      { name: '지지(地支)', desc: '자·축·인·묘·진·사·오·미·신·유·술·해. 12개의 땅 기운으로, 내면과 환경을 나타냅니다.' },
      { name: '일간(日干)', desc: "일주의 천간. 사주에서 '나 자신'을 대표하는 가장 핵심적인 글자입니다." },
    ],
  },
  {
    title: '오행(五行)',
    terms: [
      { name: '목(木)', desc: '나무의 기운. 성장, 시작, 인자함. 간·담·눈 관장. 봄, 동쪽.', color: 'text-green-400' },
      { name: '화(火)', desc: '불의 기운. 열정, 표현, 예의. 심장·소장 관장. 여름, 남쪽.', color: 'text-red-400' },
      { name: '토(土)', desc: '흙의 기운. 안정, 신뢰, 중재. 위장·비장 관장. 환절기, 중앙.', color: 'text-yellow-400' },
      { name: '금(金)', desc: '쇠의 기운. 결단, 정의, 완벽. 폐·대장 관장. 가을, 서쪽.', color: 'text-gray-300' },
      { name: '수(水)', desc: '물의 기운. 지혜, 유연, 적응. 신장·방광 관장. 겨울, 북쪽.', color: 'text-blue-400' },
    ],
  },
  {
    title: '오행의 관계',
    terms: [
      { name: '상생(相生)', desc: '서로 살리는 관계. 목→화→토→금→수→목 순서로 생(生)합니다.' },
      { name: '상극(相剋)', desc: '서로 제어하는 관계. 목→토→수→화→금→목 순서로 극(剋)합니다.' },
    ],
  },
  {
    title: '십성(十星)',
    terms: [
      { name: '비견(比肩)', desc: '나와 같은 기운. 독립심, 자존심, 경쟁심. 형제·동료·라이벌의 관계.', group: '비겁(比劫) — 나와 같은 오행' },
      { name: '겁재(劫財)', desc: '나와 음양만 다른 기운. 추진력, 승부욕, 모험. 강한 욕심과 도전정신.', group: '비겁(比劫) — 나와 같은 오행' },
      { name: '식신(食神)', desc: '나로부터 태어난 순한 기운. 먹고 즐기는 풍요, 콘텐츠, 표현력. 여유로운 재능.', group: '식상(食傷) — 내가 생(生)하는 오행' },
      { name: '상관(傷官)', desc: '나로부터 태어난 날카로운 기운. 창의력, 반골, 혁신. 기존 틀을 깨는 힘.', group: '식상(食傷) — 내가 생(生)하는 오행' },
      { name: '편재(偏財)', desc: '유동적인 재물. 사교력, 투자, 사업 수완. 여러 수입원을 다루는 능력.', group: '재성(財星) — 내가 극(剋)하는 오행' },
      { name: '정재(正財)', desc: '안정적인 재물. 근면, 저축, 꾸준한 수입. 성실하게 모으는 재물.', group: '재성(財星) — 내가 극(剋)하는 오행' },
      { name: '편관(偏官)', desc: '강한 통제·권위. 리더십, 결단력, 도전. 위기에 강하나 스트레스에 주의.', group: '관성(官星) — 나를 극(剋)하는 오행' },
      { name: '정관(正官)', desc: '바른 통제·명예. 체계, 책임감, 사회적 지위. 규칙을 중시하는 성향.', group: '관성(官星) — 나를 극(剋)하는 오행' },
      { name: '편인(偏印)', desc: '비범한 학문·영감. 독특한 사고, 기술력, 전문성. 남다른 길을 가는 힘.', group: '인성(印星) — 나를 생(生)하는 오행' },
      { name: '정인(正印)', desc: '정통 학문·지혜. 학습 능력, 멘토, 자격증. 배움으로 성장하는 힘.', group: '인성(印星) — 나를 생(生)하는 오행' },
    ],
  },
  {
    title: '12운성(十二運星)',
    terms: [
      { name: '장생(長生)', desc: '새 생명의 탄생. 시작의 에너지, 낙관적.' },
      { name: '목욕(沐浴)', desc: '세상에 첫 발. 변화가 많고, 감정 기복.' },
      { name: '관대(冠帶)', desc: '성인식. 자신감, 사회진출, 의욕 충만.' },
      { name: '건록(建祿)', desc: '왕성한 활동기. 실력 발휘, 독립.' },
      { name: '제왕(帝旺)', desc: '정점. 최고의 역량이나 고집도 강함.' },
      { name: '쇠(衰)', desc: '전환기 시작. 경험을 살려 안정 추구.' },
      { name: '병(病)', desc: '에너지 하락. 쉬어가며 내면 성찰.' },
      { name: '사(死)', desc: '마무리와 정리. 끝내야 할 것을 끝냄.' },
      { name: '묘(墓)', desc: '저장과 축적. 숨은 자산, 내공 쌓기.' },
      { name: '절(絶)', desc: '완전한 리셋. 새로운 가능성의 씨앗.' },
      { name: '태(胎)', desc: '잉태. 새로운 계획이 싹트는 시기.' },
      { name: '양(養)', desc: '양육기. 천천히 준비하며 기다림.' },
    ],
  },
  {
    title: '기타 용어',
    terms: [
      { name: '대운(大運)', desc: '10년 단위로 바뀌는 큰 운의 흐름. 인생의 계절과 같습니다.' },
      { name: '세운(歲運)', desc: '매년 바뀌는 운. 그 해의 분위기와 기회를 나타냅니다.' },
      { name: '공망(空亡)', desc: '비어있는 기운. 해당 영역에서 허무함이나 예상 밖의 전개가 일어날 수 있습니다.' },
      { name: '신살(神殺)', desc: '특수한 기운의 조합. 역마살(이동), 도화살(매력), 화개살(학문/예술) 등.' },
    ],
  },
];

/* ── 용어 사전 탭 ── */
function GlossaryTab() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return null; // null = 전체 표시
    const q = query.trim().toLowerCase();
    return GLOSSARY_DATA.map(section => ({
      ...section,
      terms: section.terms.filter(
        t => t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
      ),
    })).filter(section => section.terms.length > 0);
  }, [query]);

  const sections = filtered ?? GLOSSARY_DATA;

  return (
    <>
      {/* 검색 */}
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="용어 검색 (예: 비견, 오행, 대운)"
          className="w-full px-3 py-1.5 rounded border border-[#2a1e08] bg-[#080600] text-[#D4A020] text-[12px] placeholder-[#5a4010] focus:border-[#8A6618] focus:outline-none transition-colors"
        />
      </div>

      {sections.length === 0 ? (
        <div className="text-[#8A6618] text-[12px] py-4">
          &quot;{query}&quot;에 해당하는 용어가 없습니다.
        </div>
      ) : (
        sections.map(section => {
          // 십성 섹션은 그룹별로 묶어서 표시
          const hasGroups = section.terms.some(t => t.group);
          if (hasGroups) {
            const groups: Record<string, TermData[]> = {};
            for (const t of section.terms) {
              const g = t.group || '';
              if (!groups[g]) groups[g] = [];
              groups[g].push(t);
            }
            return (
              <Section key={section.title} title={section.title}>
                {Object.entries(groups).map(([groupName, terms]) => (
                  <GlossaryGroup key={groupName} title={groupName}>
                    {terms.map(t => (
                      <Term key={t.name} name={t.name} desc={t.desc} color={t.color} />
                    ))}
                  </GlossaryGroup>
                ))}
              </Section>
            );
          }
          return (
            <Section key={section.title} title={section.title}>
              {section.terms.map(t => (
                <Term key={t.name} name={t.name} desc={t.desc} color={t.color} />
              ))}
            </Section>
          );
        })
      )}

      {!query && (
        <div className="mt-6 pt-4 border-t border-[#2a1e08] text-[#8A6618] text-[11px]">
          풀이에서 모르는 용어가 나오면 여기서 확인하세요.
        </div>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-[#48B8A8] text-[12px] tracking-wider uppercase mb-2">{title}</h3>
      <div className="text-[#A08028]">{children}</div>
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
        <span className="text-[#8A6618]"> — {desc}</span>
      </div>
    </div>
  );
}

function Cmd({ cmd, desc }: { cmd: string; desc: string }) {
  return (
    <div className="flex gap-2 mb-1">
      <span className="text-[#cccc00] shrink-0 w-20">{cmd}</span>
      <span className="text-[#8A6618]">{desc}</span>
    </div>
  );
}

function Term({ name, desc, color }: { name: string; desc: string; color?: string }) {
  return (
    <div className="mb-2">
      <span className={`${color || 'text-[#cccc00]'} font-bold`}>{name}</span>
      <p className="text-[#A08028] text-[12px] mt-0.5 leading-snug">{desc}</p>
    </div>
  );
}

function GlossaryGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-[#48B8A8] text-[11px] mb-1.5 tracking-wide">{title}</div>
      <div className="pl-2 border-l border-[#2a1e08]">{children}</div>
    </div>
  );
}
