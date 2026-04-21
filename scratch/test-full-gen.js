const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");
const dotenv = require("dotenv");
const path = require("path");

// Load env
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const BIOLOGY_TEXT = `
The cell is the basic structural, functional, and biological unit of all known organisms. A cell is the smallest unit of life. Cells are often called the "building blocks of life". The study of cells is called cell biology, cellular biology, or cytology.

Cells consist of cytoplasm enclosed within a membrane, which contains many biomolecules such as proteins and nucleic acids. Most plant and animal cells are only visible under a light microscope, with dimensions between 1 and 100 micrometers. Electron microscopy gives a much higher resolution showing highly detailed cell structure. Organisms can be classified as unicellular (consisting of a single cell such as bacteria) or multicellular (including plants and animals). Most unicellular organisms are classed as microorganisms.

Discovery of cells:
The cell was discovered by Robert Hooke in 1665, who named the structures he saw in cork after the cells or small rooms in a monastery. Cell theory, first developed in 1839 by Matthias Jakob Schleiden and Theodor Schwann, states that all organisms are composed of one or more cells, that cells are the fundamental unit of structure and function in all living organisms, and that all cells come from pre-existing cells. Cells emerged on Earth at least 3.5 billion years ago.

Types of cells:
Cells are of two types: eukaryotic, which contain a nucleus, and prokaryotic, which do not. Prokaryotes are single-celled organisms, while eukaryotes can be either single-celled or multicellular.
Prokaryotic cells include bacteria and archaea, two of the three domains of life. Prokaryotic cells were the first form of life on Earth, characterized by having vital biological processes including cell signaling. They are simpler and smaller than eukaryotic cells, and lack a nucleus, and other membrane-bound organelles. The DNA of a prokaryotic cell consists of a single circular chromosome that is in direct contact with the cytoplasm.

Eukaryotic cells:
Plants, animals, fungi, slime molds, protozoa, and algae are all eukaryotic. These cells are about fifteen times wider than a typical prokaryote and can be as much as a thousand times greater in volume. The main distinguishing feature of eukaryotes as compared to prokaryotes is compartmentalization: the presence of membrane-bound organelles (compartments) in which specific activities take place. Most important among these is a cell nucleus, an organelle that houses the cell's DNA.
`;

const PROMPT = (text) => `
You are a master educator creating high-quality flashcards from study material.
Study material:
"""
${text}
"""

Task:
Generate 3-5 concise, high-value flashcards.
Focus on core concepts, definitions, and relationships.
Keep front and back text clear and brief.

Return ONLY a valid JSON array, no markdown, no preamble, no explanation:
[{"front": "...", "back": "..."}, ...]
`;

async function testGemini(modelId) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelId });
    const result = await model.generateContent(PROMPT(BIOLOGY_TEXT));
    return result.response.text();
  } catch (e) { throw e; }
}

async function testGroq(modelId) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const res = await groq.chat.completions.create({
      model: modelId,
      messages: [{ role: "user", content: PROMPT(BIOLOGY_TEXT) }],
      temperature: 0.3
    });
    return res.choices[0].message.content;
  } catch (e) { throw e; }
}

async function run() {
  const tiers = [
    { name: "Gemini T1", id: "gemini-3.1-flash-lite", fn: testGemini },
    { name: "Gemini T2", id: "gemma-4-31b-it", fn: testGemini },
    { name: "Groq T1", id: "qwen-3.6-35b-a3b", fn: testGroq },
    { name: "Groq T2", id: "llama-3.1-8b-instant", fn: testGroq }
  ];

  for (const t of tiers) {
    console.log(`\n=== Testing ${t.name} (${t.id}) ===`);
    try {
      const start = Date.now();
      const res = await t.fn(t.id);
      const elapsed = Date.now() - start;
      console.log(`⏱️ Time: ${elapsed}ms`);
      console.log(`📄 Response snippet: ${res.substring(0, 200)}...`);
      
      // Try parsing
      const jsonMatch = res.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
         const cards = JSON.parse(jsonMatch[0]);
         console.log(`✅ Success! Generated ${cards.length} cards.`);
      } else {
         console.log(`❌ Failed: No JSON array found in response.`);
      }
    } catch (e) {
      console.log(`❌ ERROR: ${e.message}`);
    }
  }
}

run();
