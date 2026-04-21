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
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-[1000px] h-full max-h-[700px] bg-bg shadow-2xl rounded-2xl overflow-hidden pointer-events-auto relative border border-border/40"
            >
              {/* Close button as seen in standard Clerk modals */}
              <button
                onClick={() => {
                  playClick();
                  close();
                }}
                className="absolute top-4 right-4 w-10 h-10 rounded-full hover:bg-surface/80 flex items-center justify-center transition-colors z-50 border border-border/20"
              >
                <X className="w-5 h-5 text-secondary" />
              </button>

              <div className="w-full h-full overflow-hidden">
                <UserProfile 
                  routing="hash"
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
                    <div className="p-4 md:p-8">
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold tracking-tight text-primary">Kenshō Experience</h2>
                        <p className="text-secondary mt-1">Tailor the interface to your study style.</p>
                      </div>
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
