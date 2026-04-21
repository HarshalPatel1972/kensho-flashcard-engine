const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const BIOLOGY_TEXT = `
The cell is the basic structural, functional, and biological unit of all known organisms. A cell is the smallest unit of life. Cells are often called the "building blocks of life". The study of cells is called cell biology, cellular biology, or cytology.
Cells consist of cytoplasm enclosed within a membrane, which contains many biomolecules such as proteins and nucleic acids. Most plant and animal cells are only visible under a light microscope, with dimensions between 1 and 100 micrometers. Electron microscopy gives a much higher resolution showing highly detailed cell structure. Organisms can be classified as unicellular (consisting of a single cell such as bacteria) or multicellular (including plants and animals). Most unicellular organisms are classed as microorganisms.
 Discovery of cells:
The cell was discovered by Robert Hooke in 1665, who named the structures he saw in cork after the cells or small rooms in a monastery. Cell theory, first developed in 1839 by Matthias Jakob Schleiden and Theodor Schwann, states that all organisms are composed of one or more cells, that cells are the fundamental unit of structure and function in all living organisms, and that all cells come from pre-existing cells. Cells emerged on Earth at least 3.5 billion years ago.
Types of cells:
Cells are of two types: eukaryotic, which contain a nucleus, and prokaryotic, which do not. Prokaryotes are single-celled organisms, while eukaryotes can be either single-celled or multicellular.
Prokaryotic cells include bacteria and archaea, two of the three domains of life. Prokaryotic cells were the first form of life on Earth, characterized by having vital biological processes including cell signaling. They are simpler and smaller than eukaryotic cells, and lack a nucleus, and other membrane-bound organelles.
`;

const PROMPT = `
Generate 3-5 concise, high-value flashcards from this text. 
Return ONLY JSON: [{"front": "...", "back": "..."}]
Text: ${BIOLOGY_TEXT}
`;

const CANDIDATES = [
  { provider: "gemini", id: "gemini-3-flash" },
  { provider: "gemini", id: "gemini-3-pro" },
  { provider: "gemini", id: "gemini-2.5-flash" },
  { provider: "gemini", id: "gemini-1.5-flash" },
  { provider: "gemini", id: "gemma-4-31b-it" },
  { provider: "groq", id: "llama-3.1-8b-instant" },
  { provider: "groq", id: "llama-3.3-70b-versatile" },
  { provider: "groq", id: "mixtral-8x7b-32768" },
  { provider: "huggingface", id: "mistralai/Mistral-7B-Instruct-v0.3" },
  { provider: "huggingface", id: "Qwen/Qwen2.5-72B-Instruct" }
];

async function callProvider(p, mId, input) {
  if (p === "gemini") {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: mId });
    const res = await model.generateContent(input);
    return res.response.text();
  } else if (p === "groq") {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const res = await groq.chat.completions.create({
      model: mId,
      messages: [{ role: "user", content: input }]
    });
    return res.choices[0].message.content;
  } else {
    const res = await fetch(`https://api-inference.huggingface.co/models/${mId}/v1/chat/completions`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${process.env.HUGGING_FACE_API_KEY || process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages: [{ role: "user", content: input }], stream: false })
    });
    const data = await res.json();
    return data.choices ? data.choices[0].message.content : (data.generated_text || "ERROR");
  }
}

async function run() {
  console.log("--- STARTING MASTER AUDIT ---");
  const results = [];

  for (const c of CANDIDATES) {
    console.log(`[PASS 1] Connectivity: ${c.provider}/${c.id}...`);
    try {
      await callProvider(c.provider, c.id, "say 'OK'");
      console.log(`✅ ${c.id} Connected.`);
      
      console.log(`[PASS 2] Performance: ${c.id}...`);
      const start = Date.now();
      const response = await callProvider(c.provider, c.id, PROMPT);
      const elapsed = Date.now() - start;
      const success = response.includes("[") && response.includes("back");
      
      results.push({ 
        model: c.id, 
        provider: c.provider, 
        status: success ? "READY" : "FORMAT_FAIL", 
        latency: (elapsed / 1000).toFixed(1) + "s",
        output: success ? "Valid JSON" : "Invalid text"
      });
    } catch (e) {
      console.log(`❌ ${c.id} FAILED: ${e.message.split(":")[0]}`);
      results.push({ model: c.id, provider: c.provider, status: "OFFLINE", latency: "N/A", output: e.message.substring(0, 30) });
    }
  }

  console.log("\n--- AUDIT RESULTS ---");
  console.table(results);
}

run();
