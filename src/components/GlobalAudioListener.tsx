"use client";

import { useEffect } from "react";
import { useKenshoSounds } from "@/hooks/use-kensho-sounds";

export function GlobalAudioListener() {
  const { playClick } = useKenshoSounds();

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Find the closest interactive element
      const target = e.target as HTMLElement;
      const interactive = target.closest("button, a, input[type='button'], input[type='submit'], [role='button']");
      
      if (interactive) {
        playClick();
      }
    };

    document.addEventListener("click", handleGlobalClick, { capture: true });
    return () => document.removeEventListener("click", handleGlobalClick, { capture: true });
  }, [playClick]);

  return null;
}
