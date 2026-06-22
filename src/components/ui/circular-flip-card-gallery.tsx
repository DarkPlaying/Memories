import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Globe, Heart, ChevronLeft, ChevronRight } from "lucide-react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import SendButton from "@/components/ui/send-button"

// A simple utility for conditional class names
const cn = (...classes: any[]) => classes.filter(Boolean).join(" ")

interface FlipCardProps {
  image: string
  title: string
  description: string
  className?: string
  style?: React.CSSProperties
  isTransitioning?: boolean
  index?: number
}

function FlipCard({ image, title, description, className, style, isTransitioning = false, index = 0 }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  useEffect(() => {
    if (!isFlipped) return
    const timer = setTimeout(() => {
      setIsFlipped(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [isFlipped])

  const fadeDelay = index * 0.05

  return (
    <div className={className} style={style}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: isTransitioning ? 0 : 1, scale: isTransitioning ? 0.8 : 1 }}
        transition={{ duration: 0.5, delay: fadeDelay, ease: "easeInOut" }}
        onClick={() => setIsFlipped(!isFlipped)}
        className="group w-16 h-22 sm:w-22 sm:h-28 md:w-28 md:h-36 rounded-lg sm:rounded-xl [perspective:1000px] transition-transform duration-300 ease-in-out hover:scale-110 cursor-pointer select-none"
      >
        <div
          className={cn(
            "relative w-full h-full rounded-xl shadow-lg transition-all duration-700 [transform-style:preserve-3d]",
            isFlipped ? "[transform:rotateY(180deg)]" : "group-hover:[transform:rotateY(180deg)]"
          )}
        >
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
      </motion.div>
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
  const [isMobileWidth, setIsMobileWidth] = useState(false)
  const [batchIndex, setBatchIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const { scrollY } = useScroll()
  const scrollRotation = useTransform(scrollY, [600, 3600], [0, 160])

  const changeBatch = useCallback((direction: 'next' | 'prev') => {
    if (isTransitioning || images.length === 0) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setBatchIndex(prev => {
        const maxBatches = Math.ceil(images.length / 16);
        if (direction === 'next') {
          return (prev + 1) % maxBatches;
        } else {
          return prev - 1 < 0 ? maxBatches - 1 : prev - 1;
        }
      });
      setTimeout(() => setIsTransitioning(false), 200);
    }, 1200);
  }, [isTransitioning, images.length]);

  // Batch changing timer (every 150 seconds = 2 full 75s rotations)
  useEffect(() => {
    if (images.length === 0) return;
    const interval = setInterval(() => {
      changeBatch('next');
    }, 150000) 
    
    return () => clearInterval(interval)
  }, [images.length, changeBatch])

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

  // Create the dictionary mapping exact filenames to highly customized, romantic descriptions
  const customDescriptions: Record<string, string> = {
    "A Sparkling Sight.png": "Your eyes sparkle brighter than any star I have ever seen in the night sky.",
    "Beach Food.jpeg": "Eating by the shore with the ocean breeze, but you are the only snack I need.",
    "Beach Pair.jpeg": "Our footprints in the sand will wash away, but this beautiful day is permanent.",
    "Beach Selfie.jpeg": "Capturing our sun-kissed smiles and the endless ocean behind us.",
    "Beach Shadow Pic.jpeg": "Even our shadows look perfectly in love under the golden hour sun.",
    "Beautiful Glow.jpeg": "You radiate an angelic glow that makes the whole world feel incredibly warm.",
    "Butterfly Pathway.jpeg": "Walking with you feels like walking on a path paved with gentle butterflies.",
    "Carnival Screams.png": "Holding your hand tightly through all the thrilling rides and joyful screams.",
    "Charming Glances.jpeg": "The way you steal a glance at me makes my heart skip a beat every single time.",
    "Cherished Laughs.jpeg": "Your pure laughter is the sweetest melody I could ever listen to.",
    "Classroom Sparks.jpeg": "Where it all started. Who knew a simple classroom would hold our greatest story?",
    "First Beach Pic.jpeg": "Our very first time at the beach together. The waves, the sand, and just us.",
    "First Celebration Pic.jpeg": "Celebrating our victories and milestones. The first of countless more to come.",
    "First Date.jpeg": "Nervous smiles, racing hearts, and the most magical first date of my life.",
    "First Friends Pic.jpeg": "From close friends to soulmates. The most beautiful transition I've ever lived.",
    "First Group Pic.jpeg": "We stood out to me even in a crowd. You were the only one I saw.",
    "First Ice Cream Date.jpeg": "Sharing sweets with the sweetest person. I remember this perfectly.",
    "First Image Edit from her.jpeg": "The very first edit you made for me. A token of love I will always cherish.",
    "First Lake Visit.jpeg": "Peaceful waters and your comforting presence made this a perfect day.",
    "First Lift Pic.jpeg": "A sneaky lift selfie capturing our silly, wonderful, everyday moments.",
    "First Long Drive.png": "Just us, a long empty road, and endless hours of beautiful conversations.",
    "First Park Visit.jpeg": "A walk in the park that felt like a stroll through absolute paradise.",
    "First Poster Edit.jpeg": "A masterpiece you created. Every detail screams how much you care.",
    "First Reception Pic.jpeg": "Dressed up and gorgeous. You completely stole the show and my heart.",
    "First Sweet Kiss.jpeg": "A single sweet moment that made time stand still forever.",
    "First Toy Gift.jpeg": "The cutest gift that sits on my shelf, reminding me of your sweet soul.",
    "Future Nesting.jpeg": "Building our dreams, planning our life, and creating our cozy future together.",
    "Home Selfie.jpeg": "Just us in our comfort zone. No filters, just pure unconditional love.",
    "Infinite Love.jpeg": "An endless, boundless love that grows stronger with every passing second.",
    "Jimiki Whispers.jpeg": "You wearing my jimiki gift... the most breathtaking sight in the world.",
    "Joyous Smiles.jpeg": "When you smile so hard your eyes close. My absolute favorite expression.",
    "Keychain Keeper.jpeg": "Holding the keys to our journey, and the absolute key to my heart.",
    "Magic Coffee Date.jpeg": "Conversations brewing over coffee. Every sip tasted like magic with you.",
    "Magical Night.jpeg": "Under the city lights, the night was as perfectly magical as you are.",
    "My Whole Heart.jpeg": "In this single frame, you hold my entire heart unconditionally.",
    "My home.jpeg": "Home is not a place anymore, it is wherever I am right beside you.",
    "Our Adventure.png": "To the edge of the world and back, every adventure is better with you.",
    "Our First Foot Print.jpeg": "Leaving our mark on the world, one beautiful step at a time.",
    "Our First Story.jpeg": "The prologue to the greatest love story ever written in the universe.",
    "Our Forever Vow.jpeg": "A silent promise made through our eyes that we will be together forever.",
    "Our Future Letters.jpeg": "Writing down our dreams that we are slowly turning into beautiful realities.",
    "Precious Moments.jpeg": "Every passing second with you feels like a rare, precious diamond.",
    "Precious Moments.png": "Holding onto these fleeting moments and keeping them safe in my heart.",
    "Second Pic.jpeg": "Our second picture together! The start of our endless gallery of memories.",
    "Secret Glances.jpeg": "The secret looks we shared when no one else in the room was watching.",
    "Stardust Chapters.jpeg": "We are written in the stars, a celestial love story meant to be.",
    "Sweet Comfy Vibes.jpeg": "Sweatpants, messy hair, and feeling perfectly comfortable in each other's arms.",
    "Sweet Companion.jpeg": "My partner in crime, my best friend, and my sweet lifelong companion.",
    "Sweet Smile.png": "That exact smile is the reason I fall in love with you every single day.",
    "Teardrop Promise.jpeg": "I promise to wipe away every tear and replace it with a thousand smiles.",
    "Timeless Talk.jpeg": "Hours passing like seconds when we talk deeply about life and love.",
    "To Her.jpeg": "Everything I do, I do it for you. You are my greatest inspiration.",
    "To Me.jpeg": "The way you look at me makes me feel like the luckiest person alive.",
    "Together.jpeg": "We just fit together. Like two puzzle pieces meant to find each other.",
    "Two Souls Connected.jpeg": "An invisible string connects my soul directly to yours, forever.",
    "Wedding Dreams.jpeg": "Looking forward to the day you walk down the aisle. My ultimate dream.",
    "first image.jpeg": "Where it all began. The very first snapshot of our incredible journey.",
    "First Bite.jpeg": "Sharing our first bite together. The sweetest taste of our beautiful forever.",
    "love birds.jpeg": "Two happy love birds, flying side by side through life's beautiful skies."
  };

  // Extract images for the current batch without repeating/padding
  const BATCH_SIZE = 16;
  const currentBatchImages = images.length > 0 
    ? images.slice(batchIndex * BATCH_SIZE, batchIndex * BATCH_SIZE + BATCH_SIZE)
    : defaultImages;

  // Map dynamic images with beautiful narrative cards
  const dynamicCardData = currentBatchImages.map((img, index) => {
    
    const isDynamic = images.length > 0;
    let cleanTitle = ""
    let finalDesc = ""
    
    if (isDynamic) {
      const filenameWithExt = img.split("/").pop() || img
      const filenameWithoutExt = filenameWithExt.substring(0, filenameWithExt.lastIndexOf('.')) || filenameWithExt
      cleanTitle = filenameWithoutExt
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        
      finalDesc = customDescriptions[filenameWithExt] || "A beautiful memory forever engraved in the story of us.";
    } else {
      const defaultTitles = [
        "Sweet Smiles", "Beautiful Moments", "Warm Embraces", "Pure Radiant Joy", "Endless Talks", "Perfect Memories"
      ]
      cleanTitle = defaultTitles[index % defaultTitles.length]
      finalDesc = "A single sweet moment that made time stand still forever."
    }

    return {
      image: isDynamic ? `/memories/${img}` : img,
      title: cleanTitle,
      description: finalDesc
    }
  })
  return (
    <div className="w-full font-sans text-[#F5F5F5] min-h-0 pt-3 pb-24 sm:pt-6 sm:pb-6 md:py-10 flex flex-col items-center justify-center px-6 sm:px-18 md:px-26 overflow-visible relative">

      {/* Decorative ambient glowing grids */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,80,0.05)_0%,transparent_70%)] pointer-events-none" />

      {/* ACT I: THE Orbit of Memories Section Title (placed above the circle image) */}
      <div className="w-[90%] max-w-xl text-center px-4 z-20 pointer-events-auto flex flex-col items-center mb-16 md:mb-16">
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
        {/* Floating mail envelopes centered vertically according to the circular gallery */}
        <motion.div
          animate={{ y: [-15, 15, -15] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-80px] left-[-35px] xs:left-[-20px] translate-y-0 sm:top-1/2 sm:left-[-100px] md:left-[-160px] lg:left-[-240px] xl:left-[-300px] sm:-translate-y-1/2 z-10 flex flex-col items-center gap-1.5 sm:gap-3 pointer-events-none"
        >
          <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-26 md:h-26 lg:w-32 lg:h-32 xl:w-36 xl:h-36 select-none pointer-events-none">
            <img src="/mail/mail (1).gif" alt="Mail Envelope Left" className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,0,80,0.4)]" />
          </div>
          <a href="/mailing" className="pointer-events-auto translate-x-[6px] sm:translate-x-[10px]">
            <SendButton />
          </a>
        </motion.div>
        <motion.div
          animate={{ y: [15, -15, 15] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-80px] right-[-35px] xs:right-[-20px] top-auto translate-y-0 sm:top-1/2 sm:bottom-auto sm:right-[-100px] md:right-[-160px] lg:right-[-240px] xl:right-[-300px] sm:-translate-y-1/2 z-10 flex flex-col items-center gap-1.5 sm:gap-3 pointer-events-none"
        >
          <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-26 md:h-26 lg:w-32 lg:h-32 xl:w-36 xl:h-36 select-none pointer-events-none">
            <img src="/mail/mail (1).gif" alt="Mail Envelope Right" className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,0,80,0.4)]" />
          </div>
          <a href="/mailing" className="pointer-events-auto translate-x-[6px] sm:translate-x-[10px]">
            <SendButton />
          </a>
        </motion.div>
        {/* Central text & Magical View My World Button inside the circle */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none p-2 sm:p-4 text-center">
          <h2 className="text-pink-300/80 font-outfit uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[7px] sm:text-[10px] md:text-xs mb-1 sm:mb-3 font-semibold">
            Our Sweetest Chapters
          </h2>

          <h1 className="text-[14px] sm:text-xl md:text-2xl font-playfair font-black text-white text-center text-balance mb-2.5 sm:mb-6 leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] max-w-[130px] sm:max-w-xs md:max-w-md">
            A Circular Gallery of Our Beautiful Memories
          </h1>

          {/* VIEW MY WORLD ACTION BUTTON with Navigation Controls */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 pointer-events-auto mt-2">
            <button 
              onClick={() => changeBatch('prev')} 
              disabled={isTransitioning}
              className="p-1.5 sm:p-2 rounded-full text-white/70 hover:text-pink-400 hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            <a
              href="/my-world"
              className="group inline-flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-6 sm:py-3 rounded-full bg-white text-black font-extrabold font-outfit text-[8px] sm:text-xs uppercase tracking-widest hover:bg-[#ff0050] hover:text-white transition-all shadow-[0_10px_25px_rgba(255,255,255,0.08)] hover:shadow-[0_15px_30px_rgba(255,0,80,0.4)] hover:scale-105 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-1 sm:gap-2">
                View My World
                <Globe size={9} className="group-hover:rotate-45 transition-transform duration-500 sm:size-[14px]" />
              </span>
            </a>

            <button 
              onClick={() => changeBatch('next')}
              disabled={isTransitioning}
              className="p-1.5 sm:p-2 rounded-full text-white/70 hover:text-pink-400 hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Circular arrangement of cards fanning out and rotating on scroll + auto-spin */}
        {size > 0 && (
          <motion.div
            style={{ rotate: scrollRotation }}
            className="absolute inset-0 pointer-events-none"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 75, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              {dynamicCardData.map((card, index) => {
                const angle = (index / dynamicCardData.length) * 2 * Math.PI - Math.PI / 2
                const x = centerX + radius * Math.cos(angle)
                const y = centerY + radius * Math.sin(angle)

                return (
                  <FlipCard
                    key={`${index}-${batchIndex}`} // Remount key on batch change if necessary, or let Framer handle state
                    image={card.image}
                    title={card.title}
                    description={card.description}
                    isTransitioning={isTransitioning}
                    index={index}
                    className="absolute hover:z-20 pointer-events-auto"
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: `translate(-50%, -50%) rotate(${(angle + Math.PI / 2) * (180 / Math.PI)}deg)`,
                    }}
                  />
                )
              })}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
