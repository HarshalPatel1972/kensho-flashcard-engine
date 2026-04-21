"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useKenshoSounds } from "@/hooks/use-kensho-sounds";

export function DashboardSearch() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const { playType } = useKenshoSounds();
  
  const [term, setTerm] = useState(searchParams.get("q")?.toString() || "");

  useEffect(() => {
    const handler = setTimeout(() => {
      // Sync URL without triggering Next.js server re-render
      const url = new URL(window.location.href);
      if (term) {
        url.searchParams.set("q", term);
      } else {
        url.searchParams.delete("q");
      }
      window.history.replaceState(null, "", url.toString());
      
      // Signal to DeckGrid
      window.dispatchEvent(new CustomEvent("kensho:search", { detail: term }));
    }, 50); // Faster debounce for local filtering

    return () => clearTimeout(handler);
  }, [term]);

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
        onChange={(e) => {
          setTerm(e.target.value);
          playType();
        }}
      />
    </div>
  );
}
