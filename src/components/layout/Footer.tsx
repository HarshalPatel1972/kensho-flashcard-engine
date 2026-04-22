"use client";

import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#050505] text-white py-16 px-6 relative overflow-hidden">
      {/* Background Watermark Branding */}
      <div className="absolute -bottom-8 left-0 w-full select-none pointer-events-none overflow-hidden opacity-[0.03]">
        <h2 className="text-[20vw] font-bold tracking-tighter leading-none whitespace-nowrap text-white">
          KENSHŌ
        </h2>
      </div>

      <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
        
        {/* Branding */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-gold/40">
              <img src="/favicon.svg" alt="Kenshō" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Kenshō</span>
          </div>
          <p className="text-sm text-white/40 font-light">See through the noise.</p>
        </div>

        {/* Credit */}
        <div className="flex-1 max-w-md">
          <p className="text-xs md:text-sm text-white/50 leading-relaxed font-light">
            Built for the <span className="text-gold font-medium">Cuemath AI Builder Challenge</span> by <span className="text-white font-medium">Harshal Patel</span>. 
            <br className="hidden md:block" />
            Optimized for deep focus and efficient learning.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-x-12 gap-y-6">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gold/60">Platform</span>
            <Link href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors font-medium">Dashboard</Link>
            <Link href="/docs" className="text-sm text-white/60 hover:text-white transition-colors font-medium">Documentation</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gold/60">Help</span>
            <Link href="/docs#privacy" className="text-sm text-white/60 hover:text-white transition-colors font-medium">Privacy</Link>
            <Link href="mailto:support@kensho.ai" className="text-sm text-white/60 hover:text-white transition-colors font-medium">Support</Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-white/30 uppercase tracking-[0.3em] font-medium relative z-10">
        <p>© {currentYear} Kenshō Flashcard Engine.</p>
        <div className="flex gap-8">
          <span>AI Spaced Repetition</span>
          <span>Tactile Learning</span>
        </div>
      </div>
    </footer>
  );
}
