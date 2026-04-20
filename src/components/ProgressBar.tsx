"use client";

import { motion, useReducedMotion } from "framer-motion";

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden border border-border/30">
      <motion.div 
        className="h-full bg-gold"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: "easeOut" }}
      />
    </div>
  );
}
