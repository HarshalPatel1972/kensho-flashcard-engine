"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

type LoadingMessageProps = {
  messages: string[];
  intervalMs?: number;
  quote?: boolean;
};

const QUOTES = [
  "The illusion of knowing is the enemy of learning. — Feynman",
  "Memory is not recording. It is rebuilding. — Schacter",
  "Struggle is not a sign of failure. It is the feeling of learning. — Bjork",
  "Spaced repetition is not a trick. It is how the brain was designed. — Ebbinghaus",
  "The more difficulty, the more glory. — Cicero",
  "An investment in knowledge pays the best interest. — Franklin"
];

export function LoadingMessage({ messages, intervalMs = 3000, quote = false }: LoadingMessageProps) {
  const [index, setIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [secondsPassed, setSecondsPassed] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [messages, intervalMs]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsPassed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!quote) return;
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [quote]);

  return (
    <div className="flex flex-col items-center space-y-6 text-center max-w-sm mx-auto">
      <div className="flex flex-col items-center space-y-4">
        <svg className="animate-spin h-8 w-8 text-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div className="relative h-6 w-64 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={messages[index]}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.1 }}
              className="text-slate-300 font-medium tracking-wide"
            >
              {messages[index]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {quote && secondsPassed > 15 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="pt-8 border-t border-border/30"
        >
          <AnimatePresence mode="wait">
            <motion.p 
              key={QUOTES[quoteIndex]}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-xs text-slate-500 italic leading-relaxed"
            >
              "{QUOTES[quoteIndex]}"
            </motion.p>
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
