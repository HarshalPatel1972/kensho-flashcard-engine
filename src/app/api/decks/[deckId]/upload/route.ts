import { db } from "@/db";
import { cards, cardProgress, decks } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { extractTextFromPDF } from "@/lib/pdf-extract";
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

    const { fileUrl } = await req.json();
    const pdfResponse = await fetch(fileUrl, { signal });
    const buffer = Buffer.from(await pdfResponse.arrayBuffer());

    // Step 2: Extract text
    const text = await extractTextFromPDF(buffer);
    const wordCount = text.split(/\s+/).length;
    console.log(`[PDFExtract] Extracted ${text.length} chars (~${wordCount} words) from deck ${deckId}`);
    
    if (text.length < 100) {
      return NextResponse.json(
        { error: "PDF appears to be image-based or empty. Please use a text PDF." },
        { status: 422 }
      );
    }

    // Step 3: Generate cards via chunked pipeline
    let cardsData: { front: string; back: string }[] = [];
    try {
      cardsData = await generateCardsFromText(text);
    } catch (error: any) {
      if (error.message === "ALL_PROVIDERS_FAILED") {
        return NextResponse.json(
          { error: "All AI providers are busy. Please try again in a minute." },
          { status: 503 }
        );
      }
      if (error.message === "NO_CARDS_GENERATED" || error.message === "TOO_MANY_CHUNK_FAILURES") {
        return NextResponse.json(
          { error: "Could not extract study content from this PDF." },
          { status: 422 }
        );
      }
      throw error;
    }

    const cardsToInsert = cardsData.slice(0, 40).map((c: any) => ({
      deckId,
      front: String(c.front || c.question || "").substring(0, 500),
      back: String(c.back || c.answer || "").substring(0, 500)
    })).filter((c: any) => c.front && c.back);

    await db.transaction(async (tx) => {
      if (cardsToInsert.length > 0) {
        const newCards = await tx.insert(cards).values(cardsToInsert).returning();
        await tx.insert(cardProgress).values(newCards.map(c => ({ userId, cardId: c.id })));
      }
      await tx.update(decks).set({ cardCount: (deck.cardCount ?? 0) + cardsToInsert.length }).where(eq(decks.id, deckId));
    });

    return NextResponse.json({ success: true, newCards: cardsToInsert.length });
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
    // Sanitize DB or other unknown technical errors
    const message = err.message || "An unexpected error occurred.";
    const isSafeMessage = message.includes("AI engines") || message.includes("AI output") || message.includes("Unauthorized") || message.includes("not found");
    return NextResponse.json({ error: isSafeMessage ? message : "Servers are currently experiencing heavy load. Please try again." }, { status: 500 });
  }
}
