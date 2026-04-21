const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function checkStability() {
  const models = ["gemini-1.5-flash", "gemma-4-31b-it"];
  
  for (const mId of models) {
    console.log(`\n[Checking] ${mId}...`);
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: mId });
      const result = await model.generateContent("What is 1+2? Reply with only the number.");
      console.log(`✅ ${mId} SUCCESS: ${result.response.text().trim()}`);
    } catch (e) {
      console.error(`❌ ${mId} FAILED: ${e.message}`);
    }
  }
}

checkStability();
