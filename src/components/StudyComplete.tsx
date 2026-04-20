import Link from "next/link";

export function StudyComplete({ deckId, reviewed, mastered }: { deckId: string, reviewed: number, mastered: number }) {
  return (
    <div className="flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pt-10">
      <div className="w-24 h-24 rounded-full bg-gold/10 border border-gold flex items-center justify-center mb-2">
        <svg className="w-10 h-10 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h2 className="text-4xl font-medium tracking-tight text-white mb-3">Session Complete</h2>
        <p className="text-xl text-slate-400 font-light italic">Clarity achieved.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="p-6 rounded-xl border border-border/50 bg-surface">
          <p className="text-sm text-slate-400 mb-2">Cards Reviewed</p>
          <p className="text-3xl font-medium text-slate-100">{reviewed}</p>
        </div>
        <div className="p-6 rounded-xl border border-gold/30 bg-gold/5 shadow-[0_0_20px_rgba(245,166,35,0.1)]">
          <p className="text-sm text-gold/80 mb-2">Mastered Today</p>
          <p className="text-3xl font-medium text-gold">{mastered}</p>
        </div>
      </div>
      <div className="pt-6">
        <Link
          href={`/dashboard/${deckId}`}
          className="inline-flex items-center justify-center rounded-md bg-surface border border-border px-8 py-3 text-sm font-medium text-slate-300 hover:text-white hover:border-gold transition-colors"
        >
          Back to Deck
        </Link>
      </div>
    </div>
  );
}
