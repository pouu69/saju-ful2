import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '사주명리의 미궁 - AI 사주풀이';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
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
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Scanline overlay effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)',
            display: 'flex',
          }}
        />

        {/* Border */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            right: 20,
            bottom: 20,
            border: '2px solid #D4A020',
            borderRadius: 8,
            display: 'flex',
          }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            color: '#D4A020',
            fontWeight: 'bold',
            display: 'flex',
            marginBottom: 16,
          }}
        >
          四柱命理의 迷宮
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 36,
            color: '#B8860B',
            display: 'flex',
            marginBottom: 40,
          }}
        >
          사주명리의 미궁
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 24,
            color: '#8B7355',
            display: 'flex',
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          AI 기반 사주명리 풀이 · 나만의 사주 카드
        </div>

        {/* Terminal prompt */}
        <div
          style={{
            position: 'absolute',
            bottom: 50,
            fontSize: 20,
            color: '#D4A020',
            opacity: 0.6,
            display: 'flex',
          }}
        >
          {'>'} 당신의 사주를 탐험하세요...
        </div>
      </div>
    ),
    { ...size },
  );
}
