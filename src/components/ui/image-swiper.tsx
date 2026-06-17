"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface ImageSwiperProps {
  images: string;
  cardWidth?: number;
  cardHeight?: number;
  className?: string;
}

export const ImageSwiper: React.FC<ImageSwiperProps> = ({
  images,
  cardWidth = 240,  // 15rem = 240px
  cardHeight = 320, // 20rem = 320px
  className = ''
}) => {
  const cardStackRef = useRef<HTMLDivElement>(null);
  const isSwiping = useRef(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const animationFrameId = useRef<number | null>(null);

  const imageList = images.split(',').map(img => img.trim()).filter(img => img);
  const [cardOrder, setCardOrder] = useState<number[]>(() =>
    Array.from({ length: imageList.length }, (_, i) => i)
  );

  const activeIndex = cardOrder[0];
  const activeImageSrc = imageList[activeIndex] || '';
  const activeFilename = activeImageSrc.split('/').pop() || '';
  const activeFilenameLower = activeFilename.toLowerCase();

  let activeModelParam = 'her';
  if (activeFilenameLower.includes('keychain')) activeModelParam = 'keychain';
  else if (activeFilenameLower.includes('me.')) activeModelParam = 'me';
  else if (activeFilenameLower.includes('pair')) activeModelParam = 'pair';
  else if (activeFilenameLower.includes('toy')) activeModelParam = 'toy';

  const getDurationFromCSS = useCallback((
    variableName: string,
    element?: HTMLElement | null
  ): number => {
    const targetElement = element || document.documentElement;
    const value = getComputedStyle(targetElement)
      ?.getPropertyValue(variableName)
      ?.trim();
    if (!value) return 0;
    if (value.endsWith("ms")) return parseFloat(value);
    if (value.endsWith("s")) return parseFloat(value) * 1000;
    return parseFloat(value) || 0;
  }, []);

  const getCards = useCallback((): HTMLElement[] => {
    if (!cardStackRef.current) return [];
    return [...cardStackRef.current.querySelectorAll('.image-card')] as HTMLElement[];
  }, []);

  const getActiveCard = useCallback((): HTMLElement | null => {
    const cards = getCards();
    return cards[0] || null;
  }, [getCards]);

  const updatePositions = useCallback(() => {
    const cards = getCards();
    cards.forEach((card, i) => {
      card.style.setProperty('--i', (i + 1).toString());
      card.style.setProperty('--swipe-x', '0px');
      card.style.setProperty('--swipe-rotate', '0deg');
      card.style.opacity = '1';
    });
  }, [getCards]);

  const applySwipeStyles = useCallback((deltaX: number) => {
    const card = getActiveCard();
    if (!card) return;
    card.style.setProperty('--swipe-x', `${deltaX}px`);
    card.style.setProperty('--swipe-rotate', `${deltaX * 0.2}deg`);
    card.style.opacity = (1 - Math.min(Math.abs(deltaX) / 100, 1) * 0.75).toString();
  }, [getActiveCard]);

  const handleStart = useCallback((clientX: number) => {
    if (isSwiping.current) return;
    isSwiping.current = true;
    startX.current = clientX;
    currentX.current = clientX;
    const card = getActiveCard();
    if (card) card.style.transition = 'none';
  }, [getActiveCard]);

  const handleEnd = useCallback(() => {
    if (!isSwiping.current) return;
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    const deltaX = currentX.current - startX.current;
    const threshold = 50;
    const duration = getDurationFromCSS('--card-swap-duration', cardStackRef.current);
    const card = getActiveCard();

    if (card) {
      card.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;

      if (Math.abs(deltaX) > threshold) {
        const direction = Math.sign(deltaX);
        card.style.setProperty('--swipe-x', `${direction * 300}px`);
        card.style.setProperty('--swipe-rotate', `${direction * 20}deg`);

        setTimeout(() => {
          if (getActiveCard() === card) {
            card.style.setProperty('--swipe-rotate', `${-direction * 20}deg`);
          }
        }, duration * 0.5);

        setTimeout(() => {
          setCardOrder(prev => {
            if (prev.length === 0) return [];
            return [...prev.slice(1), prev[0]];
          });
        }, duration);
      } else {
        applySwipeStyles(0);
      }
    }

    isSwiping.current = false;
    startX.current = 0;
    currentX.current = 0;
  }, [getDurationFromCSS, getActiveCard, applySwipeStyles]);

  const handleMove = useCallback((clientX: number) => {
    if (!isSwiping.current) return;
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    animationFrameId.current = requestAnimationFrame(() => {
      currentX.current = clientX;
      const deltaX = currentX.current - startX.current;
      applySwipeStyles(deltaX);

      if (Math.abs(deltaX) > 50) {
        handleEnd();
      }
    });
  }, [applySwipeStyles, handleEnd]);

  useEffect(() => {
    const cardStackElement = cardStackRef.current;
    if (!cardStackElement) return;

    const handlePointerDown = (e: PointerEvent) => {
      // Allow buttons/links inside the card to be clicked without starting a swipe drag
      const target = e.target as HTMLElement;
      if (target.closest('a') || target.closest('button')) {
        return;
      }
      handleStart(e.clientX);
    };
    const handlePointerMove = (e: PointerEvent) => {
      handleMove(e.clientX);
    };
    const handlePointerUp = (e: PointerEvent) => {
      handleEnd();
    };

    cardStackElement.addEventListener('pointerdown', handlePointerDown);
    cardStackElement.addEventListener('pointermove', handlePointerMove);
    cardStackElement.addEventListener('pointerup', handlePointerUp);

    return () => {
      cardStackElement.removeEventListener('pointerdown', handlePointerDown);
      cardStackElement.removeEventListener('pointermove', handlePointerMove);
      cardStackElement.removeEventListener('pointerup', handlePointerUp);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [handleStart, handleMove, handleEnd]);

  useEffect(() => {
    updatePositions();
  }, [cardOrder, updatePositions]);

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Card Stack Area */}
      <section
        ref={cardStackRef}
        style={{
          width: cardWidth + 32,
          height: cardHeight + 32,
          touchAction: 'none',
          transformStyle: 'preserve-3d',
          '--card-perspective': '700px',
          '--card-z-offset': '12px',
          '--card-y-offset': '7px',
          '--card-max-z-index': imageList.length.toString(),
          '--card-swap-duration': '0.3s',
        } as React.CSSProperties}
        className="relative grid place-content-center select-none"
      >
        {cardOrder.map((originalIndex, displayIndex) => {
          const imageSrc = imageList[originalIndex];
          const filename = imageSrc.split('/').pop() || '';
          return (
            <article
              key={`${imageSrc}-${originalIndex}`}
              className="image-card absolute cursor-grab active:cursor-grabbing
                         place-self-center border border-white/10 rounded-2xl
                         shadow-2xl overflow-hidden will-change-transform bg-neutral-900 group"
              style={{
                '--i': (displayIndex + 1).toString(),
                zIndex: imageList.length - displayIndex,
                width: cardWidth,
                height: cardHeight,
                transform: `perspective(var(--card-perspective))
                           translateZ(calc(-1 * var(--card-z-offset) * var(--i)))
                           translateY(calc(var(--card-y-offset) * var(--i)))
                           translateX(var(--swipe-x, 0px))
                           rotateY(var(--swipe-rotate, 0deg))`
              } as React.CSSProperties}
            >
              <img
                src={imageSrc}
                alt={`Swiper image ${originalIndex + 1}`}
                className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-500 group-hover:scale-105"
                draggable={false}
              />
              {/* Filename text inside the image card - NOT a button */}
              <div className="absolute bottom-4 inset-x-0 flex justify-center z-20 pointer-events-none">
                <div className="px-4 py-2 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-white text-xs font-semibold tracking-wide select-none shadow-lg">
                  {filename}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Button below the stack to open the 3D model */}
      <div className="flex flex-col items-center mt-1">
        <a
          href={`/3d?model=${activeModelParam}`}
          target="_blank"
          rel="noopener noreferrer"
          ref={(el) => {
            if (el && !(el as any).__hasListeners) {
              (el as any).__hasListeners = true;
              const stopNative = (e: Event) => e.stopPropagation();
              el.addEventListener('pointerdown', stopNative);
              el.addEventListener('pointerup', stopNative);
              el.addEventListener('pointermove', stopNative);
              el.addEventListener('mousedown', stopNative);
              el.addEventListener('mouseup', stopNative);
              el.addEventListener('click', stopNative);
            }
          }}
          className="pointer-events-auto px-5 py-2.5 rounded-full bg-rose-500 text-white hover:bg-rose-600 text-[11px] font-extrabold uppercase tracking-widest transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95 flex items-center gap-1.5"
        >
          Open 3D Model 🪐
        </a>
      </div>
    </div>
  );
};
