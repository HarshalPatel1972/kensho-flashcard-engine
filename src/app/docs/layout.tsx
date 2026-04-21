import { ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";

export const metadata = {
  title: "Documentation | Kenshō",
  description: "Master your study material with spaced repetition and AI-driven automation.",
};

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <AppLayout title="Documentation">
      {children}
    </AppLayout>
  );
}
