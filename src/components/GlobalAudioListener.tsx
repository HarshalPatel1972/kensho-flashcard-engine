"use client";

import { useEffect } from "react";
import { useKenshoSounds } from "@/hooks/use-kensho-sounds";

export function GlobalAudioListener() {
  const { playClick } = useKenshoSounds();

  useEffect(() => {
    const handleGlobalInteraction = (e: PointerEvent) => {
      // Find the closest interactive element
      const target = e.target as HTMLElement;
      const interactive = target.closest("button, a, input, [role='button'], .cursor-pointer, .btn-kensho-3d, .btn-kensho-3d-secondary");
      
      if (interactive) {
        // Prevent multiple sounds if we catch both pointerdown and another event
        // (though pointerdown should be enough on its own)
        playClick();
      }
    };

    document.addEventListener("pointerdown", handleGlobalInteraction, { capture: true });
    return () => document.removeEventListener("pointerdown", handleGlobalInteraction, { capture: true });
  }, [playClick]);

  return null;
}
