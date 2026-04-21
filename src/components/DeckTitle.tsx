"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useKenshoSounds } from "@/hooks/use-kensho-sounds";

type DeckTitleProps = {
  deckId: string;
  initialTitle: string;
};

export function DeckTitle({ deckId, initialTitle }: DeckTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [inputValue, setInputValue] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { playClick, playType } = useKenshoSounds();

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) {
      setInputValue(title);
      setIsEditing(false);
      return;
    }

    if (trimmedValue === title) {
      setIsEditing(false);
      return;
    }

    // Optimistic update
    const previousTitle = title;
    setTitle(trimmedValue);
    setIsEditing(false);

    try {
      const res = await fetch(`/api/decks/${deckId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmedValue }),
      });

      if (!res.ok) throw new Error("Failed to rename deck");
      
      toast.success("Deck renamed");
      router.refresh();
    } catch (error) {
      setTitle(previousTitle);
      setInputValue(previousTitle);
      toast.error("Could not rename deck");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setInputValue(title);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => { setInputValue(e.target.value); playType(); }}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="text-3xl font-medium tracking-tight text-primary bg-bg border-b-2 border-gold outline-none w-full max-w-2xl py-1"
        maxLength={100}
      />
    );
  }

  return (
    <div 
      className="group flex items-center gap-2 cursor-pointer"
      onClick={() => { playClick(); setIsEditing(true); }}
    >
      <h1 className="text-3xl font-medium tracking-tight text-primary line-clamp-1 group-hover:text-gold transition-colors">
        {title}
      </h1>
      <Pencil className="w-5 h-5 text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
