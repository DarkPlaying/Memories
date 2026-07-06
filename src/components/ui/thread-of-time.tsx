"use client";

import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Clock } from "lucide-react";

interface ThreadOfTimeProps {
  images: string[];
}

export const ThreadOfTime: React.FC<ThreadOfTimeProps> = ({ images }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // We make the container tall so the user scrolls down along the timeline
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 40,
    damping: 15,
  });

  // Fade out title only at the very bottom
  const titleOpacity = useTransform(smoothProgress, [0.95, 1], [1, 0]);

  // The final image represents "Our First Story" which goes at the very end
  const finalPhotoFound = images.find(img => img.toLowerCase().includes("our first story"));
  const finalPhoto = finalPhotoFound || (images.length > 0 ? images[images.length - 1] : "/placeholder.svg");

  // Exclude final photo from timeline and filter out First Bite
  let timelineImages = images.filter(img => img !== finalPhoto && !img.toLowerCase().includes("first bite"));
  
  // Ensure "Butterfly Pathway" is the very first image
  const butterflyIndex = timelineImages.findIndex(img => img.toLowerCase().includes("butterfly pathway"));
  if (butterflyIndex > 0) {
    const butterflyImg = timelineImages.splice(butterflyIndex, 1)[0];
    timelineImages.unshift(butterflyImg);
  }
  
  // Divide the images so the center thread circles use DIFFERENT images than the main polaroids
  const mainPolaroidImages = timelineImages.filter((_, i) => i % 2 === 0);
  const centerCircleImages = timelineImages.filter((_, i) => i % 2 !== 0);
  const fallbackCenterImages = centerCircleImages.length > 0 ? centerCircleImages : timelineImages;

  return (
    <div 
      ref={containerRef}
      className="w-full relative bg-[#050002] overflow-hidden py-32"
    >


      {/* Sticky Title (Stays on screen while you scroll) */}
      <motion.div 
        style={{ opacity: titleOpacity }}
        className="sticky top-[15vh] z-20 w-full text-center flex flex-col items-center pointer-events-none drop-shadow-2xl"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-3 backdrop-blur-md">
          <Clock size={10} className="text-red-500 fill-current animate-pulse" />
          <span className="text-[9px] font-outfit uppercase tracking-[0.2em] text-red-300">✦ Act VI: Thread of Time ✦</span>
        </div>
        <h2 className="text-4xl sm:text-5xl md:text-7xl font-playfair font-black text-white mb-2 tracking-tight">
          Growing Stronger
        </h2>
        <p className="text-xs sm:text-sm font-outfit text-red-200/80 font-light tracking-[0.2em] uppercase mt-4 bg-black/30 px-4 py-1 rounded-full">
          Scroll down the timeline
        </p>
      </motion.div>

      {/* Content wrapper with red thread */}
      <div className="relative w-full mt-[30vh]">
        {/* The Thread of Time */}
        <div 
          className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 bg-gradient-to-b from-[#ff0050] via-[#8b0025] to-[#3d000e] shadow-[0_0_30px_rgba(255,0,80,0.5)] z-0"
          style={{ width: "40px", clipPath: "polygon(48% 0, 52% 0, 0% 100%, 100% 100%)" }}
        />

        {/* Timeline Photos */}
        <div className="relative w-full max-w-6xl mx-auto flex flex-col gap-4 sm:gap-8 pointer-events-none z-10">
        {mainPolaroidImages.map((src, i) => {
          const isLeft = i % 2 === 0;

          return (
            <div 
              key={i} 
              className={`w-full flex ${isLeft ? 'justify-start' : 'justify-end'} px-0`}
            >
              <div className={`w-1/2 flex ${isLeft ? 'justify-end pr-8 sm:pr-12 md:pr-48' : 'justify-start pl-8 sm:pl-12 md:pl-48'} justify-center`}>
                <motion.div
                  initial={{ opacity: 0, y: 100, scale: 0.8 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.1 }}
                  className="relative z-10 pointer-events-auto"
                >
                  {/* Connecting thread line */}
                  <div 
                    className={`absolute top-1/2 ${isLeft ? 'right-[-2rem] sm:right-[-4rem] md:right-[-12rem]' : 'left-[-2rem] sm:left-[-4rem] md:left-[-12rem]'} -translate-y-1/2 h-[2px] w-[2rem] sm:w-[4rem] md:w-[12rem] bg-gradient-to-r ${isLeft ? 'from-transparent to-[#ff0050]' : 'from-[#ff0050] to-transparent'} z-0`}
                  />

                  {/* Center Timeline Image (uses different image set) */}
                  <div 
                    onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                    className={`absolute top-1/2 ${isLeft ? 'right-[-2rem] sm:right-[-4rem] md:right-[-12rem] translate-x-1/2' : 'left-[-2rem] sm:left-[-4rem] md:left-[-12rem] -translate-x-1/2'} -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 rounded-full overflow-hidden border border-[#ff0050] md:border-2 shadow-[0_0_15px_rgba(255,0,80,0.6)] z-20 bg-neutral-900 cursor-pointer hover:scale-125 transition-transform duration-300 pointer-events-auto`}
                  >
                    <img 
                      src={fallbackCenterImages[i % fallbackCenterImages.length]} 
                      alt="Timeline Connected Memory"
                      className="w-full h-full object-cover filter contrast-125 pointer-events-none"
                    />
                  </div>

                  {/* Expanded Center Image on Opposite Side (Responsive for both Mobile & Desktop) */}
                  <AnimatePresence>
                    {expandedIndex === i && (
                      <motion.div
                        initial={{ opacity: 0, x: isLeft ? -20 : 20, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: isLeft ? -20 : 20, scale: 0.8 }}
                        transition={{ type: "spring", damping: 15 }}
                        className={`absolute top-1/2 -translate-y-1/2 ${isLeft ? 'right-[-9rem] sm:right-[-20rem] md:right-[-32rem]' : 'left-[-9rem] sm:left-[-20rem] md:left-[-32rem]'} z-30 pointer-events-auto`}
                      >
                        {/* Connecting line to the expanded image */}
                        <div 
                          className={`absolute top-1/2 ${isLeft ? 'left-[-3rem] sm:left-[-8rem] md:left-[-10rem]' : 'right-[-3rem] sm:right-[-8rem] md:right-[-10rem]'} -translate-y-1/2 h-[1px] w-[3rem] sm:w-[8rem] md:w-[10rem] bg-gradient-to-r ${isLeft ? 'from-[#ff0050] to-transparent' : 'from-transparent to-[#ff0050]'} z-0 opacity-50`}
                        />
                        <div 
                          className={`bg-white p-1.5 pb-4 sm:p-2 sm:pb-5 rounded-sm shadow-[0_15px_35px_rgba(0,0,0,0.8)] relative z-10 ${isLeft ? 'rotate-3' : '-rotate-3'} hover:scale-105 transition-transform cursor-pointer`} 
                          onClick={(e) => { e.stopPropagation(); setExpandedIndex(null); }}
                        >
                          <div className="w-16 h-24 sm:w-24 sm:h-32 md:w-32 md:h-44 bg-neutral-900 overflow-hidden relative">
                            <img 
                              src={fallbackCenterImages[i % fallbackCenterImages.length]} 
                              alt="Expanded Timeline Memory"
                              className="w-full h-full object-cover filter contrast-110 saturate-110 pointer-events-none"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>


                  <div className="bg-white p-1.5 pb-4 sm:p-3 sm:pb-8 rounded-sm shadow-[0_15px_35px_rgba(0,0,0,0.8)] hover:scale-105 transition-transform duration-300 relative z-10">
                    <div className="w-24 h-32 sm:w-48 sm:h-64 bg-neutral-900 overflow-hidden relative">
                      <img 
                        src={src} 
                        alt={`Memory ${i + 1}`}
                        className="w-full h-full object-cover filter contrast-110 saturate-110"
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Final Present Day Memory at the very bottom */}
      <div className="relative w-full flex justify-center z-30 pointer-events-none mt-48 mb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 100 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: false, margin: "-10%" }}
          transition={{ type: "spring", damping: 12, stiffness: 60 }}
          className="pointer-events-auto"
        >
          <div className="bg-white p-3 pb-12 rounded-sm shadow-[0_30px_60px_rgba(0,0,0,0.9)] border-4 border-[#3d000e]">
            <div className="w-64 h-80 sm:w-80 sm:h-[400px] bg-neutral-900 overflow-hidden relative">
              <img 
                src={finalPhoto} 
                alt={`Present Day`}
                className="w-full h-full object-cover filter contrast-110 saturate-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#3d000e]/80 via-transparent to-transparent pointer-events-none mix-blend-overlay" />
            </div>
            <p className="text-center mt-6 font-playfair italic text-[#3d000e] text-2xl font-black tracking-widest">
              Unbreakable.
            </p>
          </div>
        </motion.div>
      </div>
      
      </div>
    </div>
  );
};

export default ThreadOfTime;
