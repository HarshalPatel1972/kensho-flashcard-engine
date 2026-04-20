import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Universal AI Engine with Multi-Provider Key Rotation and Model Fallback.
 * Tiers:
 * 1. Google Gemini (Multimodal Vision - Best for PDFs)
 * 2. DeepSeek (High Intelligence - Text Fallback)
 * 3. Groq (Ultra-speed - Text Fallback)
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
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  let lastError = null;

  // PRIORITY 1: Google Gemini (Native PDF Support)
  const geminiModels = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"];
  for (const modelName of geminiModels) {
    for (const key of geminiKeys) {
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
        
        const text = result.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        if (text) return { text, provider: "google", model: modelName };
      } catch (err: any) {
        console.warn(`Google ${modelName} failed:`, err.message);
        lastError = err;
      }
    }
  }

  // PRIORITY 2: DeepSeek / Groq (Text-only Fallback)
  // If Gemini Vision worked but card gen failed, or if we need a text fallback.
  if (pdfBase64) {
    console.log("[Universal AI] Gemini generation failed. Attempting vision-to-text extraction fallback...");
    // Attempt one quick text extraction from Gemini to feed into text-only models
    let extractedText = "";
    try {
      const genAI = new GoogleGenerativeAI(geminiKeys[0]);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent([{ inlineData: { data: pdfBase64, mimeType: "application/pdf" } }, "Extract all educational text from this PDF exactly as it appears. No preamble."]);
      extractedText = result.response.text();
    } catch (e) {
      console.warn("PDF extraction failed, cannot fallback to text-only providers.");
    }

    if (extractedText) {
      const textPrompt = `${prompt}\n\nHere is the material content:\n${extractedText}`;

      // Try DeepSeek
      if (deepseekKey) {
        try {
          console.log("[Universal AI] Trying DeepSeek Fallback...");
          const res = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${deepseekKey}` },
            body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: textPrompt }] })
          });
          const data = await res.json();
          const text = data.choices[0].message.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          if (text) return { text, provider: "deepseek", model: "deepseek-chat" };
        } catch (e: any) {
          console.warn("DeepSeek fallback failed:", e.message);
        }
      }

      // Try Groq
      if (groqKey) {
        try {
          console.log("[Universal AI] Trying Groq Fallback...");
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
            body: JSON.stringify({ model: "llama-3.1-70b-versatile", messages: [{ role: "user", content: textPrompt }] })
          });
          const data = await res.json();
          const text = data.choices[0].message.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          if (text) return { text, provider: "groq", model: "llama-3.1-70b-versatile" };
        } catch (e: any) {
          console.warn("Groq fallback failed:", e.message);
        }
      }
    }
  }

  throw lastError || new Error("All AI providers (Google, DeepSeek, Groq) failed to generate a response.");
}

