"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowRight, Settings } from "lucide-react";
import { AppPreferences } from "@/components/settings/AppPreferences";

import { NavSidebar } from "@/components/layout/NavSidebar";
import { NavTopBar } from "@/components/layout/NavTopBar";
import { useState } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Sidebar - Desktop Only (Fixed) */}
      <NavSidebar />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <NavTopBar onMenuClick={() => setIsMobileMenuOpen(true)} />
        
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
          <div className="max-w-5xl mx-auto">
            {children}
            
            <div className="mt-20 pb-12 text-center">
              <Link 
                href="/docs" 
                className="px-6 py-3 text-sm btn-kensho-3d-secondary inline-flex items-center gap-1"
              >
                How Kenshō works 
                <span className="btn-arrow ml-1">
                  <ArrowRight size={14} />
                </span>
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay (Mobile Drawer TBD or simple toggle) */}
      {/* ... Add Mobile Drawer implementation if needed ... */}
    </div>
  );
}
