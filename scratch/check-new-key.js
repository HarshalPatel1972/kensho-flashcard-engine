const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function check() {
  const modelId = "gemini-1.5-flash";
  console.log(`[Checking] ${modelId} with new key...`);
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelId });
    const result = await model.generateContent("hi");
    console.log(`✅ ${modelId} SUCCESS: ${result.response.text().trim()}`);
  } catch (e) {
    console.error(`❌ ${modelId} FAILED: ${e.message}`);
  }
}

check();
