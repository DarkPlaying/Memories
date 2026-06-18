"use client";

import { useState, useEffect } from "react";
import StellarCardGallerySingle from "@/components/ui/3d-image-gallery";

export default function MyWorldPage() {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const intervalTime = 15;
    const steps = duration / intervalTime;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const nextProgress = Math.min(100, Math.round((step / steps) * 100));
      setLoadingProgress(nextProgress);
      if (step >= steps) {
        clearInterval(timer);
        setIsPageLoading(false);
      }
    }, intervalTime);
    return () => clearInterval(timer);
  }, []);

  if (isPageLoading) {
    return (
      <main className="relative min-h-screen w-full bg-[#030308] text-white flex flex-col items-center justify-center p-4">
        {/* Soft pink/purple ambient light in background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] bg-purple-900/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="flex flex-col items-center justify-center relative z-10">
          <img 
            src="/loader.gif" 
            alt="Loading..." 
            className="w-32 h-32 sm:w-44 sm:h-44 object-contain filter drop-shadow-[0_0_12px_rgba(168,85,247,0.25)]" 
          />
          <div className="mt-4 flex flex-col items-center gap-1.5">
            <p className="text-purple-400/90 text-[10px] sm:text-xs font-outfit uppercase tracking-[0.25em] font-semibold animate-pulse">
              Entering 3D World...
            </p>
            <span className="text-white/80 font-mono text-xs sm:text-sm font-bold">
              {loadingProgress}%
            </span>
            {/* Ambient Progress Bar */}
            <div className="w-28 sm:w-36 h-[3px] bg-white/5 rounded-full overflow-hidden mt-1 border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-75 ease-out" 
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full h-screen bg-black">
      <StellarCardGallerySingle />
    </main>
  );
}
