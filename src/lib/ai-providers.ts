import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import Groq from "groq-sdk";

export const PROVIDER_CHUNK_SIZES = {
  gemini: 2000,
  groq: 1200,
  huggingface: 1000,
  deepseek: 2000
} as const;

export type Provider = "groq" | "deepseek" | "gemini" | "huggingface";

export interface AIResult {
  text: string;
  provider: Provider;
  providerIndex: number;
  nextIndex: number | null;
}

export const PROVIDER_DISPLAY_NAMES: Record<Provider, string> = {
  groq: "Llama 3.3 (Ultra Fast)",
  deepseek: "DeepSeek v3 (High Precision)",
  gemini: "Gemini 1.5 (Large Context)",
  huggingface: "Mistral 7B (Backup Engine)"
};

export async function generateWithFallback(
  prompt: string,
  requestedIndex: number = 0,
  maxTokens: number = 2048,
  systemPrompt: string = ""
): Promise<AIResult> {
  const providers: {
    name: Provider;
    call: (temp: number) => Promise<string>;
  }[] = [
    {
      name: "groq",
      call: async (temp) => {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const messages: any[] = [{ role: "user", content: prompt }];
        if (systemPrompt) {
          messages.unshift({ role: "system", content: systemPrompt });
        } else {
          messages.unshift({ role: "system", content: "You are an educational assistant. Return ONLY JSON arrays. No preamble. No markdown code blocks." });
        }

        const completion = await groq.chat.completions.create({
          messages,
          model: "llama-3.3-70b-versatile",
          max_tokens: maxTokens,
          temperature: temp
        });
        return completion.choices[0]?.message?.content || "";
      }
    },
    {
      name: "deepseek",
      call: async (temp) => {
        const messages: any[] = [{ role: "user", content: prompt }];
        if (systemPrompt) {
          messages.unshift({ role: "system", content: systemPrompt });
        } else {
          messages.unshift({ role: "system", content: "Return ONLY JSON arrays. No preamble." });
        }

        const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages,
            temperature: temp,
            max_tokens: maxTokens
          })
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
      }
    },
    {
      name: "gemini",
      call: async (temp) => {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const fullPrompt = systemPrompt ? `${systemPrompt}\n\nContent: ${prompt}` : prompt;
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: temp, maxOutputTokens: maxTokens }
        });
        return result.response.text();
      }
    },
    {
      name: "huggingface",
      call: async (temp) => {
        const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            inputs: `<s>[INST] ${prompt} [/INST]`,
            parameters: { max_new_tokens: maxTokens, temperature: temp }
          })
        });
        const data = await response.json();
        return Array.isArray(data) ? data[0].generated_text : data.generated_text || "";
      }
    }
  ];

  // Logic: Each request focuses on ONE provider (and maybe its fallback)
  // to stay within Vercel's 10s window.
  const index = Math.min(requestedIndex, providers.length - 1);
  const provider = providers[index];
  const nextIndex = index + 1 < providers.length ? index + 1 : null;

  try {
    console.log(`[AI-Handover] Targeted Provider: ${provider.name} (Index ${index})`);
    
    // We only try the targeted provider 1-2 times here.
    // If it fails, we return a 503 so the client can try the NEXT index.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const temp = attempt === 1 ? 0.1 : 0.4;
        const text = await Promise.race([
          provider.call(temp),
          new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error("Vercel Window Buffer Timeout")), 8500)
          )
        ]);

        if (text && text.trim().length > 20) {
          return { text, provider: provider.name, providerIndex: index, nextIndex };
        }
      } catch (e) {
        if (attempt === 2) throw e;
      }
    }
  } catch (err: any) {
    console.error(`[AI ERROR] Provider ${provider.name} failed:`, err.message);
    throw new Error("PROVIDER_FAILED");
  }

  throw new Error("PROVIDER_FAILED");
}
