import { generateWithFallback, PROVIDER_CHUNK_SIZES } from "./ai-providers";
import { chunkText, batchChunks } from "./chunk-text";

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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateCardsFromText(
  text: string
): Promise<Card[]> {
  
  // Use the most conservative chunk size to work across all providers
  const chunks = chunkText(text, 1000, 200);
  console.log(`Processing ${chunks.length} chunks`);
  
  const batches = batchChunks(chunks, 3);
  const allCards: Card[] = [];
  let failedChunks = 0;
  
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    
    // Wait 1.2 seconds between batches (respect free tier rate limits)
    if (batchIndex > 0) {
      await sleep(1200);
    }
    
    // Process chunks in batch concurrently
    const batchResults = await Promise.allSettled(
      batch.map(async (chunk) => {
        const prompt = CARD_GENERATION_PROMPT(chunk);
        const result = await generateWithFallback(prompt, 800);
        return parseCardsFromResponse(result.text);
      })
    );
    
    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        allCards.push(...result.value);
      } else {
        failedChunks++;
        console.log("Chunk failed:", result.reason);
      }
    }
  }
  
  // If more than 50% of chunks failed, throw error
  if (failedChunks > chunks.length * 0.5) {
    throw new Error("TOO_MANY_CHUNK_FAILURES");
  }
  
  if (allCards.length === 0) {
    throw new Error("NO_CARDS_GENERATED");
  }
  
  // Deduplicate if we have more than 10 cards
  let finalCards = allCards;
  if (allCards.length > 10) {
    try {
      const dedupResult = await generateWithFallback(
        DEDUP_PROMPT(allCards),
        1500
      );
      const deduped = parseCardsFromResponse(dedupResult.text);
      if (deduped.length > 0) {
        finalCards = deduped;
      }
    } catch {
      // Dedup failed — use original cards, just slice to 40
      console.log("Dedup failed, using original cards");
      finalCards = allCards;
    }
  }
  
  // Cap at 40 cards — quality over quantity
  return finalCards.slice(0, 40);
}
