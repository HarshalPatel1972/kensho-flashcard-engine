"use client";

import Link from "next/link";
import { PageTransition } from "@/components/PageTransition";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

export default function DocsPage() {
  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-6 py-20">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-bold text-secondary hover:text-gold transition-colors mb-12 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <div className="space-y-16">
          <header className="space-y-4 pt-4">
            <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-primary mb-8">Documentation</h1>
            <p className="text-lg text-secondary font-light leading-relaxed">
              Master your study material with spaced repetition and AI-driven automation.
            </p>
          </header>

          <main className="space-y-20 pb-24">
            {/* SECTION 1 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold uppercase tracking-widest text-gold text-left">
                01. What is Kenshō?
              </h2>
              <div className="text-lg leading-[1.8] font-light text-primary/90 space-y-4">
                <p>
                  Kenshō is a spaced repetition flashcard engine designed to turn dense study 
                  material into an intelligent review system. By bridging the gap between passive 
                  reading and active recall, Kenshō helps you build durable long-term memories.
                </p>
                <p>
                  Upload a PDF, select the specific pages you want to study, and Kenshō generates 
                  high-quality flashcards powered by advanced AI models. Then, it schedules those 
                  cards based on how well you know each one, ensuring you only study what you're 
                  about to forget.
                </p>
              </div>
            </section>

            {/* SECTION 2 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold uppercase tracking-widest text-gold text-right md:text-left">
                02. How to get started
              </h2>
              <div className="text-lg leading-[1.8] font-light text-primary/90 space-y-6">
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li><span className="font-medium text-primary">Sign in</span> with your account to sync progress across devices.</li>
                  <li>Click the <span className="text-gold">+</span> button to create a new study deck.</li>
                  <li>Provide a descriptive title and optional context for the AI.</li>
                  <li>Upload a PDF of your lecture notes, textbook, or research paper.</li>
                  <li>Select exactly which pages you want to turn into flashcards.</li>
                  <li>Click <span className="italic">"Create Flashcards"</span> and wait for the AI generation cycle.</li>
                  <li>Click <span className="font-bold border-b border-gold uppercase text-xs tracking-widest ml-1">Study Now</span> to begin your first session.</li>
                </ol>
              </div>
            </section>

            {/* SECTION 3 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold uppercase tracking-widest text-gold">
                03. The Study Session
              </h2>
              <div className="text-lg leading-[1.8] font-light text-primary/90 space-y-4">
                <p>
                  Each session presents only the cards that are due for review today. 
                  After seeing the answer, rate your performance honestly:
                </p>
                <ul className="space-y-4 pl-4">
                  <li>
                    <strong className="text-red-500">Again (1):</strong> Total failure. You'll see the card again very soon.
                  </li>
                  <li>
                    <strong className="text-orange-500">Hard (2):</strong> You got it right after a struggle. Shorter interval.
                  </li>
                  <li>
                    <strong className="text-green-500">Good (3):</strong> You recalled it comfortably. Standard interval.
                  </li>
                  <li>
                    <strong className="text-cyan-500">Easy (4):</strong> You knew it instantly. Significant interval boost.
                  </li>
                </ul>
                <div className="bg-surface/50 p-6 rounded-xl border border-border/40 mt-8">
                  <p className="text-sm uppercase tracking-widest font-bold text-secondary mb-2">Expert Shortcuts</p>
                  <p className="text-base italic">"Press 1, 2, 3, or 4 to rate. Press Space to flip the card. Smooth as a master."</p>
                </div>
              </div>
            </section>

            {/* SECTION 4 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold uppercase tracking-widest text-gold text-right md:text-left">
                04. The Algorithm
              </h2>
              <div className="text-lg leading-[1.8] font-light text-primary/90 space-y-4">
                <p>
                  Kenshō uses <span className="border-b border-white/20">SM-2</span>, the standard spaced repetition algorithm 
                  mathematically optimized for human memory. 
                </p>
                <p>
                  Every card has an <span className="font-medium text-gold italic">Ease Factor</span> and an 
                  <span className="font-medium text-gold italic">Interval</span>. Difficult cards appear more frequently, 
                  while mastered cards spread out into months or years. This is scientifically proven to 
                  be 10x more effective than passive re-reading or highlighted notes.
                </p>
              </div>
            </section>

            {/* SECTION 5 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold uppercase tracking-widest text-gold text-left">
                05. PDF Guidelines
              </h2>
              <div className="text-lg leading-[1.8] font-light text-primary/90 space-y-4">
                <p>To get the highest quality flashcards, follow these AI-friendly rules:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="p-4 rounded-xl border border-border/30 bg-surface/20">
                    <p className="font-bold text-sm mb-2">1–4 Pages</p>
                    <p className="text-sm text-secondary">The full content of every page is processed. Best for targeted technical notes.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border/30 bg-surface/20">
                    <p className="font-bold text-sm mb-2">5–20 Pages</p>
                    <p className="text-sm text-secondary">Kenshō samples the core lines from each page to stay within AI efficiency limits.</p>
                  </div>
                </div>
                <p className="text-base text-secondary pt-4">
                  <span className="text-gold font-bold">Pro-tip:</span> Use text-based PDFs. Scanned images (photographs of paper) 
                  may result in empty extraction unless they have an invisible OCR text layer.
                </p>
              </div>
            </section>

            {/* SECTION 7 */}
            <section id="cookies" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl font-bold uppercase tracking-widest text-gold text-right md:text-left">
                07. Privacy & Cookies
              </h2>
              <div className="text-lg leading-[1.8] font-light text-primary/90 space-y-4">
                <p>
                  Kenshō is built with a "Privacy First" philosophy. We use cookies and local storage only 
                  to ensure the technical reliability and personalization of your experience.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  <div className="p-4 rounded-xl border border-border/30 bg-surface/20">
                    <p className="font-bold text-xs uppercase tracking-widest text-gold mb-2">Essential</p>
                    <p className="text-sm text-secondary">Securing your account and keeping you logged in via Clerk.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border/30 bg-surface/20">
                    <p className="font-bold text-xs uppercase tracking-widest text-gold mb-2">Preferences</p>
                    <p className="text-sm text-secondary">Remembering your 3D theme, haptic sound levels, and font sizes.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border/30 bg-surface/20">
                    <p className="font-bold text-xs uppercase tracking-widest text-gold mb-2">Operation</p>
                    <p className="text-sm text-secondary">Managing real-time AI states and deck synchronization.</p>
                  </div>
                </div>
                <p className="text-base text-secondary pt-4">
                  We do not use 3rd-party advertising or sell your behavioral data. Your study sessions 
                  are your own.
                </p>
              </div>
            </section>
          </main>
        </div>
      </div>
    </PageTransition>
  );
}
