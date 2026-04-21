import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowRight, Settings } from "lucide-react";
import { AppPreferences } from "@/components/settings/AppPreferences";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/50 bg-bg/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-5xl">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-medium tracking-tight text-primary hover:opacity-80 transition-opacity">
              Kenshō
            </Link>
            <Link href="/docs" className="text-sm text-secondary hover:text-gold transition-colors">
              Docs
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserButton>
              <UserButton.UserProfilePage label="account" />
              <UserButton.UserProfilePage label="security" />
              <UserButton.UserProfilePage
                label="Settings"
                url="settings"
                labelIcon={<Settings size={16} />}
              >
                <AppPreferences />
              </UserButton.UserProfilePage>
            </UserButton>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {children}
        <div className="mt-20 pb-12 text-center">
          <Link 
            href="/docs" 
            className="text-xs text-secondary hover:text-gold transition-colors inline-flex items-center gap-1"
          >
            How Kenshō works 
            <span className="btn-arrow">
              <ArrowRight size={12} />
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
