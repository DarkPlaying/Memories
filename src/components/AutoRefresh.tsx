"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const handleOnline = () => {
      // Soft refresh Next.js server components without losing client state
      router.refresh();

      // Retry loading any images that might have failed while offline
      const images = document.querySelectorAll("img");
      images.forEach((img) => {
        if (!img.complete || img.naturalWidth === 0) {
          const currentSrc = img.src;
          img.src = currentSrc;
        }
      });
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [router]);

  return null;
}
