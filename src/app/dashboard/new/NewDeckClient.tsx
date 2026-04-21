"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/UploadZone";
import { LoadingMessage } from "@/components/LoadingMessage";
import { ErrorState } from "@/components/ErrorState";
import { ArrowRight, ChevronRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type UploadStep = "upload" | "select-pages" | "generating";

export default function NewDeckClient() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deckId, setDeckId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Flow State
  const [step, setStep] = useState<UploadStep>("upload");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isProcessingInfo, setIsProcessingInfo] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const handleCreateDeck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const handleUploadComplete = async (url: string) => {
    setPdfUrl(url);
    setIsProcessingInfo(true);
    try {
      const res = await fetch(`/api/pdf/info?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Could not read PDF info");
      
      const count = data.totalPages;
      setTotalPages(count);
      
      if (count > 20) {
        setError(`This PDF has ${count} pages. Current AI models cannot process more than 20 pages. Please upload a shorter document or select specific pages.`);
        return;
      }
      
      setStep("select-pages");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessingInfo(false);
    }
  };

  const togglePage = (page: number) => {
    setSelectedPages(prev => 
      prev.includes(page) ? prev.filter(p => p !== page) : [...prev, page]
    );
  };

  const selectAll = () => {
    const pages = Array.from({ length: Math.min(totalPages, 20) }, (_, i) => i + 1);
    setSelectedPages(pages);
    if (totalPages > 20) {
      toast.info("Only the first 20 pages will be processed");
    }
  };

  const clearSelection = () => setSelectedPages([]);

  const startGeneration = async () => {
    if (!deckId || !pdfUrl || selectedPages.length === 0) return;
    
    const controller = new AbortController();
    setAbortController(controller);
    setStep("generating");
    setError(null);

    try {
      const res = await fetch(`/api/decks/${deckId}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfUrl, selectedPages }),
        signal: controller.signal
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      toast.success("Flashcards generated!");
      router.push(`/dashboard/${deckId}`);
      router.refresh();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.info("Generation cancelled");
        setStep("select-pages");
      } else {
        setError(err.message);
      }
    }
  };

  const handleCancel = () => {
    if (abortController) abortController.abort();
    setStep("select-pages");
  };

  if (step === "generating") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <LoadingMessage 
          messages={[
            "Reading your selected pages...",
            "Extracting core concepts...",
            "Crafting your flashcards...",
            "Polishing the cards...",
            "Almost there..."
          ]}
          quote={true}
        />
        <button
          onClick={handleCancel}
          className="text-sm text-red-500 hover:text-red-400 font-medium transition-colors cursor-pointer"
        >
          Cancel Generation
        </button>
      </div>
    );
  }

  if (error && step === "generating") {
     return (
       <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
         <ErrorState 
           title="Generation Failed"
           message={error}
           onRetry={() => setStep("select-pages")}
         />
         <button 
           onClick={() => setStep("select-pages")}
           className="text-sm border-b border-border hover:border-gold transition-colors"
         >
           Back to selection
         </button>
       </div>
     );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-medium tracking-tight">New Deck</h1>
        <p className="text-secondary">Create a deck and select exactly which pages you want to study.</p>
      </div>

      {!deckId ? (
        <form 
          onSubmit={handleCreateDeck} 
          className="space-y-6 bg-surface p-6 rounded-xl border border-border/50"
        >
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-primary">Deck Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-bg border border-border rounded-md px-4 py-2.5 text-primary focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors"
              placeholder="e.g., Biology 101: Cell Structure"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-primary">Description <span className="text-secondary">(Optional)</span></label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-bg border border-border rounded-md px-4 py-2.5 text-primary focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors resize-none"
              placeholder="Study notes for midterm..."
            />
          </div>
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          <div className="pt-2">
            {isCreating ? (
              <div className="py-4">
                <LoadingMessage 
                  messages={[
                    "Building your deck...",
                    "Setting things up..."
                  ]} 
                />
              </div>
            ) : (
              <button
                type="submit"
                disabled={isCreating || !title.trim()}
                className="w-full inline-flex items-center justify-center rounded-md bg-gold px-6 py-3 text-sm font-medium text-black hover:bg-gold-hover transition-colors disabled:opacity-50"
              >
                Save and Continue
              </button>
            )}
          </div>
        </form>
      ) : step === "select-pages" ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="space-y-2">
            <h2 className="text-2xl font-medium">Choose pages to study</h2>
            <p className="text-secondary">Select the pages you want to turn into flashcards</p>
          </div>

          {totalPages > 4 && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                This PDF has {totalPages} pages. Kenshō will sample the key lines from each selected page to stay within AI model limits.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2">
              <button 
                onClick={selectAll}
                className="text-xs px-3 py-1.5 rounded-md border border-border hover:border-gold hover:text-gold transition-colors"
              >
                Select all pages
              </button>
              <button 
                onClick={clearSelection}
                className="text-xs px-3 py-1.5 rounded-md border border-border hover:text-secondary transition-colors"
              >
                Clear selection
              </button>
            </div>
            <p className="text-sm font-medium text-gold">
              {selectedPages.length} pages selected
            </p>
          </div>

          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                disabled={selectedPages.length >= 20 && !selectedPages.includes(pageNum)}
                onClick={() => togglePage(pageNum)}
                className={cn(
                  "aspect-square flex items-center justify-center rounded-lg border text-sm font-medium transition-all disabled:opacity-30",
                  selectedPages.includes(pageNum) 
                    ? "bg-gold text-black border-gold shadow-lg shadow-gold/20" 
                    : "border-border hover:border-gold/50 text-secondary"
                )}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <div className="pt-8">
            <div className="flex flex-col items-center gap-4">
              {selectedPages.length > 20 && (
                <div className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] uppercase tracking-widest font-bold">
                  20 page maximum — please deselect some pages
                </div>
              )}
              {selectedPages.length === 0 && (
                <p className="text-xs text-secondary italic">Select at least one page to continue</p>
              )}
              
              <button
                onClick={startGeneration}
                disabled={selectedPages.length === 0 || selectedPages.length > 20}
                className="w-full inline-flex items-center justify-center rounded-xl bg-gold px-8 py-4 text-lg font-bold text-black hover:bg-gold-hover transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-gold/20 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none"
              >
                Create Flashcards <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              
              <button 
                onClick={() => setStep("upload")}
                className="text-sm text-secondary hover:text-primary transition-colors"
              >
                Change PDF
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-surface p-6 rounded-xl border border-border/50">
            <h2 className="text-xl font-medium mb-1">{title}</h2>
            {description && <p className="text-secondary text-sm mb-4">{description}</p>}
            <div className="mt-8">
              {isProcessingInfo ? (
                <div className="py-12">
                   <LoadingMessage messages={["Reading PDF pages...", "Analyzing structure..."]} />
                </div>
              ) : (
                <UploadZone 
                  deckId={deckId} 
                  onUploadComplete={handleUploadComplete}
                  onCancel={() => setStep("upload")}
                />
              )}
            </div>
          </div>
          {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
          <p className="text-center text-sm text-secondary">
             Step 1: Upload your material. We'll handle the parsing.
          </p>
        </div>
      )}
    </div>
  );
}
