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
  maxTokens: number = 2048
): Promise<AIResult> {
  // Debug Log for Keys
  console.log(`[AI-Status] Keys: Groq=${!!process.env.GROQ_API_KEY}, Gemini=${!!process.env.GEMINI_API_KEY}`);

  const providers: {
    name: Provider;
    tiers: string[];
    timeout: number;
    call: (model: string, temp: number) => Promise<string>;
  }[] = [
    {
      name: "groq",
      tiers: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
      timeout: 30000, // Increased to 30s
      call: async (modelId, temp) => {
        if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY_MISSING");
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: "You are an educational assistant. Return ONLY JSON arrays. No preamble. No markdown blocks." },
            { role: "user", content: prompt }
          ],
          model: modelId,
          max_tokens: maxTokens,
          temperature: temp
        });
        return completion.choices[0]?.message?.content || "";
      }
    },
    {
      name: "gemini",
      tiers: ["gemini-1.5-flash", "gemini-1.5-pro"],
      timeout: 45000, // Increased to 45s
      call: async (modelId, temp) => {
        if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY_MISSING");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
          model: modelId,
          generationConfig: {
            temperature: temp,
            maxOutputTokens: maxTokens,
          },
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
      // Robustness: Try each model twice before falling back
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const temp = attempt === 1 ? 0.1 : 0.4; // Slightly more creative on retry
          console.log(`[AI] Trying ${provider.name} (${modelId}) - Attempt ${attempt}/2...`);
          
          const text = await Promise.race([
            provider.call(modelId, temp),
            new Promise<string>((_, reject) =>
              setTimeout(() => reject(new Error(`${provider.name} timeout`)), provider.timeout)
            )
          ]);

          if (text && text.trim().length > 20) {
            return { text, provider: provider.name };
          }
        } catch (e: any) {
          console.error(`[AI ERROR] ${provider.name} (${modelId}) attempt ${attempt} failed:`, e.message || e);
          if (attempt === 2) continue; // Move to next model
        }
      }
    }
  }

  throw new Error("ALL_PROVIDERS_FAILED");
}
