'use client';

interface StepGenderProps {
  gender: 'male' | 'female';
  onGenderChange: (value: 'male' | 'female') => void;
}

export function StepGender({ gender, onGenderChange }: StepGenderProps) {
  return (
    <div>
      <div className="text-[#FFD060] font-mono text-2xl font-bold leading-tight mb-2">
        마지막으로<br />성별을 알려주세요
      </div>
      <div className="text-[#8A6618] font-mono text-sm mb-8">
        운세 해석의 방향이 달라집니다
      </div>
      <div className="flex gap-4">
        {([['male', '남 ♂'], ['female', '여 ♀']] as const).map(([val, label]) => (
          <button key={val} type="button" onClick={() => onGenderChange(val)}
            className={[
              'flex-1 py-5 border-2 rounded font-mono text-lg font-bold transition-all',
              gender === val
                ? 'border-[#D4A020] bg-[#D4A020]/15 text-[#FFD060]'
                : 'border-[#2a1e08] text-[#8A6618] hover:border-[#D4A020]/50',
            ].join(' ')}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
