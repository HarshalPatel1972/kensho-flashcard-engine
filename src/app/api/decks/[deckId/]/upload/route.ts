import { db } from "@/db";
import { cards, cardProgress, decks } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
// @ts-ignore
import pdf from "pdf-parse";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `
  You are a master educator. Generate 10-15 high-quality flashcards based on the provided material.
  
  Rules:
  - Front: Concrete question.
  - Back: Concise answer.
  - Return ONLY a JSON array: [{"front": "...", "back": "..."}, ...]
  - No markdown, no preamble, no explanations.
`;

async function tryGroq(text: string) {
  if (!process.env.GROQ_API_KEY) throw new Error("No Groq key");
  console.log("Attempting generation with Groq...");
  
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-specdec",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Context:\n${text.substring(0, 30000)}\n\nGenerate flashcards now.` }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Groq failed: ${JSON.stringify(error)}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content;
  // Groq with json_object might wrap it in a root key or just the array if we are lucky.
  // We'll parse it below.
  return content;
}

async function tryDeepSeek(text: string) {
  if (!process.env.DEEPSEEK_API_KEY) throw new Error("No DeepSeek key");
  console.log("Attempting generation with DeepSeek...");

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Context:\n${text.substring(0, 30000)}\n\nGenerate flashcards now.` }
      ],
      temperature: 0.3
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`DeepSeek failed: ${JSON.stringify(error)}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function tryGemini(buffer: Buffer) {
  if (!process.env.GEMINI_API_KEY) throw new Error("No Gemini key");
  console.log("Attempting generation with Gemini (Fallback)...");

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

    // Extract text for Groq/DeepSeek
    let pdfText = "";
    try {
      const pdfData = await pdf(buffer);
      pdfText = pdfData.text;
    } catch (e) {
      console.warn("PDF text extraction failed, will skip to Gemini", e);
    }

    let responseText = "";
    let lastError = "";

    // FALLBACK CHAIN: GROQ -> DEEPSEEK -> GEMINI
    if (pdfText) {
      try {
        responseText = await tryGroq(pdfText);
      } catch (e: any) {
        console.warn("Groq failed:", e.message);
        lastError = e.message;
        try {
          responseText = await tryDeepSeek(pdfText);
        } catch (e2: any) {
          console.warn("DeepSeek failed:", e2.message);
          lastError = e2.message;
        }
      }
    }

    // If still no response (failed Groq/DeepSeek or no text), try Gemini
    if (!responseText) {
      try {
        responseText = await tryGemini(buffer);
      } catch (e3: any) {
        console.error("Gemini failed too:", e3.message);
        return NextResponse.json({ 
          error: "All AI models are currently busy or reached their quota. Please try again in 1 minute.",
          details: e3.message 
        }, { status: 503 });
      }
    }

    let generatedCards;
    try {
      // Find JSON array or object
      const jsonMatch = responseText.match(/\[[\s\S]*\]/) || responseText.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : responseText;
      const parsed = JSON.parse(cleanJson);
      
      // Handle cases where model returns { "cards": [...] } instead of just [...]
      generatedCards = Array.isArray(parsed) ? parsed : (parsed.cards || parsed.flashcards || []);
    } catch (e) {
      console.error("Failed to parse AI response:", responseText);
      return NextResponse.json({ error: "AI returned an unreadable response format." }, { status: 500 });
    }

    if (!Array.isArray(generatedCards) || generatedCards.length === 0) {
      return NextResponse.json({ error: "No flashcards were generated." }, { status: 400 });
    }

    const newCards = await db.insert(cards).values(
      generatedCards.slice(0, 30).map(c => ({
        deckId,
        front: String(c.front || c.question || "").substring(0, 500),
        back: String(c.back || c.answer || "").substring(0, 500)
      })).filter(c => c.front && c.back)
    ).returning();

    if (newCards.length === 0) {
      return NextResponse.json({ error: "Flashcards were empty or invalid." }, { status: 400 });
    }

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
    return NextResponse.json({ error: error.message || "Internal processing error" }, { status: 500 });
  }
}
