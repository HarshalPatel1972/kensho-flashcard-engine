"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Home, Library, BookOpen, PlusCircle, Sparkles } from "lucide-react";
import { useKenshoSounds } from "@/hooks/use-kensho-sounds";
import { cn } from "@/lib/utils";

interface NavMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: Library, label: "Decks", href: "/dashboard" },
  { icon: BookOpen, label: "Docs", href: "/docs" },
];

export function NavMobileDrawer({ isOpen, onClose }: NavMobileDrawerProps) {
  const pathname = usePathname();
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
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-[280px] bg-bg border-r border-border z-[101] md:hidden flex flex-col"
          >
            <div className="h-20 flex items-center justify-between px-6 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center shadow-gold-glow">
                  <Sparkles className="w-5 h-5 text-black fill-black" />
                </div>
                <span className="font-bold tracking-tight">Kenshō</span>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-8 space-y-2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => {
                      playClick();
                      onClose();
                    }}
                    className={cn(
                      "relative flex items-center gap-4 px-5 py-4 rounded-lg transition-all duration-200",
                      isActive ? "nav-item-active font-bold" : "text-secondary hover:bg-surface/50"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
