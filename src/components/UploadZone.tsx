"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { LoadingMessage } from "./LoadingMessage";
import { useUploadThing } from "@/lib/uploadthing";
import { toast } from "sonner";

type UploadZoneProps = {
  deckId: string;
  onSuccess: () => void;
};

export function UploadZone({ deckId, onSuccess }: UploadZoneProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const { startUpload, isUploading, stopUpload } = useUploadThing("pdfUploader", {
    onClientUploadComplete: async (res) => {
      const fileUrl = res?.[0]?.url;
      if (!fileUrl) {
        setError("Upload failed - no URL returned");
        return;
      }

      const controller = new AbortController();
      setAbortController(controller);
      setIsGenerating(true);

      try {
        const fetchRes = await fetch(`/api/decks/${deckId}/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUrl }),
          signal: controller.signal,
        });

        const data = await fetchRes.json();
        if (!fetchRes.ok) throw new Error(data.error || "Generation failed");

        toast.success("Deck created successfully!");
        onSuccess();
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Cleanup deleted deck on abort
          await fetch(`/api/decks/${deckId}`, { method: 'DELETE' });
          toast.info("Card generation cancelled");
        } else {
          setError(err.message);
          setIsGenerating(false);
        }
      } finally {
        setAbortController(null);
      }
    },
    onUploadError: (error: Error) => {
      if (error.message !== "Upload aborted") {
        setError(`Upload failed: ${error.message}`);
      }
    },
  });

  const handleFileUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    
    setError(null);
    await startUpload([file]);
  };

  const handleCancel = useCallback(async () => {
    if (isUploading) {
      stopUpload();
      toast.info("Upload cancelled");
    } else if (isGenerating && abortController) {
      abortController.abort();
    }
  }, [isUploading, isGenerating, abortController, stopUpload, deckId]);

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
          "relative flex flex-col items-center justify-center w-full h-64 rounded-xl border-2 border-dashed transition-all overflow-hidden",
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
          className="hidden" 
          id="pdf-upload"
          disabled={isLoading}
        />
        
        {isLoading ? (
          <div className="flex flex-col items-center space-y-4">
            <LoadingMessage 
              quote 
              messages={isUploading ? ["Uploading PDF to secure storage..."] : [
                "Reading your PDF...",
                "Distilling the concepts...",
                "Crafting your cards...",
                "Sharpening the edges...",
                "Almost there..."
              ]} 
            />
            <button
              onClick={(e) => { e.stopPropagation(); handleCancel(); }}
              className="mt-2 text-sm text-red-500 hover:text-red-400 font-medium cursor-pointer pointer-events-auto transition-colors"
            >
              {isUploading ? "Cancel upload" : "Cancel generation"}
            </button>
          </div>
        ) : (
          <label htmlFor="pdf-upload" className="flex flex-col items-center space-y-2 text-center p-6 cursor-pointer w-full h-full justify-center">
            <svg className="w-10 h-10 text-secondary mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg text-primary">Drop your PDF here or click to upload</p>
            <p className="text-sm text-secondary">PDF up to 64MB supported</p>
          </label>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-red-500 font-medium text-center">{error}</p>}
    </div>
  );
}
