"use client";

import { useEffect } from "react";
import { useKenshoSounds } from "@/hooks/use-kensho-sounds";

export function GlobalAudioListener() {
  const { playClick } = useKenshoSounds();

  useEffect(() => {
    const playActionSound = (target: HTMLElement) => {
      const interactive = target.closest("button, a, [role='button'], .btn-kensho-3d, .btn-kensho-3d-secondary, [data-kensho-sound='click']");
      if (interactive && !interactive.hasAttribute("data-kensho-ignore-sound")) {
        playClick();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Desktop: Play immediately on mouse down for instant tactile feel
      if (e.pointerType === "mouse" && e.button === 0) {
        playActionSound(e.target as HTMLElement);
      }
    };

    const handleClick = (e: MouseEvent) => {
      // Mobile/Touch: Play on click (release). This prevents sound when scrolling/dragging
      // since the browser cancels the 'click' event if a scroll occurs.
      // We ignore mouse clicks here because they were handled by pointerdown.
      if ((e as any).pointerType !== "mouse") {
        playActionSound(e.target as HTMLElement);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, { capture: true, passive: true });
    document.addEventListener("click", handleClick, { capture: true, passive: true });

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, [playClick]);

  return null;
}
