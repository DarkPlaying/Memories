"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Sparkles } from "lucide-react";

interface GravityWellProps {
  images: string[];
}

export const GravityWell: React.FC<GravityWellProps> = ({ images }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Use 2 photos for the infinity interaction
  const displayImages = images.length >= 2 
    ? images.slice(0, 2) 
    : new Array(2).fill("/placeholder.svg");

  // Track the positions of the two draggable photos
  const p1X = useMotionValue(0);
  const p1Y = useMotionValue(0);
  const p2X = useMotionValue(0);
  const p2Y = useMotionValue(0);

  // Smooth springs for the path to react fluidly
  const springConfig = { damping: 15, stiffness: 100 };
  const smoothP1X = useSpring(p1X, springConfig);
  const smoothP1Y = useSpring(p1Y, springConfig);
  const smoothP2X = useSpring(p2X, springConfig);
  const smoothP2Y = useSpring(p2Y, springConfig);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
        // Initialize photos on opposite sides
        p1X.set(width * 0.3);
        p1Y.set(height * 0.3);
        
        p2X.set(width * 0.7);
        p2Y.set(height * 0.7);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Dynamically calculate the SVG path based on photo positions
  const pathData = useTransform(
    [smoothP1X, smoothP1Y, smoothP2X, smoothP2Y], 
    ([x1, y1, x2, y2]: number[]) => {
      const w = containerSize.width || 1000;
      const h = containerSize.height || 400;
      
      const midY = h / 2;

      // Distance between the two photos
      const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

      // If they are far apart, they just act as independent gravity wells pulling the horizontal thread
      if (dist > 300) {
        return `
          M 0,${midY} 
          Q ${x1},${y1} ${w/2},${midY} 
          Q ${x2},${y2} ${w},${midY}
        `;
      } 
      
      // If they are close, the thread loops around BOTH of them to form an infinity symbol (∞)!
      else {
        // Calculate the center point between them
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;

        // Angle between them
        const angle = Math.atan2(y2 - y1, x2 - x1);
        
        // Offset for the loops (making them wide enough to encircle the photos)
        const loopRadius = 150;
        
        // P1 Loop controls
        const cp1x = x1 - Math.cos(angle) * loopRadius - Math.sin(angle) * loopRadius;
        const cp1y = y1 - Math.sin(angle) * loopRadius + Math.cos(angle) * loopRadius;
        
        const cp2x = x1 - Math.cos(angle) * loopRadius + Math.sin(angle) * loopRadius;
        const cp2y = y1 - Math.sin(angle) * loopRadius - Math.cos(angle) * loopRadius;

        // P2 Loop controls
        const cp3x = x2 + Math.cos(angle) * loopRadius - Math.sin(angle) * loopRadius;
        const cp3y = y2 + Math.sin(angle) * loopRadius + Math.cos(angle) * loopRadius;
        
        const cp4x = x2 + Math.cos(angle) * loopRadius + Math.sin(angle) * loopRadius;
        const cp4y = y2 + Math.sin(angle) * loopRadius - Math.cos(angle) * loopRadius;

        // Draw the infinity symbol (∞)
        return `
          M 0,${midY} 
          Q ${centerX},${centerY} ${centerX},${centerY}
          C ${cp1x},${cp1y} ${cp2x},${cp2y} ${centerX},${centerY}
          C ${cp3x},${cp3y} ${cp4x},${cp4y} ${centerX},${centerY}
          Q ${centerX},${centerY} ${w},${midY}
        `;
      }
    }
  );

  return (
    <div 
      className="w-full relative min-h-[700px] flex flex-col items-center justify-center overflow-hidden bg-[#050002]"
    >
      {/* Title Area */}
      <div className="absolute top-16 z-20 text-center flex flex-col items-center pointer-events-none">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-3">
          <Sparkles size={10} className="text-red-500 fill-current animate-pulse" />
          <span className="text-[9px] font-outfit uppercase tracking-[0.2em] text-red-300">✦ Act V: The Gravity Well ✦</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-black text-white mb-2 tracking-tight">
          Inescapable Pull
        </h2>
        <p className="text-xs sm:text-sm font-outfit text-red-200/60 font-light tracking-[0.2em] uppercase mt-4">
          Drag the memories close together
        </p>
      </div>

      <div 
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <motion.path
            d={pathData}
            fill="transparent"
            stroke="#ff0050"
            strokeWidth="15"
            strokeLinecap="round"
            className="blur-[8px] opacity-30"
          />
          <motion.path
            d={pathData}
            fill="transparent"
            stroke="#ff0050"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>

        {/* Draggable Photo 1 */}
        {containerSize.width > 0 && (
          <motion.div
            className="absolute z-10 cursor-grab active:cursor-grabbing"
            style={{ x: p1X, y: p1Y, translateX: "-50%", translateY: "-50%" }}
            drag
            dragMomentum={false}
            dragElastic={0.1}
            dragConstraints={containerRef}
            whileHover={{ scale: 1.05 }}
            whileDrag={{ scale: 1.1, zIndex: 50 }}
          >
            <div className="bg-white p-2 pb-6 sm:p-3 sm:pb-10 rounded-sm shadow-[0_15px_35px_rgba(0,0,0,0.8)]">
              <div className="w-32 h-40 sm:w-48 sm:h-64 bg-neutral-900 overflow-hidden relative">
                <img 
                  src={displayImages[0]} 
                  alt={`Memory 1`}
                  className="w-full h-full object-cover filter contrast-110 saturate-110 pointer-events-none"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Draggable Photo 2 */}
        {containerSize.width > 0 && (
          <motion.div
            className="absolute z-10 cursor-grab active:cursor-grabbing"
            style={{ x: p2X, y: p2Y, translateX: "-50%", translateY: "-50%" }}
            drag
            dragMomentum={false}
            dragElastic={0.1}
            dragConstraints={containerRef}
            whileHover={{ scale: 1.05 }}
            whileDrag={{ scale: 1.1, zIndex: 50 }}
          >
            <div className="bg-white p-2 pb-6 sm:p-3 sm:pb-10 rounded-sm shadow-[0_15px_35px_rgba(0,0,0,0.8)]">
              <div className="w-32 h-40 sm:w-48 sm:h-64 bg-neutral-900 overflow-hidden relative">
                <img 
                  src={displayImages[1]} 
                  alt={`Memory 2`}
                  className="w-full h-full object-cover filter contrast-110 saturate-110 pointer-events-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GravityWell;
