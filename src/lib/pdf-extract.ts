import PDFParser from "pdf2json";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      try {
        const text = pdfData.Pages
          .flatMap((page: any) => page.Texts)
          .map((textObj: any) => {
            try {
              return decodeURIComponent(textObj.R[0].T);
            } catch (e) {
              return textObj.R[0].T; // Fallback to raw text if decoding fails
            }
          })
          .join("\n")
          .replace(/\s+/g, " ")
          .trim();
        resolve(text);
      } catch (err) {
        reject(err);
      }
    });
    pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
    pdfParser.parseBuffer(buffer);
  });
}
