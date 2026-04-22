"use client";

import { useEffect } from "react";
import { useKenshoSounds } from "@/hooks/use-kensho-sounds";

export function GlobalAudioListener() {
  const { playClick } = useKenshoSounds();

  useEffect(() => {
    const handleGlobalInteraction = (e: PointerEvent) => {
      // Only handle primary interactions (left click / touch)
      if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;

      const target = e.target as HTMLElement;
      
      // Find the closest interactive element
      const interactive = target.closest("button, a, [role='button'], .btn-kensho-3d, .btn-kensho-3d-secondary, [data-kensho-sound='click']");
      
      // Check if we should ignore this element (e.g. it has its own custom sound)
      if (interactive && !interactive.hasAttribute("data-kensho-ignore-sound")) {
        playClick();
      }
    };

    document.addEventListener("pointerdown", handleGlobalInteraction, { capture: true, passive: true });
    return () => document.removeEventListener("pointerdown", handleGlobalInteraction, { capture: true });
  }, [playClick]);

  return null;
}
