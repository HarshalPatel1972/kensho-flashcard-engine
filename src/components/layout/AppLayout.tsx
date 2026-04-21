"use client";

import { ReactNode, useState } from "react";
import { NavSidebar } from "./NavSidebar";
import { NavTopBar } from "./NavTopBar";
import { NavMobileDrawer } from "./NavMobileDrawer";
import { PreferencesModal } from "../settings/PreferencesModal";
import { useSettingsModal } from "@/hooks/use-settings-modal";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Sidebar - Desktop Only (Fixed) */}
      <NavSidebar />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <NavTopBar 
          title={title} 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
        />
        
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Modals & Overlays */}
      <PreferencesModal />
      
      <NavMobileDrawer 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </div>
  );
}
