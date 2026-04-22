"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoadingMessage } from "./LoadingMessage";
import { motion, animate, useMotionValue, useTransform, useReducedMotion } from "framer-motion";

type SessionLog = { cardFront: string; quality: number };

function Counter({ value, delay = 0 }: { value: number; delay?: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const controls = animate(count, value, {
      duration: shouldReduceMotion ? 0 : 0.8,
      delay: shouldReduceMotion ? 0 : delay / 1000,
      ease: "easeOut",
    });
    return controls.stop;
  }, [value, count, delay, shouldReduceMotion]);

  return <motion.span>{rounded}</motion.span>;
}

export function StudyComplete({ 
  deckId, 
  reviewed, 
  mastered, 
  sessionLogs 
}: { 
  deckId: string; 
  reviewed: number; 
  mastered: number; 
  sessionLogs: SessionLog[];
}) {
  const [coachNote, setCoachNote] = useState<string | null>(null);
  const [isLoadingCoach, setIsLoadingCoach] = useState(true);
  const [providerIndex, setProviderIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [canRetryNext, setCanRetryNext] = useState(false);

  const fetchCoachNote = async (pIndex: number = 0) => {
    if (sessionLogs.length === 0) {
      setCoachNote("Take a moment to center yourself. Your next study session is a fresh start.");
      setIsLoadingCoach(false);
      return;
    }

    setIsLoadingCoach(true);
    setError(null);
    try {
      const res = await fetch(`/api/study/${deckId}/coach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionData: sessionLogs, providerIndex: pIndex }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 503 && data.nextIndex !== undefined) {
          setProviderIndex(data.nextIndex);
          setCanRetryNext(data.nextIndex !== null);
          throw new Error(data.error || "AI Engine Busy");
        }
        throw new Error(data.error || "Failed to fetch coach note");
      }

      if (data.feedback) {
        setCoachNote(data.feedback);
        setError(null);
      }
    } catch (err: any) {
      console.error("Failed to fetch coach note:", err);
      setError(err.message);
      // Only set generic fallback if we've exhausted retries or it's a fatal error
      if (!canRetryNext && pIndex > 0) {
        setCoachNote("You handled the material with clarity today. Focus on consistency to lock in these gains.");
      }
    } finally {
      setIsLoadingCoach(false);
    }
  };

  useEffect(() => {
    fetchCoachNote(0);
  }, [deckId, sessionLogs]);

  return (
    <div className="flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pt-10 pb-20">
      <div className="w-24 h-24 rounded-full bg-gold/10 border border-gold flex items-center justify-center mb-2">
        <svg className="w-10 h-10 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h2 className="text-4xl font-medium tracking-tight text-primary mb-3">Session Complete</h2>
        <p className="text-xl text-secondary font-light italic">Clarity achieved.</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="p-6 rounded-xl border border-border/50 bg-surface">
          <p className="text-sm text-secondary mb-2">Cards Reviewed</p>
          <p className="text-3xl font-medium text-primary">
            <Counter value={reviewed} />
          </p>
        </div>
        <div className="p-6 rounded-xl border border-gold/30 bg-gold/5 shadow-[0_0_20px_rgba(245,166,35,0.1)]">
          <p className="text-sm text-gold/80 mb-2">Mastered Today</p>
          <p className="text-3xl font-medium text-gold">
            <Counter value={mastered} delay={200} />
          </p>
        </div>
      </div>

      {(isLoadingCoach || coachNote || error) && (
        <div className="w-full p-6 rounded-xl border border-border/50 bg-surface/50 text-left relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-gold flex items-center gap-1.5">
              <span className="text-sm">✨</span> Coach
            </span>
            {error && !isLoadingCoach && (
              <span className="text-[10px] text-red-500 font-medium uppercase tracking-tight">AI Engine Busy</span>
            )}
          </div>
          
          {isLoadingCoach ? (
            <div className="py-4">
              <LoadingMessage 
                messages={[
                  "Reviewing your session...",
                  "Finding patterns...",
                  "Curating your results...",
                  "Writing your coaching note...",
                  "Brewing something useful..."
                ]} 
              />
            </div>
          ) : error ? (
            <div className="space-y-4 py-2">
              <p className="text-secondary text-sm italic leading-relaxed">
                The primary AI coach is currently reflecting. Would you like to try a backup engine for your evaluation?
              </p>
              <button
                onClick={() => fetchCoachNote(providerIndex)}
                className="w-full py-3 px-4 btn-kensho-3d-secondary flex items-center justify-center gap-2"
              >
                Retry Coach Evaluation {providerIndex > 0 && `(Backup ${providerIndex})`}
              </button>
            </div>
          ) : (
            <p className="text-primary text-sm leading-relaxed italic">
              "{coachNote}"
            </p>
          )}
        </div>
      )}

      <div className="pt-6">
        <Link
          href={`/dashboard/${deckId}`}
          className="inline-flex px-12 py-4 btn-kensho-3d"
        >
          Back to Deck
        </Link>
      </div>
    </div>
  );
}
