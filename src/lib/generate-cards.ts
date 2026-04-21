import { generateWithFallback } from "./ai-providers";

export interface Card {
  front: string;
  back: string;
}

const CARD_GENERATION_PROMPT = (chunk: string) => `
You are a master educator creating high-quality flashcards from study material.

Given the following text, generate between 3 and 5 flashcards maximum.

Rules:
- Cover key concepts, definitions, relationships, and important examples
- Front: a clear, specific question or prompt
- Back: a concise but complete answer (1-3 sentences max)
- Do NOT create trivial or obvious cards
- Write as a great teacher would, not a bot

Return ONLY a valid JSON array, no markdown, no preamble, no explanation:
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
    // Find the first '[' and the last ']' to extract the JSON array
    const firstBracket = text.indexOf("[");
    const lastBracket = text.lastIndexOf("]");
    
    if (firstBracket === -1 || lastBracket === -1 || lastBracket < firstBracket) {
      console.error("[Parser] No JSON array boundaries found in AI response");
      return [];
    }
    
    const jsonStr = text.substring(firstBracket, lastBracket + 1);
    const parsed = JSON.parse(jsonStr);
    const cards = parsed.map((card: any) => ({
      front: String(card.front || card.question || card.q || "").trim(),
      back: String(card.back || card.answer || card.a || "").trim()
    })).filter((card: any) => 
      card.front.length > 1 &&
      card.back.length > 1
    );

    if (cards.length === 0 && text.length > 0) {
      console.log("AI returned JSON but no valid cards found. Raw response snippet:", text.substring(0, 500));
    }
    
    return cards;
  } catch {
    return [];
  }
}



export async function generateCardsFromText(
  text: string
): Promise<Card[]> {
  
  // Hard limit — Use first 10,000 words to cover significant document depth
  const words = text.split(/\s+/);
  const safeText = words.slice(0, 10000).join(" ");
  
  const prompt = CARD_GENERATION_PROMPT(safeText)
  const result = await generateWithFallback(prompt, 800)
  const cards = parseCardsFromResponse(result.text)
  
  if (cards.length === 0) {
    console.error("NO_CARDS_GENERATED. AI Provider:", result.provider, "Response length:", result.text.length);
    throw new Error("NO_CARDS_GENERATED")
  }
  
  return cards
}
