'use client';

import { useRef, useEffect, useCallback } from 'react';

interface GoldParticlesProps {
  phase: 'gather' | 'burst' | 'idle' | 'done';
  centerX: number;
  centerY: number;
  onPhaseComplete?: (phase: string) => void;
}

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  r: number;
  g: number;
  b: number;
  radius: number;
  alpha: number;
  maxAlpha: number;
}

const GATHER_DURATION = 500;
const BURST_DURATION = 400;

function randomGoldColor(): { r: number; g: number; b: number } {
  return {
    r: 200 + Math.random() * 55,
    g: 160 + Math.random() * 48,
    b: 20 + Math.random() * 76,
  };
}

function createParticles(
  count: number,
  canvasWidth: number,
  canvasHeight: number,
  centerX: number,
  centerY: number,
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const { r, g, b } = randomGoldColor();
    const x = Math.random() * canvasWidth;
    const y = Math.random() * canvasHeight;
    const maxAlpha = 0.3 + Math.random() * 0.7;
    particles.push({
      x,
      y,
      targetX: centerX,
      targetY: centerY,
      originX: x,
      originY: y,
      vx: 0,
      vy: 0,
      r,
      g,
      b,
      radius: 1 + Math.random() * 2,
      alpha: maxAlpha,
      maxAlpha,
    });
  }
  return particles;
}

export default function GoldParticles({
  phase,
  centerX,
  centerY,
  onPhaseComplete,
}: GoldParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const phaseStartRef = useRef<number>(0);
  const prevPhaseRef = useRef<string>('');
  const canvasOpacityRef = useRef<number>(1);
  const phaseCompleteCalledRef = useRef<boolean>(false);

  const getParticleCount = useCallback((): number => {
    if (typeof window === 'undefined') return 80;
    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      return 40 + Math.floor(Math.random() * 11);
    }
    return 80 + Math.floor(Math.random() * 21);
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, []);

  useEffect(() => {
    if (phase === 'done') return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      onPhaseComplete?.(phase);
      return;
    }

    resizeCanvas();

    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);

    if (phase !== prevPhaseRef.current) {
      prevPhaseRef.current = phase;
      phaseStartRef.current = performance.now();
      phaseCompleteCalledRef.current = false;

      if (phase === 'gather') {
        const canvas = canvasRef.current;
        if (canvas) {
          particlesRef.current = createParticles(
            getParticleCount(),
            window.innerWidth,
            window.innerHeight,
            centerX,
            centerY,
          );
        }
        canvasOpacityRef.current = 1;
      } else if (phase === 'burst') {
        const particles = particlesRef.current;
        for (const p of particles) {
          const angle = Math.atan2(p.y - centerY, p.x - centerX) || Math.random() * Math.PI * 2;
          const speed = 200 + Math.random() * 400;
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed;
          p.x = centerX;
          p.y = centerY;
        }
      } else if (phase === 'idle') {
        canvasOpacityRef.current = 1;
      }
    }

    const animate = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const elapsed = now - phaseStartRef.current;
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;

      if (phase === 'gather') {
        const progress = Math.min(elapsed / GATHER_DURATION, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        for (const p of particles) {
          p.x = p.originX + (p.targetX - p.originX) * eased;
          p.y = p.originY + (p.targetY - p.originY) * eased;
          p.alpha = p.maxAlpha * (0.3 + 0.7 * eased);
        }

        if (progress >= 1 && !phaseCompleteCalledRef.current) {
          phaseCompleteCalledRef.current = true;
          onPhaseComplete?.('gather');
        }
      } else if (phase === 'burst') {
        const progress = Math.min(elapsed / BURST_DURATION, 1);
        const dt = 1 / 60;

        for (const p of particles) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.96;
          p.vy *= 0.96;
          p.alpha = p.maxAlpha * (1 - progress);
        }

        if (progress >= 1 && !phaseCompleteCalledRef.current) {
          phaseCompleteCalledRef.current = true;
          onPhaseComplete?.('burst');
        }
      } else if (phase === 'idle') {
        let allGone = true;
        for (const p of particles) {
          p.alpha -= 0.01;
          if (p.alpha > 0) {
            allGone = false;
          } else {
            p.alpha = 0;
          }
        }

        canvasOpacityRef.current = Math.max(0, canvasOpacityRef.current - 0.015);
        canvas.style.opacity = String(canvasOpacityRef.current);

        if (allGone && !phaseCompleteCalledRef.current) {
          phaseCompleteCalledRef.current = true;
          onPhaseComplete?.('idle');
        }
      }

      for (const p of particles) {
        if (p.alpha <= 0) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.round(p.r)},${Math.round(p.g)},${Math.round(p.b)},${p.alpha})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [phase, centerX, centerY, onPhaseComplete, resizeCanvas, getParticleCount]);

  if (phase === 'done') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 40,
      }}
    />
  );
}
