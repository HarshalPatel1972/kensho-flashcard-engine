import { DeckCardSkeleton } from "@/components/skeletons/DeckCardSkeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="h-9 bg-border/40 rounded-md w-48 shimmer" />
        <div className="h-10 bg-border/30 rounded-md w-full max-w-md shimmer" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <DeckCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
