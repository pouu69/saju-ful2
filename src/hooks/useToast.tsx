'use client';

import { useState, useCallback, useRef } from 'react';

interface ToastState {
  message: string;
  visible: boolean;
}

export function useToast(duration = 2000) {
  const [toast, setToast] = useState<ToastState>({ message: '', visible: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, visible: true });
    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, duration);
  }, [duration]);

  const ToastUI = toast.visible ? (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        px-5 py-3 rounded-lg font-mono text-sm
        text-[#080600] font-bold
        animate-[fadeInUp_0.3s_ease]"
      style={{
        background: 'linear-gradient(135deg, #D4A020, #FFD060)',
        boxShadow: '0 4px 16px rgba(212,160,32,0.4)',
      }}
    >
      {toast.message}
    </div>
  ) : null;

  return { show, ToastUI };
}
