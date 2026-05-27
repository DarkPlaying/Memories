'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Heart, Calendar, Star, Sparkles, MessageCircle } from 'lucide-react';

// --- The ArcGalleryHero Component ---
type ArcGalleryHeroProps = {
  images: string[];
  startAngle?: number;
  endAngle?: number;
  radiusLg?: number;
  radiusMd?: number;
  radiusSm?: number;
  cardSizeLg?: number;
  cardSizeMd?: number;
  cardSizeSm?: number;
  className?: string;
};

interface TimelineItem {
  date: string;
  title: string;
  emoji: string;
  category: 'February' | 'March' | 'April' | 'May' | 'Future';
}

const timelineData: TimelineItem[] = [
  // --- February ---
  { date: "Feb 02", title: "First reason to fall in love with you", emoji: "❤️", category: "February" },
  { date: "Feb 04", title: "Night proposal under the stars", emoji: "🌙", category: "February" },
  { date: "Feb 05", title: "Shy in college meet (our secret glances)", emoji: "🏫", category: "February" },
  { date: "Feb 12", title: "First gift from me to you", emoji: "🎁", category: "February" },
  { date: "Feb 14 12:00 AM", title: "Midnight gift opening & endless smiles", emoji: "🕛", category: "February" },
  { date: "Feb 14", title: "You wearing my gifted jimiki, and proposed to you with chocolate in MBA classroom", emoji: "🍫", category: "February" },
  { date: "Feb 16", title: "You gifted me my very first gift", emoji: "🎀", category: "February" },
  { date: "Feb 21", title: "Our magical first date", emoji: "☕", category: "February" },
  { date: "Feb 24", title: "First tears shed out of deep love and care", emoji: "😢", category: "February" },
  { date: "Feb 27", title: "Our sweet first kiss", emoji: "💋", category: "February" },

  // --- March ---
  { date: "Mar 07", title: "Second date with you and me only", emoji: "🌹", category: "March" },
  { date: "Mar 11", title: "Our first college trip together", emoji: "🚌", category: "March" },
  { date: "Mar 13", title: "First late night talking with a sweet keychain gift", emoji: "🔑", category: "March" },
  { date: "Mar 14", title: "Our first posted social story", emoji: "📸", category: "March" },
  { date: "Mar 26", title: "First marriage poster edit (dreaming of forever)", emoji: "💍", category: "March" },
  { date: "Mar 28", title: "First visit to my home", emoji: "🏡", category: "March" },

  // --- April ---
  { date: "Apr 03", title: "First edited video of our laughs", emoji: "🎬", category: "April" },
  { date: "Apr 10", title: "First carnival ride screaming together", emoji: "🎡", category: "April" },
  { date: "Apr 11", title: "Your first gorgeous saree look for me", emoji: "🥻", category: "April" },

  // --- May ---
  { date: "May 19", title: "Dedication of the first song for you", emoji: "🎵", category: "May" },
  { date: "May 23", title: "Celebrating your first birthday by my side", emoji: "🎂", category: "May" },
  { date: "May 26", title: "First cooking adventure together at my home", emoji: "🍳", category: "May" }
];

// --- Countdown Timer Subcomponent ---
const CountdownTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date("May 23, 2031 00:00:00").getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex flex-wrap justify-center gap-4 md:gap-5 mt-10 max-w-xl mx-auto z-20 relative px-4"
    >
      {[
        { label: "Days", value: timeLeft.days },
        { label: "Hours", value: timeLeft.hours },
        { label: "Minutes", value: timeLeft.minutes },
        { label: "Seconds", value: timeLeft.seconds }
      ].map((item, idx) => (
        <div
          key={idx}
          className="flex flex-col items-center justify-center w-20 h-24 md:w-28 md:h-28 rounded-2xl bg-white/[0.02] border border-pink-500/10 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-md relative overflow-hidden group"
        >
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-pink-500/40 to-transparent" />
          <span className="text-xl md:text-3xl font-playfair font-black text-pink-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">
            {item.value.toString().padStart(2, '0')}
          </span>
          <span className="text-[8px] md:text-[9px] font-outfit uppercase tracking-widest text-gray-400 mt-2 font-bold">
            {item.label}
          </span>
        </div>
      ))}
    </motion.div>
  );
};

// --- Location Heart Union Subcomponent ---
const LocationHeartUnion: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto py-16 flex flex-col items-center z-20 relative overflow-visible">
      {/* SVG ClipPath Definitions for Heart Halves */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id="left-heart-clip" clipPathUnits="objectBoundingBox">
            <path d="M 1,1 C 0.5,0.75 0,0.55 0,0.3 C 0,0.135 0.25,0 0.6,0 C 0.85,0 1,0.125 1,0.225 Z" />
          </clipPath>
          <clipPath id="right-heart-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0,1 C 0.5,0.75 1,0.55 1,0.3 C 1,0.135 0.75,0 0.4,0 C 0.15,0 0,0.125 0,0.225 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="text-xl md:text-2xl font-playfair font-black text-white text-center mb-10 tracking-wide"
      >
        Our Story &apos;26 📍
      </motion.h3>

      {/* Meet in Center Container — heartbeat float animation */}
      <motion.div
        animate={{ scale: [1, 1.08, 1, 1.05, 1] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: [0.25, 0.46, 0.45, 0.94], repeatDelay: 0.9 }}
        className="relative w-full h-[38rem] flex items-center justify-center"
      >
        {/* Her Location (Avadi) - Slides from Left */}
        <motion.div
          initial={{ x: -350, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ type: "spring", stiffness: 55, damping: 16, delay: 0.1 }}
          className="absolute z-10 flex flex-col items-center gap-4"
          style={{ right: "50%" }}
        >
          {/* Her Half Heart - map clipped */}
          <div
            className="w-80 h-[34rem] relative overflow-hidden cursor-pointer pointer-events-auto shadow-[0_0_40px_rgba(244,63,94,0.35)]"
            style={{ clipPath: 'url(#left-heart-clip)' }}
          >
            <iframe
              src="https://maps.google.com/maps?q=Avadi&t=&z=13&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full border-0 filter invert-[0.9] hue-rotate-[180deg] opacity-75 hover:opacity-100 transition-opacity duration-300 pointer-events-auto"
              allowFullScreen={false}
              loading="lazy"
            />
            {/* Subtle pink tint overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 to-transparent pointer-events-none" />
          </div>
          <div className="text-center">
            <p className="text-[11px] font-outfit uppercase tracking-wider text-pink-300 font-bold">Avadi</p>
            <p className="text-[10px] text-gray-400 font-light mt-0.5">Where she shines</p>
          </div>
        </motion.div>

        {/* My Location (Puzhal) - Slides from Right */}
        <motion.div
          initial={{ x: 350, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ type: "spring", stiffness: 55, damping: 16, delay: 0.1 }}
          className="absolute z-10 flex flex-col items-center gap-4"
          style={{ left: "50%" }}
        >
          {/* My Half Heart - map clipped */}
          <div
            className="w-80 h-[34rem] relative overflow-hidden cursor-pointer pointer-events-auto shadow-[0_0_40px_rgba(244,63,94,0.35)]"
            style={{ clipPath: 'url(#right-heart-clip)' }}
          >
            <iframe
              src="https://maps.google.com/maps?q=Puzhal&t=&z=13&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full border-0 filter invert-[0.9] hue-rotate-[180deg] opacity-75 hover:opacity-100 transition-opacity duration-300 pointer-events-auto"
              allowFullScreen={false}
              loading="lazy"
            />
            {/* Subtle rose tint overlay */}
            <div className="absolute inset-0 bg-gradient-to-bl from-rose-600/20 to-transparent pointer-events-none" />
          </div>
          <div className="text-center">
            <p className="text-[11px] font-outfit uppercase tracking-wider text-rose-300 font-bold">Puzhal</p>
            <p className="text-[10px] text-gray-400 font-light mt-0.5">Where he dreams</p>
          </div>
        </motion.div>

        {/* Center Glowing Union Pulse */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: [0, 1.3, 1], opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="absolute w-16 h-16 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center text-rose-500 shadow-[0_0_35px_#ff0050,inset_0_0_20px_rgba(255,0,80,0.15)] z-30 pointer-events-none"
        >
          <Heart size={28} fill="currentColor" className="animate-pulse" />
        </motion.div>
      </motion.div>
    </div>
  );
};

// --- Avatar Connection Subcomponent ---
const AvatarConnection: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full min-h-[90vh] md:min-h-screen max-w-3xl mx-auto py-12 md:py-24 flex flex-col items-center justify-center z-20 relative px-6 overflow-hidden"
    >
      {/* Title */}
      <h3 className="text-2xl md:text-3xl font-playfair font-black text-white text-center mb-6 tracking-wide">
        Two Souls, One Beautiful Path ✨
      </h3>

      {/* Google Maps Styled Route Info Bar */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-10 px-6 py-3 rounded-full bg-neutral-900/95 border border-white/10 flex items-center gap-3 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.6)] z-20 pointer-events-auto"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-[#4285F4] animate-ping" />
        <span className="text-[10px] md:text-xs font-outfit uppercase tracking-widest text-[#4285F4] font-black">
          Avadi ➔ Puzhal (14.2 km) • Route via Butterfly Path 🦋
        </span>
      </motion.div>

      <div className="relative w-full flex items-center justify-between px-6 md:px-16 h-48 mt-4">

        {/* Google Maps Blue Route Line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 1, ease: "easeInOut" }}
          style={{ originX: 0 }}
          className="absolute inset-x-28 md:inset-x-44 top-1/2 -translate-y-1/2 h-3 bg-blue-950/40 rounded-full border border-[#4285F4]/30 overflow-hidden z-0 shadow-[inset_0_1px_4px_rgba(0,0,0,0.8)]"
        >
          <div className="absolute inset-0 bg-[#4285F4] shadow-[0_0_15px_#4285F4]" />
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-y-0 w-2/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
        </motion.div>

        {/* Flapping Butterfly Navigator */}
        <motion.div
          animate={{
            left: ["22%", "78%"],
            y: [-12, 12, -12, 12, -12]
          }}
          transition={{
            left: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 2.7, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute top-1/2 z-20 pointer-events-none text-3xl filter drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <motion.div
            animate={{
              rotateY: [0, 75, 0, 75, 0],
              rotate: [-10, 10, -10, 10, -10]
            }}
            transition={{
              rotateY: { duration: 0.45, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 2.7, repeat: Infinity, ease: "easeInOut" }
            }}
            className="inline-block"
            style={{ transformOrigin: "center" }}
          >
            🦋
          </motion.div>
        </motion.div>

        {/* Her Avatar (f.png) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer pointer-events-auto"
        >
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-pink-950/40 border-4 border-pink-500 flex items-center justify-center overflow-hidden shadow-[0_0_25px_rgba(244,63,94,0.6)] transition-all group-hover:scale-105">
            <img
              src="/f.png"
              alt="Her"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const parent = (e.target as HTMLImageElement).parentElement;
                if (parent && !parent.querySelector('.fallback-initial')) {
                  const span = document.createElement('span');
                  span.className = "fallback-initial text-3xl font-black font-playfair text-pink-300 drop-shadow-[0_0_5px_rgba(244,63,94,0.4)]";
                  span.innerText = "F";
                  parent.appendChild(span);
                }
              }}
            />
          </div>
          <span className="text-[10px] font-outfit uppercase tracking-widest font-black text-pink-200 bg-pink-500/20 px-3 py-1 rounded-full border border-pink-500/20 backdrop-blur-md">
            Bestie
          </span>
        </motion.div>

        {/* Center Popping Element */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="relative z-10 flex items-center justify-center"
        >
          <motion.div
            animate={{ scale: [0.9, 1.2, 0.9], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-14 h-14 rounded-full bg-white/5 border border-pink-500/20 backdrop-blur-md flex items-center justify-center text-[#ff0050] shadow-[0_0_20px_rgba(255,0,80,0.15)]"
          >
            <Heart size={20} fill="currentColor" className="animate-pulse" />
          </motion.div>
        </motion.div>

        {/* His Avatar (m.png) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer pointer-events-auto"
        >
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-rose-950/40 border-4 border-rose-500 flex items-center justify-center overflow-hidden shadow-[0_0_25px_rgba(244,63,94,0.6)] transition-all group-hover:scale-105">
            <img
              src="/m.png"
              alt="Him"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const parent = (e.target as HTMLImageElement).parentElement;
                if (parent && !parent.querySelector('.fallback-initial')) {
                  const span = document.createElement('span');
                  span.className = "fallback-initial text-3xl font-black font-playfair text-rose-300 drop-shadow-[0_0_5px_rgba(244,63,94,0.4)]";
                  span.innerText = "M";
                  parent.appendChild(span);
                }
              }}
            />
          </div>
          <span className="text-[10px] font-outfit uppercase tracking-widest font-black text-rose-200 bg-rose-500/20 px-3 py-1 rounded-full border border-rose-500/20 backdrop-blur-md">
            Partner
          </span>
        </motion.div>

      </div>
    </motion.div>
  );
};

// --- Wedding Invitation Footer Subcomponent ---
const WeddingInvitationFooter: React.FC = () => {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center py-16 bg-black z-20 relative">
      <div className="w-full max-w-4xl mx-auto px-4 flex flex-col items-center gap-10 md:gap-16 z-20 relative">

        {/* Section 1: From This */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-6 w-full"
        >
          <div className="flex items-center gap-3 select-none">
            <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-pink-500/50" />
            <span className="text-xs md:text-sm font-outfit font-black text-pink-300 tracking-[0.25em] uppercase drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">
              From This... 🌸
            </span>
            <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-pink-500/50" />
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-6 w-full">
            {/* 3.png */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="aspect-[3/4] w-full rounded-3xl overflow-hidden border border-pink-500/20 shadow-[0_20px_40px_rgba(0,0,0,0.7)] bg-[#0d0d0e]/60 relative group cursor-pointer"
            >
              <img
                src="/3.png"
                alt="From This 1"
                className="w-full h-full object-cover rounded-3xl filter brightness-95 group-hover:brightness-100 transition-all duration-300"
              />
            </motion.div>
            {/* 4.png */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="aspect-[3/4] w-full rounded-3xl overflow-hidden border border-pink-500/20 shadow-[0_20px_40px_rgba(0,0,0,0.7)] bg-[#0d0d0e]/60 relative group cursor-pointer"
            >
              <img
                src="/4.png"
                alt="From This 2"
                className="w-full h-full object-cover rounded-3xl filter brightness-95 group-hover:brightness-100 transition-all duration-300"
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Central connecting glowing double heart divider */}
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-pink-500 flex items-center justify-center gap-3 select-none"
        >
          <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-pink-500/40 to-pink-500/80" />
          <Heart size={20} fill="currentColor" className="drop-shadow-[0_0_12px_#f43f5e] animate-pulse" />
          <div className="w-20 h-0.5 bg-gradient-to-l from-transparent via-pink-500/40 to-pink-500/80" />
        </motion.div>

        {/* Section 2: To This */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-6 w-full"
        >
          <div className="flex items-center gap-3 select-none">
            <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-rose-500/50" />
            <span className="text-xs md:text-sm font-outfit font-black text-rose-300 tracking-[0.25em] uppercase drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">
              To This... 💍
            </span>
            <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-rose-500/50" />
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-6 w-full">
            {/* 1.png */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="aspect-[3/4] w-full rounded-3xl overflow-hidden border border-rose-500/20 shadow-[0_20px_40px_rgba(0,0,0,0.7)] bg-[#0d0d0e]/60 relative group cursor-pointer"
            >
              <img
                src="/1.png"
                alt="To This 1"
                className="w-full h-full object-cover rounded-3xl filter brightness-95 group-hover:brightness-100 transition-all duration-300"
              />
            </motion.div>
            {/* 2.png */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="aspect-[3/4] w-full rounded-3xl overflow-hidden border border-rose-500/20 shadow-[0_20px_40px_rgba(0,0,0,0.7)] bg-[#0d0d0e]/60 relative group cursor-pointer"
            >
              <img
                src="/2.png"
                alt="To This 2"
                className="w-full h-full object-cover rounded-3xl filter brightness-95 group-hover:brightness-100 transition-all duration-300"
              />
            </motion.div>
          </div>
        </motion.div>

      </div>

      {/* Premium Full-Width Climax Footer with tighter margins to prevent empty trailing space */}
      <footer className="w-full text-center py-8 mt-12 border-t border-white/10 z-20 relative bg-black/60 backdrop-blur-md">
        <div className="flex flex-col items-center gap-3.5">
          <div className="flex items-center gap-2 text-rose-500 text-sm select-none">
            <Heart size={14} fill="currentColor" className="animate-pulse" />
            <span className="font-playfair font-black text-white tracking-widest text-xs uppercase">Sanjay & Divya</span>
            <Heart size={14} fill="currentColor" className="animate-pulse" />
          </div>
          <p className="text-[9px] font-outfit uppercase tracking-[0.35em] text-gray-400 font-bold max-w-md leading-relaxed px-4 select-none">
            Designing Our Future Nest Together • Avadi to Puzhal Connection • May 2031 💍
          </p>
          <p className="text-[8px] font-outfit text-gray-600 tracking-wider mt-2 select-none">
            © 2026 Sanjay. Made with eternal love and devotion. All Rights Reserved.
          </p>
        </div>
      </footer>

    </div>
  );
};

// (HorizontalScroller removed to support clean vertical scroll flow)

export const ArcGalleryHero: React.FC<ArcGalleryHeroProps> = ({
  images,
  startAngle = 10,
  endAngle = 170,
  radiusLg = 420,
  radiusMd = 320,
  radiusSm = 220,
  cardSizeLg = 110,
  cardSizeMd = 90,
  cardSizeSm = 75,
  className = '',
}) => {
  const [dimensions, setDimensions] = useState({
    radius: radiusLg,
    cardSize: cardSizeLg,
  });

  // Responsive resizing of the arc and cards
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setDimensions({ radius: radiusSm, cardSize: cardSizeSm });
      } else if (width < 1024) {
        setDimensions({ radius: radiusMd, cardSize: cardSizeMd });
      } else {
        setDimensions({ radius: radiusLg, cardSize: cardSizeLg });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [radiusLg, radiusMd, radiusSm, cardSizeLg, cardSizeMd, cardSizeSm]);

  const count = Math.max(images.length, 2);
  const step = (endAngle - startAngle) / (count - 1);

  return (
    <section className={`relative overflow-hidden bg-black text-white flex flex-col items-center pt-20 pb-0 ${className}`}>

      {/* ambient glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,80,0.03)_0%,transparent_80%)] pointer-events-none" />

      {/* Background ring container distributing memory photos along the curve */}
      <div
        className="relative w-full max-w-[1200px] z-10 select-none pointer-events-none"
        style={{
          height: dimensions.radius * 1.05,
        }}
      >
        {/* HEADER SEGMENT PLACED BEAUTIFULLY INSIDE THE ARC */}
        <div className="absolute left-1/2 bottom-6 -translate-x-1/2 text-center max-w-sm md:max-w-xl px-6 z-20 pointer-events-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4.5"
          >
            <Heart size={12} className="text-rose-500 fill-current" />
            <span className="text-[10px] font-outfit uppercase tracking-[0.2em] text-pink-200">Our Story &apos;26</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-playfair font-black text-white mb-3.5 tracking-tight leading-tight">
            Our Story &apos;26
          </h2>
          <p className="text-xs md:text-sm font-outfit text-gray-300 font-light leading-relaxed">
            Every sweet memory we built, every promise we made, charted along the gorgeous arc of our beautiful lives.
          </p>
        </div>

        <div className="absolute left-1/2 bottom-0 -translate-x-1/2">
          {images.map((src, i) => {
            const angle = startAngle + step * i;
            const angleRad = (angle * Math.PI) / 180;

            const x = Math.cos(angleRad) * dimensions.radius;
            const y = Math.sin(angleRad) * dimensions.radius;

            return (
              <div
                key={i}
                className="absolute opacity-0 animate-fade-in-up"
                style={{
                  width: dimensions.cardSize,
                  height: dimensions.cardSize,
                  left: `calc(50% + ${x}px)`,
                  bottom: `${y}px`,
                  transform: `translate(-50%, 50%)`,
                  animationDelay: `${i * 90}ms`,
                  animationFillMode: 'forwards',
                  zIndex: count - i,
                }}
              >
                <div
                  className="rounded-[20px] shadow-2xl overflow-hidden border border-white/10 bg-neutral-900 transition-transform hover:scale-105 w-full h-full"
                  style={{ transform: `rotate(${angle - 90}deg)` }}
                >
                  <img
                    src={src}
                    alt={`Memory ${i + 1}`}
                    className="block w-full h-full object-cover filter brightness-95"
                    draggable={false}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/400x400/1c1c1e/e2e8f0?text=Memory`;
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GORGEOUS MARRIAGE TIMELINE LISTING */}
      <div className="w-full max-w-6xl px-4 mt-16 z-20 relative flex flex-col items-center">

        {/* Vertical Timeline spine */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-500/90 via-pink-500/40 to-rose-500/90 -translate-x-1/2 hidden md:block rounded-full" />

        <div className="w-full flex flex-col gap-12 md:gap-16 relative">

          {timelineData.map((item, index) => {
            const isLeft = index % 2 === 0;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: Math.min(index * 0.05, 0.3), ease: "easeOut" }}
                className={`flex flex-col md:flex-row items-center w-full relative ${isLeft ? 'md:flex-row-reverse' : ''
                  }`}
              >

                {/* Central Pulse Heart Node */}
                <div className="absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#1c1c1e] border-2 border-pink-500/50 flex items-center justify-center z-30 hidden md:flex shadow-[0_0_12px_rgba(244,63,94,0.5)]">
                  <motion.div
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: index * 0.12 }}
                    className="text-rose-500"
                  >
                    <Heart size={14} fill="currentColor" />
                  </motion.div>
                </div>

                {/* Left/Right content wrappers */}
                <div className="w-full md:w-1/2 px-0 md:px-10 flex justify-center">
                  <div
                    className="w-full max-w-xl p-8 rounded-3xl bg-white/[0.03] border border-white/10 shadow-[0_20px_45px_rgba(0,0,0,0.5)] hover:border-pink-500/30 hover:shadow-[0_20px_50px_rgba(244,63,94,0.08)] transition-all duration-300 backdrop-blur-md relative overflow-hidden group"
                    style={{
                      boxShadow: item.category === 'Future'
                        ? '0 20px 50px rgba(244,63,94,0.10), inset 0 0 20px rgba(255,255,255,0.03)'
                        : '0 20px 45px rgba(0,0,0,0.5)'
                    }}
                  >
                    {item.category === 'Future' && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/[0.06] rounded-full blur-2xl pointer-events-none" />
                    )}

                    {/* Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-outfit uppercase tracking-widest font-semibold ${item.category === 'Future'
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : 'bg-white/5 text-pink-300 border border-white/10'
                        }`}>
                        <Calendar size={11} />
                        {item.date}
                      </span>
                      <span className="text-2xl select-none filter drop-shadow-[0_0_6px_rgba(244,63,94,0.5)]">
                        {item.emoji}
                      </span>
                    </div>

                    {/* Text Title */}
                    <p className={`font-outfit leading-relaxed ${item.category === 'Future'
                      ? 'text-white font-bold text-lg'
                      : 'text-gray-100 text-base'
                      }`}>
                      {item.title}
                    </p>

                    {/* Decorative star for future items */}
                    {item.category === 'Future' && (
                      <div className="mt-4 flex items-center gap-1.5 text-rose-300/50">
                        <Sparkles size={12} />
                        <span className="text-[9px] font-outfit uppercase tracking-widest font-medium">MILESTONE FOREVER</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Empty spacer block for side balancing */}
                <div className="w-full md:w-1/2 hidden md:block" />

              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Timeline Footer card */}
      <div className="relative max-w-lg mx-auto text-center z-20 mt-20 py-12 px-8 rounded-3xl bg-white/[0.02] border border-pink-500/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col items-center overflow-hidden">
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-pink-500/[0.04] rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-rose-500/[0.04] rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-4">
          <Heart size={20} fill="#ff0543" className="text-[#ff0543] animate-pulse" />
          <Sparkles size={16} className="text-pink-300 animate-spin" style={{ animationDuration: '8s' }} />
          <Heart size={20} fill="#ff0543" className="text-[#ff0543] animate-pulse" />
        </div>
        <h3 className="text-2xl font-playfair font-black text-white mb-3">Our Story &apos;26</h3>
        <p className="text-xs font-outfit text-gray-400 leading-relaxed tracking-wider uppercase max-w-xs">
          From first touch to forever vows in 2031, my heart beat will always belong to you.
        </p>
      </div>

      {/* CLIMAX WEDDING UNION SECTIONS */}
      <CountdownTimer />
      <LocationHeartUnion />
      <AvatarConnection />
      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-pink-500/20 to-transparent my-16" />
      <WeddingInvitationFooter />

      {/* Embedded local keyframes animations style */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translate(-50%, 65%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 50%);
          }
        }
        .animate-fade-in-up {
          animation-name: fade-in-up;
          animation-duration: 0.8s;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </section>
  );
};
