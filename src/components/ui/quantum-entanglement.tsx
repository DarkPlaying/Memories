"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Heart, MousePointer2 } from "lucide-react";

interface QuantumEntanglementProps {
  images: string[];
}

interface FiberPathProps {
  fiber: {
    cp1XOffset: number;
    cp1YOffset: number;
    cp2XOffset: number;
    cp2YOffset: number;
    opacity: number;
    strokeWidth: number;
  };
  smoothX: any;
  smoothY: any;
  containerSize: { width: number; height: number };
}

const FiberPath: React.FC<FiberPathProps> = ({ fiber, smoothX, smoothY, containerSize }) => {
  const pathData = useTransform([smoothX, smoothY], ([x, y]: number[]) => {
    const w = containerSize.width;
    const h = containerSize.height;
    
    const startX = x;
    const startY = y;
    
    // Ghost cursor
    const endX = w - x;
    const endY = (h * 1.1) - y;

    // Distance determines how tightly they are pulled
    const dist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const tension = Math.min(1, dist / 800); // 1 = very loose, 0 = very tight

    // Control points
    const cp1X = startX + fiber.cp1XOffset * tension;
    const cp1Y = startY + fiber.cp1YOffset * tension;
    
    const cp2X = endX + fiber.cp2XOffset * tension;
    const cp2Y = endY + fiber.cp2YOffset * tension;

    return `M ${startX},${startY} C ${cp1X},${cp1Y} ${cp2X},${cp2Y} ${endX},${endY}`;
  });

  return (
    <motion.path
      d={pathData}
      fill="transparent"
      stroke="#ff0050"
      strokeWidth={fiber.strokeWidth}
      style={{ opacity: fiber.opacity }}
      className="blur-[0.5px]"
    />
  );
};

const RealisticCursor = ({ isGhost = false }: { isGhost?: boolean }) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: isGhost ? "drop-shadow(0 0 8px rgba(255,0,80,0.9))" : "drop-shadow(1px 2px 3px rgba(0,0,0,0.5))" }}>
    <path d="M4 4L13.5 24L15.5 16L23.5 13.5L4 4Z" fill="white" stroke="black" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

export const QuantumEntanglement: React.FC<QuantumEntanglementProps> = ({ images }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // Track if they have successfully connected the cursors
  const [isConnected, setIsConnected] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Mouse physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs to make the movement organic
  const springConfig = { damping: 20, stiffness: 100, mass: 1 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Ghost cursor physics (mirrored across the new vertical center of 55%)
  const ghostX = useTransform(smoothX, x => containerSize.width - x);
  const ghostY = useTransform(smoothY, y => (containerSize.height * 1.1) - y);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
        // Start cursors far apart, aligned with the new 55% vertical center
        mouseX.set(width * 0.1);
        mouseY.set(height * 0.55);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current || isConnected) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    mouseX.set(x);
    mouseY.set(y);

    // Calculate distance between user cursor and center
    const w = containerSize.width;
    const h = containerSize.height;
    
    // Ghost cursor is mirrored across width/2 and height*0.55
    const ghostX = w - x;
    const ghostY = (h * 1.1) - y;
    
    // Distance between user and ghost
    const dx = ghostX - x;
    const dy = ghostY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If they touch (close enough), SNAP!
    if (distance < 120) {
      setIsConnected(true);
      // Force them to perfectly merge in the new center
      mouseX.set(w / 2);
      mouseY.set(h * 0.55);
    }
  };

  // Generate fibers (50 organic lines)
  const numFibers = 50;
  const fibers = useMemo(() => {
    return Array.from({ length: numFibers }).map(() => ({
      // Random control point offsets to make it look like a tangled web
      cp1XOffset: (Math.random() - 0.5) * 600,
      cp1YOffset: (Math.random() - 0.5) * 600,
      cp2XOffset: (Math.random() - 0.5) * 600,
      cp2YOffset: (Math.random() - 0.5) * 600,
      opacity: 0.1 + Math.random() * 0.4,
      strokeWidth: 0.5 + Math.random() * 1.5,
    }));
  }, []);

  // Use ALL images for the reveal!
  const displayImages = images.length > 0 ? images : new Array(60).fill("/placeholder.svg");

  return (
    <div 
      className="w-full relative min-h-[700px] flex flex-col items-center justify-center overflow-hidden bg-black"
    >
      {/* Title */}
      <div className="absolute top-16 z-20 text-center flex flex-col items-center pointer-events-none">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-3 backdrop-blur-md">
          <Heart size={10} className="text-red-500 fill-current animate-pulse" />
          <span className="text-[9px] font-outfit uppercase tracking-[0.2em] text-red-300">✦ Act III: Quantum Entanglement ✦</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-black text-white mb-2 tracking-tight">
          Two Souls in the Dark
        </h2>
        <motion.p 
          animate={{ opacity: isConnected ? 0 : 1 }}
          className="text-xs sm:text-sm font-outfit text-red-200/60 font-light tracking-[0.2em] uppercase mt-4"
        >
          Find each other to connect the thread
        </motion.p>
      </div>

      {/* Interactive Area */}
      <div 
        ref={containerRef}
        className={`absolute inset-0 w-full h-full touch-none ${!isConnected ? 'cursor-none' : 'cursor-auto'}`}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Render fibers if not fully connected yet */}
          {!isConnected && containerSize.width > 0 && fibers.map((fiber, index) => (
            <FiberPath 
              key={index} 
              fiber={fiber} 
              smoothX={smoothX} 
              smoothY={smoothY} 
              containerSize={containerSize} 
            />
          ))}

          {/* Render solid snapped string when connected */}
          {isConnected && (
            <motion.line
              initial={{ pathLength: 0, opacity: 0, y1: containerSize.height * 0.55, y2: containerSize.height * 0.55 }}
              animate={{ pathLength: 1, opacity: 1, y1: containerSize.height * 0.4, y2: containerSize.height * 0.4 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              x1="0" x2={containerSize.width}
              stroke="#ff0050"
              strokeWidth="3"
              strokeLinecap="round"
              className="drop-shadow-[0_0_15px_rgba(255,0,80,0.8)]"
            />
          )}
        </svg>

        {/* User Cursor */}
        {!isConnected && (
          <motion.div
            className="absolute pointer-events-none z-50"
            style={{
              x: smoothX,
              y: smoothY,
              translateX: "-4px",
              translateY: "-4px",
            }}
          >
            <RealisticCursor />
          </motion.div>
        )}

        {/* Ghost Cursor */}
        {!isConnected && containerSize.width > 0 && (
          <motion.div
            className="absolute pointer-events-none z-50"
            style={{
              x: ghostX,
              y: ghostY,
              translateX: "-4px",
              translateY: "-4px",
            }}
          >
            <RealisticCursor isGhost={true} />
          </motion.div>
        )}

        {/* Reset Cursors Button (Before Connection) */}
        {!isConnected && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (containerRef.current) {
                  const { width, height } = containerRef.current.getBoundingClientRect();
                  mouseX.set(width * 0.1);
                  mouseY.set(height * 0.55);
                }
              }}
              className="px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-white/50 hover:text-white hover:border-white/50 hover:bg-white/10 text-[10px] uppercase tracking-[0.2em] transition-all backdrop-blur-md cursor-pointer"
            >
              Reset Positions
            </button>
          </div>
        )}

        {/* The Reveal - Neatly Arranged Photos */}
        <AnimatePresence>
          {isConnected && containerSize.width > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 pointer-events-none z-20"
            >
              {/* Massive glowing orb in center */}
              <motion.div
                initial={{ scale: 0, opacity: 0, top: '55%' }}
                animate={{ scale: [1, 3, 2], opacity: [1, 0.8, 0], top: '40%' }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="absolute w-64 h-64 bg-red-500/30 rounded-full blur-3xl left-1/2 -translate-x-1/2 -translate-y-1/2"
              />

              {/* Horizontal Scrollable Gallery exactly on the red thread */}
              <motion.div 
                initial={{ top: 'calc(55% + 4px)' }}
                animate={{ top: 'calc(40% + 4px)' }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute left-0 right-0 flex flex-row items-start gap-4 sm:gap-8 px-12 md:px-32 w-full max-w-[100vw] overflow-x-auto overflow-y-visible snap-x snap-mandatory pt-0 pb-16 pointer-events-auto z-30 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {displayImages.map((src, i) => {
                  // Elegant alternating rotation for a neat, professional polaroid look
                  const rotation = i % 2 === 0 ? -2 : 2;

                  return (
                    <motion.div
                      key={i}
                      className="cursor-pointer snap-center shrink-0"
                      initial={{ 
                        y: 100, 
                        scale: 0.5, 
                        rotate: 0,
                        opacity: 0
                      }}
                      animate={{ 
                        y: 0, 
                        scale: 1, 
                        rotate: rotation,
                        opacity: 1
                      }}
                      transition={{ 
                        type: "spring", 
                        damping: 15, 
                        stiffness: 100, 
                        delay: 0.5 + i * 0.05 
                      }}
                      whileHover={{ scale: 1.15, zIndex: 50, rotate: 0 }}
                      onClick={() => setExpandedIndex(i)}
                    >
                      {/* String attachment point (visual detail) */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#ff0050] rounded-full shadow-[0_0_10px_#ff0050] z-10" />
                      
                      <div className="bg-white p-2 pb-6 sm:p-3 sm:pb-8 rounded-sm shadow-[0_15px_35px_rgba(0,0,0,0.6)] relative z-0">
                        <div className="w-28 h-36 sm:w-36 sm:h-48 bg-neutral-100 overflow-hidden relative">
                          <img 
                            src={src} 
                            alt={`Memory ${i + 1}`}
                            className="w-full h-full object-cover filter contrast-110 saturate-110"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Expanded Image Overlay */}
              <AnimatePresence>
                {expandedIndex !== null && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto"
                    onClick={() => setExpandedIndex(null)}
                  >
                    <motion.div 
                      initial={{ scale: 0.8, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.8, y: 20 }}
                      transition={{ type: "spring", damping: 15 }}
                      className="bg-white p-3 sm:p-4 pb-12 sm:pb-16 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-w-full max-h-full flex flex-col relative rotate-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button 
                        onClick={() => setExpandedIndex(null)}
                        className="absolute -top-4 -right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:scale-110 transition-transform"
                      >
                        ✕
                      </button>
                      <div className="flex-1 overflow-hidden relative bg-neutral-900 border border-neutral-800">
                        <img 
                          src={displayImages[expandedIndex]} 
                          alt="Expanded Memory"
                          className="w-auto h-auto max-w-[85vw] max-h-[75vh] object-contain mx-auto"
                        />
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Retry Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2, duration: 0.5 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConnected(false);
                  mouseX.set(containerSize.width * 0.1);
                  mouseY.set(containerSize.height * 0.55);
                }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-auto z-50 px-6 py-2 rounded-full border border-red-500/50 bg-black/50 text-red-200/80 font-outfit text-xs tracking-[0.2em] uppercase hover:bg-red-500/20 hover:text-white hover:border-red-500 transition-all duration-300 backdrop-blur-md shadow-[0_0_15px_rgba(255,0,80,0.3)]"
              >
                Disconnect & Retry
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuantumEntanglement;
