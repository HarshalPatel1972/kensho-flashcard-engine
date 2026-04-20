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
          className="block p-6 rounded-xl border border-border/50 bg-surface hover:border-gold/50 transition-all relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-medium text-slate-100 group-hover:text-gold transition-colors pr-8">{title}</h3>
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
                {lastStudiedAt ? new Date(lastStudiedAt).toLocaleDateString() : "Never"}
              </span>
            </div>
          </div>
        </Link>
        
        <div className="absolute top-4 right-4" ref={menuRef}>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
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
                className="absolute right-0 mt-1 w-40 bg-surface border border-border shadow-2xl rounded-lg py-1 z-10"
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
              <h4 className="text-xl font-medium text-white mb-2">Delete this deck?</h4>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                This will permanently delete <strong className="text-slate-200">{title}</strong> and all <strong className="text-slate-200">{cardCount}</strong> cards. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
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
