'use client';

import { useState, useCallback } from 'react';

export type ResultPhase = 'loading' | 'particles' | 'envelope' | 'cardDraw' | 'revealed' | 'scrolling' | 'complete';

export function useResultPhase(initialPhase: ResultPhase = 'loading') {
  const [phase, setPhase] = useState<ResultPhase>(initialPhase);

  const handleParticleComplete = useCallback((completedPhase: string) => {
    if (completedPhase === 'gather') setPhase('envelope');
  }, []);

  const handleEnvelopeOpen = useCallback(() => {
    setPhase('cardDraw');
  }, []);

  const handleRevealComplete = useCallback(() => {
    setPhase('revealed');
    setTimeout(() => setPhase('scrolling'), 300);
  }, []);

  const handleStreamingComplete = useCallback(() => {
    setPhase('complete');
  }, []);

  const particlePhase = (() => {
    switch (phase) {
      case 'particles': return 'gather' as const;
      case 'envelope': return 'idle' as const;
      case 'cardDraw': return 'burst' as const;
      case 'revealed':
      case 'scrolling': return 'idle' as const;
      default: return 'done' as const;
    }
  })();

  return {
    phase,
    setPhase,
    particlePhase,
    handleParticleComplete,
    handleEnvelopeOpen,
    handleRevealComplete,
    handleStreamingComplete,
  };
}
