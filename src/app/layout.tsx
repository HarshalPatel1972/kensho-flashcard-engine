import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SettingsProvider } from "@/providers/SettingsProvider";
import { CookieBanner } from "@/components/CookieBanner";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kenshō — See through the noise",
  description: "Turn any PDF into a smart, spaced-repetition study deck.",
  icons: { icon: "/favicon.svg" }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: { colorPrimary: "var(--gold)" },
        elements: {
          card: "bg-surface border border-border/50",
          headerTitle: "text-primary",
          headerSubtitle: "text-secondary",
          formFieldLabel: "text-secondary",
          formFieldInput: "bg-bg border-border text-primary",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${outfit.className} bg-bg text-primary antialiased min-h-screen selection:bg-gold selection:text-black`}
        >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SettingsProvider>
              {children}
              <CookieBanner />
              <Toaster richColors position="top-right" />
            </SettingsProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
