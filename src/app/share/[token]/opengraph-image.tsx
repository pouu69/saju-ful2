import { ImageResponse } from 'next/og';
import { decodeShareToken, type ShareTokenData } from '@/lib/share/tokenCodec';
import { calculateFullSaju } from '@/lib/saju/calculator';
import { generateShareSummary } from '@/lib/ai/templates';
import { ELEMENT_HEX, ELEMENT_NAMES } from '@/lib/saju/constants';
import type { BirthInfo, FiveElement } from '@/lib/saju/types';

export const runtime = 'edge';
export const alt = '사주명리의 미궁 — 나의 사주카드';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

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

export default async function OGImage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = decodeShareToken(token);

  if (!data) {
    return new ImageResponse(
      <FallbackImage />,
      { ...size },
    );
  }

  let saju;
  try {
    saju = calculateFullSaju(buildBirthInfoFromToken(data));
  } catch {
    return new ImageResponse(
      <FallbackImage />,
      { ...size },
    );
  }

  const summary = generateShareSummary(saju);
  const animal = saju.yearPillar.branch.animal;
  const emoji = ANIMAL_EMOJI[animal] ?? '';
  const dominantColor = ELEMENT_HEX[summary.dominantElement];
  const pillars = [
    { label: '년', pillar: saju.yearPillar },
    { label: '월', pillar: saju.monthPillar },
    { label: '일', pillar: saju.dayPillar },
    { label: '시', pillar: saju.hourPillar },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          background: '#080600',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'monospace',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Scanline overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 3px)',
            display: 'flex',
          }}
        />

        {/* Border */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            bottom: 16,
            border: '2px solid #D4A020',
            borderRadius: 8,
            display: 'flex',
          }}
        />

        {/* Left section — zodiac + pillars */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '45%',
            padding: '40px',
          }}
        >
          {/* Animal emoji */}
          <div style={{ fontSize: 80, display: 'flex', marginBottom: 16 }}>
            {emoji}
          </div>

          {/* Zodiac label */}
          <div
            style={{
              fontSize: 28,
              color: '#FFD060',
              fontWeight: 'bold',
              display: 'flex',
              marginBottom: 8,
            }}
          >
            {summary.zodiacLabel}
          </div>

          {/* Four pillars */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 12,
              marginTop: 20,
            }}
          >
            {pillars.map(({ label, pillar }) => {
              const el: FiveElement = pillar?.stem.element ?? 'earth';
              const color = ELEMENT_HEX[el];
              return (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: `1px solid ${color}`,
                    background: `rgba(0,0,0,0.3)`,
                  }}
                >
                  <span style={{ fontSize: 28, fontWeight: 'bold', color }}>
                    {pillar?.stem.hanja ?? '?'}
                  </span>
                  <span style={{ fontSize: 14, color, marginTop: 4 }}>
                    {pillar?.branch.hanja ?? '?'}
                  </span>
                  <span style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    {label}주
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right section — summary */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: '55%',
            padding: '40px 60px 40px 20px',
          }}
        >
          {/* Site title */}
          <div
            style={{
              fontSize: 16,
              color: '#8A6618',
              letterSpacing: 3,
              display: 'flex',
              marginBottom: 20,
            }}
          >
            四柱命理의 迷宮
          </div>

          {/* Theme */}
          <div
            style={{
              fontSize: 36,
              color: '#FFD060',
              fontWeight: 'bold',
              display: 'flex',
              marginBottom: 8,
            }}
          >
            {summary.dayMasterTheme}
          </div>

          {/* Metaphor */}
          <div
            style={{
              fontSize: 20,
              color: '#B8860B',
              display: 'flex',
              marginBottom: 24,
            }}
          >
            {summary.dayMasterMetaphor}
          </div>

          {/* Element keyword */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 16, color: '#8A6618' }}>오행 성향</span>
            <span style={{ fontSize: 20, color: dominantColor, fontWeight: 'bold' }}>
              {summary.elementKeyword}
            </span>
          </div>

          {/* Element balance */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 6, fontSize: 16 }}>
              <span style={{ color: '#8A6618' }}>강</span>
              <span style={{ color: ELEMENT_HEX[summary.dominantElement] }}>
                {ELEMENT_NAMES[summary.dominantElement].hanja}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, fontSize: 16 }}>
              <span style={{ color: '#8A6618' }}>약</span>
              <span style={{ color: ELEMENT_HEX[summary.deficientElement] }}>
                {ELEMENT_NAMES[summary.deficientElement].hanja}
              </span>
            </div>
          </div>

          {/* Wisdom quote */}
          <div
            style={{
              fontSize: 15,
              color: '#6A5828',
              fontStyle: 'italic',
              display: 'flex',
              maxWidth: 420,
              lineHeight: 1.6,
            }}
          >
            &ldquo;{summary.wisdomQuote}&rdquo;
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function FallbackImage() {
  return (
    <div
      style={{
        background: '#080600',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          bottom: 16,
          border: '2px solid #D4A020',
          borderRadius: 8,
          display: 'flex',
        }}
      />
      <div style={{ fontSize: 72, color: '#D4A020', fontWeight: 'bold', display: 'flex', marginBottom: 16 }}>
        四柱命理의 迷宮
      </div>
      <div style={{ fontSize: 36, color: '#B8860B', display: 'flex', marginBottom: 40 }}>
        사주명리의 미궁
      </div>
      <div style={{ fontSize: 24, color: '#8B7355', display: 'flex' }}>
        AI 기반 사주명리 풀이 · 나만의 사주 카드
      </div>
    </div>
  );
}
