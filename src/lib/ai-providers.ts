import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
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

// Single text generation with tiered fallback chain (Optimized Apr 2026 Fleet)
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
      name: "groq",
      tiers: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
      timeout: 10000,
      call: async (modelId) => {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: "You are a professional educational assistant. Return ONLY valid JSON arrays." },
            { role: "user", content: prompt }
          ],
          model: modelId,
          max_tokens: maxTokens,
          temperature: 0.1 // Lowered for more consistent JSON
        });
        return completion.choices[0]?.message?.content || "";
      }
    },
    {
      name: "gemini",
      tiers: ["gemini-2.5-flash", "gemma-4-31b-it"],
      timeout: 25000, // Balanced for Vercel
      call: async (modelId) => {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ 
          model: modelId,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ]
        });
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
        // CRITICAL: Log the actual error for Vercel troubleshooting
        console.error(`[AI ERROR] ${provider.name} (${modelId}) failed:`, e.message || e);
      }
    }
  }

  // All providers and tiers failed
  throw new Error("ALL_PROVIDERS_FAILED");
}
