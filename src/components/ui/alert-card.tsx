"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { buttonVariants } from "@/components/ui/button"
import { AlertCircle, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface AlertCardProps {
  title?: string
  message?: string
  image?: string
  onClose: () => void
  onAction?: () => void
  actionText?: string
  enableAnimations?: boolean
  className?: string
}

export function AlertCard({
  title = "No Message Found",
  message = "It looks like there are no eternal letters written yet in this mailbox. Create a new letter and mark it as 'Eternal' to seal a message across time.",
  image = "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=800&fit=crop", // Starry cosmos theme
  onClose,
  onAction,
  actionText = "Write Eternal Letter",
  enableAnimations = true,
  className,
}: AlertCardProps) {
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
      data-slot="alert-card"
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
        "relative w-[340px] sm:w-[380px] rounded-2xl border-2 border-white/10 bg-neutral-950/95 text-white overflow-hidden",
        "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.95)] cursor-pointer group backdrop-blur-2xl",
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
              transform: "translateZ(45px)",
            }}
            className="absolute top-4 right-4 z-50 text-neutral-300 hover:text-white cursor-pointer transition p-1.5 bg-black/60 hover:bg-black/80 rounded-full border-none outline-none flex items-center justify-center size-7 shadow-lg shadow-black/30"
            title="Close"
          >
            <span className="text-xs font-bold leading-none">✕</span>
          </button>
        )}

        <motion.img 
          src={image} 
          alt={title} 
          className="h-40 w-full object-cover"
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.08 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
        
        {/* Alert Icon Badge */}
        <div 
          style={{
            transform: "translateZ(35px)",
          }}
          className="absolute bottom-4 left-6 flex items-center gap-2 bg-purple-600/90 border border-purple-500/35 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md"
        >
          <AlertCircle size={14} className="animate-pulse" />
          Mailbox Notice
        </div>
      </motion.div>

      {/* Content */}
      <div 
        style={{
          transform: "translateZ(35px)",
          transformStyle: "preserve-3d",
        }}
        className="p-6 space-y-4"
      >
        {/* Title & Description */}
        <motion.div 
          className="space-y-2"
          variants={shouldAnimate ? (childVariants as any) : {}}
          style={{
            transform: "translateZ(45px)",
            transformStyle: "preserve-3d",
          }}
        >
          <motion.h3 
            className="text-lg sm:text-xl font-bold leading-tight tracking-tight text-white font-playfair"
            style={{
              transform: "translateZ(55px)",
            }}
          >
            {title}
          </motion.h3>
          
          <p 
            style={{
              transform: "translateZ(40px)",
            }}
            className="text-xs sm:text-sm text-neutral-400 font-outfit leading-relaxed"
          >
            {message}
          </p>
        </motion.div>

        {/* Action Button */}
        {onAction && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            variants={buttonVariants_motion as any}
            initial={shouldAnimate ? "hidden" : "visible"}
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            style={{
              transform: "translateZ(50px)",
            }}
            className={cn(
              buttonVariants({ variant: "default" }), 
              "w-full h-10 font-medium rounded-xl cursor-pointer text-white border-none text-xs font-outfit",
              "bg-gradient-to-r from-purple-650 to-indigo-650",
              "hover:from-purple-600 hover:to-indigo-600",
              "shadow-lg shadow-purple-500/20 flex items-center justify-center gap-1.5"
            )}
          >
            {actionText}
            <ArrowRight size={14} />
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
