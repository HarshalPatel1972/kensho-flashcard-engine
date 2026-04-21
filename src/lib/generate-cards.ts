import { generateWithFallback } from "./ai-providers";

export interface Card {
  front: string;
  back: string;
}

const CARD_GENERATION_PROMPT = (chunk: string) => `
You are a master educator creating high-quality flashcards from study material.

Given the following text, generate between 3 and 10 flashcards maximum.

Rules:
- Cover key concepts, definitions, relationships, and important examples
- Front: a clear, specific question or prompt
- Back: a concise but complete answer (1-3 sentences max)
- Do NOT create trivial or obvious cards
- Write as a great teacher would, not a bot
- Focus on core takeaways from the provided text

IMPORTANT: Return ONLY a valid JSON array. No markdown code blocks. No preamble. No explanation.
If the text contains valid study material, you MUST return at least 3 cards. Do not return an empty array.

[{"front": "...", "back": "..."}, ...]

Text:
${chunk}
`;

const DEDUP_PROMPT = (cards: Card[]) => `
Given these flashcards, remove any duplicates or cards covering 
the same concept. Keep the best version of similar cards.
Return ONLY a valid JSON array, no markdown, no preamble:
[{"front": "...", "back": "..."}, ...]

Cards:
${JSON.stringify(cards)}
`;

function parseCardsFromResponse(text: string): Card[] {
  try {
    // 1. Try direct parse first in case it's clean
    try {
      const direct = JSON.parse(text);
      if (Array.isArray(direct)) return normalizeCards(direct);
      if (typeof direct === 'object' && direct !== null) {
        // AI might wrap in an object like { "cards": [...] }
        const potentialArray = direct.cards || direct.flashcards || direct.items || Object.values(direct).find(v => Array.isArray(v));
        if (Array.isArray(potentialArray)) return normalizeCards(potentialArray);
      }
    } catch (e) {
      // Fall through to boundary extraction
    }

    // 2. Find the first '[' and the last ']' to extract the JSON array
    const firstBracket = text.indexOf("[");
    const lastBracket = text.lastIndexOf("]");
    
    if (firstBracket === -1 || lastBracket === -1 || lastBracket < firstBracket) {
      console.error("[Parser] No JSON array boundaries found in AI response");
      return [];
    }
    
    const jsonStr = text.substring(firstBracket, lastBracket + 1);
    const parsed = JSON.parse(jsonStr);
    
    if (!Array.isArray(parsed)) {
       // It's an object that might contain an array
       const arrayInObj = Object.values(parsed).find(v => Array.isArray(v));
       if (Array.isArray(arrayInObj)) return normalizeCards(arrayInObj);
       return [];
    }

    return normalizeCards(parsed);
  } catch (err) {
    console.error("[Parser Error] Failed to parse AI response:", err);
    return [];
  }
}

function normalizeCards(rawArray: any[]): Card[] {
  return rawArray.map((card: any) => ({
    front: String(card.front || card.question || card.q || "").trim(),
    back: String(card.back || card.answer || card.a || "").trim()
  })).filter((card: Card) => 
    card.front.length > 5 &&
    card.back.length > 5
  );
}



export async function generateCardsFromText(
  text: string,
  providerIndex: number = 0
): Promise<{ cards: Card[], provider: string, providerIndex: number, nextIndex: number | null }> {
  const prompt = CARD_GENERATION_PROMPT(text)
  const result = await generateWithFallback(prompt, providerIndex, 2048)
  const cards = parseCardsFromResponse(result.text)
  
  if (cards.length === 0) {
    console.error("NO_CARDS_GENERATED. AI Provider:", result.provider, "Response length:", result.text.length);
    throw new Error("NO_CARDS_GENERATED")
  }
  
  return { 
    cards, 
    provider: result.provider, 
    providerIndex: result.providerIndex,
    nextIndex: result.nextIndex 
  }
}
