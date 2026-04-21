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
      name: "groq",
      tiers: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"],
      timeout: 10000,
      call: async (modelId) => {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: modelId,
          max_tokens: maxTokens,
          temperature: 0.3
        });
        return completion.choices[0]?.message?.content || "";
      }
    },
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
    },
    {
      name: "huggingface",
      tiers: ["mistralai/Mistral-7B-Instruct-v0.3", "Qwen/Qwen2.5-72B-Instruct"],
      timeout: 12000,
      call: async (modelId) => {
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${modelId}/v1/chat/completions`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY || process.env.HUGGINGFACE_API_KEY!}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: modelId,
              messages: [{ role: "user", content: prompt }],
              max_tokens: maxTokens,
              temperature: 0.3,
              stream: false
            })
          }
        );
        if (!response.ok) throw new Error(`HF status: ${response.status}`);
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
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
