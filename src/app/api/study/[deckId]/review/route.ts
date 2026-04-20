import { db } from "@/db";
import { cardProgress, decks } from "@/db/schema";
import { calculateNextReview, CardProgressState } from "@/lib/sm2";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ deckId: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const p = await params;
    const deckId = p.deckId;

    const body = await req.json();
    const { cardId, quality, currentState, currentStatus } = body; 

    const stateToCalculate: CardProgressState = {
      easeFactor: currentState.easeFactor ?? 2.5,
      interval: currentState.interval ?? 1,
      repetitions: currentState.repetitions ?? 0,
    };

    const nextState = calculateNextReview(stateToCalculate, quality);

    await db
      .update(cardProgress)
      .set({
        easeFactor: nextState.easeFactor,
        interval: nextState.interval,
        repetitions: nextState.repetitions,
        dueDate: nextState.dueDate,
        status: nextState.status,
        lastReviewedAt: new Date(),
      })
      .where(and(eq(cardProgress.cardId, cardId), eq(cardProgress.userId, userId)));

    const [deck] = await db.select({ masteredCount: decks.masteredCount }).from(decks).where(eq(decks.id, deckId));
    
    // Only increment mastered count if this specific transition happened: not-mastered -> mastered
    let newMasteredCount = deck?.masteredCount ?? 0;
    if (currentStatus !== "mastered" && nextState.status === "mastered") {
      newMasteredCount++;
    }

    await db
      .update(decks)
      .set({ lastStudiedAt: new Date(), masteredCount: newMasteredCount })
      .where(eq(decks.id, deckId));

    return NextResponse.json({ success: true, nextState });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
