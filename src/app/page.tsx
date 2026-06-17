"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import HeartLoader from "@/components/HeartLoader";
import HeroSection from "@/components/HeroSection";
import { AnimatePresence } from "framer-motion";

function HomeContent() {
  const searchParams = useSearchParams();
  const isUnlocked = searchParams.get("unlocked") === "true";

  const [isLoading, setIsLoading] = useState(!isUnlocked);

  return (
    <main className="min-h-screen bg-transparent relative overflow-hidden">
      {/* Hero Section renders in the background from the very start */}
      <HeroSection isParentLoading={isLoading} />

      {/* Heart Loader overlays on top and slides up like a curtain upon completion */}
      <AnimatePresence>
        {isLoading && (
          <HeartLoader 
            onComplete={() => setIsLoading(false)} 
            skipExitAnimation={isUnlocked}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <HomeContent />
    </Suspense>
  );
}

