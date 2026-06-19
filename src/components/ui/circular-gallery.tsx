import React, { useState, useEffect, useRef, useImperativeHandle, HTMLAttributes } from 'react';

// A simple utility for conditional class names
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
}

// Define the type for a single gallery item
export interface GalleryItem {
  common: string;
  binomial: string;
  photo: {
    url: string; 
    text: string;
    pos?: string;
    by: string;
  };
}

// Define the props for the CircularGallery component
interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: GalleryItem[];
  /** Controls how far the items are from the center. */
  radius?: number;
  /** Controls the speed of auto-rotation when not scrolling/interacting. */
  autoRotateSpeed?: number;
  /** Width of the individual cards. */
  cardWidth?: number;
  /** Height of the individual cards. */
  cardHeight?: number;
  onItemClick?: (index: number) => void;
}

export interface CircularGalleryRef {
  getRotation: () => number;
  setRotation: (rot: number | ((prev: number) => number)) => void;
}

const CircularGallery = React.forwardRef<CircularGalleryRef, CircularGalleryProps>(
  ({ items, className, radius = 600, autoRotateSpeed = 0.02, cardWidth = 300, cardHeight = 400, onItemClick, ...props }, ref) => {
    const [rotation, setRotation] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const dragDistanceRef = useRef(0);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Expose the rotation value and setRotation function to the parent component
    useImperativeHandle(ref, () => ({
      getRotation: () => rotation,
      setRotation: (rot) => {
        if (typeof rot === 'function') {
          setRotation(prev => rot(prev));
        } else {
          setRotation(rot);
        }
      }
    }), [rotation]);

    // Handle mouse wheel scrolling for rotation on fixed viewport
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleWheel = (e: WheelEvent) => {
        // Prevent browser page scroll
        e.preventDefault();
        setIsScrolling(true);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // Rotate -0.15 degrees per deltaY unit (scroll down -> go to left)
        setRotation(prev => prev - e.deltaY * 0.15);

        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 150);
      };

      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }, []);

    // Effect for auto-rotation when not interacting
    useEffect(() => {
      const autoRotate = () => {
        if (!isScrolling) {
          setRotation(prev => prev + autoRotateSpeed);
        }
        animationFrameRef.current = requestAnimationFrame(autoRotate);
      };

      animationFrameRef.current = requestAnimationFrame(autoRotate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [isScrolling, autoRotateSpeed]);

    // Handle touch/mouse dragging for rotation on fixed viewport
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      const startX = e.clientX;
      const startY = e.clientY;
      const startRotation = rotation;
      dragDistanceRef.current = 0;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        dragDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
        setRotation(startRotation + dx * 0.25); // 0.25 degrees per pixel drag
      };

      const handlePointerUp = () => {
        setIsScrolling(false);
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    };

    const anglePerItem = 360 / items.length;
    
    return (
      <div
        ref={containerRef}
        role="region"
        aria-label="Circular 3D Gallery"
        className={cn("relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing", className)}
        style={{ perspective: '2000px', touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        {...props}
      >
        <div
          className="relative w-full h-full"
          style={{
            transform: `rotateY(${rotation}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {items.map((item, i) => {
            const itemAngle = i * anglePerItem;
            const totalRotation = rotation % 360;
            const relativeAngle = (itemAngle + totalRotation + 360) % 360;
            const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
            const opacity = Math.max(0.3, 1 - (normalizedAngle / 180));

            return (
              <div
                key={item.photo.url} 
                role="group"
                aria-label={item.common}
                className="absolute cursor-pointer"
                onClick={() => {
                  if (dragDistanceRef.current < 10 && onItemClick) {
                    onItemClick(i);
                  }
                }}
                style={{
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                  transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                  left: '50%',
                  top: '50%',
                  marginLeft: `-${cardWidth / 2}px`,
                  marginTop: `-${cardHeight / 2}px`,
                  opacity: opacity,
                  transition: 'opacity 0.3s linear'
                }}
              >
                <div className="relative w-full h-full rounded-lg shadow-2xl overflow-hidden border border-border bg-card/70 dark:bg-card/30 backdrop-blur-lg">
                  <img
                    src={item.photo.url}
                    alt={item.photo.text}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: item.photo.pos || 'center' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

CircularGallery.displayName = 'CircularGallery';

export { CircularGallery };
