import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Gemini key missing" }, { status: 500 });

    const body = await req.json();
    const { sessionData } = body;

    if (!sessionData || !Array.isArray(sessionData)) {
      return NextResponse.json({ error: "Missing session data" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-3-flash-preview",
      "gemini-2.0-flash"
    ];

    const prompt = `
      You are a learning coach analyzing a student's flashcard study session.
      
      Session data:
      ${JSON.stringify(sessionData)}
      
      Quality scale: 0=complete blackout, 3=hard, 4=good, 5=easy
      
      Write exactly 2-3 sentences of specific, actionable coaching feedback.
      Reference the actual card content where possible.
      Be direct, warm, and specific — not generic.
      Do NOT say "Great job!" or similar empty praise.
      Focus on patterns: what they're struggling with and one concrete tip.
      
      Return only the coaching text, no labels, no JSON.
    `;

    let feedback = "";
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        feedback = result.response.text().trim();
        if (feedback) break;
      } catch (err: any) {
        console.warn(`Coach model ${modelName} failed, trying next...`, err.message);
        lastError = err;
      }
    }

    if (!feedback) {
      throw lastError || new Error("All AI models failed to provide coaching.");
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Coaching API Error:", error);
    return NextResponse.json({ error: "Failed to generate coaching note" }, { status: 500 });
  }
}
