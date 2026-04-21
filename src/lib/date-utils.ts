/**
 * Formats a review date into a human-friendly string.
 * Priority: Today, Tomorrow, Yesterday, or "D MMM YYYY" (e.g., 12 Mar 2026)
 */
export function formatReviewDate(date: Date | string | number | null | undefined): string {
  if (!date) return "New";
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid Date";

  const now = new Date();
  
  // Strip time for clean day comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  
  // Standard format for farther dates: e.g., 22 Apr 2026
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}
