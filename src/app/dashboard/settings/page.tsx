"use client";

import { UserProfile } from "@clerk/nextjs";
import { Settings } from "lucide-react";
import { AppPreferences } from "@/components/settings/AppPreferences";
import { PageTransition } from "@/components/PageTransition";

export default function SettingsPage() {
  return (
    <PageTransition>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Workstation Preferences</h1>
          <p className="text-secondary mt-2">Manage your account and tailor the Kenshō experience.</p>
        </header>

        <div className="rounded-3xl border border-border/40 overflow-hidden bg-surface shadow-xl min-h-[600px]">
          <UserProfile 
            path="/dashboard/settings" 
            routing="path"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "w-full shadow-none bg-transparent border-none",
                navbar: "bg-surface-secondary border-r border-border/30",
                scrollBox: "bg-surface",
                pageScrollBox: "p-8 md:p-12",
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
              <AppPreferences />
            </UserProfile.Page>
          </UserProfile>
        </div>
      </div>
    </PageTransition>
  );
}
