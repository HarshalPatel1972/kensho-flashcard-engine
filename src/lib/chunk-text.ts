export function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();

    if (chunk.length > 100) { // Skip tiny chunks
      chunks.push(chunk);
    }

    if (end === text.length) break;
    start = end - overlap; // Overlap for context continuity
  }

  return chunks;
}

// Batch chunks into groups to respect rate limits
export function batchChunks<T>(
  arr: T[],
  batchSize: number = 3
): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < arr.length; i += batchSize) {
    batches.push(arr.slice(i, i + batchSize));
  }
  return batches;
}
