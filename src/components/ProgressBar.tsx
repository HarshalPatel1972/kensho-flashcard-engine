"use client";

import { motion, useReducedMotion } from "framer-motion";

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
      <motion.div 
        className="h-full bg-gold"
        style={{ minWidth: "8px" }}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: "easeOut" }}
      />
    </div>
  );
}
