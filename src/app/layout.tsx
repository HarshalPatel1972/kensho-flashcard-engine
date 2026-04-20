import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

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
          headerTitle: "text-slate-100",
          headerSubtitle: "text-slate-400",
          formFieldLabel: "text-slate-300",
          formFieldInput: "bg-bg border-border text-slate-100",
        },
      }}
    >
      <html lang="en" className="dark">
        <body
          className={`${outfit.className} bg-bg text-slate-100 antialiased min-h-screen selection:bg-gold/30 selection:text-gold`}
        >
          {children}
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
