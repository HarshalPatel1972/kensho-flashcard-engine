"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useKenshoSounds } from "@/hooks/use-kensho-sounds";

type RatingButtonsProps = {
  onRate: (quality: number) => void;
  disabled?: boolean;
};

export function RatingButtons({ onRate, disabled }: RatingButtonsProps) {
  const shouldReduceMotion = useReducedMotion();
  const { playClick } = useKenshoSounds();

  useEffect(() => {
    if (disabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const keys = ["1", "2", "3", "4"];
      if (keys.includes(e.key)) {
        playClick();
        switch (e.key) {
          case "1": onRate(0); break;
          case "2": onRate(3); break;
          case "3": onRate(4); break;
          case "4": onRate(5); break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onRate, disabled, playClick]);

  const buttons = [
    { label: "Again", key: "1", value: 0, bgColor: "#ef4444", shelfColor: "#b91c1c", color: "text-white border-transparent" },
    { label: "Hard", key: "2", value: 3, bgColor: "#f97316", shelfColor: "#c2410c", color: "text-white border-transparent" },
    { label: "Good", key: "3", value: 4, bgColor: "#22c55e", shelfColor: "#15803d", color: "text-white border-transparent" },
    { label: "Easy", key: "4", value: 5, bgColor: "#06b6d4", shelfColor: "#0e7490", color: "text-white border-transparent" },
  ];

  return (
    <div className="grid grid-cols-2 md:flex md:flex-row items-center justify-center gap-6 mt-4 md:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300 w-full max-w-xl mx-auto px-4 md:px-0">
      {buttons.map((btn) => (
        <motion.button
          key={btn.label}
          disabled={disabled}
          onClick={() => onRate(btn.value)}
          whileHover={shouldReduceMotion ? {} : { scale: 1.05, translateY: -2 }}
          whileTap={shouldReduceMotion ? {} : { translateY: 3, boxShadow: `0 2px 0 0 ${btn.shelfColor}` }}
          transition={{ type: "spring", stiffness: 450, damping: 20 }}
          className={`group relative flex flex-col items-center justify-center w-full md:w-28 h-24 rounded-2xl border transition-colors duration-100 disabled:opacity-50 ${btn.color}`}
          style={{
            backgroundColor: btn.bgColor,
            boxShadow: `0 5px 0 0 ${btn.shelfColor}`,
          }}
        >
          <span className="text-lg font-bold mb-1">{btn.label}</span>
          <span className="text-[10px] md:text-xs text-white/80 px-2 py-0.5 rounded-md bg-black/20 transition-colors font-medium">Press {btn.key}</span>
        </motion.button>
      ))}
    </div>
  );
}
