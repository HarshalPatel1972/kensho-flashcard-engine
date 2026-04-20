"use client";

import { useEffect } from "react";

type RatingButtonsProps = {
  onRate: (quality: number) => void;
  disabled?: boolean;
};

export function RatingButtons({ onRate, disabled }: RatingButtonsProps) {
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
    { label: "Again", key: "1", value: 0, color: "hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30" },
    { label: "Hard", key: "2", value: 3, color: "hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-500/30" },
    { label: "Good", key: "3", value: 4, color: "hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/30" },
    { label: "Easy", key: "4", value: 5, color: "hover:bg-teal-500/10 hover:text-teal-400 hover:border-teal-500/30" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          disabled={disabled}
          onClick={() => onRate(btn.value)}
          className={`flex flex-col items-center justify-center w-24 h-24 rounded-2xl border border-border/50 bg-surface transition-all duration-200 disabled:opacity-50 ${btn.color}`}
        >
          <span className="text-base font-medium mb-2">{btn.label}</span>
          <span className="text-xs text-slate-500 px-2 py-1 rounded-md bg-bg opacity-70">Press {btn.key}</span>
        </button>
      ))}
    </div>
  );
}
