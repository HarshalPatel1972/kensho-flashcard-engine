import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

// Required for serverless environment
pdfjsLib.GlobalWorkerOptions.workerSrc = "";

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
  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
  return { totalPages: pdf.numPages };
}

export async function extractTextFromPages(
  buffer: Buffer,
  pageNumbers: number[] // 1-indexed page numbers to extract
): Promise<PDFExtractionResult> {
  const uint8Array = new Uint8Array(buffer);
  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
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
        // 5-20 pages: take only first 2 lines (~200 chars) from each page
        // This gives context from every section without overloading the model
        const twoLines = pageText.slice(0, 200).trim();
        if (twoLines.length > 20) {
          pageTexts.push(`[Page ${pageNum}]: ${twoLines}`);
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
