'use client';

import { useState, FormEvent } from 'react';
import type { BirthInfo } from '@/lib/saju/types';

const HOUR_OPTIONS = [
  { value: -1, label: '모름' },
  { value: 0, label: '자시 (23:30~01:29)' },
  { value: 1, label: '축시 (01:30~03:29)' },
  { value: 3, label: '인시 (03:30~05:29)' },
  { value: 5, label: '묘시 (05:30~07:29)' },
  { value: 7, label: '진시 (07:30~09:29)' },
  { value: 9, label: '사시 (09:30~11:29)' },
  { value: 11, label: '오시 (11:30~13:29)' },
  { value: 13, label: '미시 (13:30~15:29)' },
  { value: 15, label: '신시 (15:30~17:29)' },
  { value: 17, label: '유시 (17:30~19:29)' },
  { value: 19, label: '술시 (19:30~21:29)' },
  { value: 21, label: '해시 (21:30~23:29)' },
];

interface SajuFormProps {
  onSubmit: (birthInfo: BirthInfo) => void;
  loading?: boolean;
  error?: string | null;
  compact?: boolean;
}

export function SajuForm({ onSubmit, loading, error, compact }: SajuFormProps) {
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>('solar');
  const [hour, setHour] = useState(-1);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [maritalStatus, setMaritalStatus] = useState<'single' | 'married' | 'etc'>('single');
  const [occupation, setOccupation] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const birthInfo: BirthInfo = {
      name: name.trim() || '무명',
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      hour: hour === -1 ? null : hour,
      minute: 0,
      gender,
      calendarType,
      maritalStatus: compact ? 'etc' : maritalStatus,
      ...(occupation.trim() && { occupation: occupation.trim() }),
    };
    onSubmit(birthInfo);
  };

  const inputClass = 'bg-transparent border-b border-[#D4A020]/40 text-[#E8D8C0] ' +
    'font-mono outline-none focus:border-[#D4A020] w-full py-2 px-1 text-base';
  const selectClass = 'bg-[#080600] border-b border-[#D4A020]/40 text-[#E8D8C0] ' +
    'font-mono outline-none focus:border-[#D4A020] w-full py-2 px-1 text-base cursor-pointer ' +
    '[&>option]:bg-[#080600] [&>option]:text-[#E8D8C0]';
  const labelClass = 'text-[#D4A020] font-mono text-base';
  const radioClass = 'accent-[#D4A020]';

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full max-w-md mx-auto px-4">
      <div>
        <label className={labelClass}>{`> 이름을 입력하시오`}</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="홍길동"
          className={inputClass}
          autoFocus
        />
      </div>

      <div>
        <label className={labelClass}>{`> 생년월일`}</label>
        <div className="flex gap-2 mt-1">
          <input type="number" value={year} onChange={e => setYear(e.target.value)}
            placeholder="년" min="1900" max="2100" required className={`${inputClass} w-24`} />
          <input type="number" value={month} onChange={e => setMonth(e.target.value)}
            placeholder="월" min="1" max="12" required className={`${inputClass} w-16`} />
          <input type="number" value={day} onChange={e => setDay(e.target.value)}
            placeholder="일" min="1" max="31" required className={`${inputClass} w-16`} />
        </div>
      </div>

      <div>
        <label className={labelClass}>{`> 양력/음력`}</label>
        <div className="flex gap-6 mt-2">
          <label className="flex items-center gap-2 text-[#E8D8C0] font-mono cursor-pointer">
            <input type="radio" name="calendar" value="solar" checked={calendarType === 'solar'}
              onChange={() => setCalendarType('solar')} className={radioClass} />
            양력
          </label>
          <label className="flex items-center gap-2 text-[#E8D8C0] font-mono cursor-pointer">
            <input type="radio" name="calendar" value="lunar" checked={calendarType === 'lunar'}
              onChange={() => setCalendarType('lunar')} className={radioClass} />
            음력
          </label>
        </div>
      </div>

      <div>
        <label className={labelClass}>{`> 태어난 시`}</label>
        <select value={hour} onChange={e => setHour(parseInt(e.target.value))}
          className={selectClass}>
          {HOUR_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>{`> 성별`}</label>
        <div className="flex gap-6 mt-2">
          <label className="flex items-center gap-2 text-[#E8D8C0] font-mono cursor-pointer">
            <input type="radio" name="gender" value="male" checked={gender === 'male'}
              onChange={() => setGender('male')} className={radioClass} />
            남
          </label>
          <label className="flex items-center gap-2 text-[#E8D8C0] font-mono cursor-pointer">
            <input type="radio" name="gender" value="female" checked={gender === 'female'}
              onChange={() => setGender('female')} className={radioClass} />
            여
          </label>
        </div>
      </div>

      {!compact && (
        <div>
          <label className={labelClass}>{`> 결혼여부`}</label>
          <div className="flex gap-4 mt-2 flex-wrap">
            {([['single', '미혼'], ['married', '기혼'], ['etc', '기타']] as const).map(([val, label]) => (
              <label key={val} className="flex items-center gap-2 text-[#E8D8C0] font-mono cursor-pointer">
                <input type="radio" name="marital" value={val} checked={maritalStatus === val}
                  onChange={() => setMaritalStatus(val)} className={radioClass} />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}

      {!compact && (
        <div>
          <label className={labelClass}>{`> 직업 (선택)`}</label>
          <input type="text" value={occupation} onChange={e => setOccupation(e.target.value)}
            placeholder="회사원, 학생, 자영업 등" className={inputClass} />
        </div>
      )}

      {error && (
        <div className="text-[#FF5544] font-mono text-sm border border-[#FF5544]/30 p-2">
          {`! ${error}`}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !year || !month || !day}
        className="w-full py-3 border-2 border-[#D4A020] text-[#D4A020] font-mono text-lg
          hover:bg-[#D4A020]/10 active:bg-[#D4A020]/20 disabled:opacity-40
          disabled:cursor-not-allowed transition-colors mt-4 min-h-[48px]"
      >
        {loading ? '계산 중...' : '▶ 사주 풀이 시작'}
      </button>
    </form>
  );
}
