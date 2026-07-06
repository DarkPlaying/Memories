"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Heart } from "lucide-react";

interface RedStringGalleryProps {
  images: string[];
}

export const RedStringGallery: React.FC<RedStringGalleryProps> = ({ images }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Motion values for the interactive physics of the tangled string
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  
  // Highly elastic spring for the "snap back" effect
  const springConfig = { damping: 8, stiffness: 120, mass: 1 };
  const springX = useSpring(pointerX, springConfig);
  const springY = useSpring(pointerY, springConfig);
  
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
        pointerX.set(width / 2);
        pointerY.set(height / 2);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Magnetic pull distance
    if (Math.abs(y - containerSize.height / 2) < 250) {
      pointerX.set(x);
      pointerY.set(y);
    } else {
      handlePointerLeave();
    }
  };

  const handlePointerLeave = () => {
    // Snap violently back to center
    pointerX.set(containerSize.width / 2);
    pointerY.set(containerSize.height / 2);
  };

  // Select 4 photos
  const displayImages = images.length >= 4 
    ? images.slice(0, 4) 
    : [
        "/memories/WOS/WhatsApp%20Image%202026-04-02%20at%2019.57.08.jpeg",
        "/memories/WOS/WhatsApp%20Image%202026-04-02%20at%2019.57.11.jpeg",
        "/memories/WOS/WhatsApp%20Image%202026-04-02%20at%2019.57.17.jpeg",
        "/memories/WOS/WhatsApp%20Image%202026-04-02%20at%2019.57.18.jpeg"
      ];

  // Calculate scatter nodes for the photos
  const photoNodes = useMemo(() => {
    return displayImages.map((src, i) => {
      const num = displayImages.length;
      const percentX = (i + 1) / (num + 1);
      // Alternate top and bottom scattering
      const offsetY = i % 2 === 0 ? -60 : 70;
      // Random tilt
      const rotation = (i % 2 === 0 ? 1 : -1) * (5 + Math.random() * 15);
      return { percentX, offsetY, rotation, src };
    });
  }, [displayImages]);

  // Generate a crazy tangled SVG path that literally loops around the photos
  const pathData = useTransform([springX, springY], ([mx, my]: number[]) => {
    const w = containerSize.width || 1000;
    const h = containerSize.height || 400;
    
    // Define the anchor points: Start -> Photos -> End
    const points = [
      { x: 0, y: h/2 },
      ...photoNodes.map(node => ({
        x: w * node.percentX,
        y: h/2 + node.offsetY
      })),
      { x: w, y: h/2 }
    ];

    // Calculate how far the mouse is dragging from the center
    const dragX = mx - w/2;
    const dragY = my - h/2;

    let d = `M ${points[0].x},${points[0].y} `;
    
    // Draw deeply tangled cubic bezier curves between every point
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i+1];
      
      const dist = p2.x - p1.x;
      
      // Control points for a loop! 
      // By overshooting the X coordinates significantly, the path folds back on itself creating a knot/loop.
      // The dragX/dragY modifies the tangles in real-time, making them squirm!
      const cp1x = p1.x + dist * 1.6 + dragX * 0.4 * (i % 2 === 0 ? 1 : -1);
      const cp1y = p1.y - 180 + dragY * 0.5 * (i % 3 === 0 ? 1 : -1);
      
      const cp2x = p2.x - dist * 1.6 + dragX * 0.4 * (i % 2 === 0 ? -1 : 1);
      const cp2y = p2.y + 180 + dragY * 0.5 * (i % 3 === 0 ? -1 : 1);

      d += `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y} `;
    }
    return d;
  });

  return (
    <div 
      className="w-full relative min-h-[600px] flex flex-col items-center justify-center overflow-hidden py-16"
    >
      {/* Act Title */}
      <div className="z-20 text-center mb-16 flex flex-col items-center pointer-events-none">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-3">
          <Heart size={10} className="text-red-500 fill-current animate-pulse" />
          <span className="text-[9px] font-outfit uppercase tracking-[0.2em] text-red-300">✦ Act II ✦</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-black text-white mb-4 tracking-tight leading-tight">
          The Red Thread of Fate
        </h2>
        <p className="text-xs sm:text-sm font-outfit text-red-200/60 font-light leading-relaxed max-w-xl px-4 italic text-balance">
          "According to ancient myth, an invisible red thread connects those who are destined to meet. The thread may stretch or tangle deeply, but it will never, ever break."
        </p>
      </div>

      {/* Tangled Physics String Area */}
      <div 
        ref={containerRef}
        className="relative w-full h-[400px] touch-none cursor-grab active:cursor-grabbing group"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerUp={handlePointerLeave}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-900/10 to-transparent pointer-events-none" />

        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          {/* Subtle outer glow */}
          <motion.path
            d={pathData}
            fill="transparent"
            stroke="rgba(255, 0, 80, 0.15)"
            strokeWidth="15"
            strokeLinecap="round"
            className="blur-[8px]"
          />
          {/* Inner core string */}
          <motion.path
            d={pathData}
            fill="transparent"
            stroke="#ff0050"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        {/* Scattered Photos wrapped in the string */}
        {containerSize.width > 0 && photoNodes.map((node, index) => {
          const w = containerSize.width;
          const h = containerSize.height;
          const x = w * node.percentX;
          const y = h / 2 + node.offsetY;

          return (
            <motion.div
              key={index}
              className="absolute pointer-events-auto cursor-pointer"
              style={{
                left: x,
                top: y,
                translateX: "-50%",
                translateY: "-50%",
                rotate: node.rotation,
              }}
              // Floating hover animation!
              animate={{
                y: [y - 10, y + 10, y - 10],
                rotate: [node.rotation - 2, node.rotation + 2, node.rotation - 2]
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.5
              }}
              whileHover={{ scale: 1.15, zIndex: 50, transition: { duration: 0.3 } }}
            >
              {/* Circular knot to show it's tied to the photo */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#ff0050] bg-zinc-900 z-20 shadow-[0_0_10px_#ff0050]" />
              
              <div className="bg-white p-2 pb-6 sm:p-3 sm:pb-10 rounded-sm shadow-[0_15px_35px_rgba(0,0,0,0.6)]">
                <div className="w-20 h-24 sm:w-32 sm:h-40 bg-neutral-100 overflow-hidden relative">
                  <img 
                    src={node.src} 
                    alt={`Memory ${index + 1}`}
                    className="w-full h-full object-cover filter contrast-110 saturate-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <p className="text-[10px] sm:text-xs text-neutral-500 font-outfit uppercase tracking-[0.3em] mt-4 opacity-50 group-hover:opacity-100 transition-opacity">
        Drag the tangled string
      </p>
    </div>
  );
};

export default RedStringGallery;
