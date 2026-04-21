"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  // Typewriter effect state
  const fullSlogan = "See through the noise.";
  const [sloganText, setSloganText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);

  useEffect(() => {
    if (isLoaded && userId) {
      router.push("/dashboard");
    }
  }, [isLoaded, userId, router]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (prefersReducedMotion) {
      setSloganText(fullSlogan);
      setCursorVisible(false);
      return;
    }

    const startTypewriter = () => {
      setCursorVisible(true);
      let currentIndex = 0;
      
      const typeInterval = setInterval(() => {
        if (currentIndex < fullSlogan.length) {
          // React state updates batches, we use functional update to be safe
          // or just standard slice
          setSloganText(fullSlogan.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          
          let blinkCount = 0;
          const blinkInterval = setInterval(() => {
            setCursorVisible((v) => !v);
            blinkCount++;
            if (blinkCount >= 6) { // 3 full blinks
              clearInterval(blinkInterval);
              setCursorVisible(false);
            }
          }, 400); // blink speed
        }
      }, 45); // typing speed
    };

    // start after 600ms (matching the delay specification)
    timeout = setTimeout(startTypewriter, 600);

    return () => clearTimeout(timeout);
  }, [prefersReducedMotion]);

  const easing: [number, number, number, number] = [0.23, 1, 0.32, 1];
  const variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <PageTransition>
      <main className="relative flex flex-col items-center justify-center min-h-screen p-6 text-center overflow-hidden">
        <nav className="absolute top-0 right-0 p-6 z-20">
          <Link 
            href="/docs" 
            className="text-sm font-medium text-secondary hover:text-gold transition-colors border-b border-transparent hover:border-gold pb-0.5"
          >
            Docs
          </Link>
        </nav>

        {/* Background subtle texture */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(245, 166, 35, 0.04) 0%, transparent 70%)"
          }}
        />

        <div className="max-w-2xl space-y-8 relative z-10">
          <div className="space-y-3">
            <motion.h1 
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : "hidden"}
              animate="visible"
              variants={variants}
              transition={{ delay: 0, duration: 0.6, ease: easing }}
              className="text-6xl md:text-8xl font-medium tracking-tight text-primary"
            >
              Kenshō
            </motion.h1>
            <motion.p 
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : "hidden"}
              animate="visible"
              variants={variants}
              transition={{ delay: 0.2, duration: 0.6, ease: easing }}
              className="text-xl md:text-2xl font-light text-secondary tracking-wide italic min-h-[36px]"
            >
              {prefersReducedMotion ? fullSlogan : `${sloganText}${cursorVisible ? "|" : " "}`}
            </motion.p>
          </div>
          
          <motion.p 
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : "hidden"}
            animate="visible"
            variants={variants}
            transition={{ delay: 0.4, duration: 0.5, ease: easing }}
            className="text-lg md:text-xl text-primary max-w-lg mx-auto font-light leading-relaxed"
          >
            Turn any PDF into a smart study deck. 
            <br className="hidden md:block"/>
            Review what matters, when it matters.
          </motion.p>

          <motion.div 
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : "hidden"}
            animate="visible"
            variants={variants}
            transition={{ delay: 0.6, duration: 0.5, ease: easing }}
            className="pt-8"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-10 py-4 text-xl font-bold text-black transition-all hover:scale-105 active:scale-95 shadow-gold-glow border-2 border-transparent focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:outline-none"
            >
              Start learning 
              <span className="btn-arrow">
                <ArrowRight size={22} />
              </span>
            </Link>
          </motion.div>
        </div>
      </main>
    </PageTransition>
  );
}
