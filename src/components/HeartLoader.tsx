"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface HeartLoaderProps {
  onComplete: () => void;
}

interface Particle {
  id: number;
  x: number;
  size: number;
  duration: number;
  startOffset: number; // For negative animation-delay to start scattered
}

interface TinyButterfly {
  id: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
  size: number;
  duration: number;
  delay: number;
}

const loaderText = "Preparing a sweet surprise...";

export default function HeartLoader({ onComplete }: HeartLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isExiting, setIsExiting] = useState(false);

  // States for the custom cinematic transition
  const [heartDisappeared, setHeartDisappeared] = useState(false);
  const [showBigButterfly, setShowBigButterfly] = useState(false);
  const [tinyButterflies, setTinyButterflies] = useState<TinyButterfly[]>([]);

  // Generate floating background heart particles
  useEffect(() => {
    const generatedParticles = Array.from({ length: 30 }).map((_, i) => {
      const duration = Math.random() * 5 + 5; // 5s to 10s
      return {
        id: i,
        x: Math.random() * 100, // random percentage width
        size: Math.random() * 14 + 8, // 8px to 22px
        duration,
        startOffset: Math.random() * duration, // negative delay offset in seconds
      };
    });
    setParticles(generatedParticles);
  }, []);

  // Update progress bar with organic sloshing water surges (up and down motion)
  useEffect(() => {
    if (progress >= 100) {
      triggerMagicalTransition();
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        // Organic surge: 70% chance to surge forward, 30% chance to sink slightly
        const isSurge = Math.random() > 0.30 || prev < 15 || prev > 92;
        let delta = 0;
        
        if (isSurge) {
          delta = Math.floor(Math.random() * 4) + 2; // Increase by 2% to 5%
        } else {
          delta = -(Math.floor(Math.random() * 2) + 1); // Drop by 1% or 2%
        }

        const next = prev + delta;
        return next > 100 ? 100 : next < 0 ? 0 : next;
      });
    }, 90); // Slightly slower intervals to let surges feel heavy and physical

    return () => clearInterval(interval);
  }, [progress]);

  // Magical Metamorphosis Transition Sequence
  const triggerMagicalTransition = () => {
    // 1. Immediately disappear the heart & mount the big butterfly in its place
    setHeartDisappeared(true);
    setShowBigButterfly(true);

    // Initial gorgeous burst of heart confetti right in the center
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.5 },
      colors: ["#ff0844", "#ffb199", "#ff0050", "#ffffff"],
    });

    // 2. After the big butterfly settles (0.45 seconds later)
    setTimeout(() => {
      // Secondary explosive heart burst
      confetti({
        particleCount: 220,
        spread: 135,
        origin: { y: 0.5 },
        colors: ["#ff0844", "#ffb199", "#ff0050", "#ffffff"],
      });

      // Generate a flurry of 95 tiny butterflies scattering outward to completely fill the page
      const butterflies = Array.from({ length: 95 }).map((_, i) => {
        const baseAngle = (i / 95) * Math.PI * 2;
        const angle = baseAngle + (Math.random() * 0.16 - 0.08); // slight nudge to distribute organically
        return {
          id: i,
          x: 0,
          y: 0,
          angle,
          distance: Math.random() * 110 + 100, // fly fully past the screen margins
          size: Math.random() * 16 + 8, // 8px to 24px (varying depth sizes)
          duration: Math.random() * 1.3 + 0.9, // 0.9s to 2.2s
          delay: Math.random() * 0.5,
        };
      });
      setTinyButterflies(butterflies);
    }, 450);

    // 3. Start sliding up the loader screen (revealing Hero page already running underneath!)
    setTimeout(() => {
      setIsExiting(true);
    }, 1800);

    // 4. Complete transition and clean unmount loader
    setTimeout(() => {
      onComplete();
    }, 2700);
  };

  const y = 24 - (24 * progress) / 100;

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-black"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            y: "-100vh",
            transition: { duration: 1.0, ease: [0.76, 0, 0.24, 1] }
          }}
        >
          {/* Glowing Radial Background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,80,0.12)_0%,rgba(0,0,0,1)_80%)] pointer-events-none" />

          {/* Floating Heart Particles (Active instantly on start) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
              <div
                key={p.id}
                className="floating-heart absolute text-pink-500/20"
                style={{
                  left: `${p.x}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  animationDuration: `${p.duration}s`,
                  animationDelay: `-${p.startOffset}s`,
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-full h-full"
                >
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              </div>
            ))}
          </div>

          {/* Centered Main Core & Loader Interface */}
          <div className="relative flex flex-col items-center justify-center z-10 px-6 max-w-md w-full text-center">

            {/* Center Anim Container (Heart / Big Butterfly) */}
            <div className="relative mb-8 flex items-center justify-center w-48 h-48">

              {/* Heart Component wrapped in local AnimatePresence for safe exit trigger */}
              <AnimatePresence>
                {!heartDisappeared && (
                  <motion.div
                    exit={{
                      scale: 0,
                      opacity: 0,
                      transition: { duration: 0.45, ease: "backIn" }
                    }}
                    className="relative flex items-center justify-center"
                  >
                    {/* Pulsing Outer Glow */}
                    <motion.div
                      className="absolute inset-0 bg-red-500 rounded-full blur-[45px] pointer-events-none"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.15, 0.35, 0.15],
                      }}
                      style={{
                        opacity: 0.15 + 0.2 * (progress / 100)
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    {/* Heart SVG */}
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1, 1.15, 1],
                      }}
                      transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="relative z-10"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-32 h-32 drop-shadow-[0_0_35px_rgba(255,0,80,0.55)]"
                      >
                        <defs>
                          {/* Front Waving liquid clip path */}
                          <clipPath id="heartClip1">
                            <motion.path
                              animate={{
                                y: [0, -1.2, 0.8, -0.6, 0.4, 0],
                                d: [
                                  `M 0 ${y} Q 6 ${y - 1.4}, 12 ${y} T 24 ${y} L 24 24 L 0 24 Z`,
                                  `M 0 ${y} Q 6 ${y + 1.4}, 12 ${y} T 24 ${y} L 24 24 L 0 24 Z`,
                                  `M 0 ${y} Q 6 ${y - 1.4}, 12 ${y} T 24 ${y} L 24 24 L 0 24 Z`
                                ]
                              }}
                              transition={{
                                y: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                                d: { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                              }}
                            />
                          </clipPath>

                          {/* Back Waving liquid clip path for a layered liquid depth effect */}
                          <clipPath id="heartClip2">
                            <motion.path
                              animate={{
                                y: [0, 0.8, -1.0, 0.6, -0.4, 0],
                                d: [
                                  `M 0 ${y} Q 6 ${y + 1.2}, 12 ${y} T 24 ${y} L 24 24 L 0 24 Z`,
                                  `M 0 ${y} Q 6 ${y - 1.2}, 12 ${y} T 24 ${y} L 24 24 L 0 24 Z`,
                                  `M 0 ${y} Q 6 ${y + 1.2}, 12 ${y} T 24 ${y} L 24 24 L 0 24 Z`
                                ]
                              }}
                              transition={{
                                y: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
                                d: { duration: 2.3, repeat: Infinity, ease: "easeInOut" }
                              }}
                            />
                          </clipPath>
                        </defs>

                        {/* Grey Unfilled 2D Heart (Background) */}
                        <path
                          fill="#1c1c1e"
                          stroke="rgba(255, 255, 255, 0.28)"
                          strokeWidth="0.5"
                          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        />

                        {/* Darker red liquid (Back Wave Layer) */}
                        <path
                          clipPath="url(#heartClip2)"
                          fill="#b20025"
                          stroke="#b20025"
                          strokeWidth="0.1"
                          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        />

                        {/* Vibrant red liquid (Front Wave Layer) */}
                        <path
                          clipPath="url(#heartClip1)"
                          fill="#ff0543"
                          stroke="#ff0543"
                          strokeWidth="0.1"
                          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        />
                      </svg>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 3 Pairs of Large Magnificent Butterflies (6 total, replaces the heart instantly and flutter upwards with beautiful gaps) */}
              {showBigButterfly && (
                <>
                  {/* === LEFT PAIR === */}
                  {/* Left Butterfly A (Outer Left) */}
                  <motion.div
                    className="absolute z-20 pointer-events-none flex items-center justify-center w-full h-full"
                    initial={{
                      scale: 0,
                      opacity: 0,
                      rotate: -35,
                      x: -195,
                      y: 25
                    }}
                    animate={{
                      scale: 0.8,
                      opacity: 1,
                      y: -310,
                      x: [-195, -215, -200, -225, -210], // Beautiful drift to the left
                      rotate: [-35, -45, -28, -40, -32]
                    }}
                    transition={{
                      scale: { type: "spring", stiffness: 120, damping: 11, duration: 0.8 },
                      opacity: { duration: 0.4 },
                      y: { duration: 2.3, ease: "easeOut", delay: 0.32 },
                      x: { duration: 2.3, ease: "easeInOut", delay: 0.32 },
                      rotate: { duration: 2.3, ease: "easeInOut", delay: 0.32 }
                    }}
                  >
                    <svg viewBox="0 0 100 100" className="w-20 h-20 filter drop-shadow-[0_0_25px_rgba(255,8,68,0.9)]">
                      <defs>
                        <linearGradient id="wingGLeft1" x1="100%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ffccd5" />
                          <stop offset="100%" stopColor="#ff0543" />
                        </linearGradient>
                        <linearGradient id="wingGRight1" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ffccd5" />
                          <stop offset="100%" stopColor="#ff0543" />
                        </linearGradient>
                      </defs>
                      <motion.path d="M50,50 Q25,15 12,32 Q0,50 18,68 Q35,85 50,55 Z" fill="url(#wingGLeft1)" animate={{ scaleX: [1, 0.16, 1] }} transition={{ repeat: Infinity, duration: 0.22 }} style={{ transformOrigin: "50px 50px" }} />
                      <motion.path d="M50,50 Q75,15 88,32 Q100,50 82,68 Q65,85 50,55 Z" fill="url(#wingGRight1)" animate={{ scaleX: [1, 0.16, 1] }} transition={{ repeat: Infinity, duration: 0.22 }} style={{ transformOrigin: "50px 50px" }} />
                      <path d="M47,38 Q43,26 36,24 M53,38 Q57,26 64,24" stroke="#fff" strokeWidth="1.5" fill="none" />
                      <ellipse cx="50" cy="50" rx="3" ry="12" fill="#fff" />
                    </svg>
                  </motion.div>

                  {/* Left Butterfly B (Inner Left) */}
                  <motion.div
                    className="absolute z-20 pointer-events-none flex items-center justify-center w-full h-full"
                    initial={{
                      scale: 0,
                      opacity: 0,
                      rotate: -25,
                      x: -120,
                      y: 10
                    }}
                    animate={{
                      scale: 0.72,
                      opacity: 1,
                      y: -330,
                      x: [-120, -135, -125, -145, -130],
                      rotate: [-25, -35, -18, -30, -22]
                    }}
                    transition={{
                      scale: { type: "spring", stiffness: 125, damping: 12, duration: 0.8 },
                      opacity: { duration: 0.4 },
                      y: { duration: 2.2, ease: "easeOut", delay: 0.36 },
                      x: { duration: 2.2, ease: "easeInOut", delay: 0.36 },
                      rotate: { duration: 2.2, ease: "easeInOut", delay: 0.36 }
                    }}
                  >
                    <svg viewBox="0 0 100 100" className="w-18 h-18 filter drop-shadow-[0_0_22px_rgba(255,8,68,0.85)]">
                      <motion.path d="M50,50 Q25,15 12,32 Q0,50 18,68 Q35,85 50,55 Z" fill="url(#wingGLeft1)" animate={{ scaleX: [1, 0.18, 1] }} transition={{ repeat: Infinity, duration: 0.24 }} style={{ transformOrigin: "50px 50px" }} />
                      <motion.path d="M50,50 Q75,15 88,32 Q100,50 82,68 Q65,85 50,55 Z" fill="url(#wingGRight1)" animate={{ scaleX: [1, 0.18, 1] }} transition={{ repeat: Infinity, duration: 0.24 }} style={{ transformOrigin: "50px 50px" }} />
                      <ellipse cx="50" cy="50" rx="2.5" ry="10" fill="#fff" />
                    </svg>
                  </motion.div>


                  {/* === CENTER PAIR === */}
                  {/* Center Butterfly A (Inner Left Center) */}
                  <motion.div
                    className="absolute z-20 pointer-events-none flex items-center justify-center w-full h-full"
                    initial={{
                      scale: 0,
                      opacity: 0,
                      rotate: -10,
                      x: -45,
                      y: -15
                    }}
                    animate={{
                      scale: 0.96,
                      opacity: 1,
                      y: -360,
                      x: [-45, -35, -50, -38, -42],
                      rotate: [-10, 5, -15, 8, -5]
                    }}
                    transition={{
                      scale: { type: "spring", stiffness: 130, damping: 10, duration: 0.8 },
                      opacity: { duration: 0.4 },
                      y: { duration: 2.3, ease: "easeOut", delay: 0.38 },
                      x: { duration: 2.3, ease: "easeInOut", delay: 0.38 },
                      rotate: { duration: 2.3, ease: "easeInOut", delay: 0.38 }
                    }}
                  >
                    <svg viewBox="0 0 100 100" className="w-24 h-24 filter drop-shadow-[0_0_35px_rgba(255,8,68,0.95)]">
                      <defs>
                        <linearGradient id="wingGLeft2" x1="100%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="100%" stopColor="#ff3366" />
                        </linearGradient>
                        <linearGradient id="wingGRight2" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="100%" stopColor="#ff3366" />
                        </linearGradient>
                      </defs>
                      <motion.path d="M50,50 Q25,15 12,32 Q0,50 18,68 Q35,85 50,55 Z" fill="url(#wingGLeft2)" animate={{ scaleX: [1, 0.14, 1] }} transition={{ repeat: Infinity, duration: 0.2 }} style={{ transformOrigin: "50px 50px" }} />
                      <motion.path d="M50,50 Q75,15 88,32 Q100,50 82,68 Q65,85 50,55 Z" fill="url(#wingGRight2)" animate={{ scaleX: [1, 0.14, 1] }} transition={{ repeat: Infinity, duration: 0.2 }} style={{ transformOrigin: "50px 50px" }} />
                      <path d="M47,38 Q43,26 36,24 M53,38 Q57,26 64,24" stroke="#fff" strokeWidth="1.5" fill="none" />
                      <ellipse cx="50" cy="50" rx="3.5" ry="14" fill="#fff" className="drop-shadow-[0_0_8px_#fff]" />
                    </svg>
                  </motion.div>

                  {/* Center Butterfly B (Inner Right Center) */}
                  <motion.div
                    className="absolute z-20 pointer-events-none flex items-center justify-center w-full h-full"
                    initial={{
                      scale: 0,
                      opacity: 0,
                      rotate: 10,
                      x: 45,
                      y: -10
                    }}
                    animate={{
                      scale: 0.88,
                      opacity: 1,
                      y: -350,
                      x: [45, 55, 40, 50, 48],
                      rotate: [10, -5, 15, -8, 5]
                    }}
                    transition={{
                      scale: { type: "spring", stiffness: 130, damping: 10, duration: 0.8 },
                      opacity: { duration: 0.4 },
                      y: { duration: 2.3, ease: "easeOut", delay: 0.4 },
                      x: { duration: 2.3, ease: "easeInOut", delay: 0.4 },
                      rotate: { duration: 2.3, ease: "easeInOut", delay: 0.4 }
                    }}
                  >
                    <svg viewBox="0 0 100 100" className="w-22 h-22 filter drop-shadow-[0_0_32px_rgba(255,8,68,0.92)]">
                      <motion.path d="M50,50 Q25,15 12,32 Q0,50 18,68 Q35,85 50,55 Z" fill="url(#wingGLeft2)" animate={{ scaleX: [1, 0.15, 1] }} transition={{ repeat: Infinity, duration: 0.21 }} style={{ transformOrigin: "50px 50px" }} />
                      <motion.path d="M50,50 Q75,15 88,32 Q100,50 82,68 Q65,85 50,55 Z" fill="url(#wingGRight2)" animate={{ scaleX: [1, 0.15, 1] }} transition={{ repeat: Infinity, duration: 0.21 }} style={{ transformOrigin: "50px 50px" }} />
                      <path d="M47,38 Q43,26 36,24 M53,38 Q57,26 64,24" stroke="#fff" strokeWidth="1.5" fill="none" />
                      <ellipse cx="50" cy="50" rx="3.2" ry="13" fill="#fff" className="drop-shadow-[0_0_6px_#fff]" />
                    </svg>
                  </motion.div>


                  {/* === RIGHT PAIR === */}
                  {/* Right Butterfly A (Inner Right) */}
                  <motion.div
                    className="absolute z-20 pointer-events-none flex items-center justify-center w-full h-full"
                    initial={{
                      scale: 0,
                      opacity: 0,
                      rotate: 25,
                      x: 120,
                      y: 10
                    }}
                    animate={{
                      scale: 0.72,
                      opacity: 1,
                      y: -320,
                      x: [120, 135, 125, 145, 130],
                      rotate: [25, 35, 18, 30, 22]
                    }}
                    transition={{
                      scale: { type: "spring", stiffness: 125, damping: 12, duration: 0.8 },
                      opacity: { duration: 0.4 },
                      y: { duration: 2.2, ease: "easeOut", delay: 0.34 },
                      x: { duration: 2.2, ease: "easeInOut", delay: 0.34 },
                      rotate: { duration: 2.2, ease: "easeInOut", delay: 0.34 }
                    }}
                  >
                    <svg viewBox="0 0 100 100" className="w-18 h-18 filter drop-shadow-[0_0_22px_rgba(255,5,80,0.85)]">
                      <defs>
                        <linearGradient id="wingGLeft3" x1="100%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ffe5ec" />
                          <stop offset="100%" stopColor="#ff66b2" />
                        </linearGradient>
                        <linearGradient id="wingGRight3" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ffe5ec" />
                          <stop offset="100%" stopColor="#ff66b2" />
                        </linearGradient>
                      </defs>
                      <motion.path d="M50,50 Q25,15 12,32 Q0,50 18,68 Q35,85 50,55 Z" fill="url(#wingGLeft3)" animate={{ scaleX: [1, 0.18, 1] }} transition={{ repeat: Infinity, duration: 0.24 }} style={{ transformOrigin: "50px 50px" }} />
                      <motion.path d="M50,50 Q75,15 88,32 Q100,50 82,68 Q65,85 50,55 Z" fill="url(#wingGRight3)" animate={{ scaleX: [1, 0.18, 1] }} transition={{ repeat: Infinity, duration: 0.24 }} style={{ transformOrigin: "50px 50px" }} />
                      <ellipse cx="50" cy="50" rx="2.5" ry="10" fill="#fff" />
                    </svg>
                  </motion.div>

                  {/* Right Butterfly B (Outer Right) */}
                  <motion.div
                    className="absolute z-20 pointer-events-none flex items-center justify-center w-full h-full"
                    initial={{
                      scale: 0,
                      opacity: 0,
                      rotate: 35,
                      x: 195,
                      y: 25
                    }}
                    animate={{
                      scale: 0.8,
                      opacity: 1,
                      y: -290,
                      x: [195, 215, 200, 225, 210],
                      rotate: [35, 45, 28, 40, 32]
                    }}
                    transition={{
                      scale: { type: "spring", stiffness: 120, damping: 11, duration: 0.8 },
                      opacity: { duration: 0.4 },
                      y: { duration: 2.2, ease: "easeOut", delay: 0.3 },
                      x: { duration: 2.2, ease: "easeInOut", delay: 0.3 },
                      rotate: { duration: 2.2, ease: "easeInOut", delay: 0.3 }
                    }}
                  >
                    <svg viewBox="0 0 100 100" className="w-20 h-20 filter drop-shadow-[0_0_25px_rgba(255,5,80,0.9)]">
                      <motion.path d="M50,50 Q25,15 12,32 Q0,50 18,68 Q35,85 50,55 Z" fill="url(#wingGLeft3)" animate={{ scaleX: [1, 0.16, 1] }} transition={{ repeat: Infinity, duration: 0.22 }} style={{ transformOrigin: "50px 50px" }} />
                      <motion.path d="M50,50 Q75,15 88,32 Q100,50 82,68 Q65,85 50,55 Z" fill="url(#wingGRight3)" animate={{ scaleX: [1, 0.16, 1] }} transition={{ repeat: Infinity, duration: 0.22 }} style={{ transformOrigin: "50px 50px" }} />
                      <path d="M47,38 Q43,26 36,24 M53,38 Q57,26 64,24" stroke="#fff" strokeWidth="1.5" fill="none" />
                      <ellipse cx="50" cy="50" rx="3" ry="12" fill="#fff" />
                    </svg>
                  </motion.div>
                </>
              )}
            </div>

            {/* Loading Percentage */}
            <AnimatePresence>
              {progress < 100 && (
                <motion.div
                  className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-widest mb-4 select-none"
                  style={{ fontFamily: "var(--font-outfit)" }}
                  exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.3 } }}
                >
                  {progress}%
                </motion.div>
              )}
            </AnimatePresence>

            {/* Staggered Animated loaderText */}
            <div className="h-6 flex items-center justify-center select-none overflow-visible">
              {progress < 100 && (
                <motion.p
                  className="text-[9px] sm:text-xs font-semibold text-pink-200/60 uppercase tracking-[0.15em] sm:tracking-[0.25em] text-center flex flex-wrap justify-center gap-x-[0.2em]"
                  style={{ fontFamily: "var(--font-outfit)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(4px)", transition: { duration: 0.3 } }}
                >
                  {loaderText.split("").map((char, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, y: 12, filter: "blur(3px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{
                        duration: 0.45,
                        delay: index * 0.04,
                        repeat: Infinity,
                        repeatDelay: 5.5,
                        ease: "easeOut"
                      }}
                      className="inline-block"
                    >
                      {char === " " ? "\u00A0" : char}
                    </motion.span>
                  ))}
                </motion.p>
              )}
            </div>
          </div>

          {/* FLURRY OF TINY BUTTERFLIES SCATTERING OUTWARD TO DENSELY FILL THE PAGE */}
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            {tinyButterflies.map((b) => {
              const targetX = Math.cos(b.angle) * b.distance;
              const targetY = Math.sin(b.angle) * b.distance;

              return (
                <motion.div
                  key={b.id}
                  className="absolute top-1/2 left-1/2"
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{
                    x: `${targetX}vw`,
                    y: `${targetY}vh`,
                    scale: [0, 2.2, 5.0, 7.5],
                    opacity: [1, 1, 0.9, 0],
                  }}
                  transition={{
                    duration: b.duration,
                    delay: b.delay,
                    ease: [0.1, 0.8, 0.3, 1],
                  }}
                >
                  <svg
                    viewBox="0 0 100 100"
                    style={{ width: b.size, height: b.size }}
                    className="filter drop-shadow-[0_0_8px_rgba(255,5,67,0.85)]"
                  >
                    <motion.path
                      d="M50,50 Q25,20 15,35 Q5,50 20,65 Q35,80 50,55 Z"
                      fill="#ff0543"
                      animate={{ scaleX: [1, 0.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.15 }}
                      style={{ transformOrigin: "50px 50px" }}
                    />
                    <motion.path
                      d="M50,50 Q75,20 85,35 Q95,50 80,65 Q65,80 50,55 Z"
                      fill="#ffccd5"
                      animate={{ scaleX: [1, 0.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.15 }}
                      style={{ transformOrigin: "50px 50px" }}
                    />
                    <ellipse cx="50" cy="50" rx="3" ry="12" fill="#fff" />
                  </svg>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
