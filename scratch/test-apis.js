const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGroq() {
  if (!process.env.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-specdec",
      messages: [{ role: "user", content: "what is 1+2? Reply with only the number." }],
      temperature: 0.3
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status} ${await res.text()}`);
  return (await res.json()).choices[0].message.content;
}

async function testDeepSeek() {
  if (!process.env.DEEPSEEK_API_KEY) throw new Error("Missing DEEPSEEK_API_KEY");
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: "what is 1+2? Reply with only the number." }],
      temperature: 0.3
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status} ${await res.text()}`);
  return (await res.json()).choices[0].message.content;
}

async function testHuggingFace() {
  if (!process.env.HUGGING_FACE_API_KEY) throw new Error("Missing HUGGING_FACE_API_KEY");
  const res = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}` },
    body: JSON.stringify({
      inputs: `<s>[INST] what is 1+2? Reply with only the number. [/INST]`,
      parameters: { max_new_tokens: 10, temperature: 0.3 }
    }),
  });
  if (!res.ok) throw new Error(`HF ${res.status} ${await res.text()}`);
  const data = await res.json();
  return Array.isArray(data) ? data[0].generated_text : (data.generated_text || "");
}

async function testGemini() {
  if (!process.env.GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent("what is 1+2? Reply with only the number.");
  return result.response.text();
}

async function run() {
  const tests = [
    { name: "Groq", fn: testGroq },
    { name: "DeepSeek", fn: testDeepSeek },
    { name: "HuggingFace", fn: testHuggingFace },
    { name: "Gemini", fn: testGemini }
  ];

  for (const t of tests) {
    try {
      console.log(`[Testing] ${t.name}...`);
      const result = await t.fn();
      console.log(`✅ ${t.name} Success: ${result.replace(/\n/g, ' ')}\n`);
    } catch (e) {
      console.error(`❌ ${t.name} Failed: ${e.message}\n`);
    }
  }
}

run();
