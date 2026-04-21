import { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AppLayout title="Dashboard">
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
    </AppLayout>
  );
}
