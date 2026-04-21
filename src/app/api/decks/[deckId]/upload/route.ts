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
    
    // Step 1: Fetch PDF buffer
    const pdfResponse = await fetch(pdfUrl, { signal });
    const buffer = Buffer.from(await pdfResponse.arrayBuffer());

    // Step 2: Extract text using smart extraction
    const extraction = await extractTextFromPages(buffer, selectedPages);

    // Handle blocked case
    if (extraction.extractionMethod === "blocked") {
      await db.delete(decks).where(eq(decks.id, deckId));
      return NextResponse.json(
        { error: extraction.message },
        { status: 422 }
      );
    }

    // Handle empty extraction
    if (!extraction.text || extraction.text.length < 50) {
      await db.delete(decks).where(eq(decks.id, deckId));
      return NextResponse.json(
        { error: "Could not extract text from selected pages. PDF may be image-based or empty." },
        { status: 422 }
      );
    }

    // Step 3: Generate cards
    let result: { cards: any[]; provider: string; providerIndex: number; nextIndex: number | null } = { 
      cards: [], 
      provider: "", 
      providerIndex: 0, 
      nextIndex: null 
    };
    try {
      result = await generateCardsFromText(extraction.text, providerIndex);
    } catch (error: any) {
      if (error.message === "PROVIDER_FAILED") {
        const nextIndex = providerIndex + 1; // Basic fallback logic if library didn't provide one
        return NextResponse.json(
          { 
            error: "Current AI system is busy.", 
            nextIndex: nextIndex < 4 ? nextIndex : null,
            providerIndex 
          },
          { status: 503 }
        );
      }
      if (error.message === "NO_CARDS_GENERATED") {
        return NextResponse.json(
          { error: "Could not extract study content from this PDF." },
          { status: 422 }
        );
      }
      throw error;
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
