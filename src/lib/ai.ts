import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Universal AI Engine
 * Order: Groq -> HuggingFace -> Gemini 
 */

type AIResult = {
  text: string;
  provider: string;
  model: string;
};

export async function runUniversalAI(
  prompt: string,
  pdfBase64?: string
): Promise<AIResult> {
  const geminiKeys = Object.keys(process.env).filter(k => k.startsWith("GEMINI_API_KEY")).map(k => process.env[k]).filter(Boolean) as string[];
  const hfKey = process.env.HUGGING_FACE_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  let lastError = null;

  // --- TEXT-ONLY PATH (AI Coach / Non-PDF generation) ---
  if (!pdfBase64) {
    // 1. Groq (llama-3.1-8b-instant)
    if (groqKey) {
      try {
        console.log("[Universal AI] Trying Groq (Text)...");
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
          body: JSON.stringify({ 
            model: "llama-3.1-8b-instant", 
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Groq Error");
        const text = data.choices[0].message.content.trim();
        if (text) return { text, provider: "groq", model: "llama-3.1-8b-instant" };
      } catch (e: any) {
        console.warn("Groq text-only failed:", e.message);
      }
    }

    // 2. HuggingFace (Mistral-7B-Instruct-v0.3)
    if (hfKey) {
      try {
        console.log("[Universal AI] Trying HuggingFace (Text)...");
        const res = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${hfKey}` },
          body: JSON.stringify({ 
            model: "mistralai/Mistral-7B-Instruct-v0.3", 
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1000,
            temperature: 0.7
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "HF Error");
        const text = data.choices[0].message.content.trim();
        if (text) return { text, provider: "huggingface", model: "mistralai/Mistral-7B-Instruct-v0.3" };
      } catch (e: any) {
        console.warn("HuggingFace text-only failed:", e.message);
      }
    }
  }

  // --- GEMINI PATH (Native PDF Support or Fallback Text) ---
  const geminiModels = ["gemini-2.5-flash-lite"];
  for (const modelName of geminiModels) {
    for (const key of (geminiKeys.length > 0 ? geminiKeys : [process.env.GEMINI_API_KEY]).filter(Boolean) as string[]) {
      try {
        console.log(`[Universal AI] Trying Google: ${modelName}`);
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const content = pdfBase64 
          ? [
              { inlineData: { mimeType: "application/pdf", data: pdfBase64 } },
              { text: prompt }
            ]
          : [{ text: prompt }];

        const result = await model.generateContent(content);
        
        const text = result.response.text().trim();
        if (text) return { text, provider: "google", model: modelName };
      } catch (err: any) {
        console.warn(`Google ${modelName} failed:`, err.message);
        lastError = err;
      }
    }
  }

  throw lastError || new Error("All AI providers failed to generate a response.");
}
