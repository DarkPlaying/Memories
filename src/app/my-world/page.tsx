"use client";

import { useState, useEffect } from "react";
import StellarCardGallerySingle from "@/components/ui/3d-image-gallery";

export default function MyWorldPage() {
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
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
          <p className="text-purple-400/90 text-[10px] sm:text-xs font-outfit mt-4 uppercase tracking-[0.25em] animate-pulse font-semibold">
            Entering 3D World...
          </p>
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
