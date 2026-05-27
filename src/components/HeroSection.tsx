"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, Volume2, VolumeX, SkipBack, SkipForward, Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import confetti from "canvas-confetti";
import CircularGallery from "@/components/ui/circular-flip-card-gallery";
import { ArcGalleryHero } from "@/components/ui/arc-gallery-hero-component";

interface Chapter {
  id: number;
  folder: string;
  startFrame: number;
  endFrame: number;
  localStart: number;
  title: string;
  text: string;
}

const CHAPTERS: Chapter[] = [
  // --- Folder f1 (300 frames, global 1-300) ---
  {
    id: 1,
    folder: "f1",
    startFrame: 1,
    endFrame: 115,
    localStart: 1,
    title: "Chapter 1: Ordinary Classmates 🏫🤍",
    text: "We were just ordinary classmates. 🏫🤍 The first time we spoke was because of a book… just a small conversation. 🙂📚"
  },
  {
    id: 2,
    folder: "f1",
    startFrame: 116,
    endFrame: 145,
    localStart: 116,
    title: "Chapter 2: First Real Talk 🦋✨🤍",
    text: "One day, she was sitting alone editing a report. That first real conversation changed everything. A butterfly effect. 🦋✨🤍"
  },
  {
    id: 3,
    folder: "f1",
    startFrame: 146,
    endFrame: 283,
    localStart: 146,
    title: "Chapter 3: The First Call 📞🌙🩶",
    text: "During the Mudhalvan exam, I asked for help. That night, we had our first call. Short, simple, and unforgettable. 📞🌙🩶"
  },
  {
    id: 4,
    folder: "f1",
    startFrame: 284,
    endFrame: 300,
    localStart: 284,
    title: "Chapter 4: Becoming More 🫂💫🤍",
    text: "Slowly, calls got longer. Sharing dreams, silly talks, and little fights… best friends became something more. 🫂💫🤍"
  },

  // --- Folder f2 (290 frames, global 301-590) ---
  {
    id: 5,
    folder: "f2",
    startFrame: 301,
    endFrame: 354,
    localStart: 1,
    title: "Chapter 5: Sharing Dreams 🫂💫🤍",
    text: "She helped me with everything she could. Sharing all our struggles and laughter day by day. 🫂💫🤍"
  },
  {
    id: 6,
    folder: "f2",
    startFrame: 355,
    endFrame: 399,
    localStart: 55,
    title: "Chapter 6: February 2nd 🥹🩶✨",
    text: "February 2nd. There was a college interview. I wasn't going, but she wanted me there. She convinced me. 🥹🩶✨"
  },
  {
    id: 7,
    folder: "f2",
    startFrame: 400,
    endFrame: 424,
    localStart: 100,
    title: "Chapter 7: Silent Spark 😶🌫️❤️🔥🖤",
    text: "Another guy looked at her in a way I didn't like. First time I felt possessive… first time I knew I loved her. 😶🌫️❤️🔥🖤"
  },
  {
    id: 8,
    folder: "f2",
    startFrame: 425,
    endFrame: 481,
    localStart: 125,
    title: "Chapter 8: Walking Home 🚶‍♂️🌙🩶",
    text: "Walking home, my thoughts were spinning. She sensed it and kept checking if I was okay. 🚶‍♂️🌙🩶"
  },
  {
    id: 9,
    folder: "f2",
    startFrame: 482,
    endFrame: 559,
    localStart: 182,
    title: "Chapter 9: The Confession 🥺📞✨🤍",
    text: "We talked for hours that night. At 4 AM, she confessed she had a crush on me. A feeling beyond words. 🥺📞✨"
  },
  {
    id: 10,
    folder: "f2",
    startFrame: 560,
    endFrame: 590,
    localStart: 260,
    title: "Chapter 10: Classroom Scares 😂🫀🩶",
    text: "She started coming early to college. I was literally scared to enter the classroom because of my racing heart. 😂🫀"
  },

  // --- Folder f3 (290 frames, global 591-880) ---
  {
    id: 11,
    folder: "f3",
    startFrame: 591,
    endFrame: 621,
    localStart: 1,
    title: "Chapter 11: Scared of Love 😂🫀🩶",
    text: "Just seeing her made my heart race. I couldn't even look her in the eyes. 😂🫀🩶"
  },
  {
    id: 12,
    folder: "f3",
    startFrame: 622,
    endFrame: 695,
    localStart: 32,
    title: "Chapter 12: Sweet Changes 📞😊🌸✨",
    text: "Days went on, but everything had changed. More calls, more endless smiles, and beautiful memories. 📞😊🌸✨"
  },
  {
    id: 13,
    folder: "f3",
    startFrame: 696,
    endFrame: 779,
    localStart: 106,
    title: "Chapter 13: Sitting Together 🍱🩶🥹",
    text: "Feb 12: We sat on the same bench and ate lunch together for the first time. Simple, sweet, and ours. 🍱🩶🥹"
  },
  {
    id: 14,
    folder: "f3",
    startFrame: 780,
    endFrame: 859,
    localStart: 190,
    title: "Chapter 14: The Gift Proposal 🎁⏳✨",
    text: "I gave her a gift: \"Open it only at midnight on Feb 14.\" And exactly at 12:00 AM... 🎁⏳✨"
  },
  {
    id: 15,
    folder: "f3",
    startFrame: 860,
    endFrame: 880,
    localStart: 270,
    title: "Chapter 15: Midnight Wait 💻🥺🫀",
    text: "She opened it on a video call. I waited, heart pounding, holding my breath for her reaction. 💻🥺🫀"
  },

  // --- Folder f4 (300 frames, global 881-1180) ---
  {
    id: 16,
    folder: "f4",
    startFrame: 881,
    endFrame: 923,
    localStart: 1,
    title: "Chapter 16: Heartbeats 💻🥺🫀",
    text: "Waiting for her reaction felt like an eternity. My heart was beating so fast. 💻🥺🫀"
  },
  {
    id: 17,
    folder: "f4",
    startFrame: 891,
    endFrame: 935,
    localStart: 11,
    title: "Chapter 17: Pure Happiness 😭🩶✨🎁",
    text: "She opened it, her face lighting up with pure, raw happiness. The most beautiful sight. 😭🩶✨🎁"
  },
  {
    id: 18,
    folder: "f4",
    startFrame: 936,
    endFrame: 993,
    localStart: 56,
    title: "Chapter 18: Jimiki Girl 🥹💍🤍✨",
    text: "She wore the jimiki earrings I gifted her. I was walking on air, planning the perfect proposal. 🥹💍🤍✨"
  },
  {
    id: 19,
    folder: "f4",
    startFrame: 994,
    endFrame: 1049,
    localStart: 114,
    title: "Chapter 19: Eagerness 🫶🔥💫",
    text: "We talked happily, both knowing what was coming next. The excitement was absolutely overflowing. 🫶🔥💫"
  },
  {
    id: 20,
    folder: "f4",
    startFrame: 1050,
    endFrame: 1129,
    localStart: 170,
    title: "Chapter 20: Watching from Above 👀🏫🩶",
    text: "I stood on the top floor, watching her walk in. My heart knew this was the day. 👀🏫🩶"
  },
  {
    id: 21,
    folder: "f4",
    startFrame: 1130,
    endFrame: 1180,
    localStart: 250,
    title: "Chapter 21: Perfect Plan 😂📚✨",
    text: "I planned everything. I even lied to my teacher that I had urgent club work to do! 😂📚✨"
  },

  // --- Folder f5 (295 frames, global 1181-1475) ---
  {
    id: 22,
    folder: "f5",
    startFrame: 1181,
    endFrame: 1211,
    localStart: 1,
    title: "Chapter 22: Entering Class 😂📚✨",
    text: "Watching her enter the classroom, realizing everything was set for the big moment. 😂📚✨"
  },
  {
    id: 23,
    folder: "f5",
    startFrame: 1212,
    endFrame: 1259,
    localStart: 32,
    title: "Chapter 23: Club Work 🤭🩶✨",
    text: "I called her to help me convince the teacher. She played along perfectly. 🤭🩶✨"
  },
  {
    id: 24,
    folder: "f5",
    startFrame: 1260,
    endFrame: 1284,
    localStart: 80,
    title: "Chapter 24: Fast Heartbeats ❤️🔥🚶‍♀️🚶‍♂️🥹",
    text: "Walking together, I could practically hear how fast her heart was beating. ❤️🔥🚶‍♀️🚶‍♂️"
  },
  {
    id: 25,
    folder: "f5",
    startFrame: 1285,
    endFrame: 1327,
    localStart: 105,
    title: "Chapter 25: Special Memories 😭🤍✨",
    text: "We acted perfectly normal in front of the staff. Even that little secret was beautiful. 😭🤍✨"
  },
  {
    id: 26,
    folder: "f5",
    startFrame: 1328,
    endFrame: 1349,
    localStart: 148,
    title: "Chapter 26: Empty MBA Class 🏫🫂🩶",
    text: "I brought her to the empty, quiet MBA classroom. We stepped inside together. 🏫🫂🩶"
  },
  {
    id: 27,
    folder: "f5",
    startFrame: 1350,
    endFrame: 1376,
    localStart: 170,
    title: "Chapter 27: Prepared 💌🍫✨💍",
    text: "I had prepared everything. Chocolates, a ring, and a heart full of love. 💌🍫✨💍"
  },
  {
    id: 28,
    folder: "f5",
    startFrame: 1377,
    endFrame: 1435,
    localStart: 197,
    title: "Chapter 28: Proposing Forever 🍫🥹🌙💍",
    text: "Sitting there, she wore my jimiki. I held out chocolates: \"If you take this, it means yes.\" Tears filled her eyes, and she said yes! The empty classroom became our forever. 🍫🥹💍✨"
  },
  {
    id: 29,
    folder: "f5",
    startFrame: 1436,
    endFrame: 1449,
    localStart: 256,
    title: "Chapter 29: Lifetime of Memories 🥹🩶🎡🌙",
    text: "First date, first kiss, saree surprises, and carnival rides. Just three months, but a lifetime of memories. 🥹🎡📸✨"
  },
  {
    id: 30,
    folder: "f5",
    startFrame: 1455,
    endFrame: 1475,
    localStart: 275,
    title: "Chapter 30: Our Wedding Story 🩶😭💍✨",
    text: "And one day, a few years from now… this beautiful story will become our wedding story. 🩶😭💍✨👰🤵"
  }
];

const TOTAL_FRAMES = 1475;

const FOLDER_COUNTS: Record<string, number> = {
  f1: 300,
  f2: 290,
  f3: 290,
  f4: 300,
  f5: 295
};

interface HeroSectionProps {
  isParentLoading?: boolean;
}

export default function HeroSection({ isParentLoading = false }: HeroSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollAccumulatorRef = useRef(0);

  const [cache, setCache] = useState<Record<string, HTMLImageElement[]>>({});
  const [virtualFrame, setVirtualFrame] = useState(1);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [activeFrameIndex, setActiveFrameIndex] = useState(1);
  const [loadedPercent, setLoadedPercent] = useState(0);
  const [isPreloading, setIsPreloading] = useState(true);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  // Dynamic screen unlock and memories grid
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [memories, setMemories] = useState<string[]>([]);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [isMutedByUser, setIsMutedByUser] = useState(false);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);

  // Autoplay states
  const [isAutoplay, setIsAutoplay] = useState(true);
  const dragStartRef = useRef({ x: 0, y: 0, time: 0 });

  // Auto-start music once preloading completes and page loader is lifted
  useEffect(() => {
    if (!isPreloading && !isParentLoading && audioRef.current && isAutoplay && !isMutedByUser) {
      audioRef.current.play()
        .then(() => setIsPlayingMusic(true))
        .catch((err) => console.log("Audio autoplay waiting for user interaction:", err));
    }
  }, [isPreloading, isParentLoading, isAutoplay, isMutedByUser]);

  // Watch for story complete (virtualFrame reaches TOTAL_FRAMES = 1475)
  useEffect(() => {
    if (virtualFrame >= TOTAL_FRAMES && !isUnlocked) {
      setIsUnlocked(true);
      setIsAutoplay(false); // Stop autoplay when finished
    }
  }, [virtualFrame, isUnlocked]);

  // Fetch memory photos from recursive API
  useEffect(() => {
    async function loadGallery() {
      try {
        const res = await fetch("/api/memories");
        const data = await res.json();
        if (Array.isArray(data)) {
          setMemories(data);
        }
      } catch (err) {
        console.error("Failed to load memory photos:", err);
      }
    }
    loadGallery();
  }, []);

  // Check for Back to Story unlocked deep linking
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("unlocked") === "true") {
        setIsUnlocked(true);
        setVirtualFrame(1475);

        // Clean URL immediately to prevent staying unlocked on a manual page reload/refresh
        window.history.replaceState({}, document.title, window.location.pathname);

        // Smooth scroll to circular gallery section
        setTimeout(() => {
          const element = document.getElementById("circular-gallery-section");
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          } else {
            galleryRef.current?.scrollIntoView({ behavior: "smooth" });
          }
        }, 800);
      } else {
        // Reset scroll position to the top of the page on load/reload when starting the story from the beginning
        window.scrollTo(0, 0);
      }
    }
  }, []);

  // Map virtual continuous frame index [1, 1475] to chapter folder and local index
  useEffect(() => {
    let vf = virtualFrame;

    // Find active chapter based on global frame range
    const activeChIdx = CHAPTERS.findIndex(c => vf >= c.startFrame && vf <= c.endFrame);
    const chapterIdx = activeChIdx !== -1 ? activeChIdx : 0;
    const chapter = CHAPTERS[chapterIdx];

    // Calculate local frame index in the folder
    const offset = vf - chapter.startFrame;
    const frameIdx = chapter.localStart + offset;

    setActiveChapterIndex(chapterIdx);
    setActiveFrameIndex(frameIdx);

    // Trigger birthday celebrations at the very end of virtual scrubbing!
    if (vf >= 1470 && !hasCelebrated) {
      setHasCelebrated(true);
      triggerBigCelebration();
    } else if (vf < 1460) {
      setHasCelebrated(false);
    }
  }, [virtualFrame, hasCelebrated]);

  // Lock body and html scroll while presentation is not fully unlocked
  useEffect(() => {
    if (!isUnlocked) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    };
  }, [isUnlocked]);

  // Autoplay loop effect
  useEffect(() => {
    if (isPreloading || isUnlocked || isParentLoading) return;

    let intervalId: NodeJS.Timeout | null = null;

    if (isAutoplay) {
      intervalId = setInterval(() => {
        setVirtualFrame(prev => {
          if (prev >= TOTAL_FRAMES) {
            if (intervalId) clearInterval(intervalId);
            return TOTAL_FRAMES;
          }
          return prev + 1;
        });
      }, 110); // Slower autoplay (~9 frames per second)
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPreloading, isUnlocked, isAutoplay]);

  // GESTURE HANDLERS FOR FIXED-VIEW SCRUBBING & TRANSITIONS
  useEffect(() => {
    if (isPreloading || isParentLoading) return;

    let touchStartY = 0;

    const handleWheel = (e: WheelEvent) => {
      // If unlocked and scrolled down, let standard browser scroll happen normally
      if (isUnlocked) {
        if (window.scrollY > 0) {
          return;
        }
        // If at the absolute top of the page and user scrolls UP, relock the viewport and scrub backward
        if (e.deltaY < 0) {
          setIsUnlocked(false);
          setIsAutoplay(false);
          setVirtualFrame(prev => Math.max(1, Math.min(prev - 4, TOTAL_FRAMES)));
          e.preventDefault();
        }
        return;
      }

      // If locked, intercept wheel scroll to advance or reverse the movie frame scrubbing (slower scroll per frame)
      e.preventDefault();
      setIsAutoplay(false); // Pause autoplay immediately on manual wheel scrub!

      // Accumulate the wheel scroll delta
      scrollAccumulatorRef.current += e.deltaY;

      // Lower threshold = faster/more frames advanced per scroll
      const threshold = 100;

      if (Math.abs(scrollAccumulatorRef.current) >= threshold) {
        const deltaFrames = Math.sign(scrollAccumulatorRef.current) * Math.floor(Math.abs(scrollAccumulatorRef.current) / threshold);
        // Keep the remainder
        scrollAccumulatorRef.current = scrollAccumulatorRef.current % threshold;

        setVirtualFrame(prev => {
          const next = prev + deltaFrames;
          if (next >= TOTAL_FRAMES) {
            setIsUnlocked(true);
            return TOTAL_FRAMES;
          }
          return Math.max(1, next);
        });
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      // If unlocked and scrolled down, let standard browser swipe scroll happen normally
      if (isUnlocked) {
        if (window.scrollY > 0) {
          return;
        }
        const touchY = e.touches[0].clientY;
        const diffY = touchStartY - touchY;
        // If at the absolute top of the page and user swipes DOWN (scrolling up), relock the viewport and scrub backward
        if (diffY < -8) {
          setIsUnlocked(false);
          setIsAutoplay(false);
          setVirtualFrame(prev => Math.max(1, Math.min(prev - 6, TOTAL_FRAMES)));
          touchStartY = touchY;
          e.preventDefault();
        }
        return;
      }

      // If locked, intercept touch movements to scrub frames
      e.preventDefault();
      setIsAutoplay(false); // Pause autoplay immediately on manual touch swipe scrub!
      const touchY = e.touches[0].clientY;
      const diffY = touchStartY - touchY; // Swipe up moves forward (diffY > 0)

      if (Math.abs(diffY) > 8) {
        const frameDelta = Math.round(diffY * 0.04); // Balanced touch swipe scrubbing
        setVirtualFrame(prev => {
          const next = prev + frameDelta;
          if (next >= TOTAL_FRAMES) {
            setIsUnlocked(true);
            return TOTAL_FRAMES;
          }
          return Math.max(1, next);
        });
        touchStartY = touchY;
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isUnlocked, isPreloading, isParentLoading]);

  // CONCURRENT SEAMLESS BACKGROUND PRELOADER (Loads Chapter 1 priority first, then loads f1-f5 concurrently)
  useEffect(() => {
    let active = true;

    const preloadSequence = async () => {
      // Initialize cache maps for the 5 frame folders
      const initializedCache: Record<string, HTMLImageElement[]> = {
        f1: new Array(300),
        f2: new Array(290),
        f3: new Array(290),
        f4: new Array(300),
        f5: new Array(295)
      };

      // 1. Stage 1: Load first 10 frames of f1 immediately
      const priorityCount = 10;
      const priorityPromises = [];

      for (let i = 1; i <= priorityCount; i++) {
        const formattedIndex = i.toString().padStart(3, '0');
        const url = `/Hero/f1/ezgif-frame-${formattedIndex}.jpg`;

        const p = new Promise<void>((resolve) => {
          const img = new Image();
          img.src = url;
          img.onload = () => {
            if (active) {
              initializedCache["f1"][i - 1] = img;
            }
            resolve();
          };
          img.onerror = () => resolve();
        });
        priorityPromises.push(p);
      }

      await Promise.all(priorityPromises);

      if (!active) return;

      // Instantly set cache and lift loading overlay!
      setCache({ ...initializedCache });
      setIsPreloading(false);

      // Create a flat list of all remaining background frames and memories to load beforehand
      const pendingFrames: { folder?: string; index?: number; url: string }[] = [];

      // Push f1-f5 frames
      const folderCounts = [
        { name: "f1", count: 300 },
        { name: "f2", count: 290 },
        { name: "f3", count: 290 },
        { name: "f4", count: 300 },
        { name: "f5", count: 295 }
      ];

      folderCounts.forEach((folder, chIdx) => {
        const startFrame = chIdx === 0 ? 11 : 1;
        const endFrame = folder.count;
        for (let i = startFrame; i <= endFrame; i++) {
          const formattedIndex = i.toString().padStart(3, '0');
          const url = `/Hero/${folder.name}/ezgif-frame-${formattedIndex}.jpg`;
          pendingFrames.push({
            folder: folder.name,
            index: i,
            url
          });
        }
      });

      // Push first 24 memory images from `/WOS` to preload them beforehand!
      try {
        const res = await fetch("/api/memories");
        const memoriesData = await res.json();
        if (Array.isArray(memoriesData)) {
          memoriesData.slice(0, 24).forEach(img => {
            pendingFrames.push({
              url: `/memories/${img}`
            });
          });
        }
      } catch (err) {
        console.error("Failed to fetch memories in preloader:", err);
      }

      const totalBackgroundFrames = pendingFrames.length;
      let loadedBackgroundCount = 0;

      // High-performance concurrent preloader queue (loads one-by-one continuously up to concurrency limit)
      const concurrency = 25;
      let currentIndex = 0;

      const loadNext = () => {
        if (!active || currentIndex >= pendingFrames.length) return;

        const frameInfo = pendingFrames[currentIndex++];
        const img = new Image();
        img.src = frameInfo.url;

        img.onload = () => {
          if (active) {
            if (frameInfo.folder && frameInfo.index !== undefined) {
              initializedCache[frameInfo.folder][frameInfo.index - 1] = img;
              setCache({ ...initializedCache });
            }
            loadedBackgroundCount++;
            setLoadedPercent(Math.round((loadedBackgroundCount / totalBackgroundFrames) * 100));
          }
          loadNext();
        };

        img.onerror = () => {
          if (active) {
            loadedBackgroundCount++;
            setLoadedPercent(Math.round((loadedBackgroundCount / totalBackgroundFrames) * 100));
          }
          loadNext();
        };
      };

      // Start initial concurrent preloading pipelines
      for (let i = 0; i < Math.min(concurrency, pendingFrames.length); i++) {
        loadNext();
      }
    };

    preloadSequence();

    return () => {
      active = false;
    };
  }, []);

  // High-DPI DPR Canvas render loop with fallback logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const activeFolder = CHAPTERS[activeChapterIndex].folder;
      const imgList = cache[activeFolder];
      if (!imgList) return;

      // Fallback: If requested frame is not ready yet, search backwards then forwards for closest available frame
      let img = imgList[activeFrameIndex - 1];
      if (!img || !img.complete) {
        // Search backwards
        for (let i = activeFrameIndex - 1; i >= 1; i--) {
          if (imgList[i - 1] && imgList[i - 1].complete) {
            img = imgList[i - 1];
            break;
          }
        }
      }

      if (!img || !img.complete) {
        // Search forwards
        for (let i = activeFrameIndex + 1; i <= FOLDER_COUNTS[activeFolder]; i++) {
          if (imgList[i - 1] && imgList[i - 1].complete) {
            img = imgList[i - 1];
            break;
          }
        }
      }

      if (!img || !img.complete) return;

      // Double scale factor for High-DPI screen pixels
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);

      // Ultimate crisp smoothing configurations
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Scale in CSS layout coordinates
      const cssWidth = window.innerWidth;
      const cssHeight = window.innerHeight;
      const scale = Math.max(cssWidth / img.width, cssHeight / img.height);
      const w = img.width * scale;
      const h = img.height * scale;

      const x = (cssWidth - w) / 2;
      // Offset downwards by 12% to leave space for cloud dialogue bubble
      const y = (cssHeight - h) / 2 + cssHeight * 0.12;

      ctx.clearRect(0, 0, cssWidth, cssHeight);
      ctx.drawImage(img, x, y, w, h);
    };

    render();

    const handleResize = () => {
      render();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeChapterIndex, activeFrameIndex, cache]);

  // Confetti celebrations
  const triggerBigCelebration = () => {
    const duration = 4 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.8 },
        colors: ["#ff0844", "#ffb199", "#ff0050", "#ffffff"]
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.8 },
        colors: ["#ff0844", "#ffb199", "#ff0050", "#ffffff"]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.7 },
      colors: ["#ff0844", "#ffb199", "#ff0050", "#ffffff"]
    });
  };

  const handleUnlock = () => {
    setIsUnlocked(true);

    // Play romantic background music on interaction
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => setIsPlayingMusic(true))
        .catch(err => console.log("Audio play blocked by browser:", err));
    }

    // Scroll smoothly to gallery
    setTimeout(() => {
      galleryRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
      setIsMutedByUser(true); // Explicitly muted by user
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlayingMusic(true);
          setIsMutedByUser(false); // Explicitly unmuted by user
        })
        .catch(err => console.log("Audio play failed:", err));
    }
  };

  const handleVisitStoryAgain = () => {
    setShowCompletionPopup(false);
    setIsUnlocked(false);
    setVirtualFrame(1);
    setIsAutoplay(true);
    setHasCelebrated(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextChapter = () => {
    setIsAutoplay(false);
    const nextIdx = Math.min(CHAPTERS.length - 1, activeChapterIndex + 1);
    setVirtualFrame(CHAPTERS[nextIdx].startFrame);
  };

  const handlePrevChapter = () => {
    setIsAutoplay(false);
    const nextIdx = Math.max(0, activeChapterIndex - 1);
    setVirtualFrame(CHAPTERS[nextIdx].startFrame);
  };

  // Helper to render text with beautiful big glowing flower emojis 🌸
  const renderTextWithBigEmojis = (text: string) => {
    // Regex splits on 🌸 to render it dynamically in a larger animated format
    const parts = text.split(/(🌸)/g);
    return parts.map((part, idx) => {
      if (part === "🌸") {
        return (
          <span
            key={idx}
            className="inline-block text-3xl md:text-4xl animate-bounce mx-1.5 align-middle text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
            style={{ animationDuration: '3s' }}
          >
            🌸
          </span>
        );
      }
      return part;
    });
  };
  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isUnlocked || isPreloading) return;

    // Calculate displacement
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = Date.now() - dragStartRef.current.time;

    // If it was a clean tap/click (small movement & quick click)
    if (distance < 8 && duration < 300) {
      // Don't toggle play/pause if clicking on a button or link
      const target = e.target as HTMLElement;
      if (target.closest("button") || target.closest("a")) return;

      setIsAutoplay(prev => !prev);
    }
  };
  const currentChapter = CHAPTERS[activeChapterIndex];

  const overallProgressPercent = Math.round((virtualFrame / TOTAL_FRAMES) * 100);

  return (
    <div className="relative w-full bg-black">

      {/* Hidden Love Background Audio Element */}
      <audio ref={audioRef} src="/love.mp3" loop />

      {/* FIXED STORYTELLING VIEWPORT */}
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className={`w-full h-screen ${isUnlocked ? 'relative' : 'fixed inset-0'} overflow-hidden z-0 bg-black cursor-pointer`}
      >

        {/* Softer Ambient Overlays for brighter viewing and less black in corners */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,80,0.02)_0%,rgba(0,0,0,0.3)_95%)] pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/30 pointer-events-none z-10" />

        {/* The Frame Scrubbing Canvas at full brightness */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover pointer-events-none z-0 filter brightness-100"
        />

        {/* PREMIUM NAVIGATION & MUSIC CONTROL TOOLBAR (Top Right) */}
        <div className="absolute top-6 right-6 z-40 flex items-center gap-2.5 pointer-events-auto select-none">
          {/* Mute/Unmute toggle */}
          <button
            onClick={toggleMusic}
            title={isPlayingMusic ? "Mute Music" : "Unmute Music"}
            className="w-9 h-9 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white backdrop-blur-md hover:bg-[#ff0050] hover:text-white hover:border-[#ff0050] hover:shadow-[0_0_15px_rgba(255,0,80,0.6)] hover:scale-105 transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
          >
            {isPlayingMusic ? (
              <Volume2 size={15} className="animate-pulse text-pink-300" />
            ) : (
              <VolumeX size={15} className="text-white/60" />
            )}
          </button>

          {/* Jump to Start */}
          <button
            onClick={() => {
              setVirtualFrame(1);
              setIsAutoplay(true);
            }}
            title="Jump to Start"
            className="px-3 py-1.5 rounded-full bg-black/40 border border-white/10 flex items-center gap-1.5 text-[10px] font-outfit uppercase tracking-wider text-white backdrop-blur-md hover:bg-[#ff0050] hover:text-white hover:border-[#ff0050] hover:shadow-[0_0_15px_rgba(255,0,80,0.6)] hover:scale-105 transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
          >
            <SkipBack size={10} />
            Start
          </button>

          {/* Jump to End */}
          <button
            onClick={() => {
              setVirtualFrame(1475);
            }}
            title="Jump to End"
            className="px-3 py-1.5 rounded-full bg-black/40 border border-white/10 flex items-center gap-1.5 text-[10px] font-outfit uppercase tracking-wider text-white backdrop-blur-md hover:bg-[#ff0050] hover:text-white hover:border-[#ff0050] hover:shadow-[0_0_15px_rgba(255,0,80,0.6)] hover:scale-105 transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
          >
            End
            <SkipForward size={10} />
          </button>
        </div>

        {/* PREMIUM FLOATING CHAPTER NAVIGATION ARROWS (Left & Right Sides) */}
        {!isUnlocked && (
          <>
            {/* Left Chevron (Previous Chapter) */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 z-40 pointer-events-auto select-none">
              <button
                onClick={handlePrevChapter}
                disabled={activeChapterIndex === 0}
                title="Previous Chapter"
                className="w-12 h-12 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white backdrop-blur-md hover:bg-[#ff0050] hover:text-white hover:border-[#ff0050] hover:shadow-[0_0_20px_rgba(255,0,80,0.8)] hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.4)] disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft size={24} className="mr-0.5" />
              </button>
            </div>

            {/* Right Chevron (Next Chapter) */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 z-40 pointer-events-auto select-none">
              <button
                onClick={handleNextChapter}
                disabled={activeChapterIndex === CHAPTERS.length - 1}
                title="Next Chapter"
                className="w-12 h-12 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white backdrop-blur-md hover:bg-[#ff0050] hover:text-white hover:border-[#ff0050] hover:shadow-[0_0_20px_rgba(255,0,80,0.8)] hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.4)] disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight size={24} className="ml-0.5" />
              </button>
            </div>
          </>
        )}

        {/* PREMIUM CLOUD DIALOGUE BOX (Fixed top-center, leaving beautiful space below, instant updates without fades) */}
        {!isUnlocked && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[90%] max-w-xl z-30 pointer-events-none">
            <div
              className="relative pointer-events-auto w-full px-8 py-6 rounded-[35px] bg-white/[0.03] border border-white/10 shadow-[0_20px_60px_rgba(255,0,80,0.12),inset_0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-2xl flex flex-col items-center text-center overflow-hidden"
            >
              {/* Cloud styling fluffy accents using background circles */}
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-pink-500/[0.04] rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -top-16 -right-12 w-28 h-28 bg-rose-500/[0.04] rounded-full blur-2xl pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

              {/* Glowing Heart Icon */}
              <motion.div
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-rose-500 mb-3"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Heart size={14} fill="currentColor" />
              </motion.div>

              {/* Chapter Title */}
              <h2 className="text-pink-300 font-outfit font-semibold uppercase tracking-[0.25em] text-[10px] md:text-xs mb-2">
                {currentChapter.title}
              </h2>

              {/* Story Dialogue Text updated instantly */}
              <p className="text-white text-sm md:text-base font-playfair font-light italic leading-relaxed max-w-md">
                "{renderTextWithBigEmojis(currentChapter.text)}"
              </p>
            </div>
          </div>
        )}

        {/* BOTTOM PROGRESS METER */}
        {!isUnlocked && (
          <>
            <div className="absolute bottom-8 inset-x-0 z-30 flex flex-col items-center gap-3 pointer-events-none">
              <div className="flex gap-2.5">
                {CHAPTERS.map((c, i) => (
                  <div
                    key={c.id}
                    className={`h-1.5 rounded-full transition-all duration-500 ${activeChapterIndex === i
                      ? "w-8 bg-[#ff0050] shadow-[0_0_8px_#ff0050]"
                      : "w-2 bg-white/20"
                      }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-outfit uppercase tracking-[0.35em] text-pink-300/60 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                  {virtualFrame >= 1470
                    ? "Happy Birthday, My Love! 🎉"
                    : `${isAutoplay ? "PLAYING" : "PAUSED"} • OUR STORY UNFOLDING • ${overallProgressPercent}%`
                  }
                </span>
              </div>
            </div>

            {/* Beautiful dedicated Autoplay On / Off button in the bottom-right corner */}
            {virtualFrame < 1475 && (
              <div className="absolute bottom-8 right-8 z-40 pointer-events-auto select-none">
                <button
                  onClick={() => setIsAutoplay(prev => !prev)}
                  title={isAutoplay ? "Pause Autoplay" : "Resume Autoplay"}
                  className={`px-4 py-2.5 rounded-full border flex items-center gap-2 text-xs font-outfit uppercase tracking-widest font-black shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-105 cursor-pointer backdrop-blur-md ${isAutoplay
                    ? "bg-[#ff0050]/20 border-[#ff0050]/40 text-pink-300 shadow-[0_0_20px_rgba(255,0,80,0.4)]"
                    : "bg-black/60 border-white/20 text-white hover:border-[#ff0050] hover:text-[#ff0050] hover:shadow-[0_0_20px_rgba(255,0,80,0.2)]"
                    }`}
                >
                  {isAutoplay ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-[#ff0050] animate-ping" />
                      <Pause size={12} className="animate-pulse text-pink-400" />
                      <span>Autoplay On</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-gray-500" />
                      <Play size={12} className="text-white" />
                      <span>Autoplay Off</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* Floating Replay button at completion */}
        <AnimatePresence>
          {virtualFrame >= 1475 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 pointer-events-auto"
            >
              <button
                onClick={handleVisitStoryAgain}
                className="px-8 py-4 rounded-full bg-black/60 border border-pink-500/30 text-white font-extrabold font-outfit text-xs uppercase tracking-widest hover:bg-[#ff0050] hover:text-white hover:border-[#ff0050] hover:shadow-[0_0_20px_rgba(255,0,80,0.7)] hover:scale-105 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md flex items-center gap-2 cursor-pointer"
              >
                Visit Our Story Again 🌸
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LOADING BUFFER FOR CHANNELS (Shown only once at the very beginning of the site) */}
        <AnimatePresence>
          {isPreloading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md pointer-events-auto"
            >
              <div className="flex flex-col items-center gap-5 text-center px-6">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  className="text-[#ff0050] drop-shadow-[0_0_15px_rgba(255,0,80,0.6)]"
                >
                  <Heart size={44} fill="currentColor" />
                </motion.div>

                <div className="flex flex-col items-center gap-2">
                  <p className="font-outfit uppercase tracking-[0.3em] text-xs text-white font-semibold">
                    Unlocking Our Story...
                  </p>
                  <p className="font-outfit text-[10px] tracking-[0.15em] text-pink-200/50 uppercase">
                    Preparing beautiful frames ({loadedPercent}%)
                  </p>
                </div>

                <div className="w-40 h-1 bg-white/10 rounded-full overflow-hidden relative">
                  <motion.div
                    className="absolute h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full"
                    style={{ width: `${loadedPercent}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* GORGEOUS MEMORIES CIRCULAR FLIP CARD GALLERY SECTION (Unlocked and scrolled down to only when completed) */}
      <AnimatePresence>
        {isUnlocked && (
          <motion.section
            ref={galleryRef}
            id="circular-gallery-section"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative w-full pt-32 md:pt-48 pb-0 bg-black z-10 overflow-hidden flex flex-col gap-24 md:gap-36"
          >
            {/* Circular gallery — 16 unique images (indices 10 to 25) */}
            <div className="relative max-w-7xl mx-auto w-full flex flex-col items-center z-10">
              <CircularGallery images={memories.slice(10, 26)} />
            </div>

            {/* Arc timeline gallery — 12 unique images (indices 25 to 36) */}
            <div className="w-full relative z-10">
              <ArcGalleryHero images={memories.slice(25, 37).map(img => `/memories/${img}`)} />
            </div>

          </motion.section>
        )}
      </AnimatePresence>

    </div>
  );
}
