"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Github } from "./brand-icons";
import { cn } from "@/lib/utils";

interface SpecialCardProps {
  imageSrc: string;
  name: string;
  role: string;
  socials?: {
    github?: string;
  };
  avatarAdjust?: { scale: number; x: number; y: number };
  onClick?: () => void;
  className?: string;
}

const fluidTransition = {
  type: "spring" as const,
  stiffness: 260,
  damping: 28,
  mass: 1,
};

const contentContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1 },
  },
};

const elegantItemVariants = {
  hidden: { y: 12, opacity: 0, filter: "blur(6px)" },
  visible: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: fluidTransition,
  },
};

export default function ProfileCard({
  imageSrc,
  name,
  role,
  socials,
  avatarAdjust = { scale: 1, x: 0, y: 0 },
  onClick,
  className = "",
}: SpecialCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <motion.div
        className={cn(
          "relative z-0 flex items-center overflow-hidden border border-neutral-800",
          "bg-white/80 text-zinc-900",
          "dark:bg-zinc-950/80 dark:text-zinc-50 backdrop-blur-md cursor-pointer select-none"
        )}
        layout
        initial={{ borderRadius: 40, width: 68, height: 68 }}
        animate={{
          width: isHovered ? "auto" : 68,
          borderRadius: 40,
        }}
        transition={fluidTransition}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        {/* Decorative layers */}
        <div className="absolute inset-0 z-20 rounded-[40px] border border-white/50 shadow-sm dark:border-zinc-700/40 pointer-events-none" />
        <div className="absolute inset-0 z-0 rounded-[40px] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.55)] pointer-events-none" />

        {/* Gradient background */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-500 z-0",
            "bg-gradient-to-br from-zinc-50/90 via-white/90 to-zinc-100/80",
            "dark:from-zinc-900/90 dark:via-zinc-950/80 dark:to-zinc-900/80",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Avatar Wrapper Wrapper (not overflow-hidden) */}
        <div className="relative z-30 m-1.5 shrink-0">
          {/* Avatar Wrapper */}
          <motion.div
            layout="position"
            className="relative h-14 w-14 overflow-hidden rounded-full"
          >
            {/* Living Ambient Glow */}
            <motion.div
              className="absolute inset-0 rounded-full blur-xl bg-purple-500/30"
              animate={{
                scale: isHovered ? 1.6 : 0.8,
                opacity: isHovered ? 1 : 0,
                rotate: isHovered ? [0, 360] : 0,
              }}
              transition={{
                scale: { duration: 0.4, ease: "easeOut" },
                opacity: { duration: 0.4 },
                rotate: { duration: 15, repeat: Infinity, ease: "linear" }
              }}
            />

            {/* Avatar Image */}
            <motion.img
              src={imageSrc}
              alt={name}
              className="relative h-full w-full object-cover border-[2.5px] border-white dark:border-zinc-800 shadow-sm rounded-full"
              style={{
                x: avatarAdjust?.x || 0,
                y: avatarAdjust?.y || 0,
              }}
              animate={{ scale: (isHovered ? 1 : 0.96) * (avatarAdjust?.scale || 1) }}
              transition={fluidTransition}
            />
          </motion.div>

          {/* Status Dot */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: isHovered ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-800 z-40"
          />
        </div>

        {/* Text Content */}
        <div className="relative z-20 overflow-hidden">
          <AnimatePresence mode="wait">
            {isHovered && (
              <motion.div
                variants={contentContainerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col justify-center pl-3 pr-6 min-w-[170px]"
              >
                {/* Header Row: Name & Social */}
                <div className="flex items-center justify-between gap-4 mb-0.5">
                  <motion.h3
                    variants={elegantItemVariants}
                    className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight whitespace-nowrap font-playfair"
                  >
                    {name}
                  </motion.h3>

                  {socials?.github && (
                    <motion.a
                      href={socials.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      variants={elegantItemVariants}
                      onClick={(e) => e.stopPropagation()} // Prevent card click
                      className="flex items-center justify-center h-6 w-6 rounded-full bg-zinc-100/80 dark:bg-zinc-800/80 text-black dark:text-zinc-400 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                    >
                      <Github size={14} />
                    </motion.a>
                  )}
                </div>

                {/* Bottom Row: Role */}
                <motion.div
                  variants={elegantItemVariants}
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-outfit">
                    {role}
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
