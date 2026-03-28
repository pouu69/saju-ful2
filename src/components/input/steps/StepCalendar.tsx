'use client';

interface StepCalendarProps {
  value: 'solar' | 'lunar';
  onChange: (value: 'solar' | 'lunar') => void;
}

export function StepCalendar({ value, onChange }: StepCalendarProps) {
  return (
    <div>
      <div className="text-[#FFD060] font-mono text-2xl font-bold leading-tight mb-2">
        양력인가요,<br />음력인가요?
      </div>
      <div className="text-[#8A6618] font-mono text-sm mb-8">
        달력 기준이 사주 계산에 영향을 줍니다
      </div>
      <div className="flex gap-4">
        {(['solar', 'lunar'] as const).map((cal) => (
          <button key={cal} type="button" onClick={() => onChange(cal)}
            className={[
              'flex-1 py-5 border-2 rounded font-mono text-lg font-bold transition-all',
              value === cal
                ? 'border-[#D4A020] bg-[#D4A020]/15 text-[#FFD060]'
                : 'border-[#2a1e08] text-[#8A6618] hover:border-[#D4A020]/50',
            ].join(' ')}>
            {cal === 'solar' ? '양력 ☀️' : '음력 🌙'}
          </button>
        ))}
      </div>
    </div>
  );
}
