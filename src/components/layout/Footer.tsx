"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#050505] text-white pt-24 pb-12 px-6 relative overflow-hidden">
      {/* Background Watermark Branding */}
      <div className="absolute -bottom-12 left-0 w-full select-none pointer-events-none overflow-hidden opacity-[0.03]">
        <h2 className="text-[25vw] font-bold tracking-tighter leading-none whitespace-nowrap text-white">
          KENSHŌ
        </h2>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Section: High-Impact CTA */}
        <div className="mb-24 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="max-w-2xl">
            <h3 className="text-4xl md:text-6xl font-medium tracking-tight mb-6">
              Ready to master <br/>
              <span className="text-gold">your material?</span>
            </h3>
            <p className="text-lg text-white/50 font-light max-w-md">
              Join thousands of learners using AI-powered spaced repetition to see through the noise.
            </p>
          </div>
          <Link 
            href="/dashboard"
            className="group flex items-center gap-3 text-xl font-bold bg-white text-black px-8 py-4 rounded-full hover:bg-gold transition-all hover:scale-105 active:scale-95"
          >
            Start Learning
            <ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </Link>
        </div>

        {/* Middle Section: Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 pb-24 border-b border-white/10">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl overflow-hidden border border-gold/40">
                <img src="/favicon.svg" alt="Kenshō" className="w-full h-full object-cover invert" />
              </div>
              <span className="text-2xl font-bold tracking-tight">Kenshō</span>
            </div>
            <p className="text-sm text-white/40 leading-relaxed italic font-light">
              See through the noise. <br/>
              Master what matters.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gold">Platform</span>
            <Link href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors">Study Decks</Link>
            <Link href="/docs" className="text-sm text-white/60 hover:text-white transition-colors">Documentation</Link>
            <Link href="/docs#algorithm" className="text-sm text-white/60 hover:text-white transition-colors">The SM-2 Algorithm</Link>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gold">Connect</span>
            <Link href="https://github.com" target="_blank" className="text-sm text-white/60 hover:text-white transition-colors">GitHub</Link>
            <Link href="mailto:support@kensho.ai" className="text-sm text-white/60 hover:text-white transition-colors">Support</Link>
            <Link href="/docs#privacy" className="text-sm text-white/60 hover:text-white transition-colors">Privacy Policy</Link>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gold">Challenge</span>
            <p className="text-xs text-white/40 leading-relaxed font-light">
              Built for the <br/>
              <span className="text-white/80 font-medium">Cuemath AI Builder Challenge</span> <br/>
              by Harshal Patel.
            </p>
          </div>
        </div>

        {/* Bottom Section: Technical Details */}
        <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-medium">
            © {currentYear} Kenshō Flashcard Engine. All rights reserved.
          </p>
          <div className="flex items-center gap-8 opacity-30">
            <span className="text-[9px] uppercase tracking-[0.3em]">AI-Driven Spaced Repetition</span>
            <div className="w-1 h-1 rounded-full bg-white/50" />
            <span className="text-[9px] uppercase tracking-[0.3em]">Built with Next.js & Go</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
