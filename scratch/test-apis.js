const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");

async function testGemini(modelId) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: modelId });
  const result = await model.generateContent("what is 1+2? Reply with only the number.");
  return result.response.text();
}

async function testGroq(modelId) {
  if (!process.env.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const res = await groq.chat.completions.create({
    model: modelId,
    messages: [{ role: "user", content: "what is 1+2? Reply with only the number." }],
    temperature: 0.3
  });
  return res.choices[0].message.content;
}

async function run() {
  const providers = [
    { name: "Gemini T1", id: "gemini-3.1-flash-lite", fn: testGemini },
    { name: "Gemini T2", id: "gemma-4-31b-it", fn: testGemini },
    { name: "Groq T1", id: "qwen-3.6-35b-a3b", fn: testGroq },
    { name: "Groq T2", id: "llama-3.1-8b-instant", fn: testGroq }
  ];

  for (const p of providers) {
    try {
      console.log(`[Testing] ${p.name} (${p.id})...`);
      const res = await p.fn(p.id);
      console.log(`✅ Success: ${res.trim()}\n`);
    } catch (e) {
      console.error(`❌ Failed: ${e.message}\n`);
    }
  }
}

run();
