export function DeckOverviewSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-border/50 bg-surface h-24 shimmer" />
        ))}
      </div>
      <div className="bg-surface rounded-xl border border-border/50 h-96 shimmer" />
    </div>
  );
}
