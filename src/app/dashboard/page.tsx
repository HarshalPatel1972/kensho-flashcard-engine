import { DeckCard } from "@/components/DeckCard";
import { db } from "@/db";
import { decks, cards, cardProgress, users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, sql, lte } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  try {
    await db.insert(users).values({ id: userId }).onConflictDoNothing();
  } catch (error) {
    console.error("Failed to upsert user. Database might be unreachable.", error);
  }

  const userDecks = await db
    .select()
    .from(decks)
    .where(eq(decks.userId, userId))
    .orderBy(decks.createdAt);

  const dueCountRows = await db
    .select({
      deckId: cards.deckId,
      dueCount: sql<number>`count(*)`.mapWith(Number),
    })
    .from(cardProgress)
    .innerJoin(cards, eq(cardProgress.cardId, cards.id))
    .where(
      and(
        eq(cardProgress.userId, userId),
        lte(cardProgress.dueDate, new Date())
      )
    )
    .groupBy(cards.deckId);

  const dueByDeck = Object.fromEntries(
    dueCountRows.map((row) => [row.deckId, row.dueCount])
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-medium tracking-tight">Your Decks</h1>
      </div>

      {userDecks.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-xl bg-surface/50">
          <p className="text-slate-400 mb-6">No decks yet. Upload a PDF to get started.</p>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center justify-center rounded-md bg-gold px-6 py-2.5 text-sm font-medium text-black hover:bg-gold-hover transition-colors"
          >
            Create your first deck
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userDecks.map((deck) => (
            <DeckCard
              key={deck.id}
              id={deck.id}
              title={deck.title}
              cardCount={deck.cardCount ?? 0}
              masteredCount={deck.masteredCount ?? 0}
              dueTodayCount={dueByDeck[deck.id] || 0}
              lastStudiedAt={deck.lastStudiedAt ? deck.lastStudiedAt.toISOString() : null}
            />
          ))}
        </div>
      )}

      {userDecks.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50">
          <Link
            href="/dashboard/new"
            className="flex items-center justify-center w-14 h-14 rounded-full bg-gold text-black shadow-lg hover:scale-105 active:scale-95 transition-transform hover:bg-gold-hover"
            aria-label="New Deck"
          >
            <span className="text-2xl font-light">+</span>
          </Link>
        </div>
      )}
    </div>
  );
}
