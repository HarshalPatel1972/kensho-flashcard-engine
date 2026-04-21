const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function check() {
  const models = [
    "gemma-4-31b-it",
    "gemma-4-26b-moe-it",
    "gemini-3-flash",
    "gemini-2.5-flash"
  ];
  
  for (const modelId of models) {
    console.log(`\n[Checking] ${modelId} with new key...`);
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent("Say 'System OK' and nothing else.");
      console.log(`✅ ${modelId} SUCCESS: ${result.response.text().trim()}`);
    } catch (e) {
      console.error(`❌ ${modelId} FAILED: ${e.message}`);
    }
  }
}

check();
