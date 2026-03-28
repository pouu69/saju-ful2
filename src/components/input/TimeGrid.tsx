'use client';

interface TimeOption {
  value: number | null;
  label: string;
  hanja: string;
  emoji: string;
  range: string;
}

// value must match SajuForm HOUR_OPTIONS (0,1,3,5,...21) — passed directly to calculateSaju
const TIME_OPTIONS: TimeOption[] = [
  { value: 0,  label: '자시', hanja: '子', emoji: '🌙', range: '23:30~01:29' },
  { value: 1,  label: '축시', hanja: '丑', emoji: '🐄', range: '01:30~03:29' },
  { value: 3,  label: '인시', hanja: '寅', emoji: '🌄', range: '03:30~05:29' },
  { value: 5,  label: '묘시', hanja: '卯', emoji: '🌅', range: '05:30~07:29' },
  { value: 7,  label: '진시', hanja: '辰', emoji: '🌤', range: '07:30~09:29' },
  { value: 9,  label: '사시', hanja: '巳', emoji: '☀️', range: '09:30~11:29' },
  { value: 11, label: '오시', hanja: '午', emoji: '🌞', range: '11:30~13:29' },
  { value: 13, label: '미시', hanja: '未', emoji: '⛅', range: '13:30~15:29' },
  { value: 15, label: '신시', hanja: '申', emoji: '🌆', range: '15:30~17:29' },
  { value: 17, label: '유시', hanja: '酉', emoji: '🌇', range: '17:30~19:29' },
  { value: 19, label: '술시', hanja: '戌', emoji: '🌃', range: '19:30~21:29' },
  { value: 21, label: '해시', hanja: '亥', emoji: '🌙', range: '21:30~23:29' },
  { value: null, label: '모름', hanja: '?', emoji: '❓', range: '괜찮아요' },
];

interface TimeGridProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export function TimeGrid({ value, onChange }: TimeGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 w-full">
      {TIME_OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              'flex flex-col items-center justify-center py-3 px-1 rounded border transition-all min-h-[72px]',
              isSelected
                ? 'border-[#D4A020] bg-[#D4A020]/15 text-[#FFD060]'
                : 'border-[#2a1e08] bg-transparent text-[#D4A020] hover:border-[#D4A020]/50 hover:bg-[#D4A020]/5',
            ].join(' ')}
          >
            <span className="text-lg mb-1">{opt.emoji}</span>
            <span className="font-mono text-xs font-bold">{opt.hanja}{opt.label !== '모름' ? '時' : ''}</span>
            <span className="font-mono text-[10px] text-[#8A6618] mt-0.5">{opt.range}</span>
          </button>
        );
      })}
    </div>
  );
}
