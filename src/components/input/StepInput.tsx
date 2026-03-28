'use client';

import { useState, useCallback } from 'react';
import { StepName } from './steps/StepName';
import { StepYear } from './steps/StepYear';
import { StepMonthDay } from './steps/StepMonthDay';
import { StepCalendar } from './steps/StepCalendar';
import { StepTime } from './steps/StepTime';
import { StepGender } from './steps/StepGender';
import type { BirthInfo } from '@/lib/saju/types';

interface StepInputProps {
  onComplete: (birthInfo: BirthInfo) => void;
  loading?: boolean;
}

interface StepState {
  name: string;
  year: number;
  month: string;
  day: string;
  calendarType: 'solar' | 'lunar';
  hour: number | null;
  gender: 'male' | 'female';
}

const TOTAL_STEPS = 6;
const STEP_LABELS = ['성함', '생년', '생월/일', '역법', '시간', '성별'];

export function StepInput({ onComplete, loading }: StepInputProps) {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<StepState>({
    name: '',
    year: new Date().getFullYear() - 30,
    month: '',
    day: '',
    calendarType: 'solar',
    hour: null,
    gender: 'male',
  });
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(<K extends keyof StepState>(key: K, value: StepState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }, []);

  const validateStep = (): boolean => {
    setError(null);
    if (step === 1 && !state.name.trim()) {
      setError('성함을 입력해주세요');
      return false;
    }
    if (step === 3) {
      const m = parseInt(state.month, 10);
      const d = parseInt(state.day, 10);
      if (isNaN(m) || m < 1 || m > 12) { setError('월은 1~12 사이로 입력해주세요'); return false; }
      if (isNaN(d) || d < 1 || d > 31) { setError('일은 1~31 사이로 입력해주세요'); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const birthInfo: BirthInfo = {
      name: state.name.trim() || '무명',
      year: state.year,
      month: parseInt(state.month, 10),
      day: parseInt(state.day, 10),
      hour: state.hour,
      minute: 0,
      gender: state.gender,
      calendarType: state.calendarType,
      maritalStatus: 'etc',
    };
    onComplete(birthInfo);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 flex flex-col min-h-screen py-8">
      <div className="flex gap-1.5 mb-6">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-all duration-300 ${
              i < step ? 'bg-[#D4A020]' : 'bg-[#2a1e08]'
            }`}
          />
        ))}
      </div>

      <div className="text-[#8A6618] font-mono text-xs mb-8 tracking-widest">
        {step} / {TOTAL_STEPS} · {STEP_LABELS[step - 1]}
      </div>

      <div className="flex-1">
        {step === 1 && <StepName value={state.name} onChange={(v) => update('name', v)} onEnter={handleNext} />}
        {step === 2 && <StepYear value={state.year} onChange={(v) => update('year', v)} />}
        {step === 3 && <StepMonthDay month={state.month} day={state.day} onMonthChange={(v) => update('month', v)} onDayChange={(v) => update('day', v)} />}
        {step === 4 && <StepCalendar value={state.calendarType} onChange={(v) => update('calendarType', v)} />}
        {step === 5 && <StepTime value={state.hour} onChange={(v) => update('hour', v)} />}
        {step === 6 && <StepGender gender={state.gender} onGenderChange={(v) => update('gender', v)} />}
      </div>

      {error && (
        <div className="text-[#FF5544] font-mono text-sm border border-[#FF5544]/30 p-2 mb-4">
          ! {error}
        </div>
      )}

      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="px-5 py-4 border border-[#2a1e08] text-[#8A6618] font-mono
              hover:border-[#D4A020]/40 transition-colors min-h-[56px]"
          >
            ←
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={loading}
          className="flex-1 py-4 border-2 border-[#D4A020] text-[#D4A020] font-mono text-lg font-bold
            hover:bg-[#D4A020]/10 active:bg-[#D4A020]/20 disabled:opacity-40
            transition-colors min-h-[56px]"
          style={{ background: step === TOTAL_STEPS ? 'linear-gradient(135deg,#D4A020,#FFD060)' : undefined,
                   color: step === TOTAL_STEPS ? '#080600' : undefined }}
        >
          {loading ? '계산 중...' : step === TOTAL_STEPS ? '✦ 카드 받기' : '다음 →'}
        </button>
      </div>
    </div>
  );
}
