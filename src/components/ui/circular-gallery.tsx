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
  onActiveIndexChange?: (index: number) => void;
  previews?: { [date: string]: any[] };
}

export interface CircularGalleryRef {
  getRotation: () => number;
  setRotation: (rot: number | ((prev: number) => number)) => void;
}

const CircularGallery = React.forwardRef<CircularGalleryRef, CircularGalleryProps>(
  ({ items, className, radius = 600, autoRotateSpeed = 0.02, cardWidth = 300, cardHeight = 400, onItemClick, onActiveIndexChange, previews, ...props }, ref) => {
    const [rotation, setRotation] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const targetRotationRef = useRef(0);
    const currentRotationRef = useRef(0);
    const dragDistanceRef = useRef(0);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const onActiveIndexChangeRef = useRef(onActiveIndexChange);
    useEffect(() => {
      onActiveIndexChangeRef.current = onActiveIndexChange;
    }, [onActiveIndexChange]);

    useEffect(() => {
      const itemsCount = items.length;
      if (itemsCount === 0) return;
      const anglePerItem = 360 / itemsCount;
      const totalRotation = rotation % 360;
      
      let minAngle = 360;
      let activeIdx = 0;
      for (let i = 0; i < itemsCount; i++) {
        const itemAngle = i * anglePerItem;
        const relativeAngle = (itemAngle + totalRotation + 360) % 360;
        const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
        if (normalizedAngle < minAngle) {
          minAngle = normalizedAngle;
          activeIdx = i;
        }
      }
      if (onActiveIndexChangeRef.current) {
        onActiveIndexChangeRef.current(activeIdx);
      }
    }, [rotation, items.length]);

    // Expose the rotation value and setRotation function to the parent component
    // Keep target and current in sync initially
    useEffect(() => {
      targetRotationRef.current = rotation;
      currentRotationRef.current = rotation;
    }, []);

    // Expose the rotation value and setRotation function to the parent component
    useImperativeHandle(ref, () => ({
      getRotation: () => targetRotationRef.current,
      setRotation: (rot) => {
        if (typeof rot === 'function') {
          const next = rot(targetRotationRef.current);
          targetRotationRef.current = next;
        } else {
          targetRotationRef.current = rot;
        }
      }
    }), []);

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

        // Rotate -0.1 degrees per deltaY unit
        targetRotationRef.current -= e.deltaY * 0.1;

        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 150);
      };

      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }, []);

    // Unified animation loop for auto-rotation and smooth LERP physics
    useEffect(() => {
      const updatePhysics = () => {
        if (isDragging) {
          // Dragging updates target and current instantly in handlePointerDown
        } else {
          // Auto-rotate if not scrolling
          if (!isScrolling) {
            targetRotationRef.current += autoRotateSpeed;
          }

          // Smoothly interpolate current rotation towards target rotation
          const diff = targetRotationRef.current - currentRotationRef.current;
          if (Math.abs(diff) > 0.01) {
            currentRotationRef.current += diff * 0.12; // Easing coefficient (LERP)
            setRotation(currentRotationRef.current);
          } else if (currentRotationRef.current !== targetRotationRef.current) {
            currentRotationRef.current = targetRotationRef.current;
            setRotation(currentRotationRef.current);
          }
        }
        animationFrameRef.current = requestAnimationFrame(updatePhysics);
      };

      animationFrameRef.current = requestAnimationFrame(updatePhysics);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [isScrolling, isDragging, autoRotateSpeed]);

    // Handle touch/mouse dragging for rotation on fixed viewport
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      setIsScrolling(true);
      setIsDragging(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      const startX = e.clientX;
      const startY = e.clientY;
      const startRotation = targetRotationRef.current;
      dragDistanceRef.current = 0;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        dragDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
        const nextRot = startRotation + dx * 0.25;
        targetRotationRef.current = nextRot;
        currentRotationRef.current = nextRot;
        setRotation(nextRot);
      };

      const handlePointerUp = () => {
        setIsScrolling(false);
        setIsDragging(false);
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
                key={item.binomial} 
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
                <div className="relative w-full h-full rounded-lg shadow-2xl overflow-hidden border border-neutral-800 bg-[#FAF6F0] text-neutral-800">
                  {previews && previews[item.binomial] ? (
                    <div className="w-full h-full flex flex-col text-neutral-800 relative select-none font-outfit p-2.5">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-[#ede6df] pb-1.5 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full overflow-hidden border border-[#ede6df] bg-neutral-900 flex items-center justify-center">
                            <img src="/stamp.png" alt="Logo" className="w-full h-full object-cover p-1" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold leading-tight">Our Story'26</span>
                            <span className="text-[6.5px] text-green-600 font-medium">online</span>
                          </div>
                        </div>
                        <span className="text-[7.5px] font-bold text-neutral-450 uppercase tracking-wider">{item.binomial}</span>
                      </div>

                      {/* Chats area */}
                      <div 
                        className="flex-1 min-h-0 overflow-y-auto scrollbar-none py-2 space-y-2 flex flex-col justify-start"
                      >
                        {previews[item.binomial].slice(0, 10).map((msg, mIdx) => {
                          const isRight = msg.sender.toLowerCase().includes("sanjay");
                          return (
                            <div key={msg.id || mIdx} className={`flex w-full ${isRight ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[85%] rounded-[12px] px-2.5 py-1 text-[8px] leading-relaxed shadow-sm ${
                                isRight 
                                  ? "bg-[#b09581] text-white rounded-tr-none" 
                                  : "bg-white text-[#40352f] border border-[#ede6df] rounded-tl-none"
                              }`}>
                                <p className="break-all whitespace-pre-wrap">{msg.content}</p>
                                <div className={`text-[5px] mt-0.5 text-right ${isRight ? "text-white/70" : "text-neutral-450"}`}>
                                  {msg.time}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Input Mockup */}
                      <div className="mt-1 flex items-center gap-1.5 shrink-0">
                        <div className="flex-1 bg-white rounded-full border border-[#ede6df] px-2.5 py-1 text-[7.5px] text-neutral-400">
                          Type a message...
                        </div>
                        <div className="w-5 h-5 rounded-full bg-[#b09581] text-white flex items-center justify-center shrink-0">
                          <span className="text-[7px]">➤</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-[#FAF6F0] flex flex-col items-center justify-center p-4">
                      <img src="/loader.gif" alt="Loading..." className="w-8 h-8 object-contain" />
                      <span className="text-[8px] text-[#8c7e74] font-semibold font-outfit mt-1 animate-pulse uppercase tracking-wider">Loading...</span>
                    </div>
                  )}
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
