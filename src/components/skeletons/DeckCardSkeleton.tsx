export function DeckCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-border/50 bg-surface h-48 flex flex-col justify-between animate-pulse">
      <div className="space-y-3">
        <div className="h-6 bg-border/40 rounded-md w-3/4 shimmer" />
        <div className="h-4 bg-border/20 rounded-md w-full shimmer" />
      </div>
      <div className="flex justify-between items-end pt-4">
        <div className="space-y-2">
          <div className="h-3 bg-border/20 rounded-md w-16 shimmer" />
          <div className="h-5 bg-border/30 rounded-md w-24 shimmer" />
        </div>
        <div className="h-4 bg-border/20 rounded-md w-20 shimmer" />
      </div>
    </div>
  );
}

// Add CSS to globals.css for shimmer if not already handled by tailwind animate-pulse
