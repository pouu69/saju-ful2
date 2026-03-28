'use client';

interface StepNameProps {
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
}

const inputClass = 'bg-transparent border-b border-[#D4A020]/40 text-[#E8D8C0] ' +
  'font-mono outline-none focus:border-[#D4A020] w-full py-2 px-1 text-xl';

export function StepName({ value, onChange, onEnter }: StepNameProps) {
  return (
    <div>
      <div className="text-[#FFD060] font-mono text-2xl font-bold leading-tight mb-2">
        성함이<br />어떻게 되십니까?
      </div>
      <div className="text-[#8A6618] font-mono text-sm mb-8">
        이름을 알아야 운명을 읽을 수 있습니다
      </div>
      <div className="border-b border-[#D4A020] pb-2 flex items-center gap-2">
        <span className="text-[#8A6618] font-mono text-lg">›</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onEnter()}
          placeholder="홍길동"
          className={inputClass}
          autoFocus
        />
      </div>
      <div className="text-[#555] font-mono text-xs mt-2">한글 또는 영문</div>
    </div>
  );
}
