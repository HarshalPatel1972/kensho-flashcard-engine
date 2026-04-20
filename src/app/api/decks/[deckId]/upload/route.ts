import { db } from "@/db";
import { cards, cardProgress, decks } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

    // Step 1: Receive the PDF URL from UploadThing
    const { fileUrl } = await req.json();
    if (!fileUrl) return NextResponse.json({ error: "No PDF URL provided" }, { status: 400 });

    // Step 2: Fetch the PDF as a buffer
    const pdfResponse = await fetch(fileUrl);
    if (!pdfResponse.ok) throw new Error("Failed to fetch PDF from UploadThing");
    const arrayBuffer = await pdfResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 3: Pass base64 data to Gemini for card generation
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      You are a master educator. Read this provided PDF. Generate 10-15 high-quality flashcards based on the material inside it.
      
      Rules:
      - Front: Concrete question.
      - Back: Concise answer.
      - Return ONLY a JSON array: [{"front": "...", "back": "..."}, ...]
      - No markdown, no preamble.
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: buffer.toString("base64")
        }
      },
      { text: prompt }
    ]);

    const responseText = result.response.text();

    let generatedCards;
    try {
      // Find JSON array in case there's preamble (safety)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      const cleanJson = jsonMatch ? jsonMatch[0] : responseText;
      generatedCards = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Gemini failed to return valid JSON:", responseText);
      return NextResponse.json({ error: "AI failed to generate a valid study deck." }, { status: 500 });
    }

    if (!Array.isArray(generatedCards) || generatedCards.length === 0) {
      return NextResponse.json({ error: "No flashcards were generated." }, { status: 400 });
    }

    // Step 4: Insert cards and progress
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
