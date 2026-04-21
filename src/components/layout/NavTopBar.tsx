"use client";

import { UserButton, SignedIn } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Settings, Menu } from "lucide-react";
import { AppPreferences } from "@/components/settings/AppPreferences";
import { useKenshoSounds } from "@/hooks/use-kensho-sounds";

interface NavTopBarProps {
  title?: string;
  onMenuClick?: () => void;
}

export function NavTopBar({ title = "Kenshō Dashboard", onMenuClick }: NavTopBarProps) {
  const { playHover } = useKenshoSounds();

  return (
    <header className="sticky top-0 z-50 h-20 shrink-0 flex items-center px-6 md:px-8 bg-bg/60 backdrop-blur-xl border-b border-border/40">
      <div className="flex-1 flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuClick}
          className="md:hidden w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center hover:bg-surface/80"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-primary">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        <ThemeToggle />
        
        <div onMouseEnter={() => playHover()}>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 rounded-xl border-2 border-border/50 hover:border-gold/50 transition-colors shadow-sm",
                  card: "bg-surface border border-border/50 backdrop-blur-xl",
                }
              }}
            >
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
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
