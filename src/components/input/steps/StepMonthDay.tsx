'use client';

interface StepMonthDayProps {
  month: string;
  day: string;
  onMonthChange: (value: string) => void;
  onDayChange: (value: string) => void;
}

const inputClass = 'bg-transparent border-b border-[#D4A020]/40 text-[#E8D8C0] ' +
  'font-mono outline-none focus:border-[#D4A020] w-full py-2 px-1 text-xl';

export function StepMonthDay({ month, day, onMonthChange, onDayChange }: StepMonthDayProps) {
  return (
    <div>
      <div className="text-[#FFD060] font-mono text-2xl font-bold leading-tight mb-2">
        태어난 월과<br />일은 언제인가요?
      </div>
      <div className="text-[#8A6618] font-mono text-sm mb-8">
        두 번째, 세 번째 기둥을 세웁니다
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="text-[#D4A020] font-mono text-sm mb-1">월</div>
          <input type="number" value={month} onChange={(e) => onMonthChange(e.target.value)}
            placeholder="6" min={1} max={12} className={inputClass} autoFocus />
        </div>
        <div className="flex-1">
          <div className="text-[#D4A020] font-mono text-sm mb-1">일</div>
          <input type="number" value={day} onChange={(e) => onDayChange(e.target.value)}
            placeholder="15" min={1} max={31} className={inputClass} />
        </div>
      </div>
    </div>
  );
}
