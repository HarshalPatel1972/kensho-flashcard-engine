"use client";

import { useState, useEffect } from "react";
import { DeckCard } from "./DeckCard";
import { motion, useReducedMotion, AnimatePresence, Variants } from "framer-motion";

type Deck = {
  id: string;
  title: string;
  cardCount: number;
  masteredCount: number;
  dueTodayCount: number;
  lastStudiedAt: string | null;
};

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4, ease: "easeOut" } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    transition: { duration: 0.2 } 
  }
};

export function DeckGrid({ initialDecks }: { initialDecks: Deck[] }) {
  const [decks, setDecks] = useState(initialDecks);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setDecks(initialDecks);
  }, [initialDecks]);

  const handleDelete = (id: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== id));
  };

  if (decks.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-border rounded-xl bg-surface/50">
        <p className="text-secondary mb-6 font-light">
          No decks yet. Upload a PDF to start your Kenshō journey.
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      variants={shouldReduceMotion ? undefined : containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="popLayout">
        {decks.map((deck) => (
          <motion.div 
            key={deck.id} 
            variants={shouldReduceMotion ? undefined : itemVariants}
            layout
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <DeckCard
              {...deck}
              onDelete={() => handleDelete(deck.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
