import { LoadingMessage } from "@/components/LoadingMessage";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <LoadingMessage 
        messages={[
          "Loading your decks...",
          "Checking what's due today..."
        ]} 
      />
    </div>
  );
}
