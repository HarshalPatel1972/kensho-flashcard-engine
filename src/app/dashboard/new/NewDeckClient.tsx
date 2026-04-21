"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/UploadZone";
import { LoadingMessage } from "@/components/LoadingMessage";
import { ErrorState } from "@/components/ErrorState";
import { ArrowRight, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

// Client-side worker config
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

function parsePageRange(input: string, maxPages: number): number[] {
  const pages = new Set<number>();
  const parts = input.split(",").map(p => p.trim());
  
  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-");
      const start = parseInt(startStr);
      const end = parseInt(endStr);
      if (!isNaN(start) && !isNaN(end)) {
        const s = Math.min(start, end);
        const e = Math.max(start, end);
        for (let i = s; i <= e; i++) {
          if (i >= 1 && i <= maxPages) pages.add(i);
        }
      }
    } else {
      const p = parseInt(part);
      if (!isNaN(p) && p >= 1 && p <= maxPages) pages.add(p);
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}

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
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [pageMode, setPageMode] = useState<"all" | "custom">("all");
  const [rangeInput, setRangeInput] = useState("");
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [isRenderingThumbnails, setIsRenderingThumbnails] = useState(false);

  const selectedPages = pageMode === "all" 
    ? Array.from({ length: Math.min(20, totalPages) }, (_, i) => i + 1)
    : parsePageRange(rangeInput, totalPages);

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
      setPageMode(count <= 20 ? "all" : "custom");
      setRangeInput(count <= 4 ? `1-${count}` : `1-4`);
      setStep("select-pages");
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessingInfo(false);
    }
  };

  // Thumbnail Rendering Logic
  useEffect(() => {
    if (step !== "select-pages" || !pdfFile || totalPages === 0) return;

    const renderRange = async () => {
      setIsRenderingThumbnails(true);
      try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const newThumbs: Record<number, string> = { ...thumbnails };
        
        // Only render the pages currently in the selected range that aren't already cached
        const pagesToRender = selectedPages.filter(p => !newThumbs[p]);
        
        for (const pageNum of pagesToRender) {
          try {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 0.2 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (!context) continue;

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport }).promise;
            newThumbs[pageNum] = canvas.toDataURL();
          } catch (e) {
            console.error(`Failed to render thumbnail for page ${pageNum}`, e);
          }
        }
        setThumbnails(newThumbs);
      } catch (err) {
        console.error("Thumbnail rendering error:", err);
      } finally {
        setIsRenderingThumbnails(false);
      }
    };

    const timer = setTimeout(renderRange, 300);
    return () => clearTimeout(timer);
  }, [selectedPages.length, pageMode, rangeInput, pdfFile, totalPages, step]);

  const quickSelect = (type: "first4" | "first10" | "all") => {
    setPageMode("custom");
    if (type === "first4") setRangeInput(`1-${Math.min(4, totalPages)}`);
    if (type === "first10") setRangeInput(`1-${Math.min(10, totalPages)}`);
    if (type === "all") {
      if (totalPages <= 20) {
        setPageMode("all");
      } else {
        setRangeInput(`1-20`);
      }
    }
  };


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
    setError(null);
  };

  // Step Header Logic
  const renderHeader = () => (
    <div className="space-y-2">
      <h1 className="text-3xl font-medium tracking-tight">New Deck</h1>
      <p className="text-secondary">
        {step === "upload" && "Create a deck and upload a PDF to extract smart flashcards."}
        {step === "select-pages" && "Choose exactly which pages you want to turn into study cards."}
        {step === "generating" && "Our AI engine is currently reading your material."}
      </p>
    </div>
  );

  // STEP: GENERATING
  if (step === "generating") {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
        {renderHeader()}
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-12">
          {!error ? (
            <>
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
            </>
          ) : (
            <div className="w-full space-y-8">
              <ErrorState 
                title="Generation Failed"
                message={error}
              />
              <div className="flex justify-center gap-4">
                <button 
                  onClick={startGeneration}
                  className="px-8 py-3 bg-gold text-black rounded-xl font-bold hover:bg-gold-hover transition-all hover:scale-105 active:scale-95 shadow-xl shadow-gold/20"
                >
                  Try Again
                </button>
                <button 
                  onClick={() => { setStep("select-pages"); setError(null); }}
                  className="px-8 py-3 bg-surface border border-border text-primary rounded-xl font-medium hover:bg-bg transition-all"
                >
                  Back to selection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {renderHeader()}

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
          <div className="bg-surface p-6 rounded-2xl border border-border/50 space-y-6">
             <div className="space-y-4">
                <div className="flex items-center justify-between relative">
                  <label className="text-xs uppercase tracking-widest text-secondary font-bold">Pages</label>
                  <PageModeSelect 
                    value={pageMode} 
                    onChange={setPageMode} 
                  />
                </div>

                {pageMode === "custom" && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <input 
                      type="text" 
                      value={rangeInput}
                      onChange={(e) => setRangeInput(e.target.value)}
                      placeholder="e.g. 1-5, 8, 11-13"
                      className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-lg font-medium focus:ring-2 focus:ring-gold outline-none transition-all"
                      autoFocus
                    />
                    <p className="text-[10px] text-secondary italic">Enter page numbers or ranges separated by commas</p>
                  </div>
                )}
             </div>

             <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => quickSelect("first4")}
                  className="px-3 py-1.5 rounded-full border border-border text-xs text-secondary hover:border-gold hover:text-gold transition-all"
                >
                  First 4 pages
                </button>
                <button 
                  onClick={() => quickSelect("first10")}
                  className="px-3 py-1.5 rounded-full border border-border text-xs text-secondary hover:border-gold hover:text-gold transition-all"
                >
                  First 10 pages
                </button>
                <button 
                  onClick={() => quickSelect("all")}
                  className="px-3 py-1.5 rounded-full border border-border text-xs text-secondary hover:border-gold hover:text-gold transition-all"
                >
                  All (Cap 20)
                </button>
                {totalPages > 20 && <span className="text-[10px] text-secondary/60 flex items-center ml-1 italic">Note: Capped at 20</span>}
             </div>

             {/* Thumbnail Strip */}
             <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-secondary/60 font-bold">Preview Strip</label>
                <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide pt-1 min-h-[120px]">
                   {selectedPages.map(p => (
                      <div key={p} className="flex-shrink-0 group">
                         <div className={cn(
                            "w-20 aspect-[3/4] rounded-lg border-2 bg-bg overflow-hidden flex items-center justify-center transition-all",
                            "border-gold shadow-[0_0_12px_rgba(245,166,35,0.2)]"
                         )}>
                            {thumbnails[p] ? (
                               <img src={thumbnails[p]} alt={`Page ${p}`} className="w-full h-full object-cover" />
                            ) : (
                               <div className="flex flex-col items-center justify-center space-y-1">
                                  {isRenderingThumbnails ? <Loader2 className="w-4 h-4 animate-spin text-gold/40" /> : <span className="text-secondary/40 text-xs">{p}</span>}
                               </div>
                            )}
                         </div>
                         <p className="text-[10px] text-center mt-1 text-secondary font-medium">Page {p}</p>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="pt-4 space-y-6">
            <div className="flex flex-col items-center gap-4">
              {selectedPages.length > 20 && (
                <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium animate-in fade-in zoom-in duration-300">
                  Maximum 20 pages allowed. You currently have {selectedPages.length} selected.
                </div>
              )}
              
              <div className="text-center">
                <p className="text-xs text-secondary mb-4">
                  {selectedPages.length} pages selected · AI will process 
                  <span className="text-primary font-medium ml-1">
                    {selectedPages.length <= 4 ? "full content" : "key lines per page"}
                  </span>
                </p>

                <button
                  onClick={startGeneration}
                  disabled={selectedPages.length === 0 || selectedPages.length > 20}
                  className="w-full md:w-auto min-w-[280px] inline-flex items-center justify-center rounded-xl bg-[#f5a623] px-10 py-5 text-xl font-bold text-black hover:bg-[#f5a623]/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-gold-glow disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none"
                >
                  Create Flashcards 
                  <span className="btn-arrow ml-2">
                    <ArrowRight size={24} />
                  </span>
                </button>
              </div>
              
              <button 
                onClick={() => { setStep("upload"); setPdfUrl(null); }}
                className="text-sm text-secondary hover:text-primary transition-colors mt-2"
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
                  onFileSelected={setPdfFile}
                  onCancel={() => { setDeckId(null); setStep("upload"); }}
                />
              )}
            </div>
          </div>
          {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
          <p className="text-center text-sm text-secondary italic">
             Step 1: Upload your material. We'll extract the structure.
          </p>
        </div>
      )}
    </div>
  );
}
function PageModeSelect({ value, onChange }: { value: "all" | "custom", onChange: (v: "all" | "custom") => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-bg border border-border rounded-lg px-4 py-1.5 text-sm font-medium hover:border-gold transition-colors focus:ring-1 focus:ring-gold outline-none min-w-[100px] justify-between"
      >
        <span>{value === "all" ? "All" : "Custom"}</span>
        <svg className={cn("w-4 h-4 transition-transform duration-200", isOpen && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-40 bg-surface border border-border shadow-2xl rounded-xl overflow-hidden z-[60]"
          >
            {(["all", "custom"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  onChange(mode);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm transition-colors",
                  value === mode 
                    ? "bg-gold text-black font-bold" 
                    : "text-primary hover:bg-gold/10 hover:text-gold"
                )}
              >
                {mode === "all" ? "All" : "Custom"}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
