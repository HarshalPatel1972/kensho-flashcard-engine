"use client";

import { useCallback, useRef, useEffect } from "react";
import { useSettings } from "@/providers/SettingsProvider";

const SOUNDS = {
  click: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
  success: "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3",
  error: "https://assets.mixkit.co/active_storage/sfx/2513/2513-preview.mp3",
  flip: "https://assets.mixkit.co/active_storage/sfx/2048/2048-preview.mp3"
};

export function useKenshoSounds() {
  const { audioEnabled } = useSettings();
  const audioCache = useRef<Record<string, HTMLAudioElement>>({});

  // Preload sounds
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    Object.entries(SOUNDS).forEach(([name, url]) => {
      const audio = new Audio(url);
      audio.load();
      audioCache.current[name] = audio;
    });
  }, []);

  const play = useCallback((soundName: keyof typeof SOUNDS) => {
    if (!audioEnabled || typeof window === "undefined") return;
    
    const audio = audioCache.current[soundName];
    if (audio) {
      // Create a fresh clone to allow overlapping sounds (e.g. fast clicking)
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = 0.4;
      clone.play().catch(e => console.warn("Audio playback failed:", e));
    }
  }, [audioEnabled]);

  return {
    playClick: () => play("click"),
    playSuccess: () => play("success"),
    playError: () => play("error"),
    playFlip: () => play("flip"),
  };
}
