"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Sparkles } from "lucide-react";

interface MemoryTunnel3DProps {
  images: string[];
}

export const MemoryTunnel3D: React.FC<MemoryTunnel3DProps> = ({ images }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // We make the container very tall so the user has to scroll down to travel through the tunnel
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Smooth the scroll heavily so it feels cinematic and floaty
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 40,
    damping: 15,
    restDelta: 0.001
  });

  // Limit images for performance, say 12 images max
  const tunnelImages = images.length > 0 ? images.slice(0, 12) : new Array(10).fill("/placeholder.svg");
  const tunnelDepth = tunnelImages.length * 1200; // How deep the tunnel goes in pixels

  // Map scroll progress (0 to 1) to Z-axis travel distance
  // At 0 scroll, we are at Z=0. At 1 scroll, we've traveled the full tunnel depth.
  const cameraZ = useTransform(smoothProgress, [0, 1], [0, tunnelDepth + 1000]);

  // Words that float by
  const floatingWords = ["Eternity", "Destiny", "Soulmates", "Forever", "Us"];

  return (
    <div 
      ref={containerRef} 
      // The height dictates how long the user must scroll to finish the section
      style={{ height: `${tunnelImages.length * 50}vh` }} 
      className="relative w-full bg-transparent"
    >
      {/* Sticky container stays on screen while we scroll the parent */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-transparent perspective-[1200px] sm:perspective-[1500px]">
        
        {/* The 3D World container */}
        <div 
          className="relative w-full h-full" 
          style={{ transformStyle: "preserve-3d" }}
        >
          
          {/* Act Title Floating at the very beginning of the tunnel */}
          <motion.div 
            className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
            style={{
              // Fade out early as we travel into the tunnel
              opacity: useTransform(cameraZ, [0, 800], [1, 0]),
              translateZ: useTransform(cameraZ, z => z * 1.0)
            }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-3 backdrop-blur-md">
              <Sparkles size={10} className="text-blue-400" />
              <span className="text-[9px] font-outfit uppercase tracking-[0.2em] text-blue-200">✦ Act III ✦</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-black text-white mb-4 tracking-tight">
              The Memory Tunnel
            </h2>
            <p className="text-xs sm:text-sm font-outfit text-white/50 tracking-[0.3em] uppercase">
              Scroll to travel through time
            </p>
          </motion.div>

          {/* Render 3D Floating Images */}
          {tunnelImages.map((src, index) => {
            // Distribute images deep into the screen. 
            // e.g. -1200, -2400, -3600...
            const initialZ = -(index + 1) * 1200;
            
            // Randomly offset X and Y so they form a scattered tunnel
            const randomX = (index % 2 === 0 ? 1 : -1) * (150 + (index % 3) * 80);
            const randomY = (index % 3 === 0 ? 1 : -1) * (100 + (index % 2) * 120);
            const randomRotate = (index % 5 - 2) * 8; // Slight tilt
            
            // The image's current physical Z position is its initial Z PLUS the camera's Z travel
            const currentZ = useTransform(cameraZ, z => initialZ + z);

            // Opacity: Fade in from distance, full opacity near 0, fade out when it passes behind camera (z > 400)
            const opacity = useTransform(currentZ, [-2500, -500, 200, 800], [0, 1, 1, 0]);

            return (
              <motion.div
                key={index}
                className="absolute left-1/2 top-1/2 rounded-xl shadow-2xl overflow-hidden border border-white/10"
                style={{
                  width: index % 4 === 0 ? "280px" : "200px",
                  height: index % 4 === 0 ? "400px" : "280px",
                  marginLeft: index % 4 === 0 ? "-140px" : "-100px",
                  marginTop: index % 4 === 0 ? "-200px" : "-140px",
                  x: randomX,
                  y: randomY,
                  rotateZ: randomRotate,
                  translateZ: currentZ,
                  opacity: opacity,
                  filter: useTransform(currentZ, z => `blur(${Math.max(0, z < -800 ? (Math.abs(z) - 800)/200 : z > 300 ? (z-300)/50 : 0)}px)`)
                }}
              >
                <img 
                  src={src} 
                  alt={`Memory Tunnel ${index}`}
                  className="w-full h-full object-cover filter contrast-110"
                />
              </motion.div>
            );
          })}

          {/* Floating Words scattered in the tunnel */}
          {floatingWords.map((word, index) => {
            const initialZ = -(index * 2500 + 1800);
            const randomX = (index % 2 === 0 ? -1 : 1) * 200;
            const currentZ = useTransform(cameraZ, z => initialZ + z);
            const opacity = useTransform(currentZ, [-1500, -200, 200, 600], [0, 1, 1, 0]);

            return (
              <motion.div
                key={word}
                className="absolute left-1/2 top-1/2 text-4xl sm:text-6xl md:text-8xl font-playfair font-black text-white/5 pointer-events-none uppercase tracking-widest"
                style={{
                  x: randomX,
                  marginLeft: "-150px", // Approximate centering
                  translateZ: currentZ,
                  opacity: opacity,
                }}
              >
                {word}
              </motion.div>
            );
          })}
          
        </div>
      </div>
    </div>
  );
};

export default MemoryTunnel3D;
