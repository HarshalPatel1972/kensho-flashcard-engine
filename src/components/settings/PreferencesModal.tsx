"use client";

import { motion, AnimatePresence } from "framer-motion";
import { UserProfile } from "@clerk/nextjs";
import { Settings, X } from "lucide-react";
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
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] cursor-pointer"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              className="w-full max-w-[1100px] h-full max-h-[750px] bg-surface shadow-2xl rounded-3xl overflow-hidden pointer-events-auto relative border border-border/50"
            >
              <button
                onClick={() => {
                  playClick();
                  close();
                }}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface/80 hover:bg-surface border border-border/40 backdrop-blur-md flex items-center justify-center transition-all z-50 hover:scale-110 active:scale-95"
              >
                <X className="w-5 h-5 text-secondary" />
              </button>

              <div className="w-full h-full">
                <UserProfile 
                  appearance={{
                    elements: {
                      rootBox: "w-full h-full",
                      card: "w-full h-full shadow-none bg-transparent border-none",
                      navbar: "bg-surface-secondary border-r border-border/30",
                      scrollBox: "bg-surface h-full",
                    }
                  }}
                >
                  <UserProfile.Page label="account" />
                  <UserProfile.Page label="security" />
                  <UserProfile.Page
                    label="Settings"
                    url="settings"
                    labelIcon={<Settings size={16} />}
                  >
                    <div className="p-8">
                      <AppPreferences />
                    </div>
                  </UserProfile.Page>
                </UserProfile>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
