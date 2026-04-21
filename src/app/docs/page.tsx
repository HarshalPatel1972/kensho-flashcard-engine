"use client";

import Link from "next/link";
import { PageTransition } from "@/components/PageTransition";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

export default function DocsPage() {
  const { isSignedIn } = useAuth();

  return (
    <PageTransition>
      <div className="min-h-screen bg-bg text-primary selection:bg-gold selection:text-black">
        <div className="max-w-[720px] mx-auto px-6 py-16 md:py-24 space-y-16">
          
          <header className="space-y-4">
            <Link 
              href={isSignedIn ? "/dashboard" : "/"} 
              className="inline-flex items-center text-sm text-secondary hover:text-gold transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              {isSignedIn ? "Back to Dashboard" : "Back to Home"}
            </Link>
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight mt-8">
              Kenshō Documentation
            </h1>
            <p className="text-lg text-secondary font-light leading-relaxed">
              Master your study material with spaced repetition and AI-driven automation.
            </p>
          </header>

          <main className="space-y-20 pb-24">
            
            {/* SECTION 1 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold uppercase tracking-widest text-gold">
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
              <h2 className="text-xl font-bold uppercase tracking-widest text-gold">
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

            {/* SECTION 6 */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold uppercase tracking-widest text-gold text-right md:text-left">
                06. Master Learner Tips
              </h2>
              <div className="text-lg leading-[1.8] font-light text-primary/90 space-y-6">
                <ul className="list-disc list-inside space-y-4 pl-4">
                  <li><span className="font-medium text-primary">Be Consistent:</span> Study for 5 minutes every single day. The algorithm works best when you don't break the chain.</li>
                  <li><span className="font-medium text-primary">Be Honest:</span> Inflating your ratings to feel "better" only hurts your long-term retention. If you struggled, hit Hard.</li>
                  <li><span className="font-medium text-primary">Check "Weak Cards":</span> Before studying, glance at the cards marked "Needs Work" on your deck page.</li>
                  <li><span className="font-medium text-primary">The AI Coach:</span> Read the coaching note after each session. It identifies patterns in your mistakes that you might not see yourself.</li>
                </ul>
              </div>
            </section>

          </main>

          <footer className="pt-16 border-t border-border/30 text-center">
            <Link
              href={isSignedIn ? "/dashboard" : "/"}
              className="inline-flex items-center justify-center rounded-xl bg-gold px-10 py-4 text-xl font-bold text-black transition-all hover:bg-gold-hover hover:scale-105 active:scale-95 shadow-gold-glow"
            >
              {isSignedIn ? "Back to Dashboard" : "Back to Home"}
            </Link>
          </footer>

        </div>
      </div>
    </PageTransition>
  );
}
