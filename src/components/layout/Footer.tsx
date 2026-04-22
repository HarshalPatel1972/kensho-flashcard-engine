"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-12 px-6 mt-12 border-t border-border/40 bg-surface/5 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        
        {/* Branding */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg overflow-hidden border border-gold/20">
              <img src="/favicon.svg" alt="Kenshō" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">Kenshō</span>
          </div>
          <p className="text-sm text-secondary font-light">See through the noise.</p>
        </div>

        {/* Credit */}
        <div className="flex-1 max-w-md">
          <p className="text-xs md:text-sm text-secondary leading-relaxed font-light">
            Built for the <span className="text-gold font-medium">Cuemath AI Builder Challenge</span> by <span className="text-primary font-medium">Harshal Patel</span>. 
            <br className="hidden md:block" />
            Optimized for deep focus and efficient learning.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-secondary mb-1">Product</span>
            <Link href="/dashboard" className="text-sm text-secondary hover:text-gold transition-colors font-medium">Dashboard</Link>
            <Link href="/docs" className="text-sm text-secondary hover:text-gold transition-colors font-medium">Documentation</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-secondary mb-1">Company</span>
            <Link href="/docs#privacy" className="text-sm text-secondary hover:text-gold transition-colors font-medium">Privacy</Link>
            <Link href="mailto:support@kensho.ai" className="text-sm text-secondary hover:text-gold transition-colors font-medium">Support</Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-border/20 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-secondary/60 uppercase tracking-widest font-medium">
        <p>© {currentYear} Kenshō Flashcard Engine. All rights reserved.</p>
        <div className="flex gap-6">
          <span>AI Powered</span>
          <span>Spaced Repetition</span>
          <span>Tactile Feedback</span>
        </div>
      </div>
    </footer>
  );
}
