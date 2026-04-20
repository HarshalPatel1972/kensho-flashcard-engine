import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Robust AI Execution Engine with Key Rotation and Model Fallback.
 * Safely cycles through all available GEMINI_API_KEYs in the environment
 * across a cascade of models (best to good enough).
 */

const MODEL_CASCADE = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-3-flash-preview",
  "gemini-2.0-flash"
];

function getApiKeys(): string[] {
  // Automatically collect all Gemini keys (GEMINI_API_KEY, GEMINI_API_KEY_1, etc.)
  const keys = Object.keys(process.env)
    .filter(k => k.startsWith("GEMINI_API_KEY"))
    .sort() // Ensure consistent order
    .map(k => process.env[k])
    .filter((v): v is string => !!v);
  
  return keys.length > 0 ? keys : [];
}

export async function runWithRetry(
  task: (model: any) => Promise<any>
): Promise<any> {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error("No GEMINI_API_KEY found in environment variables.");
  }

  let lastError = null;

  // Outer loop: Models (Best to Good enough)
  for (const modelName of MODEL_CASCADE) {
    // Inner loop: Keys (Circular rotation for each model tier)
    for (const apiKey of keys) {
      try {
        console.log(`[AI Engine] Trying ${modelName} with key prefix ${apiKey.substring(0, 10)}...`);
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await task(model);
        if (result) return result;
      } catch (err: any) {
        console.warn(`[AI Engine] Model ${modelName} failed with key ${apiKey.substring(0, 6)}. Error: ${err.message}`);
        lastError = err;

        // If it's a 404 (Model not found) for this specific key, 
        // skip this model for all keys to save time, move to next tier.
        if (err.message?.includes("404") || err.message?.toLowerCase().includes("not found")) {
          break; 
        }
        
        // If it's a 429 (Rate limit), try the next key for the same model.
      }
    }
  }

  throw lastError || new Error("All AI models and API keys failed to return a response.");
}
