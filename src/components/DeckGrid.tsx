"use client";

import { useState } from "react";
import { DeckCard } from "./DeckCard";
import { motion, useReducedMotion } from "framer-motion";

type Deck = {
  id: string;
  title: string;
  cardCount: number;
  masteredCount: number;
  dueTodayCount: number;
  lastStudiedAt: string | null;
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export function DeckGrid({ initialDecks }: { initialDecks: Deck[] }) {
  const [decks, setDecks] = useState(initialDecks);
  const shouldReduceMotion = useReducedMotion();

  const handleDelete = (id: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== id));
  };

  if (decks.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-border rounded-xl bg-surface/50">
        <p className="text-slate-400 mb-6 font-light">
          No decks yet. Upload a PDF to start your Kenshō journey.
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
      variants={shouldReduceMotion ? {} : containerVariants}
      initial="hidden"
      animate="visible"
    >
      {decks.map((deck) => (
        <motion.div key={deck.id} variants={shouldReduceMotion ? {} : itemVariants}>
          <DeckCard
            {...deck}
            onDelete={() => handleDelete(deck.id)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
