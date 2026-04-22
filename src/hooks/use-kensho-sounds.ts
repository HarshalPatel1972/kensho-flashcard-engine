"use client";

import { useCallback, useRef, useEffect } from "react";
import { useSettings } from "@/providers/SettingsProvider";

const SOUNDS = {
  click: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
  success: "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3",
  error: "https://assets.mixkit.co/active_storage/sfx/2513/2513-preview.mp3",
  flip: "https://assets.mixkit.co/active_storage/sfx/2048/2048-preview.mp3",
  type: "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3",
  hover: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"
};

// Global state for low-latency audio
let audioCtx: AudioContext | null = null;
const audioBuffers: Record<string, AudioBuffer> = {};

export function useKenshoSounds() {
  const { audioEnabled } = useSettings();

  useEffect(() => {
    if (typeof window === "undefined" || audioCtx) return;
    
    // Initialize context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();

    // Preload and decode
    const loadSound = async (name: string, url: string) => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        if (audioCtx) {
          const decoded = await audioCtx.decodeAudioData(arrayBuffer);
          audioBuffers[name] = decoded;
        }
      } catch (err) {
        console.warn(`Failed to load sound: ${name}`, err);
      }
    };

    Object.entries(SOUNDS).forEach(([name, url]) => {
      if (!audioBuffers[name]) loadSound(name, url);
    });
  }, []);

  const play = useCallback((soundName: keyof typeof SOUNDS) => {
    if (!audioEnabled || !audioCtx || !audioBuffers[soundName]) return;

    // Resume context if suspended (browser autoplay policy)
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffers[soundName];

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = soundName === "type" ? 0.15 : soundName === "hover" ? 0.08 : 0.4;

    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    source.start(0);
  }, [audioEnabled]);

  return {
    playClick: () => play("click"),
    playSuccess: () => play("success"),
    playError: () => play("error"),
    playFlip: () => play("flip"),
    playType: () => play("type"),
    playHover: () => play("hover"),
  };
}
