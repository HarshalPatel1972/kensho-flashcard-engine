const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // There is no direct listModels in the base SDK, but we can try to guess or use a common one.
    // Actually, I'll just try the one that worked before to confirm.
    console.log("Checking gemma-4-31b-it (confirmed earlier)...");
    const model = genAI.getGenerativeModel({ model: "gemma-4-31b-it" });
    const result = await model.generateContent("hi");
    console.log("✅ gemma-4-31b-it is live.");
  } catch (e) {
    console.error("❌ gemma-4-31b-it failed:", e.message);
  }
}

listModels();
