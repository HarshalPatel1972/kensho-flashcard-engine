"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type FontSize = "small" | "medium" | "large";
type AccentColor = "gold" | "sapphire" | "emerald" | "ruby";

interface Settings {
  audioEnabled: boolean;
  fontSize: FontSize;
  accentColor: AccentColor;
}

interface SettingsContextType extends Settings {
  setAudioEnabled: (enabled: boolean) => void;
  setFontSize: (size: FontSize) => void;
  setAccentColor: (color: AccentColor) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [accentColor, setAccentColor] = useState<AccentColor>("gold");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("kensho-settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAudioEnabled(parsed.audioEnabled ?? true);
        setFontSize(parsed.fontSize ?? "medium");
        setAccentColor(parsed.accentColor ?? "gold");
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Sync to LocalStorage and Document
  useEffect(() => {
    if (!isLoaded) return;
    
    localStorage.setItem("kensho-settings", JSON.stringify({ audioEnabled, fontSize, accentColor }));
    
    // Apply CSS Variables
    const root = document.documentElement;
    
    // Font Sizes
    const sizes = { small: "14px", medium: "16px", large: "18px" };
    root.style.setProperty("--kensho-font-size", sizes[fontSize]);
    
    // Accent Colors
    const colors = {
      gold: "#f5a623",
      sapphire: "#3b82f6",
      emerald: "#10b981",
      ruby: "#ef4444"
    };
    root.style.setProperty("--gold", colors[accentColor]);
    root.style.setProperty("--gold-hover", colors[accentColor] + "dd");
    
  }, [audioEnabled, fontSize, accentColor, isLoaded]);

  return (
    <SettingsContext.Provider 
      value={{ 
        audioEnabled, setAudioEnabled, 
        fontSize, setFontSize, 
        accentColor, setAccentColor 
      }}
    >
      <div className={`font-size-${fontSize} theme-${accentColor}`}>
        {children}
      </div>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
