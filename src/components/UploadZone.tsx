"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { LoadingMessage } from "./LoadingMessage";
import { useUploadThing } from "@/lib/uploadthing";
import { toast } from "sonner";

type UploadZoneProps = {
  deckId: string;
  onSuccess: () => void;
  onCancel: () => void;
  skipDeleteOnCancel?: boolean;
};

export function UploadZone({ deckId, onSuccess, onCancel, skipDeleteOnCancel }: UploadZoneProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const resetFileInput = () => {
    const input = document.getElementById("pdf-upload") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const generateCards = async (fileUrl: string) => {
    const controller = new AbortController();
    setAbortController(controller);
    setIsGenerating(true);
    setError(null);

    try {
      const fetchRes = await fetch(`/api/decks/${deckId}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
        signal: controller.signal,
      });

      if (!fetchRes.ok) {
        const errorText = await fetchRes.text();
        let errorMessage = "Generation failed";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = `Server Error (${fetchRes.status}): ${errorText.substring(0, 50)}...`;
        }
        throw new Error(errorMessage);
      }

      toast.success("Deck created successfully!");
      resetFileInput();
      onSuccess();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.info("Process cancelled");
      } else {
        setError(err.message);
      }
      resetFileInput();
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const { startUpload, isUploading } = useUploadThing("pdfUploader", {
    signal: abortController?.signal,
    onClientUploadComplete: async (res) => {
      const url = res?.[0]?.url;
      if (isCancelling) return; // Prevent proceeding if cancelled
      if (!url) {
        setError("Upload failed - no URL returned");
        resetFileInput();
        return;
      }
      setUploadedUrl(url);
      await generateCards(url);
    },
    onUploadError: (error: Error) => {
      if (error.message !== "Upload aborted") {
        setError(`Upload failed: ${error.message}`);
      }
      resetFileInput();
    },
  });

  const handleFileUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    setError(null);
    setUploadedUrl(null);
    const controller = new AbortController();
    setAbortController(controller);
    await startUpload([file]);
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    if (abortController) {
      abortController.abort();
    }
    
    // Stop UploadThing upload implicitly by controller

    if (deckId && !skipDeleteOnCancel) {
      try {
        await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
      } catch (e) {
        // Silent — best effort cleanup
      }
    }

    resetFileInput();
    toast.info("Upload cancelled");
    onCancel();
    setIsCancelling(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [startUpload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const isLoading = isUploading || isGenerating;

  return (
    <div className="w-full">
      <div
        className={cn(
          "relative flex flex-col items-center justify-center w-full min-h-64 rounded-xl border-2 border-dashed transition-all overflow-hidden",
          isHovering ? "border-gold bg-gold/5" : "border-border hover:border-gold/50 bg-surface/30",
          isLoading && "pointer-events-none opacity-80"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
        onDragLeave={() => setIsHovering(false)}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          accept="application/pdf" 
          onChange={handleChange} 
          onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
          className="hidden" 
          id="pdf-upload"
          disabled={isLoading}
        />
        
        {isLoading ? (
          <div className="flex flex-col items-center space-y-4 p-8">
            <LoadingMessage 
              quote 
              messages={isUploading ? ["Uploading PDF to secure storage..."] : [
                "Reading your PDF...",
                "Extracting core concepts...",
                "Crafting your cards...",
                "Almost there..."
              ]} 
            />
            <button
              onClick={(e) => { e.stopPropagation(); handleCancel(); }}
              disabled={isCancelling}
              className="mt-2 text-sm text-red-500 hover:text-red-400 font-medium cursor-pointer pointer-events-auto transition-colors px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCancelling ? "Cancelling..." : "Cancel Process"}
            </button>
          </div>
        ) : error && uploadedUrl ? (
          <div className="flex flex-col items-center space-y-6 text-center p-8">
            <div className="space-y-2">
              <p className="text-red-500 font-medium">{error}</p>
              <p className="text-sm text-secondary">The file is saved, but generation failed.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => generateCards(uploadedUrl)}
                className="px-6 py-2.5 bg-gold text-black rounded-lg font-medium hover:bg-gold-hover transition-all shadow-lg shadow-gold/20"
              >
                Retry Generation
              </button>
              <label htmlFor="pdf-upload" className="px-6 py-2.5 bg-surface border border-border text-primary rounded-lg font-medium hover:bg-bg transition-all cursor-pointer">
                Upload Different File
              </label>
            </div>
          </div>
        ) : (
          <label htmlFor="pdf-upload" className="flex flex-col items-center space-y-2 text-center p-12 cursor-pointer w-full h-full justify-center group">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-lg text-primary font-medium">Drop your PDF here or click to upload</p>
            <p className="text-sm text-secondary">Cards are generated from the core concepts of your PDF</p>
            <p className="text-xs text-secondary/70 mt-1">Best results with focused, text-based PDFs</p>
          </label>
        )}
      </div>
    </div>
  );
}
