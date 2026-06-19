"use client"

import { useState, useEffect, type ReactNode } from "react"
import { motion, AnimatePresence, LayoutGroup, type PanInfo } from "framer-motion"
import { cn } from "@/lib/utils"
import { Grid3X3, Layers, LayoutList, BookOpen, Download } from "lucide-react"

export type LayoutMode = "stack" | "grid" | "list"

export interface CardData {
  id: string
  title: string
  description: string
  icon?: ReactNode
  color?: string
  rawLetter?: any
  isEmptyCard?: boolean
}


export interface MorphingCardStackProps {
  cards?: CardData[]
  className?: string
  defaultLayout?: LayoutMode
  onCardClick?: (card: CardData) => void
  onOpen?: (card: CardData) => void
  onDownload?: (card: CardData) => void
}

const layoutIcons = {
  stack: Layers,
  grid: Grid3X3,
  list: LayoutList,
}

const SWIPE_THRESHOLD = 50

export function MorphingCardStack({
  cards = [],
  className,
  defaultLayout = "stack",
  onCardClick,
  onOpen,
  onDownload,
}: MorphingCardStackProps) {
  const [layout, setLayout] = useState<LayoutMode>(defaultLayout)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    setCurrentPage(0)
    setActiveIndex(0)
  }, [layout])

  if (!cards || cards.length === 0) {
    return null
  }

  const pageSize = layout === "grid" ? 4 : 3
  const totalPages = Math.ceil(cards.length / pageSize)
  const pageCards = cards.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info
    const swipe = Math.abs(offset.x) * velocity.x

    if (offset.x < -SWIPE_THRESHOLD || swipe < -1000) {
      // Swiped left - go to next card
      setActiveIndex((prev) => (prev + 1) % pageCards.length)
    } else if (offset.x > SWIPE_THRESHOLD || swipe > 1000) {
      // Swiped right - go to previous card
      setActiveIndex((prev) => (prev - 1 + pageCards.length) % pageCards.length)
    }
    setIsDragging(false)
  }

  const getStackOrder = () => {
    const reordered = []
    for (let i = 0; i < pageCards.length; i++) {
      const index = (activeIndex + i) % pageCards.length
      reordered.push({ ...pageCards[index], stackPosition: i })
    }
    return reordered.reverse() // Reverse so top card renders last (on top)
  }

  const getLayoutStyles = (stackPosition: number) => {
    switch (layout) {
      case "stack":
        return {
          top: stackPosition * 8,
          left: stackPosition * 8,
          zIndex: pageCards.length - stackPosition,
          rotate: (stackPosition - 1) * 2,
        }
      case "grid":
        return {
          top: 0,
          left: 0,
          zIndex: 1,
          rotate: 0,
        }
      case "list":
        return {
          top: 0,
          left: 0,
          zIndex: 1,
          rotate: 0,
        }
    }
  }

  const containerStyles = {
    stack: "relative h-[260px] w-[296px] sm:h-80 sm:w-80",
    grid: "grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1 paper-scrollbar p-1",
    list: "flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1 paper-scrollbar p-1",
  }

  const displayCards = layout === "stack" ? getStackOrder() : pageCards.map((c, i) => ({ ...c, stackPosition: i }))

  return (
    <div className={cn("space-y-6 w-full", className)}>
      {/* Layout Toggle */}
      <div className="flex items-center justify-center gap-1 rounded-xl bg-neutral-900 border border-neutral-800 p-1 w-fit mx-auto shadow-md">
        {(Object.keys(layoutIcons) as LayoutMode[]).map((mode) => {
          const Icon = layoutIcons[mode]
          return (
            <button
              key={mode}
              onClick={() => setLayout(mode)}
              className={cn(
                "rounded-lg p-2 transition-all cursor-pointer border-none outline-none",
                layout === mode
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                  : "text-neutral-450 hover:text-white hover:bg-neutral-850",
              )}
              aria-label={`Switch to ${mode} layout`}
            >
              <Icon className="h-4 w-4" />
            </button>
          )
        })}
      </div>

      {/* Cards Container */}
      <LayoutGroup>
        <div className={cn(containerStyles[layout], "mx-auto transition-all duration-300")}>
          <AnimatePresence mode="popLayout">
            {displayCards.map((card) => {
              const styles = getLayoutStyles(card.stackPosition)
              const isExpanded = expandedCard === card.id
              const isTopCard = layout === "stack" && card.stackPosition === 0

              return (
                <motion.div
                  key={card.id}
                  layoutId={card.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: isExpanded ? 1.02 : 1,
                    x: 0,
                    ...styles,
                  }}
                  exit={{ opacity: 0, scale: 0.8, x: -200 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  drag={isTopCard ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.7}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={handleDragEnd}
                  whileDrag={{ scale: 1.02, cursor: "grabbing" }}
                  onClick={() => {
                    if (isDragging) return
                    setExpandedCard(isExpanded ? null : card.id)
                    onCardClick?.(card)
                  }}
                  className={cn(
                    "cursor-pointer rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 flex backdrop-blur-md shadow-lg",
                    "hover:border-purple-500/45 transition-colors",
                    layout === "stack" && "absolute w-[280px] h-[240px] sm:w-80 sm:h-72 flex-col justify-between",
                    layout === "stack" && isTopCard && "cursor-grab active:cursor-grabbing",
                    layout === "grid" && "w-full min-h-[160px] flex-col justify-between",
                    layout === "list" && "w-full min-h-[72px] sm:min-h-[80px] flex-row items-center justify-between gap-4 p-3",
                    isExpanded && "ring-1 ring-purple-500 bg-neutral-900/80 border-purple-500",
                  )}
                  style={{
                    backgroundColor: card.color || undefined,
                  }}
                >
                  <div className={cn("flex gap-3 flex-1 min-w-0", layout === "list" ? "items-center" : "items-start")}>
                    {card.icon && (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-purple-400">
                        {card.icon}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white truncate font-playfair">{card.title}</h3>
                      <p
                        className={cn(
                          "text-xs text-neutral-450 mt-1.5 font-outfit leading-relaxed select-text",
                          layout === "stack" && "line-clamp-4",
                          layout === "grid" && "line-clamp-4",
                          layout === "list" && "line-clamp-2",
                        )}
                      >
                        {card.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions (Open & Download) */}
                  {!card.isEmptyCard && (
                    <div 
                      className={cn(
                        "flex gap-2 shrink-0 z-30",
                        layout === "list" ? "mt-0 w-auto justify-end" : "mt-4 w-full justify-between items-center",
                        layout === "stack" && "mb-6 sm:mb-8"
                      )}
                      onClick={(e) => e.stopPropagation()} // Prevent card toggle on button clicks
                    >
                      <button
                        onClick={() => onOpen?.(card)}
                        className={cn(
                          "py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 font-outfit border-none outline-none",
                          layout === "list" ? "w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2" : "flex-1 py-2 px-3"
                        )}
                      >
                        <BookOpen size={12} />
                        Open
                      </button>
                      <button
                        onClick={() => onDownload?.(card)}
                        className={cn(
                          "border border-neutral-700 bg-neutral-850/50 hover:bg-neutral-800 text-neutral-200 hover:text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 font-outfit outline-none",
                          layout === "list" ? "w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2" : "flex-1 py-2 px-3"
                        )}
                      >
                        <Download size={12} />
                        Download
                      </button>
                    </div>
                  )}

                  {layout === "stack" && isTopCard && (
                    <div className="absolute bottom-1.5 left-0 right-0 text-center pointer-events-none">
                      <span className="text-[9px] text-neutral-600 tracking-wider">Swipe to navigate</span>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </LayoutGroup>

      {layout === "stack" && pageCards.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {pageCards.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "h-1.5 rounded-full transition-all border-none outline-none cursor-pointer",
                index === activeIndex ? "w-4 bg-purple-500" : "w-1.5 bg-neutral-850 hover:bg-neutral-700",
              )}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6 z-20">
          <button
            disabled={currentPage === 0}
            onClick={() => {
              setCurrentPage(prev => Math.max(0, prev - 1))
              setActiveIndex(0)
            }}
            className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-850 transition cursor-pointer text-white flex items-center justify-center size-8 shadow-sm font-outfit"
            aria-label="Previous Page"
          >
            ←
          </button>
          <span className="text-xs font-outfit text-neutral-400">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages - 1}
            onClick={() => {
              setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))
              setActiveIndex(0)
            }}
            className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-850 transition cursor-pointer text-white flex items-center justify-center size-8 shadow-sm font-outfit"
            aria-label="Next Page"
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}
