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
                  playClick();
                  close();
                }}
                className="absolute top-6 right-6 w-8 h-8 rounded-full hover:bg-surface/80 flex items-center justify-center transition-colors z-[110]"
              >
                <X className="w-4 h-4 text-secondary" />
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
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold tracking-tight text-primary">Kenshō Experience</h2>
                        <p className="text-secondary mt-1">Tailor the interface to your study style.</p>
                      </div>
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
