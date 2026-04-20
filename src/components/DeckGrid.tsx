"use client";

import { useState } from "react";
import { DeckCard } from "./DeckCard";

type Deck = {
  id: string;
  title: string;
  cardCount: number;
  masteredCount: number;
  dueTodayCount: number;
  lastStudiedAt: string | null;
};

export function DeckGrid({ initialDecks }: { initialDecks: Deck[] }) {
  const [decks, setDecks] = useState(initialDecks);

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {decks.map((deck) => (
        <DeckCard
          key={deck.id}
          {...deck}
          onDelete={() => handleDelete(deck.id)}
        />
      ))}
    </div>
  );
}
