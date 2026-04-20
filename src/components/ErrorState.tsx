"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

type ErrorStateProps = {
  title: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-medium text-primary mb-2">{title}</h2>
      <p className="text-secondary max-w-xs mb-8">{message}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-md bg-surface border border-border px-6 py-2.5 text-sm font-medium text-primary hover:bg-bg transition-colors active:scale-95"
        >
          <RefreshCcw className="w-4 h-4" />
          Try again
        </button>
      )}
    </div>
  );
}
