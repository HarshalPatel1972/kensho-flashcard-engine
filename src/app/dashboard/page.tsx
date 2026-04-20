import { db } from "@/db";
import { decks, cards, cardProgress, users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, sql, lte, or, ilike, exists } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardSearch } from "@/components/DashboardSearch";
import { DeckGrid } from "@/components/DeckGrid";
import { PageTransition } from "@/components/PageTransition";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const queryParams = await searchParams;
  const q = queryParams.q;
  const searchTerm = q ? `%${q}%` : null;

  try {
    await db.insert(users).values({ id: userId }).onConflictDoNothing();
  } catch (error) {
    console.error("Failed to upsert user. Database might be unreachable.", error);
  }

  let userDecks: any[] = [];
  let dueByDeck: Record<string, number> = {};
  let dbError = null;

  try {
    const decksResult = await db
      .select({
        id: decks.id,
        title: decks.title,
        description: decks.description,
        lastStudiedAt: decks.lastStudiedAt,
        createdAt: decks.createdAt,
        cardCount: sql<number>`count(distinct ${cards.id})`.mapWith(Number),
        masteredCount: sql<number>`count(distinct case when ${cardProgress.lastReviewedAt} is not null then ${cards.id} end)`.mapWith(Number),
      })
      .from(decks)
      .leftJoin(cards, eq(decks.id, cards.deckId))
      .leftJoin(cardProgress, and(eq(cards.id, cardProgress.cardId), eq(cardProgress.userId, userId)))
      .where(
        and(
          eq(decks.userId, userId),
          searchTerm 
            ? or(
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
            : undefined
        )
      )
      .groupBy(decks.id, decks.title, decks.description, decks.lastStudiedAt, decks.createdAt)
      .orderBy(decks.createdAt);
      
    userDecks = decksResult;

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

    dueByDeck = Object.fromEntries(
      dueCountRows.map((row) => [row.deckId, row.dueCount])
    );
  } catch (error: any) {
    console.error("Database Error:", error);
    dbError = error.message;
  }

  if (dbError) {
    return (
      <div className="p-8 bg-red-500/10 border border-red-500/50 rounded-xl max-w-2xl mx-auto mt-20 text-center">
        <h2 className="text-xl font-bold text-red-500 mb-2">Database Connection Failed</h2>
        <p className="text-sm text-red-400 font-mono mb-4 text-left p-4 bg-red-950/30 rounded">{dbError}</p>
        <p className="text-primary">It looks like the Neon database connection failed. Please ensure you visited <strong className="text-primary">/api/migrate</strong> to create the tables, and verify your <strong>DATABASE_URL</strong> in Vercel.</p>
        <p className="text-xs text-secondary mt-4">Current URL Prefix: {process.env.DATABASE_URL?.substring(0, 15) || "UNDEFINED"}</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-medium tracking-tight">Your Decks</h1>
          <DashboardSearch />
        </div>

        {userDecks.length === 0 && !q ? (
          <div className="text-center py-20 border border-dashed border-border rounded-xl bg-surface/50">
            <p className="text-secondary mb-6">
              No decks yet. Upload a PDF to get started.
            </p>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center justify-center rounded-md bg-gold px-6 py-2.5 text-sm font-medium text-black hover:bg-gold-hover transition-colors"
            >
              Create your first deck
            </Link>
          </div>
        ) : (
          <DeckGrid 
            initialDecks={userDecks.map(deck => ({
              id: deck.id,
              title: deck.title,
              cardCount: deck.cardCount ?? 0,
              masteredCount: deck.masteredCount ?? 0,
              dueTodayCount: dueByDeck[deck.id] || 0,
              lastStudiedAt: deck.lastStudiedAt ? deck.lastStudiedAt.toISOString() : null,
            }))} 
          />
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
    </PageTransition>
  );
}
