"use client";

import React from "react";
import { useSettings } from "@/providers/SettingsProvider";
import { useKenshoSounds } from "@/hooks/use-kensho-sounds";
import { Volume2, VolumeX, Type, Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppPreferences() {
  const { 
    audioEnabled, setAudioEnabled, 
    fontSize, setFontSize, 
    accentColor, setAccentColor 
  } = useSettings();
  const { playClick } = useKenshoSounds();

  const handleToggleAudio = () => {
    playClick();
    setAudioEnabled(!audioEnabled);
  };

  const handleSetFontSize = (size: typeof fontSize) => {
    playClick();
    setFontSize(size);
  };

  const handleSetAccent = (color: typeof accentColor) => {
    playClick();
    setAccentColor(color);
  };

  return (
    <div className="space-y-8 p-1 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Kenshō Experience</h2>
        <p className="text-sm text-secondary">Tailor the interface to your study style.</p>
      </div>

      <div className="space-y-6">
        {/* Sound Toggle */}
        <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border/50 group hover:border-gold/30 transition-all">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              audioEnabled ? "bg-gold/10 text-gold" : "bg-secondary/10 text-secondary"
            )}>
              {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </div>
            <div>
              <p className="font-medium">Sound Effects</p>
              <p className="text-xs text-secondary">Click feedback and physical chimes.</p>
            </div>
          </div>
          <button
            onClick={handleToggleAudio}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-offset-bg focus:ring-2 focus:ring-gold ring-offset-2",
              audioEnabled ? "bg-gold" : "bg-border"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                audioEnabled ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>

        {/* Font Size Select */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-secondary">
            <Type size={16} />
            <p>Font Size</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(["small", "medium", "large"] as const).map((size) => (
              <button
                key={size}
                onClick={() => handleSetFontSize(size)}
                className={cn(
                  "py-2.5 px-4 h-11 text-sm font-bold capitalize transition-all btn-kensho-3d-item",
                  fontSize === size && "active"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color Select */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-secondary">
            <Palette size={16} />
            <p>Accent Theme</p>
          </div>
          <div className="flex gap-4">
            {[
              { id: "gold", color: "#f5a623", label: "Gold" },
              { id: "sapphire", color: "#3b82f6", label: "Blue" },
              { id: "emerald", color: "#10b981", label: "Green" },
              { id: "ruby", color: "#ef4444", label: "Red" }
            ].map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleSetAccent(theme.id as any)}
                className={cn(
                  "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all btn-kensho-3d-item",
                  accentColor === theme.id && "active"
                )}
                style={{ 
                  backgroundColor: theme.color,
                  boxShadow: accentColor === theme.id ? `0 4px 0 0 color-mix(in srgb, ${theme.color}, black 30%)` : `0 2px 0 0 var(--border)`
                }}
                title={theme.label}
              >
                {accentColor === theme.id && <Check size={20} className="text-white drop-shadow-md" />}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t border-border/50">
        <p className="text-[10px] text-center text-secondary uppercase tracking-widest font-bold">
          Settings are saved to your browser.
        </p>
      </div>
    </div>
  );
}
