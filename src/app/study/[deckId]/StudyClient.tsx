"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { FlashCard } from "@/components/FlashCard";
import { RatingButtons } from "@/components/RatingButtons";
import { ProgressBar } from "@/components/ProgressBar";
import { StudyComplete } from "@/components/StudyComplete";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { LoadingMessage } from "@/components/LoadingMessage";
import { PageTransition } from "@/components/PageTransition";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ErrorState } from "@/components/ErrorState";

type StudyCard = {
  id: string;
  front: string;
  back: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  status: string;
};

export default function StudyClient() {
  const params = useParams();
  const deckId = params.deckId as string;
  
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionLogs, setSessionLogs] = useState<{ cardFront: string; quality: number }[]>([]);
  
  const [masteredThisSession, setMasteredThisSession] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [totalDue, setTotalDue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const res = await fetch(`/api/study/${deckId}`);
        const data = await res.json();
        if (data.cards) {
          setCards(data.cards);
          setTotalDue(data.cards.length);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCards();
  }, [deckId]);

  const handleFlip = useCallback(() => {
    if (!isFlipped && !isSubmitting) setIsFlipped(true);
  }, [isFlipped, isSubmitting]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip]);

  const handleRate = async (quality: number) => {
    if (!isFlipped || isSubmitting) return;

    setIsSubmitting(true);
    const currentCard = cards[currentIndex];

    try {
      const res = await fetch(`/api/study/${deckId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: currentCard.id,
          quality,
          currentStatus: currentCard.status,
          currentState: {
            easeFactor: currentCard.easeFactor,
            interval: currentCard.interval,
            repetitions: currentCard.repetitions,
          },
        }),
      });
      const { nextState } = await res.json();
      
      setSessionLogs(prev => [...prev, { cardFront: currentCard.front, quality }]);

      if (currentCard.status !== "mastered" && nextState.status === "mastered") {
        setMasteredThisSession((prev) => prev + 1);
      }

      setIsFlipped(false);
      
      setTimeout(() => {
        if (currentIndex < cards.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          setIsComplete(true);
        }
        setIsSubmitting(false);
      }, 300);

    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingMessage 
          messages={[
            "Picking up where you left off...",
            "Loading today's cards...",
            "Checking what's due..."
          ]} 
        />
      </div>
    );
  }

  if (cards.length === 0 && !isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorState 
          title="Couldn't load your cards"
          message="Check your connection and try again."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (isComplete || (totalDue === 0 && !isLoading)) {
    return (
      <main className="min-h-screen p-4 flex items-center justify-center">
        <StudyComplete 
          deckId={deckId} 
          reviewed={currentIndex + (isComplete ? 1 : 0)} 
          mastered={masteredThisSession} 
          sessionLogs={sessionLogs}
        />
      </main>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center p-4">
        <header className="w-full max-w-3xl mx-auto flex items-center justify-between py-4 md:py-6">
          <Link href={`/dashboard/${deckId}`} className="text-sm border-b border-transparent hover:border-gold text-secondary hover:text-gold transition-colors pb-0.5 inline-flex">
            ← Exit
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserButton />
          </div>
        </header>

        <main className="flex-1 w-full max-w-3xl mx-auto flex flex-col justify-center pb-20">
          <div className="mb-8 space-y-3">
            <div className="flex justify-between text-sm text-secondary font-medium">
              <span>Card {currentIndex + 1} of {totalDue}</span>
            </div>
            <ProgressBar current={currentIndex} total={totalDue} />
          </div>

          <FlashCard 
            front={currentCard.front} 
            back={currentCard.back} 
            isFlipped={isFlipped}
            onFlip={handleFlip}
          />

          <div className={`transition-all duration-300 ${isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
            <RatingButtons onRate={handleRate} disabled={isSubmitting || !isFlipped} />
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
