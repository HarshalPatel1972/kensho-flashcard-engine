import { db } from "@/db";
import { decks, cards, cardProgress } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, asc } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function DeckOverviewPage({ params }: { params: { deckId: string } }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const deckId = params.deckId;

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

  const dueTodayCount = deckCards.filter(
    (c) => c.dueDate && c.dueDate <= new Date()
  ).length;

  const totalCards = deckCards.length;
  const masteredCount = deckCards.filter((c) => c.status === "mastered").length;
  const avgEase =
    totalCards > 0
      ? deckCards.reduce((acc, c) => acc + (c.easeFactor ?? 2.5), 0) / totalCards
      : 2.5;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div>
        <Link href="/dashboard" className="text-sm border-b border-transparent hover:border-gold text-slate-400 hover:text-gold transition-colors pb-0.5 inline-flex mb-4">
          ← Back to Decks
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-white">
              {deck.title}
            </h1>
            {deck.description && (
              <p className="text-slate-400 mt-2">{deck.description}</p>
            )}
          </div>
          <div>
            <Link
              href={`/study/${deckId}`}
              className={`inline-flex items-center justify-center rounded-md px-8 py-3 text-sm font-medium transition-colors ${
                dueTodayCount > 0
                  ? "bg-gold text-black hover:bg-gold-hover shadow-lg shadow-gold/20"
                  : "bg-surface border border-border text-slate-300 hover:bg-bg opacity-50 cursor-not-allowed pointer-events-none"
              }`}
              aria-disabled={dueTodayCount === 0}
            >
              {dueTodayCount > 0 ? "Study Now" : "No cards due"}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Cards", value: totalCards },
          { label: "Mastered", value: masteredCount },
          { label: "Due Today", value: dueTodayCount, highlight: dueTodayCount > 0 },
          { label: "Avg Ease", value: avgEase.toFixed(2) },
        ].map((stat, i) => (
          <div key={i} className={`p-4 rounded-xl border ${stat.highlight ? "border-gold/30 bg-gold/5" : "border-border/50 bg-surface"}`}>
            <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-medium ${stat.highlight ? "text-gold" : "text-slate-100"}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto bg-surface rounded-xl border border-border/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/50 bg-bg/50">
              <th className="py-3 px-6 text-sm font-medium text-slate-400 w-1/3">Front</th>
              <th className="py-3 px-6 text-sm font-medium text-slate-400 w-1/3">Back</th>
              <th className="py-3 px-6 text-sm font-medium text-slate-400">Status</th>
              <th className="py-3 px-6 text-sm font-medium text-slate-400 text-right">Next Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {deckCards.map((card) => (
              <tr key={card.id} className="hover:bg-bg/40 transition-colors">
                <td className="py-4 px-6 text-sm text-slate-200 align-top">
                  <div className="line-clamp-2">{card.front}</div>
                </td>
                <td className="py-4 px-6 text-sm text-slate-400 align-top">
                  <div className="line-clamp-2">{card.back}</div>
                </td>
                <td className="py-4 px-6 align-top">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    card.status === "mastered" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                    card.status === "learning" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                    "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}>
                    {card.status ? card.status.charAt(0).toUpperCase() + card.status.slice(1) : "New"}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm text-slate-400 text-right align-top whitespace-nowrap">
                  {card.dueDate ? new Date(card.dueDate).toLocaleDateString() : "Pending"}
                </td>
              </tr>
            ))}
            {deckCards.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-500 text-sm">
                  No cards found in this deck.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
