"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/UploadZone";

export default function NewDeckPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deckId, setDeckId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/decks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create deck");
      setDeckId(data.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUploadSuccess = () => {
    router.push(`/dashboard/${deckId}`);
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-medium tracking-tight">New Deck</h1>
        <p className="text-slate-400">Create a deck and upload a PDF to extract smart flashcards.</p>
      </div>

      {!deckId ? (
        <form onSubmit={handleCreateDeck} className="space-y-6 bg-surface p-6 rounded-xl border border-border/50">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-slate-300">Deck Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-bg border border-border rounded-md px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors"
              placeholder="e.g., Biology 101: Cell Structure"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-slate-300">Description <span className="text-slate-500">(Optional)</span></label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-bg border border-border rounded-md px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors resize-none"
              placeholder="Study notes for midterm..."
            />
          </div>
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isCreating || !title.trim()}
              className="w-full inline-flex items-center justify-center rounded-md bg-gold px-6 py-3 text-sm font-medium text-black hover:bg-gold-hover transition-colors disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Save and Continue"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="bg-surface p-6 rounded-xl border border-border/50">
            <h2 className="text-xl font-medium mb-1">{title}</h2>
            {description && <p className="text-slate-400 text-sm mb-4">{description}</p>}
            <div className="mt-8">
              <UploadZone deckId={deckId} onSuccess={handleUploadSuccess} />
            </div>
          </div>
          <p className="text-center text-sm text-slate-500">
            Gemini Flash reads the PDF text and generates structured flashcards optimized for recall.
          </p>
        </div>
      )}
    </div>
  );
}
