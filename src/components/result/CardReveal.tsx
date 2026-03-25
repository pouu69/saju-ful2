'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useShare } from '@/hooks/useShare';

interface CardRevealProps {
  renderCard: () => Promise<Blob>;
  onBlobReady: (blob: Blob) => void;
  onRevealComplete: () => void;
  revealed: boolean;
  blob: Blob | null;
  filename: string;
}

const KEYFRAMES_STYLE = `
@keyframes card-draw-down {
  from {
    transform: translateY(-120%) scale(0.8);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes card-draw-reduced {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes gold-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
`;

// Card back design — mystical gold pattern
function CardBack({ aspectRatio }: { aspectRatio: number }) {
  return (
    <div
      className="w-full rounded-sm"
      style={{
        aspectRatio: aspectRatio || 0.65,
        background: 'linear-gradient(135deg, #0a0800 0%, #1a1408 50%, #0a0800 100%)',
        border: '2px solid #D4A020',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Inner border */}
      <div
        style={{
          position: 'absolute',
          inset: 8,
          border: '1px solid rgba(212, 160, 32, 0.4)',
        }}
      />
      {/* Second inner border */}
      <div
        style={{
          position: 'absolute',
          inset: 14,
          border: '1px solid rgba(212, 160, 32, 0.2)',
        }}
      />
      {/* Center motif */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center font-mono"
        style={{ color: '#D4A020' }}
      >
        <div className="text-xs opacity-40 tracking-[0.3em]">═══════</div>
        <div className="text-2xl mt-2 opacity-70">命</div>
        <div className="text-lg mt-1 opacity-50">理</div>
        <div className="text-xs mt-2 opacity-40 tracking-[0.3em]">═══════</div>
      </div>
      {/* Corner decorations */}
      <div className="absolute top-3 left-3 text-[#D4A020] opacity-30 text-xs">◆</div>
      <div className="absolute top-3 right-3 text-[#D4A020] opacity-30 text-xs">◆</div>
      <div className="absolute bottom-3 left-3 text-[#D4A020] opacity-30 text-xs">◆</div>
      <div className="absolute bottom-3 right-3 text-[#D4A020] opacity-30 text-xs">◆</div>
      {/* Diagonal pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            #D4A020 0px, #D4A020 1px,
            transparent 1px, transparent 12px
          )`,
        }}
      />
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="#D4A020" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="#D4A020" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

type AnimPhase = 'hidden' | 'drawDown' | 'pauseBeforeFlip' | 'flipping' | 'done';

export function CardReveal({
  renderCard,
  onBlobReady,
  onRevealComplete,
  revealed,
  blob,
  filename,
}: CardRevealProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [imgAspect, setImgAspect] = useState(0.65);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animPhase, setAnimPhase] = useState<AnimPhase>('hidden');
  const [overlayVisible, setOverlayVisible] = useState(false);

  const onBlobReadyRef = useRef(onBlobReady);
  const onRevealCompleteRef = useRef(onRevealComplete);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  const { shareCard, downloadCard, canNativeShare } = useShare();

  useEffect(() => { onBlobReadyRef.current = onBlobReady; }, [onBlobReady]);
  useEffect(() => { onRevealCompleteRef.current = onRevealComplete; }, [onRevealComplete]);

  // Render card to blob and create object URL
  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function render() {
      try {
        setLoading(true);
        setError(null);
        await document.fonts.load('16px "D2Coding"');
        const renderedBlob = await renderCard();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(renderedBlob);

        // Measure image aspect ratio
        const img = new Image();
        img.onload = () => {
          if (!cancelled) {
            setImgAspect(img.width / img.height);
          }
        };
        img.src = objectUrl;

        setImgSrc(objectUrl);
        onBlobReadyRef.current(renderedBlob);
      } catch {
        if (!cancelled) setError('카드 생성에 실패했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    render();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [renderCard]);

  // Start animation sequence when revealed + image ready (once only)
  useEffect(() => {
    if (revealed && imgSrc && !hasStarted.current) {
      hasStarted.current = true;

      // Check reduced motion
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        setAnimPhase('done');
        onRevealCompleteRef.current();
        return;
      }

      setAnimPhase('drawDown');
    }
  }, [revealed, imgSrc]);

  // Handle draw-down animation end → pause → flip
  const handleDrawEnd = useCallback(() => {
    setAnimPhase('pauseBeforeFlip');
    setTimeout(() => {
      setAnimPhase('flipping');
    }, 200);
  }, []);

  // Handle flip animation end → done
  const handleFlipEnd = useCallback(() => {
    setAnimPhase('done');
    onRevealCompleteRef.current();
  }, []);

  // Close overlay when clicking outside
  useEffect(() => {
    if (!overlayVisible) return;
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (cardContainerRef.current && !cardContainerRef.current.contains(e.target as Node)) {
        setOverlayVisible(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [overlayVisible]);

  const handleCardTap = useCallback(() => {
    if (!blob) return;
    setOverlayVisible(prev => !prev);
  }, [blob]);

  const handleDownload = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!blob) return;
    downloadCard(blob, filename);
  }, [blob, filename, downloadCard]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!blob) return;
    await shareCard(blob, filename);
  }, [blob, filename, shareCard]);

  if (loading) {
    return (
      <>
        <style>{KEYFRAMES_STYLE}</style>
        <div className="flex items-center justify-center p-8 border border-[#D4A020]/20">
          <span className="text-[#D4A020] font-mono"
            style={{ animation: 'gold-pulse 1.5s ease-in-out infinite' }}>
            카드 생성 중...
          </span>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 border border-[#FF5544]/30">
        <span className="text-[#FF5544] font-mono">{error}</span>
      </div>
    );
  }

  if (!imgSrc) return null;

  const isVisible = animPhase !== 'hidden';
  const isFlipped = animPhase === 'flipping' || animPhase === 'done';
  const showOverlayControls = animPhase === 'done';

  return (
    <>
      <style>{KEYFRAMES_STYLE}</style>
      <div
        ref={cardContainerRef}
        className="relative w-full max-w-md mx-auto"
        style={{
          visibility: isVisible ? 'visible' : 'hidden',
          perspective: '1200px',
        }}
        onMouseLeave={() => setOverlayVisible(false)}
      >
        {/* 3D flip container */}
        <div
          style={{
            transformStyle: 'preserve-3d',
            transition: animPhase === 'flipping' ? 'transform 0.6s ease-in-out' : undefined,
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            ...(animPhase === 'drawDown' ? {
              animation: 'card-draw-down 0.6s ease-out forwards',
            } : {}),
          }}
          onAnimationEnd={animPhase === 'drawDown' ? handleDrawEnd : undefined}
          onTransitionEnd={animPhase === 'flipping' ? handleFlipEnd : undefined}
        >
          {/* Back face (visible first) */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              position: isFlipped && animPhase === 'done' ? 'absolute' : 'relative',
              width: '100%',
            }}
          >
            <CardBack aspectRatio={imgAspect} />
          </div>

          {/* Front face (revealed after flip) */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              position: animPhase === 'done' ? 'relative' : 'absolute',
              top: 0,
              left: 0,
              width: '100%',
            }}
          >
            <img
              src={imgSrc}
              alt="사주 카드"
              className="w-full block"
            />
          </div>
        </div>

        {/* Share overlay — only after flip is done */}
        {showOverlayControls && blob && (
          <div
            role="group"
            aria-label="카드 공유 옵션"
            className="absolute inset-0 flex items-center justify-center gap-4 transition-opacity duration-200"
            style={{
              backdropFilter: overlayVisible ? 'blur(4px)' : 'none',
              background: overlayVisible ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
              opacity: overlayVisible ? 1 : 0,
              pointerEvents: overlayVisible ? 'auto' : 'none',
            }}
            onClick={handleCardTap}
          >
            <button type="button" aria-label="다운로드"
              className="flex items-center justify-center rounded-lg border border-[#D4A020] bg-[#080600]/80 hover:bg-[#D4A020]/20 transition-colors"
              style={{ width: 48, height: 48 }}
              onClick={handleDownload}>
              <DownloadIcon />
            </button>
            {canNativeShare() && (
              <button type="button" aria-label="공유하기"
                className="flex items-center justify-center rounded-lg border border-[#D4A020] bg-[#080600]/80 hover:bg-[#D4A020]/20 transition-colors"
                style={{ width: 48, height: 48 }}
                onClick={handleShare}>
                <ShareIcon />
              </button>
            )}
          </div>
        )}

        {/* Desktop hover trigger */}
        {showOverlayControls && blob && !overlayVisible && (
          <div className="absolute inset-0 hidden md:block"
            onMouseEnter={() => setOverlayVisible(true)} aria-hidden="true" />
        )}

        {/* Mobile tap trigger */}
        {showOverlayControls && blob && !overlayVisible && (
          <div className="absolute inset-0 block md:hidden"
            onClick={handleCardTap} aria-hidden="true" />
        )}
      </div>
    </>
  );
}
