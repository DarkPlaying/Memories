"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InteractiveTravelCardProps {
  title: string;
  subtitle?: string;
  date?: string;
  imageUrl?: string;
  actionText?: string;
  href?: string;
  onActionClick: () => void;
  className?: string;
}

export const InteractiveTravelCard = React.forwardRef<
  HTMLDivElement,
  InteractiveTravelCardProps
>(
  (
    { title, subtitle, date, imageUrl, actionText, href = "#", onActionClick, className },
    ref
  ) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 15, stiffness: 150 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    const rotateX = useTransform(springY, [-0.5, 0.5], ["10.5deg", "-10.5deg"]);
    const rotateY = useTransform(springX, [-0.5, 0.5], ["-10.5deg", "10.5deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const { width, height, left, top } = rect;
      const mouseXVal = e.clientX - left;
      const mouseYVal = e.clientY - top;
      const xPct = mouseXVal / width - 0.5;
      const yPct = mouseYVal / height - 0.5;
      mouseX.set(xPct);
      mouseY.set(yPct);
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    return (
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onActionClick}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={cn(
          "relative h-[340px] sm:h-[26rem] w-full max-w-[270px] min-[375px]:max-w-[290px] sm:max-w-none sm:w-80 rounded-2xl bg-neutral-900/50 backdrop-blur-md shadow-2xl border border-neutral-800/80 cursor-pointer group",
          className
        )}
      >
        <div
          style={{
            transform: "translateZ(50px)",
            transformStyle: "preserve-3d",
          }}
          className="absolute inset-4 grid h-[calc(100%-2rem)] w-[calc(100%-2rem)] grid-rows-[1fr_auto] rounded-xl shadow-lg bg-black/40"
        >
          {/* Background Image - Dynamic or stamp.png */}
          <img
            src={imageUrl || "/stamp.png"}
            alt={`${title}`}
            className={cn(
              "absolute rounded-xl transition-all duration-300",
              (imageUrl || "/stamp.png").includes("stamp.png")
                ? "inset-0 m-auto w-36 h-36 sm:w-48 sm:h-48 object-contain opacity-80 group-hover:scale-105 group-hover:opacity-95 z-0"
                : "inset-0 h-full w-full object-cover z-0"
            )}
          />
          
          {/* Darkening overlay for better text contrast */}
          <div className="absolute inset-0 h-full w-full rounded-xl bg-gradient-to-b from-black/40 via-black/10 to-black/80" />

          {/* Card Content */}
          <div className="relative flex flex-col justify-between rounded-xl p-4 text-white">
            
            {/* Header section with text and link */}
            <div className="flex items-start justify-between w-full gap-2">
              <div>
                <motion.div 
                  style={{ transform: "translateZ(50px)" }}
                  className="inline-block bg-purple-600/95 border border-purple-500/40 text-white px-3 py-1 rounded-xl font-outfit font-bold text-xs tracking-wider uppercase shadow-lg shadow-purple-950/20"
                >
                  {title}
                </motion.div>
                {subtitle && (
                  <motion.p 
                    style={{ transform: "translateZ(40px)" }}
                    className="text-sm font-light text-neutral-200 font-outfit mt-1.5"
                  >
                    {subtitle}
                  </motion.p>
                )}
              </div>
              
              {date && (
                <motion.span 
                  style={{ transform: "translateZ(40px)" }}
                  className="inline-block shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold font-outfit bg-neutral-800/80 border border-neutral-700/50 text-neutral-300 shadow-sm"
                >
                  {date}
                </motion.span>
              )}
            </div>

            {/* Footer Button */}
            {actionText && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onActionClick();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ transform: "translateZ(40px)" }}
                className={cn(
                  "w-full rounded-lg py-3 text-center font-semibold text-white transition-colors cursor-pointer",
                  "bg-purple-600/80 backdrop-blur-md ring-1 ring-inset ring-purple-500/30 hover:bg-purple-600"
                )}
              >
                {actionText}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);
InteractiveTravelCard.displayName = "InteractiveTravelCard";
