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

  if (!res.ok) throw new Error(`Groq failed: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
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

  if (!res.ok) throw new Error(`DeepSeek failed: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function tryHuggingFace(text: string) {
  if (!process.env.HUGGING_FACE_API_KEY) throw new Error("No HF key");
  console.log("Attempting generation with Hugging Face...");

  const res = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
    },
    body: JSON.stringify({
      inputs: `<s>[INST] ${SYSTEM_PROMPT}\n\nContext:\n${text.substring(0, 5000)} [/INST]`,
      parameters: { max_new_tokens: 1000, temperature: 0.3 }
    }),
  });

  if (!res.ok) throw new Error(`HF failed: ${res.status}`);
  const data = await res.json();
  // HF returns text directly or in an array
  return Array.isArray(data) ? data[0].generated_text : (data.generated_text || "");
}

async function tryGemini(buffer: Buffer, prompt: string = SYSTEM_PROMPT) {
  if (!process.env.GEMINI_API_KEY) throw new Error("No Gemini key");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent([
    { inlineData: { mimeType: "application/pdf", data: buffer.toString("base64") } },
    { text: prompt }
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
    const buffer = Buffer.from(await pdfResponse.arrayBuffer());

    let responseText = "";
    let extractionError = "";

    // 1. Extract Text using Gemini (Fastest, build-safe, handles huge files)
    let pdfText = "";
    try {
      console.log("Extracting text with Gemini...");
      pdfText = await tryGemini(buffer, "Extract all the core text/educational content from this PDF. Return ONLY the plain text.");
    } catch (e: any) {
      extractionError = e.message;
      console.warn("Gemini Extraction failed, will try multimodal generation directly", e.message);
    }

    // 2. Generation Chain (Groq -> DeepSeek -> HF -> Gemini)
    if (pdfText) {
      try {
        responseText = await tryGroq(pdfText);
      } catch (e: any) {
        console.warn("Groq failed:", e.message);
        try {
          responseText = await tryDeepSeek(pdfText);
        } catch (e2: any) {
          console.warn("DeepSeek failed:", e2.message);
          try {
            responseText = await tryHuggingFace(pdfText);
          } catch (e3: any) {
            console.warn("Hugging Face failed:", e3.message);
          }
        }
      }
    }

    // 3. Final Fallback: Full Gemini Multimodal Generation
    if (!responseText) {
      try {
        responseText = await tryGemini(buffer);
      } catch (e4: any) {
        console.error("All AI engines failed:", e4.message);
        const userMsg = e4.message.includes("429") 
          ? "AI limits reached. Please try again in 30 seconds." 
          : "Generation failed across all engines. Please check if the PDF is readable.";
        return NextResponse.json({ error: userMsg }, { status: 503 });
      }
    }

    // 4. Parse JSON
    let generatedCards;
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/) || responseText.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : responseText;
      const parsed = JSON.parse(cleanJson);
      generatedCards = Array.isArray(parsed) ? parsed : (parsed.cards || parsed.flashcards || []);
    } catch (e) {
      console.error("Parse failed:", responseText);
      return NextResponse.json({ error: "AI response was unreadable. Please try again." }, { status: 500 });
    }

    if (!Array.isArray(generatedCards) || generatedCards.length === 0) {
      return NextResponse.json({ error: "No cards were generated." }, { status: 400 });
    }

    const newCards = await db.insert(cards).values(
      generatedCards.slice(0, 30).map(c => ({
        deckId,
        front: String(c.front || c.question || "").substring(0, 500),
        back: String(c.back || c.answer || "").substring(0, 500)
      })).filter(c => c.front && c.back)
    ).returning();

    await db.insert(cardProgress).values(newCards.map(c => ({ userId, cardId: c.id })));
    await db.update(decks).set({ cardCount: (deck.cardCount ?? 0) + newCards.length }).where(eq(decks.id, deckId));

    return NextResponse.json({ success: true, newCards: newCards.length });
  } catch (error: any) {
    console.error("Upload Route Error:", error);
    return NextResponse.json({ error: "Service temporarily overloaded. Please try again." }, { status: 500 });
  }
}
