import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Universal AI Engine v1.4
 * Order: Groq -> DeepSeek -> Gemini
 * Optimized for speed and multimodal PDF extraction.
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

  // --- TEXT-ONLY PATH (AI Coach / Non-PDF generation) ---
  if (!pdfBase64) {
    // 1. Groq (Ultra-speed)
    if (groqKey) {
      try {
        console.log("[Universal AI] Trying Groq (Text)...");
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
          body: JSON.stringify({ 
            model: "llama-3.1-70b-versatile", 
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
          })
        });
        const data = await res.json();
        const text = data.choices[0].message.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        if (text) return { text, provider: "groq", model: "llama-3.1-70b-versatile" };
      } catch (e: any) {
        console.warn("Groq text-only failed:", e.message);
      }
    }

    // 2. DeepSeek (Intelligence)
    if (deepseekKey) {
      try {
        console.log("[Universal AI] Trying DeepSeek (Text)...");
        const res = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${deepseekKey}` },
          body: JSON.stringify({ 
            model: "deepseek-chat", 
            messages: [{ role: "user", content: prompt }] 
          })
        });
        const data = await res.json();
        const text = data.choices[0].message.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        if (text) return { text, provider: "deepseek", model: "deepseek-chat" };
      } catch (e: any) {
        console.warn("DeepSeek text-only failed:", e.message);
      }
    }
  }

  // --- PDF / MULTIMODAL PATH OR FALLBACK ---
  // PRIORITY 1: Google Gemini (Native PDF Support)
  // Re-checking Gemini with correct model names for reliability
  const geminiModels = ["gemini-1.5-flash", "gemini-1.5-flash-latest"];
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

  // FINAL FALLBACK: If PDF was provided but Gemini generation failed, 
  // try extraction-only then feed back to Groq/DeepSeek
  if (pdfBase64) {
    console.log("[Universal AI] Gemini generation failed. Attempting vision-to-text extraction fallback...");
    let extractedText = "";
    try {
      const genAI = new GoogleGenerativeAI(geminiKeys[0]);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent([
        { inlineData: { data: pdfBase64, mimeType: "application/pdf" } }, 
        "Extract all educational text from this PDF exactly as it appears. No preamble."
      ]);
      extractedText = result.response.text();
    } catch (e) {
      console.warn("PDF extraction failed, cannot fallback to text-only providers.");
    }

    if (extractedText) {
      const textPrompt = `${prompt}\n\nHere is the material content:\n${extractedText}`;
      
      // Try Groq again with the extracted text
      if (groqKey) {
        try {
          console.log("[Universal AI] Trying Groq Extraction Fallback...");
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
            body: JSON.stringify({ 
              model: "llama-3.1-70b-versatile", 
              messages: [{ role: "user", content: textPrompt }],
              response_format: { type: "json_object" }
            })
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

  throw lastError || new Error("All AI providers (Groq, DeepSeek, Google) failed to generate a response.");
}
