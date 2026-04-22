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
          {/* Official Clerk Backdrop Style */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] cursor-pointer"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative shadow-2xl rounded-2xl overflow-hidden pointer-events-auto border border-border/20 bg-surface"
            >
              {/* Close Button - Absolutely positioned Relative to the Component root */}
              <button
                onClick={() => {
                  close();
                }}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-surface/80 border border-border/40 backdrop-blur-md flex items-center justify-center hover:bg-surface hover:scale-105 active:scale-95 transition-all z-[110] shadow-sm"
              >
                <X className="w-5 h-5 text-primary" />
              </button>

              <UserProfile 
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none bg-transparent border-none m-0",
                    navbar: "bg-surface-secondary border-r border-border/30",
                    scrollBox: "bg-surface",
                    pageScrollBox: "p-8 md:p-12",
                  }
                }}
              >
                  <UserProfile.Page
                    label="Settings"
                    url="settings"
                    labelIcon={<Settings size={16} />}
                  >
                    <div className="p-4 md:p-8">
                      <AppPreferences />
                    </div>
                  </UserProfile.Page>
                  <UserProfile.Page label="account" />
                  <UserProfile.Page label="security" />
                </UserProfile>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
