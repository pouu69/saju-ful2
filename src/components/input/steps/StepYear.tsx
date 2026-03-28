'use client';

import { YearDrum } from '../YearDrum';

interface StepYearProps {
  value: number;
  onChange: (year: number) => void;
}

export function StepYear({ value, onChange }: StepYearProps) {
  return (
    <div>
      <div className="text-[#FFD060] font-mono text-2xl font-bold leading-tight mb-2">
        태어난 해는<br />언제인가요?
      </div>
      <div className="text-[#8A6618] font-mono text-sm mb-8">
        간지(干支)의 첫 번째 기둥입니다
      </div>
      <YearDrum value={value} onChange={onChange} />
    </div>
  );
}
