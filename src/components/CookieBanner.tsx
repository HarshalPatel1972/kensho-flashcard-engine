"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useKenshoSounds } from "@/hooks/use-kensho-sounds";

const STORAGE_KEY = "kensho-cookies-accepted";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const { playClick } = useKenshoSounds();

  useEffect(() => {
    // Check if user has already accepted
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      // Delay entrance for better feel
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    playClick();
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-[100] w-[320px] md:w-[380px]"
        >
          <div className="relative bg-surface/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Subtle Gold Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
            
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-primary/90">
                This website uses cookies and technical save-data to enhance your 3D experience 
                and remember your preferences. To find out more, view our{" "}
                <Link 
                  href="/docs#cookies" 
                  className="text-gold hover:underline font-medium"
                  onClick={() => playClick()}
                >
                  Cookie Policy
                </Link>.
              </p>
              
              <div className="pt-2">
                <button
                  onClick={handleAccept}
                  className="w-full btn-kensho-3d py-3 text-sm"
                >
                  I agree
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
