'use client';

import { TimeGrid } from '../TimeGrid';

interface StepTimeProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export function StepTime({ value, onChange }: StepTimeProps) {
  return (
    <div>
      <div className="text-[#FFD060] font-mono text-2xl font-bold leading-tight mb-2">
        태어난 시간을<br />아시나요?
      </div>
      <div className="text-[#8A6618] font-mono text-sm mb-6">
        시주(時柱) — 네 번째 기둥. 모르셔도 괜찮습니다
      </div>
      <TimeGrid value={value} onChange={onChange} />
    </div>
  );
}
