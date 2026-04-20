import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kenshō | See through the noise",
  description: "Turn any PDF into a smart study deck. Review what matters, when it matters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: { colorPrimary: "#f5a623" },
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
          className={`${outfit.className} bg-bg text-primary antialiased min-h-screen selection:bg-gold/30 selection:text-gold`}
        >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
