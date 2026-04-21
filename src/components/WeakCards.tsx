"use client";

import { motion, useReducedMotion } from "framer-motion";

type WeakCard = {
  id: string;
  front: string;
  easeFactor: number | null;
  repetitions: number | null;
};

export function WeakCards({ cards }: { cards: WeakCard[] }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-medium text-primary">Needs work</h2>
        <p className="text-sm text-secondary mt-1">These cards are harder for you than average</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <motion.div 
            key={card.id}
            initial={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: shouldReduceMotion ? 0 : index * 0.08 }}
            className="p-5 bg-surface dark:bg-surface border-l-4 border-gold rounded-r-xl border-y border-r border-border/40 shadow-sm light:bg-[#fffbeb] light:border-[#fde68a] card-lifted"
          >
            <p className="text-sm text-primary font-medium mb-3 line-clamp-3">{card.front}</p>
            <div className="flex items-center justify-between mt-auto">
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase tracking-wider text-secondary">Ease Factor</p>
                <p className="text-xs font-bold text-gold">{(card.easeFactor ?? 2.5).toFixed(2)}</p>
              </div>
              <div className="text-right space-y-0.5">
                <p className="text-[10px] uppercase tracking-wider text-secondary">Reviews</p>
                <p className="text-xs font-bold text-primary">{card.repetitions ?? 0}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
