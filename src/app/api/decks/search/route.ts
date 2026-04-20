import { db } from "@/db";
import { decks, cards } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, or, ilike, and, exists } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q) {
      // If no query, normally we wouldn't use this endpoint, 
      // but let's return all user's decks as a fallback.
      const allDecks = await db.select().from(decks).where(eq(decks.userId, userId));
      return NextResponse.json(allDecks);
    }

    const searchTerm = `%${q}%`;

    // Strategy: Select decks where the title matches OR a card front in that deck matches
    const results = await db
      .select({
        id: decks.id,
        title: decks.title,
        description: decks.description,
        cardCount: decks.cardCount,
        masteredCount: decks.masteredCount,
        createdAt: decks.createdAt,
        lastStudiedAt: decks.lastStudiedAt,
      })
      .from(decks)
      .where(
        and(
          eq(decks.userId, userId),
          or(
            ilike(decks.title, searchTerm),
            exists(
              db.select()
                .from(cards)
                .where(
                  and(
                    eq(cards.deckId, decks.id),
                    ilike(cards.front, searchTerm)
                  )
                )
            )
          )
        )
      )
      .orderBy(decks.createdAt);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
