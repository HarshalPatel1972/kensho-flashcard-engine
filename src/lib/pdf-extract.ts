import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Required for serverless environment - disables workers to ensure stability in lambda
if (typeof window === "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "";
}

export interface PDFExtractionResult {
  totalPages: number;
  text: string;
  extractionMethod: "full" | "sampled" | "blocked";
  message?: string;
}

export async function extractPDFInfo(
  buffer: Buffer
): Promise<{ totalPages: number }> {
  const uint8Array = new Uint8Array(buffer);
  const pdf = await pdfjsLib.getDocument({ 
    data: uint8Array,
    isEvalSupported: false,
    useSystemFonts: true 
  }).promise;
  return { totalPages: pdf.numPages };
}

export async function extractTextFromPages(
  buffer: Buffer,
  pageNumbers: number[] // 1-indexed page numbers to extract
): Promise<PDFExtractionResult> {
  const uint8Array = new Uint8Array(buffer);
  const pdf = await pdfjsLib.getDocument({ 
    data: uint8Array,
    isEvalSupported: false,
    useSystemFonts: true 
  }).promise;
  const totalPages = pdf.numPages;

  // HARD BLOCK: more than 20 pages selected
  if (pageNumbers.length > 20) {
    return {
      totalPages,
      text: "",
      extractionMethod: "blocked",
      message: "Current AI models cannot reliably process more than 20 pages at once. Please select up to 20 pages or choose specific chapters."
    };
  }

  const pageTexts: string[] = [];

  for (const pageNum of pageNumbers) {
    if (pageNum < 1 || pageNum > totalPages) continue;

    try {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (pageNumbers.length <= 4) {
        // 1-4 pages: take full text of each page, no limit
        pageTexts.push(pageText);
      } else {
        // 5-20 pages: take first 1000 chars from each page
        // This provides significant context without hitting token limits
        const sampledText = pageText.slice(0, 1000).trim();
        if (sampledText.length > 20) {
          pageTexts.push(`[Page ${pageNum}]: ${sampledText}`);
        }
      }
    } catch (e) {
      console.error(`Error extracting page ${pageNum}:`, e);
      continue;
    }
  }

  const combinedText = pageTexts.join("\n\n").trim();
  const extractionMethod = pageNumbers.length <= 4 ? "full" : "sampled";

  return {
    totalPages,
    text: combinedText,
    extractionMethod
  };
}
