"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { LoadingMessage } from "./LoadingMessage";

type UploadZoneProps = {
  deckId: string;
  onSuccess: () => void;
};

export function UploadZone({ deckId, onSuccess }: UploadZoneProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    
    // Size limit handled by server (Gemini Files API supports up to 2GB)
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const res = await fetch(`/api/decks/${deckId}/upload`, {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [deckId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="w-full">
      <label
        onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
        onDragLeave={() => setIsHovering(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-64 rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden",
          isHovering ? "border-gold bg-gold/5" : "border-border hover:border-gold/50 bg-surface/30",
          isUploading && "pointer-events-none opacity-80"
        )}
      >
        <input 
          type="file" 
          accept="application/pdf" 
          onChange={handleChange} 
          className="hidden" 
          disabled={isUploading}
        />
        
        {isUploading ? (
          <LoadingMessage 
            quote 
            messages={[
              "Uploading to Gemini...",
              "Reading your PDF...",
              "Distilling the concepts...",
              "Crafting your cards...",
              "Sharpening the edges...",
              "Almost there..."
            ]} 
          />
        ) : (
          <div className="flex flex-col items-center space-y-2 text-center p-6">
            <svg className="w-10 h-10 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg text-slate-200">Drop your PDF here or click to upload</p>
            <p className="text-sm text-slate-500">PDF up to 500MB supported</p>
          </div>
        )}
      </label>
      {error && <p className="mt-3 text-sm text-red-500 font-medium text-center">{error}</p>}
    </div>
  );
}
