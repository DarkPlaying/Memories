"use client";

import { useState, useEffect } from "react";
import HeartLoader from "@/components/HeartLoader";
import HeroSection from "@/components/HeroSection";
import { AnimatePresence } from "framer-motion";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  // Instantly skip loading curtains on back deep-linking
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("unlocked") === "true") {
        setIsLoading(false);
      }
    }
  }, []);

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      {/* Hero Section renders in the background from the very start */}
      <HeroSection isParentLoading={isLoading} />

      {/* Heart Loader overlays on top and slides up like a curtain upon completion */}
      <AnimatePresence>
        {isLoading && (
          <HeartLoader onComplete={() => setIsLoading(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}
