"use client";

import { useRouter } from "next/navigation";
import { UploadZone } from "./UploadZone";

export function DeckDetailUpload({ deckId }: { deckId: string }) {
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
  };

  return <UploadZone deckId={deckId} onSuccess={handleSuccess} />;
}
