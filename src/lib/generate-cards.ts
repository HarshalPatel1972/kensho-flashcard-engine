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
    // Strip markdown code blocks if present
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    
    // Find JSON array in response
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.filter((card: any) => 
      card.front && 
      card.back && 
      typeof card.front === "string" && 
      typeof card.back === "string" &&
      card.front.length > 5 &&
      card.back.length > 5
    );
  } catch {
    return [];
  }
}



export async function generateCardsFromText(
  text: string
): Promise<Card[]> {
  
  // Hard limit — free models handle this reliably every time
  const safeText = text.slice(0, 1500).trim()
  
  const prompt = CARD_GENERATION_PROMPT(safeText)
  const result = await generateWithFallback(prompt, 800)
  const cards = parseCardsFromResponse(result.text)
  
  if (cards.length === 0) {
    throw new Error("NO_CARDS_GENERATED")
  }
  
  return cards
}
