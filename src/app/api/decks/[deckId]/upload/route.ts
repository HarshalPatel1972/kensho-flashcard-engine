import { db } from "@/db";
import { cards, cardProgress, decks } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { extractTextFromPages } from "@/lib/pdf-extract";
import { generateCardsFromText } from "@/lib/generate-cards";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ deckId: string }> }) {
  const { signal } = req;
  const p = await params;
  const deckId = p.deckId;

  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [deck] = await db.select().from(decks).where(and(eq(decks.id, deckId), eq(decks.userId, userId)));
    if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });

    const { pdfUrl, selectedPages, providerIndex = 0 } = await req.json();
    
    let result: { cards: any[]; provider: string; providerIndex: number; nextIndex: number | null } = { 
      cards: [], 
      provider: "", 
      providerIndex: 0, 
      nextIndex: null 
    };

    const backendUrl = process.env.KENSHO_BACKEND_URL;
    if (backendUrl) {
      console.log(`[Proxy] Outsourcing task to Go Backend: ${backendUrl}`);
      try {
        const goRes = await fetch(`${backendUrl}/v1/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdfUrl, selectedPages, providerIndex }),
          signal
        });
        const goData = await goRes.json();
        if (!goRes.ok) {
          return NextResponse.json(goData, { status: goRes.status });
        }
        result = goData;
      } catch (err: any) {
        console.error("[Proxy Error] Go Backend unreachable:", err.message);
        // Fallback to local if Go fails? For now, let's just fail or continue to local.
        // I'll fall through to local logic for safety.
      }
    }

    // Only run local logic if Go backend result is empty (was not used or failed)
    if (result.cards.length === 0) {
      // Step 1: Fetch PDF buffer
      const pdfResponse = await fetch(pdfUrl, { signal });
      const buffer = Buffer.from(await pdfResponse.arrayBuffer());

      // Step 2: Extract text using smart extraction
      const extraction = await extractTextFromPages(buffer, selectedPages);

      // Handle blocked case
      if (extraction.extractionMethod === "blocked") {
        await db.delete(decks).where(eq(decks.id, deckId));
        return NextResponse.json({ error: extraction.message }, { status: 422 });
      }

      // Handle empty extraction
      if (!extraction.text || extraction.text.length < 50) {
        await db.delete(decks).where(eq(decks.id, deckId));
        return NextResponse.json({ error: "Could not extract text from selected pages." }, { status: 422 });
      }

      // Step 3: Generate cards via Local Node AI
      try {
        result = await generateCardsFromText(extraction.text, providerIndex);
      } catch (error: any) {
        if (error.message === "PROVIDER_FAILED") {
          const nextIndex = providerIndex + 1;
          return NextResponse.json({ error: "Current AI system is busy.", nextIndex: nextIndex < 4 ? nextIndex : null, providerIndex }, { status: 503 });
        }
        throw error;
      }
    }

    const cardsToInsert = result.cards.slice(0, 40).map((c: any) => ({
      deckId,
      front: String(c.front || c.question || "").substring(0, 500),
      back: String(c.back || c.answer || "").substring(0, 500)
    })).filter((c: any) => c.front && c.back);

    if (cardsToInsert.length > 0) {
      const newCards = await db.insert(cards).values(cardsToInsert).returning();
      
      if (newCards.length > 0) {
        await db.insert(cardProgress).values(newCards.map(c => ({ userId, cardId: c.id })));
      }
    }
    
    await db.update(decks)
      .set({ cardCount: (deck.cardCount ?? 0) + cardsToInsert.length })
      .where(eq(decks.id, deckId));

    return NextResponse.json({ 
      success: true, 
      newCards: cardsToInsert.length,
      provider: result.provider 
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      if (deckId) {
        try {
          await db.delete(decks).where(eq(decks.id, deckId));
        } catch (cleanupError) {
          console.error("Cleanup failed:", cleanupError);
        }
      }
      return NextResponse.json({ cancelled: true }, { status: 499 });
    }
    console.error("Upload error:", err);
    const message = err.message || "An unexpected error occurred.";
    const isSafeMessage = message.includes("AI engines") || message.includes("AI output") || message.includes("Unauthorized") || message.includes("not found");
    return NextResponse.json({ error: isSafeMessage ? message : "Servers are currently experiencing heavy load. Please try again." }, { status: 500 });
  }
}
