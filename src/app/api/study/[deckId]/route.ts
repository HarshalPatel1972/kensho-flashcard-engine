import { db } from "@/db";
import { cards, cardProgress } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, lte, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { deckId: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dueCards = await db
      .select({
        id: cards.id,
        front: cards.front,
        back: cards.back,
        progressId: cardProgress.id,
        easeFactor: cardProgress.easeFactor,
        interval: cardProgress.interval,
        repetitions: cardProgress.repetitions,
        dueDate: cardProgress.dueDate,
        status: cardProgress.status,
      })
      .from(cards)
      .innerJoin(
        cardProgress,
        and(eq(cards.id, cardProgress.cardId), eq(cardProgress.userId, userId))
      )
      .where(
        and(
          eq(cards.deckId, params.deckId),
          lte(cardProgress.dueDate, new Date())
        )
      )
      .orderBy(asc(cardProgress.dueDate))
      .limit(20);

    return NextResponse.json({ cards: dueCards });
  } catch (error) {
    console.error("Error fetching study cards:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
