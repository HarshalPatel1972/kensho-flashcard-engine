export function ProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden border border-border/30">
      <div 
        className="h-full bg-gold transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
