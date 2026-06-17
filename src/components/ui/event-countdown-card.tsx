"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { buttonVariants } from "@/components/ui/button"
import { Calendar, Clock, Users, Download, Mail } from "lucide-react"
import { cn } from "@/lib/utils"

interface EventCountdownCardProps {
  title?: string
  date?: Date
  image?: string
  attendees?: number
  letterCount?: number
  onJoin?: () => void
  onClose?: () => void
  onDownload?: () => void
  enableAnimations?: boolean
  className?: string
}

export function EventCountdownCard({
  title = "React & AI Workshop",
  date,
  image = "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=600&fit=crop", // Tech meetup/workshop
  attendees = 42,
  letterCount,
  onJoin,
  onClose,
  onDownload,
  enableAnimations = true,
  className,
}: EventCountdownCardProps) {
  // Stable event date - only calculate once when no date prop is provided
  const [eventDate] = useState(() => 
    date || new Date(Date.now() + 2 * 24 * 3600 * 1000 + 5 * 3600 * 1000 + 30 * 60 * 1000)
  )
  
  // Initialize timeLeft with the correct calculation
  const [timeLeft, setTimeLeft] = useState(() => {
    const targetDate = date || eventDate
    return Math.max(0, Math.floor((+targetDate - Date.now()) / 1000))
  })
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = enableAnimations && !shouldReduceMotion

  // 3D tilt effects
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 15, stiffness: 150 }
  const springX = useSpring(mouseX, springConfig)
  const springY = useSpring(mouseY, springConfig)

  const rotateX = useTransform(springY, [-0.5, 0.5], ["10.5deg", "-10.5deg"])
  const rotateY = useTransform(springX, [-0.5, 0.5], ["-10.5deg", "10.5deg"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const { width, height, left, top } = rect
    const mouseXVal = e.clientX - left
    const mouseYVal = e.clientY - top
    const xPct = mouseXVal / width - 0.5
    const yPct = mouseYVal / height - 0.5
    mouseX.set(xPct)
    mouseY.set(yPct)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  useEffect(() => {
    const targetDate = date || eventDate
    
    const update = () => {
      const remaining = Math.max(0, Math.floor((+targetDate - Date.now()) / 1000))
      setTimeLeft(remaining)
    }
    
    // Update immediately
    update()
    
    // Then update every second
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [date, eventDate])

  const getTimeUnits = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return { days, hours, minutes, seconds: secs }
  }

  const { days, hours, minutes, seconds } = getTimeUnits(timeLeft)

  const containerVariants = {
    hidden: {
      opacity: 0,
      y: 40,
      scale: 0.95,
      filter: "blur(8px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8,
        staggerChildren: 0.08,
        delayChildren: 0.1,
      }
    },
    rest: { 
      scale: 1,
      y: 0,
      filter: "blur(0px)",
    },
    hover: shouldAnimate ? { 
      scale: 1.03, 
      y: -6,
      filter: "blur(0px)",
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        mass: 0.8,
      }
    } : {},
  }

  const numberVariants = {
    initial: { scale: 1, opacity: 1 },
    pulse: shouldAnimate ? {
      scale: [1, 1.15, 1],
      opacity: [1, 0.7, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut"
      }
    } : {},
  }

  const urgentVariants = {
    initial: { scale: 1 },
    urgent: shouldAnimate ? {
      scale: [1, 1.05, 1],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    } : {},
  }

  const childVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
      filter: "blur(4px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 28,
        mass: 0.6,
      },
    },
  }

  const buttonVariants_motion = {
    hidden: {
      opacity: 0,
      y: 15,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.7,
      },
    },
    rest: { scale: 1, y: 0 },
    hover: shouldAnimate ? { 
      scale: 1.05, 
      y: -2,
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 25 
      }
    } : {},
    tap: shouldAnimate ? { scale: 0.95 } : {},
  }

  return (
    <motion.div
      data-slot="event-countdown-card"
      initial={shouldAnimate ? "hidden" : "visible"}
      animate="visible"
      whileHover="hover"
      variants={containerVariants as any}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "relative w-80 rounded-2xl border border-border/50 bg-card text-card-foreground overflow-hidden",
        "shadow-lg shadow-black/5 cursor-pointer group",
        className
      )}
    >
      {/* Image Container */}
      <motion.div 
        className="relative overflow-hidden"
        variants={shouldAnimate ? (childVariants as any) : {}}
        style={{
          transform: "translateZ(25px)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Close Button Inside Card */}
        {onClose && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            style={{
              transform: "translateZ(40px)",
            }}
            className="absolute top-4 right-4 z-50 text-neutral-300 hover:text-white cursor-pointer transition p-1.5 bg-black/60 hover:bg-black/80 rounded-full border-none outline-none flex items-center justify-center"
            title="Close"
          >
            <span className="text-xs font-bold leading-none">✕</span>
          </button>
        )}

        <motion.img 
          src={image} 
          alt={title} 
          className="h-48 w-full object-cover"
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Urgency Badge */}
        {timeLeft > 0 && timeLeft < 86400 && ( // Less than 24 hours
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              transform: "translateZ(35px)",
            }}
            className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold"
          >
            Starts Soon!
          </motion.div>
        )}
      </motion.div>

      {/* Content */}
      <div 
        style={{
          transform: "translateZ(35px)",
          transformStyle: "preserve-3d",
        }}
        className="p-6 space-y-4"
      >
        {/* Title & Meta */}
        <motion.div 
          className="space-y-2"
          variants={shouldAnimate ? (childVariants as any) : {}}
          style={{
            transform: "translateZ(45px)",
            transformStyle: "preserve-3d",
          }}
        >
          <motion.h3 
            className="text-xl font-bold leading-tight tracking-tight text-white"
            initial={{ opacity: 0.9 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              transform: "translateZ(55px)",
            }}
          >
            {title}
          </motion.h3>
          
          <div 
            style={{
              transform: "translateZ(40px)",
            }}
            className="flex items-center gap-4 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>{(date || eventDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-purple-400" />
              <span>{attendees} partners</span>
            </div>
          </div>
        </motion.div>

        {/* Countdown Display */}
        {timeLeft > 0 ? (
          <motion.div 
            className="space-y-3"
            variants={shouldAnimate ? (childVariants as any) : {}}
            style={{
              transform: "translateZ(45px)",
              transformStyle: "preserve-3d",
            }}
          >
            <div 
              style={{
                transform: "translateZ(35px)",
              }}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground"
            >
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Unlocks in:</span>
            </div>
            
            <div 
              style={{
                transform: "translateZ(40px)",
                transformStyle: "preserve-3d",
              }}
              className="grid grid-cols-4 gap-3"
            >
              {[
                { value: days, label: "Days" },
                { value: hours, label: "Hours" },
                { value: minutes, label: "Min" },
                { value: seconds, label: "Sec" },
              ].map((unit, index) => (
                <motion.div
                  key={unit.label}
                  variants={index === 3 ? (numberVariants as any) : {}} // Only seconds pulse
                  initial="initial"
                  animate={index === 3 ? "pulse" : "initial"}
                  style={{
                    transform: "translateZ(50px)",
                  }}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-center"
                >
                  <div className="text-base font-bold tabular-nums text-white">
                    {unit.value.toString().padStart(2, "0")}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium">
                    {unit.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            variants={shouldAnimate ? (childVariants as any) : {}}
            style={{
              transform: "translateZ(45px)",
            }}
            className="text-center py-4"
          >
            <div className="text-lg font-bold text-green-500">Unsealed!</div>
            <div className="text-sm text-muted-foreground">You can read this memory now.</div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 w-full" style={{ transform: "translateZ(50px)" }}>
          <motion.button
            onClick={onJoin}
            variants={buttonVariants_motion as any}
            initial={shouldAnimate ? "hidden" : "visible"}
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            className={cn(
              "flex-1 h-11 font-medium rounded-xl cursor-pointer text-white border-none flex items-center justify-center font-outfit text-xs transition-all duration-200",
              "bg-gradient-to-r from-purple-600 to-indigo-600",
              "hover:from-purple-500 hover:to-indigo-500",
              "shadow-lg shadow-purple-500/20 active:scale-95"
            )}
          >
            {timeLeft > 0 ? "Back to Saved Chapters" : "Read Memory"}
          </motion.button>

          {letterCount !== undefined && (
            <div
              className={cn(
                "flex-1 h-11 font-medium rounded-xl text-neutral-400 border border-neutral-800 bg-neutral-900/40 flex items-center justify-center gap-1.5 font-outfit text-xs backdrop-blur-md shadow-inner select-none pointer-events-none"
              )}
            >
              <Mail size={12} className="text-purple-400" />
              <span>{letterCount} {letterCount === 1 ? "Letter" : "Letters"}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
