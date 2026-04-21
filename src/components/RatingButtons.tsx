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
    { label: "Again", key: "1", value: 0, shadowColor: "rgba(239, 68, 68, 0.4)", activeShadowColor: "rgba(185, 28, 28, 0.6)", color: "text-red-500 border-red-500/20 active:translate-y-1" },
    { label: "Hard", key: "2", value: 3, shadowColor: "rgba(249, 115, 22, 0.4)", activeShadowColor: "rgba(194, 65, 12, 0.6)", color: "text-orange-500 border-orange-500/20 active:translate-y-1" },
    { label: "Good", key: "3", value: 4, shadowColor: "rgba(34, 197, 94, 0.4)", activeShadowColor: "rgba(21, 128, 61, 0.6)", color: "text-green-500 border-green-500/20 active:translate-y-1" },
    { label: "Easy", key: "4", value: 5, shadowColor: "rgba(6, 182, 212, 0.4)", activeShadowColor: "rgba(14, 116, 144, 0.6)", color: "text-cyan-500 border-cyan-500/20 active:translate-y-1" },
  ];

  return (
    <div className="grid grid-cols-2 md:flex md:flex-row items-center justify-center gap-6 mt-8 md:mt-12 animate-in fade-in slide-in-from-bottom-4 duration-300 w-full max-w-xl mx-auto px-4 md:px-0">
      {buttons.map((btn) => (
        <motion.button
          key={btn.label}
          disabled={disabled}
          onClick={() => { playClick(); onRate(btn.value); }}
          whileHover={shouldReduceMotion ? {} : { scale: 1.05, translateY: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={`group relative flex flex-col items-center justify-center w-full md:w-28 h-28 rounded-2xl border transition-all duration-100 disabled:opacity-50 ${btn.color}`}
          style={{
            backgroundColor: 'var(--surface)',
            boxShadow: `0 5px 0 0 ${btn.shadowColor}`,
          }}
        >
          <span className="text-lg font-bold mb-1 md:mb-2">{btn.label}</span>
          <span className="text-[10px] md:text-xs text-secondary px-2 py-1 rounded-md bg-bg/50 transition-colors">Press {btn.key}</span>
          
          <style jsx>{`
            button:active {
              transform: translateY(4px);
              box-shadow: 0 1px 0 0 ${btn.shadowColor} !important;
            }
          `}</style>
        </motion.button>
      ))}
    </div>
  );
}
