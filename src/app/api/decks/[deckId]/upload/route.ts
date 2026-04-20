import { db } from "@/db";
import { cards, cardProgress, decks } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";


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
    if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: "File too large (Max 4MB for high-speed processing)" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Pdf = buffer.toString("base64");

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-3-flash-preview",
      "gemini-2.0-flash"
    ];

    // Single high-speed prompt to stay under 10s Hobby timeout
    const prompt = `
      You are a master educator. Read this provided PDF. Generate 10-15 high-quality flashcards based on the material inside it.
      
      Rules:
      - Front: Concrete question.
      - Back: Concise answer.
      - Return ONLY a JSON array: [{"front": "...", "back": "..."}, ...]
      - No markdown, no preamble.
    `;

    let responseText = "";
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting generation with model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Pdf,
              mimeType: "application/pdf"
            }
          }
        ]);
        
        responseText = result.response.text()
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        
        // If we got here without throwing and have text, break the fallback loop!
        if (responseText) {
          console.log(`Success with model: ${modelName}`);
          lastError = null;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed or is unavailable. Falling back...`, err.message);
        lastError = err;
        // Continue to the next model in the array
      }
    }

    if (lastError || !responseText) {
      throw lastError || new Error("All generative models failed to return a response.");
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
