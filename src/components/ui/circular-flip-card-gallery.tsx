"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Globe, Heart } from "lucide-react"

// A simple utility for conditional class names
const cn = (...classes: any[]) => classes.filter(Boolean).join(" ")

interface FlipCardProps {
  image: string
  title: string
  description: string
  className?: string
  style?: React.CSSProperties
}

// --- FlipCard Component ---
function FlipCard({ image, title, description, className, style }: FlipCardProps) {
  return (
    <div
      className={cn(
        "group w-16 h-22 sm:w-22 sm:h-28 md:w-28 md:h-36 rounded-lg sm:rounded-xl [perspective:1000px] transition-transform duration-300 ease-in-out hover:scale-110",
        className
      )}
      style={style}
    >
      <div className="relative w-full h-full rounded-xl shadow-lg transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
        {/* Front side - Image */}
        <div className="absolute inset-0 rounded-xl [backface-visibility:hidden]">
          <img
            src={image || "/placeholder.svg"}
            alt={title}
            className="w-full h-full object-cover rounded-xl border border-neutral-700/50 shadow-inner"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.onerror = null
              target.src = "https://placehold.co/400x600/0a0a0a/333333?text=Image"
            }}
          />
        </div>
        {/* Back side - Title and Description */}
        <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-neutral-950 border border-pink-500/20 flex flex-col items-center justify-center p-1.5 sm:p-2 md:p-3 text-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
          <h3 className="font-outfit font-bold text-[8px] sm:text-xs md:text-sm text-pink-300 mb-0.5 sm:mb-1 text-balance">{title}</h3>
          <p className="text-[7px] sm:text-[10px] md:text-xs text-neutral-400 font-outfit text-pretty leading-snug">{description}</p>
        </div>
      </div>
    </div>
  )
}

interface CircularGalleryProps {
  images?: string[];
}

// --- Main App Component (Circular Gallery) ---
export default function CircularGallery({ images = [] }: CircularGalleryProps) {
  const galleryRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(0)
  const [rotation, setRotation] = useState(0)
  const [isMobileWidth, setIsMobileWidth] = useState(false)

  // Effect for responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (galleryRef.current) {
        const gallerySize = galleryRef.current.offsetWidth
        setSize(gallerySize)
      }
      setIsMobileWidth(window.innerWidth < 640)
    }

    updateSize() // Initial size

    const resizeObserver = new ResizeObserver(updateSize)
    if (galleryRef.current) {
      resizeObserver.observe(galleryRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  // Effect for animation loop
  useEffect(() => {
    let animationFrameId: number
    const animate = () => {
      setRotation((prevRotation) => prevRotation + 0.001) // slow subtle auto-rotation
      animationFrameId = requestAnimationFrame(animate)
    }
    animationFrameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  const radius = size * (isMobileWidth ? 0.43 : 0.38) // Wider spacing on mobile to leave elegant gaps between cards
  const centerX = size / 2
  const centerY = size / 2

  // Default fallback images in case dynamic list is empty
  const defaultImages = [
    "/memories/WOS/WhatsApp%20Image%202026-04-02%20at%2019.57.08.jpeg",
    "/memories/WOS/WhatsApp%20Image%202026-04-02%20at%2019.57.11.jpeg",
    "/memories/WOS/WhatsApp%20Image%202026-04-02%20at%2019.57.17.jpeg",
    "/memories/WOS/WhatsApp%20Image%202026-04-02%20at%2019.57.18.jpeg",
    "/memories/WOS/WhatsApp%20Image%202026-04-02%20at%2019.57.21.jpeg",
    "/memories/WOS/WhatsApp%20Image%202026-04-02%20at%2019.57.25.jpeg",
  ]

  // Map dynamic images with beautiful narrative cards
  const dynamicCardData = (images.length > 0 ? images.slice(0, 16).map(img => ({ path: img, isDynamic: true })) : defaultImages.map(img => ({ path: img, isDynamic: false }))).map((item, index) => {
    let cleanTitle = ""
    if (item.isDynamic) {
      const filenameWithExt = item.path.split("/").pop() || item.path
      const filenameWithoutExt = filenameWithExt.substring(0, filenameWithExt.lastIndexOf('.')) || filenameWithExt
      cleanTitle = filenameWithoutExt
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    } else {
      const defaultTitles = [
        "Sweet Smiles", "Beautiful Moments", "Warm Embraces", "Pure Radiant Joy", "Endless Talks", "Perfect Memories"
      ]
      cleanTitle = defaultTitles[index % defaultTitles.length]
    }

    const textTemplates = [
      "Your laughter makes my entire universe light up.",
      "Every second with you is a treasure I cherish.",
      "In your warm embrace, I found my favorite home.",
      "Sharing our deep thoughts under the evening sky.",
      "Late nights, hours talking about everything and nothing.",
      "Building a grand gallery of smiles together.",
      "Every single day by your side is my favorite memory.",
      "Timeless elegance and a spark that warmed my world.",
      "Every adventure we took became a gorgeous canvas.",
      "You are the sweetest melody that plays in my heart.",
      "Finding absolute comfort in your words, every night.",
      "To the endless chapters we are writing together.",
      "Side by side, ready to embrace whatever the future holds.",
      "I love you today, tomorrow, and for all the days to come.",
      "A single smile, a moment frozen in beautiful time.",
      "Exploring the infinite beauty of our shared universe."
    ]

    return {
      image: item.isDynamic ? `/memories/${item.path}` : item.path,
      title: cleanTitle,
      description: textTemplates[index % textTemplates.length]
    }
  })
  return (
    <div className="w-full font-sans text-[#F5F5F5] min-h-0 py-8 md:py-12 flex flex-col items-center justify-center p-4 overflow-hidden relative">

      {/* Decorative ambient glowing grids */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,80,0.05)_0%,transparent_70%)] pointer-events-none" />

      {/* ACT I: THE Orbit of Memories Section Title (placed above the circle image) */}
      <div className="w-[90%] max-w-xl text-center px-4 z-20 pointer-events-auto flex flex-col items-center mb-10 md:mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-3 shadow-[inset_0_0_10px_rgba(255,0,80,0.05)]">
          <Heart size={10} className="text-rose-500 fill-current animate-pulse" />
          <span className="text-[9px] font-outfit uppercase tracking-[0.2em] text-pink-200">✦ Act I ✦</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-black text-white mb-3.5 tracking-tight leading-tight">
          The Orbit of Memories
        </h2>
        <p className="text-xs sm:text-sm font-outfit text-gray-400 font-light leading-relaxed max-w-md">
          A gorgeous interactive sphere of our most precious moments. Spin the circle or step inside our cosmic 3D world.
        </p>
      </div>

      <div
        ref={galleryRef}
        className="relative w-full max-w-[280px] xs:max-w-[340px] sm:max-w-[480px] md:max-w-[600px] aspect-square flex items-center justify-center"
      >
        {/* Central text & Magical View My World Button inside the circle */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none p-2 sm:p-4 text-center">
          <h2 className="text-pink-300/80 font-outfit uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[7px] sm:text-[10px] md:text-xs mb-1 sm:mb-3 font-semibold">
            Our Sweetest Chapters
          </h2>

          <h1 className="text-[14px] sm:text-xl md:text-2xl font-playfair font-black text-white text-center text-balance mb-2.5 sm:mb-6 leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] max-w-[130px] sm:max-w-xs md:max-w-md">
            A Circular Gallery of Our Beautiful Memories
          </h1>

          {/* VIEW MY WORLD ACTION BUTTON */}
          <Link
            href="/my-world"
            className="group pointer-events-auto inline-flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-6 sm:py-3 rounded-full bg-white text-black font-extrabold font-outfit text-[8px] sm:text-xs uppercase tracking-widest hover:bg-[#ff0050] hover:text-white transition-all shadow-[0_10px_25px_rgba(255,255,255,0.08)] hover:shadow-[0_15px_30px_rgba(255,0,80,0.4)] hover:scale-105 active:scale-95 transition-all"
          >
            <span className="relative z-10 flex items-center gap-1 sm:gap-2">
              View My World
              <Globe size={9} className="group-hover:rotate-45 transition-transform duration-500 sm:size-[14px]" />
            </span>
          </Link>
        </div>

        {/* Circular arrangement of cards */}
        {size > 0 &&
          dynamicCardData.map((card, index) => {
            const angle = (index / dynamicCardData.length) * 2 * Math.PI - Math.PI / 2 + rotation
            const x = centerX + radius * Math.cos(angle)
            const y = centerY + radius * Math.sin(angle)

            return (
              <FlipCard
                key={index}
                {...card}
                className="absolute hover:z-20"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: `translate(-50%, -50%) rotate(${(angle + Math.PI / 2) * (180 / Math.PI)}deg)`,
                }}
              />
            )
          })}
      </div>
    </div>
  )
}
