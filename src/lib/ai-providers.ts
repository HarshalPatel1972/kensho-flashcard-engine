import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

// Conservative chunk sizes per provider (real-world free tier limits)
export const PROVIDER_CHUNK_SIZES = {
  gemini: 1500,
  groq: 1000,
  huggingface: 800
} as const;

type Provider = "gemini" | "groq" | "huggingface";

export interface AIResult {
  text: string;
  provider: Provider;
}

// Single text generation with tiered fallback chain
export async function generateWithFallback(
  prompt: string,
  maxTokens: number = 1000
): Promise<AIResult> {
  const providers: {
    name: Provider;
    tiers: string[];
    timeout: number;
    call: (model: string) => Promise<string>;
  }[] = [
    {
      name: "gemini",
      tiers: ["gemma-4-31b-it"],
      timeout: 30000,
      call: async (modelId) => {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: modelId });
        const result = await model.generateContent(prompt);
        return result.response.text();
      }
    }
  ];

  for (const provider of providers) {
    for (const modelId of provider.tiers) {
      try {
        console.log(`[AI] Trying ${provider.name} (${modelId})...`);
        const text = await Promise.race([
          provider.call(modelId),
          new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error(`${provider.name} timeout`)), provider.timeout)
          )
        ]);

        if (text && text.length > 10) {
          return { text, provider: provider.name };
        }
      } catch (e: any) {
        console.log(`${provider.name} (${modelId}) failed:`, e.message || e);
      }
    }
  }

  // All providers and tiers failed
  throw new Error("ALL_PROVIDERS_FAILED");
}
