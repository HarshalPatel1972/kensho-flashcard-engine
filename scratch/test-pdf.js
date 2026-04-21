const pdfjsLib = require("pdfjs-dist/build/pdf.js");

async function test() {
  console.log("pdfjsLib loaded:", !!pdfjsLib);
}

test().catch(console.error);
