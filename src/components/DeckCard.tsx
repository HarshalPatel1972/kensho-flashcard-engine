"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

type DeckCardProps = {
  id: string;
  title: string;
  cardCount: number;
  masteredCount: number;
  dueTodayCount: number;
  lastStudiedAt: string | null;
  onDelete?: () => void;
};

export function DeckCard({ id, title, cardCount, masteredCount, dueTodayCount, lastStudiedAt, onDelete }: DeckCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const isEmpty = cardCount === 0;
  const progress = cardCount > 0 ? (masteredCount / cardCount) * 100 : 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") setShowModal(false);
    }
    if (showModal) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showModal]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/decks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      onDelete?.();
    } catch (error) {
      console.error(error);
      alert("Failed to delete deck. Try again.");
    } finally {
      setIsDeleting(false);
      setShowModal(false);
    }
  };

  return (
    <>
      <div className="group relative">
        <Link 
          href={`/dashboard/${id}`}
          className={`block p-6 rounded-2xl border transition-all relative overflow-hidden ${
            isEmpty 
              ? "bg-surface/20 border-border/40 border-dashed hover:border-gold/40" 
              : "bg-surface border-border/50 hover:border-gold/50 shadow-sm"
          }`}
        >
          <div className="flex justify-between items-start mb-6">
            <h3 className={`text-xl font-medium transition-colors pr-8 ${isEmpty ? "text-secondary group-hover:text-gold" : "text-primary group-hover:text-gold"}`}>
              {title}
            </h3>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] uppercase tracking-widest font-bold">
                <span className={isEmpty ? "text-secondary" : "text-secondary"}>
                  {isEmpty ? "0 Cards" : `${masteredCount} / ${cardCount} Mastered`}
                </span>
                {!isEmpty && <span className="text-gold">{Math.round(progress)}%</span>}
              </div>
              
              <div className={`h-1.5 w-full rounded-full overflow-hidden ${isEmpty ? "bg-bg/40 border border-dashed border-border/20" : "bg-bg"}`}>
                {!isEmpty && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gold rounded-full"
                    transition={{ duration: 1, ease: "circOut" }}
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {isEmpty ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold/60 group-hover:text-gold transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Add PDF to start
                </span>
              ) : (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter ${
                  dueTodayCount > 0 
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                  : "bg-slate-800/50 text-secondary border border-slate-700/50"
                }`}>
                  {dueTodayCount > 0 ? `${dueTodayCount} Due Now` : "Settled"}
                </span>
              )}
              
              <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">
                {isEmpty ? "Empty" : lastStudiedAt ? new Date(lastStudiedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "New"}
              </span>
            </div>
          </div>
        </Link>
        
        <div className="absolute top-5 right-5" ref={menuRef}>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-2 text-secondary hover:text-primary transition-colors rounded-lg hover:bg-white/5"
            aria-label="More options"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div 
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 mt-1 w-40 bg-surface border border-border shadow-2xl rounded-xl py-1 z-10"
              >
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowModal(true); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Delete deck
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black backdrop-blur-sm" 
              onClick={() => setShowModal(false)} 
            />
            <motion.div 
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-sm bg-surface border border-border shadow-2xl rounded-2xl p-6"
            >
              <h4 className="text-xl font-medium text-primary mb-2">Delete this deck?</h4>
              <p className="text-sm text-secondary mb-6 leading-relaxed">
                This will permanently delete <strong className="text-primary">{title}</strong> and all <strong className="text-primary">{cardCount}</strong> cards. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-primary hover:bg-white/5 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-primary text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
