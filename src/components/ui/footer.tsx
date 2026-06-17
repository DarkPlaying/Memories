"use client";

import React from "react";
import type { ComponentProps, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Heart, Sparkles, BookOpen, Calendar, MapPin, Gift } from "lucide-react";

interface FooterLink {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
  label: string;
  links: FooterLink[];
}

const footerLinks: FooterSection[] = [
  {
    label: "Our Story Chapters",
    links: [
      { title: "Ordinary Classmates", href: "#story-top", icon: BookOpen },
      { title: "First Real Talk", href: "#story-top", icon: Sparkles },
      { title: "Becoming More", href: "#story-top", icon: Heart },
    ],
  },
  {
    label: "Love Chronicles",
    links: [
      { title: "Countdown", href: "#countdown-section", icon: Calendar },
      { title: "Circular Flip Cards", href: "#circular-gallery-section" },
      { title: "Arc Timeline", href: "#arc-timeline-section" },
    ],
  },
  {
    label: "Our Connections",
    links: [
      { title: "Avadi to Puzhal", href: "#connections-section", icon: MapPin },
      { title: "May 2031 Wedding", href: "#countdown-section", icon: Calendar },
      { title: "Future Nesting", href: "#countdown-section", icon: Gift },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative w-full flex flex-col items-center justify-center border-t border-white/10 bg-[radial-gradient(35%_128px_at_50%_0%,rgba(255,255,255,0.08),transparent)] px-6 py-12 lg:py-16 text-white font-outfit mt-12 z-20">
      <div className="bg-white/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

      <div className="w-full max-w-6xl mx-auto grid gap-8 xl:grid-cols-3 xl:gap-8">
        <AnimatedContainer className="space-y-4 flex flex-col items-center xl:items-start text-center xl:text-left">
          <div className="flex items-center space-x-2 text-rose-500 animate-pulse">
            <Heart className="size-8" fill="currentColor" />
            <span className="font-playfair font-black text-white tracking-widest text-lg uppercase">Sanjay & Divya</span>
          </div>
          <p className="text-gray-400 text-sm max-w-sm font-light leading-relaxed">
            A beautiful, living timeline of our journey, cherished moments, and lifetime of memories together.
          </p>
          <p className="text-gray-500 text-xs mt-8 md:mt-0">
            © {new Date().getFullYear()} Sanjay & Divya. Made with eternal love and devotion.
          </p>
        </AnimatedContainer>

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3 xl:col-span-2 xl:mt-0 text-center sm:text-left">
          {footerLinks.map((section, index) => (
            <AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
              <div className="mb-10 md:mb-0">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-300">{section.label}</h3>
                <ul className="text-gray-400 mt-4 space-y-2.5 text-sm font-light">
                  {section.links.map((link) => (
                    <li key={link.title}>
                      <a
                        href={link.href}
                        className="hover:text-rose-400 inline-flex items-center transition-all duration-300 gap-1.5"
                      >
                        {link.icon && <link.icon className="size-4" />}
                        {link.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>
    </footer>
  );
}

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>["className"];
  children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return children;
  }

  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default Footer;
