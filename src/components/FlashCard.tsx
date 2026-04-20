"use client";

import { motion, useReducedMotion } from "framer-motion";

type FlashCardProps = {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
};

export function FlashCard({ front, back, isFlipped, onFlip }: FlashCardProps) {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <div
      className="w-full max-w-2xl h-[24rem] md:h-[28rem] cursor-pointer mx-auto relative px-4 md:px-0"
      onClick={onFlip}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        className="w-full h-full relative"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ 
          duration: shouldReduceMotion ? 0 : 0.5, 
          ease: [0.23, 1, 0.32, 1] 
        }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front Face */}
        <div 
          className="absolute inset-0 bg-surface border border-border/50 rounded-2xl p-6 md:p-12 flex flex-col items-center justify-center text-center shadow-xl"
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="text-[clamp(1.25rem,5vw,2.5rem)] text-primary font-medium leading-relaxed">
            {front}
          </p>
          <p className="absolute bottom-6 text-sm text-secondary font-light tracking-wide md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            Tap or press Space to reveal
          </p>
        </div>

        {/* Back Face */}
        <div 
          className="absolute inset-0 bg-surface border border-gold/30 rounded-2xl p-6 md:p-12 flex flex-col items-center justify-center text-center shadow-2xl shadow-gold/5"
          style={{ 
            backfaceVisibility: "hidden", 
            transform: "rotateY(180deg)" 
          }}
        >
          <p className="text-[clamp(1rem,4vw,1.5rem)] text-primary font-light leading-relaxed">
            {back}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
