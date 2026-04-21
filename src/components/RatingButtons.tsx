"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

type RatingButtonsProps = {
  onRate: (quality: number) => void;
  disabled?: boolean;
};

export function RatingButtons({ onRate, disabled }: RatingButtonsProps) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (disabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "1": onRate(0); break;
        case "2": onRate(3); break;
        case "3": onRate(4); break;
        case "4": onRate(5); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onRate, disabled]);

  const buttons = [
    { label: "Again", key: "1", value: 0, color: "text-red-500 border-red-500/20 hover:bg-[#ef4444] hover:border-[#ef4444] hover:text-white active:bg-[#dc2626] active:border-[#dc2626] active:text-white" },
    { label: "Hard", key: "2", value: 3, color: "text-orange-500 border-orange-500/20 hover:bg-[#f97316] hover:border-[#f97316] hover:text-white active:bg-[#ea6c0a] active:border-[#ea6c0a] active:text-white" },
    { label: "Good", key: "3", value: 4, color: "text-green-500 border-green-500/20 hover:bg-[#22c55e] hover:border-[#22c55e] hover:text-white active:bg-[#16a34a] active:border-[#16a34a] active:text-white" },
    { label: "Easy", key: "4", value: 5, color: "text-cyan-500 border-cyan-500/20 hover:bg-[#06b6d4] hover:border-[#06b6d4] hover:text-white active:bg-[#0891b2] active:border-[#0891b2] active:text-white" },
  ];

  return (
    <div className="grid grid-cols-2 md:flex md:flex-row items-center justify-center gap-4 mt-8 md:mt-12 animate-in fade-in slide-in-from-bottom-4 duration-300 w-full max-w-xl mx-auto px-4 md:px-0">
      {buttons.map((btn) => (
        <motion.button
          key={btn.label}
          disabled={disabled}
          onClick={() => onRate(btn.value)}
          whileHover={shouldReduceMotion ? {} : { scale: 1.03 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={`group flex flex-col items-center justify-center w-full md:w-24 h-24 rounded-2xl border border-border/50 bg-[#f5f5f5] dark:bg-surface transition-all duration-200 disabled:opacity-50 ${btn.color}`}
        >
          <span className="text-base font-medium mb-1 md:mb-2">{btn.label}</span>
          <span className="text-[10px] md:text-xs text-secondary group-hover:text-white/75 group-active:text-white/75 px-2 py-1 rounded-md bg-bg/50 transition-colors">Press {btn.key}</span>
        </motion.button>
      ))}
    </div>
  );
}
