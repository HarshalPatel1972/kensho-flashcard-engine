import { DeckOverviewSkeleton } from "@/components/skeletons/DeckOverviewSkeleton";

export default function DeckOverviewLoading() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="h-4 bg-border/20 rounded w-24 shimmer mb-4" />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-9 bg-border/40 rounded-md w-1/2 shimmer" />
          <div className="h-4 bg-border/20 rounded-md w-3/4 shimmer" />
        </div>
        <div className="h-10 bg-border/30 rounded-md w-32 shimmer hidden md:block" />
      </div>
      <DeckOverviewSkeleton />
    </div>
  );
}
