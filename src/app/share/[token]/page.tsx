import { decodeShareToken, type ShareTokenData } from '@/lib/share/tokenCodec';
import { calculateFullSaju } from '@/lib/saju/calculator';
import { generateShareSummary } from '@/lib/ai/templates';
import { ELEMENT_HEX, ELEMENT_NAMES } from '@/lib/saju/constants';
import type { BirthInfo, FiveElement } from '@/lib/saju/types';
import type { Metadata } from 'next';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

const SITE_URL = 'https://main.d2myeapn5r14dx.amplifyapp.com';

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const data = decodeShareToken(token);
  if (!data) return { title: '사주명리의 미궁' };

  try {
    const saju = calculateFullSaju(buildBirthInfoFromToken(data));
    const summary = generateShareSummary(saju);
    const title = `${summary.zodiacLabel} · ${summary.dayMasterTheme}`;
    const description = `${summary.elementKeyword}의 기운 — "${summary.dayMasterMetaphor}" 나도 사주카드 받아보기`;
    const url = `${SITE_URL}/share/${token}`;

    return {
      title,
      description,
      openGraph: {
        type: 'article',
        siteName: '사주명리의 미궁',
        title,
        description,
        url,
        locale: 'ko_KR',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    };
  } catch {
    return { title: '사주명리의 미궁' };
  }
}

const ELEMENT_KOREAN: Record<string, string> = {
  wood: '나무', fire: '불', earth: '흙', metal: '쇠', water: '물',
};

const ANIMAL_EMOJI: Record<string, string> = {
  '쥐': '🐭', '소': '🐄', '호랑이': '🐯', '토끼': '🐰',
  '용': '🐉', '뱀': '🐍', '말': '🐎', '양': '🐑',
  '원숭이': '🐒', '닭': '🐓', '개': '🐕', '돼지': '🐖',
};

function buildBirthInfoFromToken(data: ShareTokenData): BirthInfo {
  return {
    name: '',
    year: data.year,
    month: data.month,
    day: data.day,
    hour: data.hour,
    minute: 0,
    gender: data.gender,
    calendarType: data.calendarType,
    maritalStatus: 'etc' as const,
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const data = decodeShareToken(token);

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <div className="text-[#FF5544] font-mono text-sm mb-4">유효하지 않은 링크입니다</div>
          <a href="/" className="text-[#D4A020] font-mono text-sm underline">홈으로 돌아가기</a>
        </div>
      </main>
    );
  }

  let saju;
  try {
    saju = calculateFullSaju(buildBirthInfoFromToken(data));
  } catch {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <div className="text-[#FF5544] font-mono text-sm mb-4">사주 계산에 실패했습니다</div>
          <a href="/" className="text-[#D4A020] font-mono text-sm underline">홈으로 돌아가기</a>
        </div>
      </main>
    );
  }

  const summary = generateShareSummary(saju);
  const pillars = [
    { label: '년', pillar: saju.yearPillar },
    { label: '월', pillar: saju.monthPillar },
    { label: '일', pillar: saju.dayPillar },
    { label: '시', pillar: saju.hourPillar },
  ];

  const dominantColor = ELEMENT_HEX[summary.dominantElement];
  const deficientColor = ELEMENT_HEX[summary.deficientElement];

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-[#8A6618] font-mono text-[10px] tracking-[3px] mb-2">四柱命理의 미궁</div>
        <div className="text-[#D4A020] font-mono text-sm">{summary.zodiacLabel}의 사주</div>
      </div>

      {/* Card */}
      <div
        className="rounded-xl px-5 py-5 text-center mb-8 w-full max-w-[200px]"
        style={{
          background: 'linear-gradient(145deg, #1a1200, #2a1e08)',
          border: '1px solid #D4A020',
          boxShadow: '0 0 40px rgba(212,160,32,0.4), 0 12px 32px rgba(0,0,0,0.7)',
        }}
      >
        <div className="text-[#FFD060] font-mono text-[9px] tracking-widest mb-3">龍 ══ 사주명리 ══ 鳳</div>
        <div className="text-4xl mb-3">{ANIMAL_EMOJI[saju.yearPillar.branch.animal] ?? ''}</div>

        {/* 4-pillar color grid */}
        <div className="grid grid-cols-4 gap-1 mb-3">
          {pillars.map(({ label, pillar }) => {
            const el: FiveElement = pillar?.stem.element ?? 'earth';
            const color = ELEMENT_HEX[el];
            return (
              <div
                key={label}
                className="rounded flex flex-col items-center py-1.5"
                style={{
                  background: `color-mix(in srgb, ${color} 15%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
                }}
              >
                <span className="font-mono text-sm font-bold" style={{ color }}>
                  {pillar?.stem.hanja ?? '?'}
                </span>
                <span className="font-mono text-[9px]" style={{ color }}>{ELEMENT_NAMES[el].hanja}</span>
                <span className="font-mono text-[8px] text-[#555]">{label}</span>
              </div>
            );
          })}
        </div>

        <div
          className="font-mono text-[9px] italic pt-2"
          style={{ color: '#8A6618', borderTop: '1px solid #2a1e08' }}
        >
          {summary.dayMasterMetaphor}
        </div>
      </div>

      {/* Teaser sections */}
      <div className="w-full max-w-sm space-y-3 mb-8">

        {/* 오행 성향 */}
        <div
          className="rounded-lg p-4"
          style={{ background: 'rgba(212,160,32,0.06)', border: '1px solid rgba(212,160,32,0.15)' }}
        >
          <div className="mb-1">
            <span className="text-[#D4A020] font-mono text-xs font-bold">오행 성향</span>
          </div>
          <div className="text-[#FFD060] font-mono text-sm font-bold">{summary.elementKeyword}</div>
          <div className="text-[#8A6618] font-mono text-xs mt-1 leading-relaxed">{summary.elementDesc}</div>
        </div>

        {/* 일간 테마 */}
        <div
          className="rounded-lg p-4"
          style={{ background: 'rgba(212,160,32,0.06)', border: '1px solid rgba(212,160,32,0.15)' }}
        >
          <div className="mb-1">
            <span className="text-[#D4A020] font-mono text-xs font-bold">일간 성격</span>
          </div>
          <div className="text-[#FFD060] font-mono text-sm font-bold">{summary.dayMasterTheme}</div>
          <div className="text-[#8A6618] font-mono text-xs mt-1">{summary.dayMasterMetaphor}</div>
        </div>

        {/* 오행 균형 */}
        <div
          className="rounded-lg p-4"
          style={{ background: 'rgba(212,160,32,0.06)', border: '1px solid rgba(212,160,32,0.15)' }}
        >
          <div className="mb-2">
            <span className="text-[#D4A020] font-mono text-xs font-bold">오행 균형</span>
          </div>
          <div className="flex gap-4 text-xs font-mono">
            <div>
              <span className="text-[#8A6618]">강한 기운 </span>
              <span style={{ color: dominantColor }}>
                {ELEMENT_NAMES[summary.dominantElement].hanja} {ELEMENT_KOREAN[summary.dominantElement]}
              </span>
            </div>
            <div>
              <span className="text-[#8A6618]">부족한 기운 </span>
              <span style={{ color: deficientColor }}>
                {ELEMENT_NAMES[summary.deficientElement].hanja} {ELEMENT_KOREAN[summary.deficientElement]}
              </span>
            </div>
          </div>
        </div>

        {/* 12간지 */}
        <div
          className="rounded-lg p-4"
          style={{ background: 'rgba(212,160,32,0.06)', border: '1px solid rgba(212,160,32,0.15)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{ANIMAL_EMOJI[saju.yearPillar.branch.animal] ?? ''}</span>
            <span className="text-[#D4A020] font-mono text-xs font-bold">12간지</span>
          </div>
          <div className="text-[#FFD060] font-mono text-sm font-bold">{saju.yearPillar.branch.animal}띠</div>
          <div className="text-[#8A6618] font-mono text-xs mt-1">{summary.animalDetail}</div>
        </div>

        {/* 십성 */}
        <div
          className="rounded-lg p-4"
          style={{ background: 'rgba(212,160,32,0.06)', border: '1px solid rgba(212,160,32,0.15)' }}
        >
          <div className="mb-1">
            <span className="text-[#D4A020] font-mono text-xs font-bold">주요 십성</span>
          </div>
          <div className="text-[#FFD060] font-mono text-sm font-bold">{summary.topTenGods}</div>
          <div className="text-[#8A6618] font-mono text-xs mt-1">사주의 핵심 에너지 분포</div>
        </div>

        {/* 현자의 한마디 */}
        <div
          className="rounded-lg p-4 text-center"
          style={{ background: 'rgba(212,160,32,0.06)', border: '1px solid rgba(212,160,32,0.15)' }}
        >
          <div className="mb-2">
            <span className="text-[#D4A020] font-mono text-xs font-bold">현자의 한마디</span>
          </div>
          <div className="text-[#8A6618] font-mono text-xs leading-relaxed italic">
            &ldquo;{summary.wisdomQuote}&rdquo;
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 w-full max-w-sm mb-6">
        <div className="flex-1 h-px" style={{ background: '#1a1500' }} />
        <span className="text-[#555] font-mono text-xs">당신의 사주는?</span>
        <div className="flex-1 h-px" style={{ background: '#1a1500' }} />
      </div>

      {/* CTA */}
      <a
        href="/"
        className="w-full max-w-sm block text-center py-4 rounded-xl font-mono text-base font-bold text-[#080600] no-underline"
        style={{
          background: 'linear-gradient(135deg, #D4A020, #FFD060)',
          boxShadow: '0 4px 16px rgba(212,160,32,0.4)',
        }}
      >
        나도 카드 받기 ✦
      </a>
      <div className="text-[#555] font-mono text-xs mt-2">무료 · 1분 소요</div>
    </main>
  );
}
