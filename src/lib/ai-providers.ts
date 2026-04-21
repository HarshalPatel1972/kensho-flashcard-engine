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

// Single text generation with fallback chain
export async function generateWithFallback(
  prompt: string,
  maxTokens: number = 1000
): Promise<AIResult> {
  // Try Gemini first
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Gemini timeout")), 8000)
      )
    ]) as any;
    const text = result.response.text();
    if (text && text.length > 10) {
      return { text, provider: "gemini" };
    }
    throw new Error("Empty response from Gemini");
  } catch (e) {
    console.log("Gemini failed, trying Groq:", e);
  }

  // Try Groq second
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
    const completion = await Promise.race([
      groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant",
        max_tokens: maxTokens,
        temperature: 0.3
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Groq timeout")), 8000)
      )
    ]) as any;
    const text = completion.choices[0]?.message?.content;
    if (text && text.length > 10) {
      return { text, provider: "groq" };
    }
    throw new Error("Empty response from Groq");
  } catch (e) {
    console.log("Groq failed, trying HuggingFace:", e);
  }

  // Try HuggingFace last
  try {
    const response = await Promise.race([
      fetch(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY || process.env.HUGGINGFACE_API_KEY!}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "mistralai/Mistral-7B-Instruct-v0.3",
            messages: [{ role: "user", content: prompt }],
            max_tokens: maxTokens,
            temperature: 0.3,
            stream: false
          })
        }
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("HuggingFace timeout")), 10000)
      )
    ]) as any;
    
    if (!response.ok) {
      throw new Error(`HF status: ${response.status}`);
    }
    
    const data = await response.json();
    const text = data.choices ? data.choices[0]?.message?.content : null;
    
    if (text && text.length > 10) {
      return { text, provider: "huggingface" };
    }
    throw new Error("Empty response from HuggingFace");
  } catch (e) {
    console.log("HuggingFace failed:", e);
  }

  // All providers failed
  throw new Error("ALL_PROVIDERS_FAILED");
}
