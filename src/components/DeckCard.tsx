"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type DeckCardProps = {
  id: string;
  title: string;
  cardCount: number;
  masteredCount: number;
  dueTodayCount: number;
  lastStudiedAt: string | null;
};

export function DeckCard({ id, title, cardCount, masteredCount, dueTodayCount, lastStudiedAt }: DeckCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const progress = cardCount > 0 ? (masteredCount / cardCount) * 100 : 0;

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this deck? All progress will be lost.")) return;
    
    setIsDeleting(true);
    try {
      await fetch(`/api/decks/${id}`, { method: "DELETE" });
      router.refresh();
    } catch (error) {
      console.error(error);
      setIsDeleting(false);
    }
  }

  return (
    <Link 
      href={`/dashboard/${id}`}
      className="block p-6 rounded-xl border border-border/50 bg-surface hover:border-gold/50 transition-all group relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium text-slate-100 group-hover:text-gold transition-colors">{title}</h3>
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 text-xl leading-none"
          aria-label="Delete deck"
        >
          {isDeleting ? "..." : "×"}
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>{masteredCount} / {cardCount} {cardCount === 0 ? "" : "Studied"}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full bg-bg rounded-full overflow-hidden">
            {cardCount > 0 ? (
              <div 
                className="h-full bg-gold rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              />
            ) : (
              <div className="flex items-center justify-center h-full"> 
                <span className="text-[10px] text-slate-600 uppercase tracking-widest">Empty Deck</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {cardCount === 0 ? (
            <span className="text-xs text-red-400/60 font-medium">Ready for PDF upload</span>
          ) : dueTodayCount > 0 ? (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-500/10 text-amber-500">
              {dueTodayCount} due today
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-800/50 text-slate-500">
              All caught up
            </span>
          )}
          <span className="text-xs text-slate-500">
            {lastStudiedAt ? new Date(lastStudiedAt).toLocaleDateString() : "Never studied"}
          </span>
        </div>
      </div>
    </Link>
  );
}
