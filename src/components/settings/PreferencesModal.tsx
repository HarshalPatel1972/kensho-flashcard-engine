"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useSettingsModal } from "@/hooks/use-settings-modal";
import { AppPreferences } from "./AppPreferences";
import { useKenshoSounds } from "@/hooks/use-kensho-sounds";

export function PreferencesModal() {
  const { isOpen, close } = useSettingsModal();
  const { playClick } = useKenshoSounds();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] cursor-pointer"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-surface border border-border/50 shadow-2xl rounded-3xl overflow-hidden pointer-events-auto relative sidebar-glass"
            >
              {/* Header */}
              <div className="p-6 border-b border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-3 text-gold">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                    <span className="font-bold text-lg">見</span>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-primary">Preferences</h2>
                </div>
                <button
                  onClick={() => {
                    playClick();
                    close();
                  }}
                  className="w-10 h-10 rounded-full hover:bg-surface/80 flex items-center justify-center transition-colors border border-border/40"
                >
                  <X className="w-5 h-5 text-secondary" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <AppPreferences />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
