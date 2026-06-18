"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import InkReveal from "@/components/ui/ink-reveal";
import { FlowButton } from "@/components/ui/flow-button";
import dynamic from "next/dynamic";

// Dynamic imports to optimize bundle size and speed up page load
const VideoPlayer = dynamic(() => import("@/components/ui/video-player"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-8 text-white gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <span className="text-xs font-outfit uppercase tracking-widest text-gray-400">Loading Video Player...</span>
    </div>
  ),
});

const AudioPlayer = dynamic(() => import("@/components/ui/audio-player"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-8 text-white gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <span className="text-xs font-outfit uppercase tracking-widest text-gray-400">Loading Audio Player...</span>
    </div>
  ),
});

const LoveMapSlide = dynamic(() => import("@/components/ui/love-map-slide"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[300px] text-white gap-2 bg-neutral-950 rounded-2xl border border-white/10">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <span className="text-xs font-outfit uppercase tracking-widest text-gray-400">Loading Interactive Map...</span>
    </div>
  ),
});

const ImageSwiper = dynamic(() => import("@/components/ui/image-swiper").then(mod => mod.ImageSwiper), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-8 text-white gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <span className="text-xs font-outfit uppercase tracking-widest text-gray-400">Loading Swiper...</span>
    </div>
  ),
});



export default function RevealPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
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

  // Prevent any scrolling when on the reveal page
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  const nextSlide = () => {
    setSlideIndex((prev) => (prev + 1) % 5);
  };

  const prevSlide = () => {
    setSlideIndex((prev) => (prev - 1 + 5) % 5);
  };

  const renderSlide = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="w-full max-w-2xl px-4 flex flex-col items-center justify-center gap-4">
            <h3 className="text-white font-playfair font-bold text-lg md:text-xl text-center">Our First Video</h3>
            <VideoPlayer src="/Video.mp4" />
          </div>
        );
      case 1:
        return (
          <div className="w-full flex flex-col items-center justify-center gap-4">
            <h3 className="text-white font-playfair font-bold text-lg md:text-xl text-center">Our First Song</h3>
            <AudioPlayer src="/love.mp3" cover="/BG.jpg" title="Our story" />
          </div>
        );
      case 2:
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-neutral-900/10">
            <h3 className="text-white font-playfair font-bold text-base sm:text-lg md:text-xl mb-2 sm:mb-3 text-center">Our First Picture Together</h3>
            <div className="relative max-w-[220px] xs:max-w-[260px] sm:max-w-[380px] md:max-w-[420px] w-full h-[180px] xs:h-[220px] sm:h-[400px] md:h-[490px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black animate-fade-in-up">
              <img src="/first image.jpeg" alt="Our First Memory" className="w-full h-full object-contain bg-black" />
            </div>
            <div className="mt-3 sm:mt-4 w-[90%] sm:w-[85%] max-w-[240px] sm:max-w-[320px] bg-neutral-950/80 border border-white/10 backdrop-blur-md py-1.5 px-3 sm:py-2.5 sm:px-4 rounded-xl sm:rounded-2xl text-center shadow-2xl">
              <p className="text-white font-outfit text-[10px] sm:text-xs sm:text-sm font-semibold tracking-wide">The Start of Something Beautiful</p>
              <p className="text-gray-300 text-[8px] sm:text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-outfit font-light">Cherished forever & always.</p>
            </div>
          </div>
        );
      case 3:
        return <LoveMapSlide />;
      case 4:
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-neutral-900/10">
            <h3 className="text-white font-playfair font-bold text-lg md:text-xl mb-4 text-center">Our 3D Memories</h3>
            <ImageSwiper
              images="/3d images/her.jpeg, /3d images/keychain.png, /3d images/me.png, /3d images/pair.png, /3d images/toy.png, /3d images/Beach Food.jpeg, /3d images/Beach Shadow Pic.jpeg, /3d images/First Beach Pic.jpeg, /3d images/First Celebration Pic.jpeg, /3d images/First Image Edit from her.jpeg, /3d images/First Long Drive.png, /3d images/Our First Foot Print.jpeg, /3d images/Butterfly Pathway.jpeg"
            />
          </div>
        );
      default:
        return null;
    }
  };

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
              Unveiling Memories...
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
    <main className="relative w-full h-screen overflow-hidden bg-black select-none">
      {/* Background Image (Revealed by scratching) */}
      <img
        src="/BG.jpg"
        alt="Secret Love Memory"
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-0"
      />

      {/* Full-Screen Scratch-Off Canvas */}
      <InkReveal
        maskColor={[10, 10, 10]}
        brushSize={110}
        lifetime={850}
        revealDelay={400}
        transitionDuration="2s"
        className="absolute inset-0 w-full h-full z-10"
      />

      {/* Floating Instructions (centered top-20 on mobile, top-8 right-8 on desktop) */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 sm:top-8 sm:right-8 sm:left-auto sm:translate-x-0 z-50 pointer-events-none w-[92%] sm:w-auto max-w-sm sm:max-w-none">
        <div className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-md text-[10px] sm:text-xs md:text-sm font-outfit text-gray-300 shadow-[0_4px_16px_rgba(0,0,0,0.5)] flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
          <span className="font-semibold text-white">0.4-Second Reveal:</span> Keep moving to uncover memory
        </div>
      </div>

      {/* Floating Button at center top (desktop) or center bottom (mobile) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:bottom-auto sm:top-8 z-50">
        <FlowButton text="Our First Things" onClick={() => { setIsModalOpen(true); setSlideIndex(0); }} />
      </div>

      {/* Floating Back Link to Story (fixed at top-left corner) */}
      <div className="fixed top-4 left-4 sm:top-8 sm:left-8 z-50">
        <FlowButton text="Go Back to Story" href="/?unlocked=true" />
      </div>

      {/* Pop-up Slider Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          >
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-5xl h-[85vh] bg-neutral-950 border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.9)] px-3 sm:px-8 py-8 sm:py-12"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 text-white/50 hover:text-white hover:bg-white/10 p-1.5 sm:p-2.5 rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Slider Content */}
              <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slideIndex}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full flex flex-col items-center justify-center"
                  >
                    {renderSlide(slideIndex)}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Slider Left Arrow */}
              <button
                onClick={prevSlide}
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-50 bg-black/60 border border-white/10 hover:bg-white/10 p-2.5 sm:p-3 rounded-full text-white transition-all cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Slider Right Arrow */}
              <button
                onClick={nextSlide}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-50 bg-black/60 border border-white/10 hover:bg-white/10 p-2.5 sm:p-3 rounded-full text-white transition-all cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Indicator Dots */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlideIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      slideIndex === i ? "bg-white w-5" : "bg-white/30 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
