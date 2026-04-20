import { db } from "@/db";
import { cards, cardProgress, decks } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as pdfParseModule from "pdf-parse";
const pdfParse = (pdfParseModule as any).default || pdfParseModule;

// Increase max duration for Vercel Hobby tier (max 60s)
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function chunkText(text: string, chunkSize = 1500, overlap = 200) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return chunks;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not defined in environment variables");
      return NextResponse.json({ error: "Server configuration error: Gemini API key missing" }, { status: 500 });
    }

    const p = await params;
    const deckId = p.deckId;
    
    // Verify deck belongs to user
    const [deck] = await db.select().from(decks).where(and(eq(decks.id, deckId), eq(decks.userId, userId)));
    if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large (Max 10MB)" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Parse PDF
    const pdfData = await pdfParse(buffer);
    const rawText = (pdfData.text || "").replace(/[\n\r]+/g, " ").substring(0, 10000); // Limit context for speed

    if (!rawText.trim()) {
      return NextResponse.json({ error: "PDF appears to be empty or unreadable text." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Single high-speed prompt to stay under 10s Hobby timeout
    const prompt = `
      You are a master educator. Generate 10-15 high-quality flashcards from this text study material.
      
      Rules:
      - Front: Concrete question.
      - Back: Concise answer.
      - Return ONLY a JSON array: [{"front": "...", "back": "..."}, ...]
      - No markdown, no preamble.
      
      Text:
      ${rawText}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

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
