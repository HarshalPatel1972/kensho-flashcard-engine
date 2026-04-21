"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  Library, 
  BookOpen, 
  Settings, 
  ChevronLeft, 
  PlusCircle,
  Sparkles
} from "lucide-react";
import { useKenshoSounds } from "@/hooks/use-kensho-sounds";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: BookOpen, label: "Docs", href: "/docs" },
];

export function NavSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { playClick, playHover } = useKenshoSounds();

  // Handle auto-collapse on tablet
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsCollapsed(true);
      else setIsCollapsed(false);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleCollapse = () => {
    playClick();
    setIsCollapsed(!isCollapsed);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 84 : 260 }}
      className="hidden md:flex flex-col h-screen sticky top-0 z-[60] sidebar-glass relative shrink-0 transition-all duration-300"
    >
      {/* Collapse Toggle - Floating Arrow */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-10"
      >
        <ChevronLeft className={cn("w-4 h-4 transition-transform", isCollapsed && "rotate-180")} />
      </button>

      {/* Logo Section */}
      <div className="h-24 flex items-center px-6 overflow-hidden">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          onMouseEnter={() => playHover()}
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-gold/20">
            <img src="/favicon.svg" alt="Kenshō Logo" className="w-full h-full object-cover" />
          </div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-xl font-bold tracking-tight text-primary whitespace-nowrap"
              >
                Kenshō
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 py-8 space-y-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => playClick()}
              onMouseEnter={() => playHover()}
              className={cn(
                "relative group flex items-center gap-4 px-4 py-3 rounded-full transition-all duration-200",
                isActive ? "nav-item-active" : "text-secondary hover:bg-surface/50"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-gold" : "text-secondary")} />
              
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="font-medium whitespace-nowrap block"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings at Bottom */}
      <div className="p-4 mt-auto border-t border-border/30">
        <Link
          href="/dashboard?settings=true"
          onClick={() => playClick()}
          onMouseEnter={() => playHover()}
          className="relative group flex items-center gap-4 px-4 py-3.5 rounded-full text-secondary hover:bg-surface/50 transition-all duration-200"
        >
          <Settings className="w-5 h-5 shrink-0" />
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="font-medium whitespace-nowrap block"
                >
                  Preferences
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </Link>
      </div>
    </motion.aside>
  );
}
