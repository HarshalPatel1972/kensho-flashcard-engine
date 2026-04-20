import { db } from "@/db";
import { cards, cardProgress, decks } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function constructMultipartBody(buffer: Buffer, filename: string): Buffer {
  const metadataPart = Buffer.from(
    "--BOUNDARY\r\n" +
    "Content-Type: application/json\r\n\r\n" +
    JSON.stringify({ file: { display_name: filename } }) +
    "\r\n"
  );
  const filePart = Buffer.from(
    "--BOUNDARY\r\n" +
    "Content-Type: application/pdf\r\n\r\n"
  );
  const closing = Buffer.from("\r\n--BOUNDARY--");
  return Buffer.concat([metadataPart, filePart, buffer, closing]);
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

    // Step 1: Receive the PDF as FormData
    const formData = await req.formData();
    const file = formData.get("pdf") as File;
    if (!file) return NextResponse.json({ error: "No PDF provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Step 2: Upload to Google Files API
    const uploadResponse = await fetch(
      "https://generativelanguage.googleapis.com/upload/v1beta/files",
      {
        method: "POST",
        headers: {
          "X-Goog-Upload-Protocol": "multipart",
          "X-Goog-Api-Key": process.env.GEMINI_API_KEY!,
          "Content-Type": `multipart/related; boundary=BOUNDARY`
        },
        body: new Blob([constructMultipartBody(buffer, file.name) as any])
      }
    );

    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text();
      throw new Error(`Google Files API upload failed: ${errText}`);
    }

    const { file: uploadedFile } = await uploadResponse.json();
    const fileUri = uploadedFile.uri;

    // Step 3: Pass fileUri to Gemini for card generation
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
        fileData: {
          mimeType: "application/pdf",
          fileUri: fileUri
        }
      },
      { text: prompt }
    ]);

    const responseText = result.response.text();

    // Step 4: Delete the file from Google after generation (cleanup)
    try {
      await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${uploadedFile.name}`,
        {
          method: "DELETE",
          headers: { "X-Goog-Api-Key": process.env.GEMINI_API_KEY! }
        }
      );
    } catch (e) {
      console.warn("Failed to delete Gemini file:", uploadedFile.name);
    }

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

    // Step 5: Insert cards and progress
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
