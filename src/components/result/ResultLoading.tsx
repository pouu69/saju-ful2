'use client';

export function ResultLoading() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div
        className="mb-8 flex items-center justify-center rounded-full"
        style={{
          width: 100, height: 100,
          background: 'radial-gradient(circle, rgba(212,160,32,0.2) 0%, rgba(212,160,32,0.04) 60%, transparent 100%)',
          border: '1px solid rgba(212,160,32,0.25)',
          boxShadow: '0 0 32px rgba(212,160,32,0.15)',
        }}
      >
        <span style={{ fontSize: 40 }}>☯</span>
      </div>
      <div className="text-[#FFD060] font-mono text-lg font-bold mb-3">운명을 읽는 중...</div>
      <div className="text-[#8A6618] font-mono text-sm mb-8 leading-relaxed">
        사주팔자를 계산하고<br />AI가 해석하고 있습니다
      </div>
      <div className="w-full max-w-xs space-y-3">
        {[
          { done: true, label: '사주팔자 계산 완료' },
          { done: false, label: '오행 균형 분석 중...' },
          { done: false, label: '카드 생성 대기중' },
        ].map(({ done, label }, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full"
              style={{
                width: 18, height: 18,
                background: done ? '#68d391' : i === 1 ? '#D4A020' : '#2a1e08',
                border: i === 2 ? '1px solid #3a2a08' : 'none',
                fontSize: 10,
              }}
            >
              {done ? '✓' : i === 1 ? '◐' : ''}
            </div>
            <span
              className="font-mono text-sm"
              style={{ color: done ? '#68d391' : i === 1 ? '#D4A020' : '#3a2a08' }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
