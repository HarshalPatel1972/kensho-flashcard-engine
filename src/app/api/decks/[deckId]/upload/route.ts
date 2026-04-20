import { db } from "@/db";
import { cards, cardProgress, decks } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { runUniversalAI } from "@/lib/ai";
import { del } from "@vercel/blob";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const p = await params;
    const deckId = p.deckId;
    
    // Verify deck belongs to user
    const [deck] = await db.select().from(decks).where(and(eq(decks.id, deckId), eq(decks.userId, userId)));
    if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });

    const body = await req.json();
    const { blobUrl } = body;
    if (!blobUrl) return NextResponse.json({ error: "No blob URL provided" }, { status: 400 });

    // Step 1: Fetch PDF from Vercel Blob
    const response = await fetch(blobUrl);
    const pdfBuffer = Buffer.from(await response.arrayBuffer());
    const base64Pdf = pdfBuffer.toString("base64");

    // Single high-speed prompt to stay under 10s Hobby timeout
    const prompt = `
      You are a master educator. Read this provided PDF. Generate 10-15 high-quality flashcards based on the material inside it.
      
      Rules:
      - Front: Concrete question.
      - Back: Concise answer.
      - Return ONLY a JSON array: [{"front": "...", "back": "..."}, ...]
      - No markdown, no preamble.
    `;

    // Feature: Universal AI Failover Engine (Google -> DeepSeek -> Groq)
    const { text: responseText } = await runUniversalAI(prompt, base64Pdf);
    
    // Step 2: Clean up storage immediately
    try {
      await del(blobUrl);
    } catch (e) {
      console.warn("Failed to delete blob:", blobUrl);
    }

    let generatedCards;
    try {
      generatedCards = JSON.parse(responseText);
    } catch (e) {
      console.error("Gemini failed to return valid JSON:", responseText);
      return NextResponse.json({ error: "AI failed to generate a valid study deck." }, { status: 500 });
    }

    if (!Array.isArray(generatedCards) || generatedCards.length === 0) {
      return NextResponse.json({ error: "No flashcards were generated." }, { status: 400 });
    }

    // Insert cards and progress in a batch
    const newCards = await db.insert(cards).values(
      generatedCards.slice(0, 20).map(c => ({
        deckId,
        front: String(c.front).substring(0, 500),
        back: String(c.back).substring(0, 500)
      }))
    ).returning();

    await db.insert(cardProgress).values(
      newCards.map(c => ({
        userId,
        cardId: c.id,
      }))
    );

    const newCount = (deck.cardCount ?? 0) + newCards.length;
    await db.update(decks).set({ cardCount: newCount }).where(eq(decks.id, deckId));

    return NextResponse.json({ deckId, cardCount: newCount, newCards: newCards.length });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process PDF" }, { status: 500 });
  }
}
