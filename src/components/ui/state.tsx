"use client"

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ActionProps {
  text: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

interface MailboxFullStateProps {
  imageUrl: string;
  title: string;
  description: string;
  primaryAction: ActionProps;
  secondaryAction: ActionProps;
  tertiaryAction?: ActionProps;
}

export const MailboxFullState = ({
  imageUrl,
  title,
  description,
  primaryAction,
  secondaryAction,
  tertiaryAction,
}: MailboxFullStateProps) => {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = React.useState<React.CSSProperties>({});

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Calculate mouse position relative to card center (-0.5 to 0.5)
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;

    const maxRotate = 12; // Maximum rotation angle in degrees
    const rX = -mouseY * maxRotate;
    const rY = mouseX * maxRotate;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rX}deg) rotateY(${rY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: "transform 0.1s ease-out",
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={tiltStyle}
      className="flex w-full max-w-[310px] min-[375px]:max-w-sm sm:max-w-lg flex-col items-center justify-center rounded-3xl border border-white/10 bg-neutral-900/60 backdrop-blur-xl p-5 sm:p-8 text-center shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] transition-all duration-300 hover:border-purple-500/20 hover:shadow-[0_30px_60px_-12px_rgba(139,92,246,0.15)] select-none"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      aria-labelledby="state-title"
    >
      {/* Image section */}
      <motion.img
        src={imageUrl}
        alt="Mailbox illustration"
        className="mb-4 sm:mb-6 h-28 w-28 sm:h-40 sm:w-40 object-contain pointer-events-none"
        variants={itemVariants}
      />

      {/* Text content section */}
      <motion.h2
        id="state-title"
        className="text-lg sm:text-2xl font-bold text-white font-playfair tracking-wide"
        variants={itemVariants}
      >
        {title}
      </motion.h2>

      <motion.p
        className="mt-2.5 sm:mt-3 text-neutral-300 font-outfit text-xs sm:text-sm leading-relaxed"
        variants={itemVariants}
      >
        {description}
      </motion.p>

      {/* Action buttons section */}
      <motion.div
        className="mt-6 sm:mt-8 flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center items-center"
        variants={itemVariants}
      >
        <Button
          variant="outline"
          className="w-full sm:w-auto text-white border-neutral-750 hover:bg-neutral-800 hover:text-white font-outfit text-xs font-semibold py-2 px-4 rounded-xl cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            secondaryAction.onClick();
          }}
        >
          {secondaryAction.text}
        </Button>
        <Button
          className="w-full sm:w-auto bg-purple-600 text-white hover:bg-purple-700 font-outfit text-xs font-semibold py-2 px-4 rounded-xl cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            primaryAction.onClick();
          }}
        >
          {primaryAction.icon && <span className="mr-2 h-4 w-4">{primaryAction.icon}</span>}
          {primaryAction.text}
        </Button>

        {tertiaryAction && (
          <Button
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 font-outfit text-xs font-semibold py-2 px-4 rounded-xl cursor-pointer border-none shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all duration-300"
            onClick={(e) => {
              e.stopPropagation();
              tertiaryAction.onClick();
            }}
          >
            {tertiaryAction.icon && <span className="mr-2 h-4 w-4">{tertiaryAction.icon}</span>}
            {tertiaryAction.text}
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
};
