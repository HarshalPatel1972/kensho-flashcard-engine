const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelId = "gemma-2-9b-it";
    console.log(`[Testing] ${modelId}...`);
    const model = genAI.getGenerativeModel({ model: modelId });
    const result = await model.generateContent("what is 1+2? Reply with only the number.");
    console.log(`✅ Success: ${result.response.text().trim()}`);
  } catch (e) {
    console.error(`❌ Failed: ${e.message}`);
  }
}

test();
