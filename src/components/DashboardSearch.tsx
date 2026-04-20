"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export function DashboardSearch() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  
  const [term, setTerm] = useState(searchParams.get("q")?.toString() || "");

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (term) {
        params.set("q", term);
      } else {
        params.delete("q");
      }
      replace(`${pathname}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(handler);
  }, [term, searchParams, pathname, replace]);

  return (
    <div className="relative max-w-md w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        placeholder="Search titles or card content..."
        className="block w-full pl-10 pr-3 py-2.5 bg-surface border border-border/50 rounded-lg text-primary placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors sm:text-sm"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
    </div>
  );
}
