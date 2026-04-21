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
  - Return ONLY a valid JSON object with a "flashcards" array property: {"flashcards": [{"front": "...", "back": "..."}, ...]}
  - No markdown, no preamble, no explanations.
`;

async function tryGroq(text: string, signal?: AbortSignal) {
  if (!process.env.GROQ_API_KEY) throw new Error("No Groq key");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    signal,
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Context:\n${text.substring(0, 30000)}\n\nGenerate flashcards now.` }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function tryHuggingFace(text: string, signal?: AbortSignal) {
  if (!process.env.HUGGING_FACE_API_KEY) throw new Error("No HF key");
  const res = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}` },
    signal,
    body: JSON.stringify({
      model: "mistralai/Mistral-7B-Instruct-v0.3",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Context:\n${text.substring(0, 5000)}\n\nGenerate flashcards now.` }
      ],
      max_tokens: 1000,
      temperature: 0.3
    }),
  });
  if (!res.ok) throw new Error(`HF ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function tryGeminiMultimodal(buffer: Buffer, signal?: AbortSignal) {
  if (!process.env.GEMINI_API_KEY) throw new Error("No Gemini key");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const result = await model.generateContent([
    { inlineData: { mimeType: "application/pdf", data: buffer.toString("base64") } },
    { text: SYSTEM_PROMPT }
  ]);
  return result.response.text();
}

async function tryGeminiText(text: string, signal?: AbortSignal) {
  if (!process.env.GEMINI_API_KEY) throw new Error("No Gemini key");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    { text: `Context:\n${text.substring(0, 30000)}\n\nGenerate flashcards now.` }
  ]);
  return result.response.text();
}

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

    let pdfText = "";
    try {
      const data = await pdf(buffer);
      pdfText = data.text;
    } catch (e) {
      console.warn("Local PDF extraction failed, trying Gemini Reader...", e);
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const result = await model.generateContent([
          { inlineData: { mimeType: "application/pdf", data: buffer.toString("base64") } },
          { text: "Extract content for flashcards." }
        ]);
        pdfText = result.response.text();
      } catch (e2) {
        console.error("All text extraction failed.", e2);
      }
    }

    let responseText = "";
    if (pdfText) {
      try { responseText = await tryGroq(pdfText, signal); } catch (e) {
        try { responseText = await tryHuggingFace(pdfText, signal); } catch (e2) {
          try { responseText = await tryGeminiText(pdfText, signal); } catch (e3) {
            console.warn("Retrying with Gemini Multimodal...");
          }
        }
      }
    }

    if (!responseText) {
      try {
        responseText = await tryGeminiMultimodal(buffer, signal);
      } catch (e) {
        throw new Error("All AI engines are temporarily exhausted. Please try again soon.");
      }
    }

    let cardsData;
    try {
      // 1. Strip markdown wrapper
      let cleanText = responseText.replace(/```(json)?\n?/g, '').trim();

      // 2. Try parsing straight away
      let parsed;
      try {
        parsed = JSON.parse(cleanText);
      } catch {
        // 3. Fallback: extract the JSON bounds via indexOf
        const startObj = cleanText.indexOf('{');
        const endObj = cleanText.lastIndexOf('}');
        const startArr = cleanText.indexOf('[');
        const endArr = cleanText.lastIndexOf(']');
        
        let possibleJsons = [];
        if (startObj !== -1 && endObj > startObj) possibleJsons.push(cleanText.substring(startObj, endObj + 1));
        if (startArr !== -1 && endArr > startArr) possibleJsons.push(cleanText.substring(startArr, endArr + 1));
        
        const validMatch = possibleJsons.sort((a, b) => b.length - a.length)[0];
        if (!validMatch) throw new Error("No JSON boundaries found");
        parsed = JSON.parse(validMatch);
      }

      // 4. Resolve the array
      cardsData = Array.isArray(parsed) ? parsed : (parsed.cards || parsed.flashcards || []);
      
      // Fallback property search
      if (!Array.isArray(cardsData) && typeof Object.keys(parsed) !== 'undefined') {
        const foundArr = Object.values(parsed).find(Array.isArray);
        if (foundArr) cardsData = foundArr;
      }
      
      if (!Array.isArray(cardsData)) throw new Error("Parsed JSON did not contain an array");
    } catch (e) {
      console.error("AI output parsing failed:", e, responseText.substring(0, 100));
      throw new Error("AI output was invalid. Please retry.");
    }

    const cardsToInsert = cardsData.slice(0, 30).map((c: any) => ({
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
    if (deckId) {
      try {
        await db.delete(decks).where(eq(decks.id, deckId));
      } catch (cleanupError) {
        console.error("Cleanup failed:", cleanupError);
      }
    }
    if (err.name === 'AbortError') {
      return NextResponse.json({ cancelled: true }, { status: 499 });
    }
    console.error("Upload error:", err);
    // Sanitize DB or other unknown technical errors
    const message = err.message || "An unexpected error occurred.";
    const isSafeMessage = message.includes("AI engines") || message.includes("AI output") || message.includes("Unauthorized") || message.includes("not found");
    return NextResponse.json({ error: isSafeMessage ? message : "Servers are currently experiencing heavy load. Please try again." }, { status: 500 });
  }
}
