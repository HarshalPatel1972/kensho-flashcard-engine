const { GoogleGenerativeAI } = require("@google/generative-ai");
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
`;

const PROMPT = `
You are a master educator creating high-quality flashcards from study material.
Study material:
"""
${BIOLOGY_TEXT}
"""

Task:
Generate 3-5 concise, high-value flashcards.
Focus on core concepts, definitions, and relationships.
Keep front and back text clear and brief.

Return ONLY a valid JSON array, no markdown, no preamble, no explanation:
[{"front": "...", "back": "..."}, ...]
`;

async function testGemmaOnly() {
  const modelId = "gemma-4-31b-it";
  console.log(`\n[Checking] ${modelId} with Biology sample...`);
  
  try {
    const start = Date.now();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelId });
    
    // Using a 45s timeout for this script just to be safe
    const result = await model.generateContent(PROMPT);
    const text = result.response.text();
    const elapsed = Date.now() - start;
    
    console.log(`⏱️ Time: ${(elapsed / 1000).toFixed(1)}s`);
    console.log(`📄 Response:\n${text}`);
    
    // Validate JSON
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const cards = JSON.parse(jsonMatch[0]);
      console.log(`\n✅ SUCCESS: Generated ${cards.length} valid cards.`);
    } else {
      console.log(`\n❌ FAILED: Response was not valid JSON.`);
    }
  } catch (e) {
    console.error(`\n❌ ERROR: ${e.message}`);
  }
}

testGemmaOnly();
