import { generateCardsFromText } from "../src/lib/generate-cards";
import * as aiProviders from "../src/lib/ai-providers";

// Mock generateWithFallback
const originalGenerateWithFallback = aiProviders.generateWithFallback;
(aiProviders as any).generateWithFallback = async (prompt: string, tokens: number) => {
  console.log("Mocked generateWithFallback called with prompt length:", prompt.length);
  return { text: '[{"front": "Test Question", "back": "Test Answer"}]', provider: "gemini" };
};

async function test() {
  console.log("Testing with 2000 char string...");
  const longText = "A".repeat(2000);
  try {
    const cards = await generateCardsFromText(longText);
    console.log("Success! Generated cards:", cards.length);
    console.log("Card 1:", cards[0]);
  } catch (e: any) {
    console.error("Failed:", e.message);
  }

  console.log("\nTesting with empty text (expecting NO_CARDS_GENERATED if mock returns empty)...");
  (aiProviders as any).generateWithFallback = async () => ({ text: '[]', provider: "gemini" });
  try {
    await generateCardsFromText("Short text");
  } catch (e: any) {
    console.log("Correctly threw error:", e.message);
  }
}

test().then(() => {
  // Restore original (not strictly necessary for one-off script)
  (aiProviders as any).generateWithFallback = originalGenerateWithFallback;
});
