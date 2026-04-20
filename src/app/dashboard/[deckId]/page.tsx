import { db } from "@/db";
import { decks, cards, cardProgress } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, asc } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageTransition } from "@/components/PageTransition";
import { WeakCards } from "@/components/WeakCards";
import { DeckDetailUpload } from "@/components/DeckDetailUpload";
import { DeckTitle } from "@/components/DeckTitle";

export const dynamic = "force-dynamic";

export default async function DeckOverviewPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const p = await params;
  const deckId = p.deckId;

  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)));

  if (!deck) notFound();

  const deckCards = await db
    .select({
      id: cards.id,
      front: cards.front,
      back: cards.back,
      status: cardProgress.status,
      dueDate: cardProgress.dueDate,
      easeFactor: cardProgress.easeFactor,
      repetitions: cardProgress.repetitions,
    })
    .from(cards)
    .leftJoin(
      cardProgress,
      and(
        eq(cards.id, cardProgress.cardId),
        eq(cardProgress.userId, userId)
      )
    )
    .where(eq(cards.deckId, deckId))
    .orderBy(asc(cards.createdAt));

  const totalCards = deckCards.length;
  const isEmpty = totalCards === 0;

  const dueTodayCount = deckCards.filter(
    (c) => c.dueDate && c.dueDate <= new Date()
  ).length;

  const masteredCount = deckCards.filter((c) => c.status === "mastered").length;
  const avgEase =
    totalCards > 0
      ? deckCards.reduce((acc, c) => acc + (c.easeFactor ?? 2.5), 0) / totalCards
      : 2.5;

  const weakCards = deckCards
    .filter((c) => (c.easeFactor ?? 2.5) < 2.0 && c.status !== "mastered")
    .slice(0, 5);

  return (
    <PageTransition>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div>
          <Link href="/dashboard" className="text-sm border-b border-transparent hover:border-gold text-secondary hover:text-gold transition-colors pb-0.5 inline-flex mb-4">
            ← Back to Decks
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <DeckTitle deckId={deckId} initialTitle={deck.title} />
              {deck.description && (
                <p className="text-secondary mt-2 line-clamp-2">{deck.description}</p>
              )}
            </div>
            {!isEmpty && (
              <div>
                <Link
                  href={`/study/${deckId}`}
                  className={`inline-flex items-center justify-center rounded-md px-8 py-3 text-sm font-medium transition-colors ${
                    dueTodayCount > 0
                      ? "bg-gold text-black hover:bg-gold-hover shadow-lg shadow-gold/20"
                      : "bg-surface border border-border text-primary hover:bg-bg opacity-50 cursor-not-allowed pointer-events-none"
                  }`}
                  aria-disabled={dueTodayCount === 0}
                >
                  {dueTodayCount > 0 ? "Study Now" : "No cards due"}
                </Link>
              </div>
            )}
          </div>
        </div>

        {isEmpty ? (
          <div className="py-12 px-6 rounded-2xl border border-border/40 bg-surface/30 backdrop-blur-sm">
            <div className="max-w-xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-medium text-primary">Fill this deck</h2>
                <p className="text-secondary">Upload a PDF to extract smart flashcards and start your session.</p>
              </div>
              <DeckDetailUpload deckId={deckId} />
              <div className="pt-4 flex items-center justify-center gap-6 opacity-30 grayscale saturate-0">
                <span className="text-[10px] uppercase tracking-widest font-bold text-secondary">PDF Reader</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-secondary">AI Extraction</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-secondary">Flashcards</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Cards", value: totalCards },
                { label: "Mastered", value: masteredCount },
                { label: "Due Today", value: dueTodayCount, highlight: dueTodayCount > 0 },
                { label: "Avg Ease", value: avgEase.toFixed(2) },
              ].map((stat, i) => (
                <div key={i} className={`p-4 rounded-xl border ${stat.highlight ? "border-gold/30 bg-gold/5" : "border-border/50 bg-surface"}`}>
                  <p className="text-sm text-secondary mb-1">{stat.label}</p>
                  <p className={`text-2xl font-medium ${stat.highlight ? "text-gold" : "text-primary"}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {weakCards.length > 0 && <WeakCards cards={weakCards} />}

            <div className="overflow-x-auto bg-surface rounded-xl border border-border/50 shadow-2xl shadow-black/20">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-bg/50">
                    <th className="py-3 px-6 text-sm font-medium text-secondary w-1/3">Front</th>
                    <th className="py-3 px-6 text-sm font-medium text-secondary w-1/3">Back</th>
                    <th className="py-3 px-6 text-sm font-medium text-secondary">Status</th>
                    <th className="py-3 px-6 text-sm font-medium text-secondary text-right">Next Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {deckCards.map((card) => (
                    <tr key={card.id} className="hover:bg-bg/40 transition-colors">
                      <td className="py-4 px-6 text-sm text-primary align-top">
                        <div className="line-clamp-2">{card.front}</div>
                      </td>
                      <td className="py-4 px-6 text-sm text-secondary align-top">
                        <div className="line-clamp-2">{card.back}</div>
                      </td>
                      <td className="py-4 px-6 align-top">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          card.status === "mastered" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                          card.status === "learning" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                          "bg-slate-800 text-secondary border border-slate-700"
                        }`}>
                          {card.status === "mastered" && (
                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {card.status ? card.status.charAt(0).toUpperCase() + card.status.slice(1) : "New"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-secondary text-right align-top whitespace-nowrap">
                        {card.dueDate ? new Date(card.dueDate).toLocaleDateString() : "Pending"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
