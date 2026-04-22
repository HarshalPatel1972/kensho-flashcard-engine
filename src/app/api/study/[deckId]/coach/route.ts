import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generateWithFallback } from "@/lib/ai-providers";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { sessionData, providerIndex = 0 } = body;

    if (!sessionData || !Array.isArray(sessionData)) {
      return NextResponse.json({ error: "Missing session data" }, { status: 400 });
    }

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

    try {
      const result = await generateWithFallback(prompt, providerIndex, 300);
      return NextResponse.json({ feedback: result.text, provider: result.provider });
    } catch (error: any) {
      if (error.message === "PROVIDER_FAILED") {
        const nextIndex = providerIndex + 1;
        return NextResponse.json({ 
          error: "Current AI system is busy.", 
          nextIndex: nextIndex < 4 ? nextIndex : null,
          providerIndex 
        }, { status: 503 });
      }
      throw error;
    }
  } catch (error) {
    console.error("Coaching API Error:", error);
    return NextResponse.json({ error: "Failed to generate coaching note" }, { status: 500 });
  }
}
