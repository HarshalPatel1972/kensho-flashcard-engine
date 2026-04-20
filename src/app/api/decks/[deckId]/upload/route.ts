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

    const p = await params;
    const deckId = p.deckId;
    
    // Verify deck belongs to user
    const [deck] = await db.select().from(decks).where(and(eq(decks.id, deckId), eq(decks.userId, userId)));
    if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large (Max 10MB)" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Parse PDF
    const pdfData = await pdfParse(buffer);
    const rawText = pdfData.text.replace(/[\n\r]+/g, " ");

    const textChunks = chunkText(rawText);
    // Limit to first 3 chunks to prevent Vercel timeout/rate limits on Gemini free tier
    // In a production app, we might use a background job/webhook here.
    const chunksToProcess = textChunks.slice(0, 3);

    const generatedCards = [];
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    for (const text of chunksToProcess) {
      const prompt = `
  You are a master educator creating high-quality flashcards from study material.
  
  Given the following text from a PDF, generate between 5 and 10 flashcards (per chunk).
  
  Rules for great flashcards:
  - Cover key concepts, definitions, relationships, formulas, and important examples
  - Front: a clear, specific question or prompt (not vague)
  - Back: a concise but complete answer (1-3 sentences max)
  - Do NOT create trivial or obvious cards
  - Do NOT repeat the same concept with slightly different wording
  - Include edge cases and nuanced distinctions where they exist
  - Write as if a great teacher wrote these, not a bot
  
  Return ONLY a JSON array with no markdown, no preamble:
  [{"front": "...", "back": "..."}, ...]
  
  Text:
  ${text}
  `;

      try {
        let responseText = "";
        let retryCount = 0;
        let success = false;
        
        while (!success && retryCount < 2) {
          try {
            const result = await model.generateContent(prompt);
            responseText = result.response.text();
            
            // Clean markdown blocking (e.g. ```json ... ```)
            responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            
            const parsed = JSON.parse(responseText);
            if (Array.isArray(parsed)) {
              generatedCards.push(...parsed.filter(c => c.front && c.back));
              success = true;
            }
          } catch (e) {
            console.warn("JSON parse or generation failed, retrying...", e);
            retryCount++;
          }
        }
      } catch (e) {
        console.error("Gemini API error during chunk processing:", e);
      }
    }

    if (generatedCards.length === 0) {
      return NextResponse.json({ error: "Failed to generate any valid cards from this text." }, { status: 400 });
    }

    // Insert cards and progress records
    // Drizzle requires inserting in batches or one by one
    const newCards = await db.insert(cards).values(
      generatedCards.map(c => ({
        deckId,
        front: String(c.front).trim(),
        back: String(c.back).trim()
      }))
    ).returning();

    await db.insert(cardProgress).values(
      newCards.map(c => ({
        userId,
        cardId: c.id,
        // using defaults defined in schema
      }))
    );

    // Update deck counts
    const newCount = (deck.cardCount ?? 0) + newCards.length;
    await db.update(decks).set({ cardCount: newCount }).where(eq(decks.id, deckId));

    return NextResponse.json({ deckId, cardCount: newCount, newCards: newCards.length });
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json({ error: "Failed to process PDF" }, { status: 500 });
  }
}
