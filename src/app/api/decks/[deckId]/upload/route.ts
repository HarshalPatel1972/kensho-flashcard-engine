import { db } from "@/db";
import { cards, cardProgress, decks } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `
  You are a master educator. Generate 10-15 high-quality flashcards based on the provided material.
  
  Rules:
  - Front: Concrete question.
  - Back: Concise answer.
  - Return ONLY a JSON array: [{"front": "...", "back": "..."}, ...]
  - No markdown, no preamble, no explanations.
`;

async function tryGemini(buffer: Buffer) {
  if (!process.env.GEMINI_API_KEY) throw new Error("No Gemini key");
  console.log("Attempting generation with Gemini...");

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "application/pdf",
        data: buffer.toString("base64")
      }
    },
    { text: SYSTEM_PROMPT }
  ]);

  return result.response.text();
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
    
    const [deck] = await db.select().from(decks).where(and(eq(decks.id, deckId), eq(decks.userId, userId)));
    if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });

    const { fileUrl } = await req.json();
    if (!fileUrl) return NextResponse.json({ error: "No PDF URL provided" }, { status: 400 });

    const pdfResponse = await fetch(fileUrl);
    if (!pdfResponse.ok) throw new Error("Failed to fetch PDF");
    const arrayBuffer = await pdfResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const responseText = await tryGemini(buffer);

    let generatedCards;
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/) || responseText.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : responseText;
      const parsed = JSON.parse(cleanJson);
      generatedCards = Array.isArray(parsed) ? parsed : (parsed.cards || parsed.flashcards || []);
    } catch (e) {
      console.error("AI response parse failed:", responseText);
      throw new Error("AI returned unreadable format");
    }

    if (!Array.isArray(generatedCards) || generatedCards.length === 0) {
      throw new Error("No cards generated");
    }

    const newCards = await db.insert(cards).values(
      generatedCards.slice(0, 30).map(c => ({
        deckId,
        front: String(c.front || c.question || "").substring(0, 500),
        back: String(c.back || c.answer || "").substring(0, 500)
      })).filter(c => c.front && c.back)
    ).returning();

    await db.insert(cardProgress).values(
      newCards.map(c => ({
        userId,
        cardId: c.id,
      }))
    );

    const newCount = (deck.cardCount ?? 0) + newCards.length;
    await db.update(decks).set({ cardCount: newCount }).where(eq(decks.id, deckId));

    return NextResponse.json({ success: true, newCards: newCards.length });
  } catch (error: any) {
    console.error("Processing Error:", error);
    
    let userMessage = "Something went wrong during generation.";
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      userMessage = "We've reached the AI limit for today. Please wait about a minute before trying again.";
    } else if (error.message?.includes("413") || error.message?.includes("too large")) {
      userMessage = "This PDF is too large for the AI to process. Please try a smaller file.";
    } else if (error.message?.includes("invalid") || error.message?.includes("JSON")) {
      userMessage = "The AI couldn't generate cards for this specific PDF. Is it a scanned image?";
    }

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
