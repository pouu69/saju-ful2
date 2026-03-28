'use client';

interface StepGenderProps {
  gender: 'male' | 'female';
  maritalStatus: 'single' | 'married' | 'etc';
  onGenderChange: (value: 'male' | 'female') => void;
  onMaritalChange: (value: 'single' | 'married' | 'etc') => void;
}

export function StepGender({ gender, maritalStatus, onGenderChange, onMaritalChange }: StepGenderProps) {
  return (
    <div>
      <div className="text-[#FFD060] font-mono text-2xl font-bold leading-tight mb-2">
        마지막으로<br />성별을 알려주세요
      </div>
      <div className="text-[#8A6618] font-mono text-sm mb-8">
        운세 해석의 방향이 달라집니다
      </div>
      <div className="space-y-8">
        <div>
          <div className="text-[#D4A020] font-mono text-sm mb-2">성별</div>
          <div className="flex gap-4">
            {([['male', '남 ♂'], ['female', '여 ♀']] as const).map(([val, label]) => (
              <button key={val} type="button" onClick={() => onGenderChange(val)}
                className={[
                  'flex-1 py-4 border-2 rounded font-mono text-base font-bold transition-all',
                  gender === val
                    ? 'border-[#D4A020] bg-[#D4A020]/15 text-[#FFD060]'
                    : 'border-[#2a1e08] text-[#8A6618] hover:border-[#D4A020]/50',
                ].join(' ')}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[#8A6618] font-mono text-xs mb-2">결혼 여부 <span className="text-[#555]">(선택사항)</span></div>
          <div className="flex gap-3">
            {([['single', '미혼'], ['married', '기혼'], ['etc', '기타']] as const).map(([val, label]) => (
              <button key={val} type="button" onClick={() => onMaritalChange(val)}
                className={[
                  'flex-1 py-2.5 border rounded font-mono text-xs transition-all',
                  maritalStatus === val
                    ? 'border-[#D4A020]/60 bg-[#D4A020]/10 text-[#D4A020]'
                    : 'border-[#1a1500] text-[#555] hover:border-[#D4A020]/30',
                ].join(' ')}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
